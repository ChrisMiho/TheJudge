// Worked-solutions retrieval check (NFR-018).
//
// For each non-rejected rules test case under
// apps/backend/src/eval/worked-solutions/*.case.json, builds the same
// request a real player's question would produce -- every card the case
// names attached, or an In-Depth request for a case with a game state
// (buildCaseRequest in scripts/lib/prompt-fidelity.mjs, REQ-185) -- and runs
// it through preparePromptInput, the unmodified production
// prompt-preparation function, with the inputs the route handler
// supplies: the committed card-detail and card-rulings indexes and the
// question embedded by EMBEDDING_PROVIDER (default `local`, what production
// runs; `mock` for a deliberately lexical pass). It checks whether the
// official rule the worked solution comes from actually surfaces in the
// System 3 supplemental retrieval a live prompt would receive, and refuses
// to report a run whose embedder silently fell back to lexical ranking.
//
// Informational only. This is never part of `npm run test`, `npm run
// test:eval`, `npm run coverage:check`, or `npm run quality:check`, makes no
// network call (the local embedder runs in process from the committed model
// cache), and adds no new runtime dependency -- it reads only the
// already-committed data and imports only already-existing backend modules.
// See apps/backend/src/eval/worked-solutions/README.md.
//
// Run via tsx so the backend TypeScript modules resolve:
//   npm run eval:worked-solutions
//   npm run eval:worked-solutions -- --output output/worked-solutions-report.txt
//   EMBEDDING_PROVIDER=mock npm run eval:worked-solutions   # lexical-only pass
//
// `--suite rulesguru` runs the same check over the local practice suite
// (REQ-232; used with permission, local only) instead of the corpus: cases are
// read from the suite folder in the loader's external mode, filtered by
// `--level`, `--complexity`, `--suite-tag` and `--include-unsupported`, scored
// by rule group, and reported split by level, complexity and rules section.
// The report is written under the suite folder's `reports/` and is never
// committed. Still free: no provider call, the local embedder runs in process.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CASES_DIR, compareSnapshot, loadGoldCases, loadSnapshotSources } from "./lib/gold-cases.mjs";
import {
  buildCaseRequest,
  buildEmbedder,
  describeRetrieval,
  embedGoldCaseQueries,
  loadPromptResources
} from "./lib/prompt-fidelity.mjs";
import {
  SUITE_DIR,
  SUITE_COMPLEXITIES,
  SUITE_LEVELS,
  assertSuiteIgnored,
  normalizeSuiteFilters,
  resolveInsideSuite,
  selectSuiteCases
} from "./lib/rulesguru-suite.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export { CASES_DIR };

const SUITE_FLAGS = ["--level", "--complexity", "--suite-tag", "--include-unsupported"];

export function parseArgs(argv) {
  const getFlag = (name) => {
    const index = argv.indexOf(name);
    return index !== -1 && index + 1 < argv.length ? argv[index + 1] : undefined;
  };
  const getAll = (name) => argv.flatMap((arg, index) => (arg === name && index + 1 < argv.length ? [argv[index + 1]] : []));
  const outputPath = getFlag("--output");
  const suite = getFlag("--suite");
  if (suite !== undefined && suite !== "rulesguru") throw new Error(`--suite must be "rulesguru", got "${suite}"`);
  if (suite === undefined) {
    const stray = SUITE_FLAGS.find((flag) => argv.includes(flag));
    if (stray) throw new Error(`${stray} only applies with --suite rulesguru`);
  }
  const filters = normalizeSuiteFilters({
    level: getAll("--level"),
    complexity: getAll("--complexity"),
    suiteTag: getAll("--suite-tag"),
    includeUnsupported: argv.includes("--include-unsupported")
  });
  return { outputPath: outputPath ? resolve(repoRoot, outputPath) : undefined, suite, filters, help: argv.includes("--help") };
}

export const USAGE = [
  "Usage: npm run eval:worked-solutions -- [--output <file>]",
  "       npm run eval:worked-solutions -- --suite rulesguru [--level <0|1|2|3|corner>]... [--complexity <simple|intermediate|complicated>]...",
  "                                          [--suite-tag <tag>]... [--include-unsupported] [--output <file inside the suite folder>]",
  "",
  "Free and offline. The suite mode reads the local practice suite and writes its report under the suite folder's reports/."
].join("\n");

/**
 * Reads every `*.case.json` file in the worked-solutions directory through
 * the shared gold-case loader (REQ-185), so this retrieval check and the
 * answer-quality run never diverge into separate readers of the same files.
 * A rejected case stays in the corpus but is not checked.
 */
export async function loadCases(casesDir = CASES_DIR) {
  const cases = await loadGoldCases(casesDir);
  return cases.filter((caseEntry) => caseEntry.review.status !== "rejected");
}

