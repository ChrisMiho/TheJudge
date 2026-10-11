// Throwaway probe: describe-then-answer (breakdown) on the hard-25 suite set, today's default effort (none sent).
// Case loading, prompt preparation and the judge mirror effort-suite-probe.mjs (suite run, arm A, cap 10, local embedder);
// the turn-1 instruction, turn-2 follow-up and breakdown rubric are copied verbatim from run-breakdown.mts.
// Usage: tsx <this file> [--live] [--repeats 4] [--concurrency 2] [--limit N]
// All outputs stay under output/rulesguru/ (gitignored, local only). No suite content lives in this file.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/rulesguru`;
const VERIFY = JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8"));
const CASE_IDS = VERIFY.final;
const PASSES = [1, 2, 3, 4, 5].map((n) => `${SUITE}/runs/pft-pass${n}`);
const OUT_DIR = `${SUITE}/runs/probe-breakdown-hard25`;
const RECORDS = `${OUT_DIR}/records.jsonl`;

const MODEL = "gpt-6-luna";
const EXPECTED_JUDGE = "gpt-6.1-sol";
const CAP = 10;
const MAX_USD = 5;

const BREAKDOWN_INSTRUCTION = [
  "Before ruling, describe the tasks this question requires: list each card, effect and rule interaction involved,",
  "and the order you will work through them to reach the ruling. Do not give the ruling yet."
].join(" ");
const RULING_FOLLOW_UP = "Now give your ruling.";
const BREAKDOWN_RUBRIC_REVISION = "breakdown-probe.1";
const BREAKDOWN_RUBRIC = [
  "You are checking a task list, not a ruling. A Magic: The Gathering rules assistant was asked the question below.",
  "Before answering, it listed the tasks the question requires: the cards, effects and rule interactions involved, and the order it will work through them. It was told not to give the ruling yet.",
  "Grade the task list against the approved reference answer, which is authoritative. Your task is agreement with the reference, not independent adjudication.",
  "",
  "Verdicts:",
  "- complete: the list names every card effect and rule interaction the reference ruling depends on, and says nothing false that would change the ruling. Extra harmless steps, wording, length and uncited rule numbers do not matter.",
  "- missing: the list omits at least one interaction the reference ruling depends on (say which), and says nothing false that would change the ruling.",
  "- wrong: the list makes a false rules claim, or puts steps in an order, that would lead to a different ruling than the reference (say what). If it is both missing and wrong, choose wrong.",
  "Judge only what the list commits to. If it hints at or states a conclusion anyway, judge that conclusion against the reference too.",
  "Also report leaksRuling: true when the list states or clearly implies the final ruling, false otherwise."
].join("\n");

function buildBreakdownJudgePrompt({ question, cards, stateLines, decidingRuleIds, referenceAnswer, breakdownText }) {
  return [
    BREAKDOWN_RUBRIC,
    "",
    `Question: ${question}`,
    cards.length > 0 ? `Cards named: ${cards.join("; ")}` : "Cards named: none",
    ...(stateLines.length > 0 ? ["Game state lines shown to the assistant:", ...stateLines.map((l) => `  ${l}`)] : []),
    `Rules the reference ruling turns on: ${decidingRuleIds.join(", ")}`,
    `Reference answer (approved, authoritative): ${referenceAnswer}`,
    "",
    "Task list under review:",
    breakdownText,
    "",
    "Respond with ONLY a JSON object, no prose outside it, no code fence, in the exact shape:",
    '{"verdict": "complete"|"missing"|"wrong", "reason": "one or two sentences naming what is missing or wrong (or why it is complete)", "leaksRuling": true|false}'
  ].join("\n");
}

function parseJson(text) {
  const trimmed = String(text ?? "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  try {
    return JSON.parse(fenced ? fenced[1] : trimmed);
  } catch {
    return null;
  }
}

const args = process.argv.slice(2);
const flag = (name, dflt) => (args.includes(name) ? args[args.indexOf(name) + 1] : dflt);
const live = args.includes("--live");
const REPEATS = Number(flag("--repeats", 4));
const concurrency = Math.min(3, Number(flag("--concurrency", 2)));
const limit = Number(flag("--limit", Infinity));

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const gold = await imp("scripts/lib/gold-cases.mjs");
const exp = await imp("scripts/lib/experiment-run.mjs");
const ji = await imp("scripts/lib/judge-inputs.mjs");
const ra = await imp("scripts/lib/rule-availability.mjs");
const sg = await imp("scripts/lib/rulesguru-suite.mjs");
const { hashPrompt } = await imp("scripts/lib/answer-quality-run.mjs");
const { preparePromptInput } = await imp("apps/backend/src/prompt/preparation.ts");
const { judgeAnswerAlone } = await imp("apps/backend/src/eval/answer-quality/judge.ts");
const { RUBRIC_REVISION } = await imp("apps/backend/src/eval/answer-quality/rubric.ts");

