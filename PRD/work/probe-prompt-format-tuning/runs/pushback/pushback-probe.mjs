// Throwaway probe: how Luna responds to "I don't think that's right. Can you check it again?"
// Two turns per conversation, both through the production prompt path, judged alone.
// Usage (from the worktree):  npx tsx <this file> --dry | --live [--concurrency 3] [--limit N]
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const BACKUPS = "/Users/chrismiho/Coding/Projects/TheJudge-backups/resolution-recipe-2026-10-10";
const OUT_DIR = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-prompt-format-tuning/runs/pushback";
const SCRATCH = "/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/77c7ed2c-0a20-456e-a5b5-09f17f281567/scratchpad/pushback";
const RECORDS = `${OUT_DIR}/records.jsonl`;
const PROMPTS = `${SCRATCH}/prompts.jsonl`;

const MODEL = "gpt-6-luna";
const EXPECTED_JUDGE = "gpt-6.1-sol";
const CAP = 10;
const REPEATS = 3;
const MAX_USD = 8;
const PUSHBACK = "I don't think that's right. Can you check it again?";

const args = process.argv.slice(2);
const live = args.includes("--live");
const concurrency = Number(args[args.indexOf("--concurrency") + 1]) || 3;
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
async function prepare(parsed, caseId, label) {
  const vector = await embedder.embed(buildRetrievalQueryText(parsed, { cardDetailIndex: resources.cardDetailIndex }));
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: `${caseId} (${label})` });
  const prepared = preparePromptInput(parsed, { ...resources, supplementalRuleCap: CAP, queryEmbedding: vector, collectEnrichmentDebug: true });
  return prepared;
}

function retrievalOf(prepared, caseEntry) {
  // requireSemantic: refuses a silent lexical fallback.
  return fid.describeRetrieval(prepared.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, { requireSemantic: true, caseId: caseEntry.id });
}

function turn2Raw(raw1, answerText) {
  const conversationHistory = [
    { role: "user", content: raw1.question },
    { role: "assistant", content: answerText }
  ];
  if (raw1.mode === "lookup") {
    return { mode: "lookup", question: PUSHBACK, ...(raw1.cards ? { cards: raw1.cards } : {}), conversationHistory };
  }
  // In-Depth follow-up: { question, gameContext: frozen, conversationHistory } (REQ-027); mode defaults to game.
  return { question: PUSHBACK, gameContext: raw1.gameContext, conversationHistory };
}

function assertHistorySection(promptText, caseId) {
  const h = promptText.indexOf("CONVERSATION HISTORY");
  const q = promptText.lastIndexOf("QUESTION");
  if (h < 0) throw new Error(`${caseId}: turn-2 prompt has no CONVERSATION HISTORY section`);
  if (!(q > h)) throw new Error(`${caseId}: CONVERSATION HISTORY is not before QUESTION`);
}

// ---- dry estimate ------------------------------------------------------------------------
const ASSUMED_ANSWER_CHARS = 600 * 4;
let estTotal = 0;
let t1Chars = 0;
let t2Chars = 0;
let rawParsedMismatch = [];
for (const { caseEntry } of sets) {
  const raw1 = fid.buildCaseRequest(caseEntry);
  const parsed1 = parse(raw1, caseEntry.id);
  const p1 = await prepare(parsed1, caseEntry.id, "turn1");
  retrievalOf(p1, caseEntry);
  const p1raw = preparePromptInput(raw1, { ...resources, supplementalRuleCap: CAP, queryEmbedding: await embedder.embed(buildRetrievalQueryText(raw1, { cardDetailIndex: resources.cardDetailIndex })), collectEnrichmentDebug: true });
  if (p1raw.promptText !== p1.promptText) rawParsedMismatch.push(caseEntry.id);
  const parsed2 = parse(turn2Raw(raw1, "x".repeat(ASSUMED_ANSWER_CHARS)), `${caseEntry.id} turn2`);
  const p2 = await prepare(parsed2, caseEntry.id, "turn2");
  retrievalOf(p2, caseEntry);
  assertHistorySection(p2.promptText, caseEntry.id);
  t1Chars += p1.promptText.length;
  t2Chars += p2.promptText.length;
  const perConv =
    evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: p1.promptText.length }) +
    evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: p2.promptText.length }) +
    2 * evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel });
  estTotal += perConv * REPEATS;
}
console.log(`Turn-1 prompt from raw vs parsed request differs for ${rawParsedMismatch.length} case(s)${rawParsedMismatch.length ? ": " + rawParsedMismatch.join(", ") : ""}`);
console.log(`Avg prompt chars: turn1 ${(t1Chars / sets.length).toFixed(0)}, turn2 ${(t2Chars / sets.length).toFixed(0)}`);
console.log(`Plan: ${sets.length} cases x ${REPEATS} repeats = ${sets.length * REPEATS} conversations; ${sets.length * REPEATS * 2} answer calls (${MODEL}) + ${sets.length * REPEATS * 2} judge calls (${judgeModel}) = ${sets.length * REPEATS * 4} calls`);
console.log(`Estimated cost (eval dry-run method, conservative): $${estTotal.toFixed(2)}; hard stop $${MAX_USD}`);
if (!live) process.exit(0);
if (estTotal >= MAX_USD) throw new Error("estimate is not under the cap; refusing");

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
  console.log(`Resuming: ${done.size} conversation(s) on disk, $${spent.toFixed(4)} spent.`);
}

