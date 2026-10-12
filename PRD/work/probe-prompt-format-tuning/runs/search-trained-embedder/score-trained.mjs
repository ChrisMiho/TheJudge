// Free, local probe (no API calls, no LLM): score fine-tuned MiniLM models through production's hybrid
// rule search. Copies (does not edit) the ranking of runs/search-card-wording/card-wording-probe.mjs,
// which matches production's top 10 on every question, and swaps the meaning half's model.
//
// Model specs (--models, comma list):
//   prod      bundled production model + committed rule vectors (fidelity: must reproduce production)
//   base      the untrained base model through this probe's own ONNX export + int8 quantisation
//   F         5-fold cross-validated: practice + corpus + rule-book examples; each question is scored by
//             the fold model that never trained on it
//   C         5-fold: corpus + rule-book examples only (no practice questions)
//   <name>    any other exported model folder, used for every question (e.g. F-all)
// --dtype q8|fp32 (default q8, as production). Bench questions are spread over the fold models (i % 5).
// Pipelines: (a) "T base" = today's hybrid; (b) "F concept+per-card" = S1+S5 + concept map (x2, embedded)
// + per-card search with 2 reserved slots. Each at meaning weights 0.4–0.9; 0.6 is production.
// Prints aggregate counts only (no question text, ids, answers or cards).
// Usage (from .worktrees/probe-pft): EMBEDDING_PROVIDER=local npx tsx <this file> --models prod,base,F,C
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { conceptTerms } from "../search-card-wording/concept-map.mjs";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/practice-suite`;
const TRAIN = `${REPO}/output/models-probe/train`;
const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const SPECS = arg("--models", "prod").split(",");
const DTYPE = arg("--dtype", "q8");
const SETS = arg("--sets", "suite,corpus,bench").split(",");
const ALPHAS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const CAP = 10;
const TAG = arg("--tag", "");
mkdirSync(`${TRAIN}/vectors`, { recursive: true });
mkdirSync(`${TRAIN}/results`, { recursive: true });

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const ws = await imp("scripts/eval-worked-solutions.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const sg = await imp("scripts/lib/practice-suite.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { buildPromptContext, buildLookupPromptContext } = await imp("apps/backend/src/prompt/context.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const { LOCAL_MODEL_CACHE_DIR, LOCAL_MODEL_ID } = await imp("apps/backend/src/providers/localEmbeddingProvider.ts");
const R = await imp("apps/backend/src/gameRulesRetrieval.ts");

const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);
const half = (id) => (createHash("sha256").update("pft-split-1:" + id).digest()[0] % 2 === 0 ? "tuning" : "check");
const sha = (t) => createHash("sha256").update(t).digest("hex").slice(0, 24);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };

// ---- resources -------------------------------------------------------------------------------------
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
const DOCS = RULES.map((e) => `${e.sectionTitle}: ${e.text}`.slice(0, 2000)); // production embedding text

const STOP = new Set(["and", "are", "can", "card", "cards", "does", "for", "from", "has", "have", "how", "one", "that", "the", "this", "what", "when", "will", "with"]);
const prodTokenize = (v) => v.toLowerCase().split(/[^a-z0-9.]+/).map((t) => t.trim()).filter((t) => t.length >= 3 && !STOP.has(t));
const dotTokenize = (v) => prodTokenize(v).map((t) => t.replace(/^\.+|\.+$/g, "")).filter((t) => t.length >= 3 && !STOP.has(t));
const extractRuleIds = (v) => [...new Set([...v.matchAll(/\b\d{3}(?:\.\d+[a-z]?)?\b/gi)].map((m) => m[0]))];
const entryCites = new Map(index.map((e) => [e.ruleId, extractRuleIds(e.text).filter((id) => id !== e.ruleId)]));
function buildLex(tokenize) {
  const postings = new Map();
  RULES.forEach((e, i) => { for (const t of new Set(tokenize(e.searchText))) { if (!postings.has(t)) postings.set(t, []); postings.get(t).push(i); } });
  const df = new Map();
  for (const e of index) for (const t of new Set(tokenize(e.searchText))) df.set(t, (df.get(t) ?? 0) + 1);
  return { tokenize, postings, df, vocab: new Set([...vocab].flatMap((k) => tokenize(k))) };
}
const LEX = { today: buildLex(prodTokenize), fixed: buildLex(dotTokenize) };
function addTok(map, token, mult, kw) {
  const ex = map.get(token);
  if (!ex) { map.set(token, { mult, kw }); return; }
  ex.mult = Math.max(ex.mult, mult);
  ex.kw = ex.kw || kw;
}
// lexical scores for a token map (model-independent; cached per case)
function lexScores(lex, toks) {
  const lexS = new Float64Array(RN), top = new Float64Array(RN);
  for (const [token, { mult, kw }] of toks) {
    const p = lex.postings.get(token);
    if (!p) continue;
    const idf = Math.log(N / Math.max(lex.df.get(token) ?? 1, 1));
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
// production hybrid (divide-by-max blend, boosts, curated excluded, s > 0)
function rank(cos, L, boost, curatedMask, alpha) {
  let maxC = 0, maxL = 0;
  for (let i = 0; i < RN; i++) { if (curatedMask[i]) continue; if (cos[i] > maxC) maxC = cos[i]; if (L.lexS[i] > maxL) maxL = L.lexS[i]; }
  const rows = [];
  for (let i = 0; i < RN; i++) {
    if (curatedMask[i]) continue;
    const s = alpha * (maxC > 0 ? cos[i] / maxC : 0) + (1 - alpha) * (maxL > 0 ? L.lexS[i] / maxL : 0) + boost[i];
    if (s > 0) rows.push([i, s]);
  }
  rows.sort((a, b) => b[1] - a[1] || L.top[b[0]] - L.top[a[0]] || parseFloat(RIDS[a[0]]) - parseFloat(RIDS[b[0]]));
  return rows.map((r) => RIDS[r[0]]);
}

// ---- cases (model-independent prep) ------------------------------------------------------------------
const foldOf = new Map();
for (const l of readFileSync(`${TRAIN}/data/cases.jsonl`, "utf8").split("\n")) if (l.trim()) { const r = JSON.parse(l); foldOf.set(`${r.set}:${r.id}`, r.fold); }
const WS_DIR = `${REPO}/apps/backend/src/eval/worked-solutions`;
const NECRO = ["necropotence-silence-borne-upon-a-wind-cleanup", "necropotence-silence-borne-upon-a-wind-cleanup-in-depth"];
const hardIds = new Set(JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final);
const CASES = [];
let mismatch = 0;
const ZERO = new Float64Array(RN);
async function prep(set, c, extra = {}) {
  let request = null, queryText, prodTop = null, curated = new Set(), questionText, cards;
  if (c.bench) {
    questionText = c.bench.question;
    cards = extra.pollution;
    queryText = `${questionText} ${cards.map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ")}`;
  } else {
    const parsed = askAiRequestSchema.safeParse(fid.buildCaseRequest(c));
    if (!parsed.success) return null;
    request = parsed.data;
    queryText = buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex });
    const vector = await embedder.embed(queryText);
    fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: "case" });
    const prod = preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true, supplementalRuleCap: CAP });
    if (!prod.enrichmentDebug.supplemental.usedSemantic) throw new Error("semantic retrieval did not run");
    prodTop = prod.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
    curated = new Set((prod.enrichmentDebug.curatedGameRules.topics ?? []).flatMap((t) => t.ruleNumbers ?? []));
    if (request.mode === "lookup") { questionText = request.question; cards = buildLookupPromptContext(request, resources.cardDetailIndex).cards ?? []; }
    else { const ctx = buildPromptContext(request, resources.cardDetailIndex); questionText = ctx.finalQuestion; cards = [...ctx.orderedStack, ...ctx.populatedZones.flatMap((z) => z.items)]; }
  }
  const signal = cards.map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ");
  const qIds = new Set(extractRuleIds(`${questionText} ${signal}`));
  const questionIds = new Set(extractRuleIds(questionText));
  const uniqCards = [...new Map(cards.map((k) => [k.name, k])).values()];
  const concepts = [...new Set(uniqCards.flatMap((k) => conceptTerms(k.oracleText, k.typeLine, k.name)))];
  // (a) today's tokens
  const tA = new Map();
  for (const t of LEX.today.tokenize(questionText)) addTok(tA, t, 3, LEX.today.vocab.has(t));
  for (const t of LEX.today.tokenize(signal)) addTok(tA, t, 1, LEX.today.vocab.has(t));
  // (b) S1+S5 + concept map x2
  const tB = new Map();
  for (const t of LEX.fixed.tokenize(questionText)) addTok(tB, t, 3, LEX.fixed.vocab.has(t));
  const cardKw = new Set(cards.flatMap((k) => (k.keywords ?? []).flatMap((kw) => LEX.fixed.tokenize(kw))));
  for (const t of LEX.fixed.tokenize(signal)) addTok(tB, t, 1, LEX.fixed.vocab.has(t) || cardKw.has(t));
  for (const t of LEX.fixed.tokenize(concepts.join(" "))) addTok(tB, t, 2, false);
  const perCard = [];
  for (const k of uniqCards) {
    let text = k.oracleText ?? "";
    if (k.name) for (const part of k.name.split(" // ")) text = text.split(part).join("this");
    if (!text.trim()) continue;
    const ct = new Map();
    for (const t of LEX.fixed.tokenize(text)) addTok(ct, t, 1, false);
    perCard.push({ text, L: lexScores(LEX.fixed, ct) });
  }
  const curatedMask = new Uint8Array(RN);
  RIDS.forEach((id, i) => { if (curated.has(id)) curatedMask[i] = 1; });
  const deciding = [...new Set(c.expected?.decidingRuleIds ?? [])];
  const out = {
    id: c.id, set, split: set === "suite" ? half(c.id) : set, hard: set === "suite" && hardIds.has(c.id), necro: set === "corpus" ? NECRO.indexOf(c.id) : -1,
    fold: c.bench ? extra.i % 5 : foldOf.get(`${set}:${c.id}`), deciding, curated, curatedMask,
    qA: queryText, qB: `${queryText} ${concepts.length ? concepts.join(", ") : ""}`.trim(),
    LA: lexScores(LEX.today, tA), LB: lexScores(LEX.fixed, tB), boost: boosts(qIds, questionIds), perCard, prodTop
  };
  if (out.fold === undefined) throw new Error("case without a fold");
  return out;
}
if (SETS.includes("suite")) {
  sg.assertSuiteIgnored({ suiteDir: SUITE });
  const { selected } = await ws.loadSuiteSelection({ suiteDir: SUITE });
  for (const c of selected) { const p = await prep("suite", c); if (p) CASES.push(p); }
}
if (SETS.includes("corpus")) {
  const corpus = readdirSync(WS_DIR).filter((f) => f.endsWith(".case.json")).map((f) => JSON.parse(readFileSync(`${WS_DIR}/${f}`, "utf8"))).filter((c) => c.review?.status !== "rejected");
  for (const c of corpus) { const p = await prep("corpus", c); if (p) CASES.push(p); }
}
if (SETS.includes("bench")) {
  const B = await imp("apps/backend/src/eval/ragRetrievalBenchmark.ts");
  const names = B.loadCardNameByOracleId();
  const ids = [...resources.cardDetailIndex.keys()].sort();
  const pollution = [1000, 9000, 20000].map((i) => ids[i % ids.length]).map((id) => ({ name: names.get(id) ?? "", ...resources.cardDetailIndex.get(id) }));
  const items = B.loadBenchmarkCorpus().items;
  for (const [i, it] of items.entries()) { const p = await prep("bench", { id: `bench-${i}`, bench: it, expected: { decidingRuleIds: [it.expectedRuleId] } }, { pollution, i }); CASES.push(p); }
}
console.log(`cases: ${["suite", "corpus", "bench"].map((s) => `${s} ${CASES.filter((c) => c.set === s).length}`).join(", ")}`);

