// The offline evidence trace (REQ-229): for every approved case, where each
// deciding rule goes between the question and the final prompt, for the
// checkout the command runs from. No provider call, no embedding call over the
// network, no fetch.
//
// Per deciding rule it reports
//   - its rank in the full System 3 ranking (the prompt prepared at an excerpt
//     cap equal to the rule index's size, REQ-190's override, which reuses
//     production's ranking untouched);
//   - whether it was selected in search at the production cap;
//   - whether System 3 skipped it because a curated rules topic carries it (the
//     topic's own number, or a curated parent whose lettered subrules are
//     excluded with it);
//   - whether its text is available to the answer anywhere in the final prompt:
//     a curated topic, an excerpt, or a card ruling quoting it;
//   - the same for its parent and lettered subrules ("514.3 is there but its
//     exception 514.3a is not").
// Per case: per-rule coverage, complete-procedure coverage (every deciding rule
// available), and today's `goldRuleInPrompt` side by side.
//
// This module is pure over injected functions (the prompt builder, the request
// parser, the freeze check, a local embedder), so every path runs under
// `node --test` with fakes. scripts/eval-evidence-trace.mjs wires the real ones.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { hashPrompt } from "./answer-quality-run.mjs";
import { describeDecidingRules, letteredSubrules, parentRuleId, ruleAvailability, availabilityInputsFrom } from "./rule-availability.mjs";

export const TRACE_FORMAT_VERSION = 1;
export const TRACE_FILE = "trace.json";
export const TRACE_OUTPUT_DIR = "output/evidence-trace";
export const PRODUCTION_CAP = 10;

/** Which query vector a case was ranked with: the committed frozen one, or one embedded here and labelled. */
export const VECTOR_SOURCES = {
  frozen: "frozen",
  embeddedLocally: "embedded-locally (case awaiting a re-freeze)",
  noFrozenVector: "embedded-locally (no frozen vector)",
  lexical: "lexical (no vector available)"
};

function curatedRuleIdsOf(prepared) {
  return new Set((prepared?.enrichmentDebug?.curatedGameRules?.topics ?? []).flatMap((topic) => topic.ruleNumbers ?? []));
}

/** True when System 3 would not score this rule: its own number or a curated parent's is in a curated topic. */
export function skippedForCuratedTopic(ruleId, curatedRuleIds, ruleEntryById) {
  if (curatedRuleIds.has(ruleId)) return true;
  const entry = ruleEntryById.get(ruleId);
  return (entry?.parentRuleIds ?? []).some((parentId) => curatedRuleIds.has(parentId));
}

function relatedEntry(relatedId, context) {
  const availability = ruleAvailability(relatedId, context.inputs);
  return {
    ruleId: relatedId,
    inRuleIndex: context.ruleEntryById.has(relatedId),
    rank: context.rankById.get(relatedId) ?? null,
    selectedInSearch: availability.selectedInSearch,
    skippedForCuratedTopic: skippedForCuratedTopic(relatedId, context.curatedRuleIds, context.ruleEntryById),
    availableToAnswer: availability.availableToAnswer
  };
}

/**
 * Traces one case. `full` is the prompt prepared at the cap equal to the rule
 * index's size (the full ranking); `production` is the prompt at the
 * production cap (what a player gets).
 */
export function traceCase({ caseEntry, request, full, production, ruleEntryById, cardRulingsIndex, vectorSource }) {
  const ranking = full?.enrichmentDebug?.supplemental?.selected ?? [];
  const rankById = new Map(ranking.map((rule, index) => [rule.ruleId, index + 1]));
  const curatedRuleIds = curatedRuleIdsOf(production);
  const inputs = availabilityInputsFrom({ prepared: production, request, cardRulingsIndex });
  const context = { inputs, rankById, curatedRuleIds, ruleEntryById };
  const indexRuleIds = [...ruleEntryById.keys()];

  const rules = caseEntry.expected.decidingRuleIds.map((ruleId) => {
    const availability = ruleAvailability(ruleId, inputs);
    const parentId = parentRuleId(ruleId);
    return {
      ruleId,
      rank: rankById.get(ruleId) ?? null,
      rankedOf: ranking.length,
      selectedInSearch: availability.selectedInSearch,
      skippedForCuratedTopic: skippedForCuratedTopic(ruleId, curatedRuleIds, ruleEntryById),
      availableVia: { excerpt: availability.selectedInSearch, curatedTopic: availability.curatedTopic, cardRuling: availability.rulingQuote },
      availableToAnswer: availability.availableToAnswer,
      parent: parentId ? relatedEntry(parentId, context) : null,
      subrules: letteredSubrules(ruleId, indexRuleIds).map((subId) => relatedEntry(subId, context))
    };
  });

  const described = describeDecidingRules({
    decidingRuleIds: caseEntry.expected.decidingRuleIds,
    prepared: production,
    request,
    cardRulingsIndex
  });
  return {
    caseId: caseEntry.id,
    tier: caseEntry.tier,
    vectorSource,
    promptHash: hashPrompt(production.promptText),
    promptChars: production.promptText.length,
    rules,
    coverage: {
      availableRules: rules.filter((rule) => rule.availableToAnswer).length,
      decidingRules: rules.length,
      completeProcedure: described.allDecidingRulesInPrompt,
      goldRuleInPrompt: described.anyDecidingRuleSelected
    }
  };
}

