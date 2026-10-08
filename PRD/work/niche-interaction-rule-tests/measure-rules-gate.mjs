// Define-node measurement for niche-interaction-rule-tests (graph-20261006-150550,
// attempt 6, 2026-10-07): REQ-220's topic measured on the rules test harness.
//
// The offline rules gate (REQ-222, apps/backend/src/eval/rules-gate/rulesGate.ts)
// counts a deciding rule as a hit only when it is among the System 3 excerpts
// (`enrichmentDebug.supplemental.selected`), ranked from the committed frozen query
// vectors at the production cap of ten. This script answers, by measurement:
//
//   G1  the committed gate passes and reproduces baseline.json case by case
//   G2  a reimplementation of System 3 with the same frozen vectors matches
//       production for every scored case (selections and curated topic ids), so the
//       candidate below changes only the topic set
//   G3  REQ-220's topic (C8: CR 614.1a, 616.1, 616.1a-g, 616.2 — or C7, the same
//       without 614.1a, with TOPIC_RULES=nine — when two or more cards say
//       "instead"/"prevent") over the whole corpus: which cases it fires on, which
//       recorded hits it would lose (a ratchet failure), which rules become hits
//   G4  the two tester cases: every deciding rule's rank, base and with the topic,
//       hybrid (frozen vector) and lexical; and the tester's verbatim questions
//       beside the corpus wording, to reconcile the Necropotence numbers
//   G5  production code with the topic patched in (the topic built in memory from
//       the committed rule index by the build script's own transformGameRules; the
//       lookup always-on list extended for this one case only): the Manufactor case's
//       prompt carries 616.1, 616.1e and 616.1f, and what the real gate records
//   G6  what counting curated-topic rules as "in the prompt" would change in the
//       baseline (the option of amending REQ-222's ratchet)
//
// Offline: committed data, frozen vectors, the local MiniLM embedder in process
// (for the verbatim tester questions only); no network, no model call.
//   npx tsx PRD/work/niche-interaction-rule-tests/measure-rules-gate.mjs
import { buildEmbedder, buildCaseRequest, loadPromptResources } from "../../../scripts/lib/prompt-fidelity.mjs";
import { loadGoldCases } from "../../../scripts/lib/gold-cases.mjs";
import { transformGameRules } from "../../../scripts/build-game-rules.mjs";
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const prep = await import("../../../apps/backend/src/prompt/preparation.ts");
const gr = await import("../../../apps/backend/src/gameRulesRetrieval.ts");
const { ALWAYS_ON_TOPIC_IDS, selectGameRulesTopics } = await import("../../../apps/backend/src/gameRulesTopicSelection.ts");
const { buildLookupPromptContext, buildPromptContext } = await import("../../../apps/backend/src/prompt/context.ts");
const { evaluateRulesGate } = await import("../../../apps/backend/src/eval/rules-gate/rulesGate.ts");
const { loadBaseline } = await import("../../../apps/backend/src/eval/rules-gate/baseline.ts");
const { loadFrozenVectors, checkReFreeze } = await import("../../../apps/backend/src/eval/rules-gate/frozenVectors.ts");
const { askAiRequestSchema } = await import("../../../apps/backend/src/validation/askAiRequest.ts");

const resources = await loadPromptResources();
const index = resources.gameRulesRuleIndex;
const ruleText = new Map(index.map((r) => [r.ruleId, r.text]));
const cases = await loadGoldCases();
const vectors = loadFrozenVectors();
const baseline = loadBaseline();
const live = cases.filter((c) => c.review.status !== "rejected");

