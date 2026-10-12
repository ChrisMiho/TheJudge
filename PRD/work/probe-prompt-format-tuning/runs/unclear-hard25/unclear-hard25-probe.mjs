// Throwaway probe, session-3 step "ask what's unclear": the hard-25 suite set, each prompt with every deciding rule
// added (oracle-suite-probe.mjs's injection, verbatim), Luna first lists her steps WITH the prompt part each step
// relies on and anything in the prompt she finds unclear, then rules. A judge sorts every miss into
//   lacked (the prompt didn't carry what the step needed) / misused (it did, she got it wrong) / unclear (the
//   prompt's own wording is ambiguous or conflicting — quoted).
// Mirrors the pass runs: arm A preparation, cap 10, local embedder, Luna at default effort, gpt-6.1-sol judge.
// Usage (from .worktrees/probe-pft): npx tsx <this file> [--live] [--repeats 4] [--concurrency 3] [--limit N]
// All outputs stay under output/practice-suite/ (gitignored, local only). No suite content lives in this file.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/practice-suite`;
const VERIFY = JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8"));
const CASE_IDS = VERIFY.final;
const PASSES = [1, 2, 3, 4, 5].map((n) => `${SUITE}/runs/pft-pass${n}`);
const OUT_DIR = `${SUITE}/runs/probe-unclear-hard25`;
const RECORDS = `${OUT_DIR}/records.jsonl`;

const MODEL = "gpt-6-luna";
const EXPECTED_JUDGE = "gpt-6.1-sol";
const EXPECTED_EFFORT = "medium";
const CAP = 10;
const MAX_USD = 6;

const STEP_INSTRUCTION = [
  "Before ruling, list the steps this question needs you to take to reach a ruling, in order.",
  "For each step, name the part of this prompt you are relying on for it: a rule excerpt (give its number), a Wizards ruling (name the card), card text (name the card), an instruction in this prompt (quote a few words of it), or \"nothing provided\" if the prompt gives you nothing for that step.",
  "Then, under the heading UNCLEAR, list anything in this prompt that is unclear, ambiguous or conflicting for this question, quoting the words. Write \"none\" if nothing is.",
  "Do not give the ruling yet."
].join(" ");
const RULING_FOLLOW_UP = "Now give your ruling.";

const STEP_RUBRIC_REVISION = "unclear-probe.1";
const STEP_RUBRIC = [
  "You are diagnosing why a Magic: The Gathering rules assistant's reasoning did or did not reach the approved reference answer. The reference answer is authoritative: your task is agreement with it, not independent adjudication.",
  "The assistant was given the PROMPT below. Before ruling, it listed its steps and, for each, the part of the prompt it relied on; it also listed anything it found unclear. Then it gave its RULING.",
  "",
  "1. listVerdict for the step list against the reference:",
  "- complete: names every card effect and rule interaction the reference depends on, and says nothing false that would change the ruling.",
  "- missing: omits at least one interaction the reference depends on, and says nothing false that would change it.",
  "- wrong: makes a false rules claim, or orders steps in a way, that leads to a different ruling than the reference. If both missing and wrong, choose wrong.",
  "",
  "2. misses: every point where the step list or the ruling departs from what the reference needs. Empty when the list is complete and the ruling agrees with the reference. For each miss give:",
  "- step: a short description of the step (in your own words, under 15 words).",
  "- kind: \"lacked\" when the PROMPT does not contain what that step needed (no rule, ruling or card text that settles it); \"misused\" when the PROMPT contains it plainly and the assistant skipped, misread or misapplied it; \"unclear\" when the PROMPT contains wording (an instruction, a rule excerpt, a ruling or card text) that is ambiguous, conflicting or misleading for this question and plausibly led the assistant astray.",
  "- promptPart: what the assistant relied on, or should have: \"rule <number>\", \"ruling\", \"card text\", \"instruction\", or \"none\".",
  "- quote: for kind \"unclear\" only, the exact words from the PROMPT (under 30 words) that are ambiguous or conflicting; otherwise an empty string.",
  "- why: one sentence.",
  "",
  "3. flagged: each item the assistant listed under UNCLEAR (empty if it wrote none). For each: item (under 15 words, your own words), real (true if the prompt really is unclear or conflicting there), relatedToMiss (true if it bears on one of the misses above)."
].join("\n");