/**
 * Runs the trace over a corpus. Every dependency arrives injected:
 *   parseRequest(caseEntry)            -> the parsed Ask AI request (async)
 *   freezeCheck(caseId, request)       -> { state: "fresh", vector } | { state: "awaiting-refreeze" } | { state: "missing" }
 *   prepare(request, options)          -> preparePromptInput
 *   embedLocal(request)                -> a vector embedded by the local embedder, or null (async)
 */
export async function buildTrace({ cases, resources, parseRequest, freezeCheck, prepare, embedLocal, productionCap = PRODUCTION_CAP, log }) {
  const ruleEntryById = new Map(resources.gameRulesRuleIndex.map((entry) => [entry.ruleId, entry]));
  const fullCap = resources.gameRulesRuleIndex.length;
  const traced = [];
  for (const caseEntry of cases) {
    const request = await parseRequest(caseEntry);
    const freeze = freezeCheck(caseEntry.id, request);
    let queryEmbedding;
    let vectorSource = VECTOR_SOURCES.lexical;
    if (freeze.state === "fresh") {
      queryEmbedding = freeze.vector;
      vectorSource = VECTOR_SOURCES.frozen;
    } else {
      queryEmbedding = embedLocal ? await embedLocal(request) : null;
      if (queryEmbedding) vectorSource = freeze.state === "missing" ? VECTOR_SOURCES.noFrozenVector : VECTOR_SOURCES.embeddedLocally;
    }
    const base = { ...resources, queryEmbedding, collectEnrichmentDebug: true };
    const full = prepare(request, { ...base, supplementalRuleCap: fullCap });
    const production = prepare(request, { ...base, supplementalRuleCap: productionCap });
    traced.push(
      traceCase({ caseEntry, request, full, production, ruleEntryById, cardRulingsIndex: resources.cardRulingsIndex, vectorSource })
    );
    log?.(`  traced ${caseEntry.id} (${vectorSource})`);
  }
  return traced;
}

/** Hit and miss per case, from the trace, to hold against the rules gate's committed baseline. */
export function checkBaselineParity({ traced, baseline }) {
  const divergences = [];
  let checked = 0;
  let skipped = 0;
  for (const entry of traced) {
    const recorded = baseline?.cases?.[entry.caseId];
    if (!recorded || entry.vectorSource !== VECTOR_SOURCES.frozen) {
      skipped += 1; // the gate does not score a case awaiting a re-freeze, and a case with no baseline entry has nothing to hold against
      continue;
    }
    checked += 1;
    const hit = entry.rules.filter((rule) => rule.selectedInSearch).map((rule) => rule.ruleId);
    const miss = entry.rules.filter((rule) => !rule.selectedInSearch).map((rule) => rule.ruleId);
    const sameSet = (a, b) => a.length === b.length && [...a].sort().every((id, index) => id === [...b].sort()[index]);
    if (!sameSet(hit, recorded.hit ?? []) || !sameSet(miss, recorded.miss ?? [])) {
      divergences.push({ caseId: entry.caseId, trace: { hit, miss }, baseline: { hit: recorded.hit ?? [], miss: recorded.miss ?? [] } });
    }
  }
  return { checked, skipped, agree: checked - divergences.length, divergences };
}

export function summarizeTrace(traced) {
  return {
    cases: traced.length,
    everyDecidingRuleSelected: traced.filter((entry) => entry.rules.every((rule) => rule.selectedInSearch)).length,
    goldRuleInPrompt: traced.filter((entry) => entry.coverage.goldRuleInPrompt).length,
    completeProcedure: traced.filter((entry) => entry.coverage.completeProcedure).length,
    awaitingRefreeze: traced.filter((entry) => entry.vectorSource !== VECTOR_SOURCES.frozen).length
  };
}

/** Writes the trace folder: `trace.json` with the commit it was produced from. */
export async function writeTraceFolder({ outputRoot, name, commit, productionCap, ruleIndexSize, traced, parity }) {
  const folder = join(outputRoot, name);
  const trace = {
    formatVersion: TRACE_FORMAT_VERSION,
    kind: "evidence-trace",
    commit,
    productionCap,
    ruleIndexSize,
    summary: summarizeTrace(traced),
    baselineParity: parity ?? null,
    cases: traced
  };
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, TRACE_FILE), `${JSON.stringify(trace, null, 2)}\n`, "utf8");
  return { folder, trace };
}

