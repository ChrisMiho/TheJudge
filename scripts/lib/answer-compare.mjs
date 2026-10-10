// The paired before/after comparison of two experiment runs (REQ-228).
//
// It reads two finished run folders (`output/answer-quality/runs/<run-id>/`:
// the identity record `manifest.json` and the numbers-only `summary.json`)
// and compares them case by case, offline: no provider, no network. "Right"
// is Correctness 2 (REQ-187) and "wrong" is 0 or 1. It refuses when the two
// runs were not judged the same way, prints the five transition counts with
// their denominators, lists every right-to-wrong case with its transcript
// paths, breaks the counts down by tier (1 and 2 together, 3 apart, never
// pooled), rules section, mechanic, difficulty, source pool and request kind,
// and reports the unchanged-input stratum (identical prompt hash) as sampling
// noise. Per side it reports latency, answers slower than the revision's
// production timeout, errors, tokens (reasoning included) and cost, answer
// and judge apart, plus the right answers out of all graded answers (every
// repeat counted, beside the per-case majorities) and how many of those right
// answers were slower than the timeout, in every breakdown. A repeat selector
// (`--repeats 1-3`) keeps only some repeats of a side, so one arm's repeats can
// be split into halves and compared within one run (the noise floor). It states counts and lists and draws no conclusion: a number
// moving is a fact to investigate, not a verdict. Diagnostic arms (REQ-230) print under a
// "diagnostic control, not a product score" heading.
//
// Plain JavaScript over plain data: runs under `node --test`.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const DIAGNOSTIC_HEADING = "DIAGNOSTIC CONTROL -- NOT A PRODUCT SCORE";
/** The pre-budget production timeout (15 s per attempt, before REQ-231's 30 s overall budget), assumed only for a run whose identity record has no `productionTimeoutMs`. */
export const ASSUMED_TIMEOUT_MS = 15000;

export async function readRunFolder(folder) {
  const read = async (name) => {
    try {
      return JSON.parse(await readFile(join(folder, name), "utf8"));
    } catch (error) {
      throw new Error(`Cannot read ${name} from the run folder ${folder}: ${error?.code ?? error?.message ?? error}. Is it a finished experiment run?`, { cause: error });
    }
  };
  return { folder, identity: await read("manifest.json"), summary: await read("summary.json") };
}

// ---------------------------------------------------------------------------
// Selecting and resolving each side
// ---------------------------------------------------------------------------

const isGraded = (record) => record.status === "ok" && !record.undetermined && record.scores !== undefined;
const isRight = (record) => record.scores.correctness === 2;

/**
 * The records a side contributes: the chosen arm (default A, the production
 * prompt) and model (default: the run's only model). Refuses an ambiguous
 * model rather than guessing.
 */
export function selectSide(run, { arm = "A", model, cap, repeats } = {}) {
  const wanted = repeats === undefined || repeats === null ? null : parseRepeatSelector(repeats);
  const records = run.summary.records.filter(
    (record) => record.arm === arm && (cap === undefined || record.excerptCap === Number(cap)) && (wanted === null || wanted.has(record.repeat ?? 1))
  );
  if (records.length === 0) {
    throw new Error(
      `Run ${run.identity.runId} has no records for arm ${arm}${cap === undefined ? "" : ` at excerpt cap ${cap}`}${wanted === null ? "" : ` in repeats ${repeats}`}.`
    );
  }
  const models = [...new Set(records.map((record) => record.model))].sort();
  const chosenModel = model ?? (models.length === 1 ? models[0] : null);
  if (chosenModel === null) {
    throw new Error(`Run ${run.identity.runId} answered with several models (${models.join(", ")}): pick one with --model.`);
  }
  const selected = records.filter((record) => record.model === chosenModel);
  if (selected.length === 0) throw new Error(`Run ${run.identity.runId} has no records for model ${chosenModel} on arm ${arm}.`);
  return { run, arm, model: chosenModel, repeats: wanted === null ? null : String(repeats), records: selected };
}

