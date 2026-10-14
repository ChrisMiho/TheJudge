import { readFileSync } from "node:fs";
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

const punctuationCards: CardMetadataItem[] = [
  ["u1", "Urborg, Tomb of Yawgmoth"], ["u2", "Urborg"], ["u3", "Urborg Elf"], ["u4", "Urborg Drake"],
  ["j1", "Jace, the Mind Sculptor"], ["a1", "Atraxa, Praetors' Voice"], ["w1", "Will-o'-the-Wisp"],
  ["l1", "Lim-D\u00fbl's Vault"], ["f1", "Fire // Ice"], ["f2", "Fire Imp"], ["s1", "Sol Ring"],
  ["b1", "Lightning Bolt"], ["x1", "_____"]
].map(([cardId, name]) => ({ cardId, name, imageId: "", colors: [] }));

const index = buildOracleSearchIndex(cardMetadata);
const punctuationIndex = buildOracleSearchIndex(punctuationCards);

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

describe("Frontend - Trade (REQ-002 punctuation- and accent-blind search)", () => {
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
    expect(searchOracleIndex(punctuationIndex, query as string)[0]?.name).toBe(expected);
  });

  it("holds a list of eight for a bare urborg", () => {
    const many = Array.from({ length: 12 }, (_, i) => card(`m${i}`, `Urborg Thing ${i}`));
    expect(searchOracleIndex(buildOracleSearchIndex(many), "urborg")).toHaveLength(8);
  });

  it("reaches no search with only punctuation", () => {
    expect(searchOracleIndex(punctuationIndex, ",,,")).toEqual([]);
  });

  it("imports the shared normalize rather than copying it", () => {
    const source = readFileSync(new URL("./oracleSearch.ts", import.meta.url), "utf8");
    expect(source).toMatch(/import \{[^}]*\bnormalize\b[^}]*\} from "..\/..\/lib\/search"/);
    expect(source).not.toMatch(/function normalize/);
  });
});