sg.assertSuiteIgnored({ suiteDir: SUITE });
sg.resolveInsideSuite(OUT_DIR, { suiteDir: SUITE });

const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
const judgeModel = evalMod.resolveJudgeModel(env);
if (judgeModel !== EXPECTED_JUDGE) throw new Error(`judge model is ${judgeModel}, expected ${EXPECTED_JUDGE}`);
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");

function readBaseline() {
  const hash = new Map();
  const caseFileSha = new Map();
  for (const dir of PASSES) {
    if (!existsSync(`${dir}/calls.jsonl`)) continue;
    const m = JSON.parse(readFileSync(`${dir}/manifest.json`, "utf8"));
    for (const [id, h] of Object.entries(m.caseFileSha256 ?? {})) caseFileSha.set(id, h);
    for (const line of readFileSync(`${dir}/calls.jsonl`, "utf8").split("\n").filter(Boolean)) {
      let j;
      try { j = JSON.parse(line); } catch { continue; }
      if (j.type !== "record" || !CASE_IDS.includes(j.record.caseId) || !j.record.promptHash) continue;
      if (!hash.has(j.record.caseId)) hash.set(j.record.caseId, new Set());
      hash.get(j.record.caseId).add(j.record.promptHash);
    }
  }
  return { hash, caseFileSha };
}

const casesDir = join(SUITE, "cases");
const allCases = await gold.loadGoldCases(casesDir, { external: true });
const sources = await gold.loadSnapshotSources();
const isStale = (c) => gold.compareSnapshot(c, sources).stale;
const picked = CASE_IDS.map((id) => allCases.find((c) => c.id === id));
if (picked.some((c) => !c)) throw new Error("a hard-25 case is missing from the suite folder");
const manifest = { formatVersion: 1, cases: picked.map((c) => exp.manifestEntryFor(c)) };
const cases = exp.validateManifestCases({ manifest, allCases, isStale, suite: true });
{
  const { caseFileSha } = readBaseline();
  const bad = cases.filter((c) => createHash("sha256").update(readFileSync(join(casesDir, `${c.id}.case.json`))).digest("hex") !== caseFileSha.get(c.id));
  if (bad.length) throw new Error(`case file differs from the pass manifest: ${bad.map((c) => c.id).join(", ")}`);
}

const resources = await fid.loadPromptResources({ env });
if (!resources.comboCatalog) throw new Error("combo catalog not loaded -- production loads it");
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);
const vectors = await fid.embedGoldCaseQueries({ goldCases: cases, embedder, cardDetailIndex: resources.cardDetailIndex });

const RULE_ID = /^\d{3}(\.\d+[a-z]*)?$/;
const verifierRules = (id) => (VERIFY.verdicts[id]?.["deciding rules"] ?? []).filter((r) => RULE_ID.test(r));

function prepare(caseEntry) {
  const request = fid.buildCaseRequest(caseEntry);
  const prepared = preparePromptInput(request, { ...resources, supplementalRuleCap: CAP, queryEmbedding: vectors.get(caseEntry.id) ?? null, collectEnrichmentDebug: true });
  const retrieval = fid.describeRetrieval(prepared.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, { requireSemantic: true, caseId: caseEntry.id });
  const promptHash = hashPrompt(prepared.promptText);
  const attachedRuleIds = ji.attachedRuleIdsOf(prepared, []);
  const judgeInputs = ji.buildJudgeInputs({ caseEntry, promptText: prepared.promptText, attachedRuleIds, ruleIndex: resources.gameRulesRuleIndex });
  const allRules = [...new Set([...caseEntry.expected.decidingRuleIds, ...verifierRules(caseEntry.id)])];
  const availability = ra.describeDecidingRules({ decidingRuleIds: allRules, prepared, request, cardRulingsIndex: resources.cardRulingsIndex, extraRuleIds: [] });
  return { request, prepared, promptText: prepared.promptText, retrieval, promptHash, judgeInputs, allRules, availability, turn1Text: `${prepared.promptText}\n\n${BREAKDOWN_INSTRUCTION}` };
}

function hashCheck(caseId, promptHash) {
  const set = readBaseline().hash.get(caseId);
  if (!set) return "pending";
  if (set.size !== 1 || !set.has(promptHash)) return "mismatch";
  return "match";
}

// Estimate: two answer turns (turn 2 resends turn 1 + breakdown) plus two judge calls.
const answerEst = (chars) => evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: chars });
const judgeEst = () => evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel });
const estimateFor = (turn1Text) => answerEst(turn1Text.length) + answerEst(turn1Text.length + 3000) + 2 * judgeEst();

