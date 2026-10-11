// Throwaway probe: does reasoning effort "high" fix Luna's wrong answers, and what does it cost in answer time?
// Single turn, production request path; the ONLY change from production is reasoning: { effort: "high" }.
// Usage (from the worktree):  npx tsx <this file> --dry | --live [--concurrency 3] [--limit N]
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const BACKUPS = "/Users/chrismiho/Coding/Projects/TheJudge-backups/resolution-recipe-2026-10-10";
const OUT_DIR = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-prompt-format-tuning/runs/effort-high";
const SCRATCH = "/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/77c7ed2c-0a20-456e-a5b5-09f17f281567/scratchpad/effort";
const RECORDS = `${OUT_DIR}/records.jsonl`;
const PROMPTS = `${SCRATCH}/prompts.jsonl`;

const MODEL = "gpt-6-luna";
const EFFORT = "high";
const EXPECTED_JUDGE = "gpt-6.1-sol";
const CAP = 10;
const REPEATS = { hard: 6, ordinary: 1 };
const MAX_USD = 5;
// High effort spends more reasoning tokens than the eval estimator assumes; inflate the answer estimate.
const ANSWER_ESTIMATE_MULTIPLIER = 4;

const args = process.argv.slice(2);
const live = args.includes("--live");
const concurrency = Math.min(3, Number(args[args.indexOf("--concurrency") + 1]) || 3);
const limit = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const gold = await imp("scripts/lib/gold-cases.mjs");
const exp = await imp("scripts/lib/experiment-run.mjs");
const ji = await imp("scripts/lib/judge-inputs.mjs");
const ra = await imp("scripts/lib/rule-availability.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const { judgeAnswerAlone } = await imp("apps/backend/src/eval/answer-quality/judge.ts");
const { RUBRIC_REVISION } = await imp("apps/backend/src/eval/answer-quality/rubric.ts");
const { computeDeterministicAssertions } = await imp("apps/backend/src/eval/answer-quality/assertions.ts");

const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
const judgeModel = evalMod.resolveJudgeModel(env);
if (judgeModel !== EXPECTED_JUDGE) throw new Error(`judge model is ${judgeModel}, expected ${EXPECTED_JUDGE}`);
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

// ---- baseline prompt hashes (arm A, medium) -------------------------------------------------
const baselineHash = new Map();
for (const runId of ["rr-hard", "rr-regression"]) {
  for (const line of readFileSync(`${BACKUPS}/${runId}/calls.jsonl`, "utf8").split("\n").filter(Boolean)) {
    const r = JSON.parse(line).record;
    if (r?.arm === "A" && r.promptHash) baselineHash.set(r.caseId, r.promptHash);
  }
}

// ---- cases -------------------------------------------------------------------------------
const allCases = await gold.loadGoldCases();
const sources = await gold.loadSnapshotSources();
const isStale = (c) => gold.compareSnapshot(c, sources).stale;
const sets = [];
for (const [set, runId] of [["hard", "rr-hard"], ["ordinary", "rr-regression"]]) {
  const manifest = JSON.parse(readFileSync(`${BACKUPS}/${runId}/manifest.json`, "utf8"));
  const cases = exp.validateManifestCases({ manifest: { cases: manifest.caseList }, allCases, isStale });
  for (const c of cases) sets.push({ set, caseEntry: c });
}
console.log(`Cases: ${sets.length} (hard ${sets.filter((s) => s.set === "hard").length}, ordinary ${sets.filter((s) => s.set === "ordinary").length}); rubric ${RUBRIC_REVISION}; judge ${judgeModel}`);

const resources = await fid.loadPromptResources({ env });
const knownRuleIds = new Set(resources.gameRulesRuleIndex.map((e) => e.ruleId));
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);

function parse(raw, label) {
  const r = askAiRequestSchema.safeParse(raw);
  if (!r.success) throw new Error(`${label}: askAiRequestSchema rejects the request: ${r.error.message}`);
  return r.data;
}

// Production: the route parses, embeds buildRetrievalQueryText(parsed), then preparePromptInput(parsed, ...).
async function prepare(parsed, caseId) {
  const vector = await embedder.embed(buildRetrievalQueryText(parsed, { cardDetailIndex: resources.cardDetailIndex }));
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId });
  return preparePromptInput(parsed, { ...resources, supplementalRuleCap: CAP, queryEmbedding: vector, collectEnrichmentDebug: true });
}

function retrievalOf(prepared, caseEntry) {
  // requireSemantic: refuses a silent lexical fallback.
  return fid.describeRetrieval(prepared.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, { requireSemantic: true, caseId: caseEntry.id });
}

