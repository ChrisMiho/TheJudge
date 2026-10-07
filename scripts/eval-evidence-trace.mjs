// The offline evidence trace (REQ-229). For every approved case it shows where
// each deciding rule ranked, whether System 3 selected it, whether a curated
// topic carries it, and whether its text reached the final prompt -- for the
// checkout this command runs from. No provider call, no network call, no
// embedder call over a network: the ranking uses the committed frozen query
// vectors (REQ-222), and a case awaiting a re-freeze is embedded here by the
// bundled local model and labelled.
//
// It measures the checkout it runs from and imports nothing from another
// checkout. It refuses a checkout with uncommitted changes, records its commit
// in the trace folder's `trace.json`, and writes
// `output/evidence-trace/<name>/` (gitignored). Two revisions are compared by
// running it from each revision's own worktree and then
// `npm run eval:evidence-trace:compare -- <folder-a> <folder-b>`.
//
//   npm run eval:evidence-trace                        # folder named by the commit
//   npm run eval:evidence-trace -- --out head          # output/evidence-trace/head/
//   npm run eval:evidence-trace -- --expect-commit 07cc3ab6
//
// Never a gate. Run via tsx so the backend TypeScript resolves.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertCheckoutReady, defaultGit, validateRunId } from "./lib/experiment-run.mjs";
import { PRODUCTION_CAP, TRACE_OUTPUT_DIR, buildTrace, checkBaselineParity, summarizeTrace, writeTraceFolder } from "./lib/evidence-trace.mjs";
import { loadGoldCases } from "./lib/gold-cases.mjs";
import { buildEmbedder, loadPromptResources } from "./lib/prompt-fidelity.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function parseTraceArgs(argv) {
  const parsed = { out: null, expectCommit: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") parsed.out = argv[++i];
    else if (argv[i] === "--expect-commit") parsed.expectCommit = argv[++i];
  }
  if (parsed.out !== null) validateRunId(parsed.out);
  return parsed;
}

/**
 * Runs the trace with every dependency injectable; `main` supplies the real ones.
 * Approved cases only: a draft or rejected case has no approved deciding rules to hold up.
 */
export async function runEvidenceTrace({ argv = [], git, loadCases, loadResources, loadTs, outputRoot, log = console.log }) {
  const args = parseTraceArgs(argv);
  const commit = await assertCheckoutReady({ git, expectCommit: args.expectCommit });
  const cases = (await loadCases()).filter((caseEntry) => caseEntry.review.status === "approved");
  const resources = await loadResources();
  const ts = await loadTs(resources);
  log(`Tracing ${cases.length} approved cases from commit ${commit.slice(0, 8)} (offline).`);

  const traced = await buildTrace({
    cases,
    resources,
    parseRequest: ts.parseRequest,
    freezeCheck: ts.freezeCheck,
    prepare: ts.prepare,
    embedLocal: ts.embedLocal,
    productionCap: PRODUCTION_CAP
  });
  const parity = checkBaselineParity({ traced, baseline: ts.baseline });
  const name = args.out ?? commit.slice(0, 8);
  const { folder, trace } = await writeTraceFolder({
    outputRoot,
    name,
    commit,
    productionCap: PRODUCTION_CAP,
    ruleIndexSize: resources.gameRulesRuleIndex.length,
    traced,
    parity
  });

  const summary = summarizeTrace(traced);
  log(`Wrote ${folder}/trace.json`);
  log(
    `  ${summary.cases} cases: ${summary.everyDecidingRuleSelected} with every deciding rule selected in search, ` +
      `${summary.goldRuleInPrompt} with a deciding rule among the selections (goldRuleInPrompt), ` +
      `${summary.completeProcedure} with the complete procedure available to the answer, ` +
      `${summary.awaitingRefreeze} ranked with a locally embedded vector.`
  );
  log(`  rules gate baseline: ${parity.checked} cases held against baseline.json, ${parity.agree} agree, ${parity.divergences.length} diverge (${parity.skipped} not scored).`);
  for (const divergence of parity.divergences) {
    log(`    DIVERGES ${divergence.caseId}: trace hit [${divergence.trace.hit.join(", ")}] miss [${divergence.trace.miss.join(", ")}]; baseline hit [${divergence.baseline.hit.join(", ")}] miss [${divergence.baseline.miss.join(", ")}]`);
  }
  return { folder, trace, parity };
}

/** The real dependencies: the backend's own prompt builder, the committed frozen vectors and baseline, the bundled local embedder. */
export async function defaultTraceDeps() {
  const { preparePromptInput, buildRetrievalQueryText } = await import("../apps/backend/src/prompt/preparation.ts");
  const { loadFrozenVectors, checkReFreeze } = await import("../apps/backend/src/eval/rules-gate/frozenVectors.ts");
  const { loadBaseline } = await import("../apps/backend/src/eval/rules-gate/baseline.ts");
  const { parseCaseRequest } = await import("./lib/rules-gate-inputs.mjs");
  return {
    loadCases: loadGoldCases,
    loadResources: () => loadPromptResources(),
    loadTs: async (resources) => {
      const vectors = loadFrozenVectors();
      // A case awaiting a re-freeze is embedded by the bundled local model, in process: no network (REQ-181).
      let embedder = null;
      return {
        parseRequest: parseCaseRequest,
        freezeCheck: (caseId, request) => checkReFreeze(caseId, request, resources.cardDetailIndex, vectors),
        prepare: preparePromptInput,
        embedLocal: async (request) => {
          embedder ??= await buildEmbedder({ EMBEDDING_PROVIDER: "local" });
          return embedder.embed(buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex }));
        },
        baseline: loadBaseline()
      };
    }
  };
}

async function main() {
  await runEvidenceTrace({
    argv: process.argv.slice(2),
    git: await defaultGit(repoRoot),
    outputRoot: resolve(repoRoot, TRACE_OUTPUT_DIR),
    ...(await defaultTraceDeps())
  });
}

const invokedPath = process.argv[1] ? new URL(`file://${resolve(process.argv[1])}`).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
}

