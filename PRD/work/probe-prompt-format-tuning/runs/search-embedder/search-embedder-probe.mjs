// Free, local probe (no API calls, no LLM): does a stronger local embedder, or labelled rule pieces,
// put the deciding rules into the top 10 more often? Extends runs/audit-search/search-audit-probe.mjs
// (copied, not edited): same production hybrid re-implementation, same fidelity check against
// production's top 10, with the meaning half swapped per model × document-text variant.
//
// Usage (from .worktrees/probe-pft):
//   EMBEDDING_PROVIDER=local npx tsx <this file> --models minilm,bge-small --variants A,B --sets suite,corpus
//   models: keys of MODELS in lib-embed.mjs; "minilm" + variant "P" = the committed production vectors.
//   variants: P (committed int8 vectors), A (sectionTitle: text), B (path label), C (B + parent lead-in),
//             D (A, rule text and Example text as two vectors, score = max), BD (B label, two vectors).
// Practice-suite output is aggregate counts only (no question text, ids, answers, cards).
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { REPO, MODELS, loadModel, saveVecs, loadVecs, sha, embedMany } from "./lib-embed.mjs";

const SUITE = `${REPO}/output/practice-suite`;
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const MODEL_KEYS = arg("--models", "minilm").split(",");
const VARIANTS = arg("--variants", "A").split(",");
const SETS = arg("--sets", "suite,corpus").split(",");
const ALPHAS = arg("--alphas", "0.4,0.5,0.6,0.7,0.8,0.9").split(",").map(Number);
const CAP = 10;
// --qmode question: embed the question alone (no card signal) — test only; production embeds question + card signal
const QMODE = arg("--qmode", "production");

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const ws = await imp("scripts/eval-worked-solutions.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const sg = await imp("scripts/lib/practice-suite.mjs");
const { isHeadingOnlyEntry } = await imp("scripts/build-game-rules.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { buildPromptContext, buildLookupPromptContext } = await imp("apps/backend/src/prompt/context.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const R = await imp("apps/backend/src/gameRulesRetrieval.ts");

const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);

// ---- rule book --------------------------------------------------------------------------------------
const resources = await fid.loadPromptResources({ env });
const index = resources.gameRulesRuleIndex;
const N = index.length;
const ids = index.map((e) => e.ruleId);
const idxOf = new Map(ids.map((id, i) => [id, i]));
const byId = new Map(index.map((e) => [e.ruleId, e]));
const vocab = R.loadGameRulesKeywordVocabulary(join(REPO, "apps/backend/data/gameRulesKeywordVocabulary.json"));
const prodEmb = R.loadGameRulesRuleEmbeddings(join(REPO, "apps/backend/data/gameRulesRuleEmbeddings.json"));

// part / section / family titles from the raw CR (main checkout; gitignored source)
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
function pathLabel(e) {
  const sec = e.ruleId.slice(0, 3);
  const fam = /^\d{3}\.\d+/.exec(e.ruleId)?.[0];
  const parts = [partTitle[sec[0]], `${sec} ${sectionTitle[sec] ?? e.sectionTitle}`];
  if (fam && fam !== e.ruleId && famTitle[fam]) parts.push(`${fam} ${famTitle[fam]}`);
  parts.push(e.ruleId);
  return parts.filter(Boolean).join(" › ");
}
const splitExamples = (t) => {
  const ls = t.split("\n");
  return { rule: ls.filter((l) => !/^\s*Example:/.test(l)).join("\n").trim(), ex: ls.filter((l) => /^\s*Example:/.test(l)).join("\n").trim() };
};
function leadIn(e) {
  if (!/[a-z]$/.test(e.ruleId)) return "";
  const p = byId.get(e.parentRuleIds[0]);
  if (!p) return "";
  let t = splitExamples(stripId(p)).rule.replace(/\s+/g, " ");
  if (t.length > 300) { const cut = t.slice(0, 300); const dot = cut.lastIndexOf(". "); t = dot > 120 ? cut.slice(0, dot + 1) : `${cut}…`; }
  return t;
}
// returns [{ruleIndex, text}] — one or more documents per rule
function docTexts(variant) {
  const docs = [];
  for (const [i, e] of index.entries()) {
    if (variant === "A") docs.push([i, `${e.sectionTitle}: ${e.text}`.slice(0, 2000)]);
    else if (variant === "B") docs.push([i, `${pathLabel(e)}\n${stripId(e)}`.slice(0, 2000)]);
    else if (variant === "C") { const li = leadIn(e); docs.push([i, `${pathLabel(e)}\n${li ? `${li}\n` : ""}${stripId(e)}`.slice(0, 2000)]); }
    else if (variant === "D" || variant === "BD") {
      const { rule, ex } = splitExamples(variant === "D" ? e.text : stripId(e));
      const head = variant === "D" ? `${e.sectionTitle}: ` : `${pathLabel(e)}\n`;
      docs.push([i, `${head}${rule}`.slice(0, 2000)]);
      if (ex) docs.push([i, `${head}${ex}`.slice(0, 2000)]);
    } else throw new Error(`unknown variant ${variant}`);
  }
  return docs;
}

// ---- tokenizer + lexical half, exactly as production (copied from search-audit-probe.mjs) ----------
const STOP = new Set(["and", "are", "can", "card", "cards", "does", "for", "from", "has", "have", "how", "one", "that", "the", "this", "what", "when", "will", "with"]);
const tokenize = (v) => v.toLowerCase().split(/[^a-z0-9.]+/).map((t) => t.trim()).filter((t) => t.length >= 3 && !STOP.has(t));
const extractRuleIds = (v) => [...new Set([...v.matchAll(/\b\d{3}(?:\.\d+[a-z]?)?\b/gi)].map((m) => m[0]))];
const entryCites = index.map((e) => extractRuleIds(e.text).filter((id) => id !== e.ruleId));
const sets = index.map((e) => new Set(tokenize(e.searchText)));
const df = new Map();
for (const s of sets) for (const t of s) df.set(t, (df.get(t) ?? 0) + 1);
const lexVocab = new Set([...vocab].flatMap((k) => tokenize(k)));
function queryTokens(questionText, oracleText) {
  const by = new Map();
  const add = (token, source) => {
    const isKeyword = lexVocab.has(token);
    const ex = by.get(token);
    if (!ex) { by.set(token, { token, source, isKeyword }); return; }
    if (source === "question") ex.source = "question";
    ex.isKeyword = ex.isKeyword || isKeyword;
  };
  for (const t of tokenize(questionText)) add(t, "question");
  for (const t of tokenize(oracleText)) add(t, "oracle");
  return [...by.values()];
}

// ---- cases ------------------------------------------------------------------------------------------
const half = (caseId) => (createHash("sha256").update(`pft-split-1:${caseId}`).digest()[0] % 2 === 0 ? "tuning" : "check");
async function loadSet(set) {
  if (set === "corpus") {
    const dir = `${REPO}/apps/backend/src/eval/worked-solutions`;
    return readdirSync(dir).filter((f) => f.endsWith(".case.json")).map((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8"))).filter((c) => c.review?.status !== "rejected");
  }
  sg.assertSuiteIgnored({ suiteDir: SUITE });
  const { selected } = await ws.loadSuiteSelection({ suiteDir: SUITE });
  return selected;
}
const hardIds = new Set(JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final);
const NECRO = ["necropotence-silence-borne-upon-a-wind-cleanup", "necropotence-silence-borne-upon-a-wind-cleanup-in-depth"];

const CASES = {};
let mismatch = 0, total = 0;
const prodByIdx = new Map(prodEmb.ruleIds.map((id, i) => [id, prodEmb.vectors[i]]));
for (const set of SETS) {
  const out = [];
  for (const c of await loadSet(set)) {
    const parsed = askAiRequestSchema.safeParse(fid.buildCaseRequest(c));
    if (!parsed.success) continue;
    const request = parsed.data;
    const queryText = buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex });
    const vector = await embedder.embed(queryText);
    fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: "case" });
    const prod = preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true, supplementalRuleCap: CAP });
    if (!prod.enrichmentDebug.supplemental.usedSemantic) throw new Error("semantic retrieval did not run");
    const curated = new Set((prod.enrichmentDebug.curatedGameRules.topics ?? []).flatMap((t) => t.ruleNumbers ?? []));
    let questionText, cards;
    if (request.mode === "lookup") { questionText = request.question; cards = buildLookupPromptContext(request, resources.cardDetailIndex).cards ?? []; }
    else { const ctx = buildPromptContext(request, resources.cardDetailIndex); questionText = ctx.finalQuestion; cards = [...ctx.orderedStack, ...ctx.populatedZones.flatMap((z) => z.items)]; }
    const oracleText = cards.map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ");
    const qIds = new Set(extractRuleIds(`${questionText} ${oracleText}`));
    const questionIds = new Set(extractRuleIds(questionText));
    const toks = queryTokens(questionText, oracleText);
    const lex = new Float64Array(N), top = new Float64Array(N), boost = new Float64Array(N), excl = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const e = index[i];
      if (curated.has(e.ruleId)) excl[i] = 1;
      let s = 0, tp = 0;
      for (const { token, source, isKeyword } of toks) {
        if (!sets[i].has(token)) continue;
        const idf = Math.log(N / Math.max(df.get(token) ?? 1, 1));
        let w = idf; if (source === "question") w *= 3; if (isKeyword) w *= 6;
        s += w; if (idf > tp) tp = idf;
      }
      lex[i] = s; top[i] = tp;
      let b = qIds.has(e.ruleId) ? 100 : 0;
      if (e.parentRuleIds.some((p) => qIds.has(p))) b += 20;
      if (questionIds.size && entryCites[i].some((id) => questionIds.has(id))) b += 10;
      boost[i] = b;
    }
    const deciding = [...new Set(c.expected?.decidingRuleIds ?? [])];
    out.push({
      id: c.id, set, split: set === "suite" ? half(c.id) : "corpus", hard: set === "suite" && hardIds.has(c.id), necro: NECRO.indexOf(c.id),
      queryText: QMODE === "question" ? questionText : queryText, lex, top, boost, excl, curated, deciding,
      decIdx: deciding.map((id) => idxOf.get(id) ?? -1),
      prodTop: prod.enrichmentDebug.supplemental.selected.map((r) => r.ruleId)
    });
  }
  CASES[set] = out;
  console.log(`Set ${set}: ${out.length} questions; deciding citations ${out.reduce((s, c) => s + c.deciding.length, 0)}`);
}
const ALL = Object.values(CASES).flat();

