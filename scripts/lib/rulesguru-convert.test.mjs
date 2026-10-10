import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { computeSnapshot, loadGoldCases } from "./gold-cases.mjs";
import { buildCardNameIndex } from "./rulesguru-card-names.mjs";
import { convertSuite, firstSentence, readRawQuestion } from "./rulesguru-convert.mjs";

// Invented cards, rules and questions only.
const cardNames = buildCardNameIndex({
  detail: {
    "id-bear": { typeLine: "Creature — Bear" },
    "id-owl": { typeLine: "Creature — Owl" },
    "id-twin-a": { typeLine: "Creature — Elf" },
    "id-twin-b": { typeLine: "Creature — Elf" }
  },
  metadata: [
    { cardId: "id-bear", name: "Grizzled Bear" },
    { cardId: "id-owl", name: "Night Owl" },
    { cardId: "id-twin-a", name: "Twin Elf" },
    { cardId: "id-twin-b", name: "Twin Elf" }
  ],
  scanMap: {}
});

function makeSources(oracleSuffix = "") {
  const ruleIndex = ["100.1", "613.1a", "702.16a", "702.16b"].map((ruleId) => ({ ruleId, text: `rule ${ruleId}` }));
  return {
    ruleIndexHash: "0".repeat(64),
    ruleIndex,
    ruleText: (ruleId) => ruleIndex.find((entry) => entry.ruleId === ruleId)?.text ?? null,
    oracleText: (oracleId) => `oracle ${oracleId}${oracleSuffix}`,
    rulings: () => []
  };
}

function raw(id, overrides = {}) {
  return {
    id,
    level: 2,
    complexity: "Simple",
    tags: ["Invented tag"],
    includedCards: [{ name: "Grizzled Bear" }],
    questionSimple: `Invented question number ${id}?`,
    answerSimple: `Invented first sentence ${id}. Invented second sentence.`,
    answerSimpleCited: "ignored",
    citedRules: { "100.1": "text" },
    url: "https://example.invalid",
    ...overrides
  };
}

function suiteWith(questions) {
  const dir = mkdtempSync(join(tmpdir(), "convert-suite-"));
  test.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "raw"));
  for (const question of questions) writeFileSync(join(dir, "raw", `${question.id}.json`), JSON.stringify(question));
  return dir;
}

const casesOf = (dir) => readdirSync(join(dir, "cases")).sort();
const readCase = (dir, id) => JSON.parse(readFileSync(join(dir, "cases", `rulesguru-${id}.case.json`), "utf8"));

test("synthetic raw questions convert to cases that pass the external-mode loader, with the brief's fields", async () => {
  const dir = suiteWith([raw(10, { level: 4, includedCards: [{ name: "grizzled bear" }, { name: "Night Owl" }], citedRules: { "702.16": "t", "613.1a": "t" } })]);
  const sources = makeSources();
  const counts = await convertSuite({ suiteDir: dir, cardNames, sources });
  assert.equal(counts.selectable, 1);

  const loaded = await loadGoldCases(join(dir, "cases"), { external: true });
  assert.equal(loaded.length, 1);
  const c = readCase(dir, 10);
  assert.equal(c.id, "rulesguru-10");
  assert.equal(c.formatVersion, 2);
  assert.equal(c.tier, "external");
  assert.deepEqual(c.review, { status: "draft", reviewedOn: null });
  assert.deepEqual(c.cards, [
    { oracleId: "id-bear", name: "Grizzled Bear" },
    { oracleId: "id-owl", name: "Night Owl" }
  ]);
  assert.equal(c.gameState, null);
  assert.equal(c.question, "Invented question number 10?");
  assert.equal(c.expected.outcome, null);
  assert.equal(c.expected.shortAnswer, "Invented first sentence 10.");
  assert.equal(c.expected.answer, "Invented first sentence 10. Invented second sentence.");
  assert.deepEqual(c.expected.decidingRuleIds, ["702.16a", "702.16b", "613.1a"]);
  assert.deepEqual(c.suite, {
    name: "rulesguru",
    questionId: 10,
    level: "corner",
    complexity: "simple",
    tags: ["Invented tag"],
    citedRuleIds: ["702.16", "613.1a"],
    ruleGroups: [["702.16a", "702.16b"], ["613.1a"]],
    excluded: null
  });
  assert.deepEqual(c.source, { authority: "external-unapproved", publisher: "RulesGuru", license: "used with permission, local only", questionId: 10 });
  assert.deepEqual(c.layers, { requiredFacts: [], irrelevantFacts: [], variants: [] });
  assert.equal(c.whyHard, "external practice question, level corner, simple");
});

