import { describe, expect, it } from "vitest";
import { transformRulings } from "../../../../scripts/build-card-rulings.mjs";

type TransformResult = {
  rulingsByOracleId: Record<string, { publishedAt: string; comment: string }[]>;
  stats: {
    parsedCount: number;
    wotcCount: number;
    cardsWithRulings: number;
    skippedWithoutMetadata: number;
    skippedWithoutComment: number;
  };
};

describe("card rulings transform policy", () => {
  it("keeps only WotC rulings for metadata cards and sorts newest first", () => {
    const metadataCards = [{ cardId: "oracle-bolt" }, { cardId: "oracle-opt" }];
    const sourceRulings = [
      {
        oracle_id: "oracle-bolt",
        source: "wotc",
        published_at: "2009-10-01",
        comment: "Older ruling."
      },
      {
        oracle_id: "oracle-bolt",
        source: "scryfall",
        published_at: "2024-01-01",
        comment: "Out-of-scope note."
      },
      {
        oracle_id: "oracle-bolt",
        source: "wotc",
        published_at: "2020-04-17",
        comment: "  Newer   ruling with\nextra whitespace. "
      },
      {
        oracle_id: "oracle-missing",
        source: "wotc",
        published_at: "2023-01-01",
        comment: "Not in metadata."
      },
      {
        oracle_id: "oracle-opt",
        source: "wotc",
        published_at: "2019-01-25",
        comment: "   "
      }
    ];

    const result = transformRulings(sourceRulings, metadataCards) as TransformResult;

    expect(result.stats).toEqual({
      parsedCount: 5,
      wotcCount: 4,
      cardsWithRulings: 1,
      skippedWithoutMetadata: 1,
      skippedWithoutComment: 1
    });
    expect(result.rulingsByOracleId).toEqual({
      "oracle-bolt": [
        { publishedAt: "2020-04-17", comment: "Newer ruling with extra whitespace." },
        { publishedAt: "2009-10-01", comment: "Older ruling." }
      ]
    });
  });
});
