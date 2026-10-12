// Free, local probe (no API calls, no LLM): (1) does proper word scoring (BM25-style, stemming,
// negation, keyword-list trim, re-tuned blend or rank fusion) beat today's word-match formula?
// (2) what does every search win stacked together score?
// Copies (does not edit) runs/search-card-wording/card-wording-probe.mjs (production hybrid
// re-implementation, S1+S5, concept map, per-card search) and runs/search-embedder (variant C
// labelled-piece MiniLM vectors, read from the worktree vector cache).
//
// Usage (from .worktrees/probe-pft):
//   EMBEDDING_PROVIDER=local npx tsx <this file> --plan repro|part1|part1b|part2|diag-stem
// Practice-suite output is aggregate counts and rule ids only. Corpus cases may be named.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { conceptTerms } from "./concept-map.mjs";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/practice-suite`;
const OUT = `${REPO}/output/models-probe/bm25-stack`;
const VEC_C = `${REPO}/output/models-probe/embedder/vectors/minilm__C__3d7ac9295f32dba05292bec5`;
mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const PLAN = arg("--plan", "repro");
const CAP = 10;

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

// ---- resources -------------------------------------------------------------------------------------
const resources = await fid.loadPromptResources({ env });
const index = resources.gameRulesRuleIndex;
const N = index.length;
const RIDS = index.map((e) => e.ruleId);
const idxOf = new Map(RIDS.map((id, i) => [id, i]));
const NUM = Float64Array.from(RIDS, (id) => parseFloat(id));
const vocab = R.loadGameRulesKeywordVocabulary(join(REPO, "apps/backend/data/gameRulesKeywordVocabulary.json"));
const emb = R.loadGameRulesRuleEmbeddings(join(REPO, "apps/backend/data/gameRulesRuleEmbeddings.json"));
const vecById = new Map(emb.ruleIds.map((id, i) => [id, emb.vectors[i]]));
const RVEC_P = RIDS.map((id) => vecById.get(id));
if (RVEC_P.some((v) => !v)) throw new Error("rule without production vector");
// variant C labelled-piece vectors (one per rule, index order) from the search-embedder probe cache
const cMeta = JSON.parse(readFileSync(`${VEC_C}.json`, "utf8"));
if (cMeta.keys.length !== N) throw new Error("variant C cache size mismatch");
const cBuf = readFileSync(`${VEC_C}.f32`);
const cAll = new Float32Array(cBuf.buffer, cBuf.byteOffset, cBuf.byteLength / 4);
const RVEC_C = RIDS.map((_, i) => Array.from(cAll.subarray(i * cMeta.d, (i + 1) * cMeta.d)));
const TEXTLEN = Int32Array.from(index, (e) => e.text.length);

const { env: hfEnv, pipeline } = await import("@huggingface/transformers");
hfEnv.allowRemoteModels = false;
hfEnv.cacheDir = LOCAL_MODEL_CACHE_DIR;
const extractor = await pipeline("feature-extraction", LOCAL_MODEL_ID, { dtype: "q8" });
const tok = extractor.tokenizer;
const pieceLen = (t) => { const x = tok(t).input_ids; return (x.data ?? x).length; };
const LONG = Uint8Array.from(index, (e) => (pieceLen(`${e.sectionTitle}: ${e.text}`.slice(0, 2000)) > 256 ? 1 : 0));
console.log(`Rule book: ${N} pieces; longer than 256 word pieces: ${LONG.reduce((a, b) => a + b, 0)}`);

// ---- vector cache (disk; hash keys only, no text stored) -------------------------------------------
const VC_FILE = `${OUT}/qvec-cache.json`;
const vcache = existsSync(VC_FILE) ? new Map(Object.entries(JSON.parse(readFileSync(VC_FILE, "utf8")))) : new Map();
let vcDirty = 0;
async function vec(kind, text) {
  const k = `${kind}:${sha(text)}`;
  if (vcache.has(k)) return vcache.get(k);
  const t0 = performance.now();
  const v = kind === "prod" ? Array.from(await embedder.embed(text)) : Array.from((await extractor(text, { pooling: "mean", normalize: true })).data);
  const rec = { v, ms: performance.now() - t0 };
  vcache.set(k, rec); vcDirty++;
  return rec;
}
const saveVc = () => { if (vcDirty) { writeFileSync(VC_FILE, JSON.stringify(Object.fromEntries(vcache))); vcDirty = 0; } };
const cosArr = (v, M) => { const o = new Float64Array(N); for (let i = 0; i < N; i++) o[i] = R.cosineSimilarity(v, M[i]); return o; };

