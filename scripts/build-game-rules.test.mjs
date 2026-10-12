// REQ-179: the built Comprehensive Rules index must exclude the source
// document's table of contents and heading-only entries. This test operates
// on synthetic Comprehensive-Rules-shaped text (the real source is gitignored
// and human-approval-gated for refresh, never committed) so it runs offline
// and asserts the parsing contract directly, independent of any particular CR
// edition.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  cleanRuleIndexEntries,
  extractRuleExcerpt,
  isHeadingOnlyEntry,
  parseGlossary,
  parseRuleBookMeta,
  parseRuleIndex
} from "./build-game-rules.mjs";

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

// ---- REQ-179 parser fixes (right-rules-in-order, slice A) ------------------------------------------

const PARSER_FIXTURE = `
Magic: The Gathering Comprehensive Rules

These rules are effective as of September 25, 2026.

Contents
1. Game Concepts
100. General
2. Parts of a Card
200. General
Glossary
Credits

1. Game Concepts

100. General

100.1. The last rule of part one ends with its own text.

2. Parts of a Card

200. General

200.1. Part two starts here.

303.7. Some Aura enchantments also have the subtype \u201cRole.\u201d

700.15. The term enter[s] is short for \u201center[s] the battlefield.\u201d

702.163. For Mirrodin!

702.163a For Mirrodin! is a triggered ability.

702.179. Start Your Engines!

702.179a Start your engines! is a static ability.

704.5z If a permanent has more than one Role, all but one go to the graveyard.

704.5aa If a player controls a permanent with start your engines!, their speed becomes 1.

8. Multiplayer Rules

800. General

800.1. Last rule before the glossary.

Glossary

Mana Burn (Obsolete)
Older versions of the rules stated that unspent mana caused a player to lose life.

Play
1. To play a land is to put it onto the battlefield. 2. (Obsolete) Casting used to be called playing.

Placed
(Obsolete) Counters used to be placed.

Trample
A keyword ability.

Credits

Design: someone.
`;

test("a part title is never glued to the last rule of the part before it", () => {
  const byId = new Map(parseRuleIndex(PARSER_FIXTURE).map((entry) => [entry.ruleId, entry]));
  assert.equal(byId.get("100.1").text, "100.1. The last rule of part one ends with its own text.");
  assert.equal(byId.get("303.7").text.includes("Parts of a Card"), false);
  assert.equal(byId.get("704.5aa").text.includes("Multiplayer Rules"), false);
});

test("the eight rules the real rule book glues a part title onto are cut at their own text", () => {
  // Only checked where the gitignored real rule book is present (local and refresh runs).
  const sourcePath = "apps/backend/data/cr/source.txt";
  if (!fs.existsSync(sourcePath)) return;
  const entries = new Map(parseRuleIndex(fs.readFileSync(sourcePath, "utf8")).map((entry) => [entry.ruleId, entry]));
  for (const id of ["123.9", "213.1g", "315.7", "408.3", "514.3a", "616.2", "733.2", "811.5"]) {
    assert.ok(entries.has(id), `${id} missing`);
    assert.doesNotMatch(entries.get(id).text, /\n\s*\d\. [A-Z]/, `${id} still carries a part title`);
  }
});

test("a rule whose heading line ends in a curly closing quote is kept: 303.7 and 700.15", () => {
  const ids = new Set(parseRuleIndex(PARSER_FIXTURE).map((entry) => entry.ruleId));
  assert.ok(ids.has("303.7"));
  assert.ok(ids.has("700.15"));
  assert.equal(
    isHeadingOnlyEntry("700.15", "700.15. The term enter[s] is short for \u201center[s] the battlefield.\u201d"),
    false
  );
});

