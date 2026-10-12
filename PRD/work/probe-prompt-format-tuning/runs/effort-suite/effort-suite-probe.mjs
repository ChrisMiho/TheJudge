// Throwaway probe: Luna at reasoning effort low/high vs production (no effort -> medium) on the hard-25 practice-suite set.
// Mirrors `eval-answer-quality.mjs --suite practice` (arm A, cap 10, local embedder, gpt-6.1-sol judge) for one answer;
// the ONLY change from that run is `reasoning: { effort }` on the answer call.
// Usage (from anywhere): npx tsx <this file> --effort low|high [--live] [--concurrency 3] [--repeats 5] [--limit N]
// Every output stays under output/practice-suite/ (gitignored, local only).
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/practice-suite`;
const CASE_IDS = JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final;
const PASSES = [1, 2, 3, 4, 5].map((n) => `${SUITE}/runs/pft-pass${n}`);

const MODEL = "gpt-6-luna";
const EXPECTED_JUDGE = "gpt-6.1-sol";
const CAP = 10;
const MAX_USD_TOTAL = 6; // across both effort folders

const args = process.argv.slice(2);
const flag = (name, dflt) => (args.includes(name) ? args[args.indexOf(name) + 1] : dflt);
const EFFORT = flag("--effort");
if (!["low", "high"].includes(EFFORT)) throw new Error("--effort low|high is required");
const live = args.includes("--live");
const concurrency = Math.min(3, Number(flag("--concurrency", 3)));
const REPEATS = Number(flag("--repeats", 5));
const limit = Number(flag("--limit", Infinity));
const ANSWER_ESTIMATE_MULTIPLIER = EFFORT === "high" ? 4 : 1.5;
const OUT_DIR = `${SUITE}/runs/probe-effort-${EFFORT}`;
const RECORDS = `${OUT_DIR}/records.jsonl`;
const OTHER_RECORDS = `${SUITE}/runs/probe-effort-${EFFORT === "high" ? "low" : "high"}/records.jsonl`;

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const gold = await imp("scripts/lib/gold-cases.mjs");
const exp = await imp("scripts/lib/experiment-run.mjs");
const ji = await imp("scripts/lib/judge-inputs.mjs");
const ra = await imp("scripts/lib/rule-availability.mjs");
const sg = await imp("scripts/lib/practice-suite.mjs");
const { hashPrompt } = await imp("scripts/lib/answer-quality-run.mjs");
const { preparePromptInput } = await imp("apps/backend/src/prompt/preparation.ts");
const { judgeAnswerAlone } = await imp("apps/backend/src/eval/answer-quality/judge.ts");
const { RUBRIC_REVISION } = await imp("apps/backend/src/eval/answer-quality/rubric.ts");
const { computeDeterministicAssertions } = await imp("apps/backend/src/eval/answer-quality/assertions.ts");

sg.assertSuiteIgnored({ suiteDir: SUITE });
sg.resolveInsideSuite(OUT_DIR, { suiteDir: SUITE });

const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
const judgeModel = evalMod.resolveJudgeModel(env);
if (judgeModel !== EXPECTED_JUDGE) throw new Error(`judge model is ${judgeModel}, expected ${EXPECTED_JUDGE}`);
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");

// ---- baseline: pass records (medium), re-read on demand because the passes are still writing --------
function readBaseline() {
  const hash = new Map(); // caseId -> Set of promptHash
  const caseFileSha = new Map();
  for (const dir of PASSES) {
    if (!existsSync(`${dir}/calls.jsonl`)) continue;
    const m = JSON.parse(readFileSync(`${dir}/manifest.json`, "utf8"));
    for (const [id, h] of Object.entries(m.caseFileSha256 ?? {})) caseFileSha.set(id, h);
    for (const line of readFileSync(`${dir}/calls.jsonl`, "utf8").split("\n").filter(Boolean)) {
      let j;
      try { j = JSON.parse(line); } catch { continue; } // a line being written
      if (j.type !== "record" || !CASE_IDS.includes(j.record.caseId) || !j.record.promptHash) continue;
      if (!hash.has(j.record.caseId)) hash.set(j.record.caseId, new Set());
      hash.get(j.record.caseId).add(j.record.promptHash);
    }
  }
  return { hash, caseFileSha };
}

// ---- cases: loaded exactly as the suite run loads them -----------------------------------------
const casesDir = join(SUITE, "cases");
const allCases = await gold.loadGoldCases(casesDir, { external: true });
const sources = await gold.loadSnapshotSources();
const isStale = (c) => gold.compareSnapshot(c, sources).stale;
const picked = CASE_IDS.map((id) => allCases.find((c) => c.id === id));
if (picked.some((c) => !c)) throw new Error("a hard-25 case is missing from the suite folder");
const manifest = { formatVersion: 1, cases: picked.map((c) => exp.manifestEntryFor(c)) };
const cases = exp.validateManifestCases({ manifest, allCases, isStale, suite: true });

// Case files must be byte-identical to what the passes read.
{
  const { createHash } = await import("node:crypto");
  const { caseFileSha } = readBaseline();
  const bad = cases.filter((c) => createHash("sha256").update(readFileSync(join(casesDir, `${c.id}.case.json`))).digest("hex") !== caseFileSha.get(c.id));
  if (bad.length) throw new Error(`case file differs from the pass manifest: ${bad.map((c) => c.id).join(", ")}`);
}

const resources = await fid.loadPromptResources({ env });
const knownRuleIds = new Set(resources.gameRulesRuleIndex.map((e) => e.ruleId));
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);
const vectors = await fid.embedGoldCaseQueries({ goldCases: cases, embedder, cardDetailIndex: resources.cardDetailIndex });

// As executeExperiment: raw buildCaseRequest (no schema parse), prepare with the case's query vector.
function prepare(caseEntry) {
  const request = fid.buildCaseRequest(caseEntry);
  const prepared = preparePromptInput(request, { ...resources, supplementalRuleCap: CAP, queryEmbedding: vectors.get(caseEntry.id) ?? null, collectEnrichmentDebug: true });
  const retrieval = fid.describeRetrieval(prepared.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, { requireSemantic: true, caseId: caseEntry.id });
  return { request, prepared, promptText: prepared.promptText, retrieval, promptHash: hashPrompt(prepared.promptText) };
}

function hashCheck(caseId, promptHash) {
  const set = readBaseline().hash.get(caseId);
  if (!set) return "pending";
  if (set.size !== 1 || !set.has(promptHash)) return "mismatch";
  return "match";
}

const estimateFor = (promptText) =>
  ANSWER_ESTIMATE_MULTIPLIER * evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: promptText.length }) +
  evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel });

// ---- dry estimate ----------------------------------------------------------------------------
const prepCache = new Map();
let estTotal = 0;
const status = { match: [], pending: [], mismatch: [] };
for (const c of cases) {
  const p = prepare(c);
  prepCache.set(c.id, p);
  status[hashCheck(c.id, p.promptHash)].push(c.id);
  estTotal += estimateFor(p.promptText) * REPEATS;
}
const spentOf = (file) =>
  existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).reduce((s, l) => s + (JSON.parse(l).totalCostUsd ?? 0), 0) : 0;
console.log(`Cases ${cases.length}; rubric ${RUBRIC_REVISION}; judge ${judgeModel}; effort ${EFFORT}; repeats ${REPEATS}`);
console.log(`Prompt hash vs pass records: match ${status.match.length}, not yet in passes ${status.pending.length}, MISMATCH ${status.mismatch.length} ${status.mismatch.join(", ")}`);
console.log(`Estimate this effort: $${estTotal.toFixed(2)} (answer x${ANSWER_ESTIMATE_MULTIPLIER}); already spent both folders: $${(spentOf(RECORDS) + spentOf(OTHER_RECORDS)).toFixed(4)}; hard stop $${MAX_USD_TOTAL} total`);
if (!live) process.exit(0);

// ---- live ------------------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
const require = createRequire(`${REPO}/scripts/eval-answer-quality.mjs`);
const { default: OpenAI } = await import(pathToFileURL(require.resolve("openai")).href);
const client = new OpenAI(evalMod.openAiClientOptions(env)); // as defaultBuildClient
const { missing } = await evalMod.checkModelAccess({ client, modelIds: [MODEL, judgeModel] });
if (missing.length) throw new Error(`no access to ${missing.join(", ")}`);

const done = new Set();
if (existsSync(RECORDS)) for (const l of readFileSync(RECORDS, "utf8").split("\n").filter(Boolean)) { const r = JSON.parse(l); done.add(`${r.caseId}|${r.repeat}`); }
let spent = spentOf(RECORDS) + spentOf(OTHER_RECORDS);
const queue = [];
for (let repeat = 1; repeat <= REPEATS; repeat++) for (const c of cases) if (!done.has(`${c.id}|${repeat}`)) queue.push({ caseEntry: c, repeat });
if (queue.length > limit) queue.length = limit;
console.log(`Queue ${queue.length}; spent so far $${spent.toFixed(4)}`);

let reserved = 0;
let aborted = null;
let stoppedForCap = false;
const skipped = new Set();

async function answerOnce(promptText) {
  const startedAt = Date.now();
  let response;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
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
  return { answerText, latencyMs, reportedModel: response.model, usage };
}

async function runOne({ caseEntry, repeat }) {
  if (skipped.has(caseEntry.id)) return;
  const p = prepCache.get(caseEntry.id);
  const check = hashCheck(caseEntry.id, p.promptHash);
  if (check === "mismatch") {
    skipped.add(caseEntry.id);
    console.log(`${caseEntry.id}: PROMPT HASH MISMATCH vs pass records -- case aborted`);
    return;
  }
  const est = estimateFor(p.promptText);
  if (spent + reserved + est > MAX_USD_TOTAL) { stoppedForCap = true; return; }
  reserved += est;
  try {
    const a = await answerOnce(p.promptText);
    const inputTokens = a.usage.inputTokens ?? Math.round(p.promptText.length / 4);
    const outputTokens = a.usage.outputTokens ?? Math.round(a.answerText.length / 4);
    const attachedRuleIds = ji.attachedRuleIdsOf(p.prepared, []);
    const assertions = computeDeterministicAssertions(a.answerText, caseEntry.expected.decidingRuleIds, knownRuleIds);
    const judgeResult = await judgeAnswerAlone({
      client,
      judgeModel,
      question: caseEntry.question,
      ...ji.buildJudgeInputs({ caseEntry, promptText: p.promptText, attachedRuleIds, ruleIndex: resources.gameRulesRuleIndex }),
      answerText: a.answerText,
      workedSolution: caseEntry.expected.answer
    });
    const availability = ra.describeDecidingRules({ decidingRuleIds: caseEntry.expected.decidingRuleIds, prepared: { ...p.prepared, promptText: p.promptText }, request: p.request, cardRulingsIndex: resources.cardRulingsIndex, extraRuleIds: [] });
    const costUsd = evalMod.computeCallCostUsd(MODEL, inputTokens, outputTokens);
    const judgeCostUsd = evalMod.computeCallCostUsd(judgeModel, judgeResult.usage.inputTokens, judgeResult.usage.outputTokens);
    const record = {
      caseId: caseEntry.id,
      repeat,
      model: MODEL,
      excerptCap: CAP,
      arm: "A",
      embeddingProvider: embedder.mode,
      usedSemantic: p.retrieval.usedSemantic,
      reportedModel: a.reportedModel,
      requestedEffort: EFFORT,
      reportedEffort: a.usage.reportedEffort,
      judgeModel,
      rubricRevision: RUBRIC_REVISION,
      promptHash: p.promptHash,
      promptHashCheckAtRun: check,
      promptChars: p.promptText.length,
      goldRuleInPrompt: p.retrieval.goldRuleInPrompt,
      allDecidingRulesInPrompt: availability.allDecidingRulesInPrompt,
      undetermined: judgeResult.undetermined,
      scores: judgeResult.undetermined ? null : judgeResult.scores,
      rationale: judgeResult.undetermined ? judgeResult.reason : judgeResult.rationale,
      namesGoldRuleId: assertions.namesGoldRuleId,
      unknownRuleIds: assertions.unknownRuleIds ?? [],
      latencyMs: a.latencyMs,
      inputTokens,
      outputTokens,
      reasoningTokens: a.usage.reasoningTokens,
      costUsd,
      judgeCostUsd,
      totalCostUsd: costUsd + judgeCostUsd,
      answer: a.answerText,
      at: new Date().toISOString()
    };
    appendFileSync(RECORDS, `${JSON.stringify(record)}\n`);
    spent += record.totalCostUsd;
    console.log(`${caseEntry.id} r${repeat}: ${judgeResult.undetermined ? "?" : judgeResult.scores.correctness} ${a.latencyMs}ms rt=${a.usage.reasoningTokens} hash=${check} $${spent.toFixed(3)}`);
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
console.log(`${stoppedForCap ? "Stopped at the cost cap. " : ""}Done. Spent (both folders) $${spent.toFixed(4)}. Hash-mismatch cases: ${[...skipped].join(", ") || "none"}`);
