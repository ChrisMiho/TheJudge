// REQ-179: the built Comprehensive Rules index must exclude the source
// document's table of contents and heading-only entries. This test operates
// on synthetic Comprehensive-Rules-shaped text (the real source is gitignored
// and human-approval-gated for refresh, never committed) so it runs offline
// and asserts the parsing contract directly, independent of any particular CR
// edition.

import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanRuleIndexEntries, isHeadingOnlyEntry, parseRuleIndex } from "./build-game-rules.mjs";

// Mirrors the real Comprehensive Rules document shape: a table of contents
// (ending in bare "Glossary" / "Credits" lines) that lists every section,
// then the real numbered rule text, then a trailing real Glossary section.
const SYNTHETIC_CR_TEXT = `
Introduction

Contents
100. General
101. The Magic Golden Rules
Glossary
Credits

1. Game Concepts

100. General
100.1. These Magic rules apply to any Magic game with two or more players.
100.2. To play, each player needs a deck of traditional Magic cards.

101. The Magic Golden Rules
101.1. Whenever a card's text directly contradicts these rules, the card takes precedence.

702.19. Trample
702.19a This rule is an example of a keyword ability with lettered sub-rules.

Glossary

Ability Word
A word with no rules meaning that appears on some cards.
`;

test("skips the table of contents: no duplicate rule ids from TOC entries", () => {
  const entries = parseRuleIndex(SYNTHETIC_CR_TEXT);
  const ids = entries.map((entry) => entry.ruleId);
  assert.deepEqual(ids, [...new Set(ids)], `duplicate rule ids found: ${ids.join(", ")}`);
});

test("omits heading-only entries: 100 and 101's bare section headings, and 702.19's bare keyword heading, are removed", () => {
  const entries = parseRuleIndex(SYNTHETIC_CR_TEXT);
  const ids = new Set(entries.map((entry) => entry.ruleId));
  assert.equal(ids.has("100"), false, "bare section heading 100 should be omitted (heading-only)");
  assert.equal(ids.has("101"), false, "bare section heading 101 should be omitted (heading-only)");
  assert.equal(ids.has("702.19"), false, "bare keyword heading 702.19 should be omitted (heading-only)");
});

test("keeps every entry that carries real rule content", () => {
  const entries = parseRuleIndex(SYNTHETIC_CR_TEXT);
  const byId = new Map(entries.map((entry) => [entry.ruleId, entry]));
  assert.ok(byId.has("100.1"));
  assert.ok(byId.get("100.1").text.includes("two or more players"));
  assert.ok(byId.has("100.2"));
  assert.ok(byId.has("101.1"));
  assert.ok(byId.has("702.19a"));
});

test("excludes the trailing real Glossary section from rule parsing", () => {
  const entries = parseRuleIndex(SYNTHETIC_CR_TEXT);
  const combinedText = entries.map((entry) => entry.text).join(" ");
  assert.ok(!combinedText.includes("Ability Word"), "the Glossary section must not be scanned for rule headers");
});

test("isHeadingOnlyEntry: a bare heading has no evidence, a real rule statement does", () => {
  assert.equal(isHeadingOnlyEntry("100", "100. General"), true);
  assert.equal(isHeadingOnlyEntry("702.19", "702.19. Trample"), true);
  assert.equal(
    isHeadingOnlyEntry("100.1", "100.1. These Magic rules apply to any Magic game with two or more players."),
    false
  );
});

test("cleanRuleIndexEntries: dedupes by rule id as a backstop, independent of parseRuleIndex", () => {
  const entries = [
    { ruleId: "100", sectionTitle: "General", text: "100. General", searchText: "", parentRuleIds: [] },
    { ruleId: "100", sectionTitle: "General", text: "100. General", searchText: "", parentRuleIds: [] },
    {
      ruleId: "100.1",
      sectionTitle: "General",
      text: "100.1. Real rule text about the game.",
      searchText: "",
      parentRuleIds: ["100"]
    }
  ];
  const cleaned = cleanRuleIndexEntries(entries);
  assert.deepEqual(
    cleaned.map((entry) => entry.ruleId),
    ["100.1"]
  );
});

test("a future Comprehensive Rules refresh reintroducing a TOC or a heading-only entry fails this test suite", () => {
  // Regression guard: if the TOC-skip or heading-only filter regresses, the
  // synthetic fixture above starts producing duplicates/heading-only entries
  // and the earlier assertions in this file catch it directly. This test
  // documents that intent for a reader scanning the file.
  const entries = parseRuleIndex(SYNTHETIC_CR_TEXT);
  for (const entry of entries) {
    assert.equal(
      isHeadingOnlyEntry(entry.ruleId, entry.text),
      false,
      `entry ${entry.ruleId} is heading-only and should have been filtered`
    );
  }
});
