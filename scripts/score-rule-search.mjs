// Free, local scorer (no API calls, no LLM) for the rule search: how many of the rules that decide a
// ruling reach the answering model's top ten. Ported from the probe at
// PRD/work/probe-prompt-format-tuning/runs/search-trained-embedder/score-trained.mjs (removed 2026-10-14;
// see git history at 16d51806), and run through the
// SHIPPED search code (`retrieveRulesForQuery` with the shipped query builder and per-card slots), never a
// reimplementation of it. Prints counts only: never a question, an id, an answer or a card.
//
// Default      Score the search this checkout ships, with the committed rule vectors and the running model.
// --cv         Score every question with a model that never trained on it (5-fold cross-validation): the
//              fold models `output/rule-search-model/onnx/F-fold0..4`, each question scored by its own
//              fold's model. Acceptance (REQ-236): check half >= 430 citations, tuning half >= 410,
//              every-rule check >= 140, hard 25 >= 15. Writes `percase-cv.json`.
// --final      Score the model trained on 100% of the data (`F-foldall`): corpus >= 410 citations and >= 355
//              every-rule cases, bench@5 >= 118, and the Necropotence rules in the top ten (both versions).
//              Not an honest generalisation number (it saw the questions); the acceptance floors are the
//              intake's own. Writes `percase-final.json`.
// --fold-prefix / --final-name  Score other model folders (default F-fold and F-foldall).
// --ranks      "caseId:ruleId,..." Also prints each corpus case's deciding rule's rank in the ordering.
// --sets       suite,corpus,bench (default). `bench` is the 156-question benchmark with three unrelated
//              cards attached, counted as exact-id hits in the top five (the intake's "bench@5").
//
// Reads the practice suite from the launch checkout (read-only). Per-question results are written ONLY
// under output/rule-search-eval/ (git-ignored). The 25 hardest practice questions are listed in
// output/rule-search-eval/hard25.json (also git-ignored; committed text gives only the count and level).
//
// Usage (from the worktree): EMBEDDING_PROVIDER=local npx tsx scripts/score-rule-search.mjs [--cv | --final]
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { mainCheckoutSuiteDir } from "./lib/practice-suite.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const SUITE = arg("--suite", process.env.PRACTICE_SUITE_DIR ?? mainCheckoutSuiteDir());
const OUT = join(REPO, "output/rule-search-eval");
const MODELS = join(REPO, "output/rule-search-model");
const HARD25 = arg("--hard25", join(OUT, "hard25.json"));
const CASES_FILE = arg("--cases", join(MODELS, "data/cases.jsonl"));
const MODE = args.includes("--cv") ? "cv" : args.includes("--final") ? "final" : "shipped";
const SETS = arg("--sets", MODE === "final" ? "corpus,bench" : MODE === "cv" ? "suite,corpus,bench" : "suite,corpus").split(",");
const RANK_CASES = (arg("--ranks", "") || "").split(",").filter(Boolean).map((pair) => pair.split(":"));
// Model folder names under output/rule-search-model/onnx (a retrain goes into new folders, e.g. F-v2-fold0..4 and F-v2-foldall).
const FOLD_PREFIX = arg("--fold-prefix", "F-fold");
const FINAL_NAME = arg("--final-name", "F-foldall");
const NECRO = ["necropotence-silence-borne-upon-a-wind-cleanup", "necropotence-silence-borne-upon-a-wind-cleanup-in-depth"];

