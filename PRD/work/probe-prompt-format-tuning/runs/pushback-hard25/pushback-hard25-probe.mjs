// Throwaway probe: scripted player pushback on the hard 25, turn 1's excerpts carried forward (arm C).
// Copy of runs/selfcheck-corpus/selfcheck-probe.mjs with the turn-2 text set to the pushback line; hard25 only.
// Derived from runs/pushback-c/pushback-fix-probe.mjs --arm c: turn 1 = production; turn 2 = production follow-up
// (conversationHistory, REQ-027) whose supplemental rule-excerpt block is swapped for turn 1's exact excerpts
// (carry-forward). The ONLY change from arm C is the turn-2 text: a neutral self-check instead of the pushback line.
// Both turns judged alone (judgeAnswerAlone, gpt-6.1-sol).
//   --set hard25 : RulesGuru hard-25 (`final` ids), cases loaded as the suite run loads them; output stays under
//                  output/rulesguru/ (gitignored, local only).
//   --set corpus : the 62 rr-hard + rr-regression gold cases.
// Honesty: local embedder, semantic retrieval every turn, provider model gpt-6-luna, reported effort medium,
// judge gpt-6.1-sol; turn-1 prompt hash must equal the earlier runs' prompt (suite: pft-pass records; corpus:
// arm C prompt1); corpus dry run also rebuilds arm C's turn-2 prompt byte for byte from its recorded answer.
// No product code is modified.
// Usage: npx tsx <this file> --set hard25|corpus [--live] [--concurrency 3] [--repeats N] [--limit N]
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/rulesguru`;
const BACKUPS = "/Users/chrismiho/Coding/Projects/TheJudge-backups/resolution-recipe-2026-10-10";
const RUNS = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-prompt-format-tuning/runs";
const SCRATCH = "/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/77c7ed2c-0a20-456e-a5b5-09f17f281567/scratchpad/pushback-hard25";
const ARM_C_PROMPTS = "/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/77c7ed2c-0a20-456e-a5b5-09f17f281567/scratchpad/pushback-fix/prompts-c.jsonl";
const ARM_C_RECORDS = `${RUNS}/pushback-c/records.jsonl`;

const args = process.argv.slice(2);
const flag = (name, dflt) => (args.includes(name) ? args[args.indexOf(name) + 1] : dflt);
const SET = flag("--set");
if (SET !== "hard25") throw new Error("--set hard25 required (pushback on the corpus already ran as runs/pushback-c)");
const live = args.includes("--live");
const concurrency = Math.min(3, Number(flag("--concurrency", 3)));
const REPEATS = Number(flag("--repeats", SET === "hard25" ? 5 : 3));
const limit = Number(flag("--limit", Infinity));

const OUT = {
  hard25: { dir: `${SUITE}/runs/probe-pushback-hard25`, prompts: `${SUITE}/runs/probe-pushback-hard25/prompts.jsonl` },
  corpus: { dir: `${RUNS}/selfcheck-corpus`, prompts: `${SCRATCH}/prompts-corpus.jsonl` }
};
const OUT_DIR = OUT[SET].dir;
const RECORDS = `${OUT_DIR}/records.jsonl`;
const PROMPTS = OUT[SET].prompts;
const ALL_RECORDS = [`${OUT.hard25.dir}/records.jsonl`]; // own $6 cap

const MODEL = "gpt-6-luna";
const EXPECTED_JUDGE = "gpt-6.1-sol";
const EXPECTED_EFFORT = "medium";
const CAP = 10;
const MAX_USD = 6;
const CHECK = "I don't think that's right. Can you check it again?"; // the pushback line, same text as runs/pushback*
const PUSHBACK = "I don't think that's right. Can you check it again?"; // arm C text, used only for the corpus fidelity rebuild

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const gold = await imp("scripts/lib/gold-cases.mjs");
const exp = await imp("scripts/lib/experiment-run.mjs");
const ji = await imp("scripts/lib/judge-inputs.mjs");
const ra = await imp("scripts/lib/rule-availability.mjs");
const sg = await imp("scripts/lib/rulesguru-suite.mjs");
const { hashPrompt } = await imp("scripts/lib/answer-quality-run.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { formatSupplementalRulesSection } = await imp("apps/backend/src/prompt/promptFormatting.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const { judgeAnswerAlone } = await imp("apps/backend/src/eval/answer-quality/judge.ts");
const { RUBRIC_REVISION } = await imp("apps/backend/src/eval/answer-quality/rubric.ts");
const { computeDeterministicAssertions } = await imp("apps/backend/src/eval/answer-quality/assertions.ts");

if (SET === "hard25") {
  sg.assertSuiteIgnored({ suiteDir: SUITE });
  sg.resolveInsideSuite(OUT_DIR, { suiteDir: SUITE });
}

const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
const judgeModel = evalMod.resolveJudgeModel(env);
if (judgeModel !== EXPECTED_JUDGE) throw new Error(`judge model is ${judgeModel}, expected ${EXPECTED_JUDGE}`);
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");

const readJsonl = (f) => (existsSync(f) ? readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);

// ---- cases + baseline turn-1 prompt hashes ----------------------------------------------------
const sets = [];
const baselineHash = new Map(); // caseId -> Set of earlier turn-1 prompt hashes
const baselineCost = new Map(); // caseId -> [actual medium turn-1 answer+judge cost] (suite only, for the actuals estimate)
if (SET === "hard25") {
  const CASE_IDS = JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final;
  const PASSES = [1, 2, 3, 4, 5].map((n) => `${SUITE}/runs/pft-pass${n}`);
  const caseFileSha = new Map();
  for (const dir of PASSES) {
    const m = JSON.parse(readFileSync(`${dir}/manifest.json`, "utf8"));
    for (const [id, h] of Object.entries(m.caseFileSha256 ?? {})) caseFileSha.set(id, h);
    for (const j of readJsonl(`${dir}/calls.jsonl`)) {
      if (j.type !== "record" || !CASE_IDS.includes(j.record.caseId) || !j.record.promptHash) continue;
      if (!baselineHash.has(j.record.caseId)) baselineHash.set(j.record.caseId, new Set());
      baselineHash.get(j.record.caseId).add(j.record.promptHash);
      if (!baselineCost.has(j.record.caseId)) baselineCost.set(j.record.caseId, []);
      baselineCost.get(j.record.caseId).push((j.record.costUsd ?? 0) + (j.record.judgeCostUsd ?? 0));
    }
  }
  const casesDir = join(SUITE, "cases");
  const allCases = await gold.loadGoldCases(casesDir, { external: true });
  const sources = await gold.loadSnapshotSources();
  const isStale = (c) => gold.compareSnapshot(c, sources).stale;
  const picked = CASE_IDS.map((id) => allCases.find((c) => c.id === id));
  if (picked.some((c) => !c)) throw new Error("a hard-25 case is missing from the suite folder");
  const cases = exp.validateManifestCases({ manifest: { formatVersion: 1, cases: picked.map((c) => exp.manifestEntryFor(c)) }, allCases, isStale, suite: true });
  const bad = cases.filter((c) => createHash("sha256").update(readFileSync(join(casesDir, `${c.id}.case.json`))).digest("hex") !== caseFileSha.get(c.id));
  if (bad.length) throw new Error(`case file differs from the pass manifest: ${bad.length} case(s)`);
  for (const c of cases) sets.push({ set: "hard25", caseEntry: c });
} else {
  const allCases = await gold.loadGoldCases();
  const sources = await gold.loadSnapshotSources();
  const isStale = (c) => gold.compareSnapshot(c, sources).stale;
  for (const [set, runId] of [["hard", "rr-hard"], ["ordinary", "rr-regression"]]) {
    const manifest = JSON.parse(readFileSync(`${BACKUPS}/${runId}/manifest.json`, "utf8"));
    const cases = exp.validateManifestCases({ manifest: { cases: manifest.caseList }, allCases, isStale });
    for (const c of cases) sets.push({ set, caseEntry: c });
  }
  for (const j of readJsonl(ARM_C_PROMPTS)) {
    if (!baselineHash.has(j.caseId)) baselineHash.set(j.caseId, new Set());
    baselineHash.get(j.caseId).add(hashPrompt(j.prompt1));
  }
}
console.log(`Set ${SET}. Cases: ${sets.length}; repeats ${REPEATS}; rubric ${RUBRIC_REVISION}; judge ${judgeModel}`);

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

function turn2Raw(raw1, answerText, text) {
  const conversationHistory = [
    { role: "user", content: raw1.question },
    { role: "assistant", content: answerText }
  ];
  if (raw1.mode === "lookup") {
    return { mode: "lookup", question: text, ...(raw1.cards ? { cards: raw1.cards } : {}), conversationHistory };
  }
  return { question: text, gameContext: raw1.gameContext, conversationHistory };
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
  return {
    ...p2,
    promptText,
    enrichmentDebug: { ...p2.enrichmentDebug, supplemental: { ...p2.enrichmentDebug.supplemental, selected: armSelected.map(({ ruleId, sectionTitle, score }) => ({ ruleId, sectionTitle, score })) } }
  };
}

async function buildTurn2(raw1, p1, answerText, caseEntry, text = CHECK) {
  const parsed2 = parse(turn2Raw(raw1, answerText, text), `${caseEntry.id} turn2`);
  const p2 = await prepare(parsed2, caseEntry.id, "turn2-production");
  assertHistorySection(p2.promptText, caseEntry.id);
  const prodR = retrievalOf(p2, caseEntry);
  if (topicIdsOf(p1) !== topicIdsOf(p2)) throw new Error(`${caseEntry.id}: turn-1 and turn-2 curated topics differ; carry-forward could duplicate`);
  const armP2 = swapExcerpts(p2, p1.enrichmentDebug.supplemental.selected, caseEntry.id);
  assertHistorySection(armP2.promptText, caseEntry.id);
  const r2 = retrievalOf(armP2, caseEntry);
  return { parsed2, p2, armP2, r2, prodSelectedRuleIds: prodR.selectedRuleIds };
}

async function buildTurn1(caseEntry) {
  const raw1 = fid.buildCaseRequest(caseEntry);
  const parsed1 = parse(raw1, caseEntry.id);
  const p1 = await prepare(parsed1, caseEntry.id, "turn1");
  const r1 = retrievalOf(p1, caseEntry);
  const promptHash = hashPrompt(p1.promptText);
  const base = baselineHash.get(caseEntry.id);
  const hashCheck = !base ? "missing" : base.size === 1 && base.has(promptHash) ? "match" : "mismatch";
  return { raw1, parsed1, p1, r1, promptHash, hashCheck };
}

// ---- dry checks + estimate ---------------------------------------------------------------
const ASSUMED_ANSWER_CHARS = 600 * 4;
const armC = new Map(); // caseId|repeat -> { answer1, prompt2 } (corpus fidelity rebuild)
if (SET === "corpus") {
  const recs = new Map(readJsonl(ARM_C_RECORDS).map((r) => [`${r.caseId}|${r.repeat}`, r]));
  for (const j of readJsonl(ARM_C_PROMPTS)) {
    const r = recs.get(`${j.caseId}|${j.repeat}`);
    if (r && !armC.has(j.caseId)) armC.set(j.caseId, { answer1: r.answer1, prompt2: j.prompt2 });
  }
}
let estTotal = 0;
let estActual = 0;
const hashStatus = { match: 0, missing: 0, mismatch: 0 };
let rebuilt = 0;
const t1Cache = new Map();
for (const { caseEntry } of sets) {
  const t1 = await buildTurn1(caseEntry);
  t1Cache.set(caseEntry.id, t1);
  hashStatus[t1.hashCheck]++;
  const t = await buildTurn2(t1.raw1, t1.p1, "x".repeat(ASSUMED_ANSWER_CHARS), caseEntry);
  if (swapExcerpts(t.p2, t.p2.enrichmentDebug.supplemental.selected, caseEntry.id).promptText !== t.p2.promptText) throw new Error(`${caseEntry.id}: identity swap changed the prompt`);
  const prodSec = formatSupplementalRulesSection(asRules(t.p2.enrichmentDebug.supplemental.selected));
  const i = t.p2.promptText.indexOf(prodSec);
  const armSec = formatSupplementalRulesSection(asRules(t.armP2.enrichmentDebug.supplemental.selected));
  if (t.armP2.promptText.slice(0, i) !== t.p2.promptText.slice(0, i) || t.armP2.promptText.slice(i + armSec.length) !== t.p2.promptText.slice(i + prodSec.length)) throw new Error(`${caseEntry.id}: arm prompt differs outside the excerpt section`);
  if (t.armP2.promptText.split(CHECK).length !== 2) throw new Error(`${caseEntry.id}: check text not found exactly once in the turn-2 prompt`);
  if (SET === "corpus") {
    const c = armC.get(caseEntry.id);
    if (!c) throw new Error(`${caseEntry.id}: no arm C prompt to rebuild`);
    const tc = await buildTurn2(t1.raw1, t1.p1, c.answer1, caseEntry, PUSHBACK);
    if (tc.armP2.promptText !== c.prompt2) throw new Error(`${caseEntry.id}: arm C turn-2 prompt not reproduced byte for byte`);
    rebuilt++;
  }
  const conservative =
    evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: t1.p1.promptText.length }) +
    evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: t.armP2.promptText.length }) +
    2 * evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel });
  estTotal += REPEATS * conservative;
  if (SET === "hard25") {
    const b = baselineCost.get(caseEntry.id) ?? [];
    const one = b.length ? b.reduce((x, y) => x + y, 0) / b.length : conservative / 2;
    estActual += REPEATS * one * 2.3; // turn 2 carries turn 1's answer, so a bit more than double
  }
}
if (SET === "corpus") estActual = (readJsonl(ARM_C_RECORDS).reduce((a, r) => a + r.totalCostUsd, 0) / 186) * sets.length * REPEATS;
const spentAll = ALL_RECORDS.reduce((s, f) => s + readJsonl(f).reduce((a, r) => a + (r.totalCostUsd ?? 0), 0), 0);
console.log(`Seam checks passed for all ${sets.length} cases (identity swap; arm prompt differs only in the excerpt section; check text once).${SET === "corpus" ? ` Arm C turn-2 prompt rebuilt byte for byte: ${rebuilt}/${sets.length}.` : ""}`);
console.log(`Turn-1 prompt hash vs earlier runs: match ${hashStatus.match}, missing ${hashStatus.missing}, MISMATCH ${hashStatus.mismatch}`);
console.log(`Plan: ${sets.length} x ${REPEATS} = ${sets.length * REPEATS} conversations. Estimate: conservative $${estTotal.toFixed(2)}, from earlier actuals $${estActual.toFixed(2)}. Already spent (both sets): $${spentAll.toFixed(4)}; hard stop $${MAX_USD}`);
if (hashStatus.mismatch || hashStatus.missing) throw new Error("turn-1 prompt hash check failed");
if (!live) process.exit(0);

// ---- live --------------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(SCRATCH, { recursive: true });
if (SET === "corpus") copyFileSync(fileURLToPath(import.meta.url), `${OUT_DIR}/selfcheck-probe.mjs`);
const require = createRequire(`${REPO}/apps/backend/package.json`);
const { default: OpenAI } = await import(pathToFileURL(require.resolve("openai")).href);
const client = new OpenAI(evalMod.openAiClientOptions(env));
const { missing } = await evalMod.checkModelAccess({ client, modelIds: [MODEL, judgeModel] });
if (missing.length) throw new Error(`no access to ${missing.join(", ")}`);

const done = new Set(readJsonl(RECORDS).map((r) => `${r.caseId}|${r.repeat}`));
let spent = spentAll;
console.log(`Resuming: ${done.size} conversation(s) on disk for this set; $${spent.toFixed(4)} spent across sets.`);

const queue = [];
for (let repeat = 1; repeat <= REPEATS; repeat++) for (const { set, caseEntry } of sets) if (!done.has(`${caseEntry.id}|${repeat}`)) queue.push({ set, caseEntry, repeat });
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
  if (usage.reportedEffort !== EXPECTED_EFFORT) throw new Error(`HONESTY: provider reported effort ${usage.reportedEffort}, expected ${EXPECTED_EFFORT}`);
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
  const { raw1, parsed1, p1, r1, promptHash, hashCheck } = t1Cache.get(caseEntry.id);
  const est = evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: p1.promptText.length }) * 2 + 2 * evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel });
  if (spent + reserved + est > MAX_USD) { stoppedForCap = true; return; }
  reserved += est;
  try {
    const a1 = await answerOnce(p1.promptText);
    const g1 = await grade(caseEntry, p1, a1.answerText, parsed1);
    const t = await buildTurn2(raw1, p1, a1.answerText, caseEntry);
    const a2 = await answerOnce(t.armP2.promptText);
    const g2 = await grade(caseEntry, t.armP2, a2.answerText, t.parsed2);
    const totalCostUsd = a1.costUsd + a2.costUsd + g1.judgeCostUsd + g2.judgeCostUsd;
    const record = {
      arm: "pushback-c", caseId: caseEntry.id, set, repeat, tier: caseEntry.tier, requestMode: parsed1.mode,
      embeddingProvider: embedder.mode,
      reportedModel: a2.reportedModel === a1.reportedModel ? a1.reportedModel : `${a1.reportedModel}/${a2.reportedModel}`,
      judgeModel, rubricRevision: RUBRIC_REVISION, turn1PromptHash: promptHash, turn1PromptHashCheck: hashCheck,
      turn1: turnRecord(g1, a1, r1, p1),
      turn2: { ...turnRecord(g2, a2, t.r2, t.armP2), productionSelectedRuleIds: t.prodSelectedRuleIds },
      combinedLatencyMs: a1.latencyMs + a2.latencyMs,
      totalCostUsd,
      question: caseEntry.question, referenceAnswer: caseEntry.expected.answer, decidingRuleIds: caseEntry.expected.decidingRuleIds,
      answer1: a1.answerText, answer2: a2.answerText, at: new Date().toISOString()
    };
    appendFileSync(RECORDS, `${JSON.stringify(record)}\n`);
    appendFileSync(PROMPTS, `${JSON.stringify({ caseId: caseEntry.id, repeat, prompt1: p1.promptText, prompt2: t.armP2.promptText })}\n`);
    spent += totalCostUsd;
    const c = (g) => (g.undetermined ? "?" : g.scores.correctness);
    console.log(`${set.padEnd(8)} ${caseEntry.id} r${repeat}: ${c(g1)} -> ${c(g2)}  (t1 ${a1.latencyMs}ms, t2 ${a2.latencyMs}ms) $${spent.toFixed(3)}`);
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
console.log(`${stoppedForCap ? "Stopped at the cost cap. " : ""}Done. Spent across sets $${spent.toFixed(4)}. Records: ${RECORDS}`);
