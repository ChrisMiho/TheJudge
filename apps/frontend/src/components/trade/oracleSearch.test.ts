import { describe, expect, it } from "vitest";

import type { CardMetadataItem } from "../../types";
import { buildOracleSearchIndex, searchOracleIndex } from "./oracleSearch";

function card(cardId: string, name: string): CardMetadataItem {
  return { cardId, name, imageId: `${cardId}-img`, colors: [] };
}

const cardMetadata: CardMetadataItem[] = [
  card("oracle-bolt", "Lightning Bolt"),
  card("oracle-helix", "Lightning Helix"),
  card("oracle-lotus", "Black Lotus"),
  card("oracle-ghost", "Ghost Card")
];

const index = buildOracleSearchIndex(cardMetadata);

describe("Frontend - Trade", () => {
  describe("buildOracleSearchIndex", () => {
    it("builds one searchable row per card in cardMetadata, no price data needed", () => {
      expect(index.map((entry) => entry.oracleId).sort()).toEqual([
        "oracle-bolt",
        "oracle-ghost",
        "oracle-helix",
        "oracle-lotus"
      ]);
      expect(index.find((entry) => entry.oracleId === "oracle-bolt")).toMatchObject({
        name: "Lightning Bolt",
        normalizedName: "lightning bolt"
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
