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
/**
 * REQ-178/REQ-180 (review loop 1, B4/D5/E9): `cardDetailByOracleId.json` is
 * keyed by oracle id but carries no `name` field (REQ-175 kept it out of that
 * artifact). `cardMetadata.json` is keyed by the same oracle id
 * (`build-card-metadata.mjs`'s `cardId` is `oracle_id`) and does carry `name`
 * — joining the two here, purely for this benchmark's pollution text, is the
 * same cross-artifact join production's own compact card signal needs, not a
 * new production behavior.
 */
export const CARD_METADATA_PATH = resolve(currentDir, "../../../frontend/public/data/cardMetadata.json");

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

type CardMetadataRecord = { cardId?: unknown; name?: unknown };

/**
 * REQ-178/REQ-180 (review loop 1, B4/D5/E9): oracle-id -> name, joined from
 * the committed `cardMetadata.json` (the only committed artifact carrying a
 * card's name keyed by oracle id — see `CARD_METADATA_PATH` above). Missing
 * or unparsable is a benchmark-methodology fallback (empty name), not a
 * thrown error — this file is a build/eval-time input, never a live fetch.
 */
export function loadCardNameByOracleId(filePath: string = CARD_METADATA_PATH): Map<string, string> {
  const index = new Map<string, string>();
  try {
    const raw: unknown = JSON.parse(readFileSync(filePath, "utf8"));
    if (!Array.isArray(raw)) return index;
    for (const record of raw as CardMetadataRecord[]) {
      if (typeof record?.cardId === "string" && typeof record?.name === "string") {
        index.set(record.cardId, record.name);
      }
    }
  } catch {
    return index;
  }
  return index;
}

/**
 * REQ-178/REQ-180: the "polluted" condition simulates attached cards through
 * the same compact per-card signal production's `buildQueryParts` builds —
 * name, type line, and real per-card Scryfall keywords — so this benchmark
 * measures whatever query shape is actually shipped, slice over slice, rather
 * than freezing an earlier pollution shape.
 *
 * `cardDetailByOracleId.json` carries no `name` field (REQ-175 kept it out of
 * that artifact; it's keyed by oracle id, not card id) — the name component
 * is joined from the committed `cardMetadata.json` by that same oracle id
 * (review loop 1, B4/D5/E9). A card with no metadata entry (or no committed
 * metadata file at all) falls back to an empty name, same as production's own
 * `buildCompactCardSignal` does for a card with no name on the request.
 */
export function buildPollutionText(
  cardDetailIndex: Map<string, CardDetailEntry>,
  cardNameIndex: Map<string, string> = loadCardNameByOracleId()
): string {
  const oracleIds = [...cardDetailIndex.keys()].sort();
  const chosen = POLLUTION_ORACLE_INDEXES.map((index) => oracleIds[index % oracleIds.length]).filter(
    (id): id is string => typeof id === "string"
  );
  return chosen
    .map((oracleId) => {
      const entry = cardDetailIndex.get(oracleId);
      return entry ? buildCompactCardSignal(cardNameIndex.get(oracleId) ?? "", entry.typeLine, entry.keywords) : "";
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

/**
 * REQ-181 (E9): re-measures the shipped semantic path's recall@5 on the same
 * committed benchmark, using a caller-supplied embed function (the `local`
 * provider in production tooling) so this module has no direct dependency on
 * `@huggingface/transformers` — it stays a thin scorer over whatever vector
 * the caller produces. Not part of the offline regression-guard test:
 * embedding 312 queries (156 x clean/polluted) takes real (if fast, ~2ms
 * each) compute, and re-measurement is a one-time, human-triggered check
 * (`npm run benchmark:rag-retrieval -- --semantic`), not a per-PR gate.
 */
export async function scoreBenchmarkSemantic(
  corpus: BenchmarkCorpus,
  ruleIndex: GameRulesRuleIndexEntry[],
  pollutionText: string,
  embed: (text: string) => Promise<number[] | null>
): Promise<BenchmarkScoreResult> {
  const cleanRanks: number[] = [];
  const pollutedRanks: number[] = [];

  for (const item of corpus.items) {
    const clean = buildQueryTokensFromParts({ questionText: item.question, oracleText: "" });
    const cleanVector = await embed(item.question);
    const cleanHits = retrieveRulesForQuery(
      clean.tokens,
      clean.queryRuleIds,
      ruleIndex,
      new Set(),
      5,
      undefined,
      cleanVector
    ).map((rule) => rule.ruleId);
    cleanRanks.push(rankOf(cleanHits, item.expectedRuleId));

    const polluted = buildQueryTokensFromParts({ questionText: item.question, oracleText: pollutionText });
    const pollutedQuestion = `${item.question} ${pollutionText}`;
    const pollutedVector = await embed(pollutedQuestion);
    const pollutedHits = retrieveRulesForQuery(
      polluted.tokens,
      polluted.queryRuleIds,
      ruleIndex,
      new Set(),
      5,
      undefined,
      pollutedVector
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
