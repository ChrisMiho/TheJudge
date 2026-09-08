import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ScanCameraSurfaceProps } from "../ScanCameraSurface";
import type { CardScanMap } from "../../lib/scan/resolveScanCandidates";
import type { Candidate, IdentifyResult } from "../../lib/scan/types";
import type { CardMetadataItem } from "../../types";
import { clearCardPrintingsCache, type CardPrintingPrice } from "../../lib/trade/fetchCardPrintings";
import { loadScanMap } from "../../lib/scan/loadScanMap";
import { TradeBalancer } from "./TradeBalancer";
import { SCAN_CAMERA_UNAVAILABLE_COPY } from "./useTradeScan";

// The card list, the scan map, the hash DB, and the camera are all mocked:
// this suite makes no network call and opens no camera. Card prices are
// mocked at the fetch layer, one oracle id at a time (FLOW-025).
vi.mock("../../lib/scan/loadScanMap", () => ({ loadScanMap: vi.fn() }));

/**
 * Fake capture hook standing in for the real stabilizer/identifier pipeline. It
 * preserves the contract the trade wiring depends on: `onScanCandidateSelected`
 * fires synchronously inside `identify`, before the ranked printing candidates
 * are returned to the caller.
 */
type ScanCaptureOptions = {
  cardMetadata: CardMetadataItem[];
  onScanCandidateSelected: (card: CardMetadataItem, scanImageUrl: string) => unknown;
};

let lockedOracleCard: CardMetadataItem | null = null;
let frameCandidates: Candidate[] = [];
let capturedOptions: ScanCaptureOptions | null = null;

const captureIdentify = vi.fn(async (): Promise<IdentifyResult> => {
  if (lockedOracleCard && capturedOptions) {
    capturedOptions.onScanCandidateSelected(lockedOracleCard, "");
  }
  return { matched: Boolean(lockedOracleCard), was_rotated: false, candidates: frameCandidates };
});
const captureOpenScan = vi.fn(async () => undefined);
const captureCloseScan = vi.fn();
const captureSetCameraStatus = vi.fn();

vi.mock("../../hooks/useScanCapture", () => ({
  useScanCapture: (options: ScanCaptureOptions) => {
    capturedOptions = options;
    return {
      isOpen: true,
      isLoading: false,
      error: null,
      convergence: undefined,
      addConfirmation: null,
      scanDebug: null,
      openScan: captureOpenScan,
      closeScan: captureCloseScan,
      identify: captureIdentify,
      setCameraStatus: captureSetCameraStatus,
      recordAcquisitionDiagnostic: vi.fn()
    };
  }
}));

vi.mock("../ScanCameraSurface", () => ({
  ScanCameraSurface: ({ identify, onStatusChange }: ScanCameraSurfaceProps) => (
    <div>
      <button
        type="button"
        onClick={() =>
          void identify?.({ width: 1, height: 1, data: new Uint8Array([0, 0, 0]) })
        }
      >
        Test scan frame
      </button>
      <button type="button" onClick={() => onStatusChange?.("camera-error")}>
        Test camera error
      </button>
    </div>
  )
}));

const cardMetadata: CardMetadataItem[] = [
  { cardId: "oracle-bolt", name: "Lightning Bolt", imageId: "bolt-2ed", colors: ["R"] },
  { cardId: "oracle-lotus", name: "Black Lotus", imageId: "lotus-lea", colors: [] }
];

// Printing order matters: with no scanned-printing match, the balancer
// defaults to the first printing the backend returns (FLOW-025).
const pricesByOracle: Record<string, { snapshotDate: string; printings: CardPrintingPrice[] }> = {
  "oracle-bolt": {
    snapshotDate: "2026-06-05",
    printings: [
      { id: "bolt-2ed", set: "2ed", setName: "Unlimited Edition", collectorNumber: "162", usd: 10, usdFoil: null },
      { id: "bolt-m10", set: "m10", setName: "Magic 2010", collectorNumber: "146", usd: 4, usdFoil: 25 }
    ]
  },
  "oracle-lotus": {
    snapshotDate: "2026-06-05",
    printings: [
      { id: "lotus-lea", set: "lea", setName: "Limited Edition Alpha", collectorNumber: "232", usd: 30, usdFoil: null }
    ]
  }
};

