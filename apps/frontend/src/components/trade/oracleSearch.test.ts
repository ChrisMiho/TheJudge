import { describe, expect, it } from "vitest";

import {
  createCardPrices,
  type CardPrintingPriceArtifact
} from "../../lib/trade/loadCardPrices";
import { buildOracleSearchIndex, searchOracleIndex } from "./oracleSearch";

function printing(
  id: string,
  oracleId: string,
  name: string
): CardPrintingPriceArtifact["printings"][string] {
  return {
    id,
    oracleId,
    name,
    set: "tst",
    setName: "Test Set",
    collectorNumber: "1",
    imageUrl: `https://example.test/${id}.jpg`,
    usd: 1,
    usdFoil: 2
  };
}

const prices = createCardPrices({
  snapshotDate: "2026-06-05",
  printings: {
    "bolt-a": printing("bolt-a", "oracle-bolt", "Lightning Bolt"),
    "bolt-b": printing("bolt-b", "oracle-bolt", "Lightning Bolt"),
    "helix-a": printing("helix-a", "oracle-helix", "Lightning Helix"),
    "lotus-a": printing("lotus-a", "oracle-lotus", "Black Lotus"),
    "ghost-a": printing("ghost-a", "oracle-ghost", "Ghost Card")
  },
  byOracleId: {
    "oracle-bolt": ["bolt-a", "bolt-b"],
    "oracle-helix": ["helix-a"],
    "oracle-lotus": ["lotus-a"],
    "oracle-missing": ["not-in-artifact"]
  }
});

const index = buildOracleSearchIndex(prices);

describe("Frontend - Trade", () => {
  describe("buildOracleSearchIndex", () => {
    it("collapses printings into one row per oracle card with a printing count", () => {
      expect(index.map((entry) => entry.oracleId).sort()).toEqual([
        "oracle-bolt",
        "oracle-helix",
        "oracle-lotus"
      ]);
      expect(index.find((entry) => entry.oracleId === "oracle-bolt")).toMatchObject({
        name: "Lightning Bolt",
        printingCount: 2
      });
    });
  });

  describe("searchOracleIndex", () => {
    it("ignores queries shorter than three characters", () => {
      expect(searchOracleIndex(index, "li")).toEqual([]);
    });

    it("ranks exact and prefix matches ahead of other matches", () => {
      expect(searchOracleIndex(index, "lightning").map((entry) => entry.name)).toEqual([
        "Lightning Bolt",
        "Lightning Helix"
      ]);
      expect(searchOracleIndex(index, "Black Lotus").map((entry) => entry.name)).toEqual([
        "Black Lotus"
      ]);
    });

    it("tolerates small typos", () => {
      expect(searchOracleIndex(index, "black lotis").map((entry) => entry.name)).toEqual([
        "Black Lotus"
      ]);
    });

    it("returns nothing when no card matches", () => {
      expect(searchOracleIndex(index, "island sanctuary")).toEqual([]);
    });

    it("respects the result limit", () => {
      expect(searchOracleIndex(index, "lightning", 1)).toHaveLength(1);
    });
  });
});
