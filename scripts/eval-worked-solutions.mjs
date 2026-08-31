// Worked-solutions retrieval check (NFR-018).
//
// For each committed real-world hard rules case under
// apps/backend/src/eval/fixtures/../worked-solutions/*.case.json, builds the
// same mode: "lookup" request shape a real player's question would produce and
// runs it through preparePromptInput -- the unmodified production
// prompt-preparation function -- to check whether the official rule the
// worked solution comes from actually surfaces in the System 3 supplemental
// retrieval a live prompt would receive.
//
// Informational only. This is never part of `npm run test`, `npm run
// test:eval`, `npm run coverage:check`, or `npm run quality:check`, makes no
// network call, and adds no new runtime dependency -- it reads only the
// already-committed rules corpus and imports only already-existing backend
// modules. See apps/backend/src/eval/worked-solutions/README.md.
//
// Run via tsx so the backend TypeScript modules resolve:
//   npm run eval:worked-solutions
//   npm run eval:worked-solutions -- --output output/worked-solutions-report.txt

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CASES_DIR = join(repoRoot, "apps/backend/src/eval/worked-solutions");

export function parseArgs(argv) {
  const getFlag = (name) => {
    const index = argv.indexOf(name);
    return index !== -1 && index + 1 < argv.length ? argv[index + 1] : undefined;
  };
  const outputPath = getFlag("--output");
  return { outputPath: outputPath ? resolve(repoRoot, outputPath) : undefined };
}

/** Reads every `*.case.json` file in the worked-solutions directory. */
export async function loadCases(casesDir = CASES_DIR) {
  const fileNames = (await readdir(casesDir)).filter((name) => name.endsWith(".case.json")).sort();
  const cases = [];
  for (const fileName of fileNames) {
    const parsed = JSON.parse(await readFile(join(casesDir, fileName), "utf8"));
    if (typeof parsed.id !== "string" || typeof parsed.question !== "string") {
      throw new Error(`Malformed worked-solutions case ${fileName}: needs at least id and question.`);
    }
    cases.push(parsed);
  }
  return cases;
}

/** One case's retrieval-recall result. */
export function evaluateCaseRecall(caseEntry, retrievedRuleIds) {
  const expected = caseEntry.expectedSupplementalRuleIds ?? [];
  const hit = expected.filter((ruleId) => retrievedRuleIds.has(ruleId));
  const missed = expected.filter((ruleId) => !retrievedRuleIds.has(ruleId));
  return { id: caseEntry.id, expected, hit, missed, passed: expected.length > 0 && missed.length === 0 };
}

export function formatReport(results, { generatedAt }) {
  const passedCount = results.filter((result) => result.passed).length;
  const lines = [
    "WORKED-SOLUTIONS RETRIEVAL CHECK (NFR-018)",
    `Generated: ${generatedAt}`,
    `Cases: ${results.length}`,
    "",
    "Informational only. Not a build gate -- checks whether System 3 supplemental",
    "retrieval surfaces the official rule a real, hard, worked-solution question",
    "needs, using the production preparePromptInput code path unmodified.",
    ""
  ];
  for (const result of results) {
    const status = result.passed ? "HIT " : "MISS";
    lines.push(
      `[${status}] ${result.id} -- expected ${JSON.stringify(result.expected)}` +
        (result.missed.length > 0 ? `, missing ${JSON.stringify(result.missed)}` : "")
    );
  }
  lines.push("", `Summary: ${passedCount}/${results.length} cases retrieved their expected rule.`);
  return `${lines.join("\n")}\n`;
}

async function runLive() {
  const { preparePromptInput } = await import("../apps/backend/src/prompt/preparation.ts");
  const { loadGameRulesTopics } = await import("../apps/backend/src/gameRules.ts");
  const { loadGameRulesRuleIndex } = await import("../apps/backend/src/gameRulesRetrieval.ts");

  const gameRulesTopics = loadGameRulesTopics(join(repoRoot, "apps/backend/data/gameRulesByTopic.json"));
  const gameRulesRuleIndex = loadGameRulesRuleIndex(join(repoRoot, "apps/backend/data/gameRulesRuleIndex.json"));

  const cases = await loadCases();
  const results = [];
  for (const caseEntry of cases) {
    const prepared = preparePromptInput(
      { mode: "lookup", question: caseEntry.question },
      { gameRulesTopics, gameRulesRuleIndex, collectEnrichmentDebug: true }
    );
    const retrievedRuleIds = new Set(
      (prepared.enrichmentDebug?.supplemental.selected ?? []).map((rule) => rule.ruleId)
    );
    results.push(evaluateCaseRecall(caseEntry, retrievedRuleIds));
  }

  const report = formatReport(results, { generatedAt: new Date().toISOString() });
  process.stdout.write(report);

  const { outputPath } = parseArgs(process.argv.slice(2));
  if (outputPath) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, report, "utf8");
    console.log(`Wrote ${outputPath}`);
  }
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  runLive().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