// ---- tokenizers -------------------------------------------------------------------------------------
const STOP = new Set(["and", "are", "can", "card", "cards", "does", "for", "from", "has", "have", "how", "one", "that", "the", "this", "what", "when", "will", "with"]);
const SIX_VERBS = new Set(["counter", "destroy", "exile", "sacrifice", "trigger", "replacement"]);
// Porter (1980) stemmer, standard JS rendering of the published algorithm
const step2 = { ational: "ate", tional: "tion", enci: "ence", anci: "ance", izer: "ize", bli: "ble", alli: "al", entli: "ent", eli: "e", ousli: "ous", ization: "ize", ation: "ate", ator: "ate", alism: "al", iveness: "ive", fulness: "ful", ousness: "ous", aliti: "al", iviti: "ive", biliti: "ble", logi: "log" };
const step3 = { icate: "ic", ative: "", alize: "al", iciti: "ic", ical: "ic", ful: "", ness: "" };
const cC = "[^aeiou]", cV = "[aeiouy]", CS = cC + "[^aeiouy]*", VS = cV + "[aeiou]*";
const mgr0 = new RegExp("^(" + CS + ")?" + VS + CS), meq1 = new RegExp("^(" + CS + ")?" + VS + CS + "(" + VS + ")?$"), mgr1 = new RegExp("^(" + CS + ")?" + VS + CS + VS + CS), sV = new RegExp("^(" + CS + ")?" + cV);
const cvc = new RegExp("^" + CS + cV + "[^aeiouwxy]$");
function porter(w) {
  if (w.length < 3) return w;
  let m, stem; const y0 = w[0] === "y";
  if (y0) w = "Y" + w.slice(1);
  if ((m = /^(.+?)(ss|i)es$/.exec(w))) w = m[1] + m[2]; else if ((m = /^(.+?)([^s])s$/.exec(w))) w = m[1] + m[2];
  if ((m = /^(.+?)eed$/.exec(w))) { if (mgr0.test(m[1])) w = w.slice(0, -1); }
  else if ((m = /^(.+?)(ed|ing)$/.exec(w))) { stem = m[1]; if (sV.test(stem)) { w = stem; if (/(at|bl|iz)$/.test(w)) w += "e"; else if (/([^aeiouylsz])\1$/.test(w)) w = w.slice(0, -1); else if (cvc.test(w)) w += "e"; } }
  if ((m = /^(.+?)y$/.exec(w)) && sV.test(m[1])) w = m[1] + "i";
  if ((m = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/.exec(w)) && mgr0.test(m[1])) w = m[1] + step2[m[2]];
  if ((m = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/.exec(w)) && mgr0.test(m[1])) w = m[1] + step3[m[2]];
  if ((m = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/.exec(w))) { if (mgr1.test(m[1])) w = m[1]; }
  else if ((m = /^(.+?)(s|t)(ion)$/.exec(w))) { if (mgr1.test(m[1] + m[2])) w = m[1] + m[2]; }
  if ((m = /^(.+?)e$/.exec(w))) { stem = m[1]; if (mgr1.test(stem) || (meq1.test(stem) && !cvc.test(stem))) w = stem; }
  if (/ll$/.test(w) && mgr1.test(w)) w = w.slice(0, -1);
  if (y0) w = "y" + w.slice(1);
  return w;
}
// the audit's light stemmer (S3 as measured) and a plural-only stemmer, for the diagnosis
const light = (w) => { let s = w.replace(/ies$/, "y"); for (const suf of ["ing", "ed", "s"]) if (s.endsWith(suf) && !s.endsWith("ss") && s.length - suf.length >= 3) { s = s.slice(0, -suf.length); break; } return s.replace(/([b-df-hj-np-tv-z])\1$/, "$1").replace(/e$/, ""); };
const plural = (w) => (/ies$/.test(w) && w.length > 4 ? w.slice(0, -3) + "y" : /(ss|us|is)$/.test(w) ? w : /es$/.test(w) && /(sh|ch|x|z)es$/.test(w) ? w.slice(0, -2) : /s$/.test(w) && w.length > 3 ? w.slice(0, -1) : w);
const STEMMERS = { porter, light, plural };
const negNorm = (s) => s.replace(/[‘’]/g, "'").replace(/\bcan't\b/gi, "cannot").replace(/\bwon't\b/gi, "will not").replace(/n't\b/gi, " not");
// key: "p" production | "d" dots stripped (S5); suffix "n" negation (D13); ":<stemmer>"
function makeTokenizer(key) {
  const [base, stemName] = key.split(":");
  const dots = base.includes("d"), neg = base.includes("n");
  const st = stemName ? STEMMERS[stemName] : null;
  return (v) => {
    let t = (neg ? negNorm(v) : v).toLowerCase().split(/[^a-z0-9.]+/).map((x) => x.trim()).filter((x) => x.length >= 3 && !STOP.has(x));
    if (dots) t = t.map((x) => x.replace(/^\.+|\.+$/g, "")).filter((x) => x.length >= 3 && !STOP.has(x));
    if (st) t = t.map((x) => (/[\d.]/.test(x) ? x : st(x))).filter((x) => x.length >= 3 && !STOP.has(x));
    return t;
  };
}
const LEXES = new Map();
function getLex(key) {
  if (LEXES.has(key)) return LEXES.get(key);
  const tokenize = makeTokenizer(key);
  const dl = new Float64Array(N);
  const df = new Map(), post = new Map();
  index.forEach((e, i) => {
    const ts = tokenize(e.searchText);
    dl[i] = ts.length;
    const tf = new Map();
    for (const t of ts) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const [t, n] of tf) { df.set(t, (df.get(t) ?? 0) + 1); if (!post.has(t)) post.set(t, [[], []]); post.get(t)[0].push(i); post.get(t)[1].push(n); }
  });
  const postings = new Map([...post].map(([t, [a, b]]) => [t, { idx: Int32Array.from(a), tf: Float64Array.from(b) }]));
  const avgdl = dl.reduce((a, b) => a + b, 0) / N;
  const vk = [...vocab].flatMap((k) => tokenize(k));
  const lex = { key, tokenize, dl, avgdl, df, postings, vocabFull: new Set(vk), vocabTrim: new Set([...vocab].filter((k) => !SIX_VERBS.has(k)).flatMap((k) => tokenize(k))) };
  LEXES.set(key, lex);
  return lex;
}

