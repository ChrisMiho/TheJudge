// Define-node measurement for niche-interaction-rule-tests (graph-20261006-150550, attempt 3;
// re-run on the merged tree at attempt 6, 2026-10-07, with candidate C8 and the new cases'
// expected rules set to the deciding rules of the approved corpus cases).
//
// Measures candidate System 3 retrieval changes against EVERY existing suite that
// checks which rules reach the prompt, plus the two new cards-attached cases:
//
//   NEW  the tester's two questions, verbatim, every named card attached
//   WS   worked-solutions retrieval check (npm run eval:worked-solutions, 18 cases)
//   GL   gating context-eval harness, golden scenarios (lexical, queryEmbedding null):
//        System 3 labelled checks + how many prompt goldens would change
//   GS   gating context-eval harness, semantic labelled checks (frozen embeddings for
//        the baseline; candidates re-embed with the local model, as a rebuild would)
//   BM   hybrid-retrieval benchmark (156 pairs, recall@5 / MRR, clean + card-polluted;
//        lexical is the step-1 no-regression gate, semantic is the recorded hybrid result)
//
// A candidate changes only how the System 3 query (or the curated topic set) is built
// from the attached cards; scoring is the unmodified production
// `retrieveRulesForQueryWithDebug`. The baseline reimplementation is asserted
// identical to `preparePromptInput` / `scoreBenchmark` before any candidate is scored.
//
// No network, no live model call (the local MiniLM embedder runs in process).
//   npx tsx PRD/work/niche-interaction-rule-tests/measure-candidates.mjs
import { buildEmbedder, buildCaseRequest, loadPromptResources } from "../../../scripts/lib/prompt-fidelity.mjs";
import { loadGoldCases } from "../../../scripts/lib/gold-cases.mjs";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const fixtureDir = join(repoRoot, "apps/backend/src/eval/fixtures");

const prep = await import("../../../apps/backend/src/prompt/preparation.ts");
const gr = await import("../../../apps/backend/src/gameRulesRetrieval.ts");
const { ALWAYS_ON_TOPIC_IDS, selectGameRulesTopics } = await import("../../../apps/backend/src/gameRulesTopicSelection.ts");
const { buildLookupPromptContext, buildPromptContext } = await import("../../../apps/backend/src/prompt/context.ts");
const { evaluateSystem3RelevanceChecks } = await import("../../../apps/backend/src/eval/contextEvaluationHarness.ts");
const { cardDetailIndexFromRequest } = await import("../../../apps/backend/src/eval/fixtureCardDetail.ts");
const bench = await import("../../../apps/backend/src/eval/ragRetrievalBenchmark.ts");

const resources = await loadPromptResources();
const index = resources.gameRulesRuleIndex;
const ruleText = new Map(index.map((r) => [r.ruleId, r.text]));
const embedder = await buildEmbedder(process.env);
if (embedder.mode !== "local") throw new Error("run with the local embedder (default)");
const embedCache = new Map();
async function embed(text) {
  if (!embedCache.has(text)) {
    const v = await embedder.embed(text);
    if (!Array.isArray(v)) throw new Error(`local embedder returned no vector for: ${text.slice(0, 80)}`);
    embedCache.set(text, v);
  }
  return embedCache.get(text);
}

// ---------------------------------------------------------------- candidates
const REPLACEMENT = /\binstead\b/i;
const PREVENTION = /\bprevent(s|ed)?\b/i;
const tagsFor = (card) => {
  const tags = [];
  if (REPLACEMENT.test(card.oracleText ?? "")) tags.push("replacement effect");
  if (PREVENTION.test(card.oracleText ?? "")) tags.push("prevention effect");
  return tags;
};
const compact = (c) => gr.buildCompactCardSignal(c.name, c.typeLine, c.keywords);
const marked = (cards) => cards.filter((c) => tagsFor(c).length > 0).length;
const T_MIN = ["616.1", "616.1e", "616.1f", "616.2"];
const T_FULL = ["616.1", "616.1a", "616.1b", "616.1c", "616.1d", "616.1e", "616.1f", "616.1g", "616.2"];
const T_PROPOSED = ["614.1a", ...T_FULL]; // define attempt 6: 614.1a is a deciding rule of the approved tester case
const topic = (ruleNumbers) => [{ id: "replacement-effects-interaction", ruleNumbers }];

