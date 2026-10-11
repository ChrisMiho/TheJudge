// Throwaway probe: describe-then-answer (breakdown) on Luna.
//
// Turn 1: today's production prompt (arm A, cap 10, local embeddings, same retrieval)
//         + an appended instruction asking Luna to describe the tasks, no ruling.
// Turn 2: same messages + Luna's breakdown + "Now give your ruling."
// The turn-2 answer is graded by the standard judgeAnswerAlone; the breakdown is graded
// by gpt-6.1-sol with the probe rubric below, never seeing Luna's ruling.
//
// Usage (from the worktree):
//   npx tsx <this file> --cases <manifest.json | id,id,...> --out <dir> [--repeats 6]
//     [--baseline <calls.jsonl>] [--max-cost-usd 6] [--concurrency 3] [--confirm-live-calls]
//     [--summarize-only]
// Without --confirm-live-calls it prints the dry plan and cost estimate only.

import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const WT = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";

const { loadGoldCases } = await import(`${WT}/scripts/lib/gold-cases.mjs`);
const fidelity = await import(`${WT}/scripts/lib/prompt-fidelity.mjs`);
const { buildCaseRequest, buildEmbedder, describeRetrieval, embedGoldCaseQueries, loadPromptResources } = fidelity;
const { buildJudgeInputs, attachedRuleIdsOf } = await import(`${WT}/scripts/lib/judge-inputs.mjs`);
const { hashPrompt } = await import(`${WT}/scripts/lib/answer-quality-run.mjs`);
const evalMod = await import(`${WT}/scripts/eval-answer-quality.mjs`);
const { resolveRunEnv, computeCallCostUsd, MODEL_PRICING_USD_PER_MILLION_TOKENS } = evalMod;
const { preparePromptInput } = await import(`${WT}/apps/backend/src/prompt/preparation.ts`);
const { judgeAnswerAlone } = await import(`${WT}/apps/backend/src/eval/answer-quality/judge.ts`);
const { RUBRIC_REVISION } = await import(`${WT}/apps/backend/src/eval/answer-quality/rubric.ts`);

export const ANSWER_MODEL = "gpt-6-luna";
export const JUDGE_MODEL = "gpt-6.1-sol";
export const EXCERPT_CAP = 10;
export const PRODUCTION_BUDGET_MS = 30_000;

export const BREAKDOWN_INSTRUCTION = [
  "Before ruling, describe the tasks this question requires: list each card, effect and rule interaction involved,",
  "and the order you will work through them to reach the ruling. Do not give the ruling yet."
].join(" ");
export const RULING_FOLLOW_UP = "Now give your ruling.";

export const BREAKDOWN_RUBRIC_REVISION = "breakdown-probe.1";
export const BREAKDOWN_RUBRIC = [
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

// ---------- args ----------
function parseArgs(argv) {
  const out = { repeats: 6, maxCostUsd: 6, concurrency: 3, confirmed: false, summarizeOnly: false, baseline: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cases") out.cases = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--repeats") out.repeats = Number(argv[++i]);
    else if (a === "--baseline") out.baseline = argv[++i];
    else if (a === "--max-cost-usd") out.maxCostUsd = Number(argv[++i]);
    else if (a === "--concurrency") out.concurrency = Number(argv[++i]);
    else if (a === "--confirm-live-calls") out.confirmed = true;
    else if (a === "--summarize-only") out.summarizeOnly = true;
    else throw new Error(`unknown arg ${a}`);
  }
  if (!out.cases || !out.out) throw new Error("need --cases and --out");
  return out;
}

async function resolveCaseIds(spec) {
  if (spec.endsWith(".json")) {
    const parsed = JSON.parse(await readFile(spec, "utf8"));
    const list = Array.isArray(parsed) ? parsed : parsed.caseList ?? parsed.cases;
    return list.map((entry) => (typeof entry === "string" ? entry : entry.id));
  }
  return spec.split(",").map((s) => s.trim()).filter(Boolean);
}

