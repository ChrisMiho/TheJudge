// Free, local probe (no API calls): audit of System 3 rule search.
// Re-implements production's hybrid blend (gameRulesRetrieval.ts scoreIndex), checks it reproduces
// production's top 10 on every question, then measures tokenizer, blend, boost, keyword, length and
// query-construction effects, and tries one fix at a time.
// --set necro  : the two Necropotence corpus cases (+ the corpus follow-up variant), full detail printed.
// --set suite / --set hard25 : practice suite, aggregate counts only (no question text, ids, answers, cards).
// Usage (from .worktrees/probe-pft): EMBEDDING_PROVIDER=local npx tsx <this file> --set necro|suite|hard25
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/practice-suite`;
const args = process.argv.slice(2);
const SET = args.includes("--set") ? args[args.indexOf("--set") + 1] : "necro";
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

// ---- cases -----------------------------------------------------------------------------------------
let cases;
if (SET === "necro") {
  const dir = `${REPO}/apps/backend/src/eval/worked-solutions`;
  const quick = JSON.parse(readFileSync(`${dir}/necropotence-silence-borne-upon-a-wind-cleanup.case.json`, "utf8"));
  const deep = JSON.parse(readFileSync(`${dir}/necropotence-silence-borne-upon-a-wind-cleanup-in-depth.case.json`, "utf8"));
  const followUp = { ...quick, id: "necro-follow-up-step-2 (corpus variant; production sees only this turn's text)", question: quick.layers.variants[0].steps[1] };
  cases = [quick, deep, followUp];
} else if (SET === "corpus-game" || SET === "corpus") {
  // the project's own rules test cases (worked-solutions corpus); corpus-game = In-Depth (gameState) cases only
  const { readdirSync } = await import("node:fs");
  const dir = `${REPO}/apps/backend/src/eval/worked-solutions`;
  cases = readdirSync(dir).filter((f) => f.endsWith(".case.json")).map((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8")))
    .filter((c) => c.review?.status !== "rejected" && (SET === "corpus" || c.gameState));
} else {
  sg.assertSuiteIgnored({ suiteDir: SUITE });
  const { selected } = await ws.loadSuiteSelection({ suiteDir: SUITE });
  cases = selected;
  if (SET === "hard25") {
    const ids = new Set(JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final);
    cases = selected.filter((c) => ids.has(c.id));
  }
}
const DETAIL = SET === "necro";
const WATCH = ["514.1", "514.2", "514.3", "514.3a", "514.3b", "500.5b", "500.11", "614.10", "117.3", "117.3a", "603.3", "603.3b", "608.2h", "611.2a", "601.3"];
console.log(`Set ${SET}: ${cases.length} questions`);

// ---- resources -------------------------------------------------------------------------------------
const resources = await fid.loadPromptResources({ env });
const index = resources.gameRulesRuleIndex;
const stats = R.loadGameRulesTokenStats(join(REPO, "apps/backend/data/gameRulesTokenStats.json"));
const vocab = R.loadGameRulesKeywordVocabulary(join(REPO, "apps/backend/data/gameRulesKeywordVocabulary.json"));
const emb = R.loadGameRulesRuleEmbeddings(join(REPO, "apps/backend/data/gameRulesRuleEmbeddings.json"));
const vecById = new Map(emb.ruleIds.map((id, i) => [id, emb.vectors[i]]));
const byId = new Map(index.map((e) => [e.ruleId, e]));

// word-piece lengths (as embedded) and a 256-piece-truncated re-embedding of the long rules
const { env: hfEnv, pipeline } = await import("@huggingface/transformers");
hfEnv.allowRemoteModels = false;
hfEnv.cacheDir = LOCAL_MODEL_CACHE_DIR;
const extractor = await pipeline("feature-extraction", LOCAL_MODEL_ID, { dtype: "q8" });
const tok = extractor.tokenizer;
const embText = (e) => `${e.sectionTitle}: ${e.text}`.slice(0, 2000);
const pieceIds = (t) => { const x = tok(t).input_ids; return Array.from(x.data ?? x).map(Number); };
const wp = new Map(index.map((e) => [e.ruleId, pieceIds(embText(e)).length]));
const vec256 = new Map(vecById);
for (const e of index) {
  const ids = pieceIds(embText(e));
  if (ids.length <= 256) continue;
  const head = tok.decode(ids.slice(1, 255)); // drop [CLS], keep 254 pieces so [CLS]+254+[SEP]=256
  vec256.set(e.ruleId, Array.from((await extractor(head, { pooling: "mean", normalize: true })).data));
}
const embedQ = async (t) => Array.from((await extractor(t, { pooling: "mean", normalize: true })).data);

// ---- tokenizers ------------------------------------------------------------------------------------
const STOP = new Set(["and", "are", "can", "card", "cards", "does", "for", "from", "has", "have", "how", "one", "that", "the", "this", "what", "when", "will", "with"]);
const prodTokenize = (v) => v.toLowerCase().split(/[^a-z0-9.]+/).map((t) => t.trim()).filter((t) => t.length >= 3 && !STOP.has(t));
// fix A: strip sentence punctuation dots, keep internal ones (514.3a) — "step." -> "step", "e.g." kept as "e.g"
const dotTokenize = (v) => prodTokenize(v).map((t) => t.replace(/^\.+|\.+$/g, "")).filter((t) => t.length >= 3 && !STOP.has(t));
// fix B: A + light stemming (plural/-ed/-ing, double consonant, final e) on word tokens only
const stem = (w) => {
  if (/\d/.test(w)) return w;
  let s = w.replace(/ies$/, "y");
  for (const suf of ["ing", "ed", "s"]) if (s.endsWith(suf) && !s.endsWith("ss") && s.length - suf.length >= 3) { s = s.slice(0, -suf.length); break; }
  s = s.replace(/([b-df-hj-np-tv-z])\1$/, "$1").replace(/e$/, "");
  return s;
};
const stemTokenize = (v) => dotTokenize(v).map(stem).filter((t) => t.length >= 3 && !STOP.has(t));

const extractRuleIds = (v) => [...new Set([...v.matchAll(/\b\d{3}(?:\.\d+[a-z]?)?\b/gi)].map((m) => m[0]))];
const entryCites = new Map(index.map((e) => [e.ruleId, extractRuleIds(e.text).filter((id) => id !== e.ruleId)]));

function buildLex(tokenize) {
  const sets = new Map(index.map((e) => [e.ruleId, new Set(tokenize(e.searchText))]));
  const df = new Map();
  for (const s of sets.values()) for (const t of s) df.set(t, (df.get(t) ?? 0) + 1);
  return { tokenize, sets, df, vocab: new Set([...vocab].flatMap((k) => tokenize(k))) };
}
const LEX = { prod: buildLex(prodTokenize), dot: buildLex(dotTokenize), stem: buildLex(stemTokenize) };
// production df must match the committed stats file
let dfMismatch = 0;
for (const [t, n] of LEX.prod.df) if (stats.df.get(t) !== n) dfMismatch++;
console.log(`Committed token stats vs recomputed: ${dfMismatch} mismatching tokens; N ${stats.N} vs index ${index.length}`);

const N = index.length;
function queryTokens(lex, questionText, oracleText, { cardKeywordsAreKeywords = false, cardKeywordTokens = new Set(), dropNameTokens = null } = {}) {
  const by = new Map();
  const add = (token, source) => {
    const isKeyword = lex.vocab.has(token) || (cardKeywordsAreKeywords && source === "oracle" && cardKeywordTokens.has(token));
    const ex = by.get(token);
    if (!ex) { by.set(token, { token, source, isKeyword }); return; }
    if (source === "question") ex.source = "question";
    ex.isKeyword = ex.isKeyword || isKeyword;
  };
  for (const t of lex.tokenize(questionText)) add(t, "question");
  for (const t of lex.tokenize(oracleText)) if (!dropNameTokens || !dropNameTokens.has(t)) add(t, "oracle");
  return [...by.values()];
}
function lexScore(lex, ruleId, tokens) {
  let s = 0, top = 0;
  const set = lex.sets.get(ruleId);
  const hits = [];
  for (const { token, source, isKeyword } of tokens) {
    if (!set.has(token)) continue;
    const idf = Math.log(N / Math.max(lex.df.get(token) ?? 1, 1));
    let w = idf;
    if (source === "question") w *= 3;
    if (isKeyword) w *= 6;
    s += w;
    hits.push({ token, w, source });
    if (idf > top) top = idf;
  }
  return { s, top, hits };
}
const boostOf = (ruleId, qIds, questionIds) => {
  const e = byId.get(ruleId);
  let b = qIds.has(ruleId) ? 100 : 0;
  if (e.parentRuleIds.some((p) => qIds.has(p))) b += 20;
  if (questionIds.size && entryCites.get(ruleId).some((id) => questionIds.has(id))) b += 10;
  return b;
};
function blend(rows, { alpha = 0.6, minmax = false } = {}) {
  let maxC = -Infinity, maxL = 0, minC = Infinity, minL = Infinity;
  for (const r of rows) { maxC = Math.max(maxC, r.cos); minC = Math.min(minC, r.cos); maxL = Math.max(maxL, r.lex); minL = Math.min(minL, r.lex); }
  const out = [];
  for (const r of rows) {
    const cn = minmax ? (r.cos - minC) / (maxC - minC || 1) : maxC > 0 ? r.cos / maxC : 0;
    const ln = minmax ? (r.lex - minL) / (maxL - minL || 1) : maxL > 0 ? r.lex / maxL : 0;
    const s = alpha * cn + (1 - alpha) * ln + r.boost;
    if (s > 0) out.push({ id: r.id, s, cn, ln, top: r.top, cos: r.cos, lex: r.lex, boost: r.boost, hits: r.hits });
  }
  out.sort((a, b) => b.s - a.s || b.top - a.top || parseFloat(a.id) - parseFloat(b.id));
  return out;
}

// ---- variants --------------------------------------------------------------------------------------
const VARIANTS = [
  ["production", {}],
  ["A strip sentence dots", { lex: "dot" }],
  ["B dots + light stemming", { lex: "stem" }],
  ["C card keywords weighted as keywords (REQ-180)", { kw: true }],
  ["D card-name words out of word match", { dropNames: true }],
  ["E true min-max blend", { minmax: true }],
  ["F long rules embedded at 256 pieces", { v256: true }],
  ["G query vector = question only", { qOnly: true }],
  ["H In-Depth: turn step added to query", { phase: true }],
  ["A+B+C+D+E (all tokenizer/blend fixes)", { lex: "stem", kw: true, dropNames: true, minmax: true }]
];

const agg = Object.fromEntries(VARIANTS.map(([n]) => [n, { found: 0, all: 0, ranks: [], selWp: 0, sel: {} }]));
const A = {
  questions: 0, skipped: 0, mismatch: 0, withRules: 0,
  qTokens: 0, qDotTokens: 0, qDeadTokens: 0, qDeadDot: 0, qDeadInflection: 0, queriesWithDeadDot: 0,
  queriesWithIds: 0, idsTotal: 0, idsNoRuleWord: 0, idsMatchingIndex: 0, boostedSelected: 0, boostedDeciding: 0, crossRefFired: 0,
  queriesKwFire: 0, kwFromQuestion: 0, kwFromCards: 0, cardKwTokens: 0, cardKwNotInVocab: 0, cardKwNamesNotInVocab: {},
  nameTokenShareSel: [], commonShareSel: [],
  maxCos: [], cos10Norm: [], cosMedNorm: [], lexZeroShare: [], lex10Norm: [], selCosPart: [], selLexPart: [], spreadCos: [], spreadLex: [],
  tie10: 0, queryWp: [], queryOver256: 0, queryOver128: 0,
  lenBuckets: {}, cosTop10ByLen: {}
};
const LB = (n) => (n <= 32 ? "≤32" : n <= 64 ? "33-64" : n <= 128 ? "65-128" : n <= 256 ? "129-256" : ">256");
for (const e of index) { const b = LB(wp.get(e.ruleId)); A.lenBuckets[b] ??= { rules: 0, slots: 0, deciding: 0, decidingReached: 0, decidingSelected: 0, cosTop10: 0 }; A.lenBuckets[b].rules++; }
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
const PHASE_WORDS = { untap: "untap step", upkeep: "upkeep step", draw: "draw step", main_1: "main phase", main_2: "main phase", end_step: "end step", cleanup: "cleanup step", combat: "combat phase" };
const detailOut = {};

for (const c of cases) {
  const parsed = askAiRequestSchema.safeParse(fid.buildCaseRequest(c));
  if (!parsed.success) { A.skipped++; continue; }
  const request = parsed.data;
  const queryText = buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex });
  const vector = await embedder.embed(queryText);
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: "case" });
  const prod = preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true, supplementalRuleCap: CAP });
  if (!prod.enrichmentDebug.supplemental.usedSemantic) throw new Error("semantic retrieval did not run");
  const curated = new Set((prod.enrichmentDebug.curatedGameRules.topics ?? []).flatMap((t) => t.ruleNumbers ?? []));
  A.questions++;

  // query parts exactly as production builds them
  let questionText, cards, phase = null;
  if (request.mode === "lookup") {
    const ctx = buildLookupPromptContext(request, resources.cardDetailIndex);
    questionText = request.question;
    cards = ctx.cards ?? [];
  } else {
    const ctx = buildPromptContext(request, resources.cardDetailIndex);
    questionText = ctx.finalQuestion;
    cards = [...ctx.orderedStack, ...ctx.populatedZones.flatMap((z) => z.items)];
    phase = ctx.gameContext?.turnPhase ?? null;
  }
  const oracleText = cards.map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ");
  const nameTokens = new Set(cards.flatMap((k) => prodTokenize(k.name)));
  const typeKwTokens = new Set(cards.flatMap((k) => prodTokenize(`${k.typeLine} ${(k.keywords ?? []).join(" ")}`)));
  const dropNamesFor = (lex) => new Set([...cards.flatMap((k) => lex.tokenize(k.name))].filter((t) => !new Set(cards.flatMap((k) => lex.tokenize(`${k.typeLine} ${(k.keywords ?? []).join(" ")}`))).has(t)));
  const cardKwFor = (lex) => new Set(cards.flatMap((k) => (k.keywords ?? []).flatMap((kw) => lex.tokenize(kw))));
  const qIds = new Set(extractRuleIds(`${questionText} ${oracleText}`));
  const questionIds = new Set(extractRuleIds(questionText));
  const pTokens = queryTokens(LEX.prod, questionText, oracleText);

  // --- query-level diagnostics
  const qw = pieceIds(queryText).length; A.queryWp.push(qw); if (qw > 256) A.queryOver256++; if (qw > 128) A.queryOver128++;
  let deadDot = 0;
  for (const t of LEX.prod.tokenize(questionText)) {
    A.qTokens++;
    const dotted = /[a-z]\.$/.test(t);
    if (dotted) A.qDotTokens++;
    if (!LEX.prod.df.has(t)) {
      A.qDeadTokens++;
      if (dotted && LEX.prod.df.has(t.replace(/\.+$/, ""))) { A.qDeadDot++; deadDot++; }
      else if (LEX.stem.df.has(stem(t.replace(/\.+$/, "")))) A.qDeadInflection++;
    }
  }
  if (deadDot) A.queriesWithDeadDot++;
  if (qIds.size) {
    A.queriesWithIds++;
    for (const id of qIds) {
      A.idsTotal++;
      if (!new RegExp(`(rule|rules|cr|section)\\s*${id.replace(".", "\\.")}`, "i").test(questionText)) A.idsNoRuleWord++;
      if (byId.has(id) || index.some((e) => e.parentRuleIds.includes(id))) A.idsMatchingIndex++;
    }
  }
  if (questionIds.size) A.crossRefFired++;
  const kwToks = pTokens.filter((t) => t.isKeyword);
  if (kwToks.length) A.queriesKwFire++;
  A.kwFromQuestion += kwToks.filter((t) => t.source === "question").length;
  A.kwFromCards += kwToks.filter((t) => t.source === "oracle").length;
  for (const k of cards) for (const kw of k.keywords ?? []) {
    A.cardKwTokens++;
    if (!prodTokenize(kw).some((t) => vocab.has(t))) { A.cardKwNotInVocab++; A.cardKwNamesNotInVocab[kw] = (A.cardKwNamesNotInVocab[kw] ?? 0) + 1; }
  }

  // --- vectors for variants
  const vQ = await embedQ(questionText);
  const phaseWords = phase ? PHASE_WORDS[phase] ?? `${phase}` : null;
  const vPhase = phaseWords ? await embedQ(`${queryText} ${phaseWords}`) : vector;

  const deciding = [...new Set(c.expected?.decidingRuleIds ?? [])];
  if (deciding.length) A.withRules++;

  for (const [name, v] of VARIANTS) {
    const lex = LEX[v.lex ?? "prod"];
    const qt = v.phase && phaseWords ? `${questionText} ${phaseWords}` : questionText;
    const toks = queryTokens(lex, qt, oracleText, { cardKeywordsAreKeywords: v.kw, cardKeywordTokens: cardKwFor(lex), dropNameTokens: v.dropNames ? dropNamesFor(lex) : null });
    const qv = v.qOnly ? vQ : v.phase ? vPhase : vector;
    const vecs = v.v256 ? vec256 : vecById;
    const rows = index.filter((e) => !curated.has(e.ruleId) && vecs.has(e.ruleId)).map((e) => {
      const { s, top, hits } = lexScore(lex, e.ruleId, toks);
      return { id: e.ruleId, cos: R.cosineSimilarity(qv, vecs.get(e.ruleId)), lex: s, top, hits, boost: boostOf(e.ruleId, qIds, questionIds) };
    });
    const order = blend(rows, { minmax: v.minmax });
    const top = order.slice(0, CAP).map((r) => r.id);
    const a = agg[name];
    for (const id of top) { a.selWp += wp.get(id); a.sel[id] = (a.sel[id] ?? 0) + 1; }
    const pos = new Map(order.map((r, i) => [r.id, i + 1]));
    let all = deciding.length > 0;
    for (const id of deciding) {
      const hit = curated.has(id) || top.includes(id);
      if (hit) a.found++; else all = false;
      if (!curated.has(id) && byId.has(id)) a.ranks.push(pos.get(id) ?? 99999);
    }
    if (all) a.all++;

    if (name === "production") {
      const prodTop = prod.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
      if (top.join() !== prodTop.join()) A.mismatch++;
      // blend diagnostics
      const cosSorted = [...rows].sort((x, y) => y.cos - x.cos);
      const maxC = cosSorted[0].cos, maxL = Math.max(...rows.map((r) => r.lex));
      A.maxCos.push(maxC);
      A.cos10Norm.push(cosSorted[9].cos / maxC);
      A.cosMedNorm.push(cosSorted[cosSorted.length >> 1].cos / maxC);
      A.lexZeroShare.push(rows.filter((r) => r.lex === 0).length / rows.length);
      const lexSorted = rows.map((r) => r.lex).sort((x, y) => y - x);
      A.lex10Norm.push(maxL ? lexSorted[9] / maxL : 0);
      const sel = order.slice(0, CAP);
      A.selCosPart.push(sel.reduce((s, r) => s + 0.6 * r.cn, 0) / CAP);
      A.selLexPart.push(sel.reduce((s, r) => s + 0.4 * r.ln, 0) / CAP);
      const t100 = order.slice(0, 100);
      A.spreadCos.push(0.6 * (Math.max(...t100.map((r) => r.cn)) - Math.min(...t100.map((r) => r.cn))));
      A.spreadLex.push(0.4 * (Math.max(...t100.map((r) => r.ln)) - Math.min(...t100.map((r) => r.ln))));
      if (order[9] && order[10] && order[9].s === order[10].s) A.tie10++;
      for (const r of sel) {
        if (r.boost > 0) { A.boostedSelected++; if (deciding.includes(r.id)) A.boostedDeciding++; }
        const tot = r.hits.reduce((s, h) => s + h.w, 0);
        if (tot > 0) {
          A.nameTokenShareSel.push(r.hits.filter((h) => h.source === "oracle" && nameTokens.has(h.token) && !typeKwTokens.has(h.token)).reduce((s, h) => s + h.w, 0) / tot);
          A.commonShareSel.push(r.hits.filter((h) => (LEX.prod.df.get(h.token) ?? 0) > 0.05 * N).reduce((s, h) => s + h.w, 0) / tot);
        }
        A.lenBuckets[LB(wp.get(r.id))].slots++;
      }
      for (const id of cosSorted.slice(0, CAP).map((r) => r.id)) A.lenBuckets[LB(wp.get(id))].cosTop10++;
      for (const id of deciding) if (byId.has(id)) { const b = A.lenBuckets[LB(wp.get(id))]; b.deciding++; if (curated.has(id) || top.includes(id)) b.decidingReached++; if (top.includes(id)) b.decidingSelected++; }

      if (DETAIL) {
        const cosRank = new Map(cosSorted.map((r, i) => [r.id, i + 1]));
        const lexRank = new Map([...rows].sort((x, y) => y.lex - x.lex).map((r, i) => [r.id, i + 1]));
        const fmt = (r) => `${r.id.padEnd(8)} blended ${r.s.toFixed(3)} = 0.6×cos ${r.cn.toFixed(3)} (raw ${r.cos.toFixed(3)}, cos rank ${cosRank.get(r.id)}) + 0.4×word ${r.ln.toFixed(3)} (raw ${r.lex.toFixed(1)}, word rank ${lexRank.get(r.id)})${r.boost ? ` + boost ${r.boost}` : ""}; ${wp.get(r.id)} pieces; words: ${r.hits.map((h) => `${h.token}${h.source === "oracle" ? "*" : ""}(${h.w.toFixed(1)})`).join(" ")}`;
        console.log(`\n=== ${c.id} (${request.mode}) ===`);
        console.log(`Query text embedded: ${JSON.stringify(queryText)}  [${qw} word pieces]`);
        console.log(`Word-match tokens (* = card signal, K = keyword ×6): ${pTokens.map((t) => `${t.token}${t.source === "oracle" ? "*" : ""}${t.isKeyword ? "K" : ""}`).join(" ")}`);
        console.log(`Rule ids found in query: ${[...qIds].join(", ") || "none"}; turn step in game state: ${phase ?? "n/a"} (not in query)`);
        console.log(`Curated topics: ${(prod.enrichmentDebug.curatedGameRules.topicIds ?? []).join(", ")} → rules excluded from search: ${[...curated].join(", ")}`);
        console.log(`Max raw cosine ${maxC.toFixed(3)}; max raw word score ${maxL.toFixed(1)}`);
        console.log(`Top 10 (production order, verified):`);
        sel.forEach((r, i) => console.log(`  ${String(i + 1).padStart(2)}. ${fmt(r)}`));
        console.log(`Watched rules:`);
        for (const id of [...new Set([...deciding, ...WATCH])]) {
          if (curated.has(id)) { console.log(`  ${id.padEnd(8)} in a curated topic (always in prompt)`); continue; }
          const r = order.find((x) => x.id === id);
          console.log(`  rank ${String(pos.get(id) ?? "—").padStart(4)}  ${r ? fmt(r) : `${id} not scored`}`);
        }
        detailOut[c.id] = { queryText };
      }
    } else if (DETAIL) {
      console.log(`  [${name}] deciding ranks: ${deciding.map((id) => `${id}→${curated.has(id) ? "curated" : pos.get(id)}`).join(", ")}; top10: ${top.join(" ")}`);
    }
  }
  if (!DETAIL && A.questions % 200 === 0) console.log(`  ${A.questions}/${cases.length}`);
}

// ---- report ---------------------------------------------------------------------------------------
const pct = (n, d) => `${n} (${d ? ((100 * n) / d).toFixed(0) : 0}%)`;
console.log(`\nFidelity: re-implemented production top 10 differs on ${A.mismatch} of ${A.questions} questions. Skipped (production rejects): ${A.skipped}.`);
if (!DETAIL) {
  console.log(`\n-- Tokenizer`);
  console.log(`Question tokens: ${A.qTokens}; ending in a sentence dot: ${pct(A.qDotTokens, A.qTokens)}`);
  console.log(`Question tokens matching no rule at all: ${pct(A.qDeadTokens, A.qTokens)} — of those, dead only because of a trailing dot: ${A.qDeadDot}; dead only because of inflection: ${A.qDeadInflection}`);
  console.log(`Questions losing at least one word to a trailing dot: ${pct(A.queriesWithDeadDot, A.questions)}`);
  const dotTypes = [...LEX.prod.df.keys()].filter((t) => /[a-z]\.$/.test(t));
  console.log(`Index: distinct dot-ended word tokens ${dotTypes.length}; rules containing at least one: ${[...LEX.prod.sets.values()].filter((s) => [...s].some((t) => /[a-z]\.$/.test(t))).length} of ${N}`);
  console.log(`\n-- Boosts`);
  console.log(`Questions whose query holds a rule-id-like number: ${pct(A.queriesWithIds, A.questions)}; ids ${A.idsTotal}, not preceded by "rule/CR": ${A.idsNoRuleWord}, matching an index rule or parent: ${A.idsMatchingIndex}`);
  console.log(`Cross-reference boost armed (question cites an id): ${A.crossRefFired}. Boosted rules in top 10: ${A.boostedSelected}, of which deciding: ${A.boostedDeciding}`);
  console.log(`\n-- Keywords`);
  console.log(`Questions where the keyword ×6 fires: ${pct(A.queriesKwFire, A.questions)}; keyword tokens from question ${A.kwFromQuestion}, from cards ${A.kwFromCards}`);
  console.log(`Card keyword entries: ${A.cardKwTokens}; not in the 20-word vocabulary (so no keyword weight): ${pct(A.cardKwNotInVocab, A.cardKwTokens)}; distinct such keywords ${Object.keys(A.cardKwNamesNotInVocab).length}; most common: ${Object.entries(A.cardKwNamesNotInVocab).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, n]) => `${k}×${n}`).join(", ")}`);
  console.log(`\n-- What fills the word-match score of selected rules`);
  console.log(`Median share from card-name words: ${med(A.nameTokenShareSel).toFixed(2)}; selected rules where card-name words give ≥50%: ${A.nameTokenShareSel.filter((x) => x >= 0.5).length} of ${A.nameTokenShareSel.length}`);
  console.log(`Median share from common words (in >5% of rules): ${med(A.commonShareSel).toFixed(2)}`);
  console.log(`\n-- Blend scales (medians per question)`);
  console.log(`max raw cosine ${med(A.maxCos).toFixed(3)}; 10th-best cosine ÷ max ${med(A.cos10Norm).toFixed(3)}; median rule cosine ÷ max ${med(A.cosMedNorm).toFixed(3)}`);
  console.log(`share of rules with word score 0: ${med(A.lexZeroShare).toFixed(3)}; 10th-best word score ÷ max ${med(A.lex10Norm).toFixed(3)}`);
  console.log(`selected top 10, mean points from meaning ${med(A.selCosPart).toFixed(3)} vs word match ${med(A.selLexPart).toFixed(3)}`);
  console.log(`spread across the blended top 100: meaning ${med(A.spreadCos).toFixed(3)} vs word match ${med(A.spreadLex).toFixed(3)} (points of the 0–1 blend)`);
  console.log(`exact ties at the 10/11 boundary: ${A.tie10}`);
  console.log(`\n-- Query length in word pieces: median ${med(A.queryWp)}, max ${Math.max(...A.queryWp)}; over 128: ${A.queryOver128}; over 256: ${A.queryOver256}`);
  console.log(`\n-- Rule length (word pieces as embedded) vs selection`);
  console.log(`bucket   | rules | share of index | share of top-10 slots | meaning-alone top-10 slots | deciding citations | deciding reached (incl. curated) | deciding found by search | search hits per 100 slots`);
  const totSlots = A.questions * CAP;
  for (const b of ["≤32", "33-64", "65-128", "129-256", ">256"]) {
    const x = A.lenBuckets[b];
    console.log(`${b.padEnd(8)} | ${String(x.rules).padStart(5)} | ${((100 * x.rules) / N).toFixed(1)}% | ${((100 * x.slots) / totSlots).toFixed(1)}% | ${((100 * x.cosTop10) / totSlots).toFixed(1)}% | ${x.deciding} | ${pct(x.decidingReached, x.deciding)} | ${x.decidingSelected} | ${x.slots ? ((100 * x.decidingSelected) / x.slots).toFixed(1) : 0}`);
  }
  console.log(`(per-rule rate: slots per rule per question = share of slots ÷ share of index)`);
}
console.log(`\n-- Variants: deciding-rule citations in prompt / questions with every deciding rule / median rank of missing / mean selected-rule length (pieces) / most frequent excerpts`);
for (const [name] of VARIANTS) {
  const a = agg[name];
  const top = Object.entries(a.sel).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([id, n]) => `${id} ${Math.round((100 * n) / A.questions)}%`).join(", ");
  console.log(`  ${name.padEnd(44)} ${a.found} / ${a.all} / ${med(a.ranks.filter((r) => r > CAP))} / ${(a.selWp / (A.questions * CAP)).toFixed(0)} / ${top}`);
}
if (!DETAIL) {
  const out = sg.resolveInsideSuite(`${SUITE}/reports/pft-audit-search-${SET}.json`, { suiteDir: SUITE });
  writeFileSync(out, JSON.stringify({ variants: Object.fromEntries(Object.entries(agg).map(([k, v]) => [k, { found: v.found, all: v.all }])) }, null, 1));
}