// ---- cases ------------------------------------------------------------------------------------------
const extractRuleIds = (v) => [...new Set([...v.matchAll(/\b\d{3}(?:\.\d+[a-z]?)?\b/gi)].map((m) => m[0]))];
const entryCites = index.map((e) => extractRuleIds(e.text).filter((id) => id !== e.ruleId));
const WS_DIR = `${REPO}/apps/backend/src/eval/worked-solutions`;
const NECRO = { "necropotence-silence-borne-upon-a-wind-cleanup": "necroQ", "necropotence-silence-borne-upon-a-wind-cleanup-in-depth": "necroD" };
const CARDS = new Map(); // name -> { text, P, C, ms }
const CASES = [];
let mismatch = 0, checked = 0, skipped = 0;

async function addCase({ id, groups, questionText, cards, queryText, baseVec, curated, prodTop, deciding }) {
  const signal = cards.map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ");
  const qIds = new Set(extractRuleIds(`${questionText} ${signal}`));
  const questionIds = new Set(extractRuleIds(questionText));
  const uniq = [...new Map(cards.map((k) => [k.name, k])).values()];
  const concepts = [...new Set(uniq.flatMap((k) => conceptTerms(k.oracleText, k.typeLine, k.name)))];
  const conceptVec = concepts.length ? (await vec("ext", `${queryText} ${concepts.join(", ")}`.trim())).v : baseVec;
  const boost = [];
  if (qIds.size || questionIds.size) for (let i = 0; i < N; i++) {
    const e = index[i]; let b = 0;
    if (qIds.has(e.ruleId)) b += 100;
    if (e.parentRuleIds.some((p) => qIds.has(p))) b += 20;
    if (questionIds.size && entryCites[i].some((x) => questionIds.has(x))) b += 10;
    if (b) boost.push([i, b]);
  }
  const cardNames = [];
  for (const k of uniq) {
    let text = k.oracleText ?? "";
    if (k.name) for (const part of k.name.split(" // ")) text = text.split(part).join("this");
    if (!text.trim()) continue;
    if (!CARDS.has(k.name)) {
      const r = await vec("ext", text);
      CARDS.set(k.name, { text, P: cosArr(r.v, RVEC_P), C: cosArr(r.v, RVEC_C), ms: r.ms });
    }
    cardNames.push(k.name);
  }
  const excl = new Uint8Array(N);
  for (const r of curated) if (idxOf.has(r)) excl[idxOf.get(r)] = 1;
  CASES.push({
    id, groups, questionText, signal, cardKw: cards.flatMap((k) => k.keywords ?? []), conceptStr: concepts.join(" "), cardNames,
    cos: { P: cosArr(baseVec, RVEC_P), C: cosArr(baseVec, RVEC_C), Pc: concepts.length ? cosArr(conceptVec, RVEC_P) : null, Cc: concepts.length ? cosArr(conceptVec, RVEC_C) : null },
    boost, excl, curated, curKey: [...curated].sort().join(","), prodTop, deciding, decIdx: deciding.map((d) => idxOf.get(d) ?? -1)
  });
}

async function loadRequestCase(c, groups) {
  const parsed = askAiRequestSchema.safeParse(fid.buildCaseRequest(c));
  if (!parsed.success) { skipped++; return; }
  const request = parsed.data;
  const queryText = buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex });
  const baseVec = (await vec("prod", queryText)).v;
  const prod = preparePromptInput(request, { ...resources, queryEmbedding: baseVec, collectEnrichmentDebug: true, supplementalRuleCap: CAP });
  if (!prod.enrichmentDebug.supplemental.usedSemantic) throw new Error("semantic retrieval did not run");
  const prodTop = prod.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
  const curated = new Set((prod.enrichmentDebug.curatedGameRules.topics ?? []).flatMap((t) => t.ruleNumbers ?? []));
  let questionText, cards;
  if (request.mode === "lookup") { questionText = request.question; cards = buildLookupPromptContext(request, resources.cardDetailIndex).cards ?? []; }
  else { const ctx = buildPromptContext(request, resources.cardDetailIndex); questionText = ctx.finalQuestion; cards = [...ctx.orderedStack, ...ctx.populatedZones.flatMap((z) => z.items)]; }
  await addCase({ id: c.id, groups, questionText, cards, queryText, baseVec, curated, prodTop, deciding: [...new Set(c.expected?.decidingRuleIds ?? [])] });
}