// ---------- baseline ----------
async function loadBaseline(path) {
  if (!path) return null;
  const byCase = new Map();
  for (const line of (await readFile(path, "utf8")).split("\n")) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line);
    const r = parsed.record ?? parsed;
    if (r.arm !== "A" || r.status !== "ok") continue;
    const entry = byCase.get(r.caseId) ?? { right: 0, n: 0, promptHashes: new Set(), latencies: [] };
    entry.n += 1;
    if (r.scores?.correctness === 2) entry.right += 1;
    entry.promptHashes.add(r.promptHash);
    entry.latencies.push(r.latencyMs);
    byCase.set(r.caseId, entry);
  }
  return byCase;
}

// ---------- live helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** One Luna call; SDK retries off so the timed latency is one attempt. Retries only on 429/5xx/connection, recorded. */
async function callLuna(client, input) {
  let attempts = 0;
  for (;;) {
    attempts += 1;
    const started = Date.now();
    try {
      const response = await client.responses.create({ model: ANSWER_MODEL, input }, { maxRetries: 0 });
      return { response, latencyMs: Date.now() - started, attempts };
    } catch (error) {
      const status = error?.status;
      const retryable = status === 429 || (typeof status === "number" && status >= 500) || /connection|ECONNRESET|fetch failed/i.test(String(error?.message));
      if (!retryable || attempts >= 5) throw error;
      await sleep(2000 * attempts);
    }
  }
}

function usageOf(response) {
  const u = response?.usage ?? {};
  return {
    inputTokens: u.input_tokens ?? 0,
    outputTokens: u.output_tokens ?? 0,
    reasoningTokens: u.output_tokens_details?.reasoning_tokens ?? 0
  };
}

class Abort extends Error {}

// ---------- main ----------
const args = parseArgs(process.argv.slice(2));
await mkdir(args.out, { recursive: true });
const recordsPath = join(args.out, "records.jsonl");
const runPath = join(args.out, "run.json");

const caseIds = await resolveCaseIds(args.cases);
const allCases = await loadGoldCases();
const byId = new Map(allCases.map((c) => [c.id, c]));
const cases = caseIds.map((id) => {
  const c = byId.get(id);
  if (!c) throw new Error(`case ${id} not in corpus`);
  return c;
});
const baseline = await loadBaseline(args.baseline);

