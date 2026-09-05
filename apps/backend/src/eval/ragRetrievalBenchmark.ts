// REQ-177 (Step 1 of the RAG gameplan): a committed, offline, deterministic
// retrieval benchmark — 150 synthetic questions grounded in real Comprehensive
// Rules text plus 6 gold worked-solution cases, each paired with the rule id
// that answers it. Scores recall@5 and MRR under a clean query (the question
// alone) and a query polluted with attached-card text (the condition Slice B
// fixes), using the exact production lexical retrieval path
// (`buildQueryTokensFromParts` / `retrieveRulesForQuery`) so this benchmark
// measures the same System 3 later steps ship against.
//
// No live AI call and no live embedding call: pollution text comes from the
// already-committed `cardDetailByOracleId.json` artifact, not a network
// fetch, and scoring is pure in-process lexical IDF. Corpus and methodology
// originate from the throwaway harness on `origin/explore/semantic-rule-retrieval`
// (`PRD/work/combo-context-validation/harness/rag/`) — committing it in-repo,
// offline and reproducible, is the point of REQ-177.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCompactCardSignal,
  buildQueryTokensFromParts,
  loadGameRulesRuleIndex,
  retrieveRulesForQuery,
  type GameRulesRuleIndexEntry
} from "../gameRulesRetrieval.js";
import { loadCardDetailIndex, type CardDetailEntry } from "../cardDetail.js";

const currentDir = dirname(fileURLToPath(import.meta.url));

export const BENCHMARK_PATH = resolve(currentDir, "benchmark/rag-retrieval-benchmark.json");
export const RULE_INDEX_PATH = resolve(currentDir, "../../data/gameRulesRuleIndex.json");
export const CARD_DETAIL_PATH = resolve(currentDir, "../../data/cardDetailByOracleId.json");

/** Deterministic pollution source: three fixed, sorted oracle ids from the
 * already-committed card-detail artifact — never a live call, never random. */
const POLLUTION_ORACLE_INDEXES = [1000, 9000, 20000] as const;

export type BenchmarkItem = {
  question: string;
  expectedRuleId: string;
  sectionTitle: string;
  source: "gold" | "synthetic";
};

export type BenchmarkCorpus = {
  generatedAt: string;
  items: BenchmarkItem[];
};

export function loadBenchmarkCorpus(filePath: string = BENCHMARK_PATH): BenchmarkCorpus {
  return JSON.parse(readFileSync(filePath, "utf8")) as BenchmarkCorpus;
}

/** Same rule-number stem as retrieval's own curated-baseline concept: a hit on
 * a lettered sub-rule (613.9a) covers its parent (613.9) and vice versa. */
function stem(ruleId: string): string {
  return ruleId.replace(/[a-z]$/i, "");
}

function rankOf(hits: string[], expectedRuleId: string): number {
  const index = hits.findIndex((hit) => stem(hit) === stem(expectedRuleId));
  return index === -1 ? 0 : index + 1;
}

function recallAt5(ranks: number[]): number {
  if (ranks.length === 0) return 0;
  return ranks.filter((rank) => rank > 0).length / ranks.length;
}

function meanReciprocalRank(ranks: number[]): number {
  if (ranks.length === 0) return 0;
  return ranks.reduce((sum, rank) => sum + (rank > 0 ? 1 / rank : 0), 0) / ranks.length;
}

/**
 * REQ-178/REQ-180: the "polluted" condition simulates attached cards through
 * the same compact per-card signal production's `buildQueryParts` builds —
 * name, type line, and real per-card Scryfall keywords — so this benchmark
 * measures whatever query shape is actually shipped, slice over slice, rather
 * than freezing an earlier pollution shape. The committed card-detail
 * artifact carries no `name` field (it is keyed by oracle id, not card id),
 * so the name component is empty here; that is a benchmark-methodology
 * limitation, not a production behavior difference. Real committed keyword
 * data is populated only once a human runs the Scryfall-sourced `data:build`
 * chain (REQ-180); until then `keywords` is `[]` and pollution here is
 * correspondingly weaker than it will be once that data lands — a disclosed,
 * accurate reflection of the current committed artifact, not a bug.
 */
export function buildPollutionText(cardDetailIndex: Map<string, CardDetailEntry>): string {
  const oracleIds = [...cardDetailIndex.keys()].sort();
  const chosen = POLLUTION_ORACLE_INDEXES.map((index) => oracleIds[index % oracleIds.length]).filter(
    (id): id is string => typeof id === "string"
  );
  return chosen
    .map((oracleId) => {
      const entry = cardDetailIndex.get(oracleId);
      return entry ? buildCompactCardSignal("", entry.typeLine, entry.keywords) : "";
    })
    .join(" ");
}

export type ConditionScore = { recall5: number; mrr: number };

export type BenchmarkScoreResult = {
  n: number;
  k: 5;
  clean: ConditionScore;
  polluted: ConditionScore;
};

/**
 * Score the benchmark corpus with the production lexical retriever, under a
 * clean query (question only) and a card-polluted query (question + fixed
 * card oracle text). Pure and offline: no network, no randomness.
 */
export function scoreBenchmark(
  corpus: BenchmarkCorpus,
  ruleIndex: GameRulesRuleIndexEntry[],
  pollutionText: string
): BenchmarkScoreResult {
  const cleanRanks: number[] = [];
  const pollutedRanks: number[] = [];

  for (const item of corpus.items) {
    const clean = buildQueryTokensFromParts({ questionText: item.question, oracleText: "" });
    const cleanHits = retrieveRulesForQuery(clean.tokens, clean.queryRuleIds, ruleIndex, new Set(), 5).map(
      (rule) => rule.ruleId
    );
    cleanRanks.push(rankOf(cleanHits, item.expectedRuleId));

    const polluted = buildQueryTokensFromParts({ questionText: item.question, oracleText: pollutionText });
    const pollutedHits = retrieveRulesForQuery(
      polluted.tokens,
      polluted.queryRuleIds,
      ruleIndex,
      new Set(),
      5
    ).map((rule) => rule.ruleId);
    pollutedRanks.push(rankOf(pollutedHits, item.expectedRuleId));
  }

  return {
    n: corpus.items.length,
    k: 5,
    clean: { recall5: recallAt5(cleanRanks), mrr: meanReciprocalRank(cleanRanks) },
    polluted: { recall5: recallAt5(pollutedRanks), mrr: meanReciprocalRank(pollutedRanks) }
  };
}

/** Convenience entry point that loads everything from the committed artifacts. */
export function runBenchmark(): BenchmarkScoreResult {
  const corpus = loadBenchmarkCorpus();
  const ruleIndex = loadGameRulesRuleIndex(RULE_INDEX_PATH);
  const cardDetailIndex = loadCardDetailIndex(CARD_DETAIL_PATH);
  const pollutionText = buildPollutionText(cardDetailIndex);
  return scoreBenchmark(corpus, ruleIndex, pollutionText);
}
