import { describe, expect, it } from "vitest";

import type { CardPrintingPrice } from "./fetchCardPrintings";
import {
  defaultFoilForPrinting,
  difference,
  entryContribution,
  entryHasMissingPrice,
  entryUnitPrice,
  formatUsd,
  sideTotal,
  type TradeEntry
} from "./pricing";

// REQ-066/REQ-175 (Slice A/B): the backend price route no longer carries
// oracleId/name/imageUrl per printing (the caller already knows the oracle
// id; name comes from cardMetadata; image derives from `id`) — the fixture
// below carries only the fields pricing.ts's functions actually read.
function printing(overrides: Partial<CardPrintingPrice> = {}): CardPrintingPrice {
  return {
    id: "printing-bolt",
    set: "2ed",
    setName: "Unlimited Edition",
    collectorNumber: "162",
    usd: 3.5,
    usdFoil: 12.75,
    ...overrides
  };
}

function entry(overrides: Partial<TradeEntry> = {}): TradeEntry {
  return {
    instanceId: "entry-1",
    printing: printing(),
    foil: false,
    quantity: 1,
    ...overrides
  };
}

describe("Frontend - Trade", () => {
  describe("entryUnitPrice", () => {
    it("selects the non-foil price by default and the foil price when foil", () => {
      expect(entryUnitPrice(entry())).toBe(3.5);
      expect(entryUnitPrice(entry({ foil: true }))).toBe(12.75);
    });

    it("returns null when the selected mode has no price", () => {
      expect(entryUnitPrice(entry({ printing: printing({ usd: null }) }))).toBeNull();
      expect(
        entryUnitPrice(entry({ foil: true, printing: printing({ usdFoil: null }) }))
      ).toBeNull();
    });
  });

  describe("entryHasMissingPrice", () => {
    it("flags only the selected mode", () => {
      const foilless = printing({ usdFoil: null });

      expect(entryHasMissingPrice(entry({ printing: foilless }))).toBe(false);
      expect(entryHasMissingPrice(entry({ printing: foilless, foil: true }))).toBe(true);
    });
  });

  describe("entryContribution", () => {
    it("multiplies the selected-mode price by quantity", () => {
      expect(entryContribution(entry({ quantity: 3 }))).toBe(10.5);
      expect(entryContribution(entry({ foil: true, quantity: 2 }))).toBe(25.5);
    });

    it("contributes $0 when the selected-mode price is missing", () => {
      const missing = entry({ foil: true, quantity: 4, printing: printing({ usdFoil: null }) });

      expect(entryContribution(missing)).toBe(0);
      expect(entryHasMissingPrice(missing)).toBe(true);
    });
  });

  describe("sideTotal", () => {
    it("sums Σ qty × (foil ? usdFoil : usd)", () => {
      const total = sideTotal([
        entry({ instanceId: "a", quantity: 2 }),
        entry({ instanceId: "b", foil: true, quantity: 1 }),
        entry({
          instanceId: "c",
          quantity: 5,
          printing: printing({ id: "printing-lotus", usd: 1.1, usdFoil: null })
        })
      ]);

      expect(total).toBe(7 + 12.75 + 5.5);
    });

    it("is 0 for an empty side and skips missing prices", () => {
      expect(sideTotal([])).toBe(0);
      expect(
        sideTotal([entry({ foil: true, quantity: 9, printing: printing({ usdFoil: null }) })])
      ).toBe(0);
    });
  });

  describe("difference", () => {
    it("returns the absolute amount and the higher side", () => {
      expect(difference(30, 12.5)).toEqual({ amount: 17.5, higher: "A" });
      expect(difference(12.5, 30)).toEqual({ amount: 17.5, higher: "B" });
    });

    it("returns 'equal' on a tie", () => {
      expect(difference(0, 0)).toEqual({ amount: 0, higher: "equal" });
      expect(difference(21.25, 21.25)).toEqual({ amount: 0, higher: "equal" });
    });
  });

  describe("formatUsd", () => {
    it("renders two-decimal USD", () => {
      expect(formatUsd(0)).toBe("$0.00");
      expect(formatUsd(17.5)).toBe("$17.50");
    });
  });

  // B1/B2/B3: REQ-065's owner-edited foil rule — re-derived from the new
  // printing's own prices every time, never carrying the entry's current mode.
  describe("defaultFoilForPrinting", () => {
    it("B1: returns false (non-foil) when usd is present, regardless of usdFoil", () => {
      expect(defaultFoilForPrinting(printing({ usd: 3.5, usdFoil: 12.75 }))).toBe(false);
      expect(defaultFoilForPrinting(printing({ usd: 3.5, usdFoil: null }))).toBe(false);
    });

    it("B2: returns true (foil) only when usd is null and usdFoil is present", () => {
      expect(defaultFoilForPrinting(printing({ usd: null, usdFoil: 12.75 }))).toBe(true);
    });

    it("B3: returns false when neither usd nor usdFoil is present", () => {
      expect(defaultFoilForPrinting(printing({ usd: null, usdFoil: null }))).toBe(false);
    });
  });
});
