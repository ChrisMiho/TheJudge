// Free, local probe (no API calls, no LLM): the BM25 full stack (runs/search-bm25-stack, recommended
// row "Full stack, α 0.55, no negation") with its meaning half swapped to the Magic-trained MiniLM
// fold models (runs/search-trained-embedder). Copies (does not edit) bm25-stack-probe.mjs (ranking,
// word scoring, concept map, per-card search) and score-trained.mjs (fold models, fold assignment,
// bench spread i % 5, vector caches keyed by text hash).
//
// Cross-validation: every question is scored with the fold model that did NOT train on it. Its plain
// query, its concept-map-augmented query, its per-card searches and the rule vectors all come from that
// fold model. Rule vectors: "A" = production embedding text (sectionTitle: text), "C" = variant C
// labelled-piece text (path label + parent lead-in + text), both re-embedded with the fold model.
//
// Vector sets (cfg.vecs): P production committed vectors | C variant C (base MiniLM, cache) |
//   TF-A TF-C (F arm, 5-fold) | TC-A TC-C (C arm, 5-fold) | TFall-A TFall-C (F trained on everything,
//   corpus + bench only; not an honest number).
// Usage (from .worktrees/probe-pft): EMBEDDING_PROVIDER=local npx tsx <this file>
// Practice-suite output is aggregate counts and rule ids only. Caches hold hashes and vectors, never text.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { conceptTerms } from "../search-bm25-stack/concept-map.mjs";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/rulesguru`;
const MP = `${REPO}/output/models-probe`;
const TRAIN = `${MP}/train`;
const OUT = `${MP}/full-stack-trained`;
const VEC_C = `${MP}/embedder/vectors/minilm__C__3d7ac9295f32dba05292bec5`;
mkdirSync(`${OUT}/vectors`, { recursive: true });
const CAP = 10;
const T_START = performance.now();

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const ws = await imp("scripts/eval-worked-solutions.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const sg = await imp("scripts/lib/rulesguru-suite.mjs");
const { isHeadingOnlyEntry } = await imp("scripts/build-game-rules.mjs");
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
const byId = new Map(index.map((e) => [e.ruleId, e]));
const NUM = Float64Array.from(RIDS, (id) => parseFloat(id));
const vocab = R.loadGameRulesKeywordVocabulary(join(REPO, "apps/backend/data/gameRulesKeywordVocabulary.json"));
const emb = R.loadGameRulesRuleEmbeddings(join(REPO, "apps/backend/data/gameRulesRuleEmbeddings.json"));
const vecById = new Map(emb.ruleIds.map((id, i) => [id, emb.vectors[i]]));
const RVEC_P = RIDS.map((id) => vecById.get(id));
if (RVEC_P.some((v) => !v)) throw new Error("rule without production vector");
const cMeta = JSON.parse(readFileSync(`${VEC_C}.json`, "utf8"));
if (cMeta.keys.length !== N) throw new Error("variant C cache size mismatch");
const cBuf = readFileSync(`${VEC_C}.f32`);
const cAll = new Float32Array(cBuf.buffer, cBuf.byteOffset, cBuf.byteLength / 4);
const RVEC_C = RIDS.map((_, i) => Array.from(cAll.subarray(i * cMeta.d, (i + 1) * cMeta.d)));
const TEXTLEN = Int32Array.from(index, (e) => e.text.length);

// rule-book document texts for the trained models: A (production embedding text) and C (variant C,
// copied from runs/search-embedder/search-embedder-probe.mjs; checked against its cache hash)
const DOCS_A = index.map((e) => `${e.sectionTitle}: ${e.text}`.slice(0, 2000));
const DOCS_C = (() => {
  const src = readFileSync("/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/data/cr/source.txt", "utf8").replace(/\r\n?/g, "\n");
  const lines = src.split("\n");
  const gl = lines.map((l, i) => (/^Glossary\s*$/.test(l) ? i : -1)).filter((i) => i >= 0);
  const partTitle = {}, sectionTitle = {}, famTitle = {};
  for (let i = gl[0] + 1; i < gl[gl.length - 1]; i++) {
    const l = lines[i];
    let m;
    if ((m = /^(\d)\. (.+)$/.exec(l))) partTitle[m[1]] = m[2].trim();
    else if ((m = /^(\d{3})\. (.+)$/.exec(l))) sectionTitle[m[1]] = m[2].trim();
    else if ((m = /^(\d{3}\.\d+)\.?\s+(.*)$/.exec(l)) && isHeadingOnlyEntry(m[1], l)) famTitle[m[1]] = m[2].trim();
  }
  const stripId = (e) => e.text.replace(new RegExp(`^${e.ruleId.replace(/\./g, "\\.")}\\.?\\s*`), "");
  const pathLabel = (e) => {
    const sec = e.ruleId.slice(0, 3);
    const fam = /^\d{3}\.\d+/.exec(e.ruleId)?.[0];
    const parts = [partTitle[sec[0]], `${sec} ${sectionTitle[sec] ?? e.sectionTitle}`];
    if (fam && fam !== e.ruleId && famTitle[fam]) parts.push(`${fam} ${famTitle[fam]}`);
    parts.push(e.ruleId);
    return parts.filter(Boolean).join(" › ");
  };
  const splitRule = (t) => t.split("\n").filter((l) => !/^\s*Example:/.test(l)).join("\n").trim();
  const leadIn = (e) => {
    if (!/[a-z]$/.test(e.ruleId)) return "";
    const p = byId.get(e.parentRuleIds[0]);
    if (!p) return "";
    let t = splitRule(stripId(p)).replace(/\s+/g, " ");
    if (t.length > 300) { const cut = t.slice(0, 300); const dot = cut.lastIndexOf(". "); t = dot > 120 ? cut.slice(0, dot + 1) : `${cut}…`; }
    return t;
  };
  return index.map((e) => { const li = leadIn(e); return `${pathLabel(e)}\n${li ? `${li}\n` : ""}${stripId(e)}`.slice(0, 2000); });
})();
if (sha(DOCS_C.join("\u0000")) !== "3d7ac9295f32dba05292bec5") throw new Error("variant C text does not match the search-embedder probe's");
console.log("Variant C rule text matches the search-embedder probe (hash check passed)");

const { env: hfEnv, pipeline } = await import("@huggingface/transformers");
hfEnv.allowRemoteModels = false;
hfEnv.cacheDir = LOCAL_MODEL_CACHE_DIR;
const extractor = await pipeline("feature-extraction", LOCAL_MODEL_ID, { dtype: "q8" });
const tok = extractor.tokenizer;
const pieceLen = (t) => { const x = tok(t).input_ids; return (x.data ?? x).length; };
const LONG = Uint8Array.from(index, (e) => (pieceLen(`${e.sectionTitle}: ${e.text}`.slice(0, 2000)) > 256 ? 1 : 0));
console.log(`Rule book: ${N} pieces; longer than 256 word pieces: ${LONG.reduce((a, b) => a + b, 0)}`);

// ---- production-model vector cache (read the bm25-stack probe's; write our own; hash keys only) ------
const VC_FILE = `${OUT}/qvec-cache.json`;
const VC_SRC = existsSync(VC_FILE) ? VC_FILE : `${MP}/bm25-stack/qvec-cache.json`;
const vcache = existsSync(VC_SRC) ? new Map(Object.entries(JSON.parse(readFileSync(VC_SRC, "utf8")))) : new Map();
let vcDirty = VC_SRC !== VC_FILE ? 1 : 0;
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
const STEMMERS = { porter };
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
const foldOf = new Map();
for (const l of readFileSync(`${TRAIN}/data/cases.jsonl`, "utf8").split("\n")) if (l.trim()) { const r = JSON.parse(l); foldOf.set(`${r.set}:${r.id}`, r.fold); }
const extractRuleIds = (v) => [...new Set([...v.matchAll(/\b\d{3}(?:\.\d+[a-z]?)?\b/gi)].map((m) => m[0]))];
const entryCites = index.map((e) => extractRuleIds(e.text).filter((id) => id !== e.ruleId));
const WS_DIR = `${REPO}/apps/backend/src/eval/worked-solutions`;
const NECRO = { "necropotence-silence-borne-upon-a-wind-cleanup": "necroQ", "necropotence-silence-borne-upon-a-wind-cleanup-in-depth": "necroD" };
const CARDS = new Map(); // name -> { text, P, C, ms }
const CASES = [];
let mismatch = 0, checked = 0, skipped = 0;

async function addCase({ id, set, fold, groups, questionText, cards, queryText, baseVec, curated, prodTop, deciding }) {
  if (fold === undefined) throw new Error("case without a fold");
  const signal = cards.map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ");
  const qIds = new Set(extractRuleIds(`${questionText} ${signal}`));
  const questionIds = new Set(extractRuleIds(questionText));
  const uniq = [...new Map(cards.map((k) => [k.name, k])).values()];
  const concepts = [...new Set(uniq.flatMap((k) => conceptTerms(k.oracleText, k.typeLine, k.name)))];
  const conceptText = concepts.length ? `${queryText} ${concepts.join(", ")}`.trim() : null;
  const conceptVec = conceptText ? (await vec("ext", conceptText)).v : baseVec;
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
    id, set, fold, groups, questionText, queryText, conceptText, signal, cardKw: cards.flatMap((k) => k.keywords ?? []), conceptStr: concepts.join(" "), cardNames,
    cos: { P: cosArr(baseVec, RVEC_P), C: cosArr(baseVec, RVEC_C), Pc: concepts.length ? cosArr(conceptVec, RVEC_P) : null, Cc: concepts.length ? cosArr(conceptVec, RVEC_C) : null },
    cardCos: {}, boost, excl, curated, curKey: [...curated].sort().join(","), prodTop, deciding, decIdx: deciding.map((d) => idxOf.get(d) ?? -1)
  });
}

