import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { GameRulesTopic } from "./gameRules.js";
import type { PromptContext } from "./types/index.js";

export type GameRulesRuleIndexEntry = {
  ruleId: string;
  sectionTitle: string;
  text: string;
  searchText: string;
  parentRuleIds: string[];
};

export type RetrievedGameRule = {
  ruleId: string;
  sectionTitle: string;
  text: string;
  score: number;
};

const warnedLoadFailures = new Set<string>();

function warnOnce(filePath: string, message: string, error?: unknown): void {
  if (warnedLoadFailures.has(filePath)) return;
  warnedLoadFailures.add(filePath);
  if (error) {
    console.warn(message, error);
  } else {
    console.warn(message);
  }
}

function isGameRulesRuleIndexEntry(value: unknown): value is GameRulesRuleIndexEntry {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Partial<GameRulesRuleIndexEntry>;
  return (
    typeof e.ruleId === "string" &&
    typeof e.sectionTitle === "string" &&
    typeof e.text === "string" &&
    typeof e.searchText === "string" &&
    Array.isArray(e.parentRuleIds) &&
    e.parentRuleIds.every((id) => typeof id === "string")
  );
}

function normalizeEntries(value: unknown): GameRulesRuleIndexEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isGameRulesRuleIndexEntry);
}

const ruleIndexCache = new Map<string, GameRulesRuleIndexEntry[]>();