// ---- dry estimate ------------------------------------------------------------------------
let estTotal = 0;
const hashMismatch = [];
const missingBaseline = [];
for (const { set, caseEntry } of sets) {
  const parsed = parse(fid.buildCaseRequest(caseEntry), caseEntry.id);
  const p = await prepare(parsed, caseEntry.id);
  retrievalOf(p, caseEntry);
  const h = sha256(p.promptText);
  if (!baselineHash.has(caseEntry.id)) missingBaseline.push(caseEntry.id);
  else if (baselineHash.get(caseEntry.id) !== h) hashMismatch.push(caseEntry.id);
  const per =
    ANSWER_ESTIMATE_MULTIPLIER * evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: p.promptText.length }) +
    evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel });
  estTotal += per * REPEATS[set];
}
const nAnswers = sets.reduce((n, s) => n + REPEATS[s.set], 0);
console.log(`Prompt identical to baseline arm A: ${sets.length - hashMismatch.length - missingBaseline.length}/${sets.length}; differs: ${hashMismatch.join(", ") || "none"}; no baseline: ${missingBaseline.join(", ") || "none"}`);
console.log(`Plan: ${nAnswers} answers (${MODEL}, effort ${EFFORT}) + ${nAnswers} judge calls (${judgeModel})`);
console.log(`Estimated cost (answer estimate x${ANSWER_ESTIMATE_MULTIPLIER}): $${estTotal.toFixed(2)}; hard stop $${MAX_USD}`);
if (!live) process.exit(0);
if (estTotal >= MAX_USD) throw new Error("estimate is not under the cap; refusing");
if (hashMismatch.length || missingBaseline.length) throw new Error("prompt does not match the baseline; refusing");

// ---- live --------------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
const require = createRequire(`${REPO}/apps/backend/package.json`);
const { default: OpenAI } = await import(pathToFileURL(require.resolve("openai")).href);
const client = new OpenAI(evalMod.openAiClientOptions(env)); // SDK defaults, as the eval
const { missing } = await evalMod.checkModelAccess({ client, modelIds: [MODEL, judgeModel] });
if (missing.length) throw new Error(`no access to ${missing.join(", ")}`);

const done = new Set();
let spent = 0;
if (existsSync(RECORDS)) {
  for (const line of readFileSync(RECORDS, "utf8").split("\n").filter(Boolean)) {
    const r = JSON.parse(line);
    done.add(`${r.caseId}|${r.repeat}`);
    spent += r.totalCostUsd ?? 0;
  }
  console.log(`Resuming: ${done.size} answer(s) on disk, $${spent.toFixed(4)} spent.`);
}

const queue = [];
for (const { set, caseEntry } of sets) for (let repeat = 1; repeat <= REPEATS[set]; repeat++) if (!done.has(`${caseEntry.id}|${repeat}`)) queue.push({ set, caseEntry, repeat });
if (queue.length > limit) queue.length = limit;

let reserved = 0;
let aborted = null;
let stoppedForCap = false;

async function answerOnce(promptText) {
  const startedAt = Date.now();
  let response;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // The single change from production: an explicit reasoning effort.
      response = await client.responses.create({ model: MODEL, input: promptText, reasoning: { effort: EFFORT } });
      break;
    } catch (error) {
      lastError = error;
    }
  }
  const latencyMs = Date.now() - startedAt;
  if (!response) throw Object.assign(new Error(`answer call failed: ${lastError?.message}`), { provider: true });
  if (response.model !== MODEL) throw new Error(`HONESTY: provider reported model ${response.model}, expected ${MODEL}`);
  const usage = exp.readUsage(response);
  if (usage.reportedEffort !== EFFORT) throw new Error(`HONESTY: provider reported effort ${usage.reportedEffort}, expected ${EFFORT}`);
  const answerText = response.output_text?.trim() ?? "";
  if (!answerText) throw Object.assign(new Error("empty answer"), { provider: true });
  return {
    answerText,
    latencyMs,
    reportedModel: response.model,
    reportedEffort: usage.reportedEffort,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    reasoningTokens: usage.reasoningTokens,
    costUsd: evalMod.computeCallCostUsd(MODEL, usage.inputTokens, usage.outputTokens)
  };
}

