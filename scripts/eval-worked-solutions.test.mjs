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