if (!args.summarizeOnly) {
  const env = resolveRunEnv({ processEnv: process.env, confirmed: args.confirmed });
  const resources = await loadPromptResources({ env });
  if (!resources.comboCatalog) throw new Error("combo catalog not loaded -- production loads it");
  const embedder = await buildEmbedder(env);
  if (embedder.mode !== "local") throw new Error(`embedding provider is ${embedder.mode}, not local -- abort`);
  const vectors = await embedGoldCaseQueries({ goldCases: cases, embedder, cardDetailIndex: resources.cardDetailIndex });

  // Prepare every case once: retrieval is fixed per case and identical between turns and repeats.
  const prepared = new Map();
  for (const caseEntry of cases) {
    const request = buildCaseRequest(caseEntry);
    const p = preparePromptInput(request, {
      ...resources,
      supplementalRuleCap: EXCERPT_CAP,
      queryEmbedding: vectors.get(caseEntry.id) ?? null,
      collectEnrichmentDebug: true
    });
    const retrieval = describeRetrieval(p.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, {
      requireSemantic: true,
      caseId: caseEntry.id
    });
    const promptHash = hashPrompt(p.promptText);
    const base = baseline?.get(caseEntry.id);
    const matchesBaseline = base ? base.promptHashes.has(promptHash) : null;
    const turn1Text = `${p.promptText}\n\n${BREAKDOWN_INSTRUCTION}`;
    const judgeInputs = buildJudgeInputs({
      caseEntry,
      promptText: p.promptText,
      attachedRuleIds: attachedRuleIdsOf(p),
      ruleIndex: resources.gameRulesRuleIndex
    });
    prepared.set(caseEntry.id, { request, p, retrieval, promptHash, matchesBaseline, turn1Text, judgeInputs });
  }

  // Dry estimate. Token assumptions from the baseline arm A run (Luna ~1,250 output incl. reasoning;
  // judge ~2,800 in / 200 out) with turn 2 resending turn 1 plus the breakdown.
  const price = MODEL_PRICING_USD_PER_MILLION_TOKENS;
  let estimate = 0;
  for (const caseEntry of cases) {
    const { turn1Text } = prepared.get(caseEntry.id);
    const t1In = turn1Text.length / 4;
    const t1 = (t1In * price[ANSWER_MODEL].input + 1500 * price[ANSWER_MODEL].output) / 1e6;
    const t2 = ((t1In + 600) * price[ANSWER_MODEL].input + 1500 * price[ANSWER_MODEL].output) / 1e6;
    const answerJudge = (3200 * price[JUDGE_MODEL].input + 400 * price[JUDGE_MODEL].output) / 1e6;
    const breakdownJudge = (2000 * price[JUDGE_MODEL].input + 400 * price[JUDGE_MODEL].output) / 1e6;
    estimate += (t1 + t2 + answerJudge + breakdownJudge) * args.repeats;
  }
  const perConversation = estimate / (cases.length * args.repeats);

  console.log(`Cases: ${cases.length} x ${args.repeats} repeats = ${cases.length * args.repeats} conversations`);
  console.log(`Embedding provider: ${embedder.mode}; all retrieval semantic: yes (describeRetrieval requireSemantic passed)`);
  console.log(`Rubric revision: ${RUBRIC_REVISION}; breakdown rubric: ${BREAKDOWN_RUBRIC_REVISION}`);
  for (const caseEntry of cases) {
    const { promptHash, matchesBaseline, p } = prepared.get(caseEntry.id);
    console.log(`  ${caseEntry.id}: prompt ${p.promptText.length} chars, hash ${promptHash.slice(0, 12)}, matches baseline arm A: ${matchesBaseline}`);
  }
  console.log(`Estimated cost: $${estimate.toFixed(2)} ($${perConversation.toFixed(4)} per conversation); cap $${args.maxCostUsd}`);
  if (!args.confirmed) {
    const sample = prepared.get(cases[0].id).turn1Text;
    console.log("\n--- turn-1 prompt tail (first case) ---\n" + sample.slice(-1500));
    console.log("\nDry run only. Re-run with --confirm-live-calls.");
    process.exit(0);
  }
  if (estimate > args.maxCostUsd) throw new Error(`estimate $${estimate.toFixed(2)} over cap $${args.maxCostUsd}`);

  const { createRequire } = await import("node:module");
  const openaiEntry = createRequire(`${WT}/package.json`).resolve("openai");
  const openaiMod = await import(openaiEntry);
  const OpenAI = openaiMod.default?.default ?? openaiMod.default ?? openaiMod.OpenAI;
  const lunaClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const judgeClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  // Resume: skip keys already recorded; carry their cost into the spend.
  const done = new Set();
  let spent = 0;
  if (existsSync(runPath)) spent = JSON.parse(await readFile(runPath, "utf8")).spentUsd ?? 0;
  if (existsSync(recordsPath)) {
    for (const line of (await readFile(recordsPath, "utf8")).split("\n")) if (line.trim()) done.add(JSON.parse(line).key);
  }

  const queue = [];
  for (let repeat = 1; repeat <= args.repeats; repeat++) {
    for (const caseEntry of cases) {
      const key = `${caseEntry.id}|${repeat}`;
      if (!done.has(key)) queue.push({ caseEntry, repeat, key });
    }
  }
  let inFlight = 0;
  let stopped = null;
  const saveRun = () =>
    writeFile(
      runPath,
      JSON.stringify(
        {
          spentUsd: spent,
          maxCostUsd: args.maxCostUsd,
          answerModel: ANSWER_MODEL,
          judgeModel: JUDGE_MODEL,
          excerptCap: EXCERPT_CAP,
          rubricRevision: RUBRIC_REVISION,
          breakdownRubricRevision: BREAKDOWN_RUBRIC_REVISION,
          breakdownInstruction: BREAKDOWN_INSTRUCTION,
          rulingFollowUp: RULING_FOLLOW_UP,
          breakdownRubric: BREAKDOWN_RUBRIC,
          embeddingProvider: embedder.mode,
          concurrency: args.concurrency,
          stopped,
          updatedAt: new Date().toISOString()
        },
        null,
        2
      )
    );

  async function runOne({ caseEntry, repeat, key }) {
    const { p, retrieval, promptHash, matchesBaseline, turn1Text, judgeInputs } = prepared.get(caseEntry.id);
    let callSpend = 0;
    const charge = (model, usage) => {
      const c = computeCallCostUsd(model, usage.inputTokens, usage.outputTokens) ?? 0;
      callSpend += c;
      spent += c;
      return c;
    };
    // Turn 1: production prompt + instruction, as production's single-string input.
    const t1 = await callLuna(lunaClient, turn1Text);
    const t1Usage = usageOf(t1.response);
    const t1Cost = charge(ANSWER_MODEL, t1Usage);
    const t1Model = t1.response.model ?? null;
    if (t1Model !== ANSWER_MODEL) throw new Abort(`reported model ${t1Model} on ${key} turn 1`);
    const breakdownText = t1.response.output_text?.trim() ?? "";

    // Turn 2: raw message continuation; the same prepared prompt (retrieval unchanged).
    const t2 = await callLuna(lunaClient, [
      { role: "user", content: turn1Text },
      { role: "assistant", content: breakdownText },
      { role: "user", content: RULING_FOLLOW_UP }
    ]);
    const t2Usage = usageOf(t2.response);
    const t2Cost = charge(ANSWER_MODEL, t2Usage);
    const t2Model = t2.response.model ?? null;
    if (t2Model !== ANSWER_MODEL) throw new Abort(`reported model ${t2Model} on ${key} turn 2`);
    const answerText = t2.response.output_text?.trim() ?? "";

    // Standard answer judge (current rubric), same inputs as the baseline.
    const judged = await judgeAnswerAlone({
      client: judgeClient,
      judgeModel: JUDGE_MODEL,
      question: caseEntry.question,
      ...judgeInputs,
      answerText,
      workedSolution: caseEntry.expected.answer
    });
    const answerJudgeCost = charge(JUDGE_MODEL, judged.usage);

    // Breakdown judge: never sees the ruling.
    let bd = null;
    let bdUsage = { inputTokens: 0, outputTokens: 0 };
    for (let attempt = 0; attempt < 2 && !bd; attempt++) {
      const resp = await judgeClient.responses.create({
        model: JUDGE_MODEL,
        input: buildBreakdownJudgePrompt({
          question: caseEntry.question,
          cards: (caseEntry.cards ?? []).map((c) => c.name),
          stateLines: judgeInputs.stateLines,
          decidingRuleIds: caseEntry.expected.decidingRuleIds,
          referenceAnswer: caseEntry.expected.answer,
          breakdownText
        })
      });
      const u = usageOf(resp);
      bdUsage = { inputTokens: bdUsage.inputTokens + u.inputTokens, outputTokens: bdUsage.outputTokens + u.outputTokens };
      const parsed = parseJson(resp.output_text);
      if (parsed && ["complete", "missing", "wrong"].includes(parsed.verdict)) bd = parsed;
    }
    const breakdownJudgeCost = charge(JUDGE_MODEL, bdUsage);

    return {
      key,
      caseId: caseEntry.id,
      repeat,
      breakdownText,
      breakdownVerdict: bd?.verdict ?? "undetermined",
      breakdownReason: bd?.reason ?? null,
      breakdownLeaksRuling: bd?.leaksRuling ?? null,
      answerText,
      answerUndetermined: judged.undetermined,
      scores: judged.undetermined ? null : judged.scores,
      answerRationale: judged.undetermined ? judged.reason : judged.rationale,
      latencyMs: { turn1: t1.latencyMs, turn2: t2.latencyMs, combined: t1.latencyMs + t2.latencyMs },
      attempts: { turn1: t1.attempts, turn2: t2.attempts },
      tokens: { turn1: t1Usage, turn2: t2Usage, answerJudge: judged.usage, breakdownJudge: bdUsage },
      reportedEffort: { turn1: t1.response.reasoning?.effort ?? null, turn2: t2.response.reasoning?.effort ?? null },
      costUsd: {
        turn1: t1Cost,
        turn2: t2Cost,
        answerJudge: answerJudgeCost,
        breakdownJudge: breakdownJudgeCost,
        total: callSpend
      },
      embeddingProvider: embedder.mode,
      usedSemantic: retrieval.usedSemantic,
      selectedRuleIds: retrieval.selectedRuleIds,
      goldRuleInPrompt: retrieval.goldRuleInPrompt,
      reportedModel: { turn1: t1Model, turn2: t2Model },
      basePromptHash: promptHash,
      basePromptMatchesBaselineArmA: matchesBaseline,
      basePromptChars: p.promptText.length,
      answerModel: ANSWER_MODEL,
      judgeModel: JUDGE_MODEL,
      rubricRevision: RUBRIC_REVISION,
      breakdownRubricRevision: BREAKDOWN_RUBRIC_REVISION,
      recordedAt: new Date().toISOString()
    };
  }

  async function worker() {
    while (queue.length > 0 && !stopped) {
      // Cap: never start a conversation that could push spend past the cap.
      if (spent + (inFlight + 1) * perConversation * 2 > args.maxCostUsd) {
        stopped = `cost cap: spent $${spent.toFixed(3)} with ${inFlight} in flight`;
        break;
      }
      const job = queue.shift();
      inFlight += 1;
      try {
        const record = await runOne(job);
        await appendFile(recordsPath, JSON.stringify(record) + "\n");
        const s = record.scores?.correctness;
        console.log(
          `${job.key}: breakdown ${record.breakdownVerdict}, correctness ${s ?? "undetermined"}, ${record.latencyMs.turn1}+${record.latencyMs.turn2}ms, spent $${spent.toFixed(3)}`
        );
      } catch (error) {
        if (error instanceof Abort) {
          stopped = `honesty abort: ${error.message}`;
        } else {
          console.log(`${job.key}: error ${error?.message} -- requeued once`);
          if (!job.retried) queue.push({ ...job, retried: true });
        }
      } finally {
        inFlight -= 1;
        await saveRun();
      }
    }
  }
  await Promise.all(Array.from({ length: args.concurrency }, () => worker()));
  await saveRun();
  console.log(`Done. Spent $${spent.toFixed(3)}. ${stopped ? `STOPPED: ${stopped}` : "No stop."}`);
  if (stopped) process.exit(2);
}

