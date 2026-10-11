// Throwaway probe: arm L on the corpus Quick Lookup cases of the resolution-recipe hard (6 repeats) and regression
// (1 repeat) manifests. Mirrors effort-probe.mjs (schema parse, embed buildRetrievalQueryText, preparePromptInput,
// cap 10, local embedder, gpt-6.1-sol judge) with no effort param. The ONLY change from production is arm L's
// extra GAME RULES topics via the lookup topic filter seam (arm-l.mjs). Base prompt must hash-match baseline arm A.
// Usage: npx tsx <this file> [--live] [--concurrency 3] [--limit N]
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import * as C from "./common.mjs";
import { makeArmL } from "./arm-l.mjs";

const BACKUPS = "/Users/chrismiho/Coding/Projects/TheJudge-backups/resolution-recipe-2026-10-10";
const OUT_DIR = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-prompt-format-tuning/runs/lookup-topics-corpus";
const RECORDS = C.CORPUS_RECORDS;
const PROMPTS = "/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/77c7ed2c-0a20-456e-a5b5-09f17f281567/scratchpad/lookup-topics/corpus-prompts.jsonl";
const REPEATS = { hard: 6, ordinary: 1 };

const args = process.argv.slice(2);
const live = args.includes("--live");
const concurrency = Math.min(3, Number(args[args.indexOf("--concurrency") + 1]) || 3);
const limit = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;

const evalMod = await C.imp("scripts/eval-answer-quality.mjs");
const fid = await C.imp("scripts/lib/prompt-fidelity.mjs");
const gold = await C.imp("scripts/lib/gold-cases.mjs");
const exp = await C.imp("scripts/lib/experiment-run.mjs");
const ji = await C.imp("scripts/lib/judge-inputs.mjs");
const ra = await C.imp("scripts/lib/rule-availability.mjs");
const arms = await C.imp("scripts/lib/diagnostic-arms.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await C.imp("apps/backend/src/prompt/preparation.ts");
const { buildLookupPromptContext } = await C.imp("apps/backend/src/prompt/context.ts");
const { askAiRequestSchema } = await C.imp("apps/backend/src/validation/askAiRequest.ts");
const { judgeAnswerAlone } = await C.imp("apps/backend/src/eval/answer-quality/judge.ts");
const { RUBRIC_REVISION } = await C.imp("apps/backend/src/eval/answer-quality/rubric.ts");
const { computeDeterministicAssertions } = await C.imp("apps/backend/src/eval/answer-quality/assertions.ts");

const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
const judgeModel = evalMod.resolveJudgeModel(env);
if (judgeModel !== C.EXPECTED_JUDGE) throw new Error(`judge model is ${judgeModel}, expected ${C.EXPECTED_JUDGE}`);
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

const baselineHash = new Map();
for (const runId of ["rr-hard", "rr-regression"]) {
  for (const line of readFileSync(`${BACKUPS}/${runId}/calls.jsonl`, "utf8").split("\n").filter(Boolean)) {
    const r = JSON.parse(line).record;
    if (r?.arm === "A" && r.promptHash) baselineHash.set(r.caseId, r.promptHash);
  }
}

const allCases = await gold.loadGoldCases();
const sources = await gold.loadSnapshotSources();
const isStale = (c) => gold.compareSnapshot(c, sources).stale;
const resources = await fid.loadPromptResources({ env });
const knownRuleIds = new Set(resources.gameRulesRuleIndex.map((e) => e.ruleId));
const armL = makeArmL(resources.gameRulesTopics);

// Gate share over every corpus Quick Lookup case (no model calls).
{
  let n = 0, bf = 0, st = 0, any = 0;
  for (const c of allCases) {
    const req = fid.buildCaseRequest(c);
    if (req.mode !== "lookup") continue;
    const g = armL.gate(buildLookupPromptContext(req, resources.cardDetailIndex).cards);
    n++; if (g.battlefield) bf++; if (g.stack) st++; if (g.battlefield || g.stack) any++;
  }
  console.log(`Gate share, whole corpus Quick Lookup: n=${n} fires=${any} (${((any / n) * 100).toFixed(1)}%) battlefield=${bf} stack=${st}`);
}

const sets = [];
for (const [set, runId] of [["hard", "rr-hard"], ["ordinary", "rr-regression"]]) {
  const manifest = JSON.parse(readFileSync(`${BACKUPS}/${runId}/manifest.json`, "utf8"));
  const cases = exp.validateManifestCases({ manifest: { cases: manifest.caseList }, allCases, isStale });
  for (const c of cases) if (fid.buildCaseRequest(c).mode === "lookup") sets.push({ set, caseEntry: c });
}
console.log(`Quick Lookup cases: ${sets.length} (hard ${sets.filter((s) => s.set === "hard").length}, ordinary ${sets.filter((s) => s.set === "ordinary").length}); rubric ${RUBRIC_REVISION}; judge ${judgeModel}`);

const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);