export async function readTraceFolder(folder) {
  let text;
  try {
    text = await readFile(join(folder, TRACE_FILE), "utf8");
  } catch (error) {
    throw new Error(`Cannot read a trace from ${folder}: no ${TRACE_FILE} there (${error?.code ?? error}).`, { cause: error });
  }
  const trace = JSON.parse(text);
  if (trace.kind !== "evidence-trace") throw new Error(`${folder}/${TRACE_FILE} is not an evidence trace.`);
  return trace;
}

// ---------------------------------------------------------------------------
// Two traces side by side (REQ-229): eval:evidence-trace:compare
// ---------------------------------------------------------------------------

function availableSet(entry) {
  return new Set(entry.rules.filter((rule) => rule.availableToAnswer).map((rule) => rule.ruleId));
}

/**
 * Compares two traces produced from two revisions' own worktrees: both
 * commits, per-case prompt-hash equality (the unchanged-input stratum), how
 * coverage differs, and any case in only one trace.
 */
export function compareTraces(a, b) {
  const byIdA = new Map(a.cases.map((entry) => [entry.caseId, entry]));
  const byIdB = new Map(b.cases.map((entry) => [entry.caseId, entry]));
  const onlyInA = [...byIdA.keys()].filter((id) => !byIdB.has(id)).sort();
  const onlyInB = [...byIdB.keys()].filter((id) => !byIdA.has(id)).sort();

  const shared = [];
  for (const [caseId, entryA] of byIdA) {
    const entryB = byIdB.get(caseId);
    if (!entryB) continue;
    const availA = availableSet(entryA);
    const availB = availableSet(entryB);
    const gained = [...availB].filter((id) => !availA.has(id)).sort();
    const lost = [...availA].filter((id) => !availB.has(id)).sort();
    shared.push({
      caseId,
      promptHashEqual: entryA.promptHash === entryB.promptHash,
      gained,
      lost,
      completeProcedure: { a: entryA.coverage.completeProcedure, b: entryB.coverage.completeProcedure },
      goldRuleInPrompt: { a: entryA.coverage.goldRuleInPrompt, b: entryB.coverage.goldRuleInPrompt },
      vectorSource: { a: entryA.vectorSource, b: entryB.vectorSource }
    });
  }
  shared.sort((x, y) => x.caseId.localeCompare(y.caseId));
  const changed = shared.filter(
    (entry) =>
      entry.gained.length > 0 ||
      entry.lost.length > 0 ||
      entry.completeProcedure.a !== entry.completeProcedure.b ||
      entry.goldRuleInPrompt.a !== entry.goldRuleInPrompt.b
  );
  return {
    commits: { a: a.commit, b: b.commit },
    productionCaps: { a: a.productionCap, b: b.productionCap },
    sharedCases: shared.length,
    promptHashEqual: shared.filter((entry) => entry.promptHashEqual).length,
    promptHashDifferent: shared.filter((entry) => !entry.promptHashEqual).length,
    coverageChanged: changed,
    onlyInA,
    onlyInB,
    summaries: { a: a.summary, b: b.summary }
  };
}

export function formatTraceComparison(result, { labelA = "A", labelB = "B" } = {}) {
  const lines = [
    "Evidence trace comparison (offline; neither side is named a winner):",
    `  ${labelA}: commit ${result.commits.a}`,
    `  ${labelB}: commit ${result.commits.b}`,
    `  Cases in both traces: ${result.sharedCases}`,
    `  Prompt hash equal (unchanged-input stratum): ${result.promptHashEqual}; different: ${result.promptHashDifferent}`,
    `  Cases whose coverage differs: ${result.coverageChanged.length}`
  ];
  for (const entry of result.coverageChanged) {
    const parts = [];
    if (entry.gained.length > 0) parts.push(`gained ${entry.gained.join(", ")}`);
    if (entry.lost.length > 0) parts.push(`lost ${entry.lost.join(", ")}`);
    if (entry.completeProcedure.a !== entry.completeProcedure.b) {
      parts.push(`complete procedure ${entry.completeProcedure.a} -> ${entry.completeProcedure.b}`);
    }
    if (entry.goldRuleInPrompt.a !== entry.goldRuleInPrompt.b) {
      parts.push(`goldRuleInPrompt ${entry.goldRuleInPrompt.a} -> ${entry.goldRuleInPrompt.b}`);
    }
    lines.push(`    ${entry.caseId}: ${parts.join("; ")}`);
  }
  lines.push(`  Only in ${labelA}: ${result.onlyInA.length === 0 ? "none" : result.onlyInA.join(", ")}`);
  lines.push(`  Only in ${labelB}: ${result.onlyInB.length === 0 ? "none" : result.onlyInB.join(", ")}`);
  return lines.join("\n");
}
