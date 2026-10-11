// Throwaway probe: arm L (zone topics for attached permanents / instants+sorceries) on the hard-25 RulesGuru set.
// Mirrors effort-suite-probe.mjs (arm A, cap 10, local embedder, gpt-6.1-sol judge, no effort param). The ONLY change
// from production is arm L's extra GAME RULES topics via the lookup topic filter seam (see arm-l.mjs).
// Usage: npx tsx <this file> [--live] [--concurrency 3] [--repeats 5] [--limit N]
// Every RulesGuru output stays under output/rulesguru/ (gitignored, local only).
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import * as C from "./common.mjs";
import { makeArmL } from "./arm-l.mjs";

const SUITE = `${C.REPO}/output/rulesguru`;
const VERIFY = JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8"));
const CASE_IDS = VERIFY.final;
const PASSES = [1, 2, 3, 4, 5].map((n) => `${SUITE}/runs/pft-pass${n}`);
const OUT_DIR = `${SUITE}/runs/probe-lookup-topics-hard25`;
const RECORDS = C.SUITE_RECORDS;

const args = process.argv.slice(2);
const flag = (name, dflt) => (args.includes(name) ? args[args.indexOf(name) + 1] : dflt);
const live = args.includes("--live");
const concurrency = Math.min(3, Number(flag("--concurrency", 3)));
const REPEATS = Number(flag("--repeats", 5));
const limit = Number(flag("--limit", Infinity));

const evalMod = await C.imp("scripts/eval-answer-quality.mjs");
const fid = await C.imp("scripts/lib/prompt-fidelity.mjs");
const gold = await C.imp("scripts/lib/gold-cases.mjs");
const exp = await C.imp("scripts/lib/experiment-run.mjs");
const ji = await C.imp("scripts/lib/judge-inputs.mjs");
const ra = await C.imp("scripts/lib/rule-availability.mjs");
const sg = await C.imp("scripts/lib/rulesguru-suite.mjs");
const arms = await C.imp("scripts/lib/diagnostic-arms.mjs");
const { hashPrompt } = await C.imp("scripts/lib/answer-quality-run.mjs");
const { preparePromptInput } = await C.imp("apps/backend/src/prompt/preparation.ts");
const { buildLookupPromptContext } = await C.imp("apps/backend/src/prompt/context.ts");
const { judgeAnswerAlone } = await C.imp("apps/backend/src/eval/answer-quality/judge.ts");
const { RUBRIC_REVISION } = await C.imp("apps/backend/src/eval/answer-quality/rubric.ts");
const { computeDeterministicAssertions } = await C.imp("apps/backend/src/eval/answer-quality/assertions.ts");

sg.assertSuiteIgnored({ suiteDir: SUITE });
sg.resolveInsideSuite(OUT_DIR, { suiteDir: SUITE });

const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
const judgeModel = evalMod.resolveJudgeModel(env);
if (judgeModel !== C.EXPECTED_JUDGE) throw new Error(`judge model is ${judgeModel}, expected ${C.EXPECTED_JUDGE}`);
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
  if (bad.length) throw new Error(`case file differs from the pass manifest: ${bad.length} case(s)`);
}

const resources = await fid.loadPromptResources({ env });
const knownRuleIds = new Set(resources.gameRulesRuleIndex.map((e) => e.ruleId));
const armL = makeArmL(resources.gameRulesTopics);

// ---- gate share over the whole suite's Quick Lookup requests (no model calls) ----------------
{
  let n = 0, bf = 0, st = 0, any = 0, both = 0;
  for (const c of allCases) {
    const req = fid.buildCaseRequest(c);
    if (req.mode !== "lookup") continue;
    const g = armL.gate(buildLookupPromptContext(req, resources.cardDetailIndex).cards);
    n++; if (g.battlefield) bf++; if (g.stack) st++; if (g.battlefield || g.stack) any++; if (g.battlefield && g.stack) both++;
  }
  console.log(`Gate share, whole suite Quick Lookup: n=${n} fires=${any} (${((any / n) * 100).toFixed(1)}%) battlefield=${bf} stack=${st} both=${both}`);
}

const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);
const vectors = await fid.embedGoldCaseQueries({ goldCases: cases, embedder, cardDetailIndex: resources.cardDetailIndex });