const prepCache = new Map();
let estTotal = 0;
const status = { match: [], pending: [], mismatch: [] };
for (const c of cases) {
  const p = prepare(c);
  prepCache.set(c.id, p);
  status[hashCheck(c.id, p.promptHash)].push(c.id);
  estTotal += estimateFor(p.turn1Text) * REPEATS;
}
const spentOf = (file) => (existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).reduce((s, l) => s + (JSON.parse(l).costUsd?.total ?? 0), 0) : 0);
console.log(`Cases ${cases.length} x ${REPEATS} repeats; rubric ${RUBRIC_REVISION}; breakdown rubric ${BREAKDOWN_RUBRIC_REVISION}; judge ${judgeModel}; model ${MODEL}; effort: none sent (default)`);
console.log(`Embedder ${embedder.mode}; semantic retrieval on every case: yes; combo catalog loaded: yes`);
console.log(`Prompt hash vs pass records: match ${status.match.length}, not yet in passes ${status.pending.length}, MISMATCH ${status.mismatch.length} ${status.mismatch.join(", ")}`);
console.log(`Estimate: $${estTotal.toFixed(2)} ($${(estTotal / (cases.length * REPEATS)).toFixed(4)} / conversation); already spent $${spentOf(RECORDS).toFixed(4)}; hard stop $${MAX_USD}`);
if (!live) process.exit(0);
if (status.mismatch.length) throw new Error("prompt hash mismatch -- abort");
if (estTotal > MAX_USD) throw new Error(`estimate over $${MAX_USD}`);

mkdirSync(OUT_DIR, { recursive: true });
const require = createRequire(`${REPO}/scripts/eval-answer-quality.mjs`);
const { default: OpenAI } = await import(pathToFileURL(require.resolve("openai")).href);
const client = new OpenAI(evalMod.openAiClientOptions(env));
const { missing } = await evalMod.checkModelAccess({ client, modelIds: [MODEL, judgeModel] });
if (missing.length) throw new Error(`no access to ${missing.join(", ")}`);

const done = new Set();
if (existsSync(RECORDS)) for (const l of readFileSync(RECORDS, "utf8").split("\n").filter(Boolean)) { const r = JSON.parse(l); done.add(`${r.caseId}|${r.repeat}`); }
let spent = spentOf(RECORDS);
const queue = [];
for (let repeat = 1; repeat <= REPEATS; repeat++) for (const c of cases) if (!done.has(`${c.id}|${repeat}`)) queue.push({ caseEntry: c, repeat });
if (queue.length > limit) queue.length = limit;
console.log(`Queue ${queue.length}; spent so far $${spent.toFixed(4)}`);

let reserved = 0;
let aborted = null;
let stoppedForCap = false;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callModel(model, input) {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const startedAt = Date.now();
    try {
      const response = await client.responses.create({ model, input }, { maxRetries: 0 });
      return { response, latencyMs: Date.now() - startedAt, attempts: attempt };
    } catch (error) {
      lastError = error;
      const s = error?.status;
      const retryable = s === 429 || (typeof s === "number" && s >= 500) || /connection|ECONNRESET|fetch failed|timed out/i.test(String(error?.message));
      if (!retryable) break;
      await sleep(3000 * attempt);
    }
  }
  throw Object.assign(new Error(`call failed: ${lastError?.message}`), { provider: true });
}

