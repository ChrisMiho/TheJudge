import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ScanCameraSurfaceProps } from "../ScanCameraSurface";
import type { CardScanMap } from "../../lib/scan/resolveScanCandidates";
import type { Candidate, IdentifyResult } from "../../lib/scan/types";
import type { CardMetadataItem } from "../../types";
import {
  createCardPrices,
  loadCardPrices,
  type CardPrintingPriceArtifact
} from "../../lib/trade/loadCardPrices";
import { loadScanMap } from "../../lib/scan/loadScanMap";
import { TradeBalancer } from "./TradeBalancer";
import { SCAN_CAMERA_UNAVAILABLE_COPY } from "./useTradeScan";

// The 38 MB price artifact, the scan map, the hash DB, and the camera are all
// mocked: this suite makes no network call and opens no camera.
vi.mock("../../lib/trade/loadCardPrices", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/trade/loadCardPrices")>();
  return { ...actual, loadCardPrices: vi.fn() };
});

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
    capturedOptions.onScanCandidateSelected(lockedOracleCard, lockedOracleCard.imageUrl);
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

const artifact: CardPrintingPriceArtifact = {
  snapshotDate: "2026-06-05",
  printings: {
    "bolt-2ed": {
      id: "bolt-2ed",
      oracleId: "oracle-bolt",
      name: "Lightning Bolt",
      set: "2ed",
      setName: "Unlimited Edition",
      collectorNumber: "162",
      imageUrl: "https://example.test/bolt-2ed.jpg",
      usd: 10,
      usdFoil: null
    },
    "bolt-m10": {
      id: "bolt-m10",
      oracleId: "oracle-bolt",
      name: "Lightning Bolt",
      set: "m10",
      setName: "Magic 2010",
      collectorNumber: "146",
      imageUrl: "https://example.test/bolt-m10.jpg",
      usd: 4,
      usdFoil: 25
    },
    "lotus-lea": {
      id: "lotus-lea",
      oracleId: "oracle-lotus",
      name: "Black Lotus",
      set: "lea",
      setName: "Limited Edition Alpha",
      collectorNumber: "232",
      imageUrl: "https://example.test/lotus-lea.jpg",
      usd: 30,
      usdFoil: null
    }
  },
  byOracleId: {
    "oracle-bolt": ["bolt-2ed", "bolt-m10"],
    "oracle-lotus": ["lotus-lea"]
  }
};

/** `bolt-promo` is scannable but absent from the price artifact (fallback path). */
const scanMap: CardScanMap = {
  "bolt-2ed": { oracleId: "oracle-bolt", name: "Lightning Bolt", imageUrl: "s/bolt-2ed.jpg" },
  "bolt-m10": { oracleId: "oracle-bolt", name: "Lightning Bolt", imageUrl: "s/bolt-m10.jpg" },
  "bolt-promo": { oracleId: "oracle-bolt", name: "Lightning Bolt", imageUrl: "s/bolt-promo.jpg" },
  "lotus-lea": { oracleId: "oracle-lotus", name: "Black Lotus", imageUrl: "s/lotus-lea.jpg" }
};

const loadCardPricesMock = vi.mocked(loadCardPrices);
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

/** Drives one identify frame that locks on `oracleId` with the given candidates. */
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
}

describe("Frontend - Trade", () => {
  describe("TradeBalancer scan input", () => {
    beforeEach(() => {
      loadCardPricesMock.mockResolvedValue(createCardPrices(artifact));
      loadScanMapMock.mockResolvedValue(scanMap);
    });

    afterEach(() => {
      lockedOracleCard = null;
      frameCandidates = [];
      capturedOptions = null;
      vi.clearAllMocks();
    });

    it("adds an entry defaulting to the scanned printing, priced from the artifact", async () => {
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

    it("falls back to another printing when the scanned printing is not in the artifact", async () => {
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
      await user.click(within(side("A")).getByRole("button", { name: /Magic 2010/ }));

      expect(sideTotalText("A")).toBe("$4.00");
    });
  });
});