function buildStepJudgePrompt({ promptText, decidingRuleIds, referenceAnswer, stepText, rulingText }) {
  return [
    STEP_RUBRIC,
    "",
    `Rules the reference ruling turns on (all of them are present in the PROMPT): ${decidingRuleIds.join(", ")}`,
    `Reference answer (approved, authoritative): ${referenceAnswer}`,
    "",
    "===== PROMPT (what the assistant saw) =====",
    promptText,
    "===== END PROMPT =====",
    "",
    "===== STEP LIST =====",
    stepText,
    "===== RULING =====",
    rulingText,
    "",
    "Respond with ONLY a JSON object, no prose outside it, no code fence, in the exact shape:",
    '{"listVerdict": "complete"|"missing"|"wrong", "misses": [{"step": "...", "kind": "lacked"|"misused"|"unclear", "promptPart": "...", "quote": "...", "why": "..."}], "flagged": [{"item": "...", "real": true|false, "relatedToMiss": true|false}]}'
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
const validStepJudgement = (j) =>
  j && ["complete", "missing", "wrong"].includes(j.listVerdict) && Array.isArray(j.misses) && Array.isArray(j.flagged) &&
  j.misses.every((m) => ["lacked", "misused", "unclear"].includes(m.kind));

const args = process.argv.slice(2);
const flag = (name, dflt) => (args.includes(name) ? args[args.indexOf(name) + 1] : dflt);
const live = args.includes("--live");
const REPEATS = Number(flag("--repeats", 4));
const concurrency = Math.min(3, Number(flag("--concurrency", 3)));
const limit = Number(flag("--limit", Infinity));

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
const ruleById = new Map(resources.gameRulesRuleIndex.map((e) => [e.ruleId, e]));
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);
const vectors = await fid.embedGoldCaseQueries({ goldCases: cases, embedder, cardDetailIndex: resources.cardDetailIndex });

const EXCERPT_HEADER = "ADDITIONAL RELEVANT RULE EXCERPTS";
const RULE_ID = /^\d{3}(\.\d+[a-z]*)?$/;

// Copied from oracle-suite-probe.mjs: add the verifier's deciding rules the base prompt does not already carry.
function injectDecidingRules(basePrompt, prepared, verifierRules) {
  const parsed = arms.parseLookupPrompt(basePrompt);
  if (arms.renderOriginal(parsed) !== basePrompt) throw new Error("parse/render round trip is not exact");
  const carried = arms.carriedRuleIds(parsed);
  const addedRuleIds = [...new Set(verifierRules.filter((id) => ruleById.has(id) && !carried.has(id)))];
  const unknown = verifierRules.filter((id) => /^\d+\.\d+[a-z]*$/.test(id) && !ruleById.has(id));
  if (addedRuleIds.length === 0) return { promptText: basePrompt, addedRuleIds, unknown };
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
    const next = { ...parsed, sections: [...parsed.sections] };
    next.excerpts = { intro: newSection.split("\n").slice(0, 2).join("\n"), blocks: added.map((r) => `${r.ruleId}. ${r.text}`) };
    next.sections.splice(next.sections.indexOf("GAME RULES (reference)") + 1, 0, EXCERPT_HEADER);
    promptText = arms.renderOriginal(next);
  }
  const check = arms.carriedRuleIds(arms.parseLookupPrompt(promptText));
  for (const id of addedRuleIds) if (!check.has(id)) throw new Error(`injected rule ${id} not found after injection`);
  return { promptText, addedRuleIds, unknown };
}