// ---- models + vector caches ------------------------------------------------------------------------------
let hf;
async function loadPipe(concrete) {
  hf ??= await import("@huggingface/transformers");
  hf.env.allowRemoteModels = false;
  if (concrete === "prod") { hf.env.cacheDir = LOCAL_MODEL_CACHE_DIR; return hf.pipeline("feature-extraction", LOCAL_MODEL_ID, { dtype: "q8" }); }
  hf.env.allowLocalModels = true;
  hf.env.localModelPath = `${TRAIN}/onnx/`;
  return hf.pipeline("feature-extraction", `trained/${concrete}`, { dtype: DTYPE });
}
function loadCache(name) {
  const p = `${TRAIN}/vectors/${name}.json`;
  if (!existsSync(p)) return new Map();
  const { d, keys } = JSON.parse(readFileSync(p, "utf8"));
  const b = readFileSync(`${TRAIN}/vectors/${name}.f32`);
  const all = new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
  return new Map(keys.map((k, i) => [k, all.subarray(i * d, (i + 1) * d)]));
}
function saveCache(name, m) {
  const keys = [...m.keys()]; const d = m.get(keys[0]).length;
  const buf = new Float32Array(keys.length * d); keys.forEach((k, i) => buf.set(m.get(k), i * d));
  writeFileSync(`${TRAIN}/vectors/${name}.f32`, Buffer.from(buf.buffer));
  writeFileSync(`${TRAIN}/vectors/${name}.json`, JSON.stringify({ d, keys }));
}
// returns { docMat (unit rows), qvec(text) } for a concrete model; embeds what is missing
async function prepareModel(concrete, texts) {
  const cname = `${concrete}__${concrete === "prod" ? "q8" : DTYPE}`;
  const cache = loadCache(cname);
  const need = [...new Set([...(concrete === "prod" ? [] : DOCS), ...texts])].filter((t) => !cache.has(sha(t)));
  const qms = [];
  if (need.length) {
    const ex = await loadPipe(concrete);
    // rule book in batches; queries one at a time (timed)
    const docSet = new Set(DOCS);
    const docNeed = need.filter((t) => docSet.has(t)), qNeed = need.filter((t) => !docSet.has(t));
    for (let s = 0; s < docNeed.length; s += 16) {
      const batch = docNeed.slice(s, s + 16);
      const out = await ex(batch, { pooling: "mean", normalize: true });
      const d = out.dims[1];
      batch.forEach((t, j) => cache.set(sha(t), Float32Array.from(out.data.subarray(j * d, (j + 1) * d))));
    }
    for (const t of qNeed) { const t0 = performance.now(); const out = await ex(t, { pooling: "mean", normalize: true }); qms.push(performance.now() - t0); cache.set(sha(t), Float32Array.from(out.data)); }
    await ex.dispose?.();
    saveCache(cname, cache);
  }
  const d = 384;
  const docMat = new Float32Array(RN * d);
  RULES.forEach((e, i) => {
    const v = concrete === "prod" ? vecById.get(e.ruleId) : cache.get(sha(DOCS[i]));
    let n = 0; for (let k = 0; k < d; k++) n += v[k] * v[k];
    n = Math.sqrt(n) || 1;
    for (let k = 0; k < d; k++) docMat[i * d + k] = v[k] / n;
  });
  const cos = (text) => {
    const q = cache.get(sha(text)); let qn = 0; for (let k = 0; k < d; k++) qn += q[k] * q[k]; qn = Math.sqrt(qn) || 1;
    const out = new Float64Array(RN);
    for (let i = 0; i < RN; i++) { let s = 0; const o = i * d; for (let k = 0; k < d; k++) s += q[k] * docMat[o + k]; out[i] = s / qn; }
    return out;
  };
  return { cos, qms };
}