mkdirSync(OUT, { recursive: true });
// The results folder must be git-ignored before anything is written to it.
const ignored = spawnSync("git", ["check-ignore", "-q", join(OUT, "probe.json")], { cwd: REPO });
if (ignored.status !== 0) throw new Error("output/rule-search-eval/ is not git-ignored; refusing to write per-question results.");

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const { resolveRunEnv } = await imp("scripts/lib/run-env.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const sg = await imp("scripts/lib/practice-suite.mjs");
const { loadGoldCases } = await imp("scripts/lib/gold-cases.mjs");
const { preparePromptInput, buildRetrievalQueryInput, DEFAULT_SUPPLEMENTAL_RULE_CAP } = await imp("apps/backend/src/prompt/preparation.ts");
// The shipped cap (REQ-190): search excerpts only; a card's keyword sets (REQ-235) come on top and are counted in the characters.
const CAP = DEFAULT_SUPPLEMENTAL_RULE_CAP;
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const R = await imp("apps/backend/src/gameRulesRetrieval.ts");
const B = await imp("apps/backend/src/eval/ragRetrievalBenchmark.ts");

const env = resolveRunEnv({ processEnv: process.env, confirmed: true });
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);
// The tuning/check split was fixed ("pft-split-1") on the questions' original ids; the practice suite's ids were
// renamed since, so the original assignment is read from a git-ignored map when present (default: the hash of the id).
const SPLIT_FILE = join(OUT, "split.json");
const splitMap = existsSync(SPLIT_FILE) ? JSON.parse(readFileSync(SPLIT_FILE, "utf8")) : {};
const half = (id) => splitMap[id] ?? (createHash("sha256").update("pft-split-1:" + id).digest()[0] % 2 === 0 ? "tuning" : "check");
const sha = (t) => createHash("sha256").update(t).digest("hex").slice(0, 24);

