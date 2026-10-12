// Throwaway probe: Luna (today's default effort, no effort parameter) on the hard-25 practice-suite set, with every
// deciding rule the verifier named added to the prompt's supplemental excerpts section when the prompt does not
// already carry it. Mirrors the pass runs (arm A, cap 10, local embedder, gpt-6.1-sol judge) for one answer; the
// ONLY change from production is the added excerpts, in the exact `<ruleId>. <text>` format and section
// formatSupplementalRulesSection prints, with rule-index text verbatim.
// Usage: npx tsx <this file> [--live] [--concurrency 3] [--repeats 5] [--limit N]
// Every output stays under output/practice-suite/ (gitignored, local only).
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/practice-suite`;
const VERIFY = JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8"));
const CASE_IDS = VERIFY.final;
const PASSES = [1, 2, 3, 4, 5].map((n) => `${SUITE}/runs/pft-pass${n}`);

const MODEL = "gpt-6-luna";
const EXPECTED_JUDGE = "gpt-6.1-sol";
const EXPECTED_EFFORT = "medium";
const CAP = 10;
const MAX_USD_TOTAL = 4;

const args = process.argv.slice(2);
const flag = (name, dflt) => (args.includes(name) ? args[args.indexOf(name) + 1] : dflt);
const live = args.includes("--live");
const concurrency = Math.min(3, Number(flag("--concurrency", 3)));
const REPEATS = Number(flag("--repeats", 5));
const limit = Number(flag("--limit", Infinity));
const ANSWER_ESTIMATE_MULTIPLIER = 1.5;
const OUT_DIR = `${SUITE}/runs/probe-oracle-hard25`;
const RECORDS = `${OUT_DIR}/records.jsonl`;

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const gold = await imp("scripts/lib/gold-cases.mjs");
const exp = await imp("scripts/lib/experiment-run.mjs");
const ji = await imp("scripts/lib/judge-inputs.mjs");
const ra = await imp("scripts/lib/rule-availability.mjs");
const sg = await imp("scripts/lib/practice-suite.mjs");
const arms = await imp("scripts/lib/diagnostic-arms.mjs");
const { hashPrompt } = await imp("scripts/lib/answer-quality-run.mjs");
const { preparePromptInput } = await imp("apps/backend/src/prompt/preparation.ts");
const { formatSupplementalRulesSection } = await imp("apps/backend/src/prompt/promptFormatting.ts");
const { judgeAnswerAlone } = await imp("apps/backend/src/eval/answer-quality/judge.ts");
const { RUBRIC_REVISION } = await imp("apps/backend/src/eval/answer-quality/rubric.ts");
const { computeDeterministicAssertions } = await imp("apps/backend/src/eval/answer-quality/assertions.ts");

sg.assertSuiteIgnored({ suiteDir: SUITE });
sg.resolveInsideSuite(OUT_DIR, { suiteDir: SUITE });

const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
const judgeModel = evalMod.resolveJudgeModel(env);
if (judgeModel !== EXPECTED_JUDGE) throw new Error(`judge model is ${judgeModel}, expected ${EXPECTED_JUDGE}`);
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");

// ---- baseline: pass records (medium), re-read on demand because the passes may still be writing ------
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

// ---- cases: loaded exactly as the suite run loads them -----------------------------------------
const casesDir = join(SUITE, "cases");
const allCases = await gold.loadGoldCases(casesDir, { external: true });
const sources = await gold.loadSnapshotSources();
const isStale = (c) => gold.compareSnapshot(c, sources).stale;
const picked = CASE_IDS.map((id) => allCases.find((c) => c.id === id));
if (picked.some((c) => !c)) throw new Error("a hard-25 case is missing from the suite folder");
const manifest = { formatVersion: 1, cases: picked.map((c) => exp.manifestEntryFor(c)) };
const cases = exp.validateManifestCases({ manifest, allCases, isStale, suite: true });
{
  const { createHash } = await import("node:crypto");
  const { caseFileSha } = readBaseline();
  const bad = cases.filter((c) => createHash("sha256").update(readFileSync(join(casesDir, `${c.id}.case.json`))).digest("hex") !== caseFileSha.get(c.id));
  if (bad.length) throw new Error(`case file differs from the pass manifest: ${bad.map((c) => c.id).join(", ")}`);
}

const resources = await fid.loadPromptResources({ env });
const ruleById = new Map(resources.gameRulesRuleIndex.map((e) => [e.ruleId, e]));
const knownRuleIds = new Set(ruleById.keys());
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);
const vectors = await fid.embedGoldCaseQueries({ goldCases: cases, embedder, cardDetailIndex: resources.cardDetailIndex });

const EXCERPT_HEADER = "ADDITIONAL RELEVANT RULE EXCERPTS";

// Adds the verifier's deciding rules the base prompt does not already carry (excerpt blocks or curated-topic
// rule lines) to the end of the excerpts section, verbatim rule-index text in the formatter's block format.
function injectDecidingRules(basePrompt, prepared, verifierRules) {
  const parsed = arms.parseLookupPrompt(basePrompt);
  if (arms.renderOriginal(parsed) !== basePrompt) throw new Error("parse/render round trip is not exact");
  const carried = arms.carriedRuleIds(parsed);
  const notRules = verifierRules.filter((id) => !/^\d+\.\d+[a-z]*$/.test(id));
  const unknown = verifierRules.filter((id) => /^\d+\.\d+[a-z]*$/.test(id) && !ruleById.has(id));
  const alreadyPresent = verifierRules.filter((id) => carried.has(id));
  const addedRuleIds = [...new Set(verifierRules.filter((id) => ruleById.has(id) && !carried.has(id)))];
  if (addedRuleIds.length === 0) return { promptText: basePrompt, addedRuleIds, alreadyPresent, notRules, unknown };

  // The production selected rules, then the added ones, through the production formatter.
  // The debug block carries ids only; retrieval copies text from this same index, and the exact-once search of the
  // re-formatted section in the base prompt below proves it is byte-identical.
  const selected = (prepared.enrichmentDebug?.supplemental?.selected ?? []).map((r) => ({ ruleId: r.ruleId, text: ruleById.get(r.ruleId).text }));
  const added = addedRuleIds.map((id) => ({ ruleId: id, text: ruleById.get(id).text }));
  const oldSection = formatSupplementalRulesSection(selected);
  const newSection = formatSupplementalRulesSection([...selected, ...added]);
  let promptText;
  if (oldSection) {
    const at = basePrompt.indexOf(oldSection);
    if (at < 0 || basePrompt.indexOf(oldSection, at + 1) >= 0) throw new Error("excerpt section not found exactly once");
    promptText = basePrompt.slice(0, at) + newSection + basePrompt.slice(at + oldSection.length);
  } else {
    // No excerpt section: place it where the production assembler would (after the curated topics), via the arm parser.
    const next = { ...parsed, sections: [...parsed.sections] };
    next.excerpts = { intro: newSection.split("\n").slice(0, 2).join("\n"), blocks: added.map((r) => `${r.ruleId}. ${r.text}`) };
    next.sections.splice(next.sections.indexOf("GAME RULES (reference)") + 1, 0, EXCERPT_HEADER);
    promptText = arms.renderOriginal(next);
  }
  // Self-check: the injected prompt parses, carries every added rule, and only grew by the added blocks.
  const check = arms.carriedRuleIds(arms.parseLookupPrompt(promptText));
  for (const id of addedRuleIds) if (!check.has(id)) throw new Error(`injected rule ${id} not found after injection`);
  return { promptText, addedRuleIds, alreadyPresent, notRules, unknown };
}

function prepare(caseEntry) {
  const request = fid.buildCaseRequest(caseEntry);
  const prepared = preparePromptInput(request, { ...resources, supplementalRuleCap: CAP, queryEmbedding: vectors.get(caseEntry.id) ?? null, collectEnrichmentDebug: true });
  const retrieval = fid.describeRetrieval(prepared.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, { requireSemantic: true, caseId: caseEntry.id });
  const basePrompt = prepared.promptText;
  const verifierRules = VERIFY.verdicts[caseEntry.id]["deciding rules"];
  const inj = injectDecidingRules(basePrompt, prepared, verifierRules);
  return {
    request, prepared, retrieval, verifierRules, ...inj,
    basePromptHash: hashPrompt(basePrompt), basePromptChars: basePrompt.length,
    promptHash: hashPrompt(inj.promptText)
  };
}

function hashCheck(caseId, basePromptHash) {
  const set = readBaseline().hash.get(caseId);
  if (!set) return "pending";
  if (set.size !== 1 || !set.has(basePromptHash)) return "mismatch";
  return "match";
}

const estimateFor = (promptText) =>
  ANSWER_ESTIMATE_MULTIPLIER * evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: promptText.length }) +
  evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel });

// ---- dry estimate + injection plan --------------------------------------------------------------
const prepCache = new Map();
let estTotal = 0;
const status = { match: [], pending: [], mismatch: [] };
const plan = [];
for (const c of cases) {
  const p = prepare(c);
  prepCache.set(c.id, p);
  status[hashCheck(c.id, p.basePromptHash)].push(c.id);
  estTotal += estimateFor(p.promptText) * REPEATS;
  plan.push({ caseId: c.id, verifierRules: p.verifierRules, alreadyPresent: p.alreadyPresent, addedRuleIds: p.addedRuleIds, notRules: p.notRules, unknown: p.unknown, basePromptHash: p.basePromptHash, basePromptChars: p.basePromptChars, promptChars: p.promptText.length, usedSemantic: p.retrieval.usedSemantic });
}
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/injection-plan.json`, JSON.stringify(plan, null, 1));
const spentOf = (file) =>
  existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).reduce((s, l) => s + (JSON.parse(l).totalCostUsd ?? 0), 0) : 0;
