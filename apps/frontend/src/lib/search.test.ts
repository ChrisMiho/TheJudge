import { describe, expect, it } from "vitest";
import type { CardMetadataItem } from "../types";
import { getSuggestions, isFuzzyMatch, levenshteinDistance, NO_MATCH_COPY } from "./search";

const sampleCards: CardMetadataItem[] = [
  {
    cardId: "1",
    name: "Lightning Bolt",
    oracleText: "Deal 3 damage.",
    imageUrl: "",
    manaCost: "{R}",
    manaValue: 1,
    typeLine: "Instant",
    colors: ["R"],
    supertypes: [],
    subtypes: []
  },
  {
    cardId: "2",
    name: "Counterspell",
    oracleText: "Counter target spell.",
    imageUrl: "",
    manaCost: "{U}{U}",
    manaValue: 2,
    typeLine: "Instant",
    colors: ["U"],
    supertypes: [],
    subtypes: []
  },
  {
    cardId: "3",
    name: "Brainstorm",
    oracleText: "Draw three cards.",
    imageUrl: "",
    manaCost: "{U}",
    manaValue: 1,
    typeLine: "Instant",
    colors: ["U"],
    supertypes: [],
    subtypes: []
  }
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
        oracleText: "",
        imageUrl: "",
        manaCost: "",
        manaValue: 0,
        typeLine: "",
        colors: [],
        supertypes: [],
        subtypes: []
      },
      {
        cardId: "prefix",
        name: "Boltergeist",
        oracleText: "",
        imageUrl: "",
        manaCost: "",
        manaValue: 0,
        typeLine: "",
        colors: [],
        supertypes: [],
        subtypes: []
      },
      {
        cardId: "substring",
        name: "Firebolt Mage",
        oracleText: "",
        imageUrl: "",
        manaCost: "",
        manaValue: 0,
        typeLine: "",
        colors: [],
        supertypes: [],
        subtypes: []
      },
      {
        cardId: "typo",
        name: "Brolt",
        oracleText: "",
        imageUrl: "",
        manaCost: "",
        manaValue: 0,
        typeLine: "",
        colors: [],
        supertypes: [],
        subtypes: []
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
        oracleText: "",
        imageUrl: "",
        manaCost: "",
        manaValue: 0,
        typeLine: "",
        colors: [],
        supertypes: [],
        subtypes: []
      },
      {
        cardId: "a",
        name: "Bolo",
        oracleText: "",
        imageUrl: "",
        manaCost: "",
        manaValue: 0,
        typeLine: "",
        colors: [],
        supertypes: [],
        subtypes: []
      },
      {
        cardId: "b",
        name: "Bott",
        oracleText: "",
        imageUrl: "",
        manaCost: "",
        manaValue: 0,
        typeLine: "",
        colors: [],
        supertypes: [],
        subtypes: []
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
      oracleText: "text",
      imageUrl: "",
      manaCost: "",
      manaValue: 0,
      typeLine: "",
      colors: [],
      supertypes: [],
      subtypes: []
    }));

    const result = getSuggestions(largeSet, "Card");
    expect(result).toHaveLength(3);
  });
});
