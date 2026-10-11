// Throwaway probe: two candidate fixes for "a follow-up loses its rule excerpts".
// Same conversations as runs/pushback/pushback-probe.mjs (turn 1 = production, turn 2 = the scripted pushback),
// but turn 2's ADDITIONAL RELEVANT RULE EXCERPTS section is swapped:
//   --arm q : excerpts retrieved for (first question + follow-up) + the same card signal / game context
//             (both the embedded text and the lexical tokens see the combined question).
//   --arm c : excerpts = turn 1's excerpts (same selected rule ids, same order).
// Seam: production turn-2 prompt is built by preparePromptInput exactly as the route does; the only edit is a
// verbatim replacement of its formatSupplementalRulesSection(...) block (asserted to occur exactly once).
// No product code is modified.
// Usage (from the worktree):  npx tsx <this file> --arm q|c --dry | --live [--concurrency 3] [--limit N]
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const BACKUPS = "/Users/chrismiho/Coding/Projects/TheJudge-backups/resolution-recipe-2026-10-10";
const RUNS = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-prompt-format-tuning/runs";
const SCRATCH = "/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/77c7ed2c-0a20-456e-a5b5-09f17f281567/scratchpad/pushback-fix";

const args = process.argv.slice(2);
const ARM = args[args.indexOf("--arm") + 1];
if (!["q", "c"].includes(ARM)) throw new Error("--arm q|c required");
const OUT_DIR = `${RUNS}/pushback-${ARM}`;
const RECORDS = `${OUT_DIR}/records.jsonl`;
const PROMPTS = `${SCRATCH}/prompts-${ARM}.jsonl`;
// The $8 cap is shared by both arms: spend already on disk in either arm counts.
const ALL_RECORDS = [`${RUNS}/pushback-q/records.jsonl`, `${RUNS}/pushback-c/records.jsonl`];

const MODEL = "gpt-6-luna";
const EXPECTED_JUDGE = "gpt-6.1-sol";
const CAP = 10;
const REPEATS = 3;
const MAX_USD = 8;
const PUSHBACK = "I don't think that's right. Can you check it again?";

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
const { formatSupplementalRulesSection } = await imp("apps/backend/src/prompt/promptFormatting.ts");
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
console.log(`Arm ${ARM.toUpperCase()}. Cases: ${sets.length} (hard ${sets.filter((s) => s.set === "hard").length}, ordinary ${sets.filter((s) => s.set === "ordinary").length}); rubric ${RUBRIC_REVISION}; judge ${judgeModel}`);

const resources = await fid.loadPromptResources({ env });
const knownRuleIds = new Set(resources.gameRulesRuleIndex.map((e) => e.ruleId));
const ruleById = new Map(resources.gameRulesRuleIndex.map((e) => [e.ruleId, e]));
if (ruleById.size !== resources.gameRulesRuleIndex.length) throw new Error("rule index has duplicate rule ids");
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);

function parse(raw, label) {
  const r = askAiRequestSchema.safeParse(raw);
  if (!r.success) throw new Error(`${label}: askAiRequestSchema rejects the request: ${r.error.message}`);
  return r.data;
}

// Production: the route parses, embeds buildRetrievalQueryText(parsed), then preparePromptInput(parsed, ...).
async function prepare(request, caseId, label) {
  const vector = await embedder.embed(buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex }));
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: `${caseId} (${label})` });
  return preparePromptInput(request, { ...resources, supplementalRuleCap: CAP, queryEmbedding: vector, collectEnrichmentDebug: true });
}

function retrievalOf(prepared, caseEntry) {
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
  return { question: PUSHBACK, gameContext: raw1.gameContext, conversationHistory };
}

function assertHistorySection(promptText, caseId) {
  const h = promptText.indexOf("CONVERSATION HISTORY");
  const q = promptText.lastIndexOf("QUESTION");
  if (h < 0) throw new Error(`${caseId}: turn-2 prompt has no CONVERSATION HISTORY section`);
  if (!(q > h)) throw new Error(`${caseId}: CONVERSATION HISTORY is not before QUESTION`);
}

const asRules = (selected) =>
  selected.map(({ ruleId, score }) => {
    const e = ruleById.get(ruleId);
    if (!e) throw new Error(`rule ${ruleId} not in the index`);
    return { ruleId, sectionTitle: e.sectionTitle, text: e.text, score };
  });
