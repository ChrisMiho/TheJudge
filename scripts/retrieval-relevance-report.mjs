// Retrieval relevance report (Slice D, REQ-032, DEC-047).
//
// Builds a digestible before/after relevance report for tuning review: one
// section per labeled scenario (fixtures with an `expected` block) listing the
// System 2 topics selected, the System 3 top-5 with scores, recall hit/miss per
// expected rule id, and forbidden-noise exclusion status.
//
// No HTTP server and no OpenAI calls — it imports the same modules the eval
// harness uses, so the report mirrors production selection (Slice A) and scoring
// (Slice B). Run via tsx so the backend TypeScript modules resolve:
//   npm run retrieval:report
//
// Exit code: 0 when every labeled expectation passes, 1 otherwise. The primary
// gate remains `npm run test:eval`; this is an optional CI adjunct / review aid.

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadGameRulesTopics } from "../apps/backend/src/gameRules.ts";
import { loadGameRulesRuleIndex } from "../apps/backend/src/gameRulesRetrieval.ts";
import { buildRetrievalReportInputs } from "../apps/backend/src/eval/retrievalReportInputs.ts";
import { buildRelevanceReport } from "../apps/backend/src/eval/contextEvaluationHarness.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturesDir = resolve(repoRoot, "apps/backend/src/eval/fixtures");
const topicsPath = resolve(repoRoot, "apps/backend/data/gameRulesByTopic.json");
const ruleIndexPath = resolve(repoRoot, "apps/backend/data/gameRulesRuleIndex.json");
const outputPath = resolve(repoRoot, "output/retrieval-relevance-report.txt");

async function loadLabeledFixtures() {
  const fileNames = await readdir(fixturesDir);
  const fixtureFiles = fileNames.filter((name) => name.endsWith(".fixture.json")).sort();
  const fixtures = await Promise.all(
    fixtureFiles.map(async (name) => JSON.parse(await readFile(join(fixturesDir, name), "utf8")))
  );
  return fixtures.filter((fixture) => fixture.expected);
}

async function main() {
  const allTopics = loadGameRulesTopics(topicsPath);
  const ruleIndex = loadGameRulesRuleIndex(ruleIndexPath);
  const fixtures = await loadLabeledFixtures();

  if (fixtures.length === 0) {
    console.error("[retrieval-report] No fixtures with an `expected` block found.");
    process.exit(1);
  }

  // Route each labeled fixture by its request mode: a lookup-mode fixture has no
  // gameContext, so it goes through the preparation pipeline rather than the
  // game-mode context builder (which would crash reading playerCount).
  const inputs = buildRetrievalReportInputs(fixtures, {
    gameRulesTopics: allTopics,
    gameRulesRuleIndex: ruleIndex
  });

  const report = buildRelevanceReport(inputs);

  console.log(report.text);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${report.text}\n`, "utf8");
  console.log(`\n[retrieval-report] Wrote ${outputPath}`);

  process.exit(report.allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error("[retrieval-report] Unexpected error:", error);
  process.exit(1);
});