async function runOne({ caseEntry, repeat }) {
  const p = prepCache.get(caseEntry.id);
  const check = hashCheck(caseEntry.id, p.promptHash);
  if (check === "mismatch") { aborted = new Error(`HONESTY: prompt hash mismatch on ${caseEntry.id}`); return; }
  const est = estimateFor(p.turn1Text);
  if (spent + reserved + est * 2 > MAX_USD) { stoppedForCap = true; return; }
  reserved += est;
  let cost = { turn1: 0, turn2: 0, answerJudge: 0, breakdownJudge: 0 };
  try {
    const t1 = await callModel(MODEL, p.turn1Text);
    if (t1.response.model !== MODEL) throw new Error(`HONESTY: reported model ${t1.response.model}`);
    const u1 = exp.readUsage(t1.response);
    cost.turn1 = evalMod.computeCallCostUsd(MODEL, u1.inputTokens, u1.outputTokens) ?? 0;
    const breakdownText = t1.response.output_text?.trim() ?? "";

    const t2 = await callModel(MODEL, [
      { role: "user", content: p.turn1Text },
      { role: "assistant", content: breakdownText },
      { role: "user", content: RULING_FOLLOW_UP }
    ]);
    if (t2.response.model !== MODEL) throw new Error(`HONESTY: reported model ${t2.response.model}`);
    const u2 = exp.readUsage(t2.response);
    cost.turn2 = evalMod.computeCallCostUsd(MODEL, u2.inputTokens, u2.outputTokens) ?? 0;
    const answerText = t2.response.output_text?.trim() ?? "";

    const judged = await judgeAnswerAlone({
      client,
      judgeModel,
      question: caseEntry.question,
      ...p.judgeInputs,
      answerText,
      workedSolution: caseEntry.expected.answer
    });
    cost.answerJudge = evalMod.computeCallCostUsd(judgeModel, judged.usage.inputTokens, judged.usage.outputTokens) ?? 0;

    let bd = null;
    let bdIn = 0;
    let bdOut = 0;
    for (let attempt = 0; attempt < 2 && !bd; attempt++) {
      const { response } = await callModel(judgeModel, buildBreakdownJudgePrompt({
        question: caseEntry.question,
        cards: (caseEntry.cards ?? []).map((c) => c.name),
        stateLines: p.judgeInputs.stateLines ?? [],
        decidingRuleIds: p.allRules,
        referenceAnswer: caseEntry.expected.answer,
        breakdownText
      }));
      const u = exp.readUsage(response);
      bdIn += u.inputTokens ?? 0;
      bdOut += u.outputTokens ?? 0;
      const parsed = parseJson(response.output_text);
      if (parsed && ["complete", "missing", "wrong"].includes(parsed.verdict)) bd = parsed;
    }
    cost.breakdownJudge = evalMod.computeCallCostUsd(judgeModel, bdIn, bdOut) ?? 0;
    cost.total = cost.turn1 + cost.turn2 + cost.answerJudge + cost.breakdownJudge;

    const record = {
      caseId: caseEntry.id,
      repeat,
      model: MODEL,
      reportedModel: { turn1: t1.response.model, turn2: t2.response.model },
      reportedEffort: { turn1: u1.reportedEffort ?? null, turn2: u2.reportedEffort ?? null },
      excerptCap: CAP,
      arm: "A",
      embeddingProvider: embedder.mode,
      usedSemantic: p.retrieval.usedSemantic,
      selectedRuleIds: p.retrieval.selectedRuleIds,
      decidingRulesChecked: p.allRules,
      decidingRuleAvailability: p.availability.rules,
      allDecidingRulesInPrompt: p.availability.allDecidingRulesInPrompt,
      promptHash: p.promptHash,
      promptHashCheckAtRun: check,
      promptChars: p.promptText.length,
      judgeModel,
      rubricRevision: RUBRIC_REVISION,
      breakdownRubricRevision: BREAKDOWN_RUBRIC_REVISION,
      breakdownText,
      breakdownVerdict: bd?.verdict ?? "undetermined",
      breakdownReason: bd?.reason ?? null,
      breakdownLeaksRuling: bd?.leaksRuling ?? null,
      answerText,
      undetermined: judged.undetermined,
      scores: judged.undetermined ? null : judged.scores,
      rationale: judged.undetermined ? judged.reason : judged.rationale,
      latencyMs: { turn1: t1.latencyMs, turn2: t2.latencyMs },
      attempts: { turn1: t1.attempts, turn2: t2.attempts },
      tokens: { turn1: u1, turn2: u2, answerJudge: judged.usage, breakdownJudge: { inputTokens: bdIn, outputTokens: bdOut } },
      costUsd: cost,
      at: new Date().toISOString()
    };
    appendFileSync(RECORDS, `${JSON.stringify(record)}\n`);
    spent += cost.total;
    console.log(`${caseEntry.id} r${repeat}: breakdown ${record.breakdownVerdict}, correctness ${judged.undetermined ? "?" : judged.scores.correctness}, effort ${record.reportedEffort.turn1}/${record.reportedEffort.turn2}, hash ${check}, $${spent.toFixed(3)}`);
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
writeFileSync(`${OUT_DIR}/run.json`, JSON.stringify({ spentUsd: spent, maxUsd: MAX_USD, model: MODEL, judgeModel, cap: CAP, effort: "default (none sent)", breakdownInstruction: BREAKDOWN_INSTRUCTION, rulingFollowUp: RULING_FOLLOW_UP, breakdownRubricRevision: BREAKDOWN_RUBRIC_REVISION, aborted: aborted ? String(aborted.message) : null, stoppedForCap, finishedAt: new Date().toISOString() }, null, 2));
if (aborted) {
  console.error(`ABORTED: ${aborted.stack ?? aborted}`);
  process.exit(1);
}
console.log(`${stoppedForCap ? "Stopped at the cost cap. " : ""}Done. Spent $${spent.toFixed(4)}.`);
