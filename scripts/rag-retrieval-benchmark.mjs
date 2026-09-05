// REQ-177 — run the committed, offline RAG retrieval benchmark (156 labeled
// question -> rule pairs) and write a machine-readable result file. Offline
// and deterministic: no live AI call, no live embedding call, no network.
//
//   npm run benchmark:rag-retrieval
//
// Also updates `apps/backend/src/eval/benchmark/step1-baseline.json`, the
// Step 1 baseline every later gameplan step's relative recall gate reads —
// only when run with --record-baseline, so day-to-day runs never silently
// move the goalposts.

import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runBenchmark } from "../apps/backend/src/eval/ragRetrievalBenchmark.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(repoRoot, "apps/backend/src/eval/benchmark/results.json");
const baselinePath = resolve(repoRoot, "apps/backend/src/eval/benchmark/step1-baseline.json");

async function main() {
  const result = runBenchmark();

  console.log(`RAG retrieval benchmark (n=${result.n}, recall@${result.k} / MRR)`);
  console.log(`  clean     recall ${result.clean.recall5}  mrr ${result.clean.mrr}`);
  console.log(`  polluted  recall ${result.polluted.recall5}  mrr ${result.polluted.mrr}`);

  const record = { ...result, scoredAt: new Date().toISOString(), method: "lexical-idf" };
  await writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${outputPath}`);

  if (process.argv.includes("--record-baseline")) {
    const baseline = {
      step: 1,
      requirement: "REQ-177",
      method: "lexical-idf",
      recordedAt: new Date().toISOString(),
      n: result.n,
      k: result.k,
      clean: result.clean,
      polluted: result.polluted
    };
    await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
    console.log(`Wrote ${baselinePath} (Step 1 baseline)`);
  }
}

main().catch((error) => {
  console.error("[rag-retrieval-benchmark] Unexpected error:", error);
  process.exitCode = 1;
});
