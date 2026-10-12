// Free, local probe (no API calls, no LLM). Stage 2 of the reranker probe: cross-encoder rerankers via
// transformers.js (public Hugging Face ONNX weights, downloaded into .worktrees/probe-pft/output/models-probe/hf).
// Reads stage-1 candidate lists (rerank-candidates.mjs), scores (query, rule) pairs for the top 100, caches
// scores keyed by sha256(query)+ruleId (no text stored), then evaluates rerank-only and blended orders.
//
//   --stage score --model <hf id> [--n 100] [--tv plain|label] [--qv full|question] [--sets suite,corpus] [--half tuning|check|all] [--dtype q8|fp32] [--threads n]
//   --stage info  --model <hf id>       size, load time, token-limit truncation, ms to rerank N=30/50/100
//   --stage eval  --models a,b,...     every cached (model × tv × qv) → table; blends tuned on the tuning half
// Practice-suite output: counts and rule ids only.
// Usage (from .worktrees/probe-pft): npx tsx <this file> --stage …
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const OUT = `${REPO}/output/models-probe`;
const SUITE_CAND = `${REPO}/output/practice-suite/reports/pft-rerank-candidates-suite.json`;
const CR = "/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/data/cr/source.txt";
const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : d);
const STAGE = arg("stage", "eval");
const DTYPE = arg("dtype", "q8");
const THREADS = arg("threads", null);
const CAP = 10;

const { env: hfEnv, AutoTokenizer, AutoModelForSequenceClassification } = await import("@huggingface/transformers");

// ---- rule texts ------------------------------------------------------------------------------------
const index = JSON.parse(readFileSync(`${REPO}/apps/backend/data/gameRulesRuleIndex.json`, "utf8"));
const byId = new Map(index.map((e) => [e.ruleId, e]));
const parts = {}, sections = {}, families = {};
for (const line of readFileSync(CR, "utf8").split(/\r?\n/)) {
  let m;
  if ((m = line.match(/^(\d)\. (.+)$/))) parts[m[1]] ??= m[2].trim(); // first hit only: glossary entries reuse "1. …"
  else if ((m = line.match(/^(\d{3})\. (.+)$/))) sections[m[1]] ??= m[2].trim();
  else if ((m = line.match(/^(\d{3}\.\d+)\. (.+)$/))) families[m[1]] ??= m[2].trim();
}
const STRAY_PART = /\s*\n[\s\n]*\d\. [A-Z][^\n]*\s*$/; // audit D2: part title glued to the last rule of a part
const plainText = (e) => `${e.sectionTitle}: ${e.text}`.slice(0, 2000); // exactly what is embedded today
function labelText(e) {
  const id = e.ruleId, sec = id.slice(0, 3);
  let path = `${parts[id[0]] ?? ""} › ${sec} ${sections[sec] ?? e.sectionTitle}`;
  let lead = "";
  const fam = id.match(/^(\d{3}\.\d+)[a-z]+$/)?.[1];
  if (fam && families[fam]) {
    const f = families[fam];
    if (f.length < 60 && !/[.:]$/.test(f)) path += ` › ${fam} ${f}`; // heading family, e.g. "702.19 Trample"
    else lead = `${fam}. ${f.length > 400 ? `${f.slice(0, 400)}…` : f}`; // parent lead-in rule
  }
  const body = e.text.replace(STRAY_PART, "");
  return `${path}\n${lead ? `Lead-in: ${lead}\n` : ""}${body}`.slice(0, 2400);
}
const TEXT = { plain: plainText, label: labelText };

// ---- candidates ------------------------------------------------------------------------------------
const loadSet = (s) => JSON.parse(readFileSync(s === "suite" ? SUITE_CAND : `${OUT}/candidates-${s}.json`, "utf8"));
const qhash = (q) => createHash("sha256").update(q).digest("hex").slice(0, 16);
const slug = (m) => m.replace(/[^A-Za-z0-9._-]+/g, "_");
const cacheFile = (m, tv, qv, dt) => `${OUT}/scores/${slug(m)}.${dt}.${tv}.${qv}.json`;
const loadCache = (f) => (existsSync(f) ? new Map(Object.entries(JSON.parse(readFileSync(f, "utf8")))) : new Map());
// concurrent scorers write separate shards (<base>.<shard>.json); readers merge the base file and every shard
const loadMerged = (base) => {
  const stem = base.replace(/\.json$/, ""), dir = `${OUT}/scores`, m = new Map();
  for (const f of readdirSync(dir)) { const p = `${dir}/${f}`; if (p === base || (p.startsWith(`${stem}.`) && p.split("/").pop().split(".").length === stem.split("/").pop().split(".").length + 2)) for (const [k, v] of loadCache(p)) m.set(k, v); }
  return m;
};
const saveCache = (f, m) => writeFileSync(f, JSON.stringify(Object.fromEntries(m)));

