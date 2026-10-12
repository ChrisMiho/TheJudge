// REQ-236: per-query latency of the bundled stock model vs a trained export (single text, q8, as the app
// embeds a question), and q8-vs-fp32 agreement of the trained export (mean cosine between the two vectors
// of the same text, and top-10 overlap of the meaning ranking). Owner-run, local, free. Inputs are rule-book
// texts and rule-book `Example:` passages only: no practice-suite text.
//
//   npx tsx scripts/latency-q8check.mjs [--model output/rule-search-model/onnx/F-foldall] [--data output/rule-search-model/data]
import { readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (key, fallback) => (args.includes(key) ? args[args.indexOf(key) + 1] : fallback);
const MODEL_DIR = resolve(arg("--model", join(repoRoot, "output/rule-search-model/onnx/F-foldall")));
const DATA = resolve(arg("--data", join(repoRoot, "output/rule-search-model/data")));

const hf = await import("@huggingface/transformers");
hf.env.allowRemoteModels = false;
const rules = Object.values(JSON.parse(readFileSync(join(DATA, "rules.json"), "utf8")));
const queries = readFileSync(join(DATA, "examples.jsonl"), "utf8")
  .split("\n")
  .filter((line) => line.trim())
  .map((line) => JSON.parse(line).query)
  .slice(0, 200);

async function load(kind, dtype) {
  if (kind === "stock") {
    hf.env.cacheDir = join(repoRoot, "apps/backend/data/models");
    hf.env.allowLocalModels = false;
    return hf.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "q8" });
  }
  hf.env.allowLocalModels = true;
  hf.env.localModelPath = dirname(MODEL_DIR);
  return hf.pipeline("feature-extraction", MODEL_DIR.split("/").pop(), { dtype });
}
const one = async (extractor, text) => Array.from((await extractor(text, { pooling: "mean", normalize: true })).data);
const median = (values) => [...values].sort((a, b) => a - b)[values.length >> 1];
async function timeIt(extractor) {
  for (const query of queries.slice(0, 10)) await one(extractor, query);
  const times = [];
  for (const query of queries) {
    const start = performance.now();
    await one(extractor, query);
    times.push(performance.now() - start);
  }
  return median(times);
}

const stock = await load("stock");
console.log(`stock q8: median ${(await timeIt(stock)).toFixed(1)} ms/query (${queries.length} single-text embeds)`);
await stock.dispose?.();
const q8 = await load("trained", "q8");
const sizeMb = (path) => (statSync(path).size / 1e6).toFixed(1);
console.log(`trained q8: median ${(await timeIt(q8)).toFixed(1)} ms/query; size ${sizeMb(join(MODEL_DIR, "onnx/model_quantized.onnx"))} MB (fp32 ${sizeMb(join(MODEL_DIR, "onnx/model.onnx"))} MB)`);
const fp32 = await load("trained", "fp32");
const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
const embedAll = async (extractor, texts) => {
  const out = [];
  for (const text of texts) out.push(await one(extractor, text));
  return out;
};
const D8 = await embedAll(q8, rules);
const D32 = await embedAll(fp32, rules);
const Q8 = await embedAll(q8, queries);
const Q32 = await embedAll(fp32, queries);
const sample = rules.filter((_, i) => i % 10 === 0).slice(0, 300);
const cosDocs = sample.map((text) => {
  const i = rules.indexOf(text);
  return dot(D8[i], D32[i]);
});
const cosQueries = Q8.map((vector, i) => dot(vector, Q32[i]));
let overlap = 0;
for (let i = 0; i < queries.length; i++) {
  const top = (q, D) =>
    D.map((d, j) => [dot(q, d), j])
      .sort((a, b) => b[0] - a[0])
      .slice(0, 10)
      .map((pair) => pair[1]);
  const a = new Set(top(Q8[i], D8));
  overlap += top(Q32[i], D32).filter((j) => a.has(j)).length;
}
const mean = (values) => values.reduce((sum, x) => sum + x, 0) / values.length;
console.log(
  `trained q8 vs fp32: mean cosine docs ${mean(cosDocs).toFixed(4)}, queries ${mean(cosQueries).toFixed(4)}; meaning top-10 overlap ${((100 * overlap) / (10 * queries.length)).toFixed(1)}% over ${queries.length} example queries`
);
await q8.dispose?.();
await fp32.dispose?.();
