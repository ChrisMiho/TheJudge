import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CONCEPT_MAP, TYPE_MAP, conceptTermsForCard, conceptTermsForCards } from "./gameRulesConceptMap.js";
import type { GameRulesRuleIndexEntry } from "./gameRulesRetrieval.js";

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../data");
const ruleIndex = JSON.parse(readFileSync(resolve(dataDir, "gameRulesRuleIndex.json"), "utf8")) as GameRulesRuleIndexEntry[];

describe("REQ-234 concept map", () => {
  it("holds 77 oracle-text entries and 5 type-line entries", () => {
    expect(CONCEPT_MAP).toHaveLength(77);
    expect(TYPE_MAP).toHaveLength(5);
  });

  it("uses only words the committed rule index contains (163 distinct words over 82 entries)", () => {
    const ruleText = ruleIndex.map((entry) => entry.text).join(" ").toLowerCase().replace(/[‘’]/g, "'");
    const words = new Set([...CONCEPT_MAP, ...TYPE_MAP].flatMap(([, terms]) => terms.split(/\s+/)));
    expect(words.size).toBe(163);
    const missing = [...words].filter((word) => !ruleText.includes(word));
    expect(missing).toEqual([]);
  });

  it("turns card wording into rule-book concepts", () => {
    expect(conceptTermsForCard({ name: "Ephemeral Hydra", oracleText: "At the beginning of your upkeep, draw a card." })).toEqual([
      "upkeep step triggered ability",
      "draw card"
    ]);
    expect(conceptTermsForCard({ oracleText: "Until end of turn, target creature gains flying." })).toContain(
      "cleanup step until end of turn effects end"
    );
  });

  it("replaces the card's own name (each face of a // name) with ~ before matching", () => {
    // "Skip Rope" must not read as "skip ..." wording once the name is replaced.
    const text = "Skip Rope enters tapped.";
    expect(conceptTermsForCard({ name: "Skip Rope", oracleText: text })).not.toContain("skip step skipped replacement effect");
    expect(conceptTermsForCard({ name: "Front // Back", oracleText: "When back dies, front deals damage." })).toContain(
      "leaves-the-battlefield abilities look back in time dies"
    );
  });

  it("reads curly apostrophes as straight ones", () => {
    expect(conceptTermsForCard({ oracleText: "Creatures you control can’t be blocked." })).toContain(
      "blocking restrictions attack restrictions"
    );
  });

  it("adds the type-line entries", () => {
    expect(conceptTermsForCard({ typeLine: "Legendary Planeswalker — Jace" })).toEqual([
      "legend rule",
      "loyalty abilities planeswalker"
    ]);
  });

  it("de-duplicates across a request's cards, keeping first-seen order", () => {
    const terms = conceptTermsForCards([
      { oracleText: "When this enters, draw a card." },
      { oracleText: "Whenever a creature dies, draw a card." }
    ]);
    expect(terms.filter((term) => term === "draw card")).toHaveLength(1);
    expect(terms[0]).toBe("triggered ability trigger event");
  });

  it("returns nothing for a card without wording", () => {
    expect(conceptTermsForCard({})).toEqual([]);
  });
});
