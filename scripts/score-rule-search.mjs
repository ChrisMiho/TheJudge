// Free, local scorer (no API calls, no LLM) for the rule search: how many of the rules that decide a
// ruling reach the answering model's top ten. Ported from the probe at
// PRD/work/probe-prompt-format-tuning/runs/search-trained-embedder/score-trained.mjs.
//
// Default      Score the search this checkout ships (the production code's top ten, per-card slots and
//              all) with the committed rule vectors, and print the five numbers the build tracks:
//                deciding-rule citations found in the suite (tuning + check)
//                suite questions with every deciding rule found
//                of the hard 25, citations found
//                corpus citations found
//                corpus cases with every deciding rule found
// --fidelity   The slice-A stop gate. Also recompute the search as it ran BEFORE `right-rules-in-order`
//              (word tokens of the old kind, blend 0.6, no concept map, no per-card slots) with a
//              reimplementation here, and require it to agree with production's top ten on every
//              question. Valid only against the code of that time (the slice-A commit): after the
//              search fixes land, production differs from the reimplementation by design, and this
//              flag reports that as a mismatch. The recorded gate result: 473 / 159 / 5 / 351 / 305.
// --ranks      "caseId:ruleId,..." Also prints each corpus case's deciding rule's rank in the shipped
//              ordering and in the pre-change reimplementation (ranks of committed corpus ids only).
//
// Reads the practice suite from the launch checkout (read-only). Per-question results are written ONLY
// under output/rule-search-eval/ (git-ignored). Stdout carries counts only: no question text, ids,
// answers or cards.
//
// Usage (from the worktree): EMBEDDING_PROVIDER=local npx tsx scripts/score-rule-search.mjs --fidelity
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const SUITE = arg("--suite", process.env.PRACTICE_SUITE_DIR ?? "/Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite");
const OUT = join(REPO, "output/rule-search-eval");
const HARD25 = arg("--hard25", join(OUT, "hard25.json"));
const SETS = arg("--sets", "suite,corpus").split(",");
const ALPHA = 0.6; // production blend today
const CAP = 10;

const FIDELITY = args.includes("--fidelity");
const RANK_CASES = (arg("--ranks", "") || "").split(",").filter(Boolean).map((pair) => pair.split(":"));
mkdirSync(OUT, { recursive: true });
// The results folder must be git-ignored before anything is written to it.
const ignored = spawnSync("git", ["check-ignore", "-q", join(OUT, "probe.json")], { cwd: REPO });
if (ignored.status !== 0) throw new Error("output/rule-search-eval/ is not git-ignored; refusing to write per-question results.");

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const sg = await imp("scripts/lib/practice-suite.mjs");
const { preparePromptInput, buildRetrievalQueryText, buildPerCardSearchTexts } = await imp("apps/backend/src/prompt/preparation.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const R = await imp("apps/backend/src/gameRulesRetrieval.ts");

const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);
const half = (id) => (createHash("sha256").update("pft-split-1:" + id).digest()[0] % 2 === 0 ? "tuning" : "check");

const resources = await fid.loadPromptResources({ env });
const index = resources.gameRulesRuleIndex;
const vocab = R.loadGameRulesKeywordVocabulary(join(REPO, "apps/backend/data/gameRulesKeywordVocabulary.json"));
const emb = R.loadGameRulesRuleEmbeddings(join(REPO, "apps/backend/data/gameRulesRuleEmbeddings.json"));
const vecById = new Map(emb.ruleIds.map((id, i) => [id, emb.vectors[i]]));
const byId = new Map(index.map((e) => [e.ruleId, e]));
const RULES = index.filter((e) => vecById.has(e.ruleId));
const RIDS = RULES.map((e) => e.ruleId);
const RN = RULES.length;
const N = index.length;

// ---- the independent recomputation of today's hybrid (tokens as shipped today) --------------------------
const STOP = new Set(["and", "are", "can", "card", "cards", "does", "for", "from", "has", "have", "how", "one", "that", "the", "this", "what", "when", "will", "with"]);
const tokenize = (v) => v.toLowerCase().split(/[^a-z0-9.]+/).map((t) => t.trim()).filter((t) => t.length >= 3 && !STOP.has(t));
const extractRuleIds = (v) => [...new Set([...v.matchAll(/\b\d{3}(?:\.\d+[a-z]?)?\b/gi)].map((m) => m[0]))];
const entryCites = new Map(index.map((e) => [e.ruleId, extractRuleIds(e.text).filter((id) => id !== e.ruleId)]));
const postings = new Map();
RULES.forEach((e, i) => { for (const t of new Set(tokenize(e.searchText))) { if (!postings.has(t)) postings.set(t, []); postings.get(t).push(i); } });
const df = new Map();
for (const e of index) for (const t of new Set(tokenize(e.searchText))) df.set(t, (df.get(t) ?? 0) + 1);
const vocabTokens = new Set([...vocab].flatMap((k) => tokenize(k)));