function prepare(caseEntry) {
  const request = fid.buildCaseRequest(caseEntry);
  if (request.mode !== "lookup") throw new Error("hard-25 case is not Quick Lookup");
  const opts = { ...resources, supplementalRuleCap: C.CAP, queryEmbedding: vectors.get(caseEntry.id) ?? null, collectEnrichmentDebug: true };
  const base = preparePromptInput(request, opts);
  const g = armL.gate(base.context.cards);
  const prepared = armL.prepareWithExtra(preparePromptInput, request, opts, g.extraIds);
  const d = armL.diff(base.promptText, prepared.promptText, base, prepared, g.extraIds);
  const retrieval = fid.describeRetrieval(prepared.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, { requireSemantic: true, caseId: caseEntry.id });
  fid.describeRetrieval(base.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, { requireSemantic: true, caseId: caseEntry.id });
  const verifierRules = (VERIFY.verdicts[caseEntry.id]?.["deciding rules"] ?? []).filter((id) => /^\d+\.\d+[a-z]*$/.test(id));
  const carriedBase = arms.carriedRuleIds(arms.parseLookupPrompt(base.promptText));
  const carriedArm = arms.carriedRuleIds(arms.parseLookupPrompt(prepared.promptText));
  return {
    request, prepared, promptText: prepared.promptText, retrieval, gate: g, diff: d,
    basePromptHash: hashPrompt(base.promptText), basePromptChars: base.promptText.length, promptHash: hashPrompt(prepared.promptText),
    verifierRulesInBase: verifierRules.filter((id) => carriedBase.has(id)).length,
    verifierRulesInArm: verifierRules.filter((id) => carriedArm.has(id)).length,
    verifierRulesTotal: verifierRules.length
  };
}

function hashCheck(caseId, basePromptHash) {
  const set = readBaseline().hash.get(caseId);
  if (!set) return "pending";
  if (set.size !== 1 || !set.has(basePromptHash)) return "mismatch";
  return "match";
}

const estimateFor = (promptText) =>
  C.ANSWER_ESTIMATE_MULTIPLIER * evalMod.estimateCallCostUsd({ kind: "answer", model: C.MODEL, promptChars: promptText.length }) +
  evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel });

// ---- dry estimate ----------------------------------------------------------------------------
const prepCache = new Map();
let estTotal = 0;
const status = { match: 0, pending: 0, mismatch: 0 };
const added = [];
let lostAny = 0, lostRules = 0, decidingLost = 0;
let fires = 0, exChanged = 0, allVerBase = 0, allVerArm = 0, anyVerGain = 0;
for (const c of cases) {
  const p = prepare(c);
  prepCache.set(c.id, p);
  status[hashCheck(c.id, p.basePromptHash)]++;
  estTotal += estimateFor(p.promptText) * REPEATS;
  if (p.gate.extraIds.length) fires++;
  added.push(p.diff.addedPromptChars);
  if (p.diff.excerptsChanged) exChanged++;
  if (p.diff.excerptsLostFromPrompt.length) lostAny++;
  lostRules += p.diff.excerptsLostFromPrompt.length;
  if (p.verifierRulesInArm < p.verifierRulesInBase) decidingLost++;
  if (p.verifierRulesTotal && p.verifierRulesInBase === p.verifierRulesTotal) allVerBase++;
  if (p.verifierRulesTotal && p.verifierRulesInArm === p.verifierRulesTotal) allVerArm++;
  if (p.verifierRulesInArm > p.verifierRulesInBase) anyVerGain++;
}
const sorted = [...added].sort((a, b) => a - b);
console.log(`Cases ${cases.length}; rubric ${RUBRIC_REVISION}; judge ${judgeModel}; repeats ${REPEATS}`);
console.log(`Base prompt hash vs pass records: match ${status.match}, no pass record ${status.pending}, MISMATCH ${status.mismatch}`);
console.log(`Gate fires on ${fires}/${cases.length}; added prompt chars median ${sorted[Math.floor(sorted.length / 2)]} max ${sorted.at(-1)}; excerpt section changed (curated de-dup) on ${exChanged}`);
console.log(`Excerpt reshuffle: cases losing an excerpt rule from the prompt ${lostAny} (rules ${lostRules}); cases losing a verifier deciding rule ${decidingLost}`);
console.log(`Verifier deciding rules all in prompt: base ${allVerBase}/${cases.length}, arm L ${allVerArm}/${cases.length}; cases gaining any verifier rule: ${anyVerGain}`);
console.log(`Estimate: $${estTotal.toFixed(2)}; already spent both probes $${C.spentBoth().toFixed(4)}; hard stop $${C.MAX_USD_TOTAL}`);
if (!live) process.exit(0);
if (status.mismatch) throw new Error("base prompt mismatch; refusing");

// ---- live ------------------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
const client = await C.makeClient(evalMod, env, judgeModel);
const done = new Set();
if (existsSync(RECORDS)) for (const l of readFileSync(RECORDS, "utf8").split("\n").filter(Boolean)) { const r = JSON.parse(l); done.add(`${r.caseId}|${r.repeat}`); }
let spent = C.spentBoth();
const queue = [];
for (let repeat = 1; repeat <= REPEATS; repeat++) for (const c of cases) if (!done.has(`${c.id}|${repeat}`)) queue.push({ caseEntry: c, repeat });
if (queue.length > limit) queue.length = limit;
console.log(`Queue ${queue.length}; spent so far $${spent.toFixed(4)}`);
let reserved = 0;