function prepare(caseEntry) {
  const request = fid.buildCaseRequest(caseEntry);
  const prepared = preparePromptInput(request, { ...resources, supplementalRuleCap: CAP, queryEmbedding: vectors.get(caseEntry.id) ?? null, collectEnrichmentDebug: true });
  const retrieval = fid.describeRetrieval(prepared.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, { requireSemantic: true, caseId: caseEntry.id });
  const basePrompt = prepared.promptText;
  const verifierRules = (VERIFY.verdicts[caseEntry.id]?.["deciding rules"] ?? []).filter((r) => RULE_ID.test(r));
  const inj = injectDecidingRules(basePrompt, prepared, verifierRules);
  const attachedRuleIds = ji.attachedRuleIdsOf(prepared, inj.addedRuleIds);
  const judgeInputs = ji.buildJudgeInputs({ caseEntry, promptText: inj.promptText, attachedRuleIds, ruleIndex: resources.gameRulesRuleIndex });
  const allRules = [...new Set([...caseEntry.expected.decidingRuleIds, ...verifierRules])];
  const availability = ra.describeDecidingRules({ decidingRuleIds: allRules, prepared: { ...prepared, promptText: inj.promptText }, request, cardRulingsIndex: resources.cardRulingsIndex, extraRuleIds: inj.addedRuleIds });
  return {
    request, prepared, retrieval, verifierRules, allRules, availability, judgeInputs, ...inj,
    basePromptHash: hashPrompt(basePrompt), promptHash: hashPrompt(inj.promptText),
    turn1Text: `${inj.promptText}\n\n${STEP_INSTRUCTION}`
  };
}

function hashCheck(caseId, basePromptHash) {
  const set = readBaseline().hash.get(caseId);
  if (!set) return "pending";
  if (set.size !== 1 || !set.has(basePromptHash)) return "mismatch";
  return "match";
}

// Estimate: two answer turns (turn 2 resends turn 1 + step list), the answer judge, and the step judge (full prompt).
const answerEst = (chars) => evalMod.estimateCallCostUsd({ kind: "answer", model: MODEL, promptChars: chars });
const judgeEst = () => evalMod.estimateCallCostUsd({ kind: "judge", model: judgeModel });
const stepJudgeEst = (chars) => evalMod.estimateCallCostUsd({ kind: "answer", model: judgeModel, promptChars: chars + 6000 });
const estimateFor = (p) => answerEst(p.turn1Text.length) + answerEst(p.turn1Text.length + 3000) + judgeEst() + stepJudgeEst(p.promptText.length);