async function grade(caseEntry, prepared, answerText, request) {
  const judgeInputs = ji.buildJudgeInputs({ caseEntry, promptText: prepared.promptText, attachedRuleIds: ji.attachedRuleIdsOf(prepared), ruleIndex: resources.gameRulesRuleIndex });
  const res = await judgeAnswerAlone({ client, judgeModel, question: caseEntry.question, ...judgeInputs, answerText, workedSolution: caseEntry.expected.answer });
  const assertions = computeDeterministicAssertions(answerText, caseEntry.expected.decidingRuleIds, knownRuleIds);
  const availability = ra.describeDecidingRules({ decidingRuleIds: caseEntry.expected.decidingRuleIds, prepared, request, cardRulingsIndex: resources.cardRulingsIndex });
  return {
    undetermined: res.undetermined,
    scores: res.undetermined ? null : res.scores,
    rationale: res.undetermined ? res.reason : res.rationale,
    namesGoldRuleId: assertions.namesGoldRuleId,
    unknownRuleIds: assertions.unknownRuleIds ?? [],
    allDecidingRulesInPrompt: availability.allDecidingRulesInPrompt,
    judgeInputTokens: res.usage.inputTokens,
    judgeOutputTokens: res.usage.outputTokens,
    judgeCostUsd: evalMod.computeCallCostUsd(judgeModel, res.usage.inputTokens, res.usage.outputTokens)
  };
}

async function runOne({ set, caseEntry, repeat }) {
  const parsed = parse(fid.buildCaseRequest(caseEntry), caseEntry.id);
  const p = await prepare(parsed, caseEntry.id);
  const r = retrievalOf(p, caseEntry);
  const promptHash = sha256(p.promptText);
  if (promptHash !== baselineHash.get(caseEntry.id)) throw new Error(`${caseEntry.id}: prompt drifted from baseline`);
  const est =
    ANSWER_ESTIMATE_MULTIPLIER * evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: p.promptText.length }) +
    evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel });
  if (spent + reserved + est > MAX_USD) {
    stoppedForCap = true;
    return;
  }
  reserved += est;
  try {
    const a = await answerOnce(p.promptText);
    const g = await grade(caseEntry, p, a.answerText, parsed);
    const totalCostUsd = a.costUsd + g.judgeCostUsd;
    const record = {
      caseId: caseEntry.id,
      set,
      repeat,
      tier: caseEntry.tier,
      requestMode: parsed.mode,
      embeddingProvider: embedder.mode,
      reportedModel: a.reportedModel,
      requestedEffort: EFFORT,
      reportedEffort: a.reportedEffort,
      judgeModel,
      rubricRevision: RUBRIC_REVISION,
      scores: g.scores,
      undetermined: g.undetermined,
      rationale: g.rationale,
      latencyMs: a.latencyMs,
      inputTokens: a.inputTokens,
      outputTokens: a.outputTokens,
      reasoningTokens: a.reasoningTokens,
      costUsd: a.costUsd,
      judgeInputTokens: g.judgeInputTokens,
      judgeOutputTokens: g.judgeOutputTokens,
      judgeCostUsd: g.judgeCostUsd,
      totalCostUsd,
      usedSemantic: r.usedSemantic,
      selectedRuleIds: r.selectedRuleIds,
      goldRuleInPrompt: r.goldRuleInPrompt,
      allDecidingRulesInPrompt: g.allDecidingRulesInPrompt,
      namesGoldRuleId: g.namesGoldRuleId,
      unknownRuleIds: g.unknownRuleIds,
      promptChars: p.promptText.length,
      promptHash,
      promptMatchesBaselineArmA: true,
      question: caseEntry.question,
      referenceAnswer: caseEntry.expected.answer,
      decidingRuleIds: caseEntry.expected.decidingRuleIds,
      answer: a.answerText,
      at: new Date().toISOString()
    };
    appendFileSync(RECORDS, `${JSON.stringify(record)}\n`);
    appendFileSync(PROMPTS, `${JSON.stringify({ caseId: caseEntry.id, repeat, prompt: p.promptText })}\n`);
    spent += totalCostUsd;
    console.log(`${set.padEnd(8)} ${caseEntry.id} r${repeat}: ${g.undetermined ? "?" : g.scores.correctness}  ${a.latencyMs}ms rt=${a.reasoningTokens} $${spent.toFixed(3)}`);
  } catch (error) {
    if (error.provider) console.log(`${caseEntry.id} r${repeat}: provider error, not recorded -- ${error.message}`);
    else aborted = error;
  } finally {
    reserved -= est;
  }
}

async function worker() {
  while (queue.length && !aborted && !stoppedForCap) await runOne(queue.shift());
}
await Promise.all(Array.from({ length: concurrency }, worker));
if (aborted) {
  console.error(`ABORTED: ${aborted.stack ?? aborted}`);
  process.exit(1);
}
console.log(`${stoppedForCap ? "Stopped at the cost cap. " : ""}Done. Spent $${spent.toFixed(4)}. Records: ${RECORDS}`);
