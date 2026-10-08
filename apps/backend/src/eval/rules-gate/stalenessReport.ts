// REQ-225: the staleness report. Lists every non-rejected rules test case whose
// stored `snapshot` hashes no longer match the committed rule, oracle and ruling
// text (naming each dependency that changed), and every case awaiting a
// query-vector re-freeze (REQ-222: its query text changed since its vector was
// frozen). It only reads and reports: it never edits a case, never fails a
// build, and is not part of `quality:check`, so it can never block the weekly
// `data:refresh-pr`.
//
// Both findings come from the one comparison that owns them. The stale
// comparison is `compareSnapshot` from `scripts/lib/gold-cases.mjs`, and the
// re-freeze check is `checkReFreeze` beside the frozen vectors; nothing here
// re-implements either. `compareSnapshot` and the request builder arrive as
// arguments, so production source never imports a script.

import type { GoldCase, SnapshotDependency, SnapshotSources } from "../../../../../scripts/lib/gold-cases.mjs";
import type { PromptResources } from "../../../../../scripts/lib/prompt-fidelity.mjs";
import { askAiRequestSchema } from "../../validation/askAiRequest.js";
import { checkReFreeze, type FrozenVectorFile } from "./frozenVectors.js";

export type StalenessReport = {
  /** Non-rejected cases checked. */
  checked: number;
  /** Cases whose rule, oracle or ruling text changed since their snapshot, with what changed. */
  stale: Array<{ id: string; status: string; changed: SnapshotDependency[] }>;
  /** Cases whose query text changed since their vector was frozen (not scored by the ratchet until re-frozen). */
  awaitingRefreeze: string[];
  /** Cases with no frozen vector at all (these fail the offline gate; listed here for completeness). */
  missingVector: string[];
};

export type StalenessInputs = {
  cases: GoldCase[];
  sources: SnapshotSources;
  /** `compareSnapshot` from `scripts/lib/gold-cases.mjs`. */
  compareSnapshot: (caseEntry: GoldCase, sources: SnapshotSources) => { stale: boolean; changed: SnapshotDependency[] };
  resources: PromptResources;
  vectors: FrozenVectorFile;
  /** `buildCaseRequest` from `scripts/lib/prompt-fidelity.mjs`. */
  buildRequest: (caseEntry: GoldCase) => unknown;
};

export function buildStalenessReport(inputs: StalenessInputs): StalenessReport {
  const live = inputs.cases.filter((caseEntry) => caseEntry.review.status !== "rejected");
  const report: StalenessReport = { checked: live.length, stale: [], awaitingRefreeze: [], missingVector: [] };

  for (const caseEntry of live) {
    const comparison = inputs.compareSnapshot(caseEntry, inputs.sources);
    if (comparison.stale) report.stale.push({ id: caseEntry.id, status: caseEntry.review.status, changed: comparison.changed });

    const request = askAiRequestSchema.safeParse(inputs.buildRequest(caseEntry));
    if (!request.success) continue; // the offline gate reports a case whose request the schema rejects
    const freeze = checkReFreeze(caseEntry.id, request.data, inputs.resources.cardDetailIndex, inputs.vectors);
    if (freeze.state === "awaiting-refreeze") report.awaitingRefreeze.push(caseEntry.id);
    if (freeze.state === "missing") report.missingVector.push(caseEntry.id);
  }
  return report;
}

export function formatStalenessReport(report: StalenessReport): string {
  const lines = ["RULES TEST CORPUS STALENESS (REQ-225)", `Cases checked: ${report.checked} (rejected cases are skipped)`, ""];
  if (report.stale.length === 0) {
    lines.push("Stale cases: none. Every stored snapshot matches the committed rule, oracle and ruling text.");
  } else {
    lines.push(`Stale cases (${report.stale.length}); an approved one leaves live grading until you approve it again:`);
    for (const entry of report.stale) lines.push(`  ${entry.id} (${entry.status}): ${entry.changed.join(", ")} text changed`);
  }
  lines.push("");
  if (report.awaitingRefreeze.length === 0) {
    lines.push("Awaiting a query-vector re-freeze: none.");
  } else {
    lines.push(
      `Awaiting a query-vector re-freeze (${report.awaitingRefreeze.length}); the offline gate skips them until \`npm run eval:build-rules-gate-vectors\` re-freezes them:`
    );
    for (const id of report.awaitingRefreeze) lines.push(`  ${id}`);
  }
  if (report.missingVector.length > 0) {
    lines.push("", `No frozen vector at all (${report.missingVector.length}; the offline gate fails these): ${report.missingVector.join(", ")}`);
  }
  lines.push("", "This report never edits a case and never fails a build.");
  return `${lines.join("\n")}\n`;
}