const REPLACEMENT = /\binstead\b/i;
const PREVENTION = /\bprevent(s|ed)?\b/i;
const markedCard = (c) => REPLACEMENT.test(c.oracleText ?? "") || PREVENTION.test(c.oracleText ?? "");
const T_FULL = ["616.1", "616.1a", "616.1b", "616.1c", "616.1d", "616.1e", "616.1f", "616.1g", "616.2"];
// The topic's rule list: `ten` (default, the define attempt 6 proposal, C8) adds 614.1a,
// which the approved tester case names as a deciding rule; `nine` is attempt 5's C7.
//   TOPIC_RULES=nine npx tsx PRD/work/niche-interaction-rule-tests/measure-rules-gate.mjs
const T_TOPIC = process.env.TOPIC_RULES === "nine" ? T_FULL : ["614.1a", ...T_FULL];
const TOPIC_ID = "replacement-effects-interaction";
const topicFor = (cards) => (cards.filter(markedCard).length >= 2 ? [{ id: TOPIC_ID, ruleNumbers: T_TOPIC }] : []);
console.log(`Topic rule list: ${T_TOPIC.length} rules (${T_TOPIC.join(", ")})`);
const compact = (c) => gr.buildCompactCardSignal(c.name, c.typeLine, c.keywords);

// Same context split production uses (see measure-candidates.mjs `contextCards`).
function contextCards(request) {
  if (request.mode === "lookup") {
    const context = buildLookupPromptContext(request, resources.cardDetailIndex);
    return { questionText: request.question, cards: context.cards ?? [], topics: resources.gameRulesTopics.filter((t) => ALWAYS_ON_TOPIC_IDS.includes(t.id)) };
  }
  const context = buildPromptContext(request, resources.cardDetailIndex);
  const cards = [...context.orderedStack, ...context.populatedZones.flatMap((z) => z.items)];
  return { questionText: context.finalQuestion, cards, topics: selectGameRulesTopics(context, resources.gameRulesTopics) };
}

function system3(request, { vector, extraTopics = false, cap = 10 }) {
  const { questionText, cards, topics } = contextCards(request);
  const added = extraTopics ? topicFor(cards) : [];
  const curated = gr.collectCuratedRuleIds([...topics, ...added]);
  const query = gr.buildQueryTokensFromParts({ questionText, oracleText: cards.map(compact).join(" ") });
  const run = (max) => gr.retrieveRulesForQueryWithDebug(query.tokens, query.queryRuleIds, index, curated, max, undefined, vector, query.queryText, query.questionRuleIds);
  const top = run(cap);
  if (vector && !top.debug.usedSemantic) throw new Error("expected a semantic pass");
  return {
    ids: top.selected.map((r) => r.ruleId),
    deep: run(400).selected.map((r) => r.ruleId),
    curated,
    topicIds: [...topics, ...added].map((t) => t.id),
    fired: added.length > 0,
    marked: cards.filter(markedCard).length
  };
}
const where = (r, id) => {
  const i = r.ids.indexOf(id);
  if (i >= 0) return `S3#${i + 1}`;
  if (r.curated.has(id)) return "curated";
  const d = r.deep.indexOf(id);
  return d >= 0 ? `miss(#${d + 1})` : "miss(>400)";
};

// ---------------------------------------------------------------- G1 committed gate
const outcome = evaluateRulesGate({ cases, resources, vectors, baseline, buildRequest: buildCaseRequest });
console.log(`G1 ${outcome.report.split("\n").pop()}; ok=${outcome.ok}`);
let baselineMismatch = 0;
for (const r of outcome.results) {
  if (r.hit === null) continue;
  const b = baseline.cases[r.id];
  if (!b || JSON.stringify(b.hit) !== JSON.stringify(r.hit) || JSON.stringify(b.miss) !== JSON.stringify(r.miss)) baselineMismatch++;
}
console.log(`G1 scored cases whose hit/miss differs from baseline.json: ${baselineMismatch}`);

