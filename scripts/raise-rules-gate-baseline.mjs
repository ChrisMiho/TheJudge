// REQ-222: the explicit command that raises the offline prompt gate's ratchet
// baseline. It runs the gate over the corpus and records each scored case's
// hit and miss lists. It refuses while any recorded hit has been lost, unless
// `--allow-regressions` says the loss is accepted. A case awaiting a vector
// re-freeze keeps its previous entry. No model call, no network, no embedder:
// the gate ranks with the committed frozen vectors.
//
//   npm run eval:rules-gate:baseline
//   npm run eval:rules-gate:baseline -- --allow-regressions

import { loadGateInputs, writeFormattedJson } from "./lib/rules-gate-inputs.mjs";

async function main() {
  const allowRegressions = process.argv.includes("--allow-regressions");
  const { BASELINE_PATH, loadBaseline } = await import("../apps/backend/src/eval/rules-gate/baseline.ts");
  const { loadFrozenVectors } = await import("../apps/backend/src/eval/rules-gate/frozenVectors.ts");
  const { evaluateRulesGate, raiseBaseline } = await import("../apps/backend/src/eval/rules-gate/rulesGate.ts");

  const inputs = await loadGateInputs();
  const previous = loadBaseline();
  const outcome = evaluateRulesGate({ ...inputs, vectors: loadFrozenVectors(), baseline: previous });
  // Card, state and vector failures are not a ratchet matter: fix them before recording a baseline.
  const failing = outcome.results.filter((result) => result.failures.length > 0);
  if (failing.length > 0) {
    console.log(outcome.report);
    throw new Error(`Refusing to record a baseline while ${failing.length} case(s) fail the gate's card, state or vector checks.`);
  }
  const { baseline, regressions, added } = raiseBaseline(previous, outcome.results, { allowRegressions });
  await writeFormattedJson(BASELINE_PATH, baseline);
  console.log(outcome.report);
  console.log(`Wrote ${BASELINE_PATH} (${Object.keys(baseline.cases).length} cases).`);
  if (added.length > 0) console.log(`Newly recorded hits: ${added.join("; ")}`);
  if (regressions.length > 0) console.log(`Accepted regressions: ${regressions.join(", ")}`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
