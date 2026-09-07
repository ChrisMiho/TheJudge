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

function validCase(overrides = {}) {
  return {
    id: "sample",
    tier: 1,
    question: "Sample question?",
    workedSolution: "Sample worked solution text.",
    expectedSupplementalRuleIds: ["100.1"],
    whyHard: "Sample reason this is hard.",
    source: {
      publisher: "Wizards of the Coast",
      license: "Reproduced under the Wizards of the Coast Fan Content Policy.",
      ruleId: "100.1"
    },
    ...overrides
  };
}

test("loadCases reads every *.case.json file, sorted, and rejects a malformed one (via the shared gold-cases validator, REQ-185)", async () => {
  const dir = makeTempCasesDir([
    validCase({ id: "b" }),
    validCase({ id: "a" })
  ]);

  const cases = await loadCases(dir);

  assert.deepEqual(
    cases.map((c) => c.id),
    ["b", "a"]
  );

  fs.writeFileSync(path.join(dir, "z-bad.case.json"), JSON.stringify({ id: "bad" }), "utf8");
  await assert.rejects(() => loadCases(dir), /Invalid gold case\(s\)/);
});

test("evaluateCaseRecall reports a hit only when every expected rule id was retrieved", () => {
  const caseEntry = { id: "example", expectedSupplementalRuleIds: ["613.9", "704.4"] };

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
  const tier2 = { id: "sensei", tier: 2, expectedSupplementalRuleIds: ["113.7a"] };
  const results = [
    evaluateCaseRecall(tier2, new Set(["113.7a", "603.2"]), { usedSemantic: true }),
    evaluateCaseRecall({ id: "bare", expectedSupplementalRuleIds: ["510.1c"] }, new Set(), { usedSemantic: false })
  ];
  assert.equal(results[0].usedSemantic, true);
  assert.equal(results[0].passed, true);

  const report = formatReport(results, { generatedAt: "2026-09-07T00:00:00.000Z", embeddingProvider: "local" });

  assert.match(report, /Embedding provider: local \(1\/2 cases ranked semantically\)/);
  assert.match(report, /\[HIT \] sensei \(semantic\)/);
  assert.match(report, /\[MISS\] bare \(lexical\)/);
});