export function loadGameRulesRuleIndex(filePath: string): GameRulesRuleIndexEntry[] {
  const cached = ruleIndexCache.get(filePath);
  if (cached !== undefined) return cached;

  if (!existsSync(filePath)) {
    warnOnce(filePath, `Game rules artifact missing; GAME RULES prompt section disabled: ${filePath}`);
    return [];
  }

  try {
    const entries = normalizeEntries(JSON.parse(readFileSync(filePath, "utf8")));
    ruleIndexCache.set(filePath, entries);
    return entries;
  } catch (error) {
    warnOnce(filePath, `Game rules artifact could not be parsed; GAME RULES prompt section disabled: ${filePath}`, error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// IDF token stats + keyword vocabulary (DEC-046)
// ---------------------------------------------------------------------------

/** Per-token document frequency for IDF scoring. `N` = total rules in the index. */
export type GameRulesTokenStats = { N: number; df: Map<string, number> };

const tokenStatsCache = new Map<string, GameRulesTokenStats | null>();

export function loadGameRulesTokenStats(filePath: string): GameRulesTokenStats | null {
  const cached = tokenStatsCache.get(filePath);
  if (cached !== undefined) return cached;

  if (!existsSync(filePath)) {
    warnOnce(filePath, `Game rules token stats missing; falling back to df=1 IDF: ${filePath}`);
    tokenStatsCache.set(filePath, null);
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as { N?: unknown; tokens?: unknown };
    const N = typeof parsed.N === "number" && parsed.N > 0 ? parsed.N : 0;
    const df = new Map<string, number>();
    if (parsed.tokens && typeof parsed.tokens === "object") {
      for (const [token, value] of Object.entries(parsed.tokens as Record<string, unknown>)) {
        const dfValue = (value as { df?: unknown })?.df;
        if (typeof dfValue === "number" && dfValue > 0) df.set(token, dfValue);
      }
    }
    if (N === 0) {
      warnOnce(filePath, `Game rules token stats had no usable N; falling back to df=1 IDF: ${filePath}`);
      tokenStatsCache.set(filePath, null);
      return null;
    }
    const stats: GameRulesTokenStats = { N, df };
    tokenStatsCache.set(filePath, stats);
    return stats;
  } catch (error) {
    warnOnce(filePath, `Game rules token stats could not be parsed; falling back to df=1 IDF: ${filePath}`, error);
    tokenStatsCache.set(filePath, null);
    return null;
  }
}

const keywordVocabularyCache = new Map<string, Set<string>>();

export function loadGameRulesKeywordVocabulary(filePath: string): Set<string> {
  const cached = keywordVocabularyCache.get(filePath);
  if (cached !== undefined) return cached;

  if (!existsSync(filePath)) {
    warnOnce(filePath, `Game rules keyword vocabulary missing; keyword boost disabled: ${filePath}`);
    const empty = new Set<string>();
    keywordVocabularyCache.set(filePath, empty);
    return empty;
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    const rawTokens = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { tokens?: unknown })?.tokens)
        ? (parsed as { tokens: unknown[] }).tokens
        : [];
    const vocabulary = new Set<string>();
    for (const token of rawTokens) {
      if (typeof token === "string" && token.trim().length > 0) vocabulary.add(token.trim().toLowerCase());
    }
    keywordVocabularyCache.set(filePath, vocabulary);
    return vocabulary;
  } catch (error) {
    warnOnce(filePath, `Game rules keyword vocabulary could not be parsed; keyword boost disabled: ${filePath}`, error);
    const empty = new Set<string>();
    keywordVocabularyCache.set(filePath, empty);
    return empty;
  }
}

/**
 * REQ-181: the committed per-rule embeddings artifact — one 384-dimension
 * vector per `gameRulesRuleIndex.json` entry, built offline by
 * `scripts/build-rule-embeddings.mjs`. A missing or malformed artifact
 * degrades to `null`, which disables the semantic path entirely (SCOPE-D
 * lexical fallback).
 */
export type GameRulesRuleEmbeddings = {
  model: string;
  dims: number;
  ruleIds: string[];
  vectors: number[][];
};

const ruleEmbeddingsCache = new Map<string, GameRulesRuleEmbeddings | null>();

/**
 * REQ-183: the shipped vector number format, named on the artifact itself
 * rather than assumed, so an older or differently-encoded artifact is
 * detected rather than misread. `float32-base64` (one 4-byte IEEE-754 float
 * per component) is REQ-181's original, lossless format; `int8-base64`
 * (REQ-183, one signed byte per component, scaled by the artifact's own
 * `int8Scale`) is the shipped format — ~1.44MB for 2,873 x 384 components,
 * versus ~5.9MB for float32-base64 and ~12MB as JSON number-array text.
 * NFR-017's deploy budget is why this is compact base64/binary rather than
 * JSON arrays. `int8Scale` is computed at build time from the corpus's own
 * largest |component| (`scripts/build-rule-embeddings.mjs`'s
 * `computeInt8Scale`), not a hardcoded guess — a fixed scale assuming the
 * theoretical ±1 unit-vector bound measurably regressed benchmark recall@5
 * (0.8974 -> 0.8910 clean), because this model's real components only ever
 * reach about ±0.27, wasting most of int8's precision.
 */
const BYTES_PER_COMPONENT: Record<string, number> = {
  "float32-base64": Float32Array.BYTES_PER_ELEMENT,
  "int8-base64": Int8Array.BYTES_PER_ELEMENT
};

type RuleEmbeddingsArtifactOnDisk = {
  model: string;
  dims: number;
  encoding: string;
  int8Scale?: number;
  ruleIds: string[];
  vectorsBase64: string;
};

function isValidEmbeddingsArtifactOnDisk(value: unknown): value is RuleEmbeddingsArtifactOnDisk {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RuleEmbeddingsArtifactOnDisk>;
  if (
    typeof candidate.model !== "string" ||
    typeof candidate.dims !== "number" ||
    candidate.dims <= 0 ||
    typeof candidate.encoding !== "string" ||
    !Array.isArray(candidate.ruleIds) ||
    typeof candidate.vectorsBase64 !== "string"
  ) {
    return false;
  }
  const bytesPerComponent = BYTES_PER_COMPONENT[candidate.encoding];
  if (bytesPerComponent === undefined) return false; // unrecognised encoding
  if (candidate.encoding === "int8-base64" && !(typeof candidate.int8Scale === "number" && candidate.int8Scale > 0)) {
    return false; // int8-base64 requires a positive dequantisation scale
  }
  const expectedComponentCount = candidate.ruleIds.length * candidate.dims;
  const decodedByteLength = Buffer.from(candidate.vectorsBase64, "base64").byteLength;
  return decodedByteLength === expectedComponentCount * bytesPerComponent;
}

function decodeVectors(parsed: RuleEmbeddingsArtifactOnDisk): number[][] {
  const buffer = Buffer.from(parsed.vectorsBase64, "base64");
  const vectors: number[][] = [];

  if (parsed.encoding === "int8-base64") {
    const scale = parsed.int8Scale!; // validated positive by isValidEmbeddingsArtifactOnDisk
    const int8 = new Int8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    for (let i = 0; i < parsed.ruleIds.length; i++) {
      const start = i * parsed.dims;
      const vector = new Array<number>(parsed.dims);
      for (let d = 0; d < parsed.dims; d++) {
        vector[d] = int8[start + d]! / scale;
      }
      vectors.push(vector);
    }
    return vectors;
  }

  // "float32-base64" — the only other recognised encoding (isValidEmbeddingsArtifactOnDisk
  // already rejected anything else).
  const floats = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Float32Array.BYTES_PER_ELEMENT);
  for (let i = 0; i < parsed.ruleIds.length; i++) {
    vectors.push(Array.from(floats.subarray(i * parsed.dims, (i + 1) * parsed.dims)));
  }
  return vectors;
}