/**
 * A repeat selector: whole numbers and ranges joined by commas, such as `1-3`, `4-6` or `1,3,5-6`.
 * Returns the set of repeat indexes; refuses anything else, naming it.
 */
export function parseRepeatSelector(spec) {
  const text = String(spec).trim();
  const wanted = new Set();
  for (const part of text.split(",")) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part.trim());
    const from = match ? Number(match[1]) : NaN;
    const to = match ? Number(match[2] ?? match[1]) : NaN;
    if (!match || from < 1 || to < from) {
      throw new Error(`The repeat selector "${text}" must be repeat numbers or ranges counted from 1, such as 1-3 or 4-6 or 1,3,5-6.`);
    }
    for (let repeat = from; repeat <= to; repeat++) wanted.add(repeat);
  }
  return wanted;
}

const sideRecordKeys = (side) => side.records.map((record) => `${record.caseId}|${record.model}|${record.excerptCap}|${record.arm}|${record.repeat ?? 1}`).sort();

/**
 * Why a side cannot be compared with itself (REQ-228): both sides select the same records of the same
 * run (same run, arm, model, cap and repeats). Empty when the sides differ in any of them.
 */
export function selfComparisonReasons(sideA, sideB) {
  if (sideA.run.folder !== sideB.run.folder) return [];
  const keysA = sideRecordKeys(sideA);
  const keysB = sideRecordKeys(sideB);
  if (keysA.length !== keysB.length || keysA.some((key, index) => key !== keysB[index])) return [];
  return [
    `both sides select the same records (run ${sideA.run.identity.runId}, arm ${sideA.arm}, model ${sideA.model}${sideA.repeats ? `, repeats ${sideA.repeats}` : ", every repeat"}): ` +
      "a side compared with itself says nothing. Pick two different arms, runs or repeat ranges " +
      "(the noise floor is one arm's halves: --arm A --repeats-a 1-3 --repeats-b 4-6)"
  ];
}