// ---- scoring -----------------------------------------------------------------------------------------------
const PIPES = ["a", "b"];
const blank = () => ({ q: 0, cites: 0, found: 0, f5: 0, all: 0, m10: 0, m100: 0, h100: 0, miss: [] });
function scoreCase(c, M, alpha, pipe, agg, necroOut) {
  let order;
  if (pipe === "a") order = rank(M.cosA, c.LA, c.boost, c.curatedMask, alpha);
  else {
    order = rank(M.cosB, c.LB, c.boost, c.curatedMask, alpha);
    const lists = c.perCard.map((pc, j) => rank(M.cosCards[j], pc.L, ZERO, c.curatedMask, alpha));
    if (lists.length) {
      const keep = order.slice(0, CAP - 2), chosen = new Set(keep), picks = [];
      for (let depth = 0; depth < 5 && picks.length < 2; depth++) for (const L of lists) { const id = L[depth]; if (id && !chosen.has(id) && picks.length < 2) { chosen.add(id); picks.push(id); } }
      order = [...keep, ...picks, ...order.filter((id) => !chosen.has(id))];
    }
  }
  const pos = new Map(order.map((id, i) => [id, i + 1]));
  let mpos = null;
  if (pipe === "a") { const mo = []; for (let i = 0; i < RN; i++) if (!c.curatedMask[i]) mo.push(i); mo.sort((x, y) => M.cosA[y] - M.cosA[x]); mpos = new Map(mo.map((i, r) => [RIDS[i], r + 1])); }
  let found = 0;
  for (const id of c.deciding) {
    const cur = c.curated.has(id), p = cur ? 0 : pos.get(id) ?? 99999;
    agg.cites++;
    if (p <= 10) found++; else if (p < 99999) agg.miss.push(p);
    if (p <= 5) agg.f5++;
    if (p <= 100) agg.h100++;
    if (mpos) { const mp = cur ? 0 : mpos.get(id) ?? 99999; if (mp <= 10) agg.m10++; if (mp <= 100) agg.m100++; }
  }
  agg.q++; agg.found += found;
  if (c.deciding.length && found === c.deciding.length) agg.all++;
  if (necroOut && c.necro >= 0) necroOut[c.necro] = ["514.1", "514.2", "514.3a"].map((id) => (c.curated.has(id) ? "cur" : pos.get(id) ?? "—")).join("/");
  return order;
}
const groupsOf = (c) => c.set === "suite" ? [`suite-${c.split}`, ...(c.hard ? ["hard25"] : [])] : [c.set];