const CANDIDATES = {
  base: {},
  "C1 oracle text in search": { signal: (c) => `${compact(c)} ${c.oracleText ?? ""}` },
  "C2 oracle text embedded only": { embedSignal: (c) => `${compact(c)} ${c.oracleText ?? ""}` },
  "C3 rules-term tag (card side)": { signal: (c) => [compact(c), ...tagsFor(c)].join(" ") },
  "C4 rules-term tag (question side)": { questionExtra: (cards) => [...new Set(cards.flatMap(tagsFor))].join(" ") },
  "C5 616 topic, any marked card (min)": { topics: (cards) => (marked(cards) >= 1 ? topic(T_MIN) : []) },
  "C6 616 topic, 2+ marked cards (min)": { topics: (cards) => (marked(cards) >= 2 ? topic(T_MIN) : []) },
  "C7 616 topic, 2+ marked cards (full)": { topics: (cards) => (marked(cards) >= 2 ? topic(T_FULL) : []) },
  "C8 616 topic + 614.1a, 2+ marked cards": { topics: (cards) => (marked(cards) >= 2 ? topic(T_PROPOSED) : []) }
};

// ------------------------------------------------------------- System 3 runner
function contextCards(request, cardDetailIndex) {
  if (request.mode === "lookup") {
    const context = buildLookupPromptContext(request, cardDetailIndex);
    return { questionText: request.question, cards: context.cards ?? [], topics: resources.gameRulesTopics.filter((t) => ALWAYS_ON_TOPIC_IDS.includes(t.id)) };
  }
  const context = buildPromptContext(request, cardDetailIndex);
  const cards = [...context.orderedStack, ...context.populatedZones.flatMap((z) => z.items)];
  return { questionText: context.finalQuestion, cards, topics: selectGameRulesTopics(context, resources.gameRulesTopics) };
}

async function system3(request, cardDetailIndex, cand, { semantic, cap = 10, frozenVector = null }) {
  const { questionText, cards, topics } = contextCards(request, cardDetailIndex);
  const extraTopics = cand.topics?.(cards) ?? [];
  const curated = gr.collectCuratedRuleIds([...topics, ...extraTopics]);
  const signal = cards.map((c) => (cand.signal ?? compact)(c)).join(" ");
  const embedSignal = cards.map((c) => (cand.embedSignal ?? cand.signal ?? compact)(c)).join(" ");
  const extra = cand.questionExtra?.(cards) ?? "";
  const qText = extra ? `${questionText} ${extra}` : questionText;
  const query = gr.buildQueryTokensFromParts({ questionText: qText, oracleText: signal });
  const embedText = request.mode === "lookup" ? `${qText} ${embedSignal}`.trim() : `${qText} ${embedSignal}`;
  const vector = semantic ? frozenVector ?? (await embed(embedText)) : null;
  const run = (max) =>
    gr.retrieveRulesForQueryWithDebug(query.tokens, query.queryRuleIds, index, curated, max, undefined, vector, query.queryText, query.questionRuleIds);
  const top = run(cap);
  if (semantic && !top.debug.usedSemantic) throw new Error("expected a semantic pass");
  const deep = run(300).selected.map((r) => r.ruleId);
  return { selected: top.selected, ids: top.selected.map((r) => r.ruleId), curated, deep, extraTopics, embedText };
}

const where = (r, id) => {
  const i = r.ids.indexOf(id);
  if (i >= 0) return `S3#${i + 1}`;
  if (r.curated.has(id)) return "curated";
  const d = r.deep.indexOf(id);
  return d >= 0 ? `miss(${d + 1})` : "miss(>300)";
};
const inPrompt = (r, id) => r.ids.includes(id) || r.curated.has(id);