async function loadRequestCase(c, set, groups) {
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
  await addCase({ id: c.id, set, fold: foldOf.get(`${set}:${c.id}`), groups, questionText, cards, queryText, baseVec, curated, prodTop, deciding: [...new Set(c.expected?.decidingRuleIds ?? [])] });
}

const t0load = performance.now();
sg.assertSuiteIgnored({ suiteDir: SUITE });
const { selected } = await ws.loadSuiteSelection({ suiteDir: SUITE });
const hardIds = new Set(JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final);
for (const c of selected) await loadRequestCase(c, "suite", ["suite", `suite-${half(c.id)}`, ...(hardIds.has(c.id) ? ["hard25"] : [])]);
saveVc();
const corpus = readdirSync(WS_DIR).filter((f) => f.endsWith(".case.json")).map((f) => JSON.parse(readFileSync(`${WS_DIR}/${f}`, "utf8"))).filter((c) => c.review?.status !== "rejected");
for (const c of corpus) await loadRequestCase(c, "corpus", ["corpus", ...(NECRO[c.id] ? [NECRO[c.id]] : [])]);
saveVc();
{ // benchmark with three unrelated cards attached; bench questions spread over fold models by i % 5
  const B = await imp("apps/backend/src/eval/ragRetrievalBenchmark.ts");
  const names = B.loadCardNameByOracleId();
  const ids = [...resources.cardDetailIndex.keys()].sort();
  const POLL = [1000, 9000, 20000].map((i) => ids[i % ids.length]).map((id) => ({ name: names.get(id) ?? "", ...resources.cardDetailIndex.get(id) }));
  const sig = POLL.map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ");
  for (const [i, it] of B.loadBenchmarkCorpus().items.entries()) {
    const queryText = `${it.question} ${sig}`;
    await addCase({ id: `bench-${i}`, set: "bench", fold: i % 5, groups: ["bench"], questionText: it.question, cards: POLL, queryText, baseVec: (await vec("ext", queryText)).v, curated: new Set(), prodTop: null, deciding: [it.expectedRuleId] });
  }
}
saveVc();
const cardMs = [...CARDS.values()].map((c) => c.ms).sort((a, b) => a - b);
console.log(`Loaded ${CASES.length} cases (${skipped} skipped) and ${CARDS.size} distinct card texts in ${((performance.now() - t0load) / 1000).toFixed(0)} s; per-card embed median ${cardMs[cardMs.length >> 1]?.toFixed(1)} ms`);

