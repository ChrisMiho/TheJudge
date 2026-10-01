import { describe, expect, it } from "vitest";

import type { CardPrintingPrice } from "./fetchCardPrintings";
import {
  defaultFoilForPrinting,
  difference,
  entryContribution,
  entryHasMissingPrice,
  entryUnitPrice,
  formatTradeDifference,
  formatTradeVerdict,
  formatUsd,
  normalizeSideName,
  pileTier,
  sideTotal,
  tradeVerdict,
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

  // REQ-215: five relative tiers, the richer side always 5.
  describe("pileTier", () => {
    it("is 1 when both sides are empty", () => {
      expect(pileTier(0, 0)).toBe(1);
    });

    it("gives the richer (or tied) side tier 5", () => {
      expect(pileTier(100, 50)).toBe(5);
      expect(pileTier(50, 50)).toBe(5);
      expect(pileTier(10, 0)).toBe(5);
    });

    it("tiers the lighter side by its share of the richer", () => {
      expect(pileTier(96, 100)).toBe(5); // 95%+
      expect(pileTier(80, 100)).toBe(4); // 75%+
      expect(pileTier(60, 100)).toBe(3); // 50%+
      expect(pileTier(30, 100)).toBe(2); // 25%+
      expect(pileTier(10, 100)).toBe(1); // under 25%
      expect(pileTier(0, 100)).toBe(1);
    });
  });

  // REQ-215/REQ-064: verdict bands differ from the tier bands (95/85/60, not
  // 95/75/50/25) — a coarser read than the five pile tiers.
  describe("tradeVerdict / formatTradeVerdict", () => {
    const sideName = (side: "A" | "B") => (side === "A" ? "Side A" : "Side B");

    it("is Even only when the totals tie to the cent", () => {
      expect(tradeVerdict(21.25, 21.25)).toEqual({ kind: "even" });
      expect(formatTradeVerdict(tradeVerdict(0, 0), sideName)).toBe("Even");
    });

    it("is Fair trade at 95%+ share", () => {
      expect(formatTradeVerdict(tradeVerdict(96, 100), sideName)).toBe("Fair trade");
    });

    it("Slightly favors at 85-95% share", () => {
      expect(formatTradeVerdict(tradeVerdict(88, 100), sideName)).toBe("Slightly favors Side B");
    });

    it("Leans toward at 60-85% share", () => {
      expect(formatTradeVerdict(tradeVerdict(70, 100), sideName)).toBe("Leans toward Side B");
    });

    it("Lopsided under 60% share, with the rounded percent behind", () => {
      expect(formatTradeVerdict(tradeVerdict(50, 100), sideName)).toBe("Lopsided — Side B by 50%");
      expect(formatTradeVerdict(tradeVerdict(0, 100), sideName)).toBe("Lopsided — Side B by 100%");
    });

    it("names whichever side is actually ahead", () => {
      expect(formatTradeVerdict(tradeVerdict(100, 50), sideName)).toBe("Lopsided — Side A by 50%");
    });
  });

  describe("formatTradeDifference", () => {
    const sideName = (side: "A" | "B") => (side === "A" ? "Side A" : "Side B");

    it("names the ahead side with a + amount", () => {
      expect(formatTradeDifference(21.25, 19.4, sideName)).toBe("Side A +$1.85");
      expect(formatTradeDifference(19.4, 21.25, sideName)).toBe("Side B +$1.85");
    });

    it("reads as even on a tie", () => {
      expect(formatTradeDifference(0, 0, sideName)).toBe("Side A and Side B are even");
    });
  });

  describe("normalizeSideName", () => {
    it("trims to 20 characters", () => {
      expect(normalizeSideName("A", "x".repeat(30))).toBe("x".repeat(20));
    });

    it("restores the default when blank", () => {
      expect(normalizeSideName("A", "   ")).toBe("Side A");
      expect(normalizeSideName("B", "")).toBe("Side B");
    });

    it("keeps a trimmed custom name", () => {
      expect(normalizeSideName("A", "  Alex  ")).toBe("Alex");
    });
  });
});