function groupByKey(records) {
  const groups = new Map();
  for (const record of records) {
    const key = `${record.caseId}|${record.excerptCap}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return groups;
}

/**
 * One side's result for one case: the majority over its graded repeats.
 * Disagreeing repeats are `unstable`; a tie has no majority and is `tied`.
 * A case with no graded record is `missing` (an error, a timeout, an
 * undetermined grade).
 */
export function resolveGroup(records) {
  const graded = records.filter(isGraded);
  const right = graded.filter(isRight).length;
  const wrong = graded.length - right;
  const unstable = right > 0 && wrong > 0;
  let result = "missing";
  let reason = records.some((record) => record.status === "error") ? "answer error or timeout" : "not graded";
  if (graded.length > 0) {
    if (right > wrong) result = "right";
    else if (wrong > right) result = "wrong";
    else {
      result = "tied";
      reason = "repeats tie";
    }
  }
  const hashes = [...new Set(records.map((record) => record.promptHash).filter(Boolean))].sort();
  return {
    result,
    reason: result === "missing" || result === "tied" ? reason : null,
    unstable,
    right,
    wrong,
    scores: graded.map((record) => record.scores.correctness),
    repeats: records.length,
    promptHashes: hashes,
    records
  };
}

// ---------------------------------------------------------------------------
// Refusals
// ---------------------------------------------------------------------------

/** Why two runs cannot be compared, or an empty list: judge model, rubric revision, and each case's reference-answer hash. */
export function comparabilityProblems(sideA, sideB, groupsA, groupsB) {
  const problems = [];
  const judgeOf = (side) => side.run.identity.judgeModel ?? side.records[0]?.judgeModel;
  const rubricOf = (side) => side.run.identity.rubricRevision ?? side.records[0]?.rubricRevision;
  if (judgeOf(sideA) !== judgeOf(sideB)) problems.push(`the judge models differ (${judgeOf(sideA)} and ${judgeOf(sideB)})`);
  if (rubricOf(sideA) !== rubricOf(sideB)) problems.push(`the rubric revisions differ (${rubricOf(sideA)} and ${rubricOf(sideB)})`);

  const hashesOf = (records) => [...new Set(records.map((record) => record.referenceAnswerHash ?? null))];
  const mismatched = [];
  for (const [key, recordsA] of groupsA) {
    const recordsB = groupsB.get(key);
    if (!recordsB) continue;
    const a = hashesOf(recordsA);
    const b = hashesOf(recordsB);
    if (a.length !== 1 || b.length !== 1 || a[0] === null || a[0] !== b[0]) mismatched.push(key.split("|")[0]);
  }
  if (mismatched.length > 0) {
    problems.push(`${mismatched.length} case${mismatched.length === 1 ? "" : "s"} were judged against different reference answers (or carry no reference hash): ${[...new Set(mismatched)].sort().join(", ")}`);
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Transitions and breakdowns
// ---------------------------------------------------------------------------

const TRANSITIONS = ["rightToRight", "wrongToRight", "rightToWrong", "wrongToWrong", "missing"];

function emptyCounts() {
  return Object.fromEntries(TRANSITIONS.map((name) => [name, 0]));
}

function transitionOf(a, b) {
  if (a.result === "right" && b.result === "right") return "rightToRight";
  if (a.result === "wrong" && b.result === "right") return "wrongToRight";
  if (a.result === "right" && b.result === "wrong") return "rightToWrong";
  if (a.result === "wrong" && b.result === "wrong") return "wrongToWrong";
  return "missing";
}

function addTo(table, label, transition) {
  if (!table.has(label)) table.set(label, emptyCounts());
  table.get(label)[transition] += 1;
}

const sortedEntries = (table) => [...table].sort(([a], [b]) => String(a).localeCompare(String(b), "en", { numeric: true }));

function tableToObject(table) {
  return Object.fromEntries(sortedEntries(table));
}

function difficultyLabel(strata) {
  return strata.difficultyScore === null || strata.difficultyScore === undefined ? "unknown" : String(strata.difficultyScore);
}

function percentile(sortedValues, fraction) {
  if (sortedValues.length === 0) return null;
  const index = Math.min(sortedValues.length - 1, Math.ceil(fraction * sortedValues.length) - 1);
  return sortedValues[Math.max(0, index)];
}

function emptyAnswerCounts() {
  return { graded: 0, right: 0, slowerThanTimeout: 0, rightOverBudget: 0 };
}

/**
 * The answer-level counts (REQ-228) over a side's records, every repeat counted: graded answers, right
 * answers (Correctness 2), answers slower than the timeout, and right answers that were also slower than
 * it (a player would have seen the failure screen). Overall, per tier group and per breakdown label.
 */
export function answerLevelCounts(records, timeoutMs) {
  const overall = emptyAnswerCounts();
  const byTierGroup = { "tiers 1-2": emptyAnswerCounts(), "tier 3": emptyAnswerCounts() };
  const breakdowns = { "tiers 1-2": newBreakdownTables(), "tier 3": newBreakdownTables() };
  const add = (counts, record) => {
    const graded = isGraded(record);
    const right = graded && isRight(record);
    const slow = record.status === "ok" && typeof record.latencyMs === "number" && record.latencyMs > timeoutMs;
    if (graded) counts.graded += 1;
    if (right) counts.right += 1;
    if (slow) counts.slowerThanTimeout += 1;
    if (right && slow) counts.rightOverBudget += 1;
  };
  const bump = (table, label, record) => {
    if (!table.has(label)) table.set(label, emptyAnswerCounts());
    add(table.get(label), record);
  };
  for (const record of records) {
    const group = record.tier === 3 ? "tier 3" : "tiers 1-2";
    const strata = record.strata ?? {};
    add(overall, record);
    add(byTierGroup[group], record);
    const tables = breakdowns[group];
    for (const section of strata.ruleSections?.length ? strata.ruleSections : ["none"]) bump(tables.ruleSection, section, record);
    for (const mechanic of strata.mechanics?.length ? strata.mechanics : ["none"]) bump(tables.mechanic, mechanic, record);
    bump(tables.difficulty, difficultyLabel(strata), record);
    bump(tables.sourcePool, strata.sourcePool ?? "none", record);
    bump(tables.requestKind, strata.requestKind ?? "unknown", record);
  }
  return {
    overall,
    byTierGroup,
    breakdowns: Object.fromEntries(
      Object.entries(breakdowns).map(([group, tables]) => [group, Object.fromEntries(Object.entries(tables).map(([name, table]) => [name, tableToObject(table)]))])
    )
  };
}

/** Latency, errors, tokens and cost for one side (REQ-228), the two cost lines apart. */
export function summarizeSide(side) {
  const records = side.records;
  const ok = records.filter((record) => record.status === "ok");
  const latencies = ok.map((record) => record.latencyMs).filter((value) => typeof value === "number").sort((x, y) => x - y);
  const timeoutMs = side.run.identity.productionTimeoutMs ?? ASSUMED_TIMEOUT_MS;
  const sum = (field, list = records) => list.reduce((total, record) => total + (record[field] ?? 0), 0);
  const answerLevel = answerLevelCounts(records, timeoutMs);
  return {
    runId: side.run.identity.runId,
    commit: side.run.identity.commit,
    arm: side.arm,
    repeats: side.repeats ?? null,
    answerLevel,
    armRevision: records[0]?.armRevision ?? null,
    model: side.model,
    reportedModel: side.run.identity.models?.reported?.[side.model] ?? null,
    judgeModel: side.run.identity.judgeModel,
    rubricRevision: side.run.identity.rubricRevision,
    records: records.length,
    latencyMs: {
      mean: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null,
      p50: percentile(latencies, 0.5),
      p95: percentile(latencies, 0.95)
    },
    timeoutMs,
    timeoutIsAssumed: side.run.identity.productionTimeoutMs === undefined || side.run.identity.productionTimeoutMs === null,
    slowerThanTimeout: latencies.filter((value) => value > timeoutMs).length,
    errors: records.filter((record) => record.status === "error").length,
    timeouts: records.filter((record) => record.status === "error" && record.errorKind === "timeout").length,
    tokens: {
      input: sum("inputTokens"),
      output: sum("outputTokens"),
      reasoning: sum("reasoningTokens"),
      judgeInput: sum("judgeInputTokens"),
      judgeOutput: sum("judgeOutputTokens"),
      judgeReasoning: sum("judgeReasoningTokens")
    },
    answerCostUsd: sum("costUsd"),
    judgeCostUsd: sum("judgeCostUsd"),
    unpricedRecords: records.filter((record) => record.unpriced).length,
    diagnostic: records.some((record) => record.diagnostic === true)
  };
}

/**
 * Compares two finished runs. Returns `{ refused: true, reasons }` when they
 * were not judged the same way, otherwise the full comparison.
 */
export function compareRunSides(sideA, sideB) {
  const groupsA = groupByKey(sideA.records);
  const groupsB = groupByKey(sideB.records);
  const reasons = comparabilityProblems(sideA, sideB, groupsA, groupsB);
  if (reasons.length > 0) return { refused: true, reasons };

  const keys = [...new Set([...groupsA.keys(), ...groupsB.keys()])].sort();
  const empty = { result: "missing", reason: "not in this run", unstable: false, promptHashes: [], records: [] };

  const overall = emptyCounts();
  const byTierGroup = { "tiers 1-2": emptyCounts(), "tier 3": emptyCounts() };
  const breakdowns = { "tiers 1-2": newBreakdownTables(), "tier 3": newBreakdownTables() };
  const unchanged = emptyCounts();
  const changedInput = emptyCounts();
  const rightToWrong = [];
  const unstable = [];
  const onlyInOne = { a: [], b: [] };
  const pairs = [];

  for (const key of keys) {
    const [caseId, cap] = key.split("|");
    const a = groupsA.has(key) ? resolveGroup(groupsA.get(key)) : empty;
    const b = groupsB.has(key) ? resolveGroup(groupsB.get(key)) : empty;
    if (!groupsA.has(key)) onlyInOne.b.push(caseId);
    if (!groupsB.has(key)) onlyInOne.a.push(caseId);
    const transition = transitionOf(a, b);
    const sample = (groupsA.get(key) ?? groupsB.get(key))[0];
    const tierGroup = sample.tier === 3 ? "tier 3" : "tiers 1-2";

    overall[transition] += 1;
    byTierGroup[tierGroup][transition] += 1;
    const tables = breakdowns[tierGroup];
    for (const section of sample.strata?.ruleSections?.length ? sample.strata.ruleSections : ["none"]) addTo(tables.ruleSection, section, transition);
    for (const mechanic of sample.strata?.mechanics?.length ? sample.strata.mechanics : ["none"]) addTo(tables.mechanic, mechanic, transition);
    addTo(tables.difficulty, difficultyLabel(sample.strata ?? {}), transition);
    addTo(tables.sourcePool, sample.strata?.sourcePool ?? "none", transition);
    addTo(tables.requestKind, sample.strata?.requestKind ?? "unknown", transition);

    const bothPresent = groupsA.has(key) && groupsB.has(key);
    const identicalPrompt = bothPresent && a.promptHashes.length > 0 && JSON.stringify(a.promptHashes) === JSON.stringify(b.promptHashes);
    if (bothPresent) (identicalPrompt ? unchanged : changedInput)[transition] += 1;

    if (transition === "rightToWrong") {
      rightToWrong.push({
        caseId,
        excerptCap: Number(cap),
        tier: sample.tier,
        promptHashEqual: identicalPrompt,
        transcripts: {
          a: a.records.map((record) => (record.transcript ? join(sideA.run.folder, record.transcript) : null)).filter(Boolean),
          b: b.records.map((record) => (record.transcript ? join(sideB.run.folder, record.transcript) : null)).filter(Boolean)
        }
      });
    }
    for (const [label, resolved] of [["a", a], ["b", b]]) {
      if (resolved.unstable) {
        unstable.push({ caseId, excerptCap: Number(cap), side: label, right: resolved.right, wrong: resolved.wrong, scores: resolved.scores });
      }
    }
    pairs.push({ caseId, excerptCap: Number(cap), a: a.result, b: b.result, transition });
  }

  const total = keys.length;
  return {
    refused: false,
    // One arm's repeats split into two sets within one run: the difference is chance alone, the noise floor.
    noiseFloor: sideA.run.folder === sideB.run.folder && sideA.arm === sideB.arm && sideA.model === sideB.model && sideA.repeats !== sideB.repeats,
    diagnostic: sideA.records.some((r) => r.diagnostic) || sideB.records.some((r) => r.diagnostic),
    sides: { a: summarizeSide(sideA), b: summarizeSide(sideB) },
    denominators: { cases: total, bothGraded: total - overall.missing },
    overall,
    byTierGroup,
    breakdowns: Object.fromEntries(
      Object.entries(breakdowns).map(([group, tables]) => [group, Object.fromEntries(Object.entries(tables).map(([name, table]) => [name, tableToObject(table)]))])
    ),
    // With one answer model on both sides, a difference on an identical prompt is sampling noise; with two models it is the model.
    unchangedInput: { label: sideA.model === sideB.model ? "sampling noise" : "same prompt, different answer models", cases: Object.values(unchanged).reduce((x, y) => x + y, 0), counts: unchanged },
    changedInput: { cases: Object.values(changedInput).reduce((x, y) => x + y, 0), counts: changedInput },
    rightToWrong: rightToWrong.sort((x, y) => x.caseId.localeCompare(y.caseId)),
    unstable,
    onlyInA: [...new Set(onlyInOne.a)].sort(),
    onlyInB: [...new Set(onlyInOne.b)].sort(),
    pairs
  };
}

function newBreakdownTables() {
  return { ruleSection: new Map(), mechanic: new Map(), difficulty: new Map(), sourcePool: new Map(), requestKind: new Map() };
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

const money = (value) => `$${value.toFixed(4)}`;
const ms = (value) => (value === null ? "n/a" : `${Math.round(value)} ms`);

function countsLine(counts, denominator) {
  return (
    `right->right ${counts.rightToRight}, wrong->right ${counts.wrongToRight}, right->wrong ${counts.rightToWrong}, ` +
    `wrong->wrong ${counts.wrongToWrong}, missing ${counts.missing} (of ${denominator})`
  );
}

const total = (counts) => Object.values(counts).reduce((x, y) => x + y, 0);

/** `7 right of 12 graded answers (every repeat counted); 2 slower than the timeout, 1 of them right`. */
function answerLevelText(counts) {
  return `${counts.right} right of ${counts.graded} graded answers (every repeat counted); ${counts.slowerThanTimeout} slower than the timeout, ${counts.rightOverBudget} of them right`;
}

const answerShort = (counts) => `${counts.right}/${counts.graded} right, ${counts.rightOverBudget} right but over budget`;

function sideBlock(label, side) {
  const timeoutNote = side.timeoutIsAssumed ? " (assumed: this run's identity record names none)" : "";
  return [
    `  ${label}: run ${side.runId} at commit ${side.commit}, arm ${side.arm}${side.armRevision ? ` (${side.armRevision})` : ""}, model ${side.model}${side.reportedModel ? ` (reported ${side.reportedModel})` : ""}${side.repeats ? `, repeats ${side.repeats}` : ""}`,
    `    answers: ${answerLevelText(side.answerLevel.overall)}`,
    `    latency: mean ${ms(side.latencyMs.mean)}, p50 ${ms(side.latencyMs.p50)}, p95 ${ms(side.latencyMs.p95)}; ${side.slowerThanTimeout} answers slower than the ${side.timeoutMs} ms production timeout${timeoutNote}`,
    `    errors ${side.errors} (of which timeouts ${side.timeouts}) across ${side.records} records`,
    `    tokens: answer in ${side.tokens.input} / out ${side.tokens.output} (reasoning ${side.tokens.reasoning} inside out); judge in ${side.tokens.judgeInput} / out ${side.tokens.judgeOutput} (reasoning ${side.tokens.judgeReasoning} inside out)`,
    `    cost: answers ${money(side.answerCostUsd)}; judge ${money(side.judgeCostUsd)}${side.unpricedRecords > 0 ? `; ${side.unpricedRecords} record(s) unpriced` : ""}`
  ];
}

/** The text report. It states counts and lists; it never says which side is better. */
export function formatComparison(result, { labelA = "A", labelB = "B" } = {}) {
  if (result.refused) {
    return [
      "These two runs cannot be compared; nothing was reported.",
      ...result.reasons.map((reason) => `  - ${reason}`),
      result.selfComparison
        ? "Choose two different sides to compare."
        : "Re-grade the earlier run's stored answers under the current judge and rubric (a regrade run), then compare."
    ].join("\n");
  }
  const lines = [];
  if (result.diagnostic) {
    lines.push(`=== ${DIAGNOSTIC_HEADING} ===`, "These arms are test-only prompt variants. They answer \"would complete evidence rescue this answer?\", never \"how good is the product?\".", "");
  }
  if (result.noiseFloor) {
    lines.push(
      "=== NOISE-FLOOR COMPARISON ===",
      "Both sides are the same arm of the same run, split by repeat. Any difference here is chance alone: the gap two identical setups drift apart by.",
      ""
    );
  }
  lines.push("Paired comparison of two experiment runs (offline; right = Correctness 2, wrong = 0 or 1):");
  lines.push(...sideBlock(labelA, result.sides.a), ...sideBlock(labelB, result.sides.b), "");
  lines.push(`Judge ${result.sides.a.judgeModel}, rubric ${result.sides.a.rubricRevision} on both sides.`);
  lines.push(`Overall: ${countsLine(result.overall, result.denominators.cases)}`);
  for (const [group, counts] of Object.entries(result.byTierGroup)) {
    lines.push(`  ${group}: ${countsLine(counts, total(counts))}`);
    lines.push(`    answers, every repeat counted: ${labelA} ${answerShort(result.sides.a.answerLevel.byTierGroup[group])}; ${labelB} ${answerShort(result.sides.b.answerLevel.byTierGroup[group])}`);
  }
  lines.push(
    result.unchangedInput.label === "sampling noise"
      ? `Unchanged-input stratum (identical prompt hash on both sides; differences here are sampling noise, not an effect): ${result.unchangedInput.cases} cases: ${countsLine(result.unchangedInput.counts, result.unchangedInput.cases)}`
      : `Identical-prompt stratum (the same prompt on both sides, answered by different models, so a difference here is the model, not sampling noise): ${result.unchangedInput.cases} cases: ${countsLine(result.unchangedInput.counts, result.unchangedInput.cases)}`
  );
  lines.push(`Changed-input cases: ${result.changedInput.cases}: ${countsLine(result.changedInput.counts, result.changedInput.cases)}`);

  lines.push("", `Right->wrong cases (${result.rightToWrong.length}), each with its transcripts:`);
  if (result.rightToWrong.length === 0) lines.push("  none");
  for (const item of result.rightToWrong) {
    lines.push(`  ${item.caseId} (tier ${item.tier}, cap ${item.excerptCap}${item.promptHashEqual ? ", prompt unchanged" : ""})`);
    for (const path of item.transcripts.a) lines.push(`    ${labelA}: ${path}`);
    for (const path of item.transcripts.b) lines.push(`    ${labelB}: ${path}`);
  }

  lines.push("", `Unstable cases (repeats disagree): ${result.unstable.length === 0 ? "none" : ""}`);
  for (const item of result.unstable) lines.push(`  ${item.caseId} (cap ${item.excerptCap}, ${item.side === "a" ? labelA : labelB}): ${item.right} right, ${item.wrong} wrong (Correctness per repeat: ${item.scores.join(", ")})`);

  for (const [group, tables] of Object.entries(result.breakdowns)) {
    lines.push("", `Breakdown within ${group} (never pooled with the other tier group):`);
    const heading = { ruleSection: "by rules section", mechanic: "by mechanic", difficulty: "by difficulty score", sourcePool: "by source pool", requestKind: "by request kind" };
    for (const [name, table] of Object.entries(tables)) {
      lines.push(`  ${heading[name]}:`);
      const entries = Object.entries(table);
      if (entries.length === 0) lines.push("    none");
      for (const [label, counts] of entries) {
        lines.push(`    ${label}: ${countsLine(counts, total(counts))}`);
        const a = result.sides.a.answerLevel.breakdowns[group]?.[name]?.[label];
        const b = result.sides.b.answerLevel.breakdowns[group]?.[name]?.[label];
        if (a || b) {
          const none = emptyAnswerCounts();
          lines.push(`      answers, every repeat counted: ${labelA} ${answerShort(a ?? none)}; ${labelB} ${answerShort(b ?? none)}`);
        }
      }
    }
  }
  if (result.onlyInA.length > 0) lines.push("", `Only in ${labelA}: ${result.onlyInA.join(", ")}`);
  if (result.onlyInB.length > 0) lines.push("", `Only in ${labelB}: ${result.onlyInB.join(", ")}`);
  lines.push("", "This report states counts and lists; read the right->wrong cases and their transcripts before drawing any conclusion.");
  return lines.join("\n");
}
