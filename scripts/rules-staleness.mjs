// The rules test corpus staleness report (REQ-225). No provider call, no
// network call, no embedder. It lists the cases whose rule, oracle or ruling
// text changed since their stored snapshot (the stale comparison in
// scripts/lib/gold-cases.mjs) and the cases awaiting a query-vector re-freeze
// (the re-freeze check beside the frozen vectors), then exits 0: it never edits
// a case, never fails a gate, and is not part of `quality:check`.
//
//   npm run eval:rules-staleness
//
// Run via tsx: the re-freeze check rebuilds each case's retrieval query text
// with the backend's TypeScript.

import { compareSnapshot, loadGoldCases, loadSnapshotSources } from "./lib/gold-cases.mjs";
import { buildCaseRequest, loadPromptResources } from "./lib/prompt-fidelity.mjs";

async function main() {
  const { loadFrozenVectors } = await import("../apps/backend/src/eval/rules-gate/frozenVectors.ts");
  const { buildStalenessReport, formatStalenessReport } = await import("../apps/backend/src/eval/rules-gate/stalenessReport.ts");

  const [cases, sources, resources] = await Promise.all([loadGoldCases(), loadSnapshotSources(), loadPromptResources()]);
  const report = buildStalenessReport({
    cases,
    sources,
    compareSnapshot,
    resources,
    vectors: loadFrozenVectors(),
    buildRequest: buildCaseRequest
  });
  process.stdout.write(formatStalenessReport(report));
}

main().catch((error) => {
  // Even a failure to read the data is only reported: this command is never a gate.
  console.error(error.message ?? error);
});
