// Combo-context-validation — live answer + LLM-judge leg (COSTS MONEY, gated).
//
// Reads assembled.json (exact production prompts + deterministic retrieval
// diagnosis). For each case: (1) generate the model's answer on the production
// model via the SAME responses.create call the backend uses, feeding the exact
// assembled promptText; (2) grade that answer against the combo's labeled
// steps/producedEffects with a gpt-4.1-mini judge on a 3-axis rubric that also
// tags the missing-context category. Writes results.json.
//
// Refuses to contact the provider without --confirm-live-calls, and aborts if the
// running cost estimate would cross --max-spend (default 5).
//
//   npx tsx run-live.mjs                        # dry: prints plan, no calls
//   npx tsx run-live.mjs --confirm-live-calls   # live

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../../..");
// --suffix routes a separate leg (e.g. "-ablation") to its own input/cache/output.
function argVal(name, d) { const i = process.argv.indexOf(name); return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : d; }
const SUFFIX = argVal("--suffix", "");
const ASSEMBLED = resolve(HERE, `assembled${SUFFIX}.json`);
const OUT = resolve(HERE, `results${SUFFIX}.json`);
const CACHE = resolve(HERE, `.cache${SUFFIX}.json`); // resumable: answers + verdicts keyed by caseId
const JUDGE_MODEL = "gpt-4.1-mini";
// The org's gpt-4.1 TPM limit is 30k/min and each prompt is ~5.5k tokens, so run
// strictly sequential and lean on SDK backoff for the occasional 429.
const CALL_MAX_RETRIES = 8;

function loadCache() { try { return JSON.parse(readFileSync(CACHE, "utf8")); } catch { return {}; } }
function saveCache(c) { writeFileSync(CACHE, JSON.stringify(c, null, 2)); }

const IN_PER_M = 2.0, OUT_PER_M = 8.0;             // gpt-4.1
const JIN_PER_M = 0.4, JOUT_PER_M = 1.6;           // gpt-4.1-mini
const estTokens = (s) => Math.ceil((s?.length ?? 0) / 4);

// --- env: merge apps/backend/.env then .secrets/openai-dev.env (never logged) ---
function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  let text = readFileSync(filePath, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const out = {};
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    let key = t.slice(0, eq).trim().replace(/^export\s+/, "");
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (key) out[key] = val;
  }
  return out;
}
function loadEnv() {
  const merged = { ...process.env };
  for (const [k, v] of Object.entries(parseEnvFile(join(REPO, "apps/backend/.env")))) if (v && !merged[k]) merged[k] = v;
  for (const [k, v] of Object.entries(parseEnvFile(join(REPO, ".secrets/openai-dev.env")))) if (v) merged[k] = v;
  return merged;
}

function parseArgs(argv) {
  const get = (n, d) => { const i = argv.indexOf(n); return i !== -1 && i + 1 < argv.length ? argv[i + 1] : d; };
  return { confirmed: argv.includes("--confirm-live-calls"), maxSpend: Number(get("--max-spend", "5")) };
}

const JSON_TAIL = 'If not CORRECT, pick the single most likely missingContext cause: rules_gap, ruling_gap, reasoning_failure, card_text_misread, other.\nRespond with ONLY a JSON object: {"identified":bool,"payoff":bool,"mechanism":bool,"verdict":"CORRECT|PARTIAL|WRONG|INCOMPLETE","missingContext":"...","rationale":"one sentence"}';