console.log(`Cases ${cases.length}; rubric ${RUBRIC_REVISION}; judge ${judgeModel}; repeats ${REPEATS}; embedder ${embedder.mode}; semantic on ${plan.filter((x) => x.usedSemantic).length}`);
console.log(`Base prompt hash vs pass records: match ${status.match.length}, not yet in passes ${status.pending.length} ${status.pending.join(", ")}, MISMATCH ${status.mismatch.length} ${status.mismatch.join(", ")}`);
for (const x of plan) console.log(`  ${x.caseId}: +[${x.addedRuleIds.join(" ")}] present[${x.alreadyPresent.join(" ")}]${x.notRules.length ? ` not-a-rule[${x.notRules.join("|")}]` : ""}${x.unknown.length ? ` UNKNOWN[${x.unknown.join(" ")}]` : ""} chars ${x.basePromptChars}->${x.promptChars}`);
console.log(`Estimate: $${estTotal.toFixed(2)} (answer x${ANSWER_ESTIMATE_MULTIPLIER}); already spent $${spentOf(RECORDS).toFixed(4)}; hard stop $${MAX_USD_TOTAL}`);
if (args.includes("--spot")) {
  const p = prepCache.get(flag("--spot"));
  const t = p.promptText; const a = t.indexOf("ADDITIONAL RELEVANT RULE EXCERPTS"); const b = t.indexOf("\n\nCARD (looked up)", a);
  console.log("SECTION ORDER", arms.parseLookupPrompt(t).sections.join(" | "));
  console.log(t.slice(a, b).split("\n").filter((l) => /^\d+\.\d+[a-z]*\. /.test(l) || /^[A-Z]{4}/.test(l)).map((l) => l.slice(0, 12)).join("\n"));
}
if (!live) process.exit(0);
if (estTotal > MAX_USD_TOTAL) throw new Error("estimate over the cap");