// ---------- summary ----------
const records = existsSync(recordsPath)
  ? (await readFile(recordsPath, "utf8")).split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l))
  : [];
const run = existsSync(runPath) ? JSON.parse(await readFile(runPath, "utf8")) : {};
const right = (r) => r.scores?.correctness === 2;
const complete = (r) => r.breakdownVerdict === "complete";
const cell = (b, a) => records.filter((r) => complete(r) === b && right(r) === a).length;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  if (s.length === 0) return 0;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pct = (xs, p) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)] ?? 0;
};
const sec = (ms) => `${(ms / 1000).toFixed(1)} s`;

const lines = [];
lines.push(`# Breakdown probe (describe-then-answer) — summary`, "");
lines.push(
  `${records.length} conversations; answer model ${ANSWER_MODEL}; judge ${JUDGE_MODEL} (answer rubric ${RUBRIC_REVISION}, breakdown rubric ${BREAKDOWN_RUBRIC_REVISION}); excerpt cap ${EXCERPT_CAP}; embeddings ${[...new Set(records.map((r) => r.embeddingProvider))].join(", ")}; spent $${(run.spentUsd ?? 0).toFixed(2)}.`,
  ""
);
lines.push(`## 1. Does a complete task list line up with a right ruling?`, "");
lines.push(`| Task list | Ruling right | Ruling not right | Total |`, `| --- | --- | --- | --- |`);
lines.push(`| complete | ${cell(true, true)} | ${cell(true, false)} | ${cell(true, true) + cell(true, false)} |`);
lines.push(`| not complete | ${cell(false, true)} | ${cell(false, false)} | ${cell(false, true) + cell(false, false)} |`);
const verdicts = ["complete", "missing", "wrong", "undetermined"];
lines.push("", `Breakdown verdicts split by ruling: ` + verdicts.map((v) => `${v} ${records.filter((r) => r.breakdownVerdict === v && right(r)).length} right / ${records.filter((r) => r.breakdownVerdict === v && !right(r)).length} not`).join("; ") + ".");
const leaks = records.filter((r) => r.breakdownLeaksRuling === true).length;
lines.push(`Task lists that stated or implied the ruling despite the instruction: ${leaks} of ${records.length}.`, "");