const results = {};
for (const spec of SPECS) {
  const t0 = performance.now();
  const concreteFor = (c) => (spec === "F" || spec === "C" ? `${spec}-fold${c.fold}` : spec);
  const byConcrete = new Map();
  for (const c of CASES) { const k = concreteFor(c); if (!byConcrete.has(k)) byConcrete.set(k, []); byConcrete.get(k).push(c); }
  const percase = {};
  const res = {}; // key `${pipe}|${alpha}` -> { agg by group, necro }
  for (const p of PIPES) for (const a of ALPHAS) res[`${p}|${a}`] = { agg: {}, necro: [] };
  let qms = [];
  for (const [concrete, cs] of byConcrete) {
    const texts = cs.flatMap((c) => [c.qA, c.qB, ...c.perCard.map((pc) => pc.text)]);
    const M = await prepareModel(concrete, texts);
    qms = qms.concat(M.qms);
    for (const c of cs) {
      const MM = { cosA: M.cos(c.qA), cosB: M.cos(c.qB), cosCards: c.perCard.map((pc) => M.cos(pc.text)) };
      for (const p of PIPES) for (const a of ALPHAS) {
        const r = res[`${p}|${a}`];
        let ord;
        for (const g of groupsOf(c)) ord = scoreCase(c, MM, a, p, (r.agg[g] ??= blank()), r.necro);
        // per-question top-10 hits (git-ignored results folder only; used by leak-check.mjs)
        const top = new Set(ord.slice(0, 10));
        (percase[`${p}|${a}`] ??= {})[`${c.set}:${c.id}`] = c.deciding.map((id) => (c.curated.has(id) ? 2 : top.has(id) ? 1 : 0));
        if (spec === "prod" && p === "a" && a === 0.6 && c.prodTop && ord.slice(0, 10).join() !== c.prodTop.join()) mismatch++;
      }
    }
    console.log(`  [${spec}] ${concrete}: ${cs.length} questions scored`);
  }
  results[spec] = { res, qms: med(qms), secs: (performance.now() - t0) / 1000 };
  writeFileSync(`${TRAIN}/results/percase-${spec}-${DTYPE}.json`, JSON.stringify(percase));
  if (spec === "prod") console.log(`Fidelity: prod spec top 10 differs from production on ${mismatch} questions`);
}