function addTok(map, token, mult, kw) {
  const ex = map.get(token);
  if (!ex) { map.set(token, { mult, kw }); return; }
  ex.mult = Math.max(ex.mult, mult);
  ex.kw = ex.kw || kw;
}
function lexScores(toks) {
  const lexS = new Float64Array(RN), top = new Float64Array(RN);
  for (const [token, { mult, kw }] of toks) {
    const p = postings.get(token);
    if (!p) continue;
    const idf = Math.log(N / Math.max(df.get(token) ?? 1, 1));
    const w = idf * mult * (kw ? 6 : 1);
    for (const i of p) { lexS[i] += w; if (idf > top[i]) top[i] = idf; }
  }
  return { lexS, top };
}
function boosts(qIds, questionIds) {
  const b = new Float64Array(RN);
  if (!qIds.size && !questionIds.size) return b;
  for (let i = 0; i < RN; i++) {
    const id = RIDS[i], e = byId.get(id);
    if (qIds.has(id)) b[i] += 100;
    if (e.parentRuleIds.some((p) => qIds.has(p))) b[i] += 20;
    if (questionIds.size && entryCites.get(id).some((x) => questionIds.has(x))) b[i] += 10;
  }
  return b;
}
function rank(cos, L, boost, curatedMask) {
  let maxC = 0, maxL = 0;
  for (let i = 0; i < RN; i++) { if (curatedMask[i]) continue; if (cos[i] > maxC) maxC = cos[i]; if (L.lexS[i] > maxL) maxL = L.lexS[i]; }
  const rows = [];
  for (let i = 0; i < RN; i++) {
    if (curatedMask[i]) continue;
    const s = ALPHA * (maxC > 0 ? cos[i] / maxC : 0) + (1 - ALPHA) * (maxL > 0 ? L.lexS[i] / maxL : 0) + boost[i];
    if (s > 0) rows.push([i, s]);
  }
  rows.sort((a, b) => b[1] - a[1] || L.top[b[0]] - L.top[a[0]] || parseFloat(RIDS[a[0]]) - parseFloat(RIDS[b[0]]));
  return rows.map((r) => RIDS[r[0]]);
}

// ---- cases ---------------------------------------------------------------------------------------------
const WS_DIR = join(REPO, "apps/backend/src/eval/worked-solutions");
const hardIds = new Set(existsSync(HARD25) ? JSON.parse(readFileSync(HARD25, "utf8")).ids : []);
const CASES = [];
const cardVectorByKey = new Map();
async function prep(set, c) {
  const parsed = askAiRequestSchema.safeParse(fid.buildCaseRequest(c));
  if (!parsed.success) return null;
  const request = parsed.data;
  const queryText = buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex });
  const vector = await embedder.embed(queryText);
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: "case" });
  // REQ-235: each card's own oracle text is embedded on its own, as the route handler does.
  const cardEmbeddings = new Map();
  for (const card of buildPerCardSearchTexts(request, { cardDetailIndex: resources.cardDetailIndex })) {
    if (!cardVectorByKey.has(card.key)) cardVectorByKey.set(card.key, await embedder.embed(card.text));
    const cardVector = cardVectorByKey.get(card.key);
    if (cardVector) cardEmbeddings.set(card.key, cardVector);
  }
  const options = { ...resources, queryEmbedding: vector, cardEmbeddings, collectEnrichmentDebug: true };
  const prod = preparePromptInput(request, { ...options, supplementalRuleCap: CAP });
  if (!prod.enrichmentDebug.supplemental.usedSemantic) throw new Error("semantic retrieval did not run");
  const prodTop = prod.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
  const wanted = RANK_CASES.filter(([id]) => id === c.id);
  const shippedRanks = {};
  if (wanted.length > 0) {
    const full = preparePromptInput(request, { ...options, supplementalRuleCap: index.length }).enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
    for (const [, ruleId] of wanted) shippedRanks[ruleId] = full.indexOf(ruleId) + 1 || null;
  }
  const curated = new Set((prod.enrichmentDebug.curatedGameRules.topics ?? []).flatMap((t) => t.ruleNumbers ?? []));
  const { buildPromptContext, buildLookupPromptContext } = await imp("apps/backend/src/prompt/context.ts");
  let questionText, cards;
  if (request.mode === "lookup") { questionText = request.question; cards = buildLookupPromptContext(request, resources.cardDetailIndex).cards ?? []; }
  else { const ctx = buildPromptContext(request, resources.cardDetailIndex); questionText = ctx.finalQuestion; cards = [...ctx.orderedStack, ...ctx.populatedZones.flatMap((z) => z.items)]; }
  const signal = cards.map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ");
  const qIds = new Set(extractRuleIds(`${questionText} ${signal}`));
  const questionIds = new Set(extractRuleIds(questionText));
  const toks = new Map();
  for (const t of tokenize(questionText)) addTok(toks, t, 3, vocabTokens.has(t));
  for (const t of tokenize(signal)) addTok(toks, t, 1, vocabTokens.has(t));
  const curatedMask = new Uint8Array(RN);
  RIDS.forEach((id, i) => { if (curated.has(id)) curatedMask[i] = 1; });
  const deciding = [...new Set(c.expected?.decidingRuleIds ?? [])];
  return { id: c.id, set, split: set === "suite" ? half(c.id) : set, hard: set === "suite" && hardIds.has(c.id), deciding, curated, curatedMask, queryText, L: lexScores(toks), boost: boosts(qIds, questionIds), prodTop, shippedRanks };
}
if (SETS.includes("suite")) {
  // the suite lives in the launch checkout; ask git there whether it is ignored (read-only)
  sg.assertSuiteIgnored({
    suiteDir: SUITE,
    checkIgnore: (p) => sg.gitCheckIgnore(p, { cwd: dirname(dirname(SUITE)) })
  });
  // Every selectable suite question counts, stale or not: a rule-data fix changes a snapshot hash, which
  // would otherwise drop questions from the universe the targets were measured on (1,181 usable).
  const { loadGoldCases } = await imp("scripts/lib/gold-cases.mjs");
  const { selected } = sg.selectSuiteCases(await loadGoldCases(join(SUITE, "cases"), { external: true }), sg.normalizeSuiteFilters(), {
    isStale: () => false
  });
  for (const c of selected) { const p = await prep("suite", c); if (p) CASES.push(p); }
}
if (SETS.includes("corpus")) {
  const corpus = readdirSync(WS_DIR).filter((f) => f.endsWith(".case.json")).map((f) => JSON.parse(readFileSync(`${WS_DIR}/${f}`, "utf8"))).filter((c) => c.review?.status !== "rejected");
  for (const c of corpus) { const p = await prep("corpus", c); if (p) CASES.push(p); }
}

