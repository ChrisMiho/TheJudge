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
import {
  BENCHMARK_PATH,
  CARD_DETAIL_PATH,
  RULE_INDEX_PATH,
  buildPollutionText,
  loadBenchmarkCorpus,
  runBenchmark,
  scoreBenchmarkSemantic
} from "../apps/backend/src/eval/ragRetrievalBenchmark.ts";
import { loadCardDetailIndex } from "../apps/backend/src/cardDetail.ts";
import { loadGameRulesRuleIndex } from "../apps/backend/src/gameRulesRetrieval.ts";
import { localEmbeddingProvider } from "../apps/backend/src/providers/localEmbeddingProvider.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(repoRoot, "apps/backend/src/eval/benchmark/results.json");
const baselinePath = resolve(repoRoot, "apps/backend/src/eval/benchmark/step1-baseline.json");
const semanticOutputPath = resolve(repoRoot, "apps/backend/src/eval/benchmark/semantic-results.json");

async function main() {
  const semantic = process.argv.includes("--semantic");

  const result = semantic
    ? await scoreBenchmarkSemantic(
        loadBenchmarkCorpus(BENCHMARK_PATH),
        loadGameRulesRuleIndex(RULE_INDEX_PATH),
        buildPollutionText(loadCardDetailIndex(CARD_DETAIL_PATH)),
        (text) => localEmbeddingProvider.embed(text)
      )
    : runBenchmark();

  console.log(`RAG retrieval benchmark (n=${result.n}, recall@${result.k} / MRR, method=${semantic ? "semantic-local" : "lexical-idf"})`);
  console.log(`  clean     recall ${result.clean.recall5}  mrr ${result.clean.mrr}`);
  console.log(`  polluted  recall ${result.polluted.recall5}  mrr ${result.polluted.mrr}`);

  const record = { ...result, scoredAt: new Date().toISOString(), method: semantic ? "semantic-local" : "lexical-idf" };
  await writeFile(semantic ? semanticOutputPath : outputPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${semantic ? semanticOutputPath : outputPath}`);

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
