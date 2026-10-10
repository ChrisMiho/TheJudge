import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { evaluateCaseRecall, formatReport, loadCases, parseArgs } from "./eval-worked-solutions.mjs";

function makeTempCasesDir(cases) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worked-solutions-"));
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const [index, caseEntry] of cases.entries()) {
    fs.writeFileSync(path.join(dir, `case-${index}.case.json`), JSON.stringify(caseEntry), "utf8");
  }
  return dir;
}

test("parseArgs resolves an optional --output path against the repo root", () => {
  assert.equal(parseArgs([]).outputPath, undefined);
  const resolved = parseArgs(["--output", "output/report.txt"]).outputPath;
  assert.ok(resolved.endsWith(path.join("output", "report.txt")));
  assert.ok(path.isAbsolute(resolved));
});

const ZERO_HASH = "0".repeat(64);

function validCase(overrides = {}) {
  return {
    id: "sample",
    formatVersion: 2,
    tier: 1,
    review: { status: "approved", reviewedOn: "2026-10-06" },
    cards: [],
    gameState: null,
    question: "Sample question?",
    expected: {
      outcome: "works",
      shortAnswer: "Yes.",
      answer: "Sample worked solution text.",
      decidingRuleIds: ["100.1"]
    },
    whyHard: "Sample reason this is hard.",
    source: {
      authority: "wotc-comprehensive-rules",
      publisher: "Wizards of the Coast",
      license: "Reproduced under the Wizards of the Coast Fan Content Policy.",
      ruleId: "100.1"
    },
    layers: { requiredFacts: [], irrelevantFacts: [], variants: [] },
    snapshot: { ruleIndexHash: ZERO_HASH, dependsOnHashes: { rules: ZERO_HASH, oracle: ZERO_HASH, rulings: ZERO_HASH } },
    ...overrides
  };
}

test("loadCases reads every *.case.json file, sorted, and rejects a malformed one (via the shared gold-cases validator, REQ-185)", async () => {
  const dir = makeTempCasesDir([
    validCase({ id: "b", question: "Question b?", expected: { ...validCase().expected, answer: "Answer b." } }),
    validCase({ id: "a", question: "Question a?", expected: { ...validCase().expected, answer: "Answer a." } })
  ]);

  const cases = await loadCases(dir);

  assert.deepEqual(
    cases.map((c) => c.id),
    ["b", "a"]
  );

  fs.writeFileSync(path.join(dir, "z-bad.case.json"), JSON.stringify({ id: "bad" }), "utf8");
  await assert.rejects(() => loadCases(dir), /Invalid gold case\(s\)/);
});

test("loadCases leaves a rejected case out of the check but keeps every other case", async () => {
  const dir = makeTempCasesDir([
    validCase({ id: "kept", question: "Question kept?", expected: { ...validCase().expected, answer: "Answer kept." } }),
    validCase({
      id: "dropped",
      question: "Question dropped?",
      expected: { ...validCase().expected, answer: "Answer dropped." },
      review: { status: "rejected", reviewedOn: "2026-10-06", note: "not a real interaction" }
    })
  ]);
  assert.deepEqual(
    (await loadCases(dir)).map((c) => c.id),
    ["kept"]
  );
});

test("evaluateCaseRecall reports a hit only when every expected rule id was retrieved", () => {
  const caseEntry = { id: "example", expected: { decidingRuleIds: ["613.9", "704.4"] } };

  const fullHit = evaluateCaseRecall(caseEntry, new Set(["613.9", "704.4", "999.9"]));
  assert.equal(fullHit.passed, true);
  assert.deepEqual(fullHit.hit, ["613.9", "704.4"]);
  assert.deepEqual(fullHit.missed, []);

  const partialMiss = evaluateCaseRecall(caseEntry, new Set(["613.9"]));
  assert.equal(partialMiss.passed, false);
  assert.deepEqual(partialMiss.missed, ["704.4"]);
});

test("evaluateCaseRecall never reports a pass for a case with no expected rule ids", () => {
  const result = evaluateCaseRecall({ id: "no-expectation" }, new Set(["613.9"]));
  assert.equal(result.passed, false);
  assert.deepEqual(result.expected, []);
});

test("formatReport names every case's hit/miss status and a summary count", () => {
  const results = [
    { id: "hit-case", expected: ["613.9"], hit: ["613.9"], missed: [], passed: true },
    { id: "miss-case", expected: ["704.4"], hit: [], missed: ["704.4"], passed: false }
  ];

  const report = formatReport(results, { generatedAt: "2026-08-30T00:00:00.000Z" });

  assert.match(report, /\[HIT \] hit-case/);
  assert.match(report, /\[MISS\] miss-case -- expected \["704\.4"\], missing \["704\.4"\]/);
  assert.match(report, /Summary: 1\/2 cases retrieved their expected rule\./);
  assert.match(report, /Informational only\. Not a build gate/);
  assert.doesNotMatch(report, /Embedding provider/);
});