// ---- trained fold models: vectors (cache: score-trained's read-only + ours) and cosines ---------------
function loadVecFile(p) {
  if (!existsSync(`${p}.json`)) return [];
  const { d, keys } = JSON.parse(readFileSync(`${p}.json`, "utf8"));
  const b = readFileSync(`${p}.f32`);
  const all = new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
  return keys.map((k, i) => [k, all.subarray(i * d, (i + 1) * d)]);
}
function saveVecFile(p, m) {
  const keys = [...m.keys()]; if (!keys.length) return;
  const d = m.get(keys[0]).length;
  const buf = new Float32Array(keys.length * d); keys.forEach((k, i) => buf.set(m.get(k), i * d));
  writeFileSync(`${p}.f32`, Buffer.from(buf.buffer));
  writeFileSync(`${p}.json`, JSON.stringify({ d, keys }));
}
const D = 384;
function docMatrix(cache, docs) {
  const M = new Float32Array(N * D);
  docs.forEach((t, i) => {
    const v = cache.get(sha(t)); let n = 0; for (let k = 0; k < D; k++) n += v[k] * v[k];
    n = Math.sqrt(n) || 1; for (let k = 0; k < D; k++) M[i * D + k] = v[k] / n;
  });
  return M;
}
function cosT(q, M) {
  let qn = 0; for (let k = 0; k < D; k++) qn += q[k] * q[k]; qn = Math.sqrt(qn) || 1;
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) { let s = 0; const o = i * D; for (let k = 0; k < D; k++) s += q[k] * M[o + k]; out[i] = s / qn; }
  return out;
}
const embedLog = [];
// spec: "F" | "C" (5-fold) | "Fall" (F-foldall, every case); filter: which cases get vectors
async function attachTrained(spec, filter = () => true) {
  const t0 = performance.now();
  const concreteFor = (c) => (spec === "Fall" ? "F-foldall" : `${spec}-fold${c.fold}`);
  const groups = new Map();
  for (const c of CASES) if (filter(c)) { const k = concreteFor(c); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(c); }
  let embedded = 0;
  for (const [concrete, cs] of groups) {
    const cache = new Map([...loadVecFile(`${TRAIN}/vectors/${concrete}__q8`), ...loadVecFile(`${OUT}/vectors/${concrete}__q8`)]);
    const mine = new Map(loadVecFile(`${OUT}/vectors/${concrete}__q8`));
    const qTexts = new Set();
    for (const c of cs) { qTexts.add(c.queryText); if (c.conceptText) qTexts.add(c.conceptText); for (const nm of c.cardNames) qTexts.add(CARDS.get(nm).text); }
    const docNeed = [...new Set([...DOCS_A, ...DOCS_C])].filter((t) => !cache.has(sha(t)));
    const qNeed = [...qTexts].filter((t) => !cache.has(sha(t)));
    if (docNeed.length || qNeed.length) {
      hfEnv.allowLocalModels = true;
      hfEnv.localModelPath = `${TRAIN}/onnx/`;
      const ex = await pipeline("feature-extraction", `trained/${concrete}`, { dtype: "q8" });
      const te = performance.now();
      for (let s = 0; s < docNeed.length; s += 16) {
        const batch = docNeed.slice(s, s + 16);
        const out = await ex(batch, { pooling: "mean", normalize: true });
        const d = out.dims[1];
        batch.forEach((t, j) => { const v = Float32Array.from(out.data.subarray(j * d, (j + 1) * d)); cache.set(sha(t), v); mine.set(sha(t), v); });
      }
      for (const t of qNeed) { const out = await ex(t, { pooling: "mean", normalize: true }); const v = Float32Array.from(out.data); cache.set(sha(t), v); mine.set(sha(t), v); }
      await ex.dispose?.();
      saveVecFile(`${OUT}/vectors/${concrete}__q8`, mine);
      embedded += docNeed.length + qNeed.length;
      embedLog.push(`${concrete}: embedded ${docNeed.length} rule texts + ${qNeed.length} queries in ${((performance.now() - te) / 1000).toFixed(0)} s`);
    }
    for (const [dv, docs] of [["A", DOCS_A], ["C", DOCS_C]]) {
      const M = docMatrix(cache, docs);
      const key = `T${spec}-${dv}`;
      const cardMemo = new Map();
      for (const c of cs) {
        c.cos[key] = cosT(cache.get(sha(c.queryText)), M);
        c.cos[key + "c"] = c.conceptText ? cosT(cache.get(sha(c.conceptText)), M) : null;
        const m = new Map();
        for (const nm of c.cardNames) { if (!cardMemo.has(nm)) cardMemo.set(nm, cosT(cache.get(sha(CARDS.get(nm).text)), M)); m.set(nm, cardMemo.get(nm)); }
        c.cardCos[key] = m;
      }
    }
  }
  console.log(`[${spec}] ${[...groups.keys()].join(", ")}: ${[...groups.values()].reduce((s, x) => s + x.length, 0)} questions; ${embedded} new embeddings; ${((performance.now() - t0) / 1000).toFixed(0)} s`);
}

