// Free, local probe (no API calls): "search on the steps, not the question". Re-uses Luna's step lists already
// recorded by the hard-25 breakdown run (25 questions × 4) and runs production rule search (hybrid blend,
// local embedder) on them instead of on the question. Measures whether the deciding rules reach the 10 slots.
// Prints aggregate counts only — no question ids, text, step text or answers.
// Usage (from .worktrees/probe-pft): npx tsx <this file>
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/rulesguru`;
const CAP = 10;

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const ws = await imp("scripts/eval-worked-solutions.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const sg = await imp("scripts/lib/rulesguru-suite.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { buildLookupPromptContext, buildPromptContext } = await imp("apps/backend/src/prompt/context.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const R = await imp("apps/backend/src/gameRulesRetrieval.ts");

sg.assertSuiteIgnored({ suiteDir: SUITE });
const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");
const resources = await fid.loadPromptResources({ env });
const vocab = R.loadGameRulesKeywordVocabulary(join(REPO, "apps/backend/data/gameRulesKeywordVocabulary.json"));
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);

const { selected } = await ws.loadSuiteSelection({ suiteDir: SUITE });
const byId = new Map(selected.map((c) => [c.id, c]));
const records = readFileSync(`${SUITE}/runs/probe-breakdown-hard25/records.jsonl`, "utf8").trim().split("\n").map((l) => JSON.parse(l));

const cardSignalFor = (request) => {
  const cards = request.mode === "lookup"
    ? buildLookupPromptContext(request, resources.cardDetailIndex).cards ?? []
    : (() => { const ctx = buildPromptContext(request, resources.cardDetailIndex); return [...ctx.orderedStack, ...ctx.populatedZones.flatMap((z) => z.items)]; })();
  return cards.map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ");
};

async function search(questionText, oracleText, exclude, cap) {
  const q = R.buildQueryTokensFromParts({ questionText, oracleText }, vocab);
  const vector = await embedder.embed(`${questionText} ${oracleText}`.trim());
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: "step" });
  const res = R.retrieveRulesForQueryWithDebug(q.tokens, q.queryRuleIds, resources.gameRulesRuleIndex, exclude, cap, undefined, vector, q.queryText, q.questionRuleIds);
  if (!res.debug.usedSemantic) throw new Error("semantic retrieval did not run");
  return res.selected.map((r) => r.ruleId);
}
// Step lines: numbered or bulleted lines of the list; fall back to non-empty lines.
const splitSteps = (text) => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const steps = lines.filter((l) => /^(\d+[.)]|[-*•])\s+/.test(l));
  return (steps.length ? steps : lines).map((l) => l.replace(/^(\d+[.)]|[-*•])\s+/, ""));
};
// Round-robin merge of several ranked lists into `cap` distinct ids.
const roundRobin = (lists, cap) => {
  const out = [];
  for (let i = 0; out.length < cap && lists.some((l) => i < l.length); i++)
    for (const l of lists) if (i < l.length && !out.includes(l[i]) && out.length < cap) out.push(l[i]);
  return out;
};

const ARMS = ["production (question)", "steps only", "question + steps", "per-step, merged to 10", "question 5 + per-step 5", "production 10 + per-step 10 (20 slots)"];
const agg = Object.fromEntries(ARMS.map((a) => [a, { found: 0, all: 0, total: 0 }]));
const caseAll = Object.fromEntries(ARMS.map((a) => [a, new Map()]));
let stepCountSum = 0, citedByNumber = 0, citedTotal = 0;
const correctByFound = { stepsFoundAll: [0, 0], notAll: [0, 0] };

for (const rec of records) {
  const c = byId.get(rec.caseId);
  if (!c) throw new Error("case missing from suite selection");
  const request = askAiRequestSchema.parse(fid.buildCaseRequest(c));
  const vector = await embedder.embed(buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex }));
  const prod = preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true, supplementalRuleCap: CAP });
  const prodTop = prod.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
  if (prodTop.join() !== rec.selectedRuleIds.join()) throw new Error("production top 10 differs from the recorded run");
  const curated = new Set((prod.enrichmentDebug.curatedGameRules.topics ?? []).flatMap((t) => t.ruleNumbers ?? []));
  const cardSignal = cardSignalFor(request);
  const steps = splitSteps(rec.breakdownText);
  stepCountSum += steps.length;
  const deciding = [...new Set(c.expected.decidingRuleIds ?? [])];
  for (const id of deciding) { citedTotal++; if (new RegExp(`\\b${id.replace(".", "\\.")}\\b`).test(rec.breakdownText)) citedByNumber++; }

  const perStep = [];
  for (const s of steps) perStep.push(await search(s, cardSignal, curated, CAP));
  const tops = {
    "production (question)": prodTop,
    "steps only": await search(rec.breakdownText, cardSignal, curated, CAP),
    "question + steps": await search(`${request.question} ${rec.breakdownText}`, cardSignal, curated, CAP),
    "per-step, merged to 10": roundRobin(perStep, CAP),
    "question 5 + per-step 5": [...new Set([...prodTop.slice(0, 5), ...roundRobin(perStep, CAP)])].slice(0, CAP),
    "production 10 + per-step 10 (20 slots)": [...new Set([...prodTop, ...roundRobin(perStep, CAP)])]
  };
  for (const arm of ARMS) {
    const top = new Set(tops[arm]);
    let all = true;
    for (const id of deciding) { agg[arm].total++; if (curated.has(id) || top.has(id)) agg[arm].found++; else all = false; }
    if (all) agg[arm].all++;
    caseAll[arm].set(rec.caseId, (caseAll[arm].get(rec.caseId) ?? 0) + (all ? 1 : 0));
  }
  // Does a step search that finds every deciding rule line up with the breakdown's own right/wrong?
  const stepAll = deciding.every((id) => curated.has(id) || new Set(tops["per-step, merged to 10"]).has(id));
  const right = rec.scores?.correctness === 2 ? 1 : 0;
  correctByFound[stepAll ? "stepsFoundAll" : "notAll"][0] += right;
  correctByFound[stepAll ? "stepsFoundAll" : "notAll"][1]++;
}

console.log(`Records ${records.length} (25 questions × 4 step lists). Mean steps per list ${(stepCountSum / records.length).toFixed(1)}.`);
console.log(`Deciding rules named by number in the step list itself: ${citedByNumber} of ${citedTotal}.`);
console.log(`\nArm — deciding-rule citations in prompt (of ${agg[ARMS[0]].total}) / step lists with every deciding rule / questions where any of the 4 lists gets every rule`);
for (const arm of ARMS) {
  const anyQ = [...caseAll[arm].values()].filter((n) => n > 0).length;
  console.log(`  ${arm.padEnd(40)} ${agg[arm].found} / ${agg[arm].all} of ${records.length} / ${anyQ} of 25`);
}
console.log(`\nBreakdown-run correctness by whether per-step search finds every rule: all found ${correctByFound.stepsFoundAll[0]}/${correctByFound.stepsFoundAll[1]} right, not all ${correctByFound.notAll[0]}/${correctByFound.notAll[1]} right`);