// ---------------------------------------------------------------- G2 parity
const scored = [];
for (const c of live) {
  const request = askAiRequestSchema.parse(buildCaseRequest(c));
  const freeze = checkReFreeze(c.id, request, resources.cardDetailIndex, vectors);
  if (freeze.state !== "fresh") continue;
  const prod = prep.preparePromptInput(request, { ...resources, queryEmbedding: freeze.vector, collectEnrichmentDebug: true });
  const prodIds = prod.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
  const prodTopics = prod.enrichmentDebug.curatedGameRules.topicIds;
  const mine = system3(request, { vector: freeze.vector });
  if (JSON.stringify(prodIds) !== JSON.stringify(mine.ids)) throw new Error(`parity failure (System 3) ${c.id}`);
  if (JSON.stringify(prodTopics) !== JSON.stringify(mine.topicIds)) throw new Error(`parity failure (topics) ${c.id}`);
  scored.push({ c, request, vector: freeze.vector, base: mine, prompt: prod.promptText });
}
console.log(`G2 parity: System 3 selections and curated topic ids match production for all ${scored.length} scored cases (${scored.filter((s) => s.request.mode === "game").length} In-Depth)`);

// ---------------------------------------------------------------- G3 the topic over the corpus
const fired = [];
let regressions = 0;
const newHits = [];
for (const s of scored) {
  const withTopic = system3(s.request, { vector: s.vector, extraTopics: true });
  if (!withTopic.fired) {
    if (JSON.stringify(withTopic.ids) !== JSON.stringify(s.base.ids)) throw new Error(`selection moved without the topic firing: ${s.c.id}`);
    continue;
  }
  const deciding = s.c.expected.decidingRuleIds;
  const recorded = new Set(baseline.cases[s.c.id]?.hit ?? []);
  const lost = [...recorded].filter((id) => !withTopic.ids.includes(id));
  const gained = deciding.filter((id) => withTopic.ids.includes(id) && !recorded.has(id));
  regressions += lost.length;
  if (gained.length) newHits.push(`${s.c.id} [${gained.join(", ")}]`);
  const moved = JSON.stringify(withTopic.ids) !== JSON.stringify(s.base.ids);
  fired.push(`${s.c.id} (${s.request.mode}, ${withTopic.marked} marked cards; System 3 picks ${moved ? "change" : "unchanged"}; deciding ${deciding.map((id) => `${id}=${where(withTopic, id)}`).join(" ")}; lost ${lost.join(",") || "none"})`);
}
console.log(`G3 the topic fires on ${fired.length} of ${scored.length} scored cases:`);
for (const line of fired) console.log(`   ${line}`);
console.log(`G3 recorded hits the topic would lose (ratchet failures): ${regressions}`);
{
  // Cases with every deciding rule among the System 3 picks (the gate's and eval:worked-solutions' count), and
  // cases with every deciding rule reaching the prompt by either route, before and with the topic.
  const count = (pick) => scored.filter((s) => s.c.expected.decidingRuleIds.every((id) => pick(s, id))).length;
  const after = new Map(scored.map((s) => [s.c.id, system3(s.request, { vector: s.vector, extraTopics: true })]));
  const s3Before = count((s, id) => s.base.ids.includes(id));
  const s3After = count((s, id) => after.get(s.c.id).ids.includes(id));
  const reachBefore = count((s, id) => s.base.ids.includes(id) || s.base.curated.has(id));
  const reachAfter = count((s, id) => after.get(s.c.id).ids.includes(id) || after.get(s.c.id).curated.has(id));
  console.log(`G3 cases with every deciding rule a System 3 pick: ${s3Before} -> ${s3After} of ${scored.length}; with every deciding rule in the prompt by either route: ${reachBefore} -> ${reachAfter}`);
}
console.log(`G3 new System 3 hits the topic would add: ${newHits.join("; ") || "none"}`);

