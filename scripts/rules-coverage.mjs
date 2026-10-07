// The rules test corpus coverage command (REQ-223). No provider call, no
// network call, no embedder: it reads the committed rule index, the committed
// excluded-mechanics list and the corpus, prints the coverage report, and
// rewrites the counts-only committed coverage file
// (apps/backend/src/eval/answer-quality/coverage.json, REQ-189). The review
// apply command (scripts/rules-review.mjs) rewrites the same file after it
// writes verdicts, through `rewriteCoverage` below.
//
//   npm run eval:rules-coverage
//
// An uncovered mechanic is report output here, never a failure: the failing
// check is the coverage gate (scripts/lib/rules-coverage.mjs, checkCoverageGate),
// which a test runs in `quality:check`.

import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CASES_DIR, loadGoldCases, loadSnapshotSources } from "./lib/gold-cases.mjs";
import { buildCoverageFile, computeCoverage, formatCoverageReport, listMechanics, validateExcludedList } from "./lib/rules-coverage.mjs";
import { writeFormattedJson } from "./lib/write-formatted-json.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const COVERAGE_PATH = join(repoRoot, "apps/backend/src/eval/answer-quality/coverage.json");
export const EXCLUDED_PATH = join(repoRoot, "apps/backend/src/eval/worked-solutions/excluded-mechanics.json");

/** The committed excluded list's entries; throws, naming the problems, if the file is malformed. */
export async function loadExcludedMechanics(path = EXCLUDED_PATH) {
  const file = JSON.parse(await readFile(path, "utf8"));
  const problems = validateExcludedList(file);
  if (problems.length > 0) throw new Error(`Invalid excluded-mechanics list:\n${problems.join("\n")}`);
  return file.excluded;
}

/**
 * Recomputes coverage from the corpus and writes the counts-only coverage file.
 * Returns the report text and the file it wrote. `ruleIndex` is the committed
 * rule index (the snapshot sources carry it).
 */
export async function rewriteCoverage({ cases, ruleIndex, excluded, path = COVERAGE_PATH }) {
  const mechanics = listMechanics(ruleIndex);
  const coverage = computeCoverage({ cases, mechanics, excluded });
  const file = buildCoverageFile(coverage);
  await writeFormattedJson(path, file);
  return { report: formatCoverageReport({ coverage, mechanics, excluded }), file, coverage };
}

export async function coverageCommand({
  casesDir = CASES_DIR,
  loadCases = loadGoldCases,
  loadSources = loadSnapshotSources,
  excludedPath = EXCLUDED_PATH,
  coveragePath = COVERAGE_PATH,
  log = console.log
} = {}) {
  const [cases, sources, excluded] = await Promise.all([loadCases(casesDir), loadSources(), loadExcludedMechanics(excludedPath)]);
  const result = await rewriteCoverage({ cases, ruleIndex: sources.ruleIndex, excluded, path: coveragePath });
  log(result.report);
  log(`Wrote ${coveragePath}`);
  return result;
}

const invokedPath = process.argv[1] ? new URL(`file://${resolve(process.argv[1])}`).href : "";
if (import.meta.url === invokedPath) {
  coverageCommand().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