// ---- ranking ----------------------------------------------------------------------------------------
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
function blendInto(cos, excl, boost, blend, lexS, top, out, valid) {
  let maxC = 0, maxL = 0;
  for (let i = 0; i < N; i++) { if (excl[i]) continue; if (cos[i] > maxC) maxC = cos[i]; if (lexS[i] > maxL) maxL = lexS[i]; }
  const a = blend.a, wl = blend.wl;
  for (let i = 0; i < N; i++) out[i] = a * (maxC > 0 ? cos[i] / maxC : 0) + wl * (maxL > 0 ? lexS[i] / maxL : 0);
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
  const trained = cfg.vecs.startsWith("T");
  const k = `${ckey}|${name}|${c.curKey}${trained ? `|f${cfg.vecs.startsWith("TFall") ? "all" : c.fold}` : ""}`;
  if (perCardMemo.has(k)) return perCardMemo.get(k);
  const card = CARDS.get(name);
  const toks = new Map(); for (const t of lex.tokenize(card.text)) if (!toks.has(t)) toks.set(t, { mult: 1, kw: false });
  const ls = new Float64Array(N), tp = new Float64Array(N), s = new Float64Array(N), v = new Uint8Array(N);
  lexScore(lex, toks, cfg.scorer, ls, tp);
  blendInto(trained ? c.cardCos[cfg.vecs].get(name) : card[cfg.vecs], c.excl, [], cfg.blend, ls, tp, s, v);
  const L = topK(s, tp, v, 5 + 10);
  perCardMemo.set(k, L);
  return L;
}
const blank = () => ({ q: 0, cites: 0, found: 0, all: 0, f5: 0, h100: 0, slots: 0, longSlots: 0, chars: 0, miss: [], ms: 0, cardMs: 0 });
function evaluate(cfg) {
  const lex = getLex(cfg.tok);
  const ckey = JSON.stringify({ t: cfg.tok, sc: cfg.scorer, bl: cfg.blend, v: cfg.vecs });
  const agg = {}, necro = {};
  for (const c of CASES) {
    if (cfg.only && !cfg.only.includes(c.set)) continue;
    const t1 = performance.now();
    const toks = queryToks(lex, cfg, c);
    lexScore(lex, toks, cfg.scorer, lexS, TOP);
    if (!c.cos[cfg.vecs]) throw new Error(`no ${cfg.vecs} vectors for a ${c.set} case`);
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
    let found = 0, f5 = 0, h100 = 0; const miss = [];
    const ranks = c.deciding.map((id, k) => (c.curated.has(id) ? 0 : finalRank(c.decIdx[k])));
    for (const r of ranks) { if (r <= CAP) found++; else if (r < Infinity) miss.push(r); if (r <= 5) f5++; if (r <= 100) h100++; }
    for (const g of c.groups) {
      const a = (agg[g] ??= blank());
      a.q++; a.cites += c.deciding.length; a.found += found; a.f5 += f5; a.h100 += h100; if (c.deciding.length && found === c.deciding.length) a.all++;
      a.slots += top10.length; a.longSlots += top10.reduce((s, i) => s + LONG[i], 0); a.chars += top10.reduce((s, i) => s + TEXTLEN[i], 0);
      a.miss.push(...miss); a.ms += ms; a.cardMs += cardMs;
      if (g === "necroQ" || g === "necroD") necro[g] = ["514.1", "514.2", "514.3a"].map((id) => (c.curated.has(id) ? "cur" : String(finalRank(idxOf.get(id))))).join("/");
    }
    if (cfg.fidelity && c.prodTop && top10.map((i) => RIDS[i]).join() !== c.prodTop.join()) mismatch++;
    if (cfg.fidelity && c.prodTop) checked++;
  }
  return { agg, necro };
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
const pct = (x, n) => (n ? `${((100 * x) / n).toFixed(1)}%` : "-");
function row(name, res, ref) {
  const g = (k) => res.agg[k] ?? blank();
  const st = g("suite-tuning"), sc = g("suite-check"), s = g("suite"), h = g("hard25"), co = g("corpus"), be = g("bench");
  const hasS = s.q > 0;
  const d = ref && hasS ? ` (${st.found - ref.agg["suite-tuning"].found >= 0 ? "+" : ""}${st.found - ref.agg["suite-tuning"].found}/${sc.found - ref.agg["suite-check"].found >= 0 ? "+" : ""}${sc.found - ref.agg["suite-check"].found})` : "";
  const S = (x) => (hasS ? String(x) : "-");
  const basis = hasS ? s : co; // long share / miss / chars on the suite; corpus-only rows on the corpus
  return `${name.padEnd(62)} | ${S(st.found).padStart(3)} | ${S(sc.found).padStart(3)}${d.padEnd(12)}| ${S(st.all)}/${S(sc.all)} | ${S(h.found)} | ${co.found}/${co.all} | ${be.f5} | ${res.necro.necroQ ?? "-"} · ${res.necro.necroD ?? "-"} | ${pct(basis.longSlots, basis.slots)} | ${med(basis.miss)} | ${(basis.chars / (basis.q || 1)).toFixed(0)} | r@100 ${hasS ? pct(s.h100, s.cites) : "-"} | ${(basis.ms / (basis.q || 1)).toFixed(2)}+${(basis.cardMs / (basis.q || 1)).toFixed(1)}`;
}
const HEADER = `${"variant".padEnd(62)} | tun | chk (Δ t/c vs ref) | every t/c | hard25 | corpus c/e | bench@5 | 514.1/514.2/514.3a Quick · In-Depth | long% | miss med | chars/q | hybrid r@100 (suite) | ms/q scoring+per-card embed`;

// ---- configs ----------------------------------------------------------------------------------------
const A = (a) => ({ t: "a", a, wl: Number((1 - a).toFixed(4)) });
const TODAY_SC = { t: "today" };
const BM = (k1, b, idf = "bm25") => ({ t: "bm25", k1, b, idf });
const base = { tok: "p", s1: false, trim: false, scorer: TODAY_SC, blend: A(0.6), concept: false, perCard: 0, vecs: "P" };
const FIX = { ...base, tok: "d", s1: true };
// bm25-stack recommended row: Full stack, α 0.55, no negation
const REC = { tok: "d:porter", s1: true, trim: true, scorer: BM(1.2, 0.25), blend: A(0.55), concept: true, perCard: 2, vecs: "C" };

const results = [];
const run = (cfg, name, ref = null) => { const r = evaluate(cfg); results.push({ name, cfg, r }); console.log(row(name, r, ref)); return r; };
const SWEEP = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8];
// α picked on the tuning half only: tuning cites found, then tuning every-rule, then nearest 0.55
function sweep(cfg, label, ref) {
  const all = SWEEP.map((a) => { const c = { ...cfg, blend: A(a) }; return { a, cfg: c, r: run(c, `${label} α${a}`, ref) }; });
  const best = [...all].sort((x, y) => y.r.agg["suite-tuning"].found - x.r.agg["suite-tuning"].found || y.r.agg["suite-tuning"].all - x.r.agg["suite-tuning"].all || Math.abs(x.a - 0.55) - Math.abs(y.a - 0.55))[0];
  console.log(row(`  → ${label}: tuning-picked α${best.a}`, best.r, ref));
  return best;
}

