// Free, local probe (no API calls). Stage 1 of the reranker probe.
// Copied and trimmed from ../audit-search/search-audit-probe.mjs: production's hybrid ranking only
// (0.6 × MiniLM cosine ÷ max + 0.4 × word match ÷ max + boosts), verified against production's top 10,
// then the top 100 candidates per question are saved for the reranker stage.
// --set suite  : practice suite (1,181). Saved INSIDE output/practice-suite/reports/ (gitignored) because it holds
//                question text needed for reranking. Nothing private is printed.
// --set corpus : the project's own worked-solutions corpus (415) incl. both Necropotence cases.
// Usage (from .worktrees/probe-pft): EMBEDDING_PROVIDER=local npx tsx <this file> --set suite|corpus
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/practice-suite`;
const OUT = `${REPO}/output/models-probe`;
const args = process.argv.slice(2);
const SET = args.includes("--set") ? args[args.indexOf("--set") + 1] : "corpus";
const CAP = 10, KEEP = 100;
const WATCH = ["514.1", "514.2", "514.3", "514.3a"];

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const ws = await imp("scripts/eval-worked-solutions.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const sg = await imp("scripts/lib/practice-suite.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { buildPromptContext, buildLookupPromptContext } = await imp("apps/backend/src/prompt/context.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const R = await imp("apps/backend/src/gameRulesRetrieval.ts");

const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);

let cases, hard = new Set();
if (SET === "corpus") {
  const dir = `${REPO}/apps/backend/src/eval/worked-solutions`;
  cases = readdirSync(dir).filter((f) => f.endsWith(".case.json")).map((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8")))
    .filter((c) => c.review?.status !== "rejected");
} else {
  sg.assertSuiteIgnored({ suiteDir: SUITE });
  cases = (await ws.loadSuiteSelection({ suiteDir: SUITE })).selected;
  hard = new Set(JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final);
}
console.log(`Set ${SET}: ${cases.length} questions`);

const resources = await fid.loadPromptResources({ env });
const index = resources.gameRulesRuleIndex;
const vocab = R.loadGameRulesKeywordVocabulary(join(REPO, "apps/backend/data/gameRulesKeywordVocabulary.json"));
const emb = R.loadGameRulesRuleEmbeddings(join(REPO, "apps/backend/data/gameRulesRuleEmbeddings.json"));
const vecById = new Map(emb.ruleIds.map((id, i) => [id, emb.vectors[i]]));
const byId = new Map(index.map((e) => [e.ruleId, e]));
const N = index.length;

const STOP = new Set(["and", "are", "can", "card", "cards", "does", "for", "from", "has", "have", "how", "one", "that", "the", "this", "what", "when", "will", "with"]);
const tokenize = (v) => v.toLowerCase().split(/[^a-z0-9.]+/).map((t) => t.trim()).filter((t) => t.length >= 3 && !STOP.has(t));
const extractRuleIds = (v) => [...new Set([...v.matchAll(/\b\d{3}(?:\.\d+[a-z]?)?\b/gi)].map((m) => m[0]))];
const entryCites = new Map(index.map((e) => [e.ruleId, extractRuleIds(e.text).filter((id) => id !== e.ruleId)]));
const sets = new Map(index.map((e) => [e.ruleId, new Set(tokenize(e.searchText))]));
const df = new Map();
for (const s of sets.values()) for (const t of s) df.set(t, (df.get(t) ?? 0) + 1);
const vocabT = new Set([...vocab].flatMap((k) => tokenize(k)));

function queryTokens(questionText, oracleText) {
  const by = new Map();
  const add = (token, source) => {
    const ex = by.get(token);
    if (!ex) { by.set(token, { token, source, isKeyword: vocabT.has(token) }); return; }
    if (source === "question") ex.source = "question";
  };
  for (const t of tokenize(questionText)) add(t, "question");
  for (const t of tokenize(oracleText)) add(t, "oracle");
  return [...by.values()];
}
function lexScore(ruleId, tokens) {
  let s = 0, top = 0;
  const set = sets.get(ruleId);
  for (const { token, source, isKeyword } of tokens) {
    if (!set.has(token)) continue;
    const idf = Math.log(N / Math.max(df.get(token) ?? 1, 1));
    let w = idf;
    if (source === "question") w *= 3;
    if (isKeyword) w *= 6;
    s += w;
    if (idf > top) top = idf;
  }
  return { s, top };
}
const boostOf = (ruleId, qIds, questionIds) => {
  const e = byId.get(ruleId);
  let b = qIds.has(ruleId) ? 100 : 0;
  if (e.parentRuleIds.some((p) => qIds.has(p))) b += 20;
  if (questionIds.size && entryCites.get(ruleId).some((id) => questionIds.has(id))) b += 10;
  return b;
};
function blend(rows) {
  let maxC = -Infinity, maxL = 0;
  for (const r of rows) { maxC = Math.max(maxC, r.cos); maxL = Math.max(maxL, r.lex); }
  const out = [];
  for (const r of rows) {
    const s = 0.6 * (maxC > 0 ? r.cos / maxC : 0) + 0.4 * (maxL > 0 ? r.lex / maxL : 0) + r.boost;
    if (s > 0) out.push({ id: r.id, s, top: r.top });
  }
  out.sort((a, b) => b.s - a.s || b.top - a.top || parseFloat(a.id) - parseFloat(b.id));
  return out;
}
const half = (id) => (createHash("sha256").update(`pft-split-1:${id}`).digest()[0] % 2 === 0 ? "tuning" : "check");

const records = [];
let mismatch = 0, skipped = 0;
for (const c of cases) {
  const parsed = askAiRequestSchema.safeParse(fid.buildCaseRequest(c));
  if (!parsed.success) { skipped++; continue; }
  const request = parsed.data;
  const queryText = buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex });
  const vector = await embedder.embed(queryText);
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: "case" });
  const prod = preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true, supplementalRuleCap: CAP });
  if (!prod.enrichmentDebug.supplemental.usedSemantic) throw new Error("semantic retrieval did not run");
  const curated = [...new Set((prod.enrichmentDebug.curatedGameRules.topics ?? []).flatMap((t) => t.ruleNumbers ?? []))];
  const curSet = new Set(curated);
  let questionText, cards;
  if (request.mode === "lookup") {
    questionText = request.question;
    cards = buildLookupPromptContext(request, resources.cardDetailIndex).cards ?? [];
  } else {
    const ctx = buildPromptContext(request, resources.cardDetailIndex);
    questionText = ctx.finalQuestion;
    cards = [...ctx.orderedStack, ...ctx.populatedZones.flatMap((z) => z.items)];
  }
  const oracleText = cards.map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ");
  const qIds = new Set(extractRuleIds(`${questionText} ${oracleText}`));
  const questionIds = new Set(extractRuleIds(questionText));
  const toks = queryTokens(questionText, oracleText);
  const rows = index.filter((e) => !curSet.has(e.ruleId) && vecById.has(e.ruleId)).map((e) => {
    const { s, top } = lexScore(e.ruleId, toks);
    return { id: e.ruleId, cos: R.cosineSimilarity(vector, vecById.get(e.ruleId)), lex: s, top, boost: boostOf(e.ruleId, qIds, questionIds) };
  });
  const order = blend(rows);
  const prodTop = prod.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
  if (order.slice(0, CAP).map((r) => r.id).join() !== prodTop.join()) mismatch++;
  const pos = new Map(order.map((r, i) => [r.id, i + 1]));
  const deciding = [...new Set(c.expected?.decidingRuleIds ?? [])];
  const watchRanks = Object.fromEntries([...new Set([...deciding, ...WATCH])].map((id) => [id, curSet.has(id) ? "curated" : pos.get(id) ?? null]));
  records.push({
    key: SET === "corpus" ? c.id : createHash("sha256").update(`rr:${c.id}`).digest("hex").slice(0, 16),
    half: half(c.id), hard: hard.has(c.id), mode: request.mode,
    deciding, curated, queryText, questionText,
    top: order.slice(0, KEEP).map((r) => [r.id, +r.s.toFixed(6)]), watchRanks
  });
  if (records.length % 200 === 0) console.log(`  ${records.length}/${cases.length}`);
}
console.log(`Fidelity: re-implemented production top 10 differs on ${mismatch} of ${records.length}; skipped ${skipped}.`);
const target = SET === "corpus" ? `${OUT}/candidates-corpus.json` : sg.resolveInsideSuite(`${SUITE}/reports/pft-rerank-candidates-suite.json`, { suiteDir: SUITE });
writeFileSync(target, JSON.stringify(records));
console.log(`Saved ${records.length} candidate lists (top ${KEEP}).`);