const topicIdsOf = (p) => JSON.stringify(p.enrichmentDebug.curatedGameRules.topicIds);

// Arm Q retrieval: production turn-2 request with the question field replaced by first question + follow-up.
// Used ONLY to obtain the ranked excerpts (embedding + lexical tokens both see the combined text); its prompt is
// discarded. Not schema-parsed, because a real fix would build the query server-side, not inflate the 600-char field.
async function armQSelected(parsed2, firstQuestion, caseEntry, p2) {
  const qReq = { ...parsed2, question: `${firstQuestion} ${PUSHBACK}` };
  const qp = await prepare(qReq, caseEntry.id, "armQ-retrieval");
  if (topicIdsOf(qp) !== topicIdsOf(p2)) throw new Error(`${caseEntry.id}: arm Q changed the curated topics`);
  const r = retrievalOf(qp, caseEntry);
  return { selected: qp.enrichmentDebug.supplemental.selected, usedSemantic: r.usedSemantic, queryText: qp.enrichmentDebug.supplemental.queryText };
}

// The seam: swap the excerpt section in the production turn-2 prompt; everything else byte-identical.
function swapExcerpts(p2, armSelected, caseId) {
  const prodRules = asRules(p2.enrichmentDebug.supplemental.selected);
  const prodSection = formatSupplementalRulesSection(prodRules);
  if (!prodSection) throw new Error(`${caseId}: production turn 2 attached no excerpts`);
  const first = p2.promptText.indexOf(prodSection);
  if (first < 0) throw new Error(`${caseId}: rebuilt production excerpt section not found verbatim in the turn-2 prompt`);
  if (p2.promptText.indexOf(prodSection, first + 1) >= 0) throw new Error(`${caseId}: excerpt section occurs twice`);
  const armSection = formatSupplementalRulesSection(asRules(armSelected));
  const promptText = p2.promptText.slice(0, first) + armSection + p2.promptText.slice(first + prodSection.length);
  const prepared = {
    ...p2,
    promptText,
    enrichmentDebug: { ...p2.enrichmentDebug, supplemental: { ...p2.enrichmentDebug.supplemental, selected: armSelected.map(({ ruleId, sectionTitle, score }) => ({ ruleId, sectionTitle, score })) } }
  };
  return prepared;
}

async function buildTurn2(raw1, parsed1, p1, answerText, caseEntry) {
  const parsed2 = parse(turn2Raw(raw1, answerText), `${caseEntry.id} turn2`);
  const p2 = await prepare(parsed2, caseEntry.id, "turn2-production");
  assertHistorySection(p2.promptText, caseEntry.id);
  const prodR = retrievalOf(p2, caseEntry);
  let armSelected;
  let armQueryText = null;
  if (ARM === "q") {
    const q = await armQSelected(parsed2, raw1.question, caseEntry, p2);
    armSelected = q.selected;
    armQueryText = q.queryText;
  } else {
    if (topicIdsOf(p1) !== topicIdsOf(p2)) throw new Error(`${caseEntry.id}: turn-1 and turn-2 curated topics differ; carry-forward could duplicate`);
    armSelected = p1.enrichmentDebug.supplemental.selected;
  }
  const armP2 = swapExcerpts(p2, armSelected, caseEntry.id);
  assertHistorySection(armP2.promptText, caseEntry.id);
  const r2 = retrievalOf(armP2, caseEntry);
  return { parsed2, p2, armP2, r2, prodSelectedRuleIds: prodR.selectedRuleIds, armQueryText };
}

