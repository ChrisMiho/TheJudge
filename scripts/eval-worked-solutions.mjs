// Worked-solutions retrieval check (NFR-018).
//
// For each committed real-world hard rules case under
// apps/backend/src/eval/worked-solutions/*.case.json, builds the same
// mode: "lookup" request a real player's question would produce -- a tier-2
// case with its cited card attached (scripts/lib/prompt-fidelity.mjs,
// REQ-185) -- and runs it through preparePromptInput, the unmodified
// production prompt-preparation function, with the inputs the route handler
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

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CASES_DIR, loadGoldCases } from "./lib/gold-cases.mjs";
import {
  buildCaseRequest,
  buildEmbedder,
  describeRetrieval,
  embedGoldCaseQueries,
  loadPromptResources
} from "./lib/prompt-fidelity.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export { CASES_DIR };

export function parseArgs(argv) {
  const getFlag = (name) => {
    const index = argv.indexOf(name);
    return index !== -1 && index + 1 < argv.length ? argv[index + 1] : undefined;
  };
  const outputPath = getFlag("--output");
  return { outputPath: outputPath ? resolve(repoRoot, outputPath) : undefined };
}

/**
 * Reads every `*.case.json` file in the worked-solutions directory through
 * the shared gold-case loader (REQ-185), so this retrieval check and the
 * answer-quality run never diverge into separate readers of the same files.
 */
export async function loadCases(casesDir = CASES_DIR) {
  return loadGoldCases(casesDir);
}

/** One case's retrieval-recall result. `usedSemantic` says which ranking produced it (absent = unknown). */
export function evaluateCaseRecall(caseEntry, retrievedRuleIds, { usedSemantic } = {}) {
  const expected = caseEntry.expectedSupplementalRuleIds ?? [];
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
    const retrieval = describeRetrieval(prepared.enrichmentDebug?.supplemental, caseEntry.expectedSupplementalRuleIds, {
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
  runLive().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
