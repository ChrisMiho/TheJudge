// Free, local probe (no API calls, no LLM): per-query latency of the bundled production model vs a trained
// export (single text, q8, as production embeds a question), and q8-vs-fp32 agreement of a trained export
// (mean cosine between the two vectors of the same text, and top-10 overlap of the meaning ranking).
// Inputs are rule-book texts and rule-book Example: passages only (no practice-suite text).
// Usage (from .worktrees/probe-pft): npx tsx <this file> --model F-all
import { readFileSync, statSync } from "node:fs";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const TRAIN = `${REPO}/output/models-probe/train`;
const MODEL = process.argv.includes("--model") ? process.argv[process.argv.indexOf("--model") + 1] : "F-all";
const hf = await import("@huggingface/transformers");
hf.env.allowRemoteModels = false;
const rules = Object.values(JSON.parse(readFileSync(`${TRAIN}/data/rules.json`, "utf8")));
const queries = readFileSync(`${TRAIN}/data/examples.jsonl`, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l).query).slice(0, 200);

async function load(id, dtype) {
  if (id === "prod") { hf.env.cacheDir = `${REPO}/apps/backend/data/models`; return hf.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "q8" }); }
  hf.env.allowLocalModels = true; hf.env.localModelPath = `${TRAIN}/onnx/`;
  return hf.pipeline("feature-extraction", `trained/${id}`, { dtype });
}
const one = async (ex, t) => Array.from((await ex(t, { pooling: "mean", normalize: true })).data);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
async function timeIt(ex) { for (const q of queries.slice(0, 10)) await one(ex, q); const ms = []; for (const q of queries) { const t = performance.now(); await one(ex, q); ms.push(performance.now() - t); } return med(ms); }

const prod = await load("prod");
console.log(`prod q8: median ${(await timeIt(prod)).toFixed(1)} ms/query (${queries.length} single-text embeds)`);
await prod.dispose?.();
const q8 = await load(MODEL, "q8");
console.log(`${MODEL} q8: median ${(await timeIt(q8)).toFixed(1)} ms/query; size ${(statSync(`${TRAIN}/onnx/trained/${MODEL}/onnx/model_quantized.onnx`).size / 1e6).toFixed(1)} MB (fp32 ${(statSync(`${TRAIN}/onnx/trained/${MODEL}/onnx/model.onnx`).size / 1e6).toFixed(1)} MB)`);
const fp = await load(MODEL, "fp32");
// agreement on 300 rule documents + 200 example queries
const sample = rules.filter((_, i) => i % 10 === 0).slice(0, 300);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const embAll = async (ex, ts) => { const o = []; for (const t of ts) o.push(await one(ex, t)); return o; };
const D8 = await embAll(q8, rules), D32 = await embAll(fp, rules);
const Q8 = await embAll(q8, queries), Q32 = await embAll(fp, queries);
const cosDoc = sample.map((t) => { const i = rules.indexOf(t); return dot(D8[i], D32[i]); });
const cosQ = Q8.map((v, i) => dot(v, Q32[i]));
let overlap = 0;
for (let i = 0; i < queries.length; i++) {
  const top = (q, D) => D.map((d, j) => [dot(q, d), j]).sort((a, b) => b[0] - a[0]).slice(0, 10).map((x) => x[1]);
  const a = new Set(top(Q8[i], D8)), b = top(Q32[i], D32);
  overlap += b.filter((j) => a.has(j)).length;
}
console.log(`${MODEL} q8 vs fp32: mean cosine docs ${(cosDoc.reduce((s, x) => s + x, 0) / cosDoc.length).toFixed(4)}, queries ${(cosQ.reduce((s, x) => s + x, 0) / cosQ.length).toFixed(4)}; meaning top-10 overlap ${((100 * overlap) / (10 * queries.length)).toFixed(1)}% over ${queries.length} example queries`);
await q8.dispose?.(); await fp.dispose?.();
