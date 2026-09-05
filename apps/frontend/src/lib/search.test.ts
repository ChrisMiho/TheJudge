import { describe, expect, it } from "vitest";
import type { CardMetadataItem } from "../types";
import { buildSearchIndex, getSuggestions, getSuggestionsFromIndex, isFuzzyMatch, levenshteinDistance, NO_MATCH_COPY } from "./search";

const sampleCards: CardMetadataItem[] = [
  {
    cardId: "1",
    name: "Lightning Bolt",
    imageUrl: "",
    colors: ["R"],
  },
  {
    cardId: "2",
    name: "Counterspell",
    imageUrl: "",
    colors: ["U"],
  },
  {
    cardId: "3",
    name: "Brainstorm",
    imageUrl: "",
    colors: ["U"],
  }
];

describe("Frontend - Shared", () => {
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

  it("returns suggestions for partial multiword and typo-like queries", () => {
    expect(getSuggestions(sampleCards, "lightning bol").map((card) => card.name)).toContain("Lightning Bolt");
    expect(getSuggestions(sampleCards, "brianstorm").map((card) => card.name)).toContain("Brainstorm");
  });

  it("returns empty list for no-match queries", () => {
    expect(getSuggestions(sampleCards, "zzzzzzzz")).toEqual([]);
  });

  it("applies deterministic ranking contract: exact > prefix > substring > typo", () => {
    const rankedCards: CardMetadataItem[] = [
      {
        cardId: "exact",
        name: "Bolt",
        imageUrl: "",
        colors: [],
      },
      {
        cardId: "prefix",
        name: "Boltergeist",
        imageUrl: "",
        colors: [],
      },
      {
        cardId: "substring",
        name: "Firebolt Mage",
        imageUrl: "",
        colors: [],
      },
      {
        cardId: "typo",
        name: "Brolt",
        imageUrl: "",
        colors: [],
      }
    ];

    expect(getSuggestions(rankedCards, "bolt").map((card) => card.name)).toEqual([
      "Bolt",
      "Boltergeist",
      "Firebolt Mage"
    ]);
  });

  it("uses typo distance and deterministic tie-breaks independent of source order", () => {
    const tieCards: CardMetadataItem[] = [
      {
        cardId: "c",
        name: "Zolt",
        imageUrl: "",
        colors: [],
      },
      {
        cardId: "a",
        name: "Bolo",
        imageUrl: "",
        colors: [],
      },
      {
        cardId: "b",
        name: "Bott",
        imageUrl: "",
        colors: [],
      }
    ];

    const expectedOrder = ["Bolo", "Bott", "Zolt"];
    const forwardOrder = getSuggestions(tieCards, "bolt").map((card) => card.name);
    const reverseOrder = getSuggestions([...tieCards].reverse(), "bolt").map((card) => card.name);

    expect(forwardOrder).toEqual(expectedOrder);
    expect(reverseOrder).toEqual(expectedOrder);
  });

  it("keeps expected no-match UX copy constant", () => {
    expect(NO_MATCH_COPY).toBe("No matching card found");
  });

  it("limits suggestion count to 3", () => {
    const largeSet = Array.from({ length: 20 }, (_, index) => ({
      cardId: String(index),
      name: `Card Name ${index}`,
      imageUrl: "",
      colors: [],
    }));

    const result = getSuggestions(largeSet, "Card");
    expect(result).toHaveLength(3);
  });

  it("returns identical ordering from pre-built search index", () => {
    const query = "bolt";
    const index = buildSearchIndex(sampleCards);

    expect(getSuggestionsFromIndex(index, query)).toEqual(getSuggestions(sampleCards, query));
  });
});
});