const resources = await fid.loadPromptResources({ env });
const index = resources.gameRulesRuleIndex;
const baseScoring = R.getDefaultScoringResources();
const hardIds = new Set(existsSync(HARD25) ? JSON.parse(readFileSync(HARD25, "utf8")).ids : []);
const foldOf = new Map();
if (MODE === "cv") {
  for (const line of readFileSync(CASES_FILE, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    foldOf.set(`${row.set}:${row.id}`, row.fold);
  }
}

// ---- cases --------------------------------------------------------------------------------------------------
const CASES = [];
const cardVectorByKey = new Map();
async function prepRequestCase(set, c) {
  const parsed = askAiRequestSchema.safeParse(fid.buildCaseRequest(c));
  if (!parsed.success) return null;
  const request = parsed.data;
  const input = buildRetrievalQueryInput(request, { cardDetailIndex: resources.cardDetailIndex });
  const query = R.buildRetrievalQuery(input);
  // Curated topics do not depend on the search: a lexical pass names the rules they carry.
  const lexical = preparePromptInput(request, { ...resources, collectEnrichmentDebug: true, supplementalRuleCap: CAP });
  const curated = new Set((lexical.enrichmentDebug.curatedGameRules.topics ?? []).flatMap((t) => t.ruleNumbers ?? []));
  return {
    id: c.id, set, split: set === "suite" ? half(c.id) : set, hard: set === "suite" && hardIds.has(c.id), necro: set === "corpus" ? NECRO.indexOf(c.id) : -1,
    fold: MODE === "cv" ? foldOf.get(`${set}:${c.id}`) : undefined,
    deciding: [...new Set(c.expected?.decidingRuleIds ?? [])], curated, query, request, cards: input.cards
  };
}
if (SETS.includes("suite")) {
  // the suite lives in the launch checkout; ask git there whether it is ignored (read-only)
  sg.assertSuiteIgnored({ suiteDir: SUITE, checkIgnore: (p) => sg.gitCheckIgnore(p, { cwd: dirname(dirname(SUITE)) }) });
  // Every selectable suite question counts, stale or not: a rule-data fix changes a snapshot hash, which
  // would otherwise drop questions from the universe the targets were measured on (1,181 usable).
  const { selected } = sg.selectSuiteCases(await loadGoldCases(join(SUITE, "cases"), { external: true }), sg.normalizeSuiteFilters(), { isStale: () => false });
  for (const c of selected) { const p = await prepRequestCase("suite", c); if (p) CASES.push(p); }
}
if (SETS.includes("corpus")) {
  const dir = join(REPO, "apps/backend/src/eval/worked-solutions");
  const corpus = readdirSync(dir).filter((f) => f.endsWith(".case.json")).map((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8"))).filter((c) => c.review?.status !== "rejected");
  for (const c of corpus) { const p = await prepRequestCase("corpus", c); if (p) CASES.push(p); }
}
if (SETS.includes("bench")) {
  const cards = B.buildPollutionCards(resources.cardDetailIndex, { withOracleText: true });
  for (const [i, item] of B.loadBenchmarkCorpus().items.entries()) {
    CASES.push({
      id: `bench-${i}`, set: "bench", split: "bench", hard: false, necro: -1, fold: MODE === "cv" ? i % 5 : undefined,
      deciding: [item.expectedRuleId], curated: new Set(), query: R.buildRetrievalQuery({ questionText: item.question, cards }), request: null, cards
    });
  }
}
console.log(`cases: ${["suite", "corpus", "bench"].filter((s) => SETS.includes(s)).map((s) => `${s} ${CASES.filter((c) => c.set === s).length}`).join(", ")}; mode ${MODE}`);

// ---- ranking per mode ------------------------------------------------------------------------------------------
async function rankShipped(c) {
  const vector = await embedder.embed(c.query.queryText);
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: "case" });
  const cardVectors = [];
  for (const card of c.query.perCardTexts) {
    if (!cardVectorByKey.has(card.key)) cardVectorByKey.set(card.key, await embedder.embed(card.text));
    const v = cardVectorByKey.get(card.key);
    if (v) cardVectors.push({ cardName: card.cardName, vector: v });
  }
  return { ids: R.retrieveRulesForQuery(c.query.tokens, c.query.queryRuleIds, index, c.curated, CAP, baseScoring, vector, c.query.questionRuleIds, cardVectors, R.keywordRuleSetsForCards(c.cards ?? [], index)), vector };
}

// Trained-model scoring: a model folder's q8 ONNX embeds the rules and every query text, then the shipped
// retrieval code ranks with those vectors (a copy of the scoring resources with this model's rule vectors).
let hf;
async function loadPipe(name) {
  hf ??= await import("@huggingface/transformers");
  hf.env.allowRemoteModels = false;
  hf.env.allowLocalModels = true;
  hf.env.localModelPath = join(MODELS, "onnx");
  return hf.pipeline("feature-extraction", name, { dtype: "q8" });
}
const DOCS = index.map((e) => `${e.sectionTitle}: ${e.text}`.slice(0, 2000));
async function modelScorer(name) {
  const pipe = await loadPipe(name);
  const embed = async (text) => Array.from((await pipe(text, { pooling: "mean", normalize: true })).data);
  const cachePath = join(OUT, "vectors", `${name}.json`);
  mkdirSync(dirname(cachePath), { recursive: true });
  const docKey = sha(DOCS.join("\u0000"));
  let vectors;
  if (existsSync(cachePath) && JSON.parse(readFileSync(cachePath, "utf8")).key === docKey) vectors = JSON.parse(readFileSync(cachePath, "utf8")).vectors;
  else {
    vectors = [];
    for (let s = 0; s < DOCS.length; s += 16) {
      const out = await pipe(DOCS.slice(s, s + 16), { pooling: "mean", normalize: true });
      const d = out.dims[1];
      for (let j = 0; j < Math.min(16, DOCS.length - s); j++) vectors.push(Array.from(out.data.subarray(j * d, (j + 1) * d)));
    }
    writeFileSync(cachePath, JSON.stringify({ key: docKey, vectors }));
  }
  const scoring = { ...baseScoring, runtimeModelId: undefined, ruleEmbeddings: { model: name, dims: 384, ruleIds: index.map((e) => e.ruleId), vectors } };
  const textCache = new Map();
  const embedCached = async (text) => { if (!textCache.has(text)) textCache.set(text, await embed(text)); return textCache.get(text); };
  return {
    async rank(c, max = CAP) {
      const vector = await embedCached(c.query.queryText);
      const cardVectors = [];
      for (const card of c.query.perCardTexts) cardVectors.push({ cardName: card.cardName, vector: await embedCached(card.text) });
      return R.retrieveRulesForQuery(c.query.tokens, c.query.queryRuleIds, index, c.curated, max, scoring, vector, c.query.questionRuleIds, cardVectors, R.keywordRuleSetsForCards(c.cards ?? [], index));
    },
    async dispose() { await pipe.dispose?.(); }
  };
}

// ---- scoring ------------------------------------------------------------------------------------------------------
const blank = () => ({ q: 0, cites: 0, found: 0, all: 0, f5: 0, chars: 0 });
const agg = {};
const percase = {};
const necroOut = [null, null];
const rankLines = [];
const textLen = new Map(index.map((e) => [e.ruleId, e.text.length]));
const scorers = new Map();
async function scorerFor(c) {
  const name = MODE === "cv" ? `${FOLD_PREFIX}${c.fold}` : FINAL_NAME;
  if (!scorers.has(name)) scorers.set(name, await modelScorer(name));
  return scorers.get(name);
}
for (const c of CASES) {
  let selected;
  if (MODE === "shipped") selected = (await rankShipped(c)).ids;
  else selected = await (await scorerFor(c)).rank(c);
  const top = selected.map((r) => r.ruleId);
  const flags = c.deciding.map((id) => (c.curated.has(id) ? 2 : top.includes(id) ? 1 : 0));
  const found = flags.filter(Boolean).length;
  const groups = c.set === "suite" ? [`suite-${c.split}`, ...(c.hard ? ["hard25"] : [])] : [c.set];
  for (const g of groups) {
    const a = (agg[g] ??= blank());
    a.q++; a.cites += c.deciding.length; a.found += found;
    if (c.deciding.length && found === c.deciding.length) a.all++;
    a.chars += top.reduce((sum, id) => sum + (textLen.get(id) ?? 0), 0);
    if (c.set === "bench") a.f5 += top.slice(0, 5).includes(c.deciding[0]) ? 1 : 0;
  }
  percase[`${c.set}:${c.id}`] = flags;
  if (c.necro >= 0) necroOut[c.necro] = ["514.1", "514.2", "514.3a"].map((id) => (c.curated.has(id) ? "cur" : top.indexOf(id) >= 0 ? top.indexOf(id) + 1 : "-")).join("/");
  for (const [id, ruleId] of RANK_CASES) {
    if (id !== c.id) continue;
    const full = MODE === "shipped" ? null : await (await scorerFor(c)).rank(c, index.length);
    const ids = full ? full.map((r) => r.ruleId) : (await (async () => {
      const vector = await embedder.embed(c.query.queryText);
      return R.retrieveRulesForQuery(c.query.tokens, c.query.queryRuleIds, index, c.curated, index.length, baseScoring, vector, c.query.questionRuleIds, []).map((r) => r.ruleId);
    })());
    rankLines.push(`rank ${id} ${ruleId}: ${ids.indexOf(ruleId) + 1 || "-"}`);
  }
}
for (const s of scorers.values()) await s.dispose();
writeFileSync(join(OUT, `percase-${MODE}.json`), JSON.stringify(percase));

const g = (n) => agg[n] ?? blank();
const suiteFound = g("suite-tuning").found + g("suite-check").found;
const suiteAll = g("suite-tuning").all + g("suite-check").all;
for (const line of rankLines) console.log(line);
console.log(`${MODE === "shipped" ? "shipped search" : MODE === "cv" ? "5-fold cross-validated" : "100% model"}:`);
if (SETS.includes("suite")) {
  console.log(`  suite: tuning ${g("suite-tuning").found} / check ${g("suite-check").found} citations (total ${suiteFound}); every-rule tuning ${g("suite-tuning").all} / check ${g("suite-check").all} (total ${suiteAll}); hard 25 ${g("hard25").found} of ${g("hard25").cites}`);
  const sq = g("suite-tuning").q + g("suite-check").q;
  if (sq) console.log(`  rule characters per suite question (search excerpts plus keyword sets): ${Math.round((g("suite-tuning").chars + g("suite-check").chars) / sq)}`);
}
if (SETS.includes("corpus")) {
  console.log(`  corpus: ${g("corpus").found} citations of ${g("corpus").cites}; ${g("corpus").all} of ${g("corpus").q} cases with every deciding rule; Necropotence 514.1/514.2/514.3a ranks: Quick ${necroOut[0] ?? "-"}, In-Depth ${necroOut[1] ?? "-"}`);
  if (g("corpus").q) console.log(`  rule characters per corpus question (search excerpts plus keyword sets): ${Math.round(g("corpus").chars / g("corpus").q)}`);
}
if (SETS.includes("bench")) console.log(`  bench@5: ${g("bench").f5} of ${g("bench").q}`);