test("each exclusion reason is produced, and the case file is still written with suite.excluded set", async () => {
  const dir = suiteWith([
    raw(1),
    raw(2, { includedCards: [{ name: "No Such Card" }] }),
    raw(3, { includedCards: [{ name: "Twin Elf" }] }),
    raw(4, { citedRules: {} }),
    raw(5, { citedRules: { "999.9": "t" } }),
    raw(6, { questionSimple: "  invented QUESTION number 1?  " })
  ]);
  const counts = await convertSuite({ suiteDir: dir, cardNames, sources: makeSources() });
  assert.equal(counts.converted, 6);
  assert.equal(counts.selectable, 1);
  assert.deepEqual(counts.excluded, { "unresolved-card": 1, "ambiguous-card": 1, "no-cited-rule": 1, "unknown-rule": 1, "duplicate-question": 1 });
  assert.equal(casesOf(dir).length, 6);
  assert.equal(readCase(dir, 1).suite.excluded, null);
  assert.equal(readCase(dir, 2).suite.excluded, "unresolved-card");
  assert.equal(readCase(dir, 3).suite.excluded, "ambiguous-card");
  assert.equal(readCase(dir, 4).suite.excluded, "no-cited-rule");
  assert.equal(readCase(dir, 5).suite.excluded, "unknown-rule");
  assert.equal(readCase(dir, 6).suite.excluded, "duplicate-question");
  // Excluded cases load too, and only the selectable one is a duplicate candidate.
  assert.equal((await loadGoldCases(join(dir, "cases"), { external: true })).length, 6);
  const report = readFileSync(join(dir, "convert-report.txt"), "utf8");
  assert.match(report, /selectable: 1/);
  assert.match(report, /2 unresolved-card/);
});

test("two converts of the same inputs give identical bytes, and the snapshot comes from the injected sources", async () => {
  const dir = suiteWith([raw(1), raw(2, { includedCards: [{ name: "Night Owl" }] })]);
  await convertSuite({ suiteDir: dir, cardNames, sources: makeSources() });
  const first = casesOf(dir).map((name) => readFileSync(join(dir, "cases", name), "utf8"));
  const firstReport = readFileSync(join(dir, "convert-report.txt"), "utf8");
  await convertSuite({ suiteDir: dir, cardNames, sources: makeSources() });
  assert.deepEqual(
    casesOf(dir).map((name) => readFileSync(join(dir, "cases", name), "utf8")),
    first
  );
  assert.equal(readFileSync(join(dir, "convert-report.txt"), "utf8"), firstReport);

  const c = readCase(dir, 1);
  assert.deepEqual(c.snapshot, computeSnapshot(c, makeSources()));
  await convertSuite({ suiteDir: dir, cardNames, sources: makeSources(" changed") });
  assert.notEqual(readCase(dir, 1).snapshot.dependsOnHashes.oracle, c.snapshot.dependsOnHashes.oracle);
});

test("convert fails loudly on a missing raw field, naming the file", async () => {
  const dir = suiteWith([raw(1), { ...raw(2), answerSimple: undefined }]);
  await assert.rejects(() => convertSuite({ suiteDir: dir, cardNames, sources: makeSources() }), /Cannot convert 2\.json: missing field "answerSimple"/);
  for (const field of ["questionSimple", "level", "complexity", "tags", "includedCards", "citedRules", "id"]) {
    assert.throws(() => readRawQuestion({ ...raw(3), [field]: undefined }, "3.json"), new RegExp(`missing field "${field}"`));
  }
  assert.throws(() => readRawQuestion({ ...raw(3), includedCards: [{}] }, "3.json"), /card with no name/);
});

test("firstSentence takes the first sentence, or the whole text when there is none", () => {
  assert.equal(firstSentence("One thing. Another thing."), "One thing.");
  assert.equal(firstSentence("No end mark"), "No end mark");
  assert.equal(firstSentence("Is it? Yes."), "Is it?");
});