// ---------------------------------------------------------------- G4 the tester cases
const embedder = await buildEmbedder(process.env);
if (embedder.mode !== "local") throw new Error("run with the local embedder (default)");
const CARD = {
  manufactor: { cardId: "f36d1d8b-8303-44a9-ab56-531931641ea2", name: "Academy Manufactor" },
  esix: { cardId: "9d22960b-babc-4cf3-b228-d32e13bc6014", name: "Esix, Fractal Bloom" },
  silence: { cardId: "8aed54cb-d1bb-45ad-adbe-38e55d84ff31", name: "Silence" },
  necro: { cardId: "94a844d2-0574-45a7-b347-e0e329767c42", name: "Necropotence" },
  borne: { cardId: "ce19962d-94f9-4b2b-b668-963c0acce308", name: "Borne Upon a Wind" }
};
const VERBATIM_Q1 = "How do academy manufactor and esix, fractal bloom interact when I'm attempting to create a treasure token?";
const VERBATIM_Q2 = "Can I use the triggered ability of necropotence during my cleanup step to dodge silence effects and cast borne upon a wind?";
const byId = new Map(cases.map((c) => [c.id, c]));
const manuCase = byId.get("academy-manufactor-esix-treasure");
const necroCase = byId.get("necropotence-silence-borne-upon-a-wind-cleanup");
const variants = [
  { label: "Q1 corpus case (frozen vector)", caseEntry: manuCase },
  { label: "Q1 verbatim tester question, cards Manufactor+Esix", request: { mode: "lookup", question: VERBATIM_Q1, cards: [CARD.manufactor, CARD.esix] }, deciding: manuCase.expected.decidingRuleIds },
  { label: "Q2 corpus case (frozen vector)", caseEntry: necroCase },
  { label: "Q2 corpus question, live local embedding", request: buildCaseRequest(necroCase), deciding: necroCase.expected.decidingRuleIds },
  { label: "Q2 verbatim tester question, cards Silence+Necro+Borne (define's order)", request: { mode: "lookup", question: VERBATIM_Q2, cards: [CARD.silence, CARD.necro, CARD.borne] }, deciding: necroCase.expected.decidingRuleIds },
  { label: "Q2 verbatim tester question, cards Necro+Borne+Silence (corpus order)", request: { mode: "lookup", question: VERBATIM_Q2, cards: [CARD.necro, CARD.borne, CARD.silence] }, deciding: necroCase.expected.decidingRuleIds },
  { label: "Q2 corpus question, cards Silence+Necro+Borne (define's order)", request: { mode: "lookup", question: necroCase.question, cards: [CARD.silence, CARD.necro, CARD.borne] }, deciding: necroCase.expected.decidingRuleIds }
];
for (const v of variants) {
  const request = askAiRequestSchema.parse(v.request ?? buildCaseRequest(v.caseEntry));
  const deciding = v.deciding ?? v.caseEntry.expected.decidingRuleIds;
  const queryText = prep.buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex });
  let vector;
  if (v.caseEntry) {
    const freeze = checkReFreeze(v.caseEntry.id, request, resources.cardDetailIndex, vectors);
    if (freeze.state !== "fresh") throw new Error(`${v.caseEntry.id} not fresh`);
    vector = freeze.vector;
  } else {
    vector = await embedder.embed(queryText);
  }
  const lines = [];
  for (const [mode, vec] of [["hybrid", vector], ["lexical", null]]) {
    for (const extraTopics of [false, true]) {
      const r = system3(request, { vector: vec, extraTopics });
      lines.push(`${mode}${extraTopics ? "+topic" : ""}: ${deciding.map((id) => `${id}=${where(r, id)}`).join(" ")}`);
    }
  }
  console.log(`G4 ${v.label}\n   query text: ${JSON.stringify(queryText)}\n   ${lines.join("\n   ")}`);
}
{
  // Is the committed frozen vector the local embedding of today's query text?
  const request = askAiRequestSchema.parse(buildCaseRequest(necroCase));
  const frozenVec = checkReFreeze(necroCase.id, request, resources.cardDetailIndex, vectors).vector;
  const liveVec = await embedder.embed(prep.buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex }));
  const maxDiff = Math.max(...frozenVec.map((x, i) => Math.abs(x - liveVec[i])));
  console.log(`G4 Necropotence frozen vector vs live local embedding of the same query text: max abs difference ${maxDiff.toExponential(2)}`);
}
console.log(`G4 rules in the topic: ${T_TOPIC.join(", ")}; Manufactor deciding rules outside it: ${manuCase.expected.decidingRuleIds.filter((id) => !T_TOPIC.includes(id)).join(", ") || "none"}`);