/** `bolt-promo` is a scannable printing id absent from the price fixture (fallback path). */
const scanMap: CardScanMap = {
  "bolt-2ed": { oracleId: "oracle-bolt", name: "Lightning Bolt", imageUrl: "s/bolt-2ed.jpg" },
  "bolt-m10": { oracleId: "oracle-bolt", name: "Lightning Bolt", imageUrl: "s/bolt-m10.jpg" },
  "bolt-promo": { oracleId: "oracle-bolt", name: "Lightning Bolt", imageUrl: "s/bolt-promo.jpg" },
  "lotus-lea": { oracleId: "oracle-lotus", name: "Black Lotus", imageUrl: "s/lotus-lea.jpg" }
};

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => payload
  } as unknown as Response;
}

function makeFetchMock(): ReturnType<typeof vi.fn> {
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/data/cardMetadata.json")) {
      return Promise.resolve(jsonResponse(cardMetadata));
    }
    const match = url.match(/\/api\/cards\/([^/]+)\/prices$/);
    if (match) {
      const oracleId = decodeURIComponent(match[1]);
      const entry = pricesByOracle[oracleId];
      if (!entry) return Promise.resolve(jsonResponse({ error: "card_not_found" }, 404));
      return Promise.resolve(jsonResponse({ oracleId, ...entry }));
    }
    return Promise.reject(new Error(`Unhandled fetch in test: ${url}`));
  });
}

const loadScanMapMock = vi.mocked(loadScanMap);

function side(sideId: "A" | "B"): HTMLElement {
  return screen.getByRole("region", { name: `Side ${sideId}` });
}

function sideTotalText(sideId: "A" | "B"): string {
  return within(side(sideId)).getByLabelText(`Side ${sideId} total`).textContent ?? "";
}

async function renderBalancer(): Promise<void> {
  render(<TradeBalancer />);
  await waitFor(() => {
    expect(screen.getByLabelText("Side A card search")).not.toBeDisabled();
  });
}

/** Opens the side's scan surface and waits for the scan map to be in hand. */
async function openScan(
  user: ReturnType<typeof userEvent.setup>,
  sideId: "A" | "B"
): Promise<void> {
  await user.click(within(side(sideId)).getByLabelText(`Scan a card onto Side ${sideId}`));
  await waitFor(() => {
    expect(within(side(sideId)).getByRole("button", { name: "Test scan frame" })).toBeInTheDocument();
  });
  await waitFor(() => {
    expect(loadScanMapMock).toHaveBeenCalled();
  });
}

/** Drives one identify frame that locks on `oracleId` with the given candidates,
 * then waits for that entry's price fetch to resolve (FLOW-025). */
async function scanFrame(
  user: ReturnType<typeof userEvent.setup>,
  sideId: "A" | "B",
  oracleCardId: string,
  cardName: string,
  candidates: Candidate[]
): Promise<void> {
  lockedOracleCard =
    capturedOptions?.cardMetadata.find((card) => card.cardId === oracleCardId) ?? null;
  expect(lockedOracleCard?.name).toBe(cardName);
  frameCandidates = candidates;
  await user.click(within(side(sideId)).getByRole("button", { name: "Test scan frame" }));
  lockedOracleCard = null;
  frameCandidates = [];
  await waitFor(() => {
    expect(within(side(sideId)).queryByText("Loading price…")).not.toBeInTheDocument();
  });
}