const t0load = performance.now();
sg.assertSuiteIgnored({ suiteDir: SUITE });
const { selected } = await ws.loadSuiteSelection({ suiteDir: SUITE });
const hardIds = new Set(JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final);
for (const c of selected) await loadRequestCase(c, ["suite", `suite-${half(c.id)}`, ...(hardIds.has(c.id) ? ["hard25"] : [])]);
saveVc();
const corpus = readdirSync(WS_DIR).filter((f) => f.endsWith(".case.json")).map((f) => JSON.parse(readFileSync(`${WS_DIR}/${f}`, "utf8"))).filter((c) => c.review?.status !== "rejected");
for (const c of corpus) await loadRequestCase(c, ["corpus", ...(NECRO[c.id] ? [NECRO[c.id]] : [])]);
saveVc();
{ // benchmark with three unrelated cards attached (card-wording probe's --set bench)
  const B = await imp("apps/backend/src/eval/ragRetrievalBenchmark.ts");
  const names = B.loadCardNameByOracleId();
  const ids = [...resources.cardDetailIndex.keys()].sort();
  const POLL = [1000, 9000, 20000].map((i) => ids[i % ids.length]).map((id) => ({ name: names.get(id) ?? "", ...resources.cardDetailIndex.get(id) }));
  const sig = POLL.map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ");
  for (const [i, it] of B.loadBenchmarkCorpus().items.entries()) {
    const queryText = `${it.question} ${sig}`;
    await addCase({ id: `bench-${i}`, groups: ["bench"], questionText: it.question, cards: POLL, queryText, baseVec: (await vec("ext", queryText)).v, curated: new Set(), prodTop: null, deciding: [it.expectedRuleId] });
  }
}
saveVc();
const cardMs = [...CARDS.values()].map((c) => c.ms).sort((a, b) => a - b);
console.log(`Loaded ${CASES.length} cases (${skipped} skipped) and ${CARDS.size} distinct card texts in ${((performance.now() - t0load) / 1000).toFixed(0)} s; per-card embed median ${cardMs[cardMs.length >> 1]?.toFixed(1)} ms`);