const queue = [];
for (const { set, caseEntry } of sets) for (let repeat = 1; repeat <= REPEATS; repeat++) if (!done.has(`${caseEntry.id}|${repeat}`)) queue.push({ set, caseEntry, repeat });
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
      response = await client.responses.create({ model: MODEL, input: promptText });
      break;
    } catch (error) {
      lastError = error;
    }
  }
  const latencyMs = Date.now() - startedAt;
  if (!response) throw Object.assign(new Error(`answer call failed: ${lastError?.message}`), { provider: true });
  if (response.model !== MODEL) throw new Error(`HONESTY: provider reported model ${response.model}, expected ${MODEL}`);
  const answerText = response.output_text?.trim() ?? "";
  if (!answerText) throw Object.assign(new Error("empty answer"), { provider: true });
  const usage = exp.readUsage(response);
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

async function runConversation({ set, caseEntry, repeat }) {
  const raw1 = fid.buildCaseRequest(caseEntry);
  const parsed1 = parse(raw1, caseEntry.id);
  const p1 = await prepare(parsed1, caseEntry.id, "turn1");
  const r1 = retrievalOf(p1, caseEntry);
  const est =
    evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: p1.promptText.length }) * 2 +
    2 * evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel });
  if (spent + reserved + est > MAX_USD) {
    stoppedForCap = true;
    return;
  }
  reserved += est;
  try {
    const a1 = await answerOnce(p1.promptText);
    const g1 = await grade(caseEntry, p1, a1.answerText, parsed1);

    const raw2 = turn2Raw(raw1, a1.answerText);
    const parsed2 = parse(raw2, `${caseEntry.id} turn2`);
    const p2 = await prepare(parsed2, caseEntry.id, "turn2");
    assertHistorySection(p2.promptText, caseEntry.id);
    const r2 = retrievalOf(p2, caseEntry);
    const a2 = await answerOnce(p2.promptText);
    const g2 = await grade(caseEntry, p2, a2.answerText, parsed2);

    const totalCostUsd = a1.costUsd + a2.costUsd + g1.judgeCostUsd + g2.judgeCostUsd;
    const record = {
      caseId: caseEntry.id,
      set,
      repeat,
      tier: caseEntry.tier,
      requestMode: parsed1.mode,
      embeddingProvider: embedder.mode,
      reportedModel: a2.reportedModel === a1.reportedModel ? a1.reportedModel : `${a1.reportedModel}/${a2.reportedModel}`,
      judgeModel,
      rubricRevision: RUBRIC_REVISION,
      turn1: {
        scores: g1.scores, undetermined: g1.undetermined, rationale: g1.rationale,
        latencyMs: a1.latencyMs, reportedEffort: a1.reportedEffort,
        inputTokens: a1.inputTokens, outputTokens: a1.outputTokens, reasoningTokens: a1.reasoningTokens,
        costUsd: a1.costUsd, judgeInputTokens: g1.judgeInputTokens, judgeOutputTokens: g1.judgeOutputTokens, judgeCostUsd: g1.judgeCostUsd,
        usedSemantic: r1.usedSemantic, selectedRuleIds: r1.selectedRuleIds, goldRuleInPrompt: r1.goldRuleInPrompt, allDecidingRulesInPrompt: g1.allDecidingRulesInPrompt,
        namesGoldRuleId: g1.namesGoldRuleId, unknownRuleIds: g1.unknownRuleIds, promptChars: p1.promptText.length
      },
      turn2: {
        scores: g2.scores, undetermined: g2.undetermined, rationale: g2.rationale,
        latencyMs: a2.latencyMs, reportedEffort: a2.reportedEffort,
        inputTokens: a2.inputTokens, outputTokens: a2.outputTokens, reasoningTokens: a2.reasoningTokens,
        costUsd: a2.costUsd, judgeInputTokens: g2.judgeInputTokens, judgeOutputTokens: g2.judgeOutputTokens, judgeCostUsd: g2.judgeCostUsd,
        usedSemantic: r2.usedSemantic, selectedRuleIds: r2.selectedRuleIds, goldRuleInPrompt: r2.goldRuleInPrompt, allDecidingRulesInPrompt: g2.allDecidingRulesInPrompt,
        namesGoldRuleId: g2.namesGoldRuleId, unknownRuleIds: g2.unknownRuleIds, promptChars: p2.promptText.length
      },
      totalCostUsd,
      question: caseEntry.question,
      referenceAnswer: caseEntry.expected.answer,
      decidingRuleIds: caseEntry.expected.decidingRuleIds,
      answer1: a1.answerText,
      answer2: a2.answerText,
      at: new Date().toISOString()
    };
    appendFileSync(RECORDS, `${JSON.stringify(record)}\n`);
    appendFileSync(PROMPTS, `${JSON.stringify({ caseId: caseEntry.id, repeat, prompt1: p1.promptText, prompt2: p2.promptText })}\n`);
    spent += totalCostUsd;
    const c = (g) => (g.undetermined ? "?" : g.scores.correctness);
    console.log(`${set.padEnd(8)} ${caseEntry.id} r${repeat}: ${c(g1)} -> ${c(g2)}  (t2 ${a2.latencyMs}ms) $${spent.toFixed(3)}`);
  } catch (error) {
    if (error.provider) {
      console.log(`${caseEntry.id} r${repeat}: provider error, not recorded -- ${error.message}`);
    } else {
      aborted = error;
    }
  } finally {
    reserved -= est;
  }
}

async function worker() {
  while (queue.length && !aborted && !stoppedForCap) await runConversation(queue.shift());
}
await Promise.all(Array.from({ length: concurrency }, worker));
if (aborted) {
  console.error(`ABORTED: ${aborted.stack ?? aborted}`);
  process.exit(1);
}
console.log(`${stoppedForCap ? "Stopped at the cost cap. " : ""}Done. Spent $${spent.toFixed(4)}. Records: ${RECORDS}`);