describe("Frontend - Trade", () => {
  describe("TradeBalancer scan input", () => {
    beforeEach(() => {
      clearCardPrintingsCache();
      vi.stubGlobal("fetch", makeFetchMock());
      loadScanMapMock.mockResolvedValue(scanMap);
    });

    afterEach(() => {
      lockedOracleCard = null;
      frameCandidates = [];
      capturedOptions = null;
      vi.unstubAllGlobals();
      vi.clearAllMocks();
    });

    it("adds an entry defaulting to the scanned printing, priced from the fetched list", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await openScan(user, "A");
      await scanFrame(user, "A", "oracle-bolt", "Lightning Bolt", [
        { card_id: "bolt-m10", distance: 12 },
        { card_id: "bolt-2ed", distance: 40 }
      ]);

      const entry = within(side("A")).getByRole("listitem");
      expect(entry).toHaveTextContent("Magic 2010 (M10) #146");
      expect(sideTotalText("A")).toBe("$4.00");
      expect(screen.getByLabelText("Trade difference")).toHaveTextContent(
        "Side A is ahead by $4.00"
      );
    });

    it("supports foil, quantity, remove and duplicates on a scanned entry", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await openScan(user, "A");
      await scanFrame(user, "A", "oracle-bolt", "Lightning Bolt", [
        { card_id: "bolt-m10", distance: 12 }
      ]);
      await scanFrame(user, "A", "oracle-bolt", "Lightning Bolt", [
        { card_id: "bolt-m10", distance: 9 }
      ]);

      // Duplicates are allowed: no stack duplicate-block, no 10-card cap.
      expect(
        within(side("A")).getAllByRole("button", { name: /^Remove Lightning Bolt/ })
      ).toHaveLength(2);
      expect(sideTotalText("A")).toBe("$8.00");

      await user.click(within(side("A")).getByRole("button", { name: "Exit scan" }));

      const [firstFoil] = within(side("A")).getAllByLabelText(
        "Toggle foil for Lightning Bolt (Side A)"
      );
      await user.click(firstFoil);
      expect(sideTotalText("A")).toBe("$29.00");

      const [firstIncrease] = within(side("A")).getAllByLabelText(
        "Increase quantity for Lightning Bolt (Side A)"
      );
      await user.click(firstIncrease);
      expect(sideTotalText("A")).toBe("$54.00");

      const [firstRemove] = within(side("A")).getAllByLabelText(
        "Remove Lightning Bolt (Side A)"
      );
      await user.click(firstRemove);
      expect(sideTotalText("A")).toBe("$4.00");
    });

    it("re-prices a scanned entry when its printing is changed", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await openScan(user, "B");
      await scanFrame(user, "B", "oracle-bolt", "Lightning Bolt", [
        { card_id: "bolt-m10", distance: 12 }
      ]);
      expect(sideTotalText("B")).toBe("$4.00");

      await user.click(within(side("B")).getByRole("button", { name: "Exit scan" }));
      await user.click(
        within(side("B")).getByLabelText("Change printing for Lightning Bolt (Side B)")
      );
      await user.click(within(side("B")).getByRole("button", { name: /Unlimited Edition/ }));

      expect(sideTotalText("B")).toBe("$10.00");
    });

    it("falls back to another printing when the scanned printing is not in the fetched list", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await openScan(user, "A");
      await scanFrame(user, "A", "oracle-bolt", "Lightning Bolt", [
        { card_id: "bolt-promo", distance: 8 },
        { card_id: "bolt-m10", distance: 30 }
      ]);

      const entry = within(side("A")).getByRole("listitem");
      expect(entry).toHaveTextContent("Unlimited Edition (2ED) #162");
      expect(sideTotalText("A")).toBe("$10.00");
    });

    it("keeps manual search working and surfaces the reason when the camera is unavailable", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await user.click(within(side("A")).getByLabelText("Scan a card onto Side A"));
      await user.click(within(side("A")).getByRole("button", { name: "Test camera error" }));

      expect(within(side("A")).getByRole("status")).toHaveTextContent(
        SCAN_CAMERA_UNAVAILABLE_COPY
      );
      expect(
        within(side("A")).queryByRole("button", { name: "Test scan frame" })
      ).not.toBeInTheDocument();

      const search = within(side("A")).getByLabelText("Side A card search");
      expect(search).not.toBeDisabled();
      await user.type(search, "Light");
      await user.click(within(side("A")).getByRole("button", { name: /^Lightning Bolt/ }));
      await waitFor(() => {
        expect(within(side("A")).queryByText("Loading price…")).not.toBeInTheDocument();
      });

      expect(sideTotalText("A")).toBe("$10.00");
    });
  });
});
