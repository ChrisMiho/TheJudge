// Embed the Comprehensive Rules corpus (3,432 entries) for semantic retrieval.
// Uses text-embedding-3-small (cheap; separate rate-limit pool from chat models).
// Cached to rule-embeddings.json — one-time, resumable-safe (overwrites).
//
//   npx tsx rag/embed-rules.mjs [--confirm]

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { loadEnv, loadRuleIndex } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "rule-embeddings.json");
const MODEL = "text-embedding-3-small";
const BATCH = 300;

async function main() {
  const confirm = process.argv.includes("--confirm");
  const index = loadRuleIndex();
  // Embed a readable form: "<sectionTitle>: <text>" — the concept, not just the number.
  const inputs = index.map((r) => `${r.sectionTitle}: ${r.text}`.slice(0, 2000));
  const approxTokens = inputs.reduce((s, t) => s + Math.ceil(t.length / 4), 0);
  console.log(`Rules: ${index.length}. Approx ${approxTokens} tokens -> ~$${(approxTokens / 1e6 * 0.02).toFixed(4)} on ${MODEL}.`);
  if (!confirm) { console.log("Dry run. Re-run with --confirm to embed."); return; }

  const env = loadEnv();
  const client = new OpenAI({ apiKey: (env.OPENAI_API_KEY || "").trim(), maxRetries: 6, timeout: 60000 });
  const vectors = new Array(index.length);
  for (let i = 0; i < inputs.length; i += BATCH) {
    const batch = inputs.slice(i, i + BATCH);
    const resp = await client.embeddings.create({ model: MODEL, input: batch });
    resp.data.forEach((d, j) => { vectors[i + j] = d.embedding; });
    console.log(`  embedded ${Math.min(i + BATCH, inputs.length)}/${inputs.length}`);
  }
  writeFileSync(OUT, JSON.stringify({ model: MODEL, ruleIds: index.map((r) => r.ruleId), vectors }));
  console.log(`Wrote ${vectors.length} embeddings to ${OUT}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