async function runOne({ caseEntry, repeat }, state) {
  const p = prepCache.get(caseEntry.id);
  const check = hashCheck(caseEntry.id, p.basePromptHash);
  if (check === "mismatch") throw new Error("base prompt hash mismatch at run");
  const est = estimateFor(p.promptText);
  if (spent + reserved + est > C.MAX_USD_TOTAL) { state.stoppedForCap = true; return; }
  reserved += est;
  try {
    const a = await C.answerOnce(client, exp, p.promptText);
    const inputTokens = a.usage.inputTokens ?? Math.round(p.promptText.length / 4);
    const outputTokens = a.usage.outputTokens ?? Math.round(a.answerText.length / 4);
    const attachedRuleIds = ji.attachedRuleIdsOf(p.prepared, []);
    const assertions = computeDeterministicAssertions(a.answerText, caseEntry.expected.decidingRuleIds, knownRuleIds);
    const judgeResult = await judgeAnswerAlone({
      client, judgeModel, question: caseEntry.question,
      ...ji.buildJudgeInputs({ caseEntry, promptText: p.promptText, attachedRuleIds, ruleIndex: resources.gameRulesRuleIndex }),
      answerText: a.answerText, workedSolution: caseEntry.expected.answer
    });
    const availability = ra.describeDecidingRules({ decidingRuleIds: caseEntry.expected.decidingRuleIds, prepared: p.prepared, request: p.request, cardRulingsIndex: resources.cardRulingsIndex, extraRuleIds: [] });
    const costUsd = evalMod.computeCallCostUsd(C.MODEL, inputTokens, outputTokens);
    const judgeCostUsd = evalMod.computeCallCostUsd(judgeModel, judgeResult.usage.inputTokens, judgeResult.usage.outputTokens);
    const record = {
      caseId: caseEntry.id, repeat, model: C.MODEL, excerptCap: C.CAP, arm: "L",
      embeddingProvider: embedder.mode, usedSemantic: p.retrieval.usedSemantic, reportedModel: a.reportedModel,
      requestedEffort: null, reportedEffort: a.usage.reportedEffort, judgeModel, rubricRevision: RUBRIC_REVISION,
      basePromptHash: p.basePromptHash, basePromptHashCheckAtRun: check, promptHash: p.promptHash,
      basePromptChars: p.basePromptChars, promptChars: p.promptText.length,
      gateBattlefield: p.gate.battlefield, gateStack: p.gate.stack, addedTopicIds: p.diff.addedTopicIds,
      addedPromptChars: p.diff.addedPromptChars, excerptsChanged: p.diff.excerptsChanged,
      excerptsLostFromPrompt: p.diff.excerptsLostFromPrompt, excerptsBackfilled: p.diff.excerptsBackfilled, excerptsRemovedNowInTopics: p.diff.excerptsRemovedNowInTopics,
      verifierRulesInBase: p.verifierRulesInBase, verifierRulesInArm: p.verifierRulesInArm, verifierRulesTotal: p.verifierRulesTotal,
      goldRuleInPrompt: p.retrieval.goldRuleInPrompt, allDecidingRulesInPrompt: availability.allDecidingRulesInPrompt,
      undetermined: judgeResult.undetermined, scores: judgeResult.undetermined ? null : judgeResult.scores,
      rationale: judgeResult.undetermined ? judgeResult.reason : judgeResult.rationale,
      namesGoldRuleId: assertions.namesGoldRuleId, unknownRuleIds: assertions.unknownRuleIds ?? [],
      latencyMs: a.latencyMs, inputTokens, outputTokens, reasoningTokens: a.usage.reasoningTokens,
      costUsd, judgeCostUsd, totalCostUsd: costUsd + judgeCostUsd, answer: a.answerText, at: new Date().toISOString()
    };
    appendFileSync(RECORDS, `${JSON.stringify(record)}\n`);
    spent += record.totalCostUsd;
    console.log(`suite r${repeat}: ${judgeResult.undetermined ? "?" : judgeResult.scores.correctness} ${a.latencyMs}ms hash=${check} $${spent.toFixed(3)}`);
  } finally {
    reserved -= est;
  }
}

const state = await C.runQueue(queue, concurrency, runOne);
if (state.aborted) { console.error(`ABORTED: ${state.aborted.stack ?? state.aborted}`); process.exit(1); }
console.log(`${state.stoppedForCap ? "Stopped at the cost cap. " : ""}Done. Spent (both probes) $${spent.toFixed(4)}.`);
