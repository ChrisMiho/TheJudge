// The mechanic coverage gate (REQ-223), run against the real corpus as part of
// `npm run test:scripts`, and so inside `npm run quality:check`. It reads only
// committed files -- the corpus, the committed rule index, the committed
// excluded list and the committed coverage file -- and makes no provider call,
// no network call and no embedding call.
//
// It fails when a real mechanic in the committed rule index (other than the
// owner's excluded ones) has no draft, approved or needs-edit case, when the
// excluded list names a rule number the index lacks, or when the committed
// coverage file is out of date with the corpus. The fix for the last is to run
// `npm run eval:rules-coverage` (the review apply command does it for you).

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { deriveTags, loadGoldCases, loadSnapshotSources, mechanicPrefixes } from "./lib/gold-cases.mjs";
import { checkCoverageGate, listMechanics } from "./lib/rules-coverage.mjs";
import { COVERAGE_PATH, loadExcludedMechanics } from "./rules-coverage.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("the coverage gate passes on the real corpus: every real mechanic has a case, the excluded list is sound, and coverage.json is current", async () => {
  const [cases, sources, excluded, committed] = await Promise.all([
    loadGoldCases(),
    loadSnapshotSources(),
    loadExcludedMechanics(),
    readFile(COVERAGE_PATH, "utf8").then(JSON.parse)
  ]);
  const result = checkCoverageGate({ cases, ruleIndex: sources.ruleIndex, excluded, committed });
  assert.deepEqual(result.failures, [], result.failures.join("\n"));
  assert.equal(result.ok, true);
});

test("the gate is wired into quality:check through test:scripts, which runs every scripts/*.test.mjs", async () => {
  const pkg = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
  assert.match(pkg.scripts["quality:check"], /npm run test:scripts/);
  assert.match(pkg.scripts["test:scripts"], /scripts\/\*\.test\.mjs/);
});

test("each mechanic case lists its mechanic's own 701/702 rule as a deciding rule, and its derived mechanic tag matches", async () => {
  const [cases, sources] = await Promise.all([loadGoldCases(), loadSnapshotSources()]);
  const mechanicIds = new Set(listMechanics(sources.ruleIndex).map((mechanic) => mechanic.id));
  const mechanicCases = cases.filter((caseEntry) => caseEntry.source?.pool === "mechanic");
  assert.ok(mechanicCases.length > 0, "the corpus holds mechanic cases");

  for (const caseEntry of mechanicCases) {
    const prefixes = mechanicPrefixes(caseEntry.expected.decidingRuleIds);
    assert.equal(prefixes.length, 1, `${caseEntry.id}: a mechanic case is about exactly one mechanic`);
    assert.ok(mechanicIds.has(prefixes[0]), `${caseEntry.id}: ${prefixes[0]} is a mechanic in the committed rule index`);
    assert.ok(
      caseEntry.expected.decidingRuleIds.some((ruleId) => ruleId.startsWith(`${prefixes[0]}`)),
      `${caseEntry.id}: lists the mechanic's own rule`
    );
    assert.ok(caseEntry.tags.includes(`mechanic:${prefixes[0]}`), `${caseEntry.id}: derived tag matches`);
    assert.deepEqual(caseEntry.tags, deriveTags(caseEntry));
  }
  // One case per mechanic: two mechanic cases never cover the same mechanic.
  const covered = mechanicCases.map((caseEntry) => mechanicPrefixes(caseEntry.expected.decidingRuleIds)[0]);
  assert.equal(new Set(covered).size, covered.length, "no mechanic has two run-1 mechanic cases");
});

test("a mechanic case is never approved by an agent: every mechanic case that is not yet reviewed is a draft", async () => {
  const cases = await loadGoldCases();
  for (const caseEntry of cases.filter((candidate) => candidate.source?.pool === "mechanic")) {
    if (caseEntry.review.status === "draft") {
      assert.equal(caseEntry.review.reviewedOn, null, `${caseEntry.id}: a draft has no review date`);
    } else {
      // Only the owner's review apply command moves a case on, and it always records a date.
      assert.match(caseEntry.review.reviewedOn, /^\d{4}-\d{2}-\d{2}$/, `${caseEntry.id}: a reviewed case records when`);
    }
  }
});