// ---- live ------------------------------------------------------------------------------------
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
const skipped = new Set();

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
  const usage = exp.readUsage(response);
  if (usage.reportedEffort !== EXPECTED_EFFORT) throw new Error(`HONESTY: provider reported effort ${usage.reportedEffort}, expected ${EXPECTED_EFFORT}`);
  const answerText = response.output_text?.trim() ?? "";
  return { answerText, latencyMs, reportedModel: response.model, usage };
}

async function runOne({ caseEntry, repeat }) {
  if (skipped.has(caseEntry.id)) return;
  const p = prepCache.get(caseEntry.id);
  const check = hashCheck(caseEntry.id, p.basePromptHash);
  if (check === "mismatch") {
    skipped.add(caseEntry.id);
    console.log(`${caseEntry.id}: BASE PROMPT HASH MISMATCH vs pass records -- case aborted`);
    return;
  }
  const est = estimateFor(p.promptText);
  if (spent + reserved + est > MAX_USD_TOTAL) { stoppedForCap = true; return; }
  reserved += est;
  try {
    const a = await answerOnce(p.promptText);
    const inputTokens = a.usage.inputTokens ?? Math.round(p.promptText.length / 4);
    const outputTokens = a.usage.outputTokens ?? Math.round(a.answerText.length / 4);
    const attachedRuleIds = ji.attachedRuleIdsOf(p.prepared, p.addedRuleIds);
    const assertions = computeDeterministicAssertions(a.answerText, caseEntry.expected.decidingRuleIds, knownRuleIds);
    const judgeResult = await judgeAnswerAlone({
      client,
      judgeModel,
      question: caseEntry.question,
      ...ji.buildJudgeInputs({ caseEntry, promptText: p.promptText, attachedRuleIds, ruleIndex: resources.gameRulesRuleIndex }),
      answerText: a.answerText,
      workedSolution: caseEntry.expected.answer
    });
    const availability = ra.describeDecidingRules({ decidingRuleIds: caseEntry.expected.decidingRuleIds, prepared: { ...p.prepared, promptText: p.promptText }, request: p.request, cardRulingsIndex: resources.cardRulingsIndex, extraRuleIds: p.addedRuleIds });
    const costUsd = evalMod.computeCallCostUsd(MODEL, inputTokens, outputTokens);
    const judgeCostUsd = evalMod.computeCallCostUsd(judgeModel, judgeResult.usage.inputTokens, judgeResult.usage.outputTokens);
    const record = {
      caseId: caseEntry.id,
      repeat,
      model: MODEL,
      excerptCap: CAP,
      arm: "A+oracle-verifier-rules",
      embeddingProvider: embedder.mode,
      usedSemantic: p.retrieval.usedSemantic,
      reportedModel: a.reportedModel,
      requestedEffort: null,
      reportedEffort: a.usage.reportedEffort,
      judgeModel,
      rubricRevision: RUBRIC_REVISION,
      basePromptHash: p.basePromptHash,
      basePromptHashCheckAtRun: check,
      promptHash: p.promptHash,
      basePromptChars: p.basePromptChars,
      promptChars: p.promptText.length,
      verifierRules: p.verifierRules,
      verifierRulesAlreadyPresent: p.alreadyPresent,
      addedRuleIds: p.addedRuleIds,
      goldRuleInPrompt: p.retrieval.goldRuleInPrompt,
      allCaseDecidingRulesInPrompt: availability.allDecidingRulesInPrompt,
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
console.log(`${stoppedForCap ? "Stopped at the cost cap. " : ""}Done. Spent $${spent.toFixed(4)}. Hash-mismatch cases: ${[...skipped].join(", ") || "none"}`);