lines.push(`## 2. Accuracy vs today's prompt (baseline arm A, rr-hard)`, "");
lines.push(`| Case | Describe-then-answer right / n | Baseline A right / n | Task lists complete |`, `| --- | --- | --- | --- |`);
let totRight = 0, totN = 0, baseRight = 0, baseN = 0;
for (const caseEntry of cases) {
  const rs = records.filter((r) => r.caseId === caseEntry.id);
  const b = baseline?.get(caseEntry.id);
  totRight += rs.filter(right).length;
  totN += rs.length;
  baseRight += b?.right ?? 0;
  baseN += b?.n ?? 0;
  lines.push(`| ${caseEntry.id} | ${rs.filter(right).length} / ${rs.length} | ${b ? `${b.right} / ${b.n}` : "—"} | ${rs.filter(complete).length} / ${rs.length} |`);
}
lines.push(`| **Total** | **${totRight} / ${totN}** | **${baseRight} / ${baseN}** | ${records.filter(complete).length} / ${records.length} |`, "");
const hashMatch = records.filter((r) => r.basePromptMatchesBaselineArmA === true).length;
lines.push(`Base prompt (before the appended instruction) identical to the baseline arm A prompt: ${hashMatch} of ${records.length} records.`, "");

lines.push(`## 3. Answer time (both turns) vs the 30 s budget`, "");
const comb = records.map((r) => r.latencyMs.combined);
const t1s = records.map((r) => r.latencyMs.turn1);
const t2s = records.map((r) => r.latencyMs.turn2);
const baseLat = baseline ? [...baseline.values()].flatMap((b) => b.latencies) : [];
lines.push(`| | Median | p95 | Max | Over 30 s |`, `| --- | --- | --- | --- | --- |`);
lines.push(`| Turn 1 (task list) | ${sec(median(t1s))} | ${sec(pct(t1s, 95))} | ${sec(Math.max(0, ...t1s))} | ${t1s.filter((x) => x > PRODUCTION_BUDGET_MS).length} |`);
lines.push(`| Turn 2 (ruling) | ${sec(median(t2s))} | ${sec(pct(t2s, 95))} | ${sec(Math.max(0, ...t2s))} | ${t2s.filter((x) => x > PRODUCTION_BUDGET_MS).length} |`);
lines.push(`| Combined | ${sec(median(comb))} | ${sec(pct(comb, 95))} | ${sec(Math.max(0, ...comb))} | ${comb.filter((x) => x > PRODUCTION_BUDGET_MS).length} |`);
if (baseLat.length) lines.push(`| Baseline A (one call) | ${sec(median(baseLat))} | ${sec(pct(baseLat, 95))} | ${sec(Math.max(...baseLat))} | ${baseLat.filter((x) => x > PRODUCTION_BUDGET_MS).length} |`);
const retried = records.filter((r) => r.attempts.turn1 > 1 || r.attempts.turn2 > 1).length;
lines.push("", `Latency is one timed attempt per turn; ${retried} conversations needed a rate-limit retry (not counted in the time). Run concurrency ${run.concurrency ?? "?"}.`, "");

