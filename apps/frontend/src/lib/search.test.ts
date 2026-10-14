import { describe, expect, it } from "vitest";
import type { CardMetadataItem } from "../types";
import { normalize, buildSearchIndex, getSuggestions, getSuggestionsFromIndex, isFuzzyMatch, levenshteinDistance, NO_MATCH_COPY } from "./search";

const sampleCards: CardMetadataItem[] = [
  {
    cardId: "1",
    name: "Lightning Bolt",
    imageId: "",
    colors: ["R"],
  },
  {
    cardId: "2",
    name: "Counterspell",
    imageId: "",
    colors: ["U"],
  },
  {
    cardId: "3",
    name: "Brainstorm",
    imageId: "",
    colors: ["U"],
  }
];

const punctuationCards: CardMetadataItem[] = [
  ["u1", "Urborg, Tomb of Yawgmoth"], ["u2", "Urborg"], ["u3", "Urborg Elf"], ["u4", "Urborg Drake"],
  ["j1", "Jace, the Mind Sculptor"], ["a1", "Atraxa, Praetors' Voice"], ["w1", "Will-o'-the-Wisp"],
  ["l1", "Lim-D\u00fbl's Vault"], ["f1", "Fire // Ice"], ["f2", "Fire Imp"], ["s1", "Sol Ring"],
  ["b1", "Lightning Bolt"], ["x1", "_____"]
].map(([cardId, name]) => ({ cardId, name, imageId: "", colors: [] }));

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

  it("keeps the three-character minimum by default and lets a caller lower it (REQ-167: Ask a Question's Add-card search passes 1)", () => {
    expect(getSuggestions(sampleCards, "l")).toEqual([]);
    expect(getSuggestions(sampleCards, "li")).toEqual([]);
    expect(getSuggestions(sampleCards, "l", 1).map((card) => card.name)).toContain("Lightning Bolt");
    // an empty query never lists the whole corpus, whatever the minimum
    expect(getSuggestions(sampleCards, "  ", 1)).toEqual([]);
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
        imageId: "",
        colors: [],
      },
      {
        cardId: "prefix",
        name: "Boltergeist",
        imageId: "",
        colors: [],
      },
      {
        cardId: "substring",
        name: "Firebolt Mage",
        imageId: "",
        colors: [],
      },
      {
        cardId: "typo",
        name: "Brolt",
        imageId: "",
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
        imageId: "",
        colors: [],
      },
      {
        cardId: "a",
        name: "Bolo",
        imageId: "",
        colors: [],
      },
      {
        cardId: "b",
        name: "Bott",
        imageId: "",
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
      imageId: "",
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

describe("REQ-002 punctuation- and accent-blind card search", () => {
  it.each([
  ["urborg tomb", "Urborg, Tomb of Yawgmoth"],
  ["urborg t", "Urborg, Tomb of Yawgmoth"],
  ["jace the mind", "Jace, the Mind Sculptor"],
  ["atraxa praetors", "Atraxa, Praetors' Voice"],
  ["will o the wisp", "Will-o'-the-Wisp"],
  ["lim dul", "Lim-D\u00fbl's Vault"],
  ["fire ice", "Fire // Ice"],
  ["sol ring", "Sol Ring"],
  ["lightning bolt", "Lightning Bolt"],
  ["urborg, tomb", "Urborg, Tomb of Yawgmoth"],
  ["lim-d\u00fbl", "Lim-D\u00fbl's Vault"],
  ["_____", "_____"]
  ])("%s finds %s first", (query, expected) => {
    expect(getSuggestions(punctuationCards, query as string, 1)[0]?.name).toBe(expected);
  });

  it("keeps a bare urborg to the plain Urborg names", () => {
    expect(getSuggestions(punctuationCards, "urborg").map((c) => c.name)).toEqual(["Urborg", "Urborg Elf", "Urborg Drake"]);
  });

  it("normalizes case, accents, hyphens, slashes, other marks and space runs; keeps underscores", () => {
    expect(normalize("  Lim-D\u00fbl's  Vault ")).toBe("lim duls vault");
    expect(normalize("Fire // Ice")).toBe("fire ice");
    expect(normalize("_____")).toBe("_____");
    expect(normalize(",,,")).toBe("");
  });

  it("counts long dashes as a space like a hyphen, and any whitespace as a space", () => {
    expect(normalize("Human—Time Lord Meta-Crisis")).toBe("human time lord meta crisis");
    expect(normalize("a–b‐c―d")).toBe("a b c d");
    const emDashCards = [{ cardId: "h", name: "Human—Time Lord Meta-Crisis" }] as never;
    expect(getSuggestions(emDashCards, "human time lord").map((c) => c.name)).toEqual(["Human—Time Lord Meta-Crisis"]);
    expect(normalize("a\tb")).toBe("a b");
    expect(normalize("a   b")).toBe("a b");
  });

  it("reaches no search with only punctuation", () => {
    expect(getSuggestions(punctuationCards, ",,,", 1)).toEqual([]);
    expect(getSuggestions(punctuationCards, ",,,")).toEqual([]);
  });
});