// ---- ranking ----------------------------------------------------------------------------------------
// cfg: { tok, s1, trim, scorer: {t:"today"} | {t:"bm25",k1,b,idf:"bm25"|"log"}, blend: {t:"a",a} | {t:"rrf",k,w}, concept, perCard, vecs: "P"|"C", qw (question mult), kwm (keyword mult) }
function lexScore(lex, toks, sc, lexS, top) {
  lexS.fill(0); top.fill(0);
  for (const [t, { mult, kw }] of toks) {
    const p = lex.postings.get(t);
    if (!p) continue;
    const d = lex.df.get(t) ?? 1;
    const idfT = Math.log(N / Math.max(d, 1));
    const { idx, tf } = p;
    if (sc.t === "today") {
      const w = idfT * mult * (kw ? sc.kwm ?? 6 : 1);
      for (let j = 0; j < idx.length; j++) { const i = idx[j]; lexS[i] += w; if (idfT > top[i]) top[i] = idfT; }
    } else {
      const idf = sc.idf === "log" ? idfT : Math.log(1 + (N - d + 0.5) / (d + 0.5));
      const w = idf * mult * (kw ? sc.kwm ?? 6 : 1), k1 = sc.k1, b = sc.b, avg = lex.avgdl, dl = lex.dl;
      for (let j = 0; j < idx.length; j++) { const i = idx[j], f = tf[j]; lexS[i] += (w * f * (k1 + 1)) / (f + k1 * (1 - b + (b * dl[i]) / avg)); if (idfT > top[i]) top[i] = idfT; }
    }
  }
}
const lexS = new Float64Array(N), TOP = new Float64Array(N), SCORE = new Float64Array(N), VALID = new Uint8Array(N);
const rankBuf = new Int32Array(N);
function orderOf(arr, valid) { // returns rank (1-based) by arr desc among valid; ties by index
  const ids = []; for (let i = 0; i < N; i++) if (valid[i] && arr[i] > 0) ids.push(i);
  ids.sort((a, b) => arr[b] - arr[a] || a - b);
  const r = new Int32Array(N).fill(0); ids.forEach((i, k) => (r[i] = k + 1));
  return r;
}
function blendInto(cos, excl, boost, blend, lexS, top, out, valid) {
  if (blend.t === "a") {
    let maxC = 0, maxL = 0;
    for (let i = 0; i < N; i++) { if (excl[i]) continue; if (cos[i] > maxC) maxC = cos[i]; if (lexS[i] > maxL) maxL = lexS[i]; }
    const a = blend.a, wl = blend.wl;
    for (let i = 0; i < N; i++) out[i] = a * (maxC > 0 ? cos[i] / maxC : 0) + wl * (maxL > 0 ? lexS[i] / maxL : 0);
  } else {
    const rm = orderOf(cos, excl.map((x) => 1 - x)), rl = orderOf(lexS, excl.map((x) => 1 - x));
    for (let i = 0; i < N; i++) out[i] = (rm[i] ? blend.w / (blend.k + rm[i]) : 0) + (rl[i] ? (1 - blend.w) / (blend.k + rl[i]) : 0);
  }
  for (const [i, b] of boost) out[i] += b;
  for (let i = 0; i < N; i++) valid[i] = !excl[i] && out[i] > 0 ? 1 : 0;
}
const better = (s, top, j, i) => s[j] > s[i] || (s[j] === s[i] && (top[j] > top[i] || (top[j] === top[i] && NUM[j] < NUM[i])));
function topK(s, top, valid, K) {
  const best = [];
  for (let i = 0; i < N; i++) {
    if (!valid[i]) continue;
    if (best.length === K && !better(s, top, i, best[K - 1])) continue;
    let p = best.length === K ? K - 1 : best.length;
    if (best.length < K) best.push(i); else best[K - 1] = i;
    while (p > 0 && better(s, top, i, best[p - 1])) { best[p] = best[p - 1]; best[p - 1] = i; p--; }
  }
  return best;
}
function rankOf(s, top, valid, i) {
  if (i < 0 || !valid[i]) return Infinity;
  let r = 1; for (let j = 0; j < N; j++) if (valid[j] && j !== i && better(s, top, j, i)) r++;
  return r;
}
function queryToks(lex, cfg, c) {
  const vocabSet = cfg.trim ? lex.vocabTrim : lex.vocabFull;
  const toks = new Map();
  const add = (t, mult, kw) => { const ex = toks.get(t); if (!ex) toks.set(t, { mult, kw }); else { ex.mult = Math.max(ex.mult, mult); ex.kw = ex.kw || kw; } };
  for (const t of lex.tokenize(c.questionText)) add(t, cfg.qw ?? 3, vocabSet.has(t));
  const cardKw = cfg.s1 ? new Set(c.cardKw.flatMap((k) => lex.tokenize(k))) : null;
  for (const t of lex.tokenize(c.signal)) add(t, 1, vocabSet.has(t) || (cardKw?.has(t) ?? false));
  if (cfg.concept && c.conceptStr) for (const t of lex.tokenize(c.conceptStr)) add(t, cfg.conceptMult ?? 2, false);
  return toks;
}
const perCardMemo = new Map();
function perCardList(cfg, ckey, lex, name, c) {
  const k = `${ckey}|${name}|${c.curKey}`;
  if (perCardMemo.has(k)) return perCardMemo.get(k);
  const card = CARDS.get(name);
  const toks = new Map(); for (const t of lex.tokenize(card.text)) if (!toks.has(t)) toks.set(t, { mult: 1, kw: false });
  const ls = new Float64Array(N), tp = new Float64Array(N), s = new Float64Array(N), v = new Uint8Array(N);
  lexScore(lex, toks, cfg.scorer, ls, tp);
  blendInto(card[cfg.vecs], c.excl, [], cfg.blend, ls, tp, s, v);
  const L = topK(s, tp, v, 5 + 10);
  perCardMemo.set(k, L);
  return L;
}
const blank = () => ({ q: 0, cites: 0, found: 0, all: 0, f5: 0, slots: 0, longSlots: 0, chars: 0, miss: [], ms: 0, cardMs: 0 });
function evaluate(cfg, { detail = null } = {}) {
  const lex = getLex(cfg.tok);
  const ckey = JSON.stringify({ t: cfg.tok, sc: cfg.scorer, bl: cfg.blend, v: cfg.vecs });
  const agg = {}, necro = {}, perCase = detail ? new Map() : null;
  for (const c of CASES) {
    const t1 = performance.now();
    const toks = queryToks(lex, cfg, c);
    lexScore(lex, toks, cfg.scorer, lexS, TOP);
    const cos = cfg.concept && c.cos[cfg.vecs + "c"] ? c.cos[cfg.vecs + "c"] : c.cos[cfg.vecs];
    blendInto(cos, c.excl, c.boost, cfg.blend, lexS, TOP, SCORE, VALID);
    const n = cfg.perCard && c.cardNames.length ? cfg.perCard : 0;
    const main = topK(SCORE, TOP, VALID, CAP + n);
    let top10 = main.slice(0, CAP), chosenRanks = null, cardMs = 0;
    if (n) {
      const keep = main.slice(0, CAP - n), chosen = new Set(keep), picks = [];
      const lists = c.cardNames.map((nm) => { cardMs += CARDS.get(nm).ms; return perCardList(cfg, ckey, lex, nm, c); });
      for (let depth = 0; depth < 5 && picks.length < n; depth++) for (const L of lists) { const id = L[depth]; if (id !== undefined && !chosen.has(id) && picks.length < n) { chosen.add(id); picks.push(id); } }
      chosenRanks = [...chosen].map((i) => rankOf(SCORE, TOP, VALID, i));
      top10 = [...keep, ...picks, ...main.filter((i) => !chosen.has(i))].slice(0, CAP);
      c._chosen = chosen;
    }
    const ms = performance.now() - t1;
    const finalRank = (i) => {
      if (i < 0) return Infinity;
      const p = top10.indexOf(i); if (p >= 0) return p + 1;
      const mr = rankOf(SCORE, TOP, VALID, i);
      if (!chosenRanks || mr === Infinity) return mr;
      return c._chosen.size + mr - chosenRanks.filter((r) => r < mr).length;
    };
    let found = 0, f5 = 0; const miss = [];
    const ranks = c.deciding.map((id, k) => (c.curated.has(id) ? 0 : finalRank(c.decIdx[k])));
    for (const r of ranks) { if (r <= CAP) found++; else if (r < Infinity) miss.push(r); if (r <= 5) f5++; }
    for (const g of c.groups) {
      const a = (agg[g] ??= blank());
      a.q++; a.cites += c.deciding.length; a.found += found; a.f5 += f5; if (c.deciding.length && found === c.deciding.length) a.all++;
      a.slots += top10.length; a.longSlots += top10.reduce((s, i) => s + LONG[i], 0); a.chars += top10.reduce((s, i) => s + TEXTLEN[i], 0);
      a.miss.push(...miss); a.ms += ms; a.cardMs += cardMs;
      if (g === "necroQ" || g === "necroD") necro[g] = ["514.1", "514.2", "514.3a"].map((id) => (c.curated.has(id) ? "cur" : String(finalRank(idxOf.get(id))))).join("/");
    }
    if (cfg.fidelity && c.prodTop && top10.map((i) => RIDS[i]).join() !== c.prodTop.join()) mismatch++;
    if (cfg.fidelity && c.prodTop) checked++;
    if (perCase) perCase.set(c.id, { found, ranks, top10: top10.map((i) => RIDS[i]) });
  }
  return { agg, necro, perCase };
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
function row(name, res, ref) {
  const g = (k) => res.agg[k] ?? blank();
  const st = g("suite-tuning"), sc = g("suite-check"), s = g("suite"), h = g("hard25"), co = g("corpus"), be = g("bench");
  const d = ref ? ` (${st.found - ref.agg["suite-tuning"].found >= 0 ? "+" : ""}${st.found - ref.agg["suite-tuning"].found}/${sc.found - ref.agg["suite-check"].found >= 0 ? "+" : ""}${sc.found - ref.agg["suite-check"].found})` : "";
  return `${name.padEnd(58)} | ${String(st.found).padStart(3)} | ${String(sc.found).padStart(3)}${d.padEnd(12)}| ${st.all}/${sc.all} | ${h.found} | ${co.found}/${co.all} | ${be.f5} | ${res.necro.necroQ ?? "-"} · ${res.necro.necroD ?? "-"} | ${((100 * s.longSlots) / (s.slots || 1)).toFixed(1)}% | ${med(s.miss)} | ${(s.chars / (s.q || 1)).toFixed(0)} | ${(s.ms / (s.q || 1)).toFixed(2)}+${(s.cardMs / (s.q || 1)).toFixed(1)}`;
}
const HEADER = `${"variant".padEnd(58)} | tun | chk (Δ t/c vs ref) | every t/c | hard25 | corpus c/e | bench@5 | 514.1/514.2/514.3a Quick · In-Depth | long% | miss med | chars/q | ms/q scoring+per-card embed`;

// ---- configs ----------------------------------------------------------------------------------------
const A = (a) => ({ t: "a", a, wl: Number((1 - a).toFixed(4)) });
const TODAY_SC = { t: "today" };
const BM = (k1, b, idf = "bm25") => ({ t: "bm25", k1, b, idf });
const base = { tok: "p", s1: false, trim: false, scorer: TODAY_SC, blend: A(0.6), concept: false, perCard: 0, vecs: "P" };
const FIX = { ...base, tok: "d", s1: true }; // today + S1 + S5
const scName = (s) => (s.t === "today" ? "today-sum" : `bm25 k1=${s.k1} b=${s.b}${s.idf === "log" ? " logIDF" : ""}${s.kwm ? ` kw×${s.kwm}` : ""}`);
const blName = (b) => (b.t === "a" ? `α${b.a}` : `rrf k${b.k} w${b.w}`);
const nm = (c) => `${c.tok}${c.s1 ? "+S1" : ""}${c.trim ? "+S12" : ""}${c.concept ? "+map" : ""}${c.perCard ? `+card${c.perCard}` : ""}${c.vecs === "C" ? "+vecC" : ""} ${scName(c.scorer)} ${blName(c.blend)}${c.qw ? ` q×${c.qw}` : ""}`;

const results = [];
const run = (cfg, name = nm(cfg), ref = null) => { const t = performance.now(); const r = evaluate(cfg); results.push({ name, cfg, r }); console.log(row(name, r, ref)); return r; };
const pickBest = (list, key = "suite-tuning") => [...list].sort((x, y) => y.r.agg[key].found - x.r.agg[key].found || y.r.agg[key].all - x.r.agg[key].all || y.r.agg.corpus.found - x.r.agg.corpus.found)[0];

console.log(`\nColumns: ${HEADER}`);
console.log(`(suite tuning ${CASES.filter((c) => c.groups.includes("suite-tuning")).reduce((s, c) => s + c.deciding.length, 0)} cites, check ${CASES.filter((c) => c.groups.includes("suite-check")).reduce((s, c) => s + c.deciding.length, 0)} cites; bench ${CASES.filter((c) => c.groups.includes("bench")).length} questions)\n`);

const ALPHAS = [0.4, 0.5, 0.6, 0.7, 0.8];
const RRFS = [[20, 0.5], [60, 0.5], [60, 0.6], [60, 0.7], [20, 0.7]].map(([k, w]) => ({ t: "rrf", k, w }));
const BM_GRID = [];
for (const k1 of [0.5, 0.9, 1.2, 1.5, 2.0]) for (const b of [0, 0.25, 0.5, 0.75]) BM_GRID.push(BM(k1, b));

if (PLAN === "repro") {
  const T = run({ ...base, fidelity: true }, "today (production)");
  console.log(`Fidelity: production top 10 reproduced on ${checked - mismatch} of ${checked} questions`);
  run(FIX, "today + S1+S5", T);
  run({ ...FIX, concept: true, perCard: 2 }, "card-wording best: S1+S5 + map + per-card 2", T);
  run({ ...base, vecs: "C" }, "today + variant C vectors", T);
}

if (PLAN === "part1") {
  for (const [bn, B0] of [["plain", base], ["S1+S5", FIX]]) {
    console.log(`\n== Base: ${bn} — scorer × blend sweep`);
    const T = run({ ...B0 }, `${bn}: today-sum α0.6`);
    const all = [];
    for (const scorer of [TODAY_SC, ...BM_GRID]) for (const blend of [...ALPHAS.map(A), ...RRFS]) {
      const cfg = { ...B0, scorer, blend };
      const r = evaluate(cfg); all.push({ name: `${bn}: ${scName(scorer)} ${blName(blend)}`, cfg, r });
    }
    for (const x of all) console.log(row(x.name, x.r, T));
    const bestToday = pickBest(all.filter((x) => x.cfg.scorer.t === "today"));
    const bestBm = pickBest(all.filter((x) => x.cfg.scorer.t === "bm25"));
    const bestBmA = pickBest(all.filter((x) => x.cfg.scorer.t === "bm25" && x.cfg.blend.t === "a"));
    const bestBmR = pickBest(all.filter((x) => x.cfg.scorer.t === "bm25" && x.cfg.blend.t === "rrf"));
    console.log(`\n-- ${bn}: picked on the tuning half`);
    for (const [lbl, x] of [["best today-sum (re-tuned blend)", bestToday], ["best BM25 any blend", bestBm], ["best BM25 score blend", bestBmA], ["best BM25 rank fusion", bestBmR]]) console.log(row(`${lbl}: ${x.name}`, x.r, T));
    writeFileSync(`${OUT}/part1-${bn}.json`, JSON.stringify(all.map((x) => ({ name: x.name, cfg: x.cfg, tun: x.r.agg["suite-tuning"].found, chk: x.r.agg["suite-check"].found }))));
  }
}

if (PLAN === "part1b") {
  // tokenizer and keyword-list variants on the S1+S5 base, each with today-sum and with BM25 (arg --bm k1,b), blend re-tuned on tuning
  const [k1, b] = arg("--bm", "1.2,0.25").split(",").map(Number);
  const BMX = BM(k1, b);
  const T = run(FIX, "S1+S5 today-sum α0.6 (ref)");
  const variants = [
    ["S1+S5", {}], ["+ negation (D13)", { tok: "dn" }], ["+ Porter stem", { tok: "d:porter" }], ["+ light stem (audit S3)", { tok: "d:light" }], ["+ plural-only stem", { tok: "d:plural" }],
    ["+ drop six verbs (S12)", { trim: true }], ["+ negation + Porter", { tok: "dn:porter" }], ["+ negation + plural", { tok: "dn:plural" }], ["+ negation + S12", { tok: "dn", trim: true }],
    ["+ negation + plural + S12", { tok: "dn:plural", trim: true }], ["+ negation + Porter + S12", { tok: "dn:porter", trim: true }]
  ];
  const keep = [];
  for (const [label, o] of variants) for (const scorer of [TODAY_SC, BMX]) {
    const all = [];
    for (const blend of [...ALPHAS.map(A), ...RRFS]) { const cfg = { ...FIX, ...o, scorer, blend }; all.push({ name: `${label} ${scName(scorer)} ${blName(blend)}`, cfg, r: evaluate(cfg) }); }
    const at6 = all.find((x) => x.cfg.blend.t === "a" && x.cfg.blend.a === 0.6), best = pickBest(all);
    console.log(row(at6.name, at6.r, T));
    if (best !== at6) console.log(row(`   best blend on tuning: ${blName(best.cfg.blend)}`, best.r, T));
    keep.push(at6, best);
  }
  writeFileSync(`${OUT}/part1b.json`, JSON.stringify(keep.map((x) => ({ name: x.name, cfg: x.cfg, tun: x.r.agg["suite-tuning"].found, chk: x.r.agg["suite-check"].found }))));
}

if (PLAN === "part2") {
  // --w '<json partial cfg>' = the chosen word scoring (tok, trim, scorer, blend)
  const W = JSON.parse(arg("--w", JSON.stringify({ scorer: BM(1.2, 0.25), blend: A(0.6) })));
  const T = run({ ...base, fidelity: true }, "0 today (production)");
  console.log(`Fidelity: production top 10 reproduced on ${checked - mismatch} of ${checked} questions`);
  const plainW = { ...base, ...W, tok: (W.tok ?? "p").replace(/^d/, "p") };
  const steps = [
    ["1 + best word scoring (plain tokens)", plainW],
    ["2 + S1 card keywords as keywords", { ...plainW, s1: true }],
    ["3 + S5 dots stripped (= W tokens)", { ...base, ...W, s1: true, tok: W.tok ?? "d" }]
  ];
  let cur = steps[2][1];
  steps.push(["4 + concept map", (cur = { ...cur, concept: true })]);
  steps.push(["5 + per-card search, 2 slots", (cur = { ...cur, perCard: 2 })]);
  steps.push(["6 + variant C labelled-piece vectors", (cur = { ...cur, vecs: "C" })]);
  for (const [n, c] of steps) run(c, n, T);
  const FULL = cur;
  console.log(`\n-- full stack, blend re-tuned on tuning half`);
  const tuned = [];
  for (const blend of [...ALPHAS.map(A), A(0.65), A(0.55), ...RRFS]) { const cfg = { ...FULL, blend }; tuned.push({ name: `full stack ${blName(blend)}`, cfg, r: evaluate(cfg) }); }
  for (const x of tuned) console.log(row(x.name, x.r, T));
  const BEST = pickBest(tuned).cfg;
  console.log(row(`  → picked: ${blName(BEST.blend)}`, evaluate(BEST), T));
  console.log(`\n-- leave one out from the full stack (picked blend)`);
  run(BEST, "full stack", T);
  run({ ...BEST, scorer: TODAY_SC }, "− word scoring (today-sum)", T);
  run({ ...BEST, s1: false }, "− S1", T);
  run({ ...BEST, tok: BEST.tok.replace(/^d/, "p") }, "− S5", T);
  if (BEST.tok.includes("n")) run({ ...BEST, tok: BEST.tok.replace("n", "") }, "− negation", T);
  if (BEST.tok.includes(":")) run({ ...BEST, tok: BEST.tok.split(":")[0] }, "− stemming", T);
  if (BEST.trim) run({ ...BEST, trim: false }, "− S12 verb trim", T);
  run({ ...BEST, concept: false }, "− concept map", T);
  run({ ...BEST, conceptMult: 1 }, "  concept terms ×1 instead of ×2", T);
  run({ ...BEST, conceptMult: 3 }, "  concept terms ×3 instead of ×2", T);
  run({ ...BEST, perCard: 0 }, "− per-card search", T);
  run({ ...BEST, perCard: 3 }, "  per-card 3 slots instead of 2", T);
  run({ ...BEST, vecs: "P" }, "− variant C vectors", T);
  console.log(`\n-- the same stack on today-sum word scoring (card-wording best + C)`);
  run({ ...FIX, concept: true, perCard: 2 }, "card-wording best (today-sum)", T);
  run({ ...FIX, concept: true, perCard: 2, vecs: "C" }, "card-wording best + C (today-sum)", T);
  console.log(`\nFinal recipe: ${JSON.stringify(BEST)}`);
}

if (PLAN === "diag-stem") {
  // why stemming trades suite gain for corpus loss: per corpus case, which deciding rules move, and which stems merge
  const [k1, b] = arg("--bm", "0").split(",").map(Number);
  const sc = k1 ? BM(k1, b) : TODAY_SC;
  for (const st of ["porter", "light", "plural"]) {
    const a = evaluate({ ...FIX, scorer: sc }, { detail: true }), z = evaluate({ ...FIX, scorer: sc, tok: `d:${st}` }, { detail: true });
    let lost = 0, gained = 0, lostS = 0, gainedS = 0;
    const lines = [];
    for (const c of CASES) {
      const x = a.perCase.get(c.id), y = z.perCase.get(c.id);
      const d = y.found - x.found;
      if (c.groups.includes("suite")) { if (d < 0) lostS -= d; if (d > 0) gainedS += d; continue; }
      if (!c.groups.includes("corpus") || d === 0) continue;
      if (d < 0) lost -= d; else gained += d;
      const moved = c.deciding.map((id, k) => `${id} ${x.ranks[k]}→${y.ranks[k]}`).filter((s) => { const [p, q] = s.split(" ")[1].split("→"); return (+p <= 10) !== (+q <= 10); });
      const entering = y.top10.filter((id) => !x.top10.includes(id));
      lines.push(`  ${d > 0 ? "+" : "-"}${Math.abs(d)} ${c.id}: ${moved.join(", ")}; new in top 10: ${entering.join(" ")}`);
    }
    console.log(`\n== ${st} stemming (${scName(sc)}): corpus −${lost} +${gained}; suite (all) −${lostS} +${gainedS}`);
    for (const l of lines) console.log(l);
    // merged forms: query-side words that only match after stemming, in corpus questions that lost
    const lexD = getLex("d"), lexS2 = getLex(`d:${st}`);
    const merges = new Map();
    for (const c of CASES) {
      if (!c.groups.includes("corpus")) continue;
      const x = a.perCase.get(c.id), y = z.perCase.get(c.id);
      if (y.found >= x.found) continue;
      for (const t of new Set(lexD.tokenize(`${c.questionText} ${c.signal}`))) {
        const s = lexS2.tokenize(t)[0];
        if (!s) continue;
        const dfBefore = lexD.df.get(t) ?? 0, dfAfter = lexS2.df.get(s) ?? 0;
        if (dfAfter > dfBefore * 1.5 + 5) merges.set(`${t}→${s}`, `${dfBefore}→${dfAfter}`);
      }
    }
    console.log(`  query words whose rule-book reach grows most after stemming (in corpus cases that lost): ${[...merges].slice(0, 30).map(([k, v]) => `${k} df ${v}`).join("; ")}`);
  }
}
saveVc();
