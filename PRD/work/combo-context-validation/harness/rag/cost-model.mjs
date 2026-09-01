// Cost model: local (in-Lambda) query embedding vs OpenAI text-embedding-3-small,
// across a range of live-query volumes, with the break-even point.
//
// Reads measured latency from local-scores.json (produced by score-local.mjs).
// Only the QUERY is embedded at request time; the 3,432-rule corpus is embedded
// once offline and bundled, so corpus cost is a one-time rounding error either way.
//
//   node PRD/work/combo-context-validation/harness/rag/cost-model.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCORES = JSON.parse(readFileSync(resolve(HERE, "local-scores.json"), "utf8"));

// --- Pricing constants (us-east-1, 2026) ---
const OPENAI_PER_MTOK = 0.02;              // text-embedding-3-small, $/1M tokens
const QUERY_TOKENS = 60;                   // ~a rules question after the query-construction fix (no card oracle dump)
const LAMBDA_ARM_GB_SEC = 0.0000133334;    // Graviton $/GB-second
const LAMBDA_REQ = 0.20 / 1e6;             // $ per request (both paths pay this already for the answer call)

// Local path adds compute to the EXISTING answer Lambda. Two costs:
//  1. extra wall-time per request = embed latency (model already warm in the container)
//  2. a memory bump to hold the model, charged on EVERY request's GB-seconds
const LOCAL_MEM_GB = 1.5;                   // headroom for a ~130MB model + onnxruntime
const VOLUMES = [1_000, 50_000, 500_000];  // live queries / month

const openaiPerQuery = (QUERY_TOKENS / 1e6) * OPENAI_PER_MTOK;

function localPerQuery(latencyMs) {
  // Marginal AWS cost of the embed step: the added GB-seconds on the shared Lambda.
  return (latencyMs / 1000) * LOCAL_MEM_GB * LAMBDA_ARM_GB_SEC;
}

const rows = [];
for (const [key, r] of Object.entries(SCORES.local)) {
  const lat = r.latencyMs.p50;
  const perQ = localPerQuery(lat);
  rows.push({ provider: `local/${key}`, perQueryUsd: perQ, latencyP50ms: lat });
}
rows.push({ provider: "openai/text-embedding-3-small", perQueryUsd: openaiPerQuery, latencyP50ms: "~250 (network)" });

console.log(`\nPer-query marginal cost (query = ~${QUERY_TOKENS} tokens):`);
for (const r of rows) console.log(`  ${r.provider.padEnd(34)} $${r.perQueryUsd.toExponential(3)}/query   p50 ${r.latencyP50ms}`);

console.log(`\nMonthly marginal cost by volume:`);
const header = ["provider", ...VOLUMES.map((v) => `${(v / 1000)}k/mo`)];
const table = [];
for (const r of rows) {
  const line = { provider: r.provider };
  for (const v of VOLUMES) line[`${v / 1000}k/mo`] = `$${(r.perQueryUsd * v).toFixed(2)}`;
  table.push(line);
}
console.table(table);

// Break-even: local is cheaper than OpenAI when local per-query < openai per-query.
console.log(`\nBreak-even read:`);
for (const r of rows.filter((x) => x.provider.startsWith("local"))) {
  const cheaper = r.perQueryUsd < openaiPerQuery;
  const ratio = (openaiPerQuery / r.perQueryUsd);
  console.log(`  ${r.provider}: ${cheaper ? `cheaper than OpenAI at ALL volumes (~${ratio.toFixed(1)}x cheaper/query)` : `more expensive than OpenAI per query`}`);
}

writeFileSync(resolve(HERE, "cost-model.json"), JSON.stringify({
  assumptions: { OPENAI_PER_MTOK, QUERY_TOKENS, LAMBDA_ARM_GB_SEC, LAMBDA_REQ, LOCAL_MEM_GB, VOLUMES },
  openaiPerQuery, rows, monthly: table,
}, null, 2));
console.log("\nWrote cost-model.json");
