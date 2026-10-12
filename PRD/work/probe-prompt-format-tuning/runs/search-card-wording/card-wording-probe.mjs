// Free, local probe (no API calls, no model calls): can what the cards say be turned into search
// terms that find the deciding rule? Extends (copies) runs/audit-search/search-audit-probe.mjs, which
// re-implements production's hybrid ranking and verified it against production's top 10.
// Variants, each on two bases ("today" = production; "fixed" = today + S1 card keywords weighted as
// keywords + S5 sentence dots stripped):
//   phrase -> rule-concept map (concept-map.mjs) added to the query; per-card separate search merged
//   by reserved slots or rank fusion; raw oracle text at low weight; the In-Depth turn step.
// --set necro | corpus | suite | hard25 ; --half tuning|check|all (suite only; default all)
// --only <regex> to restrict variants. Aggregate counts only for the practice suite.
// Usage (from .worktrees/probe-pft): EMBEDDING_PROVIDER=local npx tsx <this file> --set suite
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { conceptTerms } from "./concept-map.mjs";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/practice-suite`;
const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const SET = arg("--set", "necro");
const HALF = arg("--half", "all");
const ONLY = args.includes("--only") ? new RegExp(arg("--only")) : null;
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

// ---- cases -----------------------------------------------------------------------------------------
const WS_DIR = `${REPO}/apps/backend/src/eval/worked-solutions`;
let cases;
if (SET === "necro") {
  cases = ["necropotence-silence-borne-upon-a-wind-cleanup", "necropotence-silence-borne-upon-a-wind-cleanup-in-depth"].map((n) => JSON.parse(readFileSync(`${WS_DIR}/${n}.case.json`, "utf8")));
} else if (SET === "bench") {
  const B = await imp("apps/backend/src/eval/ragRetrievalBenchmark.ts");
  cases = B.loadBenchmarkCorpus().items.map((it, i) => ({ id: `bench-${i}`, bench: it }));
  globalThis.__benchNames = B.loadCardNameByOracleId();
} else if (SET === "corpus") {
  cases = readdirSync(WS_DIR).filter((f) => f.endsWith(".case.json")).map((f) => JSON.parse(readFileSync(`${WS_DIR}/${f}`, "utf8"))).filter((c) => c.review?.status !== "rejected");
} else {
  sg.assertSuiteIgnored({ suiteDir: SUITE });
  const { selected } = await ws.loadSuiteSelection({ suiteDir: SUITE });
  cases = selected;
  if (SET === "hard25") {
    const ids = new Set(JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final);
    cases = selected.filter((c) => ids.has(c.id));
  }
  if (SET === "suite" && HALF !== "all") cases = cases.filter((c) => half(c.id) === HALF);
}
const SPLIT = SET === "suite";
const DETAIL = SET === "necro";
console.log(`Set ${SET}${SPLIT ? ` (half: ${HALF})` : ""}: ${cases.length} questions`);

// ---- resources -------------------------------------------------------------------------------------
const resources = await fid.loadPromptResources({ env });
const index = resources.gameRulesRuleIndex;
const vocab = R.loadGameRulesKeywordVocabulary(join(REPO, "apps/backend/data/gameRulesKeywordVocabulary.json"));
const emb = R.loadGameRulesRuleEmbeddings(join(REPO, "apps/backend/data/gameRulesRuleEmbeddings.json"));
const vecById = new Map(emb.ruleIds.map((id, i) => [id, emb.vectors[i]]));
const byId = new Map(index.map((e) => [e.ruleId, e]));
const RULES = index.filter((e) => vecById.has(e.ruleId));
const RIDS = RULES.map((e) => e.ruleId);
const RVEC = RULES.map((e) => vecById.get(e.ruleId));
const N = index.length;

const { env: hfEnv, pipeline } = await import("@huggingface/transformers");
hfEnv.allowRemoteModels = false;
hfEnv.cacheDir = LOCAL_MODEL_CACHE_DIR;
const extractor = await pipeline("feature-extraction", LOCAL_MODEL_ID, { dtype: "q8" });

// ---- tokenizers (same as the audit) -----------------------------------------------------------------
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

// ---- embedding cache (records first-compute time for the latency estimate) --------------------------
const embCache = new Map();
let freshMs = 0; // time spent on first computes (excluded from wall time; re-added per use as recorded ms)
async function embedText(t) {
  if (embCache.has(t)) return embCache.get(t);
  const t0 = performance.now();
  const v = Array.from((await extractor(t, { pooling: "mean", normalize: true })).data);
  const rec = { v, ms: performance.now() - t0 };
  freshMs += rec.ms;
  embCache.set(t, rec);
  return rec;
}
function cosines(v) {
  const out = new Float64Array(RULES.length);
  for (let i = 0; i < RULES.length; i++) out[i] = R.cosineSimilarity(v, RVEC[i]); // production's own function
  return out;
}

// tokens: Map token -> { mult, kw }
function addTok(map, token, mult, kw) {
  const ex = map.get(token);
  if (!ex) { map.set(token, { mult, kw }); return; }
  ex.mult = Math.max(ex.mult, mult);
  ex.kw = ex.kw || kw;
}
// production hybrid ranking over all non-curated rules; returns ordered rule ids
function rank(lex, toks, qv, curated, qIds = new Set(), questionIds = new Set()) {
  const cos = cosines(qv);
  const lexS = new Float64Array(RULES.length), top = new Float64Array(RULES.length);
  for (const [token, { mult, kw }] of toks) {
    const p = lex.postings.get(token);
    if (!p) continue;
    const idf = Math.log(N / Math.max(lex.df.get(token) ?? 1, 1));
    const w = idf * mult * (kw ? 6 : 1);
    for (const i of p) { lexS[i] += w; if (idf > top[i]) top[i] = idf; }
  }
  let maxC = 0, maxL = 0;
  for (let i = 0; i < RULES.length; i++) { if (curated.has(RIDS[i])) continue; if (cos[i] > maxC) maxC = cos[i]; if (lexS[i] > maxL) maxL = lexS[i]; }
  const rows = [];
  for (let i = 0; i < RULES.length; i++) {
    const id = RIDS[i];
    if (curated.has(id)) continue;
    let b = 0;
    if (qIds.size || questionIds.size) {
      const e = byId.get(id);
      if (qIds.has(id)) b += 100;
      if (e.parentRuleIds.some((p) => qIds.has(p))) b += 20;
      if (questionIds.size && entryCites.get(id).some((x) => questionIds.has(x))) b += 10;
    }
    const s = 0.6 * (maxC > 0 ? cos[i] / maxC : 0) + 0.4 * (maxL > 0 ? lexS[i] / maxL : 0) + b;
    if (s > 0) rows.push({ id, s, top: top[i] });
  }
  rows.sort((a, b) => b.s - a.s || b.top - a.top || parseFloat(a.id) - parseFloat(b.id));
  return rows.map((r) => r.id);
}

// ---- variants ---------------------------------------------------------------------------------------
const PHASE_WORDS = { untap: "untap step", upkeep: "upkeep step", draw: "draw step", main_1: "main phase", main_2: "main phase", end_step: "end step", cleanup: "cleanup step", combat: "combat phase" };
const VARIANTS = [];
for (const base of ["today", "fixed"]) {
  const B = base === "today" ? "T" : "F";
  const v = (name, o) => VARIANTS.push([`${B} ${name}`, { base, ...o }]);
  v("base", {});
  v("H turn step (In-Depth)", { phase: true });
  for (const m of [0.5, 1, 2, 3]) v(`1 concept lex x${m}`, { concept: { mult: m } });
  for (const m of [1, 2]) v(`1 concept lex x${m} + embed`, { concept: { mult: m, embed: true } });
  v("1 concept embed only", { concept: { mult: 0, embed: true } });
  v("1 concept x2 + question phrases", { concept: { mult: 2, fromQuestion: true } });
  v("2 per-card oracle, reserve 2", { perCard: { q: "oracle", mode: "reserve", n: 2 } });
  v("2 per-card oracle, reserve 3", { perCard: { q: "oracle", mode: "reserve", n: 3 } });
  v("2 per-card oracle, fusion w.1", { perCard: { q: "oracle", mode: "rrf", w: 0.1 } });
  v("2 per-card oracle, fusion w.25", { perCard: { q: "oracle", mode: "rrf", w: 0.25 } });
  v("2 per-card concept, reserve 2", { perCard: { q: "concept", mode: "reserve", n: 2 } });
  for (const m of [0.1, 0.25, 0.5, 1]) v(`3 oracle lex x${m}`, { oracle: { mult: m } });
  v("3 oracle lex x0.25 + embed", { oracle: { mult: 0.25, embed: true } });
  v("3 oracle embed only", { oracle: { mult: 0, embed: true } });
  v("3 pre-REQ-178 (oracle lex x1 + kw + embed)", { oracle: { mult: 1, embed: true, kw: true } });
  v("4 concept x2 + turn step", { concept: { mult: 2 }, phase: true });
  // round 2 combinations (chosen from the tuning half + corpus guard of round 1)
  const CE = { mult: 2, embed: true }, OE = { mult: 0, embed: true }, PC = { q: "oracle", mode: "reserve", n: 2 };
  v("5 concept x2+embed + oracle embed", { concept: CE, oracle: OE });
  v("5 concept x2 + oracle embed", { concept: { mult: 2 }, oracle: OE });
  v("5 concept x2+embed + oracle lex x0.25+embed", { concept: CE, oracle: { mult: 0.25, embed: true } });
  v("5 concept x2+embed + per-card reserve 2", { concept: CE, perCard: PC });
  v("5 oracle embed + per-card reserve 2", { oracle: OE, perCard: PC });
  v("5 concept x2+embed + oracle embed + per-card reserve 2", { concept: CE, oracle: OE, perCard: PC });
  v("5 concept x2+embed + oracle embed + turn step", { concept: CE, oracle: OE, phase: true });
  v("5 concept x2+embed + turn step", { concept: CE, phase: true });
  // round 3: per-card picks only when the main ranking also places them within the top G (guards unrelated cards)
  for (const g of [50, 100, 200]) v(`6 concept x2+embed + per-card reserve 2 gate<=${g}`, { concept: CE, perCard: { ...PC, gate: g } });
  v("6 per-card reserve 2 gate<=100", { perCard: { ...PC, gate: 100 } });
  v("6 concept x2+embed + per-card reserve 2 gate<=100 + turn step", { concept: CE, perCard: { ...PC, gate: 100 }, phase: true });
}
const ACTIVE = VARIANTS.filter(([n]) => !ONLY || ONLY.test(n) || n.endsWith(" base"));

const blank = () => ({ q: 0, nDec: 0, found: 0, f5: 0, all: 0, withRules: 0, chars: 0, ms: 0 });
const agg = Object.fromEntries(ACTIVE.map(([n]) => [n, { tuning: blank(), check: blank(), all: blank() }]));
const perCase = {};
const WATCH = ["514.3a", "514.2", "514.1", "500.5b"];
let mismatch = 0, skipped = 0, conceptHits = 0, cardsSeen = 0;
const conceptFreq = {};
let done = 0;

let POLLUTION = null;
if (SET === "bench") {
  const ids = [...resources.cardDetailIndex.keys()].sort();
  POLLUTION = [1000, 9000, 20000].map((i) => ids[i % ids.length]).map((id) => ({ name: globalThis.__benchNames.get(id) ?? "", ...resources.cardDetailIndex.get(id) }));
  console.log(`Pollution cards: ${POLLUTION.map((k) => k.name).join(", ")}`);
}
let cleanF5 = 0, cleanF10 = 0;
for (const c of cases) {
  let request = null, queryText, vector, prodEmbedMs, prodTop = null, curated = new Set();
  if (c.bench) {
    const sig = POLLUTION.map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ");
    queryText = `${c.bench.question} ${sig}`;
    const r = await embedText(queryText); vector = r.v; prodEmbedMs = r.ms;
    c.expected = { decidingRuleIds: [c.bench.expectedRuleId] };
    const clean = rank(LEX.today, new Map(prodTokenize(c.bench.question).map((t) => [t, { mult: 3, kw: LEX.today.vocab.has(t) }])), (await embedText(c.bench.question)).v, curated, new Set(extractRuleIds(c.bench.question)), new Set(extractRuleIds(c.bench.question)));
    if (clean.slice(0, 5).includes(c.bench.expectedRuleId)) cleanF5++;
    if (clean.slice(0, 10).includes(c.bench.expectedRuleId)) cleanF10++;
  } else {
  const parsed = askAiRequestSchema.safeParse(fid.buildCaseRequest(c));
  if (!parsed.success) { skipped++; continue; }
  request = parsed.data;
  queryText = buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex });
  const t0 = performance.now();
  vector = await embedder.embed(queryText);
  prodEmbedMs = performance.now() - t0;
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: "case" });
  const prod = preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true, supplementalRuleCap: CAP });
  if (!prod.enrichmentDebug.supplemental.usedSemantic) throw new Error("semantic retrieval did not run");
  prodTop = prod.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
  curated = new Set((prod.enrichmentDebug.curatedGameRules.topics ?? []).flatMap((t) => t.ruleNumbers ?? []));
  }

  let questionText, cards, phase = null;
  if (c.bench) {
    questionText = c.bench.question;
    cards = POLLUTION;
  } else if (request.mode === "lookup") {
    questionText = request.question;
    cards = buildLookupPromptContext(request, resources.cardDetailIndex).cards ?? [];
  } else {
    const ctx = buildPromptContext(request, resources.cardDetailIndex);
    questionText = ctx.finalQuestion;
    cards = [...ctx.orderedStack, ...ctx.populatedZones.flatMap((z) => z.items)];
    phase = ctx.gameContext?.turnPhase ?? null;
  }
  const signal = cards.map((k) => R.buildCompactCardSignal(k.name, k.typeLine, k.keywords)).join(" ");
  const qIds = new Set(extractRuleIds(`${questionText} ${signal}`));
  const questionIds = new Set(extractRuleIds(questionText));
  const uniqCards = [...new Map(cards.map((k) => [k.name, k])).values()];
  const cardConcepts = uniqCards.map((k) => conceptTerms(k.oracleText, k.typeLine, k.name));
  const concepts = [...new Set(cardConcepts.flat())];
  const qConcepts = conceptTerms(questionText);
  cardsSeen += uniqCards.length;
  conceptHits += cardConcepts.filter((x) => x.length).length;
  for (const t of concepts) conceptFreq[t] = (conceptFreq[t] ?? 0) + 1;
  const oracleAll = uniqCards.map((k) => k.oracleText ?? "").join(" ");
  const phaseWords = phase ? PHASE_WORDS[phase] ?? `${phase}` : null;
  const deciding = [...new Set(c.expected?.decidingRuleIds ?? [])];
  const h = SPLIT ? half(c.id) : "all";
  const perCardCache = new Map();
  perCase[c.id] = {};

  for (const [name, v] of ACTIVE) {
    const lex = LEX[v.base];
    const t1 = performance.now(), fresh0 = freshMs;
    let embedMs = 0;
    const qt = v.phase && phaseWords ? `${questionText} ${phaseWords}` : questionText;
    const toks = new Map();
    for (const t of lex.tokenize(qt)) addTok(toks, t, 3, lex.vocab.has(t));
    const cardKw = new Set(cards.flatMap((k) => (k.keywords ?? []).flatMap((kw) => lex.tokenize(kw))));
    for (const t of lex.tokenize(signal)) addTok(toks, t, 1, lex.vocab.has(t) || (v.base === "fixed" && cardKw.has(t)));
    const conceptList = v.concept ? [...new Set([...concepts, ...(v.concept.fromQuestion ? qConcepts : [])])] : [];
    if (v.concept?.mult) for (const t of lex.tokenize(conceptList.join(" "))) addTok(toks, t, v.concept.mult, false);
    if (v.oracle?.mult) for (const t of lex.tokenize(oracleAll)) addTok(toks, t, v.oracle.mult, !!v.oracle.kw && lex.vocab.has(t));
    // query vector
    let qv = vector, eText = queryText;
    const extras = [];
    if (v.phase && phaseWords) extras.push(phaseWords);
    if (v.concept?.embed && conceptList.length) extras.push(conceptList.join(", "));
    if (v.oracle?.embed) eText = `${questionText} ${uniqCards.map((k) => `${k.name} ${k.typeLine} ${(k.keywords ?? []).join(" ")} ${k.oracleText ?? ""}`).join(" ")}`;
    if (extras.length || v.oracle?.embed) qv = (await embedText(`${eText} ${extras.join(" ")}`.trim())).v;
    embedMs += prodEmbedMs; // one query embedding either way; a changed query text costs no extra call
    let order = rank(lex, toks, qv, curated, qIds, questionIds);
    // per-card separate search
    if (v.perCard) {
      const lists = [];
      for (let ci = 0; ci < uniqCards.length; ci++) {
        const k = uniqCards[ci];
        let text = v.perCard.q === "oracle" ? (k.oracleText ?? "") : cardConcepts[ci].join(", ");
        if (v.perCard.q === "oracle" && k.name) for (const part of k.name.split(" // ")) text = text.split(part).join("this");
        if (!text.trim()) continue;
        const key = `${v.base}|${v.perCard.q}|${k.name}`;
        if (!perCardCache.has(key)) {
          const r = await embedText(text);
          const ct = new Map();
          for (const t of lex.tokenize(text)) addTok(ct, t, 1, false);
          const t2 = performance.now();
          const o = rank(lex, ct, r.v, curated);
          const rankMs = performance.now() - t2;
          freshMs += rankMs;
          perCardCache.set(key, { order: o, ms: r.ms + rankMs });
        }
        const pc = perCardCache.get(key);
        embedMs += pc.ms; // embed + its own ranking pass (first-compute time)
        lists.push(pc.order);
      }
      if (lists.length && v.perCard.mode === "reserve") {
        const keep = order.slice(0, CAP - v.perCard.n);
        const chosen = new Set(keep);
        const picks = [];
        const mainPos = new Map(order.map((id, i) => [id, i + 1]));
        const ok = (id) => !v.perCard.gate || (mainPos.get(id) ?? Infinity) <= v.perCard.gate;
        for (let depth = 0; depth < 5 && picks.length < v.perCard.n; depth++) for (const L of lists) { const id = L[depth]; if (id && !chosen.has(id) && ok(id) && picks.length < v.perCard.n) { chosen.add(id); picks.push(id); } }
        order = [...keep, ...picks, ...order.filter((id) => !chosen.has(id))];
      } else if (lists.length && v.perCard.mode === "rrf") {
        const sc = new Map(order.map((id, i) => [id, 1 / (60 + i + 1)]));
        for (const L of lists) L.slice(0, 50).forEach((id, i) => sc.set(id, (sc.get(id) ?? 0) + v.perCard.w / (60 + i + 1)));
        order = [...sc.keys()].sort((a, b) => sc.get(b) - sc.get(a));
      }
    }
    const ms = performance.now() - t1 - (freshMs - fresh0) + embedMs; // own scoring wall time + recorded embed/per-card time
    const top = order.slice(0, CAP);
    if (name === "T base" && prodTop && top.join() !== prodTop.join()) { mismatch++; if (DETAIL || process.env.DEBUG_FID) console.log(`MISMATCH ${DETAIL ? c.id : ""}\n  prod ${prodTop.join(" ")}\n  mine ${top.join(" ")}`); }
    const pos = new Map(order.map((id, i) => [id, i + 1]));
    let found = 0;
    for (const id of deciding) if (curated.has(id) || top.includes(id)) found++;
    const chars = top.reduce((s, id) => s + (byId.get(id)?.text.length ?? 0), 0);
    for (const hh of SPLIT ? [h, "all"] : ["all"]) {
      const a = agg[name][hh];
      a.q++; a.nDec += deciding.length; a.found += found; a.f5 += deciding.filter((id) => curated.has(id) || top.slice(0, 5).includes(id)).length; if (deciding.length) a.withRules++; if (deciding.length && found === deciding.length) a.all++; a.chars += chars; a.ms += ms;
    }
    perCase[c.id][name] = found;
    if (DETAIL) {
      const r = (id) => (curated.has(id) ? "curated" : pos.get(id) ?? "—");
      console.log(`  ${c.id.endsWith("in-depth") ? "In-Depth    " : "Quick Lookup"} ${name.padEnd(46)} ${WATCH.map((id) => `${id}→${r(id)}`).join("  ")}  deciding found ${found}/${deciding.length}`);
    }
  }
  if (DETAIL) console.log(`  card concepts: ${uniqCards.map((k, i) => `${k.name}: [${cardConcepts[i].join(" | ")}]`).join("; ")}\n`);
  if (++done % 200 === 0) console.log(`  ${done}/${cases.length}`);
}

// ---- report ---------------------------------------------------------------------------------------
console.log(`\nFidelity: today-base top 10 differs from production on ${mismatch} of ${done}; skipped ${skipped}.`);
console.log(`Cards with at least one concept match: ${conceptHits} of ${cardsSeen}`);
if (!DETAIL) console.log(`Most frequent concept entries: ${Object.entries(conceptFreq).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => `"${k}" ${n}`).join(", ")}`);
const T = agg["T base"];
const fmtH = (a, b) => `${String(a.found).padStart(4)} (${a.found - b.found >= 0 ? "+" : ""}${a.found - b.found}) / ${String(a.all).padStart(3)} (${a.all - b.all >= 0 ? "+" : ""}${a.all - b.all})`;
console.log(`\nvariant | ${SPLIT ? "tuning cites/every | check cites/every | " : ""}all cites / every-rule (Δ vs T base) | Δ vs F base (all) | rule chars/q (Δ) | ms/q (Δ)`);
for (const [name] of ACTIVE) {
  const a = agg[name], F = agg["F base"] ?? T;
  const parts = [];
  if (SPLIT) parts.push(fmtH(a.tuning, T.tuning), fmtH(a.check, T.check));
  parts.push(fmtH(a.all, T.all), `${a.all.found - F.all.found >= 0 ? "+" : ""}${a.all.found - F.all.found} / ${a.all.all - F.all.all >= 0 ? "+" : ""}${a.all.all - F.all.all}`);
  parts.push(`${(a.all.chars / a.all.q).toFixed(0)} (${((a.all.chars - T.all.chars) / a.all.q).toFixed(0)})`, `${(a.all.ms / a.all.q).toFixed(0)} (${((a.all.ms - T.all.ms) / a.all.q).toFixed(1)})`);
  console.log(`${name.padEnd(48)} | ${parts.join(" | ")}`);
}
if (SET === "bench") { console.log(`\nBenchmark (REQ-177 pollution test; ${done} questions): clean query (question only) top-5 ${cleanF5}, top-10 ${cleanF10}`); for (const [name] of ACTIVE) console.log(`  ${name.padEnd(48)} polluted top-5 ${agg[name].all.f5}  top-10 ${agg[name].all.found}`); }
console.log(`(deciding citations total: ${T.all.nDec}; questions with deciding rules: ${T.all.withRules}${SPLIT ? `; tuning ${T.tuning.q} q / ${T.tuning.nDec} cites, check ${T.check.q} q / ${T.check.nDec} cites` : ""})`);
if (!DETAIL && SET !== "corpus" && SET !== "bench") {
  const out = sg.resolveInsideSuite(`${SUITE}/reports/pft-card-wording-${SET}-${HALF}.json`, { suiteDir: SUITE });
  writeFileSync(out, JSON.stringify({ agg, perCase }, null, 1));
}