test("formatReport names the embedding provider and which ranking produced each result, when the run records it", () => {
  const tier2 = { id: "sensei", tier: 2, expected: { decidingRuleIds: ["113.7a"] } };
  const results = [
    evaluateCaseRecall(tier2, new Set(["113.7a", "603.2"]), { usedSemantic: true }),
    evaluateCaseRecall({ id: "bare", expected: { decidingRuleIds: ["510.1c"] } }, new Set(), { usedSemantic: false })
  ];
  assert.equal(results[0].usedSemantic, true);
  assert.equal(results[0].passed, true);

  const report = formatReport(results, { generatedAt: "2026-09-07T00:00:00.000Z", embeddingProvider: "local" });

  assert.match(report, /Embedding provider: local \(1\/2 cases ranked semantically\)/);
  assert.match(report, /\[HIT \] sensei \(semantic\)/);
  assert.match(report, /\[MISS\] bare \(lexical\)/);
});

// ---------------------------------------------------------------------------
// Local practice suite (REQ-232): invented cases, a temporary suite folder, no provider.
// ---------------------------------------------------------------------------

import {
  USAGE,
  formatSuiteReport,
  loadSuiteSelection,
  resolveSuiteReportPath,
  scoreSuiteCase,
  summarizeSuite
} from "./eval-worked-solutions.mjs";
import { computeSnapshot } from "./lib/gold-cases.mjs";
import { normalizeSuiteFilters } from "./lib/rulesguru-suite.mjs";

function sourcesWith(oracleSuffix = "") {
  const ruleText = (ruleId) => `rule ${ruleId}${oracleSuffix}`;
  return { ruleIndexHash: ZERO_HASH, ruleText, oracleText: (id) => `oracle ${id}${oracleSuffix}`, rulings: () => [] };
}

function suiteCase(n, { level = 1, complexity = "simple", tags = [], groups = [["100.1"]], cited, excluded = null } = {}) {
  const entry = {
    id: `suite-${n}`,
    formatVersion: 2,
    tier: "external",
    review: { status: "draft", reviewedOn: null },
    cards: [],
    gameState: null,
    question: `Invented suite question ${n}?`,
    expected: { outcome: null, shortAnswer: "Short.", answer: `Invented suite answer ${n}.`, decidingRuleIds: [...new Set(groups.flat())] },
    suite: {
      name: "rulesguru",
      questionId: n,
      level,
      complexity,
      tags,
      citedRuleIds: cited ?? groups.map((group) => group[0]),
      ruleGroups: groups,
      excluded
    },
    source: { authority: "external-unapproved", publisher: "Invented", license: "used with permission, local only", questionId: n },
    layers: { requiredFacts: [], irrelevantFacts: [], variants: [] },
    whyHard: "invented"
  };
  entry.snapshot = computeSnapshot(entry, sourcesWith());
  return entry;
}

test("group scoring: any-reached and all-reached, with a bare-header group reached by any member", () => {
  const bare = suiteCase(1, { groups: [["702.16a", "702.16b"], ["613.1a"]], cited: ["702.16", "613.1a"] });
  assert.deepEqual(
    scoreSuiteCase(bare, new Set(["702.16b", "613.1a"])),
    { id: "suite-1", level: "1", complexity: "simple", sections: ["702", "613"], groupCount: 2, groupsReached: 2, anyReached: true, allReached: true }
  );
  const partial = scoreSuiteCase(bare, new Set(["702.16a"]));
  assert.equal(partial.anyReached, true);
  assert.equal(partial.allReached, false);
  const none = scoreSuiteCase(bare, new Set(["999.9"]));
  assert.equal(none.anyReached, false);
  assert.equal(none.allReached, false);
});

test("level, complexity and section splits are right, and misses list case ids only", () => {
  const cases = [
    suiteCase(1, { level: 0, groups: [["100.1"]] }),
    suiteCase(2, { level: 0, groups: [["100.1"], ["613.1a"]] }),
    suiteCase(3, { level: "corner", complexity: "complicated", groups: [["702.16a"]], cited: ["702.16"] })
  ];
  const reached = [new Set(["100.1"]), new Set(["100.1"]), new Set()];
  const results = cases.map((caseEntry, i) => scoreSuiteCase(caseEntry, reached[i]));
  const summary = summarizeSuite(results);
  assert.deepEqual(summary.total, { cases: 3, any: 2, all: 1 });
  assert.deepEqual(summary.byLevel, [
    ["0", { cases: 2, any: 2, all: 1 }],
    ["corner", { cases: 1, any: 0, all: 0 }]
  ]);
  assert.deepEqual(summary.byComplexity, [
    ["simple", { cases: 2, any: 2, all: 1 }],
    ["complicated", { cases: 1, any: 0, all: 0 }]
  ]);
  assert.deepEqual(summary.bySection, [
    ["100", { cases: 2, any: 2, all: 1 }],
    ["613", { cases: 1, any: 1, all: 0 }],
    ["702", { cases: 1, any: 0, all: 0 }]
  ]);
  const report = formatSuiteReport(results, {
    generatedAt: "2026-10-10T00:00:00.000Z",
    embeddingProvider: "local",
    counts: { total: 5, selected: 3, excluded: 1, unsupported: 0, filteredOut: 1, stale: 0 }
  });
  assert.match(report, /^LOCAL PRACTICE-SUITE RETRIEVAL REPORT/);
  assert.match(report, /Any cited rule group reached: 2\/3/);
  assert.match(report, /Every cited rule group reached: 1\/3/);
  assert.match(report, /suite-2 \(partial\)/);
  assert.match(report, /^ {2}suite-3$/m);
  assert.ok(!report.includes("Invented suite question"), "the report names case ids, never question text");
});