console.log(`\nColumns: ${HEADER}`);
console.log(`(suite tuning ${CASES.filter((c) => c.groups.includes("suite-tuning")).reduce((s, c) => s + c.deciding.length, 0)} cites, check ${CASES.filter((c) => c.groups.includes("suite-check")).reduce((s, c) => s + c.deciding.length, 0)} cites; bench ${CASES.filter((c) => c.groups.includes("bench")).length} questions)\n`);

console.log("== a. fidelity (production / base-MiniLM vectors)");
const T = run({ ...base, fidelity: true }, "today (production)");
console.log(`Fidelity: production top 10 reproduced on ${checked - mismatch} of ${checked} questions`);
run(REC, "a. full stack α0.55 (variant C base vectors; bm25 rec row)", T);
run({ ...REC, vecs: "P" }, "a'. full stack α0.55, production vectors", T);

await attachTrained("F");
await attachTrained("C");
console.log("\n== trained-side fidelity: score-trained 'F b α0.6' (expect tun 406 chk 437)");
run({ ...FIX, concept: true, perCard: 2, vecs: "TF-A", blend: A(0.6) }, "x. card-wording stack, today-sum, TF-A α0.6", T);

const picked = {};
for (const [arm, lab] of [["TF-A", "b. full stack + trained F (rule text A)"], ["TF-C", "b. full stack + trained F (rule text C)"], ["TC-A", "c. full stack + trained C (rule text A)"], ["TC-C", "c. full stack + trained C (rule text C)"]]) {
  console.log(`\n== ${lab}`);
  picked[arm] = sweep({ ...REC, vecs: arm }, lab, T);
}
const fBest = ["TF-A", "TF-C"].map((k) => picked[k]).sort((x, y) => y.r.agg["suite-tuning"].found - x.r.agg["suite-tuning"].found || y.r.agg["suite-tuning"].all - x.r.agg["suite-tuning"].all)[0];
const BEST = fBest.cfg;
console.log(`\nBest F row (tuning-picked): vecs ${BEST.vecs} α${BEST.blend.a}`);