async function loadModel(model) {
  hfEnv.allowRemoteModels = true;
  hfEnv.cacheDir = `${OUT}/hf`;
  const t0 = Date.now();
  const tokenizer = await AutoTokenizer.from_pretrained(model);
  const opts = { dtype: DTYPE };
  if (THREADS) opts.session_options = { intraOpNumThreads: Number(THREADS), interOpNumThreads: 1 };
  const net = await AutoModelForSequenceClassification.from_pretrained(model, opts);
  const loadMs = Date.now() - t0;
  const maxLen = Math.min(tokenizer.model_max_length && tokenizer.model_max_length < 1e6 ? tokenizer.model_max_length : 512, 1024);
  return { tokenizer, net, loadMs, maxLen };
}
async function scorePairs(M, queries, docs) {
  const inputs = M.tokenizer(queries, { text_pair: docs, padding: true, truncation: true, max_length: M.maxLen });
  const { logits } = await M.net(inputs);
  const d = logits.data, w = logits.dims[1] ?? 1;
  return Array.from({ length: queries.length }, (_, i) => Number(w === 1 ? d[i] : d[i * w + w - 1]));
}

if (STAGE === "show") for (const id of arg("ids", "514.3a").split(",")) console.log(`--- ${id}\n${labelText(byId.get(id))}\n`);

if (STAGE === "sanity") {
  // corpus only: one case, reranker score for each of its top-N candidates plus its deciding rules
  const model = arg("model"), tv = arg("tv", "plain"), qv = arg("qv", "full");
  const r = loadSet("corpus").find((x) => x.key === arg("case", "necropotence-silence-borne-upon-a-wind-cleanup"));
  const M = await loadModel(model);
  const q = qv === "full" ? r.queryText : r.questionText;
  console.log(`query: ${q}\ndeciding: ${r.deciding.join(" ")}; curated: ${r.curated.join(" ")}`);
  const ids = [...new Set([...r.top.slice(0, Number(arg("n", "30"))).map(([id]) => id), ...r.deciding.filter((id) => byId.has(id) && !r.curated.includes(id)), "514.3a", "514.2"])];
  const sc = await scorePairs(M, ids.map(() => q), ids.map((id) => TEXT[tv](byId.get(id))));
  const hyb = new Map(r.top.map(([id], i) => [id, i + 1]));
  ids.map((id, i) => ({ id, s: sc[i] })).sort((a, b) => b.s - a.s).forEach((x, i) =>
    console.log(`${String(i + 1).padStart(3)} ${x.id.padEnd(9)} rr ${x.s.toFixed(2).padStart(7)}  hybrid rank ${hyb.get(x.id) ?? r.watchRanks[x.id] ?? ">100"}${r.deciding.includes(x.id) ? "  DECIDING" : ""}  ${byId.get(x.id).text.slice(0, 70).replace(/\n/g, " ")}`));
}