function parse(raw, label) {
  const r = askAiRequestSchema.safeParse(raw);
  if (!r.success) throw new Error(`${label}: askAiRequestSchema rejects the request: ${r.error.message}`);
  return r.data;
}

const prepCache = new Map();
async function prepare(caseEntry) {
  if (prepCache.has(caseEntry.id)) return prepCache.get(caseEntry.id);
  const parsed = parse(fid.buildCaseRequest(caseEntry), caseEntry.id);
  const vector = await embedder.embed(buildRetrievalQueryText(parsed, { cardDetailIndex: resources.cardDetailIndex }));
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: caseEntry.id });
  const opts = { ...resources, supplementalRuleCap: C.CAP, queryEmbedding: vector, collectEnrichmentDebug: true };
  const base = preparePromptInput(parsed, opts);
  fid.describeRetrieval(base.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, { requireSemantic: true, caseId: caseEntry.id });
  const g = armL.gate(base.context.cards);
  const prepared = armL.prepareWithExtra(preparePromptInput, parsed, opts, g.extraIds);
  const d = armL.diff(base.promptText, prepared.promptText, base, prepared, g.extraIds);
  const retrieval = fid.describeRetrieval(prepared.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, { requireSemantic: true, caseId: caseEntry.id });
  const deciding = caseEntry.expected.decidingRuleIds ?? [];
  const carriedBase = arms.carriedRuleIds(arms.parseLookupPrompt(base.promptText));
  const carriedArm = arms.carriedRuleIds(arms.parseLookupPrompt(prepared.promptText));
  const p = {
    parsed, prepared, promptText: prepared.promptText, retrieval, gate: g, diff: d,
    basePromptHash: sha256(base.promptText), basePromptChars: base.promptText.length, promptHash: sha256(prepared.promptText),
    decidingInBase: deciding.filter((id) => carriedBase.has(id)).length,
    decidingInArm: deciding.filter((id) => carriedArm.has(id)).length,
    decidingTotal: deciding.length
  };
  prepCache.set(caseEntry.id, p);
  return p;
}

const estimateFor = (promptText) =>
  C.ANSWER_ESTIMATE_MULTIPLIER * evalMod.estimateCallCostUsd({ kind: "answer", model: C.MODEL, promptChars: promptText.length }) +
  evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel });

// ---- dry estimate ------------------------------------------------------------------------
let estTotal = 0;
const mismatch = [];
const added = [];
let fires = 0, exChanged = 0, lostAny = 0, gain = 0, loss = 0;
for (const { set, caseEntry } of sets) {
  const p = await prepare(caseEntry);
  if (baselineHash.get(caseEntry.id) !== p.basePromptHash) mismatch.push(caseEntry.id);
  estTotal += estimateFor(p.promptText) * REPEATS[set];
  if (p.gate.extraIds.length) fires++;
  added.push(p.diff.addedPromptChars);
  if (p.diff.excerptsChanged) exChanged++;
  if (p.diff.excerptsLostFromPrompt.length) lostAny++;
  if (p.decidingInArm > p.decidingInBase) gain++;
  if (p.decidingInArm < p.decidingInBase) loss++;
}
const sorted = [...added].sort((a, b) => a - b);
console.log(`Base prompt identical to baseline arm A: ${sets.length - mismatch.length}/${sets.length}; differs: ${mismatch.join(", ") || "none"}`);
console.log(`Gate fires on ${fires}/${sets.length}; added chars median ${sorted[Math.floor(sorted.length / 2)]} max ${sorted.at(-1)}; excerpts changed ${exChanged}; cases losing an excerpt rule ${lostAny}`);
console.log(`Case deciding rules: cases gaining one ${gain}, losing one ${loss}`);
console.log(`Estimate: $${estTotal.toFixed(2)}; already spent both probes $${C.spentBoth().toFixed(4)}; hard stop $${C.MAX_USD_TOTAL}`);
if (!live) process.exit(0);
if (mismatch.length) throw new Error("base prompt does not match the baseline; refusing");

// ---- live --------------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
const client = await C.makeClient(evalMod, env, judgeModel);
const done = new Set();
if (existsSync(RECORDS)) for (const line of readFileSync(RECORDS, "utf8").split("\n").filter(Boolean)) { const r = JSON.parse(line); done.add(`${r.caseId}|${r.repeat}`); }
let spent = C.spentBoth();
const queue = [];
for (const { set, caseEntry } of sets) for (let repeat = 1; repeat <= REPEATS[set]; repeat++) if (!done.has(`${caseEntry.id}|${repeat}`)) queue.push({ set, caseEntry, repeat });
if (queue.length > limit) queue.length = limit;
console.log(`Queue ${queue.length}; spent so far $${spent.toFixed(4)}`);
let reserved = 0;

