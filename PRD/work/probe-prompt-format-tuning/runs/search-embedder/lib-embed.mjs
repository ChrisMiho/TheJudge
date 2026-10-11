// Shared helpers for the search-embedder probe (free, local; no paid API, no LLM).
// Candidate models are public Hugging Face ONNX weights downloaded by transformers.js into
// .worktrees/probe-pft/output/models-probe/embedder/hf — never into apps/backend/data/models.
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

export const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
export const OUT = `${REPO}/output/models-probe/embedder`;
export const HF_CACHE = `${OUT}/hf`;
mkdirSync(`${OUT}/vectors`, { recursive: true });
mkdirSync(HF_CACHE, { recursive: true });
if (!existsSync(`${OUT}/.gitignore`)) writeFileSync(`${OUT}/.gitignore`, "*\n");

const BGE_Q = "Represent this sentence for searching relevant passages: ";
// pooling and prefixes from each model card
export const MODELS = {
  "minilm": { repo: "Xenova/all-MiniLM-L6-v2", pooling: "mean", q: "", d: "", prodCache: true },
  "bge-small": { repo: "Xenova/bge-small-en-v1.5", pooling: "cls", q: BGE_Q, d: "" },
  "bge-base": { repo: "Xenova/bge-base-en-v1.5", pooling: "cls", q: BGE_Q, d: "" },
  "gte-small": { repo: "Xenova/gte-small", pooling: "mean", q: "", d: "" },
  "gte-base": { repo: "Xenova/gte-base", pooling: "mean", q: "", d: "" },
  "arctic-s": { repo: "Snowflake/snowflake-arctic-embed-s", pooling: "cls", q: BGE_Q, d: "" },
  "arctic-m-v1.5": { repo: "Snowflake/snowflake-arctic-embed-m-v1.5", pooling: "cls", q: BGE_Q, d: "" },
  "arctic-m-v2": { repo: "Snowflake/snowflake-arctic-embed-m-v2.0", pooling: "cls", q: "query: ", d: "" },
  "nomic-v1.5": { repo: "nomic-ai/nomic-embed-text-v1.5", pooling: "mean", q: "search_query: ", d: "search_document: " },
  "mxbai-large": { repo: "mixedbread-ai/mxbai-embed-large-v1", pooling: "cls", q: BGE_Q, d: "" }
};

let hf;
export async function loadModel(key, { threads = 4 } = {}) {
  const m = MODELS[key];
  hf ??= await import("@huggingface/transformers");
  if (m.prodCache) {
    hf.env.allowRemoteModels = false;
    hf.env.cacheDir = `${REPO}/apps/backend/data/models`; // read-only use of the bundled control model
  } else {
    hf.env.allowRemoteModels = true;
    hf.env.cacheDir = HF_CACHE;
  }
  const t0 = performance.now();
  const ex = await hf.pipeline("feature-extraction", m.repo, { dtype: "q8", session_options: { intraOpNumThreads: threads, interOpNumThreads: 1 } });
  const loadMs = performance.now() - t0;
  const embed = async (texts) => {
    const out = await ex(texts, { pooling: m.pooling, normalize: true });
    const [n, d] = out.dims;
    const data = out.data;
    return Array.from({ length: n }, (_, i) => Float32Array.from(data.subarray(i * d, (i + 1) * d)));
  };
  return { key, m, ex, embed, loadMs, tokenizer: ex.tokenizer };
}

export function dirSizeMB(p) {
  if (!existsSync(p)) return 0;
  let s = 0;
  const walk = (d) => { for (const f of readdirSync(d)) { const q = join(d, f); const st = statSync(q); if (st.isDirectory()) walk(q); else s += st.size; } };
  walk(p);
  return s / 1e6;
}
export const modelDir = (key) => (MODELS[key].prodCache ? `${REPO}/apps/backend/data/models/${MODELS[key].repo}` : `${HF_CACHE}/${MODELS[key].repo}`);

// ---- vector cache: Float32 blob + JSON key list -------------------------------------------------
export function saveVecs(name, keys, vecs) {
  const d = vecs[0]?.length ?? 0;
  const buf = new Float32Array(keys.length * d);
  vecs.forEach((v, i) => buf.set(v, i * d));
  writeFileSync(`${OUT}/vectors/${name}.f32`, Buffer.from(buf.buffer));
  writeFileSync(`${OUT}/vectors/${name}.json`, JSON.stringify({ d, keys }));
}
export function loadVecs(name) {
  const p = `${OUT}/vectors/${name}.json`;
  if (!existsSync(p)) return null;
  const { d, keys } = JSON.parse(readFileSync(p, "utf8"));
  const b = readFileSync(`${OUT}/vectors/${name}.f32`);
  const all = new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
  return new Map(keys.map((k, i) => [k, all.subarray(i * d, (i + 1) * d)]));
}
export const sha = (t) => createHash("sha256").update(t).digest("hex").slice(0, 24);

// embed texts in length-sorted batches; returns vectors in input order
export async function embedMany(model, texts, { batch = 16, onProgress } = {}) {
  const order = texts.map((t, i) => [t.length, i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const out = new Array(texts.length);
  for (let s = 0; s < order.length; s += batch) {
    const idx = order.slice(s, s + batch);
    const vs = await model.embed(idx.map((i) => texts[i]));
    idx.forEach((i, j) => (out[i] = vs[j]));
    if (onProgress && (s / batch) % 25 === 0) onProgress(s, order.length);
  }
  return out;
}
