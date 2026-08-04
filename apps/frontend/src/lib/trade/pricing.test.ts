import { describe, expect, it } from "vitest";

import type { CardPrintingPrice } from "./loadCardPrices";
import {
  difference,
  entryContribution,
  entryHasMissingPrice,
  entryUnitPrice,
  formatUsd,
  sideTotal,
  type TradeEntry
} from "./pricing";

function printing(overrides: Partial<CardPrintingPrice> = {}): CardPrintingPrice {
  return {
    id: "printing-bolt",
    oracleId: "oracle-bolt",
    name: "Lightning Bolt",
    set: "2ed",
    setName: "Unlimited Edition",
    collectorNumber: "162",
    imageUrl: "https://example.test/bolt.jpg",
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
});