async function runOne({ set, caseEntry, repeat }, state) {
  const p = await prepare(caseEntry);
  const est = estimateFor(p.promptText);
  if (spent + reserved + est > C.MAX_USD_TOTAL) { state.stoppedForCap = true; return; }
  reserved += est;
  try {
    const a = await C.answerOnce(client, exp, p.promptText);
    const judgeInputs = ji.buildJudgeInputs({ caseEntry, promptText: p.promptText, attachedRuleIds: ji.attachedRuleIdsOf(p.prepared), ruleIndex: resources.gameRulesRuleIndex });
    const res = await judgeAnswerAlone({ client, judgeModel, question: caseEntry.question, ...judgeInputs, answerText: a.answerText, workedSolution: caseEntry.expected.answer });
    const assertions = computeDeterministicAssertions(a.answerText, caseEntry.expected.decidingRuleIds, knownRuleIds);
    const availability = ra.describeDecidingRules({ decidingRuleIds: caseEntry.expected.decidingRuleIds, prepared: p.prepared, request: p.parsed, cardRulingsIndex: resources.cardRulingsIndex });
    const costUsd = evalMod.computeCallCostUsd(C.MODEL, a.usage.inputTokens, a.usage.outputTokens);
    const judgeCostUsd = evalMod.computeCallCostUsd(judgeModel, res.usage.inputTokens, res.usage.outputTokens);
    const record = {
      caseId: caseEntry.id, set, repeat, tier: caseEntry.tier, requestMode: p.parsed.mode, arm: "L",
      embeddingProvider: embedder.mode, usedSemantic: p.retrieval.usedSemantic, reportedModel: a.reportedModel,
      requestedEffort: null, reportedEffort: a.usage.reportedEffort, judgeModel, rubricRevision: RUBRIC_REVISION,
      scores: res.undetermined ? null : res.scores, undetermined: res.undetermined, rationale: res.undetermined ? res.reason : res.rationale,
      latencyMs: a.latencyMs, inputTokens: a.usage.inputTokens, outputTokens: a.usage.outputTokens, reasoningTokens: a.usage.reasoningTokens,
      costUsd, judgeCostUsd, totalCostUsd: costUsd + judgeCostUsd,
      gateBattlefield: p.gate.battlefield, gateStack: p.gate.stack, addedTopicIds: p.diff.addedTopicIds, addedPromptChars: p.diff.addedPromptChars,
      excerptsChanged: p.diff.excerptsChanged, excerptsLostFromPrompt: p.diff.excerptsLostFromPrompt, excerptsBackfilled: p.diff.excerptsBackfilled,
      excerptsRemovedNowInTopics: p.diff.excerptsRemovedNowInTopics,
      decidingInBase: p.decidingInBase, decidingInArm: p.decidingInArm, decidingTotal: p.decidingTotal,
      selectedRuleIds: p.retrieval.selectedRuleIds, goldRuleInPrompt: p.retrieval.goldRuleInPrompt,
      allDecidingRulesInPrompt: availability.allDecidingRulesInPrompt, namesGoldRuleId: assertions.namesGoldRuleId, unknownRuleIds: assertions.unknownRuleIds ?? [],
      basePromptHash: p.basePromptHash, basePromptMatchesBaselineArmA: true, basePromptChars: p.basePromptChars,
      promptChars: p.promptText.length, promptHash: p.promptHash,
      question: caseEntry.question, referenceAnswer: caseEntry.expected.answer, decidingRuleIds: caseEntry.expected.decidingRuleIds,
      answer: a.answerText, at: new Date().toISOString()
    };
    appendFileSync(RECORDS, `${JSON.stringify(record)}\n`);
    appendFileSync(PROMPTS, `${JSON.stringify({ caseId: caseEntry.id, repeat, prompt: p.promptText })}\n`);
    spent += record.totalCostUsd;
    console.log(`${set.padEnd(8)} ${caseEntry.id} r${repeat}: ${res.undetermined ? "?" : res.scores.correctness}  ${a.latencyMs}ms $${spent.toFixed(3)}`);
  } finally {
    reserved -= est;
  }
}

const state = await C.runQueue(queue, concurrency, runOne);
if (state.aborted) { console.error(`ABORTED: ${state.aborted.stack ?? state.aborted}`); process.exit(1); }
console.log(`${state.stoppedForCap ? "Stopped at the cost cap. " : ""}Done. Spent (both probes) $${spent.toFixed(4)}. Records: ${RECORDS}`);
