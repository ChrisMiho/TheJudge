import { describe, expect, it } from "vitest";
import { transformRulings } from "../../../../scripts/build-card-rulings.mjs";

type RulingTransformResult = {
  rulingsByOracleId: Record<string, { publishedAt: string; comment: string }[]>;
  stats: {
    parsedCount: number;
    wotcCount: number;
    skippedMissingOracleId: number;
    skippedMissingComment: number;
    skippedOutsideMetadata: number;
    cardsWithRulings: number;
  };
};

describe("Frontend - Shared", () => {
describe("card rulings transform policy", () => {
  it("keeps WotC rulings for metadata card IDs with normalized comments newest first", () => {
    const metadataCardIds = new Set(["oracle-bolt", "oracle-opt"]);
    const sourceRulings = [
      {
        oracle_id: "oracle-bolt",
        source: "wotc",
        published_at: "2009-10-01",
        comment: "  Lightning Bolt deals 3 damage to any target.  "
      },
      {
        oracle_id: "oracle-bolt",
        source: "wotc",
        published_at: "2020-04-17",
        comment: "A newer ruling\nfor the same card."
      },
      {
        oracle_id: "oracle-bolt",
        source: "scryfall",
        published_at: "2024-01-01",
        comment: "Out of scope."
      },
      {
        oracle_id: "oracle-outside-metadata",
        source: "wotc",
        published_at: "2022-01-01",
        comment: "The user cannot select this card."
      },
      {
        oracle_id: "oracle-opt",
        source: "wotc",
        published_at: "2017-09-29",
        comment: "   "
      },
      {
        oracle_id: "",
        source: "wotc",
        published_at: "2010-01-01",
        comment: "Missing oracle id."
      }
    ];

    const result = transformRulings(sourceRulings, metadataCardIds) as RulingTransformResult;

    expect(result.stats).toEqual({
      parsedCount: 6,
      wotcCount: 5,
      skippedMissingOracleId: 1,
      skippedMissingComment: 1,
      skippedOutsideMetadata: 1,
      cardsWithRulings: 1
    });
    expect(result.rulingsByOracleId).toEqual({
      "oracle-bolt": [
        {
          publishedAt: "2020-04-17",
          comment: "A newer ruling for the same card."
        },
        {
          publishedAt: "2009-10-01",
          comment: "Lightning Bolt deals 3 damage to any target."
        }
      ]
    });
  });
});
});