test("empty keyword titles ending in an exclamation mark are dropped: 702.163 and 702.179", () => {
  const ids = new Set(parseRuleIndex(PARSER_FIXTURE).map((entry) => entry.ruleId));
  assert.equal(ids.has("702.163"), false);
  assert.equal(ids.has("702.179"), false);
  assert.ok(ids.has("702.163a"));
  assert.ok(ids.has("702.179a"));
  // A short real rule that ends in "!" and has no lettered child of its own stays.
  assert.equal(isHeadingOnlyEntry("101.9", "101.9. Stop it!"), false);
});

test("two-letter rule ids stay apart: 704.5aa is not merged into 704.5z", () => {
  const entries = parseRuleIndex(PARSER_FIXTURE);
  const byId = new Map(entries.map((entry) => [entry.ruleId, entry]));
  assert.ok(byId.has("704.5z"));
  assert.ok(byId.has("704.5aa"));
  assert.equal(byId.get("704.5z").text.includes("704.5aa"), false);
  assert.deepEqual(byId.get("704.5aa").parentRuleIds, ["704.5", "704"]);
});

test("extractRuleExcerpt cuts a trailing part title too", () => {
  const excerpt = extractRuleExcerpt(PARSER_FIXTURE, "100.1");
  assert.equal(excerpt, "100.1. The last rule of part one ends with its own text.");
});

test("parseRuleBookMeta records the edition date, a source hash and each part title", () => {
  const meta = parseRuleBookMeta(PARSER_FIXTURE);
  assert.equal(meta.edition, "2026-09-25");
  assert.match(meta.sourceSha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(meta.partTitles, { 1: "Game Concepts", 2: "Parts of a Card", 8: "Multiplayer Rules" });
});

test("parseGlossary reads every term and flags obsolete entries", () => {
  const glossary = parseGlossary(PARSER_FIXTURE);
  assert.deepEqual(
    glossary.map((entry) => [entry.term, entry.obsolete]),
    [
      ["Mana Burn", true],
      ["Play", true],
      ["Placed", true],
      ["Trample", false]
    ]
  );
  // "Play" is a live term with one obsolete sense; query translation can tell them apart.
  assert.equal(glossary.find((entry) => entry.term === "Play").obsoleteSense, true);
  assert.equal(glossary.find((entry) => entry.term === "Mana Burn").obsoleteSense, undefined);
});

test("the committed glossary and rule-book meta match the rebuilt data (741 entries, 35 obsolete)", () => {
  const glossary = JSON.parse(fs.readFileSync("apps/backend/data/gameRulesGlossary.json", "utf8"));
  const meta = JSON.parse(fs.readFileSync("apps/backend/data/gameRulesBookMeta.json", "utf8"));
  assert.equal(glossary.length, 741);
  assert.equal(glossary.filter((entry) => entry.obsolete).length, 35);
  assert.equal(meta.edition, "2026-09-25");
  assert.match(meta.sourceSha256, /^[0-9a-f]{64}$/);
  assert.equal(Object.keys(meta.partTitles).length, 9);
  assert.equal(meta.partTitles[5], "Turn Structure");
});

// ---- rule-data diff (target 8) ------------------------------------------------------------------------

const GLUED_TITLE_IDS = ["123.9", "213.1g", "315.7", "408.3", "514.3a", "616.2", "733.2", "811.5"];
const RESTORED_IDS = ["303.7", "700.15", "704.5aa"];
const DROPPED_IDS = ["702.163", "702.179"];

/** Lists every id/title/text change between two indexes, so a build check can fail on an unlisted one. */
export function diffRuleIndexes(oldEntries, newEntries) {
  const oldById = new Map(oldEntries.map((entry) => [entry.ruleId, entry]));
  const newById = new Map(newEntries.map((entry) => [entry.ruleId, entry]));
  const added = [...newById.keys()].filter((id) => !oldById.has(id));
  const removed = [...oldById.keys()].filter((id) => !newById.has(id));
  const changed = [];
  for (const [id, entry] of newById) {
    const before = oldById.get(id);
    if (!before) continue;
    if (before.sectionTitle !== entry.sectionTitle) changed.push(`${id}:sectionTitle`);
    if (before.text !== entry.text) changed.push(`${id}:text`);
  }
  return { added, removed, changed };
}

test("diffRuleIndexes reports every id, title and text change", () => {
  const before = [
    { ruleId: "1.1", sectionTitle: "A", text: "x" },
    { ruleId: "1.2", sectionTitle: "A", text: "y" }
  ];
  const after = [
    { ruleId: "1.1", sectionTitle: "B", text: "x" },
    { ruleId: "1.3", sectionTitle: "A", text: "z" }
  ];
  assert.deepEqual(diffRuleIndexes(before, after), { added: ["1.3"], removed: ["1.2"], changed: ["1.1:sectionTitle"] });
});

test("rebuilt from the same rule book, only the listed pieces change their id, title or text (target 8)", () => {
  // Pinned to the index committed before the parser fixes (the base of this change). Needs the
  // gitignored 2026-09-25 rule book and that commit in the clone; skipped otherwise.
  const sourcePath = "apps/backend/data/cr/source.txt";
  const BEFORE_COMMIT = "9776e936";
  if (!fs.existsSync(sourcePath)) return;
  let oldIndex;
  try {
    oldIndex = JSON.parse(
      execFileSync("git", ["show", `${BEFORE_COMMIT}:apps/backend/data/gameRulesRuleIndex.json`], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
        stdio: ["ignore", "pipe", "ignore"]
      })
    );
  } catch {
    return;
  }
  const crText = fs.readFileSync(sourcePath, "utf8");
  if (parseRuleBookMeta(crText).edition !== "2026-09-25") return;
  const diff = diffRuleIndexes(oldIndex, parseRuleIndex(crText));
  assert.deepEqual([...diff.added].sort(), [...RESTORED_IDS].sort());
  assert.deepEqual([...diff.removed].sort(), [...DROPPED_IDS].sort());
  const expectedChanged = [...GLUED_TITLE_IDS, "704.5z"].map((id) => `${id}:text`).sort();
  assert.deepEqual([...diff.changed].sort(), expectedChanged);
});