// ---------------------------------------------------------------- suite inputs
const CARDS = {
  manufactor: { cardId: "f36d1d8b-8303-44a9-ab56-531931641ea2", name: "Academy Manufactor" },
  esix: { cardId: "9d22960b-babc-4cf3-b228-d32e13bc6014", name: "Esix, Fractal Bloom" },
  silence: { cardId: "8aed54cb-d1bb-45ad-adbe-38e55d84ff31", name: "Silence" },
  necro: { cardId: "94a844d2-0574-45a7-b347-e0e329767c42", name: "Necropotence" },
  borne: { cardId: "ce19962d-94f9-4b2b-b668-963c0acce308", name: "Borne Upon a Wind" }
};
const NEW_CASES = [
  {
    id: "manufactor-esix-treasure",
    request: { mode: "lookup", question: "How do academy manufactor and esix, fractal bloom interact when I'm attempting to create a treasure token?", cards: [CARDS.manufactor, CARDS.esix] },
    // attempt 6: the deciding rules the approved corpus case names (academy-manufactor-esix-treasure)
    expected: ["614.1a", "616.1", "616.1e", "616.1f"]
  },
  {
    id: "necropotence-silence-cleanup",
    request: { mode: "lookup", question: "Can I use the triggered ability of necropotence during my cleanup step to dodge silence effects and cast borne upon a wind?", cards: [CARDS.silence, CARDS.necro, CARDS.borne] },
    // attempt 6: the deciding rules the approved corpus case names (necropotence-silence-borne-upon-a-wind-cleanup)
    expected: ["514.1", "514.2", "514.3a"]
  }
];
// Define attempt 6 (2026-10-07): the shared loader now reads the format-version-2
// rules test corpus (393 cases). The worked-solutions suite here stays the 18
// first-ship cases (the cases with no `source.pool`), scored on their
// `expected.decidingRuleIds`; the whole corpus is measured by measure-rules-gate.mjs.
const goldCases = (await loadGoldCases()).filter((g) => g.source?.pool === undefined && g.review.status !== "rejected");
if (goldCases.length !== 18) throw new Error(`expected the 18 first-ship cases, got ${goldCases.length}`);
for (const g of goldCases) g.expectedSupplementalRuleIds = g.expected.decidingRuleIds;
const fixtures = readdirSync(fixtureDir).filter((f) => f.endsWith(".fixture.json")).sort().map((f) => JSON.parse(readFileSync(join(fixtureDir, f), "utf8")));
const frozen = JSON.parse(readFileSync(join(fixtureDir, "frozen-query-embeddings.json"), "utf8"));
const labelled = fixtures.filter((f) => f.expected?.expectedSupplementalRuleIds || f.expected?.forbiddenSupplementalRuleIds);

const corpus = bench.loadBenchmarkCorpus();
const nameIndex = bench.loadCardNameByOracleId();
const sortedOracleIds = [...resources.cardDetailIndex.keys()].sort();
const pollutionCards = [1000, 9000, 20000].map((i) => {
  const oracleId = sortedOracleIds[i % sortedOracleIds.length];
  const e = resources.cardDetailIndex.get(oracleId);
  return { name: nameIndex.get(oracleId) ?? "", typeLine: e.typeLine, keywords: e.keywords, oracleText: e.oracleText };
});

// ------------------------------------------------------------- parity checks
for (const c of [...NEW_CASES.map((n) => ({ id: n.id, req: n.request })), ...goldCases.map((g) => ({ id: g.id, req: buildCaseRequest(g) }))]) {
  for (const semantic of [true, false]) {
    const vec = semantic ? await embed(prep.buildRetrievalQueryText(c.req, { cardDetailIndex: resources.cardDetailIndex })) : null;
    const prod = prep.preparePromptInput(c.req, { ...resources, queryEmbedding: vec, collectEnrichmentDebug: true }).enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
    const mine = (await system3(c.req, resources.cardDetailIndex, {}, { semantic })).ids;
    if (JSON.stringify(prod) !== JSON.stringify(mine)) throw new Error(`parity failure ${c.id} semantic=${semantic}`);
  }
}
for (const f of labelled) {
  const cdi = cardDetailIndexFromRequest(f.request);
  const prod = prep.preparePromptInput(f.request, { ...resources, cardDetailIndex: cdi, queryEmbedding: frozen[f.id].vector, collectEnrichmentDebug: true }).enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
  const mine = (await system3(f.request, cdi, {}, { semantic: true, frozenVector: frozen[f.id].vector })).ids;
  if (JSON.stringify(prod) !== JSON.stringify(mine)) throw new Error(`parity failure fixture ${f.id}`);
  const local = (await system3(f.request, cdi, {}, { semantic: true })).ids;
  if (JSON.stringify(local) !== JSON.stringify(mine)) console.log(`note: local re-embed differs from frozen for ${f.id}`);
}
if (pollutionCards.map(compact).join(" ") !== bench.buildPollutionText(resources.cardDetailIndex, nameIndex)) throw new Error("pollution parity failure");
console.log("Parity: baseline reimplementation matches production for every case, gold case, and labelled fixture.\n");