test("the retrieval path applies the shared filters and drops excluded, unsupported and stale cases, counted", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "suite-retrieval-"));
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, "cases"));
  const write = (c) => fs.writeFileSync(path.join(dir, "cases", `${c.id}.case.json`), JSON.stringify(c));
  write(suiteCase(1, { level: 0, tags: ["Combat"] }));
  write(suiteCase(2, { level: 1, tags: ["Combat"] }));
  write(suiteCase(3, { level: 1, tags: ["Stack"] }));
  write(suiteCase(4, { level: 1, tags: ["Unsupported answers"] }));
  write(suiteCase(5, { level: 1, excluded: "unresolved-card" }));
  write(suiteCase(6, { level: 0, tags: ["Combat"] }));

  const all = await loadSuiteSelection({ suiteDir: dir, sources: sourcesWith() });
  assert.deepEqual(all.selected.map((c) => c.id), ["suite-1", "suite-2", "suite-3", "suite-6"]);
  assert.deepEqual(all.counts, { total: 6, excluded: 1, unsupported: 1, filteredOut: 0, stale: 0, selected: 4 });

  const filtered = await loadSuiteSelection({
    suiteDir: dir,
    sources: sourcesWith(),
    filters: normalizeSuiteFilters({ level: ["0", "1"], suiteTag: "combat" })
  });
  assert.deepEqual(filtered.selected.map((c) => c.id), ["suite-1", "suite-2", "suite-6"]);

  const stale = await loadSuiteSelection({ suiteDir: dir, sources: sourcesWith(" changed") });
  assert.equal(stale.counts.stale, 4);
  assert.equal(stale.selected.length, 0);
});

test("parseArgs reads repeatable suite filters, and refuses suite flags without --suite", () => {
  const args = parseArgs(["--suite", "rulesguru", "--level", "0", "--level", "corner", "--complexity", "simple", "--suite-tag", "Combat", "--include-unsupported"]);
  assert.equal(args.suite, "rulesguru");
  assert.deepEqual(args.filters, { levels: ["0", "corner"], complexities: ["simple"], tags: ["Combat"], includeUnsupported: true });
  assert.equal(parseArgs([]).suite, undefined);
  assert.throws(() => parseArgs(["--level", "0"]), /only applies with --suite rulesguru/);
  assert.throws(() => parseArgs(["--suite", "other"]), /--suite must be "rulesguru"/);
  assert.throws(() => parseArgs(["--suite", "rulesguru", "--level", "9"]), /--level/);
  assert.equal(parseArgs(["--help"]).help, true);
  assert.match(USAGE, /--suite rulesguru/);
});

test("an --output outside the suite folder is refused; a path inside a temporary suite folder is accepted", () => {
  const suiteDir = fs.mkdtempSync(path.join(os.tmpdir(), "suite-report-"));
  test.after(() => fs.rmSync(suiteDir, { recursive: true, force: true }));
  const inside = resolveSuiteReportPath({ outputPath: path.join(suiteDir, "reports", "mine.txt"), suiteDir });
  assert.ok(inside.endsWith(path.join("reports", "mine.txt")));
  assert.throws(() => resolveSuiteReportPath({ outputPath: path.join(os.tmpdir(), "elsewhere.txt"), suiteDir }), /not the suite folder or inside it/);
  assert.throws(() => resolveSuiteReportPath({ outputPath: path.join(suiteDir, "..", "up.txt"), suiteDir }), /not the suite folder or inside it/);
  const byDefault = resolveSuiteReportPath({ suiteDir, generatedAt: "2026-10-10T12:34:56.789Z" });
  assert.ok(byDefault.endsWith(path.join("reports", "retrieval-20261010T123456Z.txt")));
});

test("the suite report is titled a local practice-suite report, and the suite path makes no provider call", () => {
  const report = formatSuiteReport([], { generatedAt: "t", counts: { total: 0, selected: 0, excluded: 0, unsupported: 0, filteredOut: 0, stale: 0 } });
  assert.match(report.split("\n")[0], /LOCAL PRACTICE-SUITE RETRIEVAL REPORT/);
  const source = fs.readFileSync(new URL("./eval-worked-solutions.mjs", import.meta.url), "utf8");
  assert.ok(!/openai|confirm-live-calls|OPENAI_API_KEY|createProvider/i.test(source.replace(/no provider call/g, "")), "the retrieval check imports no provider and names no live-call flag");
});