export function loadGameRulesRuleEmbeddings(filePath: string): GameRulesRuleEmbeddings | null {
  const cached = ruleEmbeddingsCache.get(filePath);
  if (cached !== undefined) return cached;

  if (!existsSync(filePath)) {
    warnOnce(filePath, `Rule embeddings artifact missing; System 3 falls back to lexical retrieval: ${filePath}`);
    ruleEmbeddingsCache.set(filePath, null);
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    if (!isValidEmbeddingsArtifactOnDisk(parsed)) {
      warnOnce(
        filePath,
        `Rule embeddings artifact has an unexpected shape or unrecognised encoding; System 3 falls back to lexical retrieval: ${filePath}`
      );
      ruleEmbeddingsCache.set(filePath, null);
      return null;
    }
    const embeddings: GameRulesRuleEmbeddings = {
      model: parsed.model,
      dims: parsed.dims,
      ruleIds: parsed.ruleIds,
      vectors: decodeVectors(parsed)
    };
    ruleEmbeddingsCache.set(filePath, embeddings);
    return embeddings;
  } catch (error) {
    warnOnce(filePath, `Rule embeddings artifact could not be parsed; System 3 falls back to lexical retrieval: ${filePath}`, error);
    ruleEmbeddingsCache.set(filePath, null);
    return null;
  }
}

/** Scoring resources used by System 3 retrieval. */
export type ScoringResources = {
  tokenStats: GameRulesTokenStats | null;
  keywordVocabulary: Set<string>;
  ruleEmbeddings: GameRulesRuleEmbeddings | null;
};

let defaultResources: ScoringResources | null = null;

function getDefaultScoringResources(): ScoringResources {
  if (defaultResources) return defaultResources;
  const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../data");
  defaultResources = {
    tokenStats: loadGameRulesTokenStats(resolve(dataDir, "gameRulesTokenStats.json")),
    keywordVocabulary: loadGameRulesKeywordVocabulary(resolve(dataDir, "gameRulesKeywordVocabulary.json")),
    ruleEmbeddings: loadGameRulesRuleEmbeddings(resolve(dataDir, "gameRulesRuleEmbeddings.json"))
  };
  return defaultResources;
}