// ---- score ---------------------------------------------------------------------------------------------
const blank = () => ({ q: 0, cites: 0, found: 0, all: 0 });
const agg = {};
const percase = {};
let mismatch = 0;
const cosFor = (c) => {
  const q = embeddingOf.get(c.id + c.set);
  let qn = 0; for (let k = 0; k < q.length; k++) qn += q[k] * q[k]; qn = Math.sqrt(qn) || 1;
  const out = new Float64Array(RN);
  for (let i = 0; i < RN; i++) {
    const v = vecById.get(RIDS[i]); let s = 0, vn = 0;
    for (let k = 0; k < q.length; k++) { s += q[k] * v[k]; vn += v[k] * v[k]; }
    out[i] = s / (qn * (Math.sqrt(vn) || 1));
  }
  return out;
};
const embeddingOf = new Map();
for (const c of CASES) embeddingOf.set(c.id + c.set, await embedder.embed(c.queryText));
const legacyRanks = [];
for (const c of CASES) {
  const fullOrder = rank(cosFor(c), c.L, c.boost, c.curatedMask);
  if (FIDELITY && fullOrder.slice(0, CAP).join() !== c.prodTop.join()) mismatch++;
  for (const [id, ruleId] of RANK_CASES) {
    if (id === c.id) legacyRanks.push(`${id} ${ruleId}: before ${fullOrder.indexOf(ruleId) + 1 || "-"}, after ${c.shippedRanks[ruleId] ?? "-"}`);
  }
  // production's own top ten is what gets scored
  const top = new Set(c.prodTop);
  const groups = c.set === "suite" ? [`suite-${c.split}`, ...(c.hard ? ["hard25"] : [])] : [c.set];
  let found = 0;
  const flags = c.deciding.map((id) => (c.curated.has(id) ? 2 : top.has(id) ? 1 : 0));
  for (const f of flags) if (f) found++;
  for (const g of groups) {
    const a = (agg[g] ??= blank());
    a.q++; a.cites += c.deciding.length; a.found += found;
    if (c.deciding.length && found === c.deciding.length) a.all++;
  }
  percase[`${c.set}:${c.id}`] = flags;
}
writeFileSync(join(OUT, FIDELITY ? "percase-fidelity.json" : "percase-shipped.json"), JSON.stringify(percase));
const g = (n) => agg[n] ?? blank();
const suiteFound = g("suite-tuning").found + g("suite-check").found;
const suiteAll = g("suite-tuning").all + g("suite-check").all;
console.log(`cases: ${SETS.map((s) => `${s} ${CASES.filter((c) => c.set === s).length}`).join(", ")}`);
if (FIDELITY) console.log(`independent recomputation differs from production's top ten on ${mismatch} questions`);
for (const line of legacyRanks) console.log(`rank ${line}`);
console.log(`${FIDELITY ? "fidelity" : "shipped search"}: suite citations ${suiteFound} / suite every-rule ${suiteAll} / hard25 ${g("hard25").found} / corpus citations ${g("corpus").found} / corpus every-rule ${g("corpus").all}`);