// ---------------------------------------------------------------- suites
async function suiteNew(cand) {
  const out = [];
  for (const n of NEW_CASES) {
    const parts = [];
    let hit = true;
    for (const semantic of [true, false]) {
      const r = await system3(n.request, resources.cardDetailIndex, cand, { semantic });
      if (semantic) hit = n.expected.every((id) => inPrompt(r, id));
      parts.push(`${semantic ? "hybrid" : "lexical"} ${n.expected.map((id) => `${id}=${where(r, id)}`).join(" ")}`);
    }
    out.push(`${hit ? "HIT " : "MISS"} ${n.id}: ${parts.join(" | ")}`);
  }
  return out;
}

async function suiteWS(cand) {
  const res = {};
  for (const semantic of [true, false]) {
    let s3 = 0, any = 0;
    const misses = [];
    for (const g of goldCases) {
      const r = await system3(buildCaseRequest(g), resources.cardDetailIndex, cand, { semantic });
      if (g.expectedSupplementalRuleIds.every((id) => r.ids.includes(id))) s3++;
      else misses.push(`${g.id}:${g.expectedSupplementalRuleIds.map((id) => where(r, id)).join(",")}`);
      if (g.expectedSupplementalRuleIds.every((id) => inPrompt(r, id))) any++;
    }
    res[semantic ? "hybrid" : "lexical"] = { s3, any, misses };
  }
  return res;
}

async function suiteGating(cand, baselineGolden) {
  // GS: semantic labelled checks; GL: lexical labelled checks + golden churn over every fixture.
  let gsPass = 0, gsTotal = 0, glPass = 0, glTotal = 0;
  const failures = [];
  for (const f of labelled) {
    const cdi = cardDetailIndexFromRequest(f.request);
    const frozenVector = Object.keys(cand).length === 0 ? frozen[f.id].vector : null;
    const sem = await system3(f.request, cdi, cand, { semantic: true, frozenVector });
    for (const ch of evaluateSystem3RelevanceChecks(sem.selected, f.expected)) {
      gsTotal++;
      if (ch.passed) gsPass++;
      else failures.push(`GS ${f.id}`);
    }
    const lexCap = f.request.mode === "lookup" ? 10 : 5;
    const lex = await system3(f.request, cdi, cand, { semantic: false, cap: lexCap });
    for (const ch of evaluateSystem3RelevanceChecks(lex.selected, f.expected)) {
      glTotal++;
      if (ch.passed) glPass++;
      else failures.push(`GL ${f.id}`);
    }
  }
  let churn = 0;
  const churned = [];
  const golden = {};
  for (const f of fixtures) {
    const cdi = cardDetailIndexFromRequest(f.request);
    const lexCap = f.request.mode === "lookup" ? 10 : 5;
    const r = await system3(f.request, cdi, cand, { semantic: false, cap: lexCap });
    golden[f.id] = JSON.stringify([r.ids, r.extraTopics.map((t) => t.id)]);
    if (baselineGolden && baselineGolden[f.id] !== golden[f.id]) {
      churn++;
      churned.push(f.id);
    }
  }
  return { gsPass, gsTotal, glPass, glTotal, failures, churn, churned, golden };
}