// ---- dry checks + estimate ---------------------------------------------------------------
const ASSUMED_ANSWER_CHARS = 600 * 4;
let estTotal = 0;
const ov = { prod: [], arm: [], qEmbedOnly: [] };
const decidingIn = { t1: 0, prod: 0, arm: 0 };
for (const { caseEntry } of sets) {
  const raw1 = fid.buildCaseRequest(caseEntry);
  const parsed1 = parse(raw1, caseEntry.id);
  const p1 = await prepare(parsed1, caseEntry.id, "turn1");
  const r1 = retrievalOf(p1, caseEntry);
  const t = await buildTurn2(raw1, parsed1, p1, "x".repeat(ASSUMED_ANSWER_CHARS), caseEntry);
  // Seam sanity: swapping in production's own selection reproduces the production prompt byte for byte.
  if (swapExcerpts(t.p2, t.p2.enrichmentDebug.supplemental.selected, caseEntry.id).promptText !== t.p2.promptText) throw new Error(`${caseEntry.id}: identity swap changed the prompt`);
  // The arm prompt differs from production only inside the excerpt section.
  const prodSec = formatSupplementalRulesSection(asRules(t.p2.enrichmentDebug.supplemental.selected));
  const i = t.p2.promptText.indexOf(prodSec);
  const armSec = formatSupplementalRulesSection(asRules(t.armP2.enrichmentDebug.supplemental.selected));
  if (t.armP2.promptText.slice(0, i) !== t.p2.promptText.slice(0, i) || t.armP2.promptText.slice(i + armSec.length) !== t.p2.promptText.slice(i + prodSec.length)) throw new Error(`${caseEntry.id}: arm prompt differs outside the excerpt section`);
  // Side number: the narrowest product seam (embed the combined text, lexical half still sees only the follow-up).
  const combinedEmbedText = buildRetrievalQueryText({ ...t.parsed2, question: `${raw1.question} ${PUSHBACK}` }, { cardDetailIndex: resources.cardDetailIndex });
  const pe = preparePromptInput(t.parsed2, { ...resources, supplementalRuleCap: CAP, queryEmbedding: await embedder.embed(combinedEmbedText), collectEnrichmentDebug: true });
  const peIds = retrievalOf(pe, caseEntry).selectedRuleIds;
  const share = (ids) => r1.selectedRuleIds.filter((id) => ids.includes(id)).length;
  ov.prod.push(share(t.prodSelectedRuleIds));
  ov.arm.push(share(t.r2.selectedRuleIds));
  ov.qEmbedOnly.push(share(peIds));
  const avail = (p, req) => ra.describeDecidingRules({ decidingRuleIds: caseEntry.expected.decidingRuleIds, prepared: p, request: req, cardRulingsIndex: resources.cardRulingsIndex }).allDecidingRulesInPrompt;
  if (avail(p1, parsed1)) decidingIn.t1++;
  if (avail(t.p2, t.parsed2)) decidingIn.prod++;
  if (avail(t.armP2, t.parsed2)) decidingIn.arm++;
  estTotal +=
    REPEATS *
    (evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: p1.promptText.length }) +
      evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: t.armP2.promptText.length }) +
      2 * evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel }));
}
const mean = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2);
console.log(`Seam checks passed for all ${sets.length} cases (identity swap reproduces production; arm prompt differs only in the excerpt section).`);
console.log(`Turn-2 excerpts shared with turn 1 (of 10, per case): production ${mean(ov.prod)}, arm ${ARM.toUpperCase()} ${mean(ov.arm)}, embed-only Q seam ${mean(ov.qEmbedOnly)}`);
console.log(`All deciding rules in prompt (cases): turn1 ${decidingIn.t1}/${sets.length}, turn2 production ${decidingIn.prod}/${sets.length}, turn2 arm ${decidingIn.arm}/${sets.length}`);
let spentAll = 0;
for (const f of ALL_RECORDS) if (existsSync(f)) for (const l of readFileSync(f, "utf8").split("\n").filter(Boolean)) spentAll += JSON.parse(l).totalCostUsd ?? 0;
console.log(`Plan: ${sets.length} x ${REPEATS} = ${sets.length * REPEATS} conversations, ${sets.length * REPEATS * 4} calls. Estimated (conservative eval method): $${estTotal.toFixed(2)}. Already spent across both arms: $${spentAll.toFixed(4)}; shared hard stop $${MAX_USD}`);
if (!live) process.exit(0);

// ---- live --------------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(SCRATCH, { recursive: true });
const require = createRequire(`${REPO}/apps/backend/package.json`);
const { default: OpenAI } = await import(pathToFileURL(require.resolve("openai")).href);
const client = new OpenAI(evalMod.openAiClientOptions(env));
const { missing } = await evalMod.checkModelAccess({ client, modelIds: [MODEL, judgeModel] });
if (missing.length) throw new Error(`no access to ${missing.join(", ")}`);

const done = new Set();
if (existsSync(RECORDS)) for (const l of readFileSync(RECORDS, "utf8").split("\n").filter(Boolean)) { const r = JSON.parse(l); done.add(`${r.caseId}|${r.repeat}`); }
let spent = spentAll; // shared across arms
console.log(`Resuming: ${done.size} conversation(s) on disk for this arm; $${spent.toFixed(4)} spent across arms.`);

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
    answerText, latencyMs, reportedModel: response.model, reportedEffort: usage.reportedEffort,
    inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, reasoningTokens: usage.reasoningTokens,
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