function judgePrompt(c, answer) {
  const gt = c.groundTruth || {};
  const scenario = c.scenario || "complete";
  const head = "You are grading a Magic: The Gathering rules assistant's answer. CARDS: " + c.cardNames.join(", ");

  if (scenario === "unrelated") {
    return [
      head,
      "These cards were pulled from DIFFERENT combos. They each appear in combos individually, but the ATTACHED SET is not expected to form a working combo TOGETHER.",
      "The prompt's combo context may list partial combos each card belongs to — that is expected background, not proof these cards combo with each other.",
      "The user asked how they combo. Correct behavior: recognize the attached cards do NOT form a working combo together. Mentioning each card's own separate combos, or incidental synergy, is fine.",
      "", "ASSISTANT ANSWER:", answer, "",
      "verdict: CORRECT (does not assert the attached set forms a working/infinite combo together), WRONG (asserts these specific attached cards combo together into a working/infinite result), PARTIAL (hedges confusingly).",
      "Set identified/payoff/mechanism all false unless it wrongly claims the attached set combos together.",
      JSON_TAIL
    ].join("\n");
  }
  if (scenario === "partial") {
    return [
      head,
      "This is a PARTIAL combo: one required card was intentionally removed. The removed card's role: \"" + (c.droppedCard || "?") + "\".",
      "GROUND TRUTH — the full combo's result: " + (gt.producedEffects || []).join("; "),
      "GROUND TRUTH — the full combo's steps: " + (gt.steps || ""),
      "", "ASSISTANT ANSWER:", answer, "",
      "Correct behavior: recognize the attached cards are close to a combo but INCOMPLETE, and identify what kind of missing piece is needed (matching the removed card's role).",
      "  identified: did it recognize a near-combo / that something is missing?",
      "  payoff: did it describe the intended payoff the full combo would reach?",
      "  mechanism: did it correctly characterize the MISSING piece's role (matching the removed card)?",
      "verdict: CORRECT (flagged incomplete AND named the missing role), PARTIAL (flagged incomplete but vague on the missing role), WRONG (claimed a complete working combo, or hallucinated), INCOMPLETE (too vague).",
      JSON_TAIL
    ].join("\n");
  }
  // complete / large / template
  const tmpl = (c.templateNames && c.templateNames.length) ? "\nThis combo ALSO requires a generic piece (not attached): " + c.templateNames.join(", ") + ". A fully correct answer notes that this additional piece is needed." : "";
  return [
    head + tmpl,
    "Compare the ASSISTANT ANSWER to the LABELED GROUND TRUTH (Commander Spellbook).",
    "GROUND TRUTH — result (producedEffects): " + (gt.producedEffects || []).join("; "),
    "GROUND TRUTH — steps: " + (gt.steps || ""),
    gt.notablePrerequisites ? "GROUND TRUTH — prerequisites: " + gt.notablePrerequisites : "",
    "", "ASSISTANT ANSWER:", answer, "",
    "Grade three axes true/false: identified (recognized these form a combo/loop), payoff (correct end result matching producedEffects), mechanism (loop/steps mechanically right matching steps).",
    "verdict: CORRECT (all three), PARTIAL (identified+payoff but mechanism wrong/vague or a missing step), WRONG (misidentified or wrong payoff), INCOMPLETE (declined/too vague).",
    JSON_TAIL
  ].filter(Boolean).join("\n");
}

function parseJudge(text) {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : { verdict: "PARSE_ERROR", raw: text.slice(0, 200) };
  } catch {
    return { verdict: "PARSE_ERROR", raw: text.slice(0, 200) };
  }
}