const recall = (ranks) => ranks.filter((r) => r > 0 && r <= 5).length / ranks.length;
const mrr = (ranks) => ranks.reduce((s, r) => s + (r > 0 ? 1 / r : 0), 0) / ranks.length;
async function suiteBench(cand) {
  const signal = pollutionCards.map((c) => (cand.signal ?? compact)(c)).join(" ");
  const embedSignal = pollutionCards.map((c) => (cand.embedSignal ?? cand.signal ?? compact)(c)).join(" ");
  const extra = cand.questionExtra?.(pollutionCards) ?? "";
  const out = {};
  for (const semantic of [false, true]) {
    const clean = [], polluted = [];
    for (const item of corpus.items) {
      const stem = (id) => id.replace(/[a-z]$/i, ""); // same stem rankOf uses in ragRetrievalBenchmark.ts
      const rank = (hits) => hits.findIndex((h) => stem(h) === stem(item.expectedRuleId)) + 1;
      const q0 = gr.buildQueryTokensFromParts({ questionText: item.question, oracleText: "" });
      const v0 = semantic ? await embed(item.question) : null;
      clean.push(rank(gr.retrieveRulesForQuery(q0.tokens, q0.queryRuleIds, index, new Set(), 5, undefined, v0, q0.questionRuleIds).map((r) => r.ruleId)));
      const qt = extra ? `${item.question} ${extra}` : item.question;
      const q1 = gr.buildQueryTokensFromParts({ questionText: qt, oracleText: signal });
      const v1 = semantic ? await embed(`${qt} ${embedSignal}`) : null;
      polluted.push(rank(gr.retrieveRulesForQuery(q1.tokens, q1.queryRuleIds, index, new Set(), 5, undefined, v1, q1.questionRuleIds).map((r) => r.ruleId)));
    }
    out[semantic ? "hybrid" : "lexical"] = { clean: [recall(clean), mrr(clean)], polluted: [recall(polluted), mrr(polluted)] };
  }
  return out;
}

const f4 = (x) => x.toFixed(4);
{
  const all = [...resources.cardDetailIndex.values()];
  const rep = all.filter((e) => REPLACEMENT.test(e.oracleText ?? "")).length;
  const any = all.filter((e) => tagsFor(e).length > 0).length;
  const p = any / all.length;
  console.log(`Marker rate over ${all.length} cards: "instead" ${rep} (${(100 * rep / all.length).toFixed(1)}%), "instead" or "prevent" ${any} (${(100 * p).toFixed(1)}%); two random attached cards both marked ~${(100 * p * p).toFixed(1)}%`);
}
let baselineGolden = null;
const lexicalParity = bench.scoreBenchmark(corpus, index, bench.buildPollutionText(resources.cardDetailIndex, nameIndex));
console.log(`Benchmark parity (production scoreBenchmark, lexical): clean ${f4(lexicalParity.clean.recall5)} polluted ${f4(lexicalParity.polluted.recall5)}`);
// Rule text only (the sum of the rules' own text). Through `formatGameRulesSection`
// the prompt grows by more: line breaks between rules, the topic's title line, and
// the blank line between topics. Measured at define attempt 5: full set 3,722; at attempt 6,
// full set + 614.1a (C8, the proposal): 3,898 (measure-rules-gate.mjs, G5 and G8).
console.log(`Prompt cost of the 616 topic: min ${T_MIN.reduce((s, id) => s + ruleText.get(id).length, 0)} chars, full ${T_FULL.reduce((s, id) => s + ruleText.get(id).length, 0)} chars, full + 614.1a ${T_PROPOSED.reduce((s, id) => s + ruleText.get(id).length, 0)} chars\n`);

for (const [name, cand] of Object.entries(CANDIDATES)) {
  console.log(`==================== ${name}`);
  for (const line of await suiteNew(cand)) console.log(`NEW ${line}`);
  const ws = await suiteWS(cand);
  for (const mode of ["hybrid", "lexical"]) console.log(`WS  ${mode}: ${ws[mode].s3}/18 System 3 (${ws[mode].any}/18 anywhere in prompt); misses ${ws[mode].misses.join("; ")}`);
  const g = await suiteGating(cand, baselineGolden);
  if (!baselineGolden) baselineGolden = g.golden;
  console.log(`GS  semantic labelled checks ${g.gsPass}/${g.gsTotal}; GL lexical labelled checks ${g.glPass}/${g.glTotal}; failures ${g.failures.join(", ") || "none"}`);
  console.log(`GL  golden prompts that would change: ${g.churn}/${fixtures.length} ${g.churned.join(", ")}`);
  const b = await suiteBench(cand);
  for (const mode of ["lexical", "hybrid"]) console.log(`BM  ${mode}: clean R@5 ${f4(b[mode].clean[0])} MRR ${f4(b[mode].clean[1])} | polluted R@5 ${f4(b[mode].polluted[0])} MRR ${f4(b[mode].polluted[1])}`);
  console.log("");
  if (name === "base" && Math.abs(b.lexical.clean[0] - lexicalParity.clean.recall5) + Math.abs(b.lexical.polluted[0] - lexicalParity.polluted.recall5) > 1e-12) throw new Error("benchmark parity failure");
}