// ---- report ---------------------------------------------------------------------------------------------
const g = (r, n) => r.agg[n] ?? blank();
const line = (spec, p, a, r, tag = "") => {
  const st = g(r, "suite-tuning"), sc = g(r, "suite-check"), h = g(r, "hard25"), co = g(r, "corpus"), be = g(r, "bench");
  const sCites = st.cites + sc.cites;
  const pct = (x) => `${((100 * x) / (sCites || 1)).toFixed(1)}%`;
  return `${spec.padEnd(6)} ${p} α${a.toFixed(1)}${tag.padEnd(7)} | suite ${String(st.found + sc.found).padStart(4)}/${sCites} | tun ${st.found} chk ${sc.found} | every ${st.all + sc.all} (${st.all}/${sc.all}) | hard25 ${h.found}/${h.cites} | corpus ${co.found}/${co.all} of ${co.cites} | bench top5 ${be.f5}/${be.cites} | necro Q ${r.necro[0] ?? "-"} ID ${r.necro[1] ?? "-"} | ` +
    (p === "a" ? `meaning r@10 ${pct(st.m10 + sc.m10)} r@100 ${pct(st.m100 + sc.m100)} | ` : "") + `hybrid r@100 ${pct(st.h100 + sc.h100)} | miss median ${med([...st.miss, ...sc.miss])}`;
};
const summary = [];
for (const spec of SPECS) {
  const { res, qms, secs } = results[spec];
  console.log(`\n== ${spec} (dtype ${spec === "prod" ? "q8 + committed vectors" : DTYPE}; median single-query embed ${qms ? qms.toFixed(1) : "cached"} ms; ${secs.toFixed(0)} s)`);
  for (const p of PIPES) {
    for (const a of ALPHAS) console.log(line(spec, p, a, res[`${p}|${a}`]));
    // weight re-tuned on the tuning half (cross-validated scores); the check half stays honest
    const best = ALPHAS.map((a) => [a, g(res[`${p}|${a}`], "suite-tuning").found]).sort((x, y) => y[1] - x[1] || Math.abs(x[0] - 0.6) - Math.abs(y[0] - 0.6))[0][0];
    summary.push(line(spec, p, 0.6, res[`${p}|0.6`]));
    if (best !== 0.6) summary.push(line(spec, p, best, res[`${p}|${best}`], " tuned"));
  }
}
console.log(`\n==== SUMMARY (pipeline a = today's hybrid; b = S1+S5 + concept map + per-card search; "tuned" = weight picked on the tuning half) ====`);
for (const s of summary) console.log(s);
writeFileSync(`${TRAIN}/results/score${TAG ? `-${TAG}` : ""}-${SPECS.join("_")}-${DTYPE}.json`, JSON.stringify(Object.fromEntries(Object.entries(results).map(([k, v]) => [k, { ...v, res: Object.fromEntries(Object.entries(v.res).map(([kk, r]) => [kk, { necro: r.necro, agg: Object.fromEntries(Object.entries(r.agg).map(([gg, x]) => [gg, { ...x, miss: med(x.miss) }])) }])) }]))));
