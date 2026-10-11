// Free, local probe (no API calls): what does the bundled MiniLM embedder actually read?
// 1. Finds the real truncation point by appending junk after N word pieces and checking whether the vector moves.
// 2. Counts rule-index entries (as embedded: `sectionTitle: text`, cut at 2,000 chars) by word-piece length.
// 3. Checks the committed vectors match a fresh single-text embedding (batch padding / int8 drift).
// Usage (from .worktrees/probe-pft): npx tsx <this file>
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const { LOCAL_MODEL_CACHE_DIR, LOCAL_MODEL_ID } = await imp("apps/backend/src/providers/localEmbeddingProvider.ts");
const R = await imp("apps/backend/src/gameRulesRetrieval.ts");
const { env, pipeline, AutoTokenizer } = await import(pathToFileURL(`${REPO}/node_modules/@huggingface/transformers/dist/transformers.node.mjs`).href).catch(() => import("@huggingface/transformers"));
env.allowRemoteModels = false;
env.cacheDir = LOCAL_MODEL_CACHE_DIR;
const extractor = await pipeline("feature-extraction", LOCAL_MODEL_ID, { dtype: "q8" });
const tok = extractor.tokenizer;
console.log(`tokenizer model_max_length=${tok.model_max_length}`);
const embed = async (t) => Array.from((await extractor(t, { pooling: "mean", normalize: true })).data);
const cos = R.cosineSimilarity;

// 1. truncation point
const index = JSON.parse(readFileSync(`${REPO}/apps/backend/data/gameRulesRuleIndex.json`, "utf8"));
const longText = index.map((e) => e.text).join(" ").split(/\s+/).slice(0, 900).join(" ");
const ids = tok(longText, { add_special_tokens: false }).input_ids;
const pieces = Array.from(ids.data ?? ids).map(Number);
for (const n of [100, 126, 200, 254, 300, 400, 510, 600]) {
  const head = tok.decode(pieces.slice(0, n));
  const a = await embed(head);
  const b = await embed(head + " zebra banana spaceship volcano quantum jazz saxophone tornado");
  console.log(`prefix ${n} word pieces: cosine(prefix, prefix+junk) = ${cos(a, b).toFixed(6)}`);
}

// 2. entry lengths as embedded
const embText = (e) => `${e.sectionTitle}: ${e.text}`.slice(0, 2000);
const lens = index.map((e) => ({ id: e.ruleId, n: tok(embText(e)).input_ids.dims?.at(-1) ?? tok(embText(e)).input_ids.size, chars: embText(e).length, rawChars: `${e.sectionTitle}: ${e.text}`.length }));
const over = (k) => lens.filter((l) => l.n > k).length;
console.log(`\nIndex entries: ${lens.length}`);
for (const k of [128, 256, 384, 512]) console.log(`  longer than ${k} word pieces (incl. [CLS]/[SEP]): ${over(k)}`);
console.log(`  cut by the 2,000-char slice before embedding: ${lens.filter((l) => l.rawChars > 2000).length}`);
const sorted = [...lens].sort((a, b) => b.n - a.n);
console.log(`  longest: ${sorted.slice(0, 12).map((l) => `${l.id}(${l.n})`).join(", ")}`);
const med = [...lens].sort((a, b) => a.n - b.n)[Math.floor(lens.length / 2)].n;
console.log(`  median word pieces: ${med}`);
for (const id of ["800.4a", "608.2f", "712.13a", "712.21c", "120.4d", "707.10", "514.1", "514.2", "514.3", "514.3a", "500.5b", "500.11", "614.10"]) {
  const l = lens.find((x) => x.id === id); if (l) console.log(`  ${id}: ${l.n} word pieces`);
}

// 3. stored vs fresh vectors
const emb = R.loadGameRulesRuleEmbeddings(`${REPO}/apps/backend/data/gameRulesRuleEmbeddings.json`);
const vecById = new Map(emb.ruleIds.map((id, i) => [id, emb.vectors[i]]));
const sample = index.filter((_, i) => i % 58 === 0).concat(index.filter((e) => ["800.4a", "514.3a", "514.2", "707.10"].includes(e.ruleId)));
let minC = 1, sumC = 0;
for (const e of sample) { const c = cos(await embed(embText(e)), vecById.get(e.ruleId)); minC = Math.min(minC, c); sumC += c; }
console.log(`\nStored vs fresh single-text embedding over ${sample.length} rules: mean cosine ${(sumC / sample.length).toFixed(5)}, min ${minC.toFixed(5)}`);