// ---- ranking (production blend: divide-by-max, 60/40, boosts, curated excluded, s > 0) -------------
function order(c, cos, alpha, minmax = false) {
  let maxC = -Infinity, minC = Infinity, maxL = 0, minL = Infinity;
  for (let i = 0; i < N; i++) { if (c.excl[i]) continue; const x = cos[i]; if (x > maxC) maxC = x; if (x < minC) minC = x; const l = c.lex[i]; if (l > maxL) maxL = l; if (l < minL) minL = l; }
  const rows = [];
  for (let i = 0; i < N; i++) {
    if (c.excl[i]) continue;
    const cn = minmax ? (cos[i] - minC) / (maxC - minC || 1) : maxC > 0 ? cos[i] / maxC : 0;
    const ln = minmax ? (c.lex[i] - minL) / (maxL - minL || 1) : maxL > 0 ? c.lex[i] / maxL : 0;
    const s = alpha * cn + (1 - alpha) * ln + c.boost[i];
    if (s > 0) rows.push([i, s]);
  }
  rows.sort((a, b) => b[1] - a[1] || c.top[b[0]] - c.top[a[0]] || parseFloat(ids[a[0]]) - parseFloat(ids[b[0]]));
  return rows.map((r) => r[0]);
}
function cosines(qv, docMat, d, docRule) {
  // production cosineSimilarity (explicit norms; committed int8 vectors are not unit length)
  const cos = new Float64Array(N).fill(-Infinity);
  let qn = 0; for (let k = 0; k < d; k++) qn += qv[k] * qv[k];
  for (let j = 0; j < docRule.length; j++) {
    let s = 0, dn = 0; const o = j * d;
    for (let k = 0; k < d; k++) { const x = docMat[o + k]; s += qv[k] * x; dn += x * x; }
    const den = Math.sqrt(qn) * Math.sqrt(dn);
    const c = den === 0 ? 0 : s / den;
    if (c > cos[docRule[j]]) cos[docRule[j]] = c;
  }
  return cos;
}
function newAgg() { return { n: 0, cites: 0, found: 0, all: 0, r10: 0, r30: 0, r100: 0, m10: 0, m30: 0, m100: 0, missRanks: [] }; }
function score(c, cos, alpha, minmax, agg, necroOut) {
  const ord = order(c, cos, alpha, minmax);
  const pos = new Int32Array(N).fill(99999); ord.forEach((i, r) => (pos[i] = r + 1));
  const mo = []; for (let i = 0; i < N; i++) if (!c.excl[i]) mo.push(i);
  mo.sort((a, b) => cos[b] - cos[a]);
  const mpos = new Int32Array(N).fill(99999); mo.forEach((i, r) => (mpos[i] = r + 1));
  agg.n++;
  let all = c.deciding.length > 0;
  c.deciding.forEach((id, k) => {
    agg.cites++;
    const i = c.decIdx[k];
    const cur = c.curated.has(id);
    const p = cur ? 0 : i >= 0 ? pos[i] : 99999, mp = cur ? 0 : i >= 0 ? mpos[i] : 99999;
    if (p <= 10) agg.found++; else all = false;
    if (p <= 10) agg.r10++; if (p <= 30) agg.r30++; if (p <= 100) agg.r100++;
    if (mp <= 10) agg.m10++; if (mp <= 30) agg.m30++; if (mp <= 100) agg.m100++;
    if (p > 10 && p < 99999) agg.missRanks.push(p);
  });
  if (all) agg.all++;
  if (necroOut && c.necro >= 0) necroOut[c.necro] = ["514.3a", "514.2", "514.1"].map((id) => `${id}→${c.curated.has(id) ? "cur" : pos[idxOf.get(id)]}`).join(" ");
  return ord;
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
const groups = (c) => [c.set === "suite" ? `suite-${c.split}` : "corpus", ...(c.hard ? ["hard25"] : [])];

// ---- per model × variant ----------------------------------------------------------------------------
const summary = [];
for (const key of MODEL_KEYS) {
  const M = MODELS[key];
  let model = null;
  const getModel = async () => (model ??= await loadModel(key, { threads: 4 }));
  // query vectors (cached by prefixed-text hash; no text stored)
  const qName = `${key}__queries`;
  let qCache = loadVecs(qName) ?? new Map();
  const missing = [...new Set(ALL.map((c) => M.q + c.queryText))].filter((t) => !qCache.has(sha(t)));
  let qMs = [];
  if (missing.length) {
    const mdl = await getModel();
    for (const t of missing) { const s = performance.now(); const [v] = await mdl.embed([t]); qMs.push(performance.now() - s); qCache.set(sha(t), v); }
    saveVecs(qName, [...qCache.keys()], [...qCache.values()]);
    console.log(`[${key}] embedded ${missing.length} queries one at a time: median ${med(qMs).toFixed(1)} ms, p90 ${[...qMs].sort((a, b) => a - b)[Math.floor(qMs.length * 0.9)].toFixed(1)} ms (4 threads)`);
  }
  for (const variant of VARIANTS) {
    let docMat, d, docRule;
    if (variant === "P") {
      if (key !== "minilm") continue;
      d = prodEmb.vectors[0].length; docRule = []; docMat = new Float64Array(N * d);
      ids.forEach((id, i) => { docMat.set(prodByIdx.get(id), i * d); docRule.push(i); });
    } else {
      const docs = docTexts(variant);
      const vName = `${key}__${variant}__${sha(docs.map((x) => x[1]).join("\u0000"))}`;
      let cache = loadVecs(vName);
      if (!cache) {
        const mdl = await getModel();
        const t0 = performance.now();
        const vs = await embedMany(mdl, docs.map((x) => M.d + x[1]), { batch: 8 });
        console.log(`[${key} ${variant}] embedded ${docs.length} rule-book documents in ${((performance.now() - t0) / 1000).toFixed(0)} s`);
        saveVecs(vName, docs.map((_, j) => String(j)), vs);
        cache = loadVecs(vName);
      }
      d = cache.get("0").length; docRule = docs.map((x) => x[0]); docMat = new Float64Array(docs.length * d);
      docs.forEach((_, j) => docMat.set(cache.get(String(j)), j * d));
    }
    // cosines once per case
    const cosBy = ALL.map((c) => cosines(qCache.get(sha(M.q + c.queryText)), docMat, d, docRule));
    // fidelity: committed production vectors at 60/40 must reproduce production's top 10
    if (variant === "P" && QMODE === "production") {
      let mm = 0;
      ALL.forEach((c, k) => { const t = order(c, cosBy[k], 0.6).slice(0, 10).map((i) => ids[i]); if (t.join() !== c.prodTop.join()) mm++; });
      console.log(`Fidelity: production top 10 reproduced on ${ALL.length - mm} of ${ALL.length} questions`);
    }
    const configs = [...ALPHAS.map((a) => [a, false]), ...ALPHAS.filter((a) => a >= 0.6).map((a) => [a, true]), [1.0, false]];
    const res = [];
    for (const [alpha, mm] of configs) {
      const agg = {}; const necro = [];
      ALL.forEach((c, k) => { for (const g of groups(c)) score(c, cosBy[k], alpha, mm, (agg[g] ??= newAgg()), necro); });
      res.push({ alpha, mm, agg, necro });
    }
    const pick = (r) => r.agg["suite-tuning"]?.found ?? r.agg.corpus?.found ?? 0;
    const at60 = res.find((r) => r.alpha === 0.6 && !r.mm);
    const best = [...res].sort((a, b) => pick(b) - pick(a))[0];
    const fmt = (r, label) => {
      const g = (n) => r.agg[n] ?? newAgg();
      const st = g("suite-tuning"), sc = g("suite-check"), co = g("corpus"), h = g("hard25");
      const all = st.all + sc.all, cites = st.cites + sc.cites;
      return `${`${key} ${variant}`.padEnd(20)} ${label.padEnd(16)} suite tun ${st.found}/${st.cites} chk ${sc.found}/${sc.cites} (all ${st.found + sc.found}) | every-rule tun ${st.all} chk ${sc.all} (all ${all}) | ` +
        `hybrid r@10/30/100 ${((100 * (st.r10 + sc.r10)) / (cites || 1)).toFixed(1)}/${((100 * (st.r30 + sc.r30)) / (cites || 1)).toFixed(1)}/${((100 * (st.r100 + sc.r100)) / (cites || 1)).toFixed(1)}% chk r@100 ${((100 * sc.r100) / (sc.cites || 1)).toFixed(1)}% | ` +
        `meaning-only r@10/30/100 ${((100 * (st.m10 + sc.m10)) / (cites || 1)).toFixed(1)}/${((100 * (st.m30 + sc.m30)) / (cites || 1)).toFixed(1)}/${((100 * (st.m100 + sc.m100)) / (cites || 1)).toFixed(1)}% | ` +
        `miss median rank ${med([...st.missRanks, ...sc.missRanks])} | hard25 ${h.found} | corpus ${co.found}/${co.all} (r@100 ${co.cites ? ((100 * co.r100) / co.cites).toFixed(0) : 0}%) | necro quick ${r.necro[0] ?? "-"}; in-depth ${r.necro[1] ?? "-"}`;
    };
    console.log(`\n== ${key} ${variant} (query: ${QMODE})`);
    for (const r of res) console.log(fmt(r, `α ${r.alpha}${r.mm ? " minmax" : ""}`));
    console.log(`  → 60/40: ${fmt(at60, "60/40").split(" suite ")[1]}`);
    console.log(`  → best on tuning: α ${best.alpha}${best.mm ? " minmax" : ""}`);
    summary.push(fmt(at60, "α 0.6"), fmt(best, `best α ${best.alpha}${best.mm ? " mm" : ""}`));
  }
  await model?.ex.dispose?.();
}
console.log(`\n==== SUMMARY (suite counts are aggregate only) ====`);
for (const s of summary) console.log(s);
