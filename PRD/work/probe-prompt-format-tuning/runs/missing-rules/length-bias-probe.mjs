// Free, local probe (no API calls): why do the same few long rules (800.4a, 608.2f, 712.13a …) fill System 3's
// 10 excerpt slots on almost any question, and would length-normalizing the word-match half fix it?
// Re-implements the production hybrid blend (gameRulesRetrieval.ts scoreIndex) with a pluggable lexical
// score, checks the baseline reproduces production's top 10 exactly for every question, then compares variants.
// Prints aggregate counts only (rule ids, counts) — no question ids, text or answers.
// Usage (from .worktrees/probe-pft): npx tsx <this file> [--set hard25]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/practice-suite`;
const args = process.argv.slice(2);
const SET = args.includes("--set") ? args[args.indexOf("--set") + 1] : "suite";
const CAP = 10;

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const ws = await imp("scripts/eval-worked-solutions.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const sg = await imp("scripts/lib/practice-suite.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { buildPromptContext, buildLookupPromptContext } = await imp("apps/backend/src/prompt/context.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const R = await imp("apps/backend/src/gameRulesRetrieval.ts");

sg.assertSuiteIgnored({ suiteDir: SUITE });
const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");

const { selected } = await ws.loadSuiteSelection({ suiteDir: SUITE });
let cases = selected;
if (SET === "hard25") {
  const ids = new Set(JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final);
  cases = selected.filter((c) => ids.has(c.id));
}
console.log(`Set ${SET}: ${cases.length} questions`);

const resources = await fid.loadPromptResources({ env });
const index = resources.gameRulesRuleIndex;
const stats = R.loadGameRulesTokenStats(join(REPO, "apps/backend/data/gameRulesTokenStats.json"));
const vocab = R.loadGameRulesKeywordVocabulary(join(REPO, "apps/backend/data/gameRulesKeywordVocabulary.json"));
const emb = R.loadGameRulesRuleEmbeddings(join(REPO, "apps/backend/data/gameRulesRuleEmbeddings.json"));
const vecById = new Map(emb.ruleIds.map((id, i) => [id, emb.vectors[i]]));
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);

// Mirrors gameRulesRetrieval.ts (tokenize, STOP_WORDS, extractRuleIds, multipliers, boosts).
const STOP = new Set(["and", "are", "can", "card", "cards", "does", "for", "from", "has", "have", "how", "one", "that", "the", "this", "what", "when", "will", "with"]);
const tokenize = (v) => v.toLowerCase().split(/[^a-z0-9.]+/).map((t) => t.trim()).filter((t) => t.length >= 3 && !STOP.has(t));
const extractRuleIds = (v) => [...new Set([...v.matchAll(/\b\d{3}(?:\.\d+[a-z]?)?\b/gi)].map((m) => m[0]))];
const N = stats.N;
const entryTokens = new Map(index.map((e) => [e.ruleId, new Set(tokenize(e.searchText))]));
const entryLen = new Map(index.map((e) => [e.ruleId, tokenize(e.searchText).length]));
const avgLen = [...entryLen.values()].reduce((a, b) => a + b, 0) / entryLen.size;
const entryCites = new Map(index.map((e) => [e.ruleId, extractRuleIds(e.text).filter((id) => id !== e.ruleId)]));

const lexicalRaw = (entry, tokens) => {
  let s = 0, top = 0;
  const set = entryTokens.get(entry.ruleId);
  for (const { token, source, isKeyword } of tokens) {
    if (!set.has(token)) continue;
    const idf = Math.log(N / Math.max(stats.df.get(token) ?? 1, 1));
    let w = idf;
    if (source === "question") w *= 3;
    if (isKeyword) w *= 6;
    s += w;
    if (idf > top) top = idf;
  }
  return { s, top };
};
const boostOf = (entry, qIds, questionIds) => {
  let b = qIds.has(entry.ruleId) ? 100 : 0;
  if (entry.parentRuleIds.some((p) => qIds.has(p))) b += 20;
  if (questionIds.size && entryCites.get(entry.ruleId).some((id) => questionIds.has(id))) b += 10;
  return b;
};

// Lexical variants: multiply the production word-match score by a length factor.
const bm25 = (k1, b) => (len) => (k1 + 1) / (1 + k1 * (1 - b + (b * len) / avgLen));
const VARIANTS = {
  production: { alpha: 0.6, lenFactor: () => 1 },
  "bm25 b=0.75": { alpha: 0.6, lenFactor: bm25(1.2, 0.75) },
  "bm25 b=0.5": { alpha: 0.6, lenFactor: bm25(1.2, 0.5) },
  "bm25 b=0.3": { alpha: 0.6, lenFactor: bm25(1.2, 0.3) },
  "÷sqrt(len/avg)": { alpha: 0.6, lenFactor: (len) => 1 / Math.sqrt(len / avgLen) },
  "cosine only": { alpha: 1, lenFactor: () => 1 },
  "word-match only": { alpha: 0, lenFactor: () => 1 }
};

function rank(cands, { alpha, lenFactor }) {
  let maxC = 0, maxL = 0;
  const rows = cands.map((c) => ({ ...c, lex: c.lexRaw * lenFactor(entryLen.get(c.entry.ruleId)) }));
  for (const r of rows) { if (r.cos > maxC) maxC = r.cos; if (r.lex > maxL) maxL = r.lex; }
  const scored = [];
  for (const r of rows) {
    const s = alpha * (maxC > 0 ? r.cos / maxC : 0) + (1 - alpha) * (maxL > 0 ? r.lex / maxL : 0) + r.boost;
    if (s > 0) scored.push({ id: r.entry.ruleId, s, top: r.top });
  }
  scored.sort((a, b) => b.s - a.s || b.top - a.top || parseFloat(a.id) - parseFloat(b.id));
  return scored.map((x) => x.id);
}

const agg = Object.fromEntries(Object.keys(VARIANTS).map((k) => [k, { found: 0, allFound: 0, freq: {}, selLen: 0, ranks: [] }]));
let total = 0, withRules = 0, skipped = 0, mismatch = 0, done = 0;
const intruderSides = {}; // for production's frequent intruders: in top 10 by cosine alone / word match alone

for (const c of cases) {
  const parsed = askAiRequestSchema.safeParse(fid.buildCaseRequest(c));
  if (!parsed.success) { skipped++; continue; }
  const request = parsed.data;
  const vector = await embedder.embed(buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex }));
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: "case" });
  const prod = preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true, supplementalRuleCap: CAP });
  const curated = new Set((prod.enrichmentDebug.curatedGameRules.topics ?? []).flatMap((t) => t.ruleNumbers ?? []));

  let q;
  if (request.mode === "lookup") {
    const ctx = buildLookupPromptContext(request, resources.cardDetailIndex);
    q = R.buildQueryTokensFromParts({ questionText: request.question, oracleText: (ctx.cards ?? []).map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ") }, vocab);
  } else {
    q = R.buildQueryTokens(buildPromptContext(request, resources.cardDetailIndex), vocab);
  }
  const qIds = new Set(q.queryRuleIds), questionIds = new Set(q.questionRuleIds);
  const cands = index.filter((e) => !curated.has(e.ruleId) && vecById.has(e.ruleId)).map((entry) => {
    const { s, top } = lexicalRaw(entry, q.tokens);
    return { entry, cos: R.cosineSimilarity(vector, vecById.get(entry.ruleId)), lexRaw: s, top, boost: boostOf(entry, qIds, questionIds) };
  });

  const prodTop = prod.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
  const deciding = [...new Set(c.expected.decidingRuleIds ?? [])];
  total++;
  if (deciding.length) withRules++;
  for (const [name, v] of Object.entries(VARIANTS)) {
    const order = rank(cands, v);
    const top = order.slice(0, CAP);
    if (name === "production" && top.join() !== prodTop.join()) mismatch++;
    const a = agg[name];
    for (const id of top) { a.freq[id] = (a.freq[id] ?? 0) + 1; a.selLen += entryLen.get(id); }
    const pos = new Map(order.map((id, i) => [id, i + 1]));
    let all = deciding.length > 0;
    for (const id of deciding) {
      const hit = curated.has(id) || top.includes(id);
      if (hit) a.found++; else all = false;
      if (!curated.has(id)) a.ranks.push(pos.get(id) ?? 99999);
    }
    if (all) a.allFound++;
  }
  // which half puts production's intruders in the top 10?
  const cosTop = new Set(rank(cands, VARIANTS["cosine only"]).slice(0, CAP));
  const lexTop = new Set(rank(cands, VARIANTS["word-match only"]).slice(0, CAP));
  for (const id of prodTop) {
    intruderSides[id] ??= { n: 0, cos: 0, lex: 0 };
    intruderSides[id].n++;
    if (cosTop.has(id)) intruderSides[id].cos++;
    if (lexTop.has(id)) intruderSides[id].lex++;
  }
  if (++done % 200 === 0) console.log(`  ${done}/${cases.length}`);
}

if (mismatch) console.log(`\n!! FIDELITY: baseline re-implementation differs from production top 10 on ${mismatch} questions — treat variant numbers with care`);
else console.log(`\nFidelity: re-implemented baseline matches production's top 10 on all ${total} questions.`);
console.log(`Skipped (production would reject): ${skipped}. Questions with deciding rules: ${withRules}. Mean rule length ${avgLen.toFixed(1)} tokens.`);

const cites = agg.production.ranks.length + agg.production.found - agg.production.ranks.filter((r) => r <= CAP).length;
console.log(`\nVariant — deciding-rule citations in prompt / questions with every deciding rule / missing-rule median rank / share ranked ≤50 / mean selected-rule length / top intruders`);
for (const [name, a] of Object.entries(agg)) {
  const r = [...a.ranks].sort((x, y) => x - y);
  const med = r[r.length >> 1];
  const le50 = Math.round((100 * r.filter((x) => x <= 50).length) / r.length);
  const top = Object.entries(a.freq).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([id, n]) => `${id} ${Math.round((100 * n) / total)}%`).join(", ");
  console.log(`  ${name.padEnd(16)} ${a.found} / ${a.allFound} / ${med} / ${le50}% / ${(a.selLen / (total * CAP)).toFixed(0)} / ${top}`);
}
console.log(`  (citations total ≈ ${cites})`);

console.log(`\nProduction's most frequent excerpts: share of questions, and how often each half alone would also put it in the top 10`);
for (const [id, v] of Object.entries(intruderSides).sort((x, y) => y[1].n - x[1].n).slice(0, 10)) {
  console.log(`  ${id.padEnd(9)} ${Math.round((100 * v.n) / total)}% of prompts; length ${entryLen.get(id)} tokens; cosine-alone top 10 in ${Math.round((100 * v.cos) / v.n)}% of those, word-match-alone in ${Math.round((100 * v.lex) / v.n)}%`);
}