// ---------------------------------------------------------------- G5 production with the topic patched in
const crText = index.map((entry) => entry.text).join("\n");
const manifest = JSON.parse(readFileSync(join(repoRoot, "apps/backend/data/gameRulesTopicManifest.json"), "utf8"));
const patchedManifest = [...manifest];
patchedManifest.splice(patchedManifest.findIndex((t) => t.id === "replacement-effects-basics") + 1, 0, { id: TOPIC_ID, title: "Interaction of Replacement and Prevention Effects", ruleNumbers: T_TOPIC });
const { topics: builtTopics } = transformGameRules({ crText, manifest: patchedManifest, previousTopics: resources.gameRulesTopics });
const topic = builtTopics.find((t) => t.id === TOPIC_ID);
const patchedTopics = builtTopics.filter((t) => t.id === TOPIC_ID || resources.gameRulesTopics.some((u) => u.id === t.id));
console.log(`G5 topic built in memory: ${topic.ruleNumbers.length} rules, ${topic.excerpt.length} excerpt chars; total topic text ${builtTopics.reduce((s, t) => s + t.excerpt.length, 0)} over ${builtTopics.length} topics`);
const collapse = (s) => s.replace(/\s+/g, " ").trim();
{
  const request = askAiRequestSchema.parse(buildCaseRequest(manuCase));
  const vector = checkReFreeze(manuCase.id, request, resources.cardDetailIndex, vectors).vector;
  const before = prep.preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true });
  ALWAYS_ON_TOPIC_IDS.push(TOPIC_ID); // this one case fires (two marked cards); restored below
  try {
    const patchedResources = { ...resources, gameRulesTopics: patchedTopics };
    const after = prep.preparePromptInput(request, { ...patchedResources, queryEmbedding: vector, collectEnrichmentDebug: true });
    const prompt = collapse(after.promptText);
    const carried = T_TOPIC.filter((id) => prompt.includes(collapse(ruleText.get(id))));
    const s3 = after.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
    const sim = system3(request, { vector, extraTopics: true }).ids;
    if (JSON.stringify(s3) !== JSON.stringify(sim)) throw new Error("patched production System 3 differs from the topic simulation");
    console.log(`G5 Manufactor case, patched production: prompt ${before.promptText.length} -> ${after.promptText.length} chars (+${after.promptText.length - before.promptText.length}); topic rules whose full text is in the prompt: ${carried.length}/${T_TOPIC.length}; System 3 picks match the topic simulation`);
    console.log(`G5 deciding rules: ${manuCase.expected.decidingRuleIds.map((id) => `${id} ${s3.includes(id) ? "System 3" : prompt.includes(collapse(ruleText.get(id))) ? "in prompt via the topic (not System 3)" : "absent"}`).join("; ")}`);
    const gate = evaluateRulesGate({ cases: [manuCase], resources: patchedResources, vectors, baseline, buildRequest: buildCaseRequest });
    const r = gate.results[0];
    console.log(`G5 real rules gate on the patched prompt: hit [${r.hit.join(", ")}] miss [${r.miss.join(", ")}] regressions ${r.regressions.length} failures ${r.failures.length}; ok=${gate.ok}`);
    // Every case the topic fires on is a lookup with two marked cards, so the patched
    // always-on list is exactly REQ-220's selection for each of them.
    const firedCases = fired.map((line) => byId.get(line.split(" ")[0]));
    if (firedCases.some((c) => c.gameState !== null)) throw new Error("a fired case is In-Depth; the lookup patch does not model it");
    const firedGate = evaluateRulesGate({ cases: firedCases, resources: patchedResources, vectors, baseline, buildRequest: buildCaseRequest });
    console.log(`G5 real rules gate (REQ-222 as written) on the ${firedCases.length} cases the topic fires on, patched: ok=${firedGate.ok}; ${firedGate.report.split("\n").filter((line) => line.startsWith("FAIL")).join(" | ") || "no FAIL lines"}`);
  } finally {
    ALWAYS_ON_TOPIC_IDS.pop();
  }
}