/** One case's retrieval-recall result. `usedSemantic` says which ranking produced it (absent = unknown). */
export function evaluateCaseRecall(caseEntry, retrievedRuleIds, { usedSemantic } = {}) {
  const expected = caseEntry.expected?.decidingRuleIds ?? [];
  const hit = expected.filter((ruleId) => retrievedRuleIds.has(ruleId));
  const missed = expected.filter((ruleId) => !retrievedRuleIds.has(ruleId));
  const result = { id: caseEntry.id, expected, hit, missed, passed: expected.length > 0 && missed.length === 0 };
  if (typeof usedSemantic === "boolean") result.usedSemantic = usedSemantic;
  return result;
}

export function formatReport(results, { generatedAt, embeddingProvider }) {
  const passedCount = results.filter((result) => result.passed).length;
  const semanticCount = results.filter((result) => result.usedSemantic === true).length;
  const lines = [
    "WORKED-SOLUTIONS RETRIEVAL CHECK (NFR-018)",
    `Generated: ${generatedAt}`,
    `Cases: ${results.length}`,
    ...(embeddingProvider
      ? [`Embedding provider: ${embeddingProvider} (${semanticCount}/${results.length} cases ranked semantically)`]
      : []),
    "",
    "Informational only. Not a build gate -- checks whether System 3 supplemental",
    "retrieval surfaces the official rule a real, hard, worked-solution question",
    "needs, using the production preparePromptInput code path unmodified, with",
    "the inputs a player's lookup supplies (card attached, question embedded).",
    ""
  ];
  for (const result of results) {
    const status = result.passed ? "HIT " : "MISS";
    const ranking = result.usedSemantic === undefined ? "" : result.usedSemantic ? " (semantic)" : " (lexical)";
    lines.push(
      `[${status}] ${result.id}${ranking} -- expected ${JSON.stringify(result.expected)}` +
        (result.missed.length > 0 ? `, missing ${JSON.stringify(result.missed)}` : "")
    );
  }
  lines.push("", `Summary: ${passedCount}/${results.length} cases retrieved their expected rule.`);
  return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// Local practice suite (REQ-232)
// ---------------------------------------------------------------------------

/**
 * Scores one suite case by rule group. A group reached the prompt when any rule
 * id in it did; the case is any-reached when at least one group did and
 * all-reached when every group did.
 */
export function scoreSuiteCase(caseEntry, retrievedRuleIds) {
  const groups = caseEntry.suite?.ruleGroups ?? [];
  const reached = groups.map((group) => group.some((ruleId) => retrievedRuleIds.has(ruleId)));
  const sections = [...new Set((caseEntry.suite?.citedRuleIds ?? []).map((ruleId) => /^(\d{3})/.exec(ruleId)?.[1]).filter(Boolean))];
  return {
    id: caseEntry.id,
    level: String(caseEntry.suite?.level),
    complexity: String(caseEntry.suite?.complexity),
    sections,
    groupCount: groups.length,
    groupsReached: reached.filter(Boolean).length,
    anyReached: reached.some(Boolean),
    allReached: groups.length > 0 && reached.every(Boolean)
  };
}

function tally(results, keysOf, order) {
  const rows = new Map();
  for (const result of results) {
    for (const key of keysOf(result)) {
      const row = rows.get(key) ?? { cases: 0, any: 0, all: 0 };
      row.cases += 1;
      if (result.anyReached) row.any += 1;
      if (result.allReached) row.all += 1;
      rows.set(key, row);
    }
  }
  const rank = (key) => (order.includes(key) ? order.indexOf(key) : order.length);
  return [...rows.entries()].sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b, undefined, { numeric: true }));
}

/** Totals and the level, complexity and rules-section splits. A case counts under each section it cites. */
export function summarizeSuite(results) {
  return {
    total: { cases: results.length, any: results.filter((r) => r.anyReached).length, all: results.filter((r) => r.allReached).length },
    byLevel: tally(results, (r) => [r.level], SUITE_LEVELS),
    byComplexity: tally(results, (r) => [r.complexity], SUITE_COMPLEXITIES),
    bySection: tally(results, (r) => r.sections, [])
  };
}