// REQ-179 / REQ-235: each lettered piece of a 701/702 keyword rule carries the rule's title as data.
const KEYWORD_FIXTURE = `
These rules are effective as of September 25, 2026.

Glossary
Credits

7. Additional Rules

702. Keyword Abilities

702.1. General

702.1a Keyword abilities are the game's shorthand.

702.2. Deathtouch

702.2a Deathtouch is a static ability.

702.2b A creature dealt damage by a source with deathtouch is destroyed.

701. Keyword Actions

701.9. Discard

701.9a To discard a card, move it from its owner's hand to their graveyard.

Glossary

Deathtouch
A keyword.

Credits
`;

test("parseRuleIndex records each keyword rule's title on its lettered pieces and nowhere else", () => {
  const entries = parseRuleIndex(KEYWORD_FIXTURE);
  const byId = new Map(entries.map((entry) => [entry.ruleId, entry]));
  assert.equal(byId.get("702.2a")?.keywordTitle, "Deathtouch");
  assert.equal(byId.get("702.2b")?.keywordTitle, "Deathtouch");
  assert.equal(byId.get("701.9a")?.keywordTitle, "Discard");
  // 702.1 is the section's general rule, not a keyword.
  assert.equal(byId.get("702.1a")?.keywordTitle, undefined);
  // The title is data: no excerpt text changes.
  assert.ok(!byId.get("702.2a").text.includes("keywordTitle"));
});

test("the committed rule index ships keyword titles on 701/702 pieces", () => {
  const index = JSON.parse(fs.readFileSync("apps/backend/data/gameRulesRuleIndex.json", "utf8"));
  const titled = index.filter((entry) => entry.keywordTitle);
  assert.ok(titled.length > 500);
  assert.ok(titled.every((entry) => /^70[12]\.\d+[a-z]+$/.test(entry.ruleId)));
  assert.equal(index.find((entry) => entry.ruleId === "702.2b")?.keywordTitle, "Deathtouch");
});