// ---------------------------------------------------------------- G6 counting curated rules as reached
let changedCases = 0;
const changed = [];
for (const s of scored) {
  const deciding = s.c.expected.decidingRuleIds;
  const s3Hits = deciding.filter((id) => s.base.ids.includes(id));
  const curatedHits = deciding.filter((id) => !s.base.ids.includes(id) && s.base.curated.has(id));
  for (const id of curatedHits) {
    if (!collapse(s.prompt).includes(collapse(ruleText.get(id)))) throw new Error(`${s.c.id}: ${id} is listed by a selected topic but its text is not in the prompt`);
  }
  if (curatedHits.length) {
    changedCases++;
    changed.push(`${s.c.id} [${curatedHits.join(", ")}]`);
  }
  void s3Hits;
}
console.log(`G6 today, scored cases with a deciding rule listed by a selected curated topic (its full text checked in the production prompt) but not a System 3 pick: ${changedCases} — ${changed.join("; ")}`);

// ---------------------------------------------------------------- G7 a ratchet that also counts topic-carried rules
// Proposed REQ-222 amendment: hit/miss stay System 3 picks (REQ-229's parity is
// unchanged); a third list records deciding rules carried by a selected curated
// topic; a rule counts as lost only when it is neither a System 3 pick nor carried
// by a selected topic. Simulated with REQ-220's topic over the whole corpus.
let lostUnderAmendment = 0;
let inTopicToday = 0;
let inTopicAfter = 0;
const inTopicAfterCases = [];
for (const s of scored) {
  const deciding = s.c.expected.decidingRuleIds;
  const recorded = new Set(baseline.cases[s.c.id]?.hit ?? []);
  const after = system3(s.request, { vector: s.vector, extraTopics: true });
  const reached = (r, id) => r.ids.includes(id) || r.curated.has(id);
  lostUnderAmendment += [...recorded].filter((id) => !reached(after, id)).length;
  if (deciding.some((id) => !s.base.ids.includes(id) && s.base.curated.has(id))) inTopicToday++;
  const carried = deciding.filter((id) => !after.ids.includes(id) && after.curated.has(id));
  if (carried.length) {
    inTopicAfter++;
    if (after.fired) inTopicAfterCases.push(`${s.c.id} [${carried.join(", ")}]`);
  }
}
console.log(`G7 with REQ-220's topic and the amended ratchet: recorded hits lost ${lostUnderAmendment}; cases with a topic-carried deciding rule ${inTopicToday} today -> ${inTopicAfter} after; added by the new topic: ${inTopicAfterCases.join("; ")}`);

// ---------------------------------------------------------------- G8 prompt sizes the brief cites
// Production preparePromptInput on the tester's verbatim questions, cards attached,
// hybrid (live local embedding) and lexical; Q1 also with REQ-220's topic patched in.
for (const [label, request] of [
  ["Q1 verbatim", { mode: "lookup", question: VERBATIM_Q1, cards: [CARD.manufactor, CARD.esix] }],
  ["Q2 verbatim", { mode: "lookup", question: VERBATIM_Q2, cards: [CARD.silence, CARD.necro, CARD.borne] }]
]) {
  const parsed = askAiRequestSchema.parse(request);
  const vector = await embedder.embed(prep.buildRetrievalQueryText(parsed, { cardDetailIndex: resources.cardDetailIndex }));
  const hybrid = prep.preparePromptInput(parsed, { ...resources, queryEmbedding: vector }).promptText.length;
  const lexical = prep.preparePromptInput(parsed, { ...resources, queryEmbedding: null }).promptText.length;
  let withTopic = "";
  if (label === "Q1 verbatim") {
    ALWAYS_ON_TOPIC_IDS.push(TOPIC_ID);
    try {
      withTopic = `; with the topic ${prep.preparePromptInput(parsed, { ...resources, gameRulesTopics: patchedTopics, queryEmbedding: vector }).promptText.length} (hybrid)`;
    } finally {
      ALWAYS_ON_TOPIC_IDS.pop();
    }
  }
  console.log(`G8 ${label} prompt chars: hybrid ${hybrid}, lexical ${lexical}${withTopic}`);
}