const turnRecord = (g, a, r, p) => ({
  scores: g.scores, undetermined: g.undetermined, rationale: g.rationale,
  latencyMs: a.latencyMs, reportedEffort: a.reportedEffort,
  inputTokens: a.inputTokens, outputTokens: a.outputTokens, reasoningTokens: a.reasoningTokens,
  costUsd: a.costUsd, judgeInputTokens: g.judgeInputTokens, judgeOutputTokens: g.judgeOutputTokens, judgeCostUsd: g.judgeCostUsd,
  usedSemantic: r.usedSemantic, selectedRuleIds: r.selectedRuleIds, goldRuleInPrompt: r.goldRuleInPrompt, allDecidingRulesInPrompt: g.allDecidingRulesInPrompt,
  namesGoldRuleId: g.namesGoldRuleId, unknownRuleIds: g.unknownRuleIds, promptChars: p.promptText.length
});

async function runConversation({ set, caseEntry, repeat }) {
  const raw1 = fid.buildCaseRequest(caseEntry);
  const parsed1 = parse(raw1, caseEntry.id);
  const p1 = await prepare(parsed1, caseEntry.id, "turn1");
  const r1 = retrievalOf(p1, caseEntry);
  const est = evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: p1.promptText.length }) * 2 + 2 * evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel });
  if (spent + reserved + est > MAX_USD) { stoppedForCap = true; return; }
  reserved += est;
  try {
    const a1 = await answerOnce(p1.promptText);
    const g1 = await grade(caseEntry, p1, a1.answerText, parsed1);
    const t = await buildTurn2(raw1, parsed1, p1, a1.answerText, caseEntry);
    const a2 = await answerOnce(t.armP2.promptText);
    const g2 = await grade(caseEntry, t.armP2, a2.answerText, t.parsed2);
    const totalCostUsd = a1.costUsd + a2.costUsd + g1.judgeCostUsd + g2.judgeCostUsd;
    const record = {
      arm: ARM, caseId: caseEntry.id, set, repeat, tier: caseEntry.tier, requestMode: parsed1.mode,
      embeddingProvider: embedder.mode,
      reportedModel: a2.reportedModel === a1.reportedModel ? a1.reportedModel : `${a1.reportedModel}/${a2.reportedModel}`,
      judgeModel, rubricRevision: RUBRIC_REVISION,
      turn1: turnRecord(g1, a1, r1, p1),
      turn2: { ...turnRecord(g2, a2, t.r2, t.armP2), productionSelectedRuleIds: t.prodSelectedRuleIds, armQueryText: t.armQueryText },
      totalCostUsd,
      question: caseEntry.question, referenceAnswer: caseEntry.expected.answer, decidingRuleIds: caseEntry.expected.decidingRuleIds,
      answer1: a1.answerText, answer2: a2.answerText, at: new Date().toISOString()
    };
    appendFileSync(RECORDS, `${JSON.stringify(record)}\n`);
    appendFileSync(PROMPTS, `${JSON.stringify({ caseId: caseEntry.id, repeat, prompt1: p1.promptText, prompt2: t.armP2.promptText })}\n`);
    spent += totalCostUsd;
    const c = (g) => (g.undetermined ? "?" : g.scores.correctness);
    console.log(`${set.padEnd(8)} ${caseEntry.id} r${repeat}: ${c(g1)} -> ${c(g2)}  (t2 ${a2.latencyMs}ms) $${spent.toFixed(3)}`);
  } catch (error) {
    if (error.provider) console.log(`${caseEntry.id} r${repeat}: provider error, not recorded -- ${error.message}`);
    else aborted = error;
  } finally {
    reserved -= est;
  }
}

async function worker() {
  while (queue.length && !aborted && !stoppedForCap) await runConversation(queue.shift());
}
await Promise.all(Array.from({ length: concurrency }, worker));
if (aborted) { console.error(`ABORTED: ${aborted.stack ?? aborted}`); process.exit(1); }
console.log(`${stoppedForCap ? "Stopped at the cost cap. " : ""}Done. Spent across arms $${spent.toFixed(4)}. Records: ${RECORDS}`);
