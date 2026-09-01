// Measure LOCAL (in-process) embedding models on the same 156-item RAG benchmark
// used by score-retrieval.mjs, under the same two query conditions (clean /
// polluted) so the numbers line up directly against the committed OpenAI and
// lexical results in retrieval-scores.json.
//
// Models (transformers.js ONNX, 384-dim, both runnable in a Node Lambda):
//   Xenova/bge-small-en-v1.5   (retrieval-tuned; query instruction prefix)
//   Xenova/all-MiniLM-L6-v2    (classic MiniLM baseline)
//
// Also times single-query embedding latency (the per-request runtime cost).
// No OpenAI calls. Writes local-scores.json (gitignored blob-adjacent output).
//
//   node PRD/work/combo-context-validation/harness/rag/score-local.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "@huggingface/transformers";
import { cosine, loadRuleIndex, REPO } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const BENCH = JSON.parse(readFileSync(resolve(HERE, "benchmark.json"), "utf8"));
const CARD_METADATA = resolve(REPO, "apps/frontend/public/data/cardMetadata.json");
const K = 5;

const MODELS = [
  { id: "Xenova/bge-small-en-v1.5", key: "bge-small-en-v1.5",
    queryPrefix: "Represent this sentence for searching relevant passages: " },
  { id: "Xenova/all-MiniLM-L6-v2", key: "all-MiniLM-L6-v2", queryPrefix: "" },
];

const stem = (id) => id.replace(/[a-z]$/i, "");
const rankOf = (hits, exp) => { const i = hits.findIndex((h) => stem(h) === stem(exp)); return i === -1 ? 0 : i + 1; };
const recall = (ranks) => ranks.filter((x) => x > 0).length / ranks.length;
const mrr = (ranks) => ranks.reduce((s, x) => s + (x > 0 ? 1 / x : 0), 0) / ranks.length;

async function embedAll(extractor, texts, batch = 64) {
  const out = [];
  for (let i = 0; i < texts.length; i += batch) {
    const t = await extractor(texts.slice(i, i + batch), { pooling: "mean", normalize: true });
    out.push(...t.tolist());
    process.stdout.write(`\r    embedded ${Math.min(i + batch, texts.length)}/${texts.length}   `);
  }
  process.stdout.write("\n");
  return out;
}

async function main() {
  const index = loadRuleIndex();
  const ruleInputs = index.map((r) => `${r.sectionTitle}: ${r.text}`.slice(0, 2000));
  const ruleIds = index.map((r) => r.ruleId);

  const meta = JSON.parse(readFileSync(CARD_METADATA, "utf8"));
  const pollutionCards = [meta[1000], meta[9000], meta[20000]].map((c) => `${c.oracleText} ${c.typeLine}`);
  const pollute = (q) => `${q} ${pollutionCards.join(" ")}`;
  const items = BENCH.items;

  const results = {};
  for (const m of MODELS) {
    console.log(`\n=== ${m.key} ===`);
    const t0 = Date.now();
    const extractor = await pipeline("feature-extraction", m.id);
    console.log(`  loaded model in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

    console.log("  embedding 3,432 rules...");
    const tR = Date.now();
    const ruleVecs = await embedAll(extractor, ruleInputs);
    const ruleEmbedMs = Date.now() - tR;

    // Query embedding (bge gets the retrieval instruction prefix; passages do not).
    const cleanQ = items.map((it) => m.queryPrefix + it.question);
    const pollQ = items.map((it) => m.queryPrefix + pollute(it.question));
    console.log("  embedding queries (clean + polluted)...");
    const cleanVecs = await embedAll(extractor, cleanQ);
    const pollVecs = await embedAll(extractor, pollQ);

    // Per-request latency: embed each clean query one at a time, warm model.
    const lat = [];
    for (const q of cleanQ) { const s = Date.now(); await extractor(q, { pooling: "mean", normalize: true }); lat.push(Date.now() - s); }
    lat.sort((a, b) => a - b);
    const p = (q) => lat[Math.min(lat.length - 1, Math.floor(q * lat.length))];

    const search = (qv) => ruleVecs.map((v, i) => ({ id: ruleIds[i], s: cosine(qv, v) }))
      .sort((a, b) => b.s - a.s).slice(0, K).map((r) => r.id);

    const agg = { clean: [], poll: [] };
    for (let i = 0; i < items.length; i++) {
      agg.clean.push(rankOf(search(cleanVecs[i]), items[i].expectedRuleId));
      agg.poll.push(rankOf(search(pollVecs[i]), items[i].expectedRuleId));
    }
    results[m.key] = {
      clean: { recall5: +recall(agg.clean).toFixed(3), mrr: +mrr(agg.clean).toFixed(3) },
      poll: { recall5: +recall(agg.poll).toFixed(3), mrr: +mrr(agg.poll).toFixed(3) },
      latencyMs: { p50: p(0.5), p95: p(0.95), mean: +(lat.reduce((a, b) => a + b, 0) / lat.length).toFixed(1) },
      ruleEmbedSec: +(ruleEmbedMs / 1000).toFixed(1),
      dims: ruleVecs[0].length,
    };
    console.log(`  clean  recall@5 ${results[m.key].clean.recall5}  mrr ${results[m.key].clean.mrr}`);
    console.log(`  poll   recall@5 ${results[m.key].poll.recall5}  mrr ${results[m.key].poll.mrr}`);
    console.log(`  latency p50 ${results[m.key].latencyMs.p50}ms  p95 ${results[m.key].latencyMs.p95}ms`);
  }

  const baseline = {
    "openai/text-embedding-3-small": { clean: { recall5: 0.885, mrr: 0.733 }, poll: { recall5: 0.603, mrr: 0.453 }, dims: 1536 },
    "lexical-tfidf": { clean: { recall5: 0.577, mrr: 0.413 }, poll: { recall5: 0.026, mrr: 0.017 } },
  };
  const outObj = { n: items.length, k: K, local: results, baseline };
  writeFileSync(resolve(HERE, "local-scores.json"), JSON.stringify(outObj, null, 2));
  console.log("\nWrote local-scores.json");
  console.table(Object.fromEntries(Object.entries({ ...results, ...baseline }).map(([k, v]) =>
    [k, { clean_r5: v.clean.recall5, clean_mrr: v.clean.mrr, poll_r5: v.poll.recall5, poll_mrr: v.poll.mrr }])));
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
