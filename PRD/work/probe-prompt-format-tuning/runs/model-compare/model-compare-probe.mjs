// Throwaway probe: which model answers the 10 hardest practice questions, and holds or fixes under pushback?
// Same two-turn shape as runs/pushback-hard25 (turn 1 = production prompt; turn 2 = production follow-up with the
// pushback line and turn 1's rule excerpts carried forward, arm C) — only the answering model changes.
// Every answer is graded twice, by gpt-6.1-sol (today's judge) and by gpt-6-luna (candidate cheap judge), so the
// run also measures whether the cheap judge agrees, and whether Sol-judging-Sol skews the result.
// No effort parameter is sent to any model (production sends none); the reported effort is recorded.
// Cases: output/rulesguru/reports/pft-hard10.json (from pick-hard10.mjs). Outputs stay under output/rulesguru/.
// Usage (from .worktrees/probe-pft): npx tsx <this file> --model luna|sol|terra [--live] [--repeats 5] [--concurrency 3] [--limit N]
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/rulesguru`;

const MODELS = { luna: "gpt-6-luna", sol: "gpt-6-sol", terra: "gpt-5.6-terra" };
// gpt-5.6-terra has no rate in the eval's table. Third-party listings (2026-07/10) give $2.00/$12.00 and
// $2.50/$15.00 per million; the higher one is used so the cost cap errs safe. Not checked against OpenAI's page.
const LOCAL_RATES = { "gpt-5.6-terra": { input: 2.5, output: 15.0 } };
const JUDGES = ["gpt-6.1-sol", "gpt-6-luna"];
const PRIMARY_JUDGE = "gpt-6.1-sol";
const CAP = 10;
const MAX_USD = 15;
const PUSHBACK = "I don't think that's right. Can you check it again?"; // same text as runs/pushback*
// Estimate assumptions: output tokens per answer (Luna observed ~1–2k incl. reasoning; bigger models assumed 3x).
const EST_OUTPUT_TOKENS = { "gpt-6-luna": 2000, "gpt-6-sol": 6000, "gpt-5.6-terra": 6000 };
const EST_JUDGE = { input: 3000, output: 1500 };

const args = process.argv.slice(2);
const flag = (name, dflt) => (args.includes(name) ? args[args.indexOf(name) + 1] : dflt);
const MODEL = MODELS[flag("--model")];
if (!MODEL) throw new Error("--model luna|sol|terra required");
const live = args.includes("--live");
const concurrency = Math.min(3, Number(flag("--concurrency", 3)));
const REPEATS = Number(flag("--repeats", 5));
const limit = Number(flag("--limit", Infinity));
const OUT_DIR = `${SUITE}/runs/probe-models-hard10/${MODEL}`;
const RECORDS = `${OUT_DIR}/records.jsonl`;

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const gold = await imp("scripts/lib/gold-cases.mjs");
const exp = await imp("scripts/lib/experiment-run.mjs");
const ji = await imp("scripts/lib/judge-inputs.mjs");
const sg = await imp("scripts/lib/rulesguru-suite.mjs");
const { hashPrompt } = await imp("scripts/lib/answer-quality-run.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { formatSupplementalRulesSection } = await imp("apps/backend/src/prompt/promptFormatting.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const { judgeAnswerAlone } = await imp("apps/backend/src/eval/answer-quality/judge.ts");
const { RUBRIC_REVISION } = await imp("apps/backend/src/eval/answer-quality/rubric.ts");

sg.assertSuiteIgnored({ suiteDir: SUITE });
sg.resolveInsideSuite(OUT_DIR, { suiteDir: SUITE });
const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");

const rate = (model) => evalMod.MODEL_PRICING_USD_PER_MILLION_TOKENS[model] ?? LOCAL_RATES[model];
for (const m of [MODEL, ...JUDGES]) if (!rate(m)) throw new Error(`no rate for ${m}`);
const costOf = (model, input, output) => ((input ?? 0) * rate(model).input + (output ?? 0) * rate(model).output) / 1_000_000;
const readJsonl = (f) => (existsSync(f) ? readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);

// ---- cases, loaded as the suite run loads them; turn-1 prompt must match the five passes --------------
const CASE_IDS = JSON.parse(readFileSync(`${SUITE}/reports/pft-hard10.json`, "utf8")).ids;
const baselineHash = new Map();
const caseFileSha = new Map();
for (let n = 1; n <= 5; n++) {
  const dir = `${SUITE}/runs/pft-pass${n}`;
  const m = JSON.parse(readFileSync(`${dir}/manifest.json`, "utf8"));
  for (const [id, h] of Object.entries(m.caseFileSha256 ?? {})) caseFileSha.set(id, h);
  for (const j of readJsonl(`${dir}/calls.jsonl`)) {
    if (j.type !== "record" || !CASE_IDS.includes(j.record.caseId) || !j.record.promptHash) continue;
    if (!baselineHash.has(j.record.caseId)) baselineHash.set(j.record.caseId, new Set());
    baselineHash.get(j.record.caseId).add(j.record.promptHash);
  }
}
const casesDir = join(SUITE, "cases");
const allCases = await gold.loadGoldCases(casesDir, { external: true });
const sources = await gold.loadSnapshotSources();
const isStale = (c) => gold.compareSnapshot(c, sources).stale;
const picked = CASE_IDS.map((id) => allCases.find((c) => c.id === id));
if (picked.some((c) => !c)) throw new Error("a hard-10 case is missing from the suite folder");
const cases = exp.validateManifestCases({ manifest: { formatVersion: 1, cases: picked.map((c) => exp.manifestEntryFor(c)) }, allCases, isStale, suite: true });
const bad = cases.filter((c) => createHash("sha256").update(readFileSync(join(casesDir, `${c.id}.case.json`))).digest("hex") !== caseFileSha.get(c.id));
if (bad.length) throw new Error(`case file differs from the pass manifest: ${bad.length} case(s)`);

const resources = await fid.loadPromptResources({ env });
const ruleById = new Map(resources.gameRulesRuleIndex.map((e) => [e.ruleId, e]));
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);

function parse(raw, label) {
  const r = askAiRequestSchema.safeParse(raw);
  if (!r.success) throw new Error(`${label}: askAiRequestSchema rejects the request: ${r.error.message}`);
  return r.data;
}
async function prepare(request, caseId) {
  const vector = await embedder.embed(buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex }));
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId });
  const p = preparePromptInput(request, { ...resources, supplementalRuleCap: CAP, queryEmbedding: vector, collectEnrichmentDebug: true });
  if (!p.enrichmentDebug.supplemental.usedSemantic) throw new Error(`${caseId}: semantic retrieval did not run`);
  return p;
}
const asRules = (selected) => selected.map(({ ruleId, score }) => ({ ruleId, sectionTitle: ruleById.get(ruleId).sectionTitle, text: ruleById.get(ruleId).text, score }));

// Turn 2 = production follow-up (conversationHistory), its excerpt section swapped for turn 1's (arm C).
async function buildTurn2(raw1, p1, answerText, caseEntry) {
  const conversationHistory = [{ role: "user", content: raw1.question }, { role: "assistant", content: answerText }];
  const raw2 = raw1.mode === "lookup"
    ? { mode: "lookup", question: PUSHBACK, ...(raw1.cards ? { cards: raw1.cards } : {}), conversationHistory }
    : { question: PUSHBACK, gameContext: raw1.gameContext, conversationHistory };
  const parsed2 = parse(raw2, `${caseEntry.id} turn2`);
  const p2 = await prepare(parsed2, caseEntry.id);
  if (!p2.promptText.includes("CONVERSATION HISTORY")) throw new Error(`${caseEntry.id}: no CONVERSATION HISTORY in turn 2`);
  if (JSON.stringify(p1.enrichmentDebug.curatedGameRules.topicIds) !== JSON.stringify(p2.enrichmentDebug.curatedGameRules.topicIds)) throw new Error(`${caseEntry.id}: curated topics differ between turns`);
  const prodSection = formatSupplementalRulesSection(asRules(p2.enrichmentDebug.supplemental.selected));
  const at = p2.promptText.indexOf(prodSection);
  if (!prodSection || at < 0 || p2.promptText.indexOf(prodSection, at + 1) >= 0) throw new Error(`${caseEntry.id}: excerpt section not found exactly once`);
  const armSection = formatSupplementalRulesSection(asRules(p1.enrichmentDebug.supplemental.selected));
  const promptText = p2.promptText.slice(0, at) + armSection + p2.promptText.slice(at + prodSection.length);
  if (promptText.split(PUSHBACK).length !== 2) throw new Error(`${caseEntry.id}: pushback text not found exactly once`);
  const armP2 = { ...p2, promptText, enrichmentDebug: { ...p2.enrichmentDebug, supplemental: { ...p2.enrichmentDebug.supplemental, selected: p1.enrichmentDebug.supplemental.selected } } };
  return { parsed2, armP2 };
}

const t1Cache = new Map();
const hashStatus = { match: 0, mismatch: 0, missing: 0 };
let estTotal = 0;
const answerEst = (chars) => costOf(MODEL, chars / 4, EST_OUTPUT_TOKENS[MODEL]);
const judgeEst = () => JUDGES.reduce((s, j) => s + costOf(j, EST_JUDGE.input, EST_JUDGE.output), 0);
for (const c of cases) {
  const raw1 = fid.buildCaseRequest(c);
  const parsed1 = parse(raw1, c.id);
  const p1 = await prepare(parsed1, c.id);
  const promptHash = hashPrompt(p1.promptText);
  const base = baselineHash.get(c.id);
  const check = !base ? "missing" : base.size === 1 && base.has(promptHash) ? "match" : "mismatch";
  hashStatus[check]++;
  const dry = await buildTurn2(raw1, p1, "x".repeat(2400), c);
  t1Cache.set(c.id, { raw1, parsed1, p1, promptHash, check });
  estTotal += REPEATS * (answerEst(p1.promptText.length) + answerEst(dry.armP2.promptText.length) + 2 * judgeEst());
}
const spent0 = readJsonl(RECORDS).reduce((s, r) => s + (r.totalCostUsd ?? 0), 0);
console.log(`Model ${MODEL}${LOCAL_RATES[MODEL] ? " (rate: local conservative override)" : ""}; judges ${JUDGES.join(" + ")} (primary ${PRIMARY_JUDGE}); rubric ${RUBRIC_REVISION}; effort: none sent`);
console.log(`Cases ${cases.length} x ${REPEATS} = ${cases.length * REPEATS} conversations (2 answers + 4 gradings each). Embedder ${embedder.mode}; semantic every turn.`);
console.log(`Turn-1 prompt hash vs the five passes: match ${hashStatus.match}, missing ${hashStatus.missing}, MISMATCH ${hashStatus.mismatch}`);
console.log(`Estimate: $${estTotal.toFixed(2)} (assumes ${EST_OUTPUT_TOKENS[MODEL]} output tokens per answer). Already spent $${spent0.toFixed(4)}; hard stop $${MAX_USD}`);
if (hashStatus.mismatch || hashStatus.missing) throw new Error("turn-1 prompt hash check failed");
if (!live) process.exit(0);
if (estTotal > MAX_USD) console.log(`WARNING: estimate over $${MAX_USD}; the run stops itself at the cap and resumes from disk.`);

// ---- live ------------------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
const require = createRequire(`${REPO}/apps/backend/package.json`);
const { default: OpenAI } = await import(pathToFileURL(require.resolve("openai")).href);
const client = new OpenAI(evalMod.openAiClientOptions(env));
const { missing } = await evalMod.checkModelAccess({ client, modelIds: [MODEL, ...JUDGES] });
if (missing.length) throw new Error(`no access to ${missing.join(", ")}`);

const done = new Set(readJsonl(RECORDS).map((r) => `${r.caseId}|${r.repeat}`));
let spent = spent0;
const queue = [];
for (let repeat = 1; repeat <= REPEATS; repeat++) for (const c of cases) if (!done.has(`${c.id}|${repeat}`)) queue.push({ caseEntry: c, repeat });
if (queue.length > limit) queue.length = limit;
console.log(`Queue ${queue.length}; spent so far $${spent.toFixed(4)}`);

let reserved = 0;
let aborted = null;
let stoppedForCap = false;
let seenEffort = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function answerOnce(promptText) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const startedAt = Date.now();
    try {
      const response = await client.responses.create({ model: MODEL, input: promptText }, { maxRetries: 0 });
      const latencyMs = Date.now() - startedAt;
      if (response.model !== MODEL && !response.model?.startsWith(`${MODEL}-`)) throw new Error(`HONESTY: provider reported model ${response.model}, expected ${MODEL}`);
      const answerText = response.output_text?.trim() ?? "";
      if (!answerText) throw Object.assign(new Error("empty answer"), { provider: true });
      const usage = exp.readUsage(response);
      if (MODEL === "gpt-6-luna" && usage.reportedEffort !== "medium") throw new Error(`HONESTY: Luna reported effort ${usage.reportedEffort}`);
      seenEffort ??= usage.reportedEffort;
      if (usage.reportedEffort !== seenEffort) throw new Error(`HONESTY: reported effort changed ${seenEffort} -> ${usage.reportedEffort}`);
      return { answerText, latencyMs, attempts: attempt, reportedModel: response.model, reportedEffort: usage.reportedEffort, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, reasoningTokens: usage.reasoningTokens, costUsd: costOf(MODEL, usage.inputTokens, usage.outputTokens) };
    } catch (error) {
      if (String(error?.message).startsWith("HONESTY")) throw error;
      lastError = error;
      const s = error?.status;
      const retryable = error?.provider || s === 429 || (typeof s === "number" && s >= 500) || /connection|ECONNRESET|fetch failed|timed out/i.test(String(error?.message));
      if (!retryable) break;
      await sleep(3000 * attempt);
    }
  }
  throw Object.assign(new Error(`answer call failed: ${lastError?.message}`), { provider: true });
}

async function grade(caseEntry, prepared, answerText) {
  const judgeInputs = ji.buildJudgeInputs({ caseEntry, promptText: prepared.promptText, attachedRuleIds: ji.attachedRuleIdsOf(prepared), ruleIndex: resources.gameRulesRuleIndex });
  const out = {};
  for (const judgeModel of JUDGES) {
    const res = await judgeAnswerAlone({ client, judgeModel, question: caseEntry.question, ...judgeInputs, answerText, workedSolution: caseEntry.expected.answer });
    out[judgeModel] = {
      undetermined: res.undetermined,
      scores: res.undetermined ? null : res.scores,
      rationale: res.undetermined ? res.reason : res.rationale,
      costUsd: costOf(judgeModel, res.usage.inputTokens, res.usage.outputTokens)
    };
  }
  return out;
}

const turnRecord = (a, g, p) => ({
  latencyMs: a.latencyMs, attempts: a.attempts, reportedEffort: a.reportedEffort,
  inputTokens: a.inputTokens, outputTokens: a.outputTokens, reasoningTokens: a.reasoningTokens, costUsd: a.costUsd,
  promptChars: p.promptText.length, selectedRuleIds: p.enrichmentDebug.supplemental.selected.map((r) => r.ruleId),
  grades: g
});

async function runConversation({ caseEntry, repeat }) {
  const { raw1, parsed1, p1, promptHash, check } = t1Cache.get(caseEntry.id);
  const est = answerEst(p1.promptText.length) * 2.2 + 2 * judgeEst();
  if (spent + reserved + est > MAX_USD) { stoppedForCap = true; return; }
  reserved += est;
  try {
    const a1 = await answerOnce(p1.promptText);
    const g1 = await grade(caseEntry, p1, a1.answerText);
    const t = await buildTurn2(raw1, p1, a1.answerText, caseEntry);
    const a2 = await answerOnce(t.armP2.promptText);
    const g2 = await grade(caseEntry, t.armP2, a2.answerText);
    const judgeCost = [g1, g2].reduce((s, g) => s + Object.values(g).reduce((x, j) => x + j.costUsd, 0), 0);
    const totalCostUsd = a1.costUsd + a2.costUsd + judgeCost;
    const record = {
      probe: "models-hard10", arm: "pushback-c", model: MODEL, caseId: caseEntry.id, repeat, requestMode: parsed1.mode,
      embeddingProvider: embedder.mode, reportedModel: a1.reportedModel, rateSource: LOCAL_RATES[MODEL] ? "local-override" : "eval-table",
      judges: JUDGES, primaryJudge: PRIMARY_JUDGE, rubricRevision: RUBRIC_REVISION,
      turn1PromptHash: promptHash, turn1PromptHashCheck: check,
      turn1: turnRecord(a1, g1, p1), turn2: turnRecord(a2, g2, t.armP2),
      totalCostUsd, answer1: a1.answerText, answer2: a2.answerText, at: new Date().toISOString()
    };
    appendFileSync(RECORDS, `${JSON.stringify(record)}\n`);
    spent += totalCostUsd;
    const c = (g) => JUDGES.map((j) => (g[j].undetermined ? "?" : g[j].scores.correctness)).join("/");
    console.log(`r${repeat} case ${CASE_IDS.indexOf(caseEntry.id) + 1}: ${c(g1)} -> ${c(g2)} (sol/luna judge; t1 ${a1.latencyMs}ms, t2 ${a2.latencyMs}ms) $${spent.toFixed(3)}`);
  } catch (error) {
    if (error.provider) console.log(`r${repeat} case ${CASE_IDS.indexOf(caseEntry.id) + 1}: provider error, not recorded -- ${error.message}`);
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
console.log(`${stoppedForCap ? "Stopped at the cost cap (resume to continue). " : ""}Done. Spent $${spent.toFixed(4)}. Records: ${RECORDS}`);
