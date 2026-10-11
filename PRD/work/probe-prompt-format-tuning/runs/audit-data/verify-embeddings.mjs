// Re-embeds a sample of rule-index entries with the bundled local model (no network:
// allowRemoteModels=false) using production's embedding text, and compares to the
// committed int8 vectors. Also re-embeds variants (no section title, no examples,
// with fused part header removed) to show how much each defect moves a vector.
// Run from repo root: node PRD/work/probe-prompt-format-tuning/runs/audit-data/verify-embeddings.mjs
import fs from "node:fs";
import path from "node:path";
import { env, pipeline } from "@huggingface/transformers";

env.allowRemoteModels = false;
env.cacheDir = path.resolve("apps/backend/data/models");
const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "q8" });
const index = JSON.parse(fs.readFileSync("apps/backend/data/gameRulesRuleIndex.json", "utf8"));
const emb = JSON.parse(fs.readFileSync("apps/backend/data/gameRulesRuleEmbeddings.json", "utf8"));
const buf = Buffer.from(emb.vectorsBase64, "base64");
const i8 = new Int8Array(buf.buffer, buf.byteOffset, buf.byteLength);
const committed = (i) => Array.from(i8.subarray(i * emb.dims, (i + 1) * emb.dims), (v) => v / emb.int8Scale);
const cos = (a, b) => { let d = 0, na = 0, nb = 0; for (let k = 0; k < a.length; k++) { d += a[k] * b[k]; na += a[k] ** 2; nb += b[k] ** 2; } return d / Math.sqrt(na * nb); };
const embed = async (t) => Array.from((await extractor(t, { pooling: "mean", normalize: true })).data);

// deterministic sample: every 50th entry + named ones
const named = ["514.3a", "514.3", "514.2", "123.9", "213.1g", "315.7", "408.3", "616.2", "733.2", "811.5", "704.5z", "205.3m", "613.6", "608.2b", "800.4a", "120.4d", "707.3"];
const ids = new Set([...index.filter((_, i) => i % 50 === 0).map((e) => e.ruleId), ...named]);
const rows = [];
for (const id of ids) {
  const i = index.findIndex((e) => e.ruleId === id);
  const e = index[i];
  const prod = `${e.sectionTitle}: ${e.text}`.slice(0, 2000);
  const v = await embed(prod);
  rows.push({ id, cosVsCommitted: +cos(v, committed(i)).toFixed(4) });
}
const minCos = Math.min(...rows.map((r) => r.cosVsCommitted));

// how much the fused part header moves the vector of the 8 affected rules
const partFix = [];
for (const id of ["123.9", "213.1g", "315.7", "408.3", "514.3a", "616.2", "733.2", "811.5"]) {
  const e = index.find((x) => x.ruleId === id);
  const withHeader = await embed(`${e.sectionTitle}: ${e.text}`.slice(0, 2000));
  const clean = await embed(`${e.sectionTitle}: ${e.text.replace(/\n[\s ]*\n\d\. [^\n]+$/, "")}`.slice(0, 2000));
  partFix.push({ id, cosCleanVsShipped: +cos(withHeader, clean).toFixed(4) });
}

// Query-side probe: does the cleanup-step rule rank better for a cleanup question with a clean text / header?
const q = await embed("During the cleanup step, can players get priority and cast spells if a trigger happens?");
const scoreAll = (getVec) => index.map((e, i) => ({ id: e.ruleId, s: cos(q, getVec(i)) })).sort((a, b) => b.s - a.s);
const ranked = scoreAll(committed);
const rankOf = (id) => ranked.findIndex((r) => r.id === id) + 1;
const out = { sampleSize: rows.length, minCosVsCommitted: minCos, rows, partHeaderShift: partFix, cleanupQueryRanks: { "514.3a": rankOf("514.3a"), "514.3": rankOf("514.3"), top5: ranked.slice(0, 5).map((r) => r.id) } };
fs.writeFileSync(path.resolve("PRD/work/probe-prompt-format-tuning/runs/audit-data/out/verify-embeddings.json"), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
