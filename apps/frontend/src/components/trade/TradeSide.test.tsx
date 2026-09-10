// Slice C: pick the printing before the card is added (search path). Tapping
// a suggestion fetches that card's printings and swaps the suggestion list
// for the picker; picking a printing (or falling back on a failed/empty
// fetch) is the seam TradeBalancer's own tests exercise end-to-end. These
// tests isolate TradeSide's own contract: what it shows, and what it calls
// `onAddByOracle` with.

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearCardPrintingsCache, type CardPrintingPrice } from "../../lib/trade/fetchCardPrintings";
import type { CardMetadataItem } from "../../types";
import { buildOracleSearchIndex } from "./oracleSearch";
import { TradeSide, type TradeSideProps } from "./TradeSide";
import type { TradeScan } from "./useTradeScan";

const cardMetadata: CardMetadataItem[] = [
  { cardId: "oracle-bolt", name: "Lightning Bolt", imageId: "bolt-img", colors: ["R"] }
];

const boltPrintings: CardPrintingPrice[] = [
  { id: "bolt-2ed", set: "2ed", setName: "Unlimited Edition", collectorNumber: "162", usd: 10, usdFoil: null },
  { id: "bolt-m10", set: "m10", setName: "Magic 2010", collectorNumber: "146", usd: 4, usdFoil: 25 }
];

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => payload
  } as unknown as Response;
}

// TradeSide only reads `activeSideId` off `scan` in these tests (scan surface
// stays closed throughout) — the rest of the camera-capture contract is
// exercised by TradeBalancer.scan.test.tsx, untouched by this slice (A11).
const scanStub = {
  activeSideId: null,
  isLoading: false,
  error: null,
  notice: null,
  openScan: vi.fn(),
  closeScan: vi.fn(),
  identify: vi.fn(),
  setCameraStatus: vi.fn(),
  recordAcquisitionDiagnostic: vi.fn(),
  convergence: null,
  addConfirmation: null,
  scanDebug: null
} as unknown as TradeScan;

function renderSide(overrides: Partial<TradeSideProps> = {}): { onAddByOracle: ReturnType<typeof vi.fn> } {
  const onAddByOracle = vi.fn();
  const searchIndex = buildOracleSearchIndex(cardMetadata);
  render(
    <TradeSide
      sideId="A"
      entries={[]}
      cardMetadata={cardMetadata}
      searchIndex={searchIndex}
      isMetadataLoading={false}
      isSearchDisabled={false}
      entryMetaById={{}}
      scan={scanStub}
      onAddByOracle={onAddByOracle}
      onToggleFoil={vi.fn()}
      onQuantityChange={vi.fn()}
      onRemove={vi.fn()}
      onChangePrinting={vi.fn()}
      onRetryPricing={vi.fn()}
      {...overrides}
    />
  );
  return { onAddByOracle };
}

async function searchAndTapSuggestion(
  user: ReturnType<typeof userEvent.setup>,
  query: string,
  suggestionName: string
): Promise<void> {
  const search = screen.getByLabelText("Side A card search");
  await user.type(search, query);
  await user.click(screen.getByRole("button", { name: suggestionName }));
}

describe("Frontend - Trade", () => {
  describe("TradeSide — pick before add (Slice C)", () => {
    beforeEach(() => {
      clearCardPrintingsCache();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.clearAllMocks();
    });

    it("C1: tapping a suggestion shows a loading state, then the printing picker in place of the suggestion list", async () => {
      let resolveFetch: (value: Response) => void = () => undefined;
      vi.stubGlobal(
        "fetch",
        vi.fn(
          () =>
            new Promise<Response>((resolve) => {
              resolveFetch = resolve;
            })
        )
      );
      const user = userEvent.setup();
      renderSide();

      await searchAndTapSuggestion(user, "Light", "Lightning Bolt");

      expect(screen.getByText("Loading printings…")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Lightning Bolt" })).not.toBeInTheDocument();

      resolveFetch(
        jsonResponse({ oracleId: "oracle-bolt", snapshotDate: "2026-09-09", printings: boltPrintings })
      );

      await waitFor(() => {
        expect(
          screen.getByRole("group", { name: "Choose a printing for Lightning Bolt" })
        ).toBeInTheDocument();
      });
      expect(screen.queryByText("Loading printings…")).not.toBeInTheDocument();
    });

    it("C2: tapping a printing row adds the card carrying that exact printing, not printings[0]", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            jsonResponse({ oracleId: "oracle-bolt", snapshotDate: "2026-09-09", printings: boltPrintings })
          )
        )
      );
      const user = userEvent.setup();
      const { onAddByOracle } = renderSide();

      await searchAndTapSuggestion(user, "Light", "Lightning Bolt");
      const pickerElement = await screen.findByRole("group", {
        name: "Choose a printing for Lightning Bolt"
      });
      await user.click(within(pickerElement).getByRole("button", { name: /Magic 2010/ }));

      expect(onAddByOracle).toHaveBeenCalledWith("A", "oracle-bolt", "Lightning Bolt", "bolt-m10");
    });

    it("C3: Cancel returns to the search box with the query text intact and no card added", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            jsonResponse({ oracleId: "oracle-bolt", snapshotDate: "2026-09-09", printings: boltPrintings })
          )
        )
      );
      const user = userEvent.setup();
      const { onAddByOracle } = renderSide();

      await searchAndTapSuggestion(user, "Light", "Lightning Bolt");
      const pickerElement = await screen.findByRole("group", {
        name: "Choose a printing for Lightning Bolt"
      });
      await user.click(within(pickerElement).getByRole("button", { name: "Cancel" }));

      expect(
        screen.queryByRole("group", { name: "Choose a printing for Lightning Bolt" })
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText("Side A card search")).toHaveValue("Light");
      expect(onAddByOracle).not.toHaveBeenCalled();
    });

    it("C4: a failed pre-add printings fetch adds the card anyway, with no preferred printing", async () => {
      vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("network down"))));
      const user = userEvent.setup();
      const { onAddByOracle } = renderSide();

      await searchAndTapSuggestion(user, "Light", "Lightning Bolt");

      await waitFor(() => {
        expect(onAddByOracle).toHaveBeenCalledWith("A", "oracle-bolt", "Lightning Bolt");
      });
      expect(
        screen.queryByRole("group", { name: "Choose a printing for Lightning Bolt" })
      ).not.toBeInTheDocument();
    });

    it("C4: an empty pre-add printings fetch (zero printings) adds the card anyway", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(jsonResponse({ oracleId: "oracle-bolt", snapshotDate: "2026-09-09", printings: [] }))
        )
      );
      const user = userEvent.setup();
      const { onAddByOracle } = renderSide();

      await searchAndTapSuggestion(user, "Light", "Lightning Bolt");

      await waitFor(() => {
        expect(onAddByOracle).toHaveBeenCalledWith("A", "oracle-bolt", "Lightning Bolt");
      });
    });
  });
});