const prepCache = new Map();
let estTotal = 0;
const status = { match: [], pending: [], mismatch: [] };
let notAll = 0;
for (const c of cases) {
  const p = prepare(c);
  prepCache.set(c.id, p);
  status[hashCheck(c.id, p.basePromptHash)].push(c.id);
  if (!p.availability.allDecidingRulesInPrompt) notAll++;
  estTotal += estimateFor(p) * REPEATS;
}
const spentOf = (file) => (existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).reduce((s, l) => s + (JSON.parse(l).costUsd?.total ?? 0), 0) : 0);
console.log(`Cases ${cases.length} x ${REPEATS} repeats; rubric ${RUBRIC_REVISION}; step rubric ${STEP_RUBRIC_REVISION}; judge ${judgeModel}; model ${MODEL}; effort: none sent (default)`);
console.log(`Embedder ${embedder.mode}; semantic retrieval on every case: yes; combo catalog loaded: yes`);
console.log(`Base prompt hash vs pass records: match ${status.match.length}, not yet in passes ${status.pending.length}, MISMATCH ${status.mismatch.length}`);
console.log(`Every deciding rule in the prompt after injection: ${cases.length - notAll} of ${cases.length} (the rest cite a rule the index lacks or a non-rule source)`);
console.log(`Unknown verifier rule ids: ${[...new Set([...prepCache.values()].flatMap((p) => p.unknown))].join(", ") || "none"}`);
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
  const check = hashCheck(caseEntry.id, p.basePromptHash);
  if (check === "mismatch") { aborted = new Error(`HONESTY: prompt hash mismatch on ${caseEntry.id}`); return; }
  const est = estimateFor(p);
  if (spent + reserved + est * 2 > MAX_USD) { stoppedForCap = true; return; }
  reserved += est;
  const cost = { turn1: 0, turn2: 0, answerJudge: 0, stepJudge: 0 };
  try {
    const t1 = await callModel(MODEL, p.turn1Text);
    if (t1.response.model !== MODEL) throw new Error(`HONESTY: reported model ${t1.response.model}`);
    const u1 = exp.readUsage(t1.response);
    if (u1.reportedEffort !== EXPECTED_EFFORT) throw new Error(`HONESTY: reported effort ${u1.reportedEffort}`);
    cost.turn1 = evalMod.computeCallCostUsd(MODEL, u1.inputTokens, u1.outputTokens) ?? 0;
    const stepText = t1.response.output_text?.trim() ?? "";

    const t2 = await callModel(MODEL, [
      { role: "user", content: p.turn1Text },
      { role: "assistant", content: stepText },
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

    let sj = null;
    let sjIn = 0;
    let sjOut = 0;
    for (let attempt = 0; attempt < 2 && !sj; attempt++) {
      const { response } = await callModel(judgeModel, buildStepJudgePrompt({
        promptText: p.promptText,
        decidingRuleIds: p.allRules,
        referenceAnswer: caseEntry.expected.answer,
        stepText,
        rulingText: answerText
      }));
      const u = exp.readUsage(response);
      sjIn += u.inputTokens ?? 0;
      sjOut += u.outputTokens ?? 0;
      const parsed = parseJson(response.output_text);
      if (validStepJudgement(parsed)) sj = parsed;
    }
    cost.stepJudge = evalMod.computeCallCostUsd(judgeModel, sjIn, sjOut) ?? 0;
    cost.total = cost.turn1 + cost.turn2 + cost.answerJudge + cost.stepJudge;

    const record = {
      caseId: caseEntry.id,
      repeat,
      model: MODEL,
      reportedModel: { turn1: t1.response.model, turn2: t2.response.model },
      reportedEffort: { turn1: u1.reportedEffort ?? null, turn2: u2.reportedEffort ?? null },
      excerptCap: CAP,
      arm: "A+oracle-verifier-rules+sourced-steps",
      embeddingProvider: embedder.mode,
      usedSemantic: p.retrieval.usedSemantic,
      basePromptHash: p.basePromptHash,
      basePromptHashCheckAtRun: check,
      promptHash: p.promptHash,
      promptChars: p.promptText.length,
      addedRuleIds: p.addedRuleIds,
      decidingRulesChecked: p.allRules,
      allDecidingRulesInPrompt: p.availability.allDecidingRulesInPrompt,
      judgeModel,
      rubricRevision: RUBRIC_REVISION,
      stepRubricRevision: STEP_RUBRIC_REVISION,
      stepText,
      stepJudgement: sj,
      answerText,
      undetermined: judged.undetermined,
      scores: judged.undetermined ? null : judged.scores,
      rationale: judged.undetermined ? judged.reason : judged.rationale,
      latencyMs: { turn1: t1.latencyMs, turn2: t2.latencyMs },
      attempts: { turn1: t1.attempts, turn2: t2.attempts },
      tokens: { turn1: u1, turn2: u2, answerJudge: judged.usage, stepJudge: { inputTokens: sjIn, outputTokens: sjOut } },
      costUsd: cost,
      at: new Date().toISOString()
    };
    appendFileSync(RECORDS, `${JSON.stringify(record)}\n`);
    spent += cost.total;
    const kinds = (sj?.misses ?? []).map((m) => m.kind[0]).join("") || "-";
    console.log(`${caseEntry.id} r${repeat}: list ${sj?.listVerdict ?? "?"}, misses ${kinds}, correctness ${judged.undetermined ? "?" : judged.scores.correctness}, hash ${check}, $${spent.toFixed(3)}`);
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
writeFileSync(`${OUT_DIR}/run.json`, JSON.stringify({ spentUsd: spent, maxUsd: MAX_USD, model: MODEL, judgeModel, cap: CAP, effort: "default (none sent)", stepInstruction: STEP_INSTRUCTION, rulingFollowUp: RULING_FOLLOW_UP, stepRubricRevision: STEP_RUBRIC_REVISION, aborted: aborted ? String(aborted.message) : null, stoppedForCap, finishedAt: new Date().toISOString() }, null, 2));
if (aborted) {
  console.error(`ABORTED: ${aborted.stack ?? aborted}`);
  process.exit(1);
}
console.log(`${stoppedForCap ? "Stopped at the cost cap. " : ""}Done. Spent $${spent.toFixed(4)}.`);