export function formatSuiteReport(results, { generatedAt, embeddingProvider, counts }) {
  const summary = summarizeSuite(results);
  const split = (title, rows) => [
    "",
    title,
    ...rows.map(([key, row]) => `  ${key}: ${row.cases} cases, any cited rule reached ${row.any}, every cited rule reached ${row.all}`)
  ];
  const lines = [
    "LOCAL PRACTICE-SUITE RETRIEVAL REPORT (REQ-232) -- local only, not committed",
    `Generated: ${generatedAt}`,
    ...(embeddingProvider ? [`Embedding provider: ${embeddingProvider}`] : []),
    `Selected: ${counts.selected} of ${counts.total} suite cases (dropped: ${counts.excluded} excluded, ${counts.unsupported} unsupported-answer, ${counts.filteredOut} outside the filters, ${counts.stale} stale)`,
    "",
    "Informational only. Not a build gate. Checks whether the rule groups a suite question cites",
    "reached the production prompt; the suite's answers are never ground truth.",
    "",
    `Any cited rule group reached: ${summary.total.any}/${summary.total.cases}`,
    `Every cited rule group reached: ${summary.total.all}/${summary.total.cases}`,
    ...split("By level:", summary.byLevel),
    ...split("By complexity:", summary.byComplexity),
    ...split("By Comprehensive Rules section (a case counts under each section it cites):", summary.bySection),
    "",
    "Cases where not every cited rule group reached the prompt (by case id):",
    ...results.filter((r) => !r.allReached).map((r) => `  ${r.id}${r.anyReached ? " (partial)" : ""}`),
    ""
  ];
  return `${lines.join("\n")}\n`;
}

/** The report path: `--output` must resolve inside the suite folder; the default is a timestamped file in `reports/`. */
export function resolveSuiteReportPath({ outputPath, suiteDir = SUITE_DIR, generatedAt = new Date().toISOString() }) {
  if (outputPath) return resolveInsideSuite(outputPath, { suiteDir });
  const stamp = generatedAt.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  return resolveInsideSuite(join(suiteDir, "reports", `retrieval-${stamp}.txt`), { suiteDir });
}

/**
 * Loads the suite's cases in external mode and applies the shared filters,
 * dropping excluded, unsupported-answer and stale cases (all counted).
 */
export async function loadSuiteSelection({ suiteDir = SUITE_DIR, filters = normalizeSuiteFilters(), sources } = {}) {
  const cases = await loadGoldCases(join(suiteDir, "cases"), { external: true });
  const snapshotSources = sources ?? (await loadSnapshotSources());
  return selectSuiteCases(cases, filters, { isStale: (caseEntry) => compareSnapshot(caseEntry, snapshotSources).stale });
}

async function runSuiteLive({ filters, outputPath }) {
  assertSuiteIgnored();
  const generatedAt = new Date().toISOString();
  const reportPath = resolveSuiteReportPath({ outputPath, generatedAt });
  const { selected, counts } = await loadSuiteSelection({ filters });

  const { preparePromptInput } = await import("../apps/backend/src/prompt/preparation.ts");
  const resources = await loadPromptResources();
  const embedder = await buildEmbedder(process.env);
  const queryEmbeddingByCaseId = await embedGoldCaseQueries({
    goldCases: selected,
    embedder,
    cardDetailIndex: resources.cardDetailIndex
  });
  const results = [];
  for (const caseEntry of selected) {
    const prepared = preparePromptInput(buildCaseRequest(caseEntry), {
      ...resources,
      queryEmbedding: queryEmbeddingByCaseId.get(caseEntry.id) ?? null,
      collectEnrichmentDebug: true
    });
    const retrieval = describeRetrieval(prepared.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, {
      requireSemantic: embedder.mode !== "mock",
      caseId: caseEntry.id
    });
    results.push(scoreSuiteCase(caseEntry, new Set(retrieval.selectedRuleIds)));
  }

  const report = formatSuiteReport(results, { generatedAt, embeddingProvider: embedder.mode, counts });
  process.stdout.write(report);
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report, "utf8");
  console.log(`Wrote ${reportPath}`);
}

async function runLive() {
  const { preparePromptInput } = await import("../apps/backend/src/prompt/preparation.ts");
  const resources = await loadPromptResources();
  const embedder = await buildEmbedder(process.env);

  const cases = await loadCases();
  const queryEmbeddingByCaseId = await embedGoldCaseQueries({
    goldCases: cases,
    embedder,
    cardDetailIndex: resources.cardDetailIndex
  });
  const results = [];
  for (const caseEntry of cases) {
    const prepared = preparePromptInput(buildCaseRequest(caseEntry), {
      ...resources,
      queryEmbedding: queryEmbeddingByCaseId.get(caseEntry.id) ?? null,
      collectEnrichmentDebug: true
    });
    const retrieval = describeRetrieval(prepared.enrichmentDebug?.supplemental, caseEntry.expected?.decidingRuleIds, {
      requireSemantic: embedder.mode !== "mock",
      caseId: caseEntry.id
    });
    results.push(
      evaluateCaseRecall(caseEntry, new Set(retrieval.selectedRuleIds), { usedSemantic: retrieval.usedSemantic })
    );
  }

  const report = formatReport(results, { generatedAt: new Date().toISOString(), embeddingProvider: embedder.mode });
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
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  const run = args.help
    ? async () => console.log(USAGE)
    : args.suite
      ? () => runSuiteLive(args)
      : runLive;
  run().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