console.log(`\n== d. ablations on the best F row (each at α${BEST.blend.a}, then α re-picked on tuning)`);
run(BEST, "d0. best F full stack", T);
const ABL = [
  ["d1. − BM25 (today-sum word scoring, same tokens)", { ...BEST, scorer: TODAY_SC }],
  ["d2. − all word-side changes (today's tokens + today-sum, keep S1)", { ...BEST, scorer: TODAY_SC, tok: "d", trim: false }],
  ["d3. − concept map", { ...BEST, concept: false }],
  ["d4. − per-card search", { ...BEST, perCard: 0 }],
  ["d5. − concept map − per-card search", { ...BEST, concept: false, perCard: 0 }],
  ["d6. bare trained model on today's hybrid (production path)", { ...base, vecs: BEST.vecs, blend: BEST.blend }]
];
for (const [lab, cfg] of ABL) { run(cfg, `${lab} α${BEST.blend.a}`, T); sweep(cfg, lab, T); }

console.log("\n== e. F-foldall (trained on everything: NOT an honest number), corpus + bench only");
await attachTrained("Fall", (c) => c.set !== "suite");
for (const dv of ["A", "C"]) for (const a of [0.55, BEST.blend.a, 0.7]) run({ ...REC, vecs: `TFall-${dv}`, blend: A(a), only: ["corpus", "bench"] }, `e. full stack + F-foldall (rule text ${dv}) α${a}`);
for (const a of [0.55, BEST.blend.a]) run({ ...REC, vecs: BEST.vecs, blend: A(a), only: ["corpus", "bench"] }, `   compare: 5-fold ${BEST.vecs} α${a} (corpus+bench)`);

for (const l of embedLog) console.log(`  ${l}`);
saveVc();
writeFileSync(`${OUT}/results.json`, JSON.stringify(results.map((x) => ({ name: x.name, cfg: x.cfg, necro: x.r.necro, agg: Object.fromEntries(Object.entries(x.r.agg).map(([g, a]) => [g, { ...a, miss: med(a.miss) }])) }))));
console.log(`\nTotal runtime ${((performance.now() - T_START) / 1000).toFixed(0)} s`);