async function main() {
  const { confirmed, maxSpend } = parseArgs(process.argv.slice(2));
  const { cases } = JSON.parse(readFileSync(ASSEMBLED, "utf8"));
  const env = loadEnv();
  const model = (env.OPENAI_MODEL || "").trim();
  const apiKey = (env.OPENAI_API_KEY || "").trim();

  const estInput = cases.reduce((s, c) => s + c.estInputTokens, 0);
  const estCost = (estInput / 1e6) * IN_PER_M + (cases.length * 700 / 1e6) * OUT_PER_M
    + (cases.length * 2000 / 1e6) * JIN_PER_M + (cases.length * 300 / 1e6) * JOUT_PER_M;

  const cache = loadCache();
  const doneAnswers = cases.filter((c) => cache[c.caseId]?.answer).length;
  const doneVerdicts = cases.filter((c) => cache[c.caseId]?.verdict).length;

  console.log(`Plan: ${cases.length} cases -> answer (${model}) + judge (${JUDGE_MODEL}), sequential.`);
  console.log(`Cached so far: ${doneAnswers} answers, ${doneVerdicts} verdicts (these are skipped, free).`);
  console.log(`Rough cost estimate (full): $${(estCost * 1.2).toFixed(4)} (padded). Ceiling: $${maxSpend}.`);
  if (!confirmed) { console.log("\nDry run. Re-run with --confirm-live-calls to make live calls."); return; }
  if (!model || !apiKey) { console.error("Missing OPENAI_MODEL or OPENAI_API_KEY after env merge."); process.exit(1); }
  if (estCost * 1.2 > maxSpend) { console.error(`Estimate exceeds ceiling; aborting.`); process.exit(1); }

  const client = new OpenAI({ apiKey, timeout: Number(env.OPENAI_TIMEOUT_MS || 90000), maxRetries: CALL_MAX_RETRIES });
  let spent = 0;

  // --- Answer phase (sequential, cached) ---
  console.log("\nGenerating answers...");
  for (const c of cases) {
    if (cache[c.caseId]?.answer) { console.log(`  ${c.caseId} cached, skip`); continue; }
    try {
      const resp = await client.responses.create({ model, input: c.promptText });
      const answer = (resp.output_text || "").trim();
      spent += (c.estInputTokens / 1e6) * IN_PER_M + (estTokens(answer) / 1e6) * OUT_PER_M;
      cache[c.caseId] = { ...(cache[c.caseId] || {}), answer };
      saveCache(cache);
      console.log(`  ${c.caseId} answered (${answer.length} chars)`);
    } catch (e) {
      console.error(`  ${c.caseId} answer FAILED: ${e.message?.slice(0, 120)}`);
      cache[c.caseId] = { ...(cache[c.caseId] || {}), answerError: e.message?.slice(0, 200) };
      saveCache(cache);
    }
  }

  // --- Judge phase (sequential, cached) ---
  console.log("\nGrading answers...");
  for (const c of cases) {
    if (!cache[c.caseId]?.answer) { console.log(`  ${c.caseId} no answer, skip`); continue; }
    if (cache[c.caseId]?.verdict) { console.log(`  ${c.caseId} verdict cached, skip`); continue; }
    const p = judgePrompt(c, cache[c.caseId].answer);
    try {
      const jresp = await client.responses.create({ model: JUDGE_MODEL, input: p });
      const jtext = (jresp.output_text || "").trim();
      spent += (estTokens(p) / 1e6) * JIN_PER_M + (estTokens(jtext) / 1e6) * JOUT_PER_M;
      const verdict = parseJudge(jtext);
      cache[c.caseId].verdict = verdict;
      saveCache(cache);
      console.log(`  ${c.caseId} graded: ${verdict.verdict}`);
    } catch (e) {
      console.error(`  ${c.caseId} judge FAILED: ${e.message?.slice(0, 120)}`);
    }
  }

  // --- Assemble results.json from cache + assembled diagnosis ---
  const graded = cases.map((c) => ({
    caseId: c.caseId, variantId: c.variantId, band: c.band, popularity: c.popularity, cardNames: c.cardNames,
    groundTruth: c.groundTruth, diagnosis: c.diagnosis,
    answer: cache[c.caseId]?.answer ?? null, verdict: cache[c.caseId]?.verdict ?? { verdict: "NO_ANSWER" }
  }));
  await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), model, judgeModel: JUDGE_MODEL, estimatedSpendThisRun: spent, cases: graded }, null, 2));

  const tally = graded.reduce((m, g) => { m[g.verdict.verdict] = (m[g.verdict.verdict] || 0) + 1; return m; }, {});
  console.log(`\n=== VERDICT TALLY ===`);
  for (const [k, v] of Object.entries(tally)) console.log(`  ${k}: ${v}`);
  console.log(`\nEstimated spend THIS run: $${spent.toFixed(4)}`);
  console.log(`Wrote ${graded.length} results to ${OUT}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
