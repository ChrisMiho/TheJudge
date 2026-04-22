import { describe, expect, it } from "vitest";
import type { StackItem } from "../types";
import { getSuggestions, isFuzzyMatch, levenshteinDistance } from "./search";

const sampleCards: StackItem[] = [
  { cardId: "1", name: "Lightning Bolt", oracleText: "Deal 3 damage.", imageUrl: "" },
  { cardId: "2", name: "Counterspell", oracleText: "Counter target spell.", imageUrl: "" },
  { cardId: "3", name: "Brainstorm", oracleText: "Draw three cards.", imageUrl: "" }
];

describe("search helpers", () => {
  it("calculates Levenshtein distance correctly", () => {
    expect(levenshteinDistance("bolt", "bolts")).toBe(1);
    expect(levenshteinDistance("counter", "counter")).toBe(0);
  });

  it("matches fuzzy names with small typos", () => {
    expect(isFuzzyMatch("Lightning Bolt", "lightnig bolt")).toBe(true);
    expect(isFuzzyMatch("Counterspell", "conterspel")).toBe(true);
  });

  it("returns no suggestions for short queries", () => {
    expect(getSuggestions(sampleCards, "bo")).toEqual([]);
  });

  it("returns suggestions for substring queries", () => {
    const result = getSuggestions(sampleCards, "bolt");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Lightning Bolt");
  });

  it("limits suggestion count to 8", () => {
    const largeSet = Array.from({ length: 20 }, (_, index) => ({
      cardId: String(index),
      name: `Card Name ${index}`,
      oracleText: "text",
      imageUrl: ""
    }));

    const result = getSuggestions(largeSet, "Card");
    expect(result).toHaveLength(8);
  });
});