lines.push(`## 4. Every miss (ruling not right)`, "");
const misses = records.filter((r) => !right(r)).sort((a, b) => a.caseId.localeCompare(b.caseId) || a.repeat - b.repeat);
if (misses.length === 0) lines.push("None.");
for (const r of misses) {
  lines.push(`- **${r.caseId} r${r.repeat}** — correctness ${r.scores?.correctness ?? "undetermined"}; task list **${r.breakdownVerdict}**: ${r.breakdownReason ?? "(no reason)"}`);
}
lines.push("", `## Not-complete task lists on right rulings (the control)`, "");
const ctrl = records.filter((r) => right(r) && !complete(r)).sort((a, b) => a.caseId.localeCompare(b.caseId) || a.repeat - b.repeat);
if (ctrl.length === 0) lines.push("None.");
for (const r of ctrl) lines.push(`- ${r.caseId} r${r.repeat} — ${r.breakdownVerdict}: ${r.breakdownReason ?? ""}`);
lines.push("", `## Probe setup`, "");
lines.push(`Turn-1 instruction appended to the production prompt: "${BREAKDOWN_INSTRUCTION}"`, "");
lines.push(`Turn-2 follow-up: "${RULING_FOLLOW_UP}"`, "");
lines.push("Breakdown rubric sent to the judge (it never sees Luna's ruling):", "", "```", BREAKDOWN_RUBRIC, "```", "");
await writeFile(join(args.out, "summary.md"), lines.join("\n"));
console.log(`Wrote ${join(args.out, "summary.md")} (${records.length} records)`);