if (STAGE === "score") {
  const model = arg("model"), tv = arg("tv", "plain"), qv = arg("qv", "full"), H = arg("half", "all");
  const SETS = arg("sets", "suite,corpus").split(",");
  const BATCH = Number(arg("batch", "16"));
  const TOPN = Number(arg("n", "100"));
  const base = cacheFile(model, tv, qv, DTYPE);
  const f = base.replace(/\.json$/, `.${H}${TOPN}${SETS.join("")}.json`);
  const cache = loadMerged(base);
  const M = await loadModel(model);
  console.log(`${model} ${DTYPE} loaded in ${M.loadMs} ms; max length ${M.maxLen}; cache has ${cache.size}`);
  const todo = new Map();
  for (const s of SETS) for (const r of loadSet(s)) {
    if (s === "suite" && H !== "all" && r.half !== H) continue;
    const q = qv === "full" ? r.queryText : r.questionText;
    const h = qhash(q);
    for (const [id] of r.top.slice(0, TOPN)) { const k = `${h}|${id}`; if (!cache.has(k) && !todo.has(k)) todo.set(k, [q, TEXT[tv](byId.get(id))]); }
  }
  const items = [...todo.entries()].sort((a, b) => a[1][0].length + a[1][1].length - b[1][0].length - b[1][1].length);
  console.log(`pairs to score: ${items.length}`);
  const t0 = Date.now();
  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH);
    const sc = await scorePairs(M, chunk.map((x) => x[1][0]), chunk.map((x) => x[1][1]));
    chunk.forEach(([k], j) => cache.set(k, +sc[j].toFixed(5)));
    if ((i / BATCH) % 250 === 249) { saveCache(f, cache); console.log(`  ${i + BATCH}/${items.length} ${((Date.now() - t0) / 1000).toFixed(0)} s`); }
  }
  saveCache(f, cache);
  console.log(`done: ${items.length} pairs in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

if (STAGE === "info") {
  const model = arg("model");
  const M = await loadModel(model);
  const dir = `${OUT}/hf/${model}/onnx`;
  const files = existsSync(dir) ? readdirSync(dir) : [];
  const want = DTYPE === "q8" ? "model_quantized.onnx" : "model.onnx";
  const size = files.filter((x) => x.startsWith(want.replace(".onnx", ""))).reduce((s, x) => s + statSync(join(dir, x)).size, 0);
  const corpus = loadSet("corpus");
  const qlen = corpus.map((r) => M.tokenizer(r.queryText).input_ids.dims.at(-1)).sort((a, b) => a - b);
  const qmed = qlen[qlen.length >> 1];
  let over = 0, overAlone = 0, cut = [];
  for (const e of index) {
    const n = M.tokenizer(plainText(e)).input_ids.dims.at(-1);
    if (n > M.maxLen) overAlone++;
    if (n + qmed > M.maxLen) { over++; cut.push(e.ruleId); }
  }
  console.log(`${model} ${DTYPE}: size ${(size / 1e6).toFixed(0)} MB, load ${M.loadMs} ms, max length ${M.maxLen}`);
  console.log(`rules longer than the limit alone: ${overAlone}; cut with a median query (${qmed} tokens): ${over} (${cut.slice(0, 12).join(" ")}${cut.length > 12 ? " …" : ""})`);
  // latency: rerank N candidates for one corpus question, full query + plain text, one batch per question
  for (const N of [30, 50, 100]) {
    const ms = [];
    for (const r of corpus.slice(0, 12)) {
      const docs = r.top.slice(0, N).map(([id]) => plainText(byId.get(id)));
      const t0 = performance.now();
      for (let i = 0; i < docs.length; i += 16) await scorePairs(M, docs.slice(i, i + 16).map(() => r.queryText), docs.slice(i, i + 16));
      ms.push(performance.now() - t0);
    }
    ms.sort((a, b) => a - b);
    console.log(`  N=${N}: median ${ms.slice(2).length ? ms[ms.length >> 1].toFixed(0) : "?"} ms per question (threads ${THREADS ?? "default"})`);
  }
}

if (STAGE === "eval") {
  // MiniLM word-piece length of the embedded text, as in the audit's long-rule buckets
  hfEnv.allowRemoteModels = false;
  hfEnv.cacheDir = `${REPO}/apps/backend/data/models`;
  const mini = await AutoTokenizer.from_pretrained("Xenova/all-MiniLM-L6-v2");
  const wp = new Map(index.map((e) => [e.ruleId, mini(plainText(e)).input_ids.dims.at(-1)]));
  const suite = loadSet("suite"), corpus = loadSet("corpus");
  const groups = {
    tuning: suite.filter((r) => r.half === "tuning"), check: suite.filter((r) => r.half === "check"),
    hard: suite.filter((r) => r.hard), corpus
  };
  const necro = corpus.filter((r) => r.key.startsWith("necropotence-silence-borne-upon-a-wind-cleanup"));

  // order: returns the final ranked id list (top 100 only)
  const order = (r, sc, N, how, w) => {
    const head = r.top.slice(0, N), tail = r.top.slice(N).map(([id]) => id);
    if (!sc || how === "none") return r.top.map(([id]) => id);
    const rs = head.map(([id, hs], i) => ({ id, hs, hr: i + 1, rr: sc(id) }));
    if (rs.some((x) => x.rr === undefined)) return null;
    const byR = [...rs].sort((a, b) => b.rr - a.rr); byR.forEach((x, i) => (x.rrRank = i + 1));
    if (how === "rr") return [...byR.map((x) => x.id), ...tail];
    if (how === "rrf") { for (const x of rs) x.f = w / (60 + x.rrRank) + (1 - w) / (60 + x.hr); }
    if (how === "lin") {
      const mm = (k) => { const v = rs.map((x) => x[k]); const lo = Math.min(...v), hi = Math.max(...v); return (x) => (x[k] - lo) / (hi - lo || 1); };
      const nr = mm("rr"), nh = mm("hs");
      for (const x of rs) x.f = w * nr(x) + (1 - w) * nh(x);
    }
    return [...[...rs].sort((a, b) => b.f - a.f || a.hr - b.hr).map((x) => x.id), ...tail];
  };
  const measure = (rows, getSc, N, how, w) => {
    let cit = 0, all = 0, ceil = 0, long = 0, slots = 0, missing = 0;
    for (const r of rows) {
      const sc = getSc ? getSc(r) : null;
      const o = order(r, sc, N, how, w);
      if (!o) { missing++; continue; }
      const top = new Set(o.slice(0, CAP)), cur = new Set(r.curated), headN = new Set(r.top.slice(0, N).map(([id]) => id));
      let ok = r.deciding.length > 0;
      for (const id of r.deciding) { if (cur.has(id) || top.has(id)) cit++; else ok = false; if (cur.has(id) || headN.has(id)) ceil++; }
      if (ok) all++;
      for (const id of o.slice(0, CAP)) { slots++; if (wp.get(id) > 256) long++; }
    }
    return { cit, all, ceil, long: slots ? (100 * long) / slots : 0, missing };
  };

  const files = [...new Set(readdirSync(`${OUT}/scores`).filter((f) => f.endsWith(".json")).map((f) => f.split(".").slice(0, 4).join(".") + ".json"))];
  const lines = [];
  const base = Object.fromEntries(Object.entries(groups).map(([g, rows]) => [g, measure(rows, null, 100, "none")]));
  const row = (name, m, nec) => `| ${name} | ${m.tuning.cit} | ${m.check.cit} | ${m.tuning.all + m.check.all} (${m.tuning.all}/${m.check.all}) | ${m.hard.cit} | ${m.corpus.cit} / ${m.corpus.all} | ${nec} | ${(m.check.cit === "–" ? m.tuning.long : ((m.tuning.long * groups.tuning.length) + (m.check.long * groups.check.length)) / (groups.tuning.length + groups.check.length)).toFixed(0)}% | ${m.tuning.ceil}/${m.check.ceil} |`;
  const necroRanks = (getSc, N, how, w) => necro.map((r) => {
    const o = getSc ? order(r, getSc(r), N, how, w) : r.top.map(([id]) => id);
    return ["514.3a", "514.2", "514.1"].map((id) => (r.curated.includes(id) ? "cur" : o && o.indexOf(id) >= 0 ? o.indexOf(id) + 1 : r.watchRanks[id] ?? "—")).join("/");
  }).join(" · ");
  console.log(`Necropotence ranks shown as 514.3a/514.2/514.1 per case, in this order: ${necro.map((r) => `${r.key}=${r.mode}`).join(", ")}`);
  console.log(`| config | suite tuning cit (of ${groups.tuning.reduce((s, r) => s + r.deciding.length, 0)}) | suite check cit (of ${groups.check.reduce((s, r) => s + r.deciding.length, 0)}) | every-rule (tun/chk) | hard 25 | corpus cit / every | Necro ranks | long-rule slot share | ceiling in top N (tun/chk) |`);
  console.log(`|---|---|---|---|---|---|---|---|---|`);
  console.log(row("today (hybrid top 10)", base, necroRanks(null)));
  for (const N of [30, 50, 100]) {
    const m = Object.fromEntries(Object.entries(groups).map(([g, rows]) => [g, measure(rows, null, N, "none")]));
    lines.push(`ceiling N=${N}: tuning ${m.tuning.ceil}, check ${m.check.ceil}, hard ${m.hard.ceil}, corpus ${m.corpus.ceil}`);
  }
  for (const f of files.sort()) {
    const bits = f.replace(/\.json$/, "").split(".");
    const qv = bits.pop(), tv = bits.pop(), dt = bits.pop(), mslug = bits.join(".");
    const cache = loadMerged(`${OUT}/scores/${f}`);
    const getSc = (r) => { const h = qhash(qv === "full" ? r.queryText : r.questionText); return (id) => cache.get(`${h}|${id}`); };
    const have = (rows, N) => rows.every((r) => r.top.slice(0, N).every(([id]) => cache.has(`${qhash(qv === "full" ? r.queryText : r.questionText)}|${id}`)));
    for (const N of [30, 50, 100]) {
      if (!have(groups.tuning, N)) continue;
      const tag = `${mslug} ${dt} ${tv}/${qv} N=${N}`;
      const full = have(groups.check, N) && have(groups.corpus, N);
      const ms = (how, w) => Object.fromEntries(Object.entries(groups).map(([g, rows]) => [g, (g === "tuning" || full) ? measure(rows, getSc, N, how, w) : { cit: "–", all: 0, ceil: "–", long: 0 }]));
      console.log(row(`${tag} rerank only`, ms("rr"), full ? necroRanks(getSc, N, "rr") : "–"));
      for (const how of ["lin", "rrf"]) {
        let best = null;
        for (let w = 0.1; w < 0.95; w += 0.1) {
          const t = measure(groups.tuning, getSc, N, how, w);
          if (!best || t.cit > best.t.cit || (t.cit === best.t.cit && t.all > best.t.all)) best = { w: +w.toFixed(1), t };
        }
        console.log(row(`${tag} blend ${how} w=${best.w} (tuned)`, ms(how, best.w), full ? necroRanks(getSc, N, how, best.w) : "–"));
      }
    }
  }
  console.log(lines.join("\n"));
}