export function collectCuratedRuleIds(topics: GameRulesTopic[]): Set<string> {
  const ids = new Set<string>();
  for (const topic of topics) {
    for (const ruleNumber of topic.ruleNumbers) {
      ids.add(ruleNumber);
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Scoring constants (DEC-046, tunable defaults)
// ---------------------------------------------------------------------------

const QUESTION_TOKEN_MULTIPLIER = 3;
const KEYWORD_TOKEN_MULTIPLIER = 6;
const SCORE_EXACT_RULE_ID = 100;
const SCORE_PARENT_RULE_ID = 20;
/**
 * REQ-182 (owner decision, 2026-09-05): a candidate rule whose own text cites
 * a rule number the question cites (e.g. 701.8b's text mentions "704.5g")
 * gets this boost in the hybrid blend, on top of (never instead of) the
 * exact-rule-id and parent-rule-id boosts above. Measured 2026-09-05: over
 * the full candidate list, the largest gap between a cross-referenced rule's
 * blended score and the weakest of its top-5 competitors, across the whole
 * accepted alpha band [0.50, 0.70], was 0.078 (`state-based-actions`/701.8b
 * at alpha 0.70). 10 clears that with a wide margin, while staying an order
 * of magnitude below the exact-rule-id boost and half the parent-rule-id
 * boost — preserving the intended hierarchy (exact > parent > cross-reference)
 * rather than acting as an equally-absolute override. See the full alpha
 * sweep with this boost in place in `functional-requirements.md`'s REQ-182
 * Notes and `PRD/work/hybrid-rule-retrieval/slice-a-hybrid-blend.md`.
 */
const SCORE_CROSS_REFERENCE = 10;

/**
 * REQ-182: the single tuned weight for System 3's hybrid blend —
 * `alpha * cosine_norm + (1 - alpha) * lexical_norm` — measured at
 * implementation within the mandated band [0.50, 0.70]. With
 * `SCORE_CROSS_REFERENCE` above in place, all 12 labelled fixture checks pass
 * at every alpha from 0.50 through 0.70 (measured 2026-09-05). 0.60 is chosen
 * from that sweep: the first value where both clean and polluted benchmark
 * recall@5 clear the accepted floors (0.8526 / 0.8333) with real headroom
 * (0.8974 / 0.8910), leaving room for MRR to keep climbing at higher alpha
 * without costing any fixture. See REQ-182's Notes in
 * `PRD/sections/functional-requirements.md` for the full sweep.
 */
export const HYBRID_BLEND_ALPHA = 0.6;

const STOP_WORDS = new Set([
  "and", "are", "can", "card", "cards", "does", "for", "from",
  "has", "have", "how", "one", "that", "the", "this", "what",
  "when", "will", "with"
]);

function tokenize(value: string): string[] {
  return value.toLowerCase()
    .split(/[^a-z0-9.]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function extractRuleIds(value: string): string[] {
  const ids = new Set<string>();
  for (const match of value.matchAll(/\b\d{3}(?:\.\d+[a-z]?)?\b/gi)) {
    ids.add(match[0]);
  }
  return [...ids];
}

// ---------------------------------------------------------------------------
// Query provenance (DEC-046)
// ---------------------------------------------------------------------------

export type QueryTokenSource = "question" | "oracle";
export type QueryToken = { token: string; source: QueryTokenSource; isKeyword: boolean };

/**
 * Split the prompt context into a question-sourced string (the user's question)
 * and an oracle-sourced string — REQ-178: a compact per-card signal (name, type
 * line, and keyword list) for every submitted or attached card, not the card's
 * full oracle text or context notes, and not turn phase or zone ids. A
 * five-card board's full oracle text was measured to drop recall@5 from 0.577
 * to 0.026 on the committed benchmark (REQ-177) by drowning the question in
 * card vocabulary; the compact signal is enough to know what the cards are
 * without the flood.
 *
 * REQ-180: the keyword component comes from each card's real Scryfall
 * `keywords` array (resolved server-side by `cardId`), not from tokenizing
 * oracle text against the hand-curated static vocabulary — that vocabulary is
 * retained only for detecting a keyword named directly in the question text
 * (handled by `buildQueryTokensFromParts`'s existing per-token `isKeyword`
 * check, unchanged here).
 */
export function buildCompactCardSignal(name: string, typeLine: string, keywords: readonly string[] | undefined): string {
  return [name, typeLine, ...(keywords ?? [])].join(" ");
}

function buildQueryParts(context: PromptContext): { questionText: string; oracleText: string } {
  const questionText = context.finalQuestion;

  const cardParts: string[] = [];

  for (const stackItem of context.orderedStack) {
    cardParts.push(buildCompactCardSignal(stackItem.name, stackItem.typeLine, stackItem.keywords));
  }

  for (const zone of context.populatedZones) {
    for (const item of zone.items) {
      cardParts.push(buildCompactCardSignal(item.name, item.typeLine, item.keywords));
    }
  }

  return { questionText, oracleText: cardParts.join(" ") };
}

/** Thin concatenation of question + oracle parts, retained for debug output. */
export function buildQueryText(context: PromptContext): string {
  const { questionText, oracleText } = buildQueryParts(context);
  return `${questionText} ${oracleText}`;
}

export function buildQueryTokens(
  context: PromptContext,
  keywordVocabulary: Set<string> = getDefaultScoringResources().keywordVocabulary
): { queryText: string; tokens: QueryToken[]; queryRuleIds: string[]; questionRuleIds: string[] } {
  return buildQueryTokensFromParts(buildQueryParts(context), keywordVocabulary);
}

export function buildQueryTokensFromParts(
  { questionText, oracleText }: { questionText: string; oracleText: string },
  keywordVocabulary: Set<string> = getDefaultScoringResources().keywordVocabulary
): { queryText: string; tokens: QueryToken[]; queryRuleIds: string[]; questionRuleIds: string[] } {
  const queryText = `${questionText} ${oracleText}`;

  // Dedupe by token; the question source (higher multiplier) wins over oracle.
  const byToken = new Map<string, QueryToken>();
  const addToken = (token: string, source: QueryTokenSource): void => {
    const isKeyword = keywordVocabulary.has(token);
    const existing = byToken.get(token);
    if (!existing) {
      byToken.set(token, { token, source, isKeyword });
      return;
    }
    if (source === "question") existing.source = "question";
    existing.isKeyword = existing.isKeyword || isKeyword;
  };

  for (const token of tokenize(questionText)) addToken(token, "question");
  for (const token of tokenize(oracleText)) addToken(token, "oracle");

  // REQ-182 (owner decision, 2026-09-05): the cross-reference boost below is
  // matched against the question's cited ids only, never oracle-sourced text
  // (a card's rules text could otherwise smuggle in a rule number that
  // silently promotes an unrelated candidate) — a second, narrower rule-id
  // set alongside the existing combined `queryRuleIds`, which the exact-id
  // and parent-id boosts keep using unchanged.
  return {
    queryText,
    tokens: [...byToken.values()],
    queryRuleIds: extractRuleIds(queryText),
    questionRuleIds: extractRuleIds(questionText)
  };
}

// ---------------------------------------------------------------------------
// Scoring (DEC-046)
// ---------------------------------------------------------------------------

type ScoredEntry = { entry: GameRulesRuleIndexEntry; score: number; topTokenIdf: number };

/**
 * REQ-182: the exact-rule-id/parent-rule-id boost, factored out so it can be
 * merged into the blended hybrid score exactly the way it was already merged
 * into the pure-lexical score (`scoreEntry`) and the prior pure-semantic
 * score — one boost computation, three callers.
 */
function computeIdBoost(entry: GameRulesRuleIndexEntry, queryRuleIds: ReadonlySet<string>): number {
  let boost = 0;

  if (queryRuleIds.has(entry.ruleId)) {
    boost += SCORE_EXACT_RULE_ID;
  }

  for (const parentId of entry.parentRuleIds) {
    if (queryRuleIds.has(parentId)) {
      boost += SCORE_PARENT_RULE_ID;
      break;
    }
  }

  return boost;
}

/**
 * REQ-182 (owner decision, 2026-09-05): the cross-reference boost. A
 * candidate whose own rule text cites a rule number the question cites gets
 * `SCORE_CROSS_REFERENCE`, on top of `computeIdBoost` above — never instead
 * of it, and never in place of it. Matched only against `questionRuleIds`
 * (extracted from the question text alone, never oracle-sourced card text —
 * REQ-178's compact-card-signal boundary), so an attached card's rules text
 * can never smuggle in a rule number that silently promotes an unrelated
 * candidate. Hybrid-path only: this never reaches `scoreEntry`'s pure-lexical
 * path, which stays byte-identical under `EMBEDDING_PROVIDER=mock` (A4).
 * A rule's own number, restated in its own text, is excluded — that's
 * `computeIdBoost`'s exact-rule-id case, not a cross-reference to itself.
 */
function computeCrossReferenceBoost(entry: GameRulesRuleIndexEntry, questionRuleIds: ReadonlySet<string>): number {
  if (questionRuleIds.size === 0) return 0;

  for (const citedId of extractRuleIds(entry.text)) {
    if (citedId === entry.ruleId) continue;
    if (questionRuleIds.has(citedId)) return SCORE_CROSS_REFERENCE;
  }

  return 0;
}

/**
 * REQ-182: the lexical word-overlap component only — no id boost. `scoreEntry`
 * below adds the boost on top of this, in the same order (boost first, word
 * overlap accumulated after) the pre-hybrid implementation used, so the
 * mock/lexical-only path stays byte-identical (REQ-182 acceptance:
 * byte-identical scoring under `EMBEDDING_PROVIDER=mock`). The hybrid blend
 * uses this same word-overlap component unboosted, normalizing it against the
 * query's own top lexical score before merging the boost back in once, after
 * blending.
 */
function computeLexicalWordOverlapScore(
  entry: GameRulesRuleIndexEntry,
  tokens: QueryToken[],
  N: number,
  df: Map<string, number> | null
): { score: number; topTokenIdf: number } {
  let score = 0;
  let topTokenIdf = 0;

  const searchTextTokenSet = new Set(tokenize(entry.searchText));

  for (const { token, source, isKeyword } of tokens) {
    if (!searchTextTokenSet.has(token)) continue;
    const tokenDf = df?.get(token) ?? 1;
    const baseIdf = Math.log(N / Math.max(tokenDf, 1));
    let weight = baseIdf;
    if (source === "question") weight *= QUESTION_TOKEN_MULTIPLIER;
    if (isKeyword) weight *= KEYWORD_TOKEN_MULTIPLIER;
    score += weight;
    if (baseIdf > topTokenIdf) topTokenIdf = baseIdf;
  }

  return { score, topTokenIdf };
}

/**
 * Pure lexical scoring (the `EMBEDDING_PROVIDER=mock` / failure-fallback
 * path). Left byte-for-byte identical to the pre-hybrid implementation —
 * same accumulation order (boost first, then each token weight added to the
 * same running total) — so REQ-182's byte-identical-under-mock acceptance
 * gate holds: this is not rebuilt from `computeIdBoost` +
 * `computeLexicalWordOverlapScore` above, because summing those two results
 * as a single addition at the end would associate the floating-point
 * additions differently than accumulating them one at a time.
 */
function scoreEntry(
  entry: GameRulesRuleIndexEntry,
  tokens: QueryToken[],
  queryRuleIds: ReadonlySet<string>,
  N: number,
  df: Map<string, number> | null
): { score: number; topTokenIdf: number } {
  let score = 0;
  let topTokenIdf = 0;

  if (queryRuleIds.has(entry.ruleId)) {
    score += SCORE_EXACT_RULE_ID;
  }

  for (const parentId of entry.parentRuleIds) {
    if (queryRuleIds.has(parentId)) {
      score += SCORE_PARENT_RULE_ID;
      break;
    }
  }

  const searchTextTokenSet = new Set(tokenize(entry.searchText));

  for (const { token, source, isKeyword } of tokens) {
    if (!searchTextTokenSet.has(token)) continue;
    const tokenDf = df?.get(token) ?? 1;
    const baseIdf = Math.log(N / Math.max(tokenDf, 1));
    let weight = baseIdf;
    if (source === "question") weight *= QUESTION_TOKEN_MULTIPLIER;
    if (isKeyword) weight *= KEYWORD_TOKEN_MULTIPLIER;
    score += weight;
    if (baseIdf > topTokenIdf) topTokenIdf = baseIdf;
  }

  return { score, topTokenIdf };
}

/** Cosine similarity between two equal-length vectors, in [-1, 1]. */
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

/**
 * REQ-181/E12 (review loop 1): the committed embeddings artifact and the
 * committed rule index are two separate files, built by two separate steps
 * (`build-rule-embeddings.mjs` reads `gameRulesRuleIndex.json`, but nothing
 * stops a stale embeddings artifact from being committed alongside a newer
 * index, or vice versa — the hash-skip in `build-rule-embeddings.mjs` guards
 * the normal `npm run data:build` path, not every possible checkout state).
 * If the two ever disagree on which rule ids exist, semantic ranking could
 * either miss real rules (in the index, no vector) or rank stale ones (a
 * vector for a rule id the index no longer has) — silently, with no
 * indication anything's wrong. Checked once per (embeddings, index) pair —
 * not per query — and cached, consistent with E7's "one diagnostic warning,
 * fall back to lexical" pattern rather than a thrown error or a per-entry
 * silent drop.
 */
const embeddingsRuleIndexMatchCache = new WeakMap<GameRulesRuleEmbeddings, { index: GameRulesRuleIndexEntry[]; matches: boolean }>();

function embeddingsMatchRuleIndex(embeddings: GameRulesRuleEmbeddings, index: GameRulesRuleIndexEntry[]): boolean {
  const cached = embeddingsRuleIndexMatchCache.get(embeddings);
  if (cached && cached.index === index) return cached.matches;

  const indexRuleIds = new Set(index.map((entry) => entry.ruleId));
  const embeddingRuleIds = new Set(embeddings.ruleIds);
  const matches = indexRuleIds.size === embeddingRuleIds.size && [...indexRuleIds].every((ruleId) => embeddingRuleIds.has(ruleId));

  if (!matches) {
    warnOnce(
      "embeddings-rule-index-mismatch",
      "Committed rule embeddings' rule ids do not match the current gameRulesRuleIndex.json; System 3 falls back to lexical retrieval."
    );
  }

  embeddingsRuleIndexMatchCache.set(embeddings, { index, matches });
  return matches;
}

function scoreIndex(
  tokens: QueryToken[],
  queryRuleIds: string[],
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  resources: ScoringResources,
  queryVector: readonly number[] | null = null,
  questionRuleIds: readonly string[] = []
): { scored: ScoredEntry[]; excludedCuratedRuleCount: number; usedSemantic: boolean } {
  const N = resources.tokenStats?.N ?? index.length;
  const df = resources.tokenStats?.df ?? null;
  const queryRuleIdSet = new Set(queryRuleIds);
  const questionRuleIdSet = new Set(questionRuleIds);

  // SCOPE-D: semantic-primary only when a query vector was actually embedded
  // AND the committed rule-embeddings artifact loaded; any other condition
  // (mock provider, embedding failure, missing/malformed artifact) is the
  // lexical path — never a thrown error, never a worse-than-before result.
  const embeddings = resources.ruleEmbeddings;
  const useSemantic =
    queryVector !== null &&
    embeddings !== null &&
    queryVector.length === embeddings.dims &&
    embeddingsMatchRuleIndex(embeddings, index);
  const embeddingByRuleId = useSemantic
    ? new Map(embeddings!.ruleIds.map((ruleId, vectorIndex) => [ruleId, embeddings!.vectors[vectorIndex]!]))
    : null;

  const scored: ScoredEntry[] = [];
  let excludedCuratedRuleCount = 0;

  if (useSemantic) {
    // REQ-182: hybrid blend, scored over the FULL candidate list — never a
    // truncated top-N of either ranking. First pass collects each eligible
    // candidate's raw cosine and raw lexical (word-overlap only, no id boost)
    // components; both are then min-max normalised against that query's own
    // highest component score before being blended by `HYBRID_BLEND_ALPHA`,
    // with the exact-rule-id/parent-rule-id boost merged into the blended
    // score exactly as it was merged into the pre-hybrid semantic score.
    type HybridCandidate = {
      entry: GameRulesRuleIndexEntry;
      cosineRaw: number;
      lexicalRaw: number;
      topTokenIdf: number;
      boost: number;
    };
    const candidates: HybridCandidate[] = [];

    for (const entry of index) {
      // REQ-179: prefix match, not exact-id-only — a curated parent rule (e.g.
      // 603.1) also excludes its own lettered sub-rules (603.1a) via
      // `parentRuleIds`, so a curated baseline entry can never let its own
      // children reappear as supplemental excerpts.
      if (excludeRuleIds.has(entry.ruleId) || entry.parentRuleIds.some((parentId) => excludeRuleIds.has(parentId))) {
        excludedCuratedRuleCount++;
        continue;
      }

      const entryVector = embeddingByRuleId!.get(entry.ruleId);
      if (!entryVector) continue; // no committed vector for this entry — cannot rank it semantically

      const cosineRaw = cosineSimilarity(queryVector!, entryVector);
      const { score: lexicalRaw, topTokenIdf } = computeLexicalWordOverlapScore(entry, tokens, N, df);
      const boost = computeIdBoost(entry, queryRuleIdSet) + computeCrossReferenceBoost(entry, questionRuleIdSet);
      candidates.push({ entry, cosineRaw, lexicalRaw, topTokenIdf, boost });
    }

    let maxCosine = 0;
    let maxLexical = 0;
    for (const candidate of candidates) {
      if (candidate.cosineRaw > maxCosine) maxCosine = candidate.cosineRaw;
      if (candidate.lexicalRaw > maxLexical) maxLexical = candidate.lexicalRaw;
    }

    for (const candidate of candidates) {
      const cosineNorm = maxCosine > 0 ? candidate.cosineRaw / maxCosine : 0;
      const lexicalNorm = maxLexical > 0 ? candidate.lexicalRaw / maxLexical : 0;
      const blended = HYBRID_BLEND_ALPHA * cosineNorm + (1 - HYBRID_BLEND_ALPHA) * lexicalNorm + candidate.boost;
      if (blended > 0) {
        scored.push({ entry: candidate.entry, score: blended, topTokenIdf: candidate.topTokenIdf });
      }
    }
  } else {
    for (const entry of index) {
      // REQ-179: prefix match, not exact-id-only — a curated parent rule (e.g.
      // 603.1) also excludes its own lettered sub-rules (603.1a) via
      // `parentRuleIds`, so a curated baseline entry can never let its own
      // children reappear as supplemental excerpts.
      if (excludeRuleIds.has(entry.ruleId) || entry.parentRuleIds.some((parentId) => excludeRuleIds.has(parentId))) {
        excludedCuratedRuleCount++;
        continue;
      }

      const { score, topTokenIdf } = scoreEntry(entry, tokens, queryRuleIdSet, N, df);
      if (score > 0) {
        scored.push({ entry, score, topTokenIdf });
      }
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.topTokenIdf !== a.topTokenIdf) return b.topTokenIdf - a.topTokenIdf;
    return parseFloat(a.entry.ruleId) - parseFloat(b.entry.ruleId);
  });

  return { scored, excludedCuratedRuleCount, usedSemantic: useSemantic };
}

function toRetrievedGameRule(scored: ScoredEntry): RetrievedGameRule {
  return {
    ruleId: scored.entry.ruleId,
    sectionTitle: scored.entry.sectionTitle,
    text: scored.entry.text,
    score: scored.score
  };
}

export type SupplementalRulesDebug = {
  queryText: string;
  queryTokens: string[];
  queryRuleIds: string[];
  excludedCuratedRuleCount: number;
  selected: Array<{ ruleId: string; sectionTitle: string; score: number }>;
  runnerUp: Array<{ ruleId: string; sectionTitle: string; score: number }>;
  candidatesScored: number;
  /**
   * REQ-181/E10 (review loop 1): whether this scoring pass actually ran
   * semantic-primary (`scoreIndex`'s `useSemantic` gate) rather than silently
   * falling back to lexical — surfaced so a caller (the eval harness's
   * semantic-path test, in particular) can prove it exercised the real
   * semantic path instead of an unnoticed fallback.
   */
  usedSemantic: boolean;
};

export type SupplementalRulesWithDebug = {
  selected: RetrievedGameRule[];
  runnerUp: RetrievedGameRule[];
  debug: SupplementalRulesDebug;
};

export function retrieveRulesForQueryWithDebug(
  queryTokens: QueryToken[],
  queryRuleIds: string[],
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  max = 5,
  resources: ScoringResources = getDefaultScoringResources(),
  queryVector: readonly number[] | null = null,
  queryText = queryTokens.map((token) => token.token).join(" "),
  questionRuleIds: readonly string[] = []
): SupplementalRulesWithDebug {
  if (index.length === 0) {
    return {
      selected: [],
      runnerUp: [],
      debug: {
        queryText,
        queryTokens: queryTokens.map((token) => token.token),
        queryRuleIds,
        excludedCuratedRuleCount: 0,
        selected: [],
        runnerUp: [],
        candidatesScored: 0,
        usedSemantic: false
      }
    };
  }

  const { scored, excludedCuratedRuleCount, usedSemantic } = scoreIndex(
    queryTokens,
    queryRuleIds,
    index,
    excludeRuleIds,
    resources,
    queryVector,
    questionRuleIds
  );
  const selected = scored.slice(0, max).map(toRetrievedGameRule);
  const runnerUp = scored.slice(max, max + 10).map(toRetrievedGameRule);

  return {
    selected,
    runnerUp,
    debug: {
      queryText,
      queryTokens: queryTokens.map((token) => token.token),
      queryRuleIds,
      excludedCuratedRuleCount,
      selected: selected.map((rule) => ({ ruleId: rule.ruleId, sectionTitle: rule.sectionTitle, score: rule.score })),
      runnerUp: runnerUp.map((rule) => ({ ruleId: rule.ruleId, sectionTitle: rule.sectionTitle, score: rule.score })),
      candidatesScored: scored.length,
      usedSemantic
    }
  };
}

export function retrieveRulesForQuery(
  queryTokens: QueryToken[],
  queryRuleIds: string[],
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  max = 5,
  resources: ScoringResources = getDefaultScoringResources(),
  queryVector: readonly number[] | null = null,
  questionRuleIds: readonly string[] = []
): RetrievedGameRule[] {
  if (index.length === 0) return [];
  const { scored } = scoreIndex(queryTokens, queryRuleIds, index, excludeRuleIds, resources, queryVector, questionRuleIds);
  return scored.slice(0, max).map(toRetrievedGameRule);
}

export function retrieveSupplementalRulesWithDebug(
  context: PromptContext,
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  max = 5,
  resources: ScoringResources = getDefaultScoringResources(),
  queryVector: readonly number[] | null = null
): SupplementalRulesWithDebug {
  const query = buildQueryTokens(context, resources.keywordVocabulary);
  return retrieveRulesForQueryWithDebug(
    query.tokens,
    query.queryRuleIds,
    index,
    excludeRuleIds,
    max,
    resources,
    queryVector,
    query.queryText,
    query.questionRuleIds
  );
}

export function retrieveSupplementalRules(
  context: PromptContext,
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  max = 5,
  resources: ScoringResources = getDefaultScoringResources(),
  queryVector: readonly number[] | null = null
): RetrievedGameRule[] {
  const query = buildQueryTokens(context, resources.keywordVocabulary);
  return retrieveRulesForQuery(
    query.tokens,
    query.queryRuleIds,
    index,
    excludeRuleIds,
    max,
    resources,
    queryVector,
    query.questionRuleIds
  );
}
