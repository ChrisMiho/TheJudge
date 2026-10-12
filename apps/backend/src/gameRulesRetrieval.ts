import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { GameRulesTopic } from "./gameRules.js";
import { conceptTermsForCards } from "./gameRulesConceptMap.js";
import { tokenizeSearchText } from "./gameRulesStemmer.js";
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

const loggedErrors = new Set<string>();

/** One error-level diagnostic per kind, naming both sides of a mismatch (REQ-181, REQ-237). */
export function errorOnce(key: string, message: string): void {
  if (loggedErrors.has(key)) return;
  loggedErrors.add(key);
  console.error(message);
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
 * REQ-179 / REQ-233: one entry of the rule book's glossary (`gameRulesGlossary.json`). It serves only
 * obsolete-term query translation and is never delivered as an excerpt.
 */
export type GameRulesGlossaryEntry = {
  term: string;
  definition: string;
  obsolete: boolean;
  /** Only one sense of a live term is obsolete (for example "Play"); translation leaves it alone. */
  obsoleteSense?: boolean;
};

const glossaryCache = new Map<string, GameRulesGlossaryEntry[]>();

export function loadGameRulesGlossary(filePath: string): GameRulesGlossaryEntry[] {
  const cached = glossaryCache.get(filePath);
  if (cached !== undefined) return cached;

  if (!existsSync(filePath)) {
    warnOnce(filePath, `Game rules glossary missing; obsolete-term translation disabled: ${filePath}`);
    glossaryCache.set(filePath, []);
    return [];
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    const entries = (Array.isArray(parsed) ? parsed : []).filter(
      (entry): entry is GameRulesGlossaryEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as GameRulesGlossaryEntry).term === "string" &&
        typeof (entry as GameRulesGlossaryEntry).definition === "string" &&
        typeof (entry as GameRulesGlossaryEntry).obsolete === "boolean"
    );
    glossaryCache.set(filePath, entries);
    return entries;
  } catch (error) {
    warnOnce(filePath, `Game rules glossary could not be parsed; obsolete-term translation disabled: ${filePath}`, error);
    glossaryCache.set(filePath, []);
    return [];
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
  /** REQ-233: the rule book's glossary, for obsolete-term query translation. Absent means none. */
  glossary?: GameRulesGlossaryEntry[];
};

let defaultResources: ScoringResources | null = null;

export function getDefaultScoringResources(): ScoringResources {
  if (defaultResources) return defaultResources;
  const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../data");
  defaultResources = {
    tokenStats: loadGameRulesTokenStats(resolve(dataDir, "gameRulesTokenStats.json")),
    keywordVocabulary: loadGameRulesKeywordVocabulary(resolve(dataDir, "gameRulesKeywordVocabulary.json")),
    ruleEmbeddings: loadGameRulesRuleEmbeddings(resolve(dataDir, "gameRulesRuleEmbeddings.json")),
    glossary: loadGameRulesGlossary(resolve(dataDir, "gameRulesGlossary.json"))
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
/** REQ-234: a concept term (and the turn step, and an obsolete term's definition words) counts twice a card-signal word. */
const CONCEPT_TOKEN_MULTIPLIER = 2;
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
 * REQ-182: the single tuned weight for System 3's hybrid blend --
 * `alpha * cosine_norm + (1 - alpha) * lexical_norm` -- inside the accepted band
 * [0.50, 0.70]. 0.65 (changed from 0.60 by `right-rules-in-order`) is the weight
 * the Magic-trained search model (REQ-236) was measured at, with the token fixes
 * (REQ-233), the concept map (REQ-234) and per-card search (REQ-235) in place.
 * All 12 labelled fixture checks and the benchmark floors (0.8526 clean, 0.8333
 * polluted) stay gates at this weight. See REQ-182's Notes in
 * `PRD/sections/functional-requirements.md` for the original sweep.
 */
export const HYBRID_BLEND_ALPHA = 0.65;

/** REQ-235: how many of the System 3 slots the per-card searches reserve. The cap itself stays at REQ-190's value. */
export const PER_CARD_RESERVED_SLOTS = 2;

/** REQ-233: a single-word obsolete term used in more rules than this is a live Magic word, not translated. */
const LIVE_WORD_DOCUMENT_FREQUENCY = 25;

/**
 * REQ-233: the one tokenizer (sentence dots dropped, "can't" whole, Porter stems), shared with the
 * rule-index build and the training export. The committed index stores each rule's `searchText` as
 * these tokens already, so the rule side is read by splitting on spaces, never stemmed twice.
 */
const tokenize = tokenizeSearchText;

const searchTokenCache = new WeakMap<GameRulesRuleIndexEntry, Set<string>>();

function searchTokensOf(entry: GameRulesRuleIndexEntry): Set<string> {
  let tokens = searchTokenCache.get(entry);
  if (!tokens) {
    tokens = new Set(entry.searchText.split(" ").filter((token) => token.length > 0));
    searchTokenCache.set(entry, tokens);
  }
  return tokens;
}

/**
 * REQ-233: the rule ids a text cites. A dotted id (`613.9`, `704.5aa`) always counts; a bare
 * three-digit number counts only directly after "rule", "rules", "CR" or "section", so "100 life"
 * is not a pointer to rule 100.
 */
export function extractRuleIds(value: string): string[] {
  const ids = new Set<string>();
  for (const match of value.matchAll(/\b\d{3}\.\d+[a-z]{0,2}\b/gi)) {
    ids.add(match[0]);
  }
  for (const match of value.matchAll(/\b(?:rules?|cr|section)\s+(\d{3})\b(?!\.\d)/gi)) {
    ids.add(match[1]!);
  }
  return [...ids];
}

/**
 * REQ-233: rule-book order for ties -- a comparator over the id's numbered parts and its letters, so
 * `704.5z` sorts before `704.5aa` (one letter before two), where `parseFloat` read both as 704.5.
 */
export function compareRuleIds(a: string, b: string): number {
  const partsOf = (id: string): Array<[number, string]> =>
    id.split(".").map((part): [number, string] => {
      const match = /^(\d*)([a-z]*)$/.exec(part);
      return match ? [match[1] === "" ? -1 : Number(match[1]), match[2]!] : [-1, part];
    });
  const left = partsOf(a);
  const right = partsOf(b);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const [leftNumber, leftLetters] = left[i]!;
    const [rightNumber, rightLetters] = right[i]!;
    if (leftNumber !== rightNumber) return leftNumber - rightNumber;
    if (leftLetters !== rightLetters) {
      if (leftLetters.length !== rightLetters.length) return leftLetters.length - rightLetters.length;
      return leftLetters < rightLetters ? -1 : 1;
    }
  }
  return left.length - right.length;
}

// ---------------------------------------------------------------------------
// Query provenance (DEC-046)
// ---------------------------------------------------------------------------

export type QueryTokenSource = "question" | "oracle" | "concept";
export type QueryToken = { token: string; source: QueryTokenSource; isKeyword: boolean };

/** How much a source counts: the question three times a card-signal word, a concept word twice. */
const SOURCE_MULTIPLIER: Record<QueryTokenSource, number> = {
  question: QUESTION_TOKEN_MULTIPLIER,
  concept: CONCEPT_TOKEN_MULTIPLIER,
  oracle: 1
};

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
 * `keywords` array (resolved server-side by `cardId`), and every one of those
 * keywords carries the keyword weight (REQ-233 amends REQ-180: not only the
 * ones on the static vocabulary). The static vocabulary still detects a
 * keyword named directly in the question text.
 */
export function buildCompactCardSignal(name: string, typeLine: string, keywords: readonly string[] | undefined): string {
  return [name, typeLine, ...(keywords ?? [])].join(" ");
}

/** The words of every keyword in a list, as search tokens (a multi-word keyword counts word by word). */
function keywordTokensOfList(keywords: readonly string[]): Set<string> {
  return new Set(keywords.flatMap((keyword) => tokenize(keyword)));
}

const vocabularyTokenCache = new WeakMap<Set<string>, Set<string>>();

/** The static keyword vocabulary as search tokens (stemmed the same way as the query). */
function vocabularyTokens(vocabulary: Set<string>): Set<string> {
  let tokens = vocabularyTokenCache.get(vocabulary);
  if (!tokens) {
    tokens = keywordTokensOfList([...vocabulary]);
    vocabularyTokenCache.set(vocabulary, tokens);
  }
  return tokens;
}

/** What the word query is built from. `conceptText` is the text that counts at the concept weight. */
export type QueryParts = {
  questionText: string;
  /** The compact per-card signals, joined. */
  oracleText: string;
  /** Every attached card's own Scryfall keywords: each one carries the keyword weight (REQ-180, REQ-233). */
  cardKeywords?: readonly string[];
  /** REQ-234 / REQ-233 / REQ-178: concept terms, the In-Depth turn step and obsolete-term definition words. */
  conceptText?: string;
  /** The text that is embedded for the main vector when it is not simply question + signal. */
  embeddedText?: string;
};

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
  { questionText, oracleText, cardKeywords = [], conceptText = "", embeddedText }: QueryParts,
  keywordVocabulary: Set<string> = getDefaultScoringResources().keywordVocabulary
): { queryText: string; tokens: QueryToken[]; queryRuleIds: string[]; questionRuleIds: string[] } {
  const queryText = embeddedText ?? `${questionText} ${oracleText}`;
  const vocabularyWords = vocabularyTokens(keywordVocabulary);
  const cardKeywordWords = keywordTokensOfList(cardKeywords);

  // Dedupe by token; the heavier source wins (question 3, concept 2, oracle 1) and a token that is
  // a keyword anywhere stays a keyword.
  const byToken = new Map<string, QueryToken>();
  const addToken = (token: string, source: QueryTokenSource, isKeyword: boolean): void => {
    const existing = byToken.get(token);
    if (!existing) {
      byToken.set(token, { token, source, isKeyword });
      return;
    }
    if (SOURCE_MULTIPLIER[source] > SOURCE_MULTIPLIER[existing.source]) existing.source = source;
    existing.isKeyword = existing.isKeyword || isKeyword;
  };

  for (const token of tokenize(questionText)) addToken(token, "question", vocabularyWords.has(token));
  for (const token of tokenize(oracleText)) addToken(token, "oracle", vocabularyWords.has(token) || cardKeywordWords.has(token));
  for (const token of tokenize(conceptText)) addToken(token, "concept", false);

  // REQ-182 (owner decision, 2026-09-05): the cross-reference boost below is
  // matched against the question's cited ids only, never oracle-sourced text
  // (a card's rules text could otherwise smuggle in a rule number that
  // silently promotes an unrelated candidate) — a second, narrower rule-id
  // set alongside the existing combined `queryRuleIds`, which the exact-id
  // and parent-id boosts keep using unchanged.
  return {
    queryText,
    tokens: [...byToken.values()],
    queryRuleIds: extractRuleIds(`${questionText} ${oracleText}`),
    questionRuleIds: extractRuleIds(questionText)
  };
}

// ---------------------------------------------------------------------------
// The whole retrieval query: question, cards, concepts, turn step, obsolete terms
// ---------------------------------------------------------------------------

/** A card as the search reads it. */
export type RetrievalCard = {
  cardId?: string;
  name: string;
  typeLine: string;
  keywords?: readonly string[];
  oracleText?: string;
};

export type RetrievalQueryInput = {
  questionText: string;
  cards: readonly RetrievalCard[];
  /** REQ-178: In-Depth only -- the rule-book name of the current turn step ("cleanup step"). */
  turnStep?: string | null;
};

/** REQ-235: one card's own search text, embedded on its own and never merged into the main query. */
export type PerCardSearchText = { key: string; cardName: string; text: string };

export type RetrievalQuery = ReturnType<typeof buildQueryTokensFromParts> & {
  /** REQ-234: the de-duplicated concept terms the cards' wording produced. */
  conceptTerms: string[];
  /** REQ-233: the glossary terms the question used that the rule book marks obsolete. */
  obsoleteTerms: string[];
  /** REQ-235: one text per distinct card with oracle text. */
  perCardTexts: PerCardSearchText[];
};

/** The key a per-card search text is stored under (frozen vectors, route embeddings): a hash of the text. */
export function perCardTextKey(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** REQ-178: the rule-book name of a turn step, for the In-Depth query. */
export function turnStepSearchName(turnPhase: string, combatStep?: string): string {
  if (turnPhase === "combat") {
    switch (combatStep) {
      case "beginning_of_combat":
        return "beginning of combat step";
      case "declare_attackers":
        return "declare attackers step";
      case "declare_blockers":
        return "declare blockers step";
      case "combat_damage":
        return "combat damage step";
      case "end_of_combat":
        return "end of combat step";
      default:
        return "combat phase";
    }
  }
  switch (turnPhase) {
    case "untap":
      return "untap step";
    case "upkeep":
      return "upkeep step";
    case "draw":
      return "draw step";
    case "main_1":
      return "precombat main phase";
    case "main_2":
      return "postcombat main phase";
    case "end_step":
      return "end step";
    case "cleanup":
      return "cleanup step";
    default:
      return "";
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * REQ-233: the glossary entries the question uses that the rule book marks obsolete ("mana burn"),
 * as the entries' terms and their definition text. An entry that flags only one obsolete sense of a
 * live term ("Play") is skipped, and so is a single-word term the rules use as an ordinary word
 * ("during"): translating those would add the same words to nearly every query.
 */
export function findObsoleteGlossaryTerms(
  questionText: string,
  glossary: readonly GameRulesGlossaryEntry[],
  tokenStats: GameRulesTokenStats | null
): { terms: string[]; definitionText: string } {
  const question = questionText.toLowerCase().replace(/[‘’]/g, "'");
  const terms: string[] = [];
  const definitions: string[] = [];
  for (const entry of glossary) {
    if (!entry.obsolete || entry.obsoleteSense) continue;
    const alternates = entry.term.split(",").map((alternate) => alternate.trim().toLowerCase()).filter((alternate) => alternate.length > 0);
    const used = alternates.some((alternate) => {
      const isSingleWord = !/[\s-]/.test(alternate);
      if (isSingleWord) {
        const [token] = tokenize(alternate);
        if (token && (tokenStats?.df.get(token) ?? 0) >= LIVE_WORD_DOCUMENT_FREQUENCY) return false;
      }
      const phrase = escapeRegExp(alternate).replace(/\\-/g, "[- ]").replace(/-/g, "[- ]").replace(/\s+/g, "\\s+");
      return new RegExp(`(?<![a-z0-9])${phrase}(?![a-z0-9])`).test(question);
    });
    if (!used) continue;
    terms.push(entry.term);
    definitions.push(entry.definition);
  }
  return { terms, definitionText: definitions.join(" ") };
}

/**
 * REQ-178 / REQ-233 / REQ-234 / REQ-235: the one place the retrieval query is assembled. The
 * question and each card's compact signal (never the card's oracle text), plus the concept terms the
 * cards' wording produced, the In-Depth turn step and the definition words of any obsolete term the
 * question used. The concept terms, the step and the definition words count at the concept weight in
 * the word query and are appended to the text that is embedded. Each card's own oracle text becomes
 * a separate per-card search text; it never enters the main query or its embedding.
 */
export function buildRetrievalQuery(
  input: RetrievalQueryInput,
  resources: Pick<ScoringResources, "keywordVocabulary" | "tokenStats" | "glossary"> = getDefaultScoringResources()
): RetrievalQuery {
  const signal = input.cards.map((card) => buildCompactCardSignal(card.name, card.typeLine, card.keywords)).join(" ");
  const conceptTerms = conceptTermsForCards(input.cards);
  const turnStep = input.turnStep?.trim() ?? "";
  const obsolete = findObsoleteGlossaryTerms(input.questionText, resources.glossary ?? [], resources.tokenStats);

  const embeddedText = [
    `${input.questionText} ${signal}`.trim(),
    conceptTerms.join(", "),
    turnStep,
    obsolete.definitionText
  ]
    .filter((part) => part.length > 0)
    .join(" ");
  const conceptText = [conceptTerms.join(" "), turnStep, obsolete.definitionText].filter((part) => part.length > 0).join(" ");

  const query = buildQueryTokensFromParts(
    {
      questionText: input.questionText,
      oracleText: signal,
      cardKeywords: input.cards.flatMap((card) => card.keywords ?? []),
      conceptText,
      embeddedText
    },
    resources.keywordVocabulary
  );

  const perCardTexts: PerCardSearchText[] = [];
  const seenCards = new Set<string>();
  for (const card of input.cards) {
    const text = (card.oracleText ?? "").trim();
    if (text.length === 0) continue;
    const identity = card.cardId && card.cardId.length > 0 ? card.cardId : card.name;
    if (seenCards.has(identity)) continue;
    seenCards.add(identity);
    perCardTexts.push({ key: perCardTextKey(text), cardName: card.name, text });
  }

  return { ...query, conceptTerms, obsoleteTerms: obsolete.terms, perCardTexts };
}

/** The retrieval input for a game-mode prompt context: stack and zone cards, plus the current turn step. */
export function retrievalInputFromPromptContext(context: PromptContext): RetrievalQueryInput {
  return {
    questionText: context.finalQuestion,
    cards: [...context.orderedStack, ...context.populatedZones.flatMap((zone) => zone.items)],
    turnStep: turnStepSearchName(context.gameContext.turnPhase, context.gameContext.combatStep)
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

  const searchTextTokenSet = searchTokensOf(entry);

  for (const { token, source, isKeyword } of tokens) {
    if (!searchTextTokenSet.has(token)) continue;
    const tokenDf = df?.get(token) ?? 1;
    const baseIdf = Math.log(N / Math.max(tokenDf, 1));
    let weight = baseIdf;
    weight *= SOURCE_MULTIPLIER[source];
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

  const searchTextTokenSet = searchTokensOf(entry);

  for (const { token, source, isKeyword } of tokens) {
    if (!searchTextTokenSet.has(token)) continue;
    const tokenDf = df?.get(token) ?? 1;
    const baseIdf = Math.log(N / Math.max(tokenDf, 1));
    let weight = baseIdf;
    weight *= SOURCE_MULTIPLIER[source];
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
): {
  scored: ScoredEntry[];
  excludedCuratedRuleCount: number;
  usedSemantic: boolean;
  ruleVectorById: ReadonlyMap<string, readonly number[]> | null;
} {
  const N = resources.tokenStats?.N ?? index.length;
  const df = resources.tokenStats?.df ?? null;
  const queryRuleIdSet = new Set(queryRuleIds);
  const questionRuleIdSet = new Set(questionRuleIds);

  // SCOPE-D: semantic-primary only when a query vector was actually embedded
  // AND the committed rule-embeddings artifact loaded; any other condition
  // (mock provider, embedding failure, missing/malformed artifact) is the
  // lexical path — never a thrown error, never a worse-than-before result.
  const embeddings = resources.ruleEmbeddings;
  // REQ-181 (amended): a query vector whose size is not the rule vectors' size (an OpenAI-sized
  // 1,536-dimension vector against the committed 384) is never silently ranked lexically: one
  // error-level diagnostic names both sides, and the lexical path serves the question.
  if (queryVector !== null && embeddings !== null && queryVector.length !== embeddings.dims) {
    errorOnce(
      "query-vector-dimension-mismatch",
      `Query embedding has ${queryVector.length} dimensions but the committed rule vectors have ${embeddings.dims} (model ${embeddings.model}); the semantic path is disabled and System 3 falls back to lexical retrieval.`
    );
  }
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
      // REQ-179: exact-id exclusion — only a rule number a selected curated
      // topic lists is dropped. Its unlisted sub-rules (603.2e under a listed
      // 603.2) stay rankable. Safe because a topic's excerpt carries exactly
      // the rules it lists, which gameRulesTopicData.test.ts holds.
      if (excludeRuleIds.has(entry.ruleId)) {
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
      // REQ-179: exact-id exclusion — only a rule number a selected curated
      // topic lists is dropped. Its unlisted sub-rules (603.2e under a listed
      // 603.2) stay rankable. Safe because a topic's excerpt carries exactly
      // the rules it lists, which gameRulesTopicData.test.ts holds.
      if (excludeRuleIds.has(entry.ruleId)) {
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
    return compareRuleIds(a.entry.ruleId, b.entry.ruleId);
  });

  return { scored, excludedCuratedRuleCount, usedSemantic: useSemantic, ruleVectorById: embeddingByRuleId };
}

function toRetrievedGameRule(scored: ScoredEntry): RetrievedGameRule {
  return {
    ruleId: scored.entry.ruleId,
    sectionTitle: scored.entry.sectionTitle,
    text: scored.entry.text,
    score: scored.score
  };
}

/** REQ-235: one card's own search vector (its oracle text embedded on its own). */
export type PerCardVector = { cardName: string; vector: readonly number[] };

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
  /** REQ-235: the selected rules that came from a per-card search, and the card each came from. */
  perCardSelected: Array<{ ruleId: string; cardName: string }>;
};

export type SupplementalRulesWithDebug = {
  selected: RetrievedGameRule[];
  runnerUp: RetrievedGameRule[];
  debug: SupplementalRulesDebug;
};

/**
 * REQ-235: per-card search. Each card's own vector is ranked cosine-only against the committed rule
 * vectors (curated rules excluded, REQ-179). Cards are taken in order of their best cosine score;
 * each contributes its top-ranked rule unless that rule is already selected (then the card is
 * skipped), until `PER_CARD_RESERVED_SLOTS` are filled. The main ranking keeps the first
 * `max - PER_CARD_RESERVED_SLOTS` slots and fills every slot the cards leave open.
 */
function selectWithPerCardSlots(
  scored: ScoredEntry[],
  max: number,
  cardVectors: readonly PerCardVector[],
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  ruleVectorById: ReadonlyMap<string, readonly number[]> | null
): { selected: ScoredEntry[]; perCardSelected: Array<{ ruleId: string; cardName: string }> } {
  if (ruleVectorById === null || cardVectors.length === 0 || max <= PER_CARD_RESERVED_SLOTS) {
    return { selected: scored.slice(0, max), perCardSelected: [] };
  }

  const entryById = new Map(index.map((entry) => [entry.ruleId, entry]));
  const dimensions = ruleVectorById.values().next().value?.length ?? 0;
  const topHits: Array<{ cardName: string; entry: GameRulesRuleIndexEntry; cosine: number }> = [];
  for (const card of cardVectors) {
    if (card.vector.length !== dimensions) continue;
    let best: { entry: GameRulesRuleIndexEntry; cosine: number } | null = null;
    for (const [ruleId, ruleVector] of ruleVectorById) {
      if (excludeRuleIds.has(ruleId)) continue;
      const entry = entryById.get(ruleId);
      if (!entry) continue;
      const cosine = cosineSimilarity(card.vector, ruleVector);
      if (best === null || cosine > best.cosine || (cosine === best.cosine && compareRuleIds(ruleId, best.entry.ruleId) < 0)) {
        best = { entry, cosine };
      }
    }
    if (best) topHits.push({ cardName: card.cardName, ...best });
  }
  topHits.sort((a, b) => b.cosine - a.cosine);

  const keep = scored.slice(0, max - PER_CARD_RESERVED_SLOTS);
  const chosen = new Set(keep.map((candidate) => candidate.entry.ruleId));
  const picks: ScoredEntry[] = [];
  const perCardSelected: Array<{ ruleId: string; cardName: string }> = [];
  for (const hit of topHits) {
    if (picks.length >= PER_CARD_RESERVED_SLOTS) break;
    if (chosen.has(hit.entry.ruleId)) continue;
    chosen.add(hit.entry.ruleId);
    picks.push({ entry: hit.entry, score: hit.cosine, topTokenIdf: 0 });
    perCardSelected.push({ ruleId: hit.entry.ruleId, cardName: hit.cardName });
  }
  const fill = scored.filter((candidate) => !chosen.has(candidate.entry.ruleId)).slice(0, max - keep.length - picks.length);
  return { selected: [...keep, ...picks, ...fill], perCardSelected };
}

export function retrieveRulesForQueryWithDebug(
  queryTokens: QueryToken[],
  queryRuleIds: string[],
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  max = 5,
  resources: ScoringResources = getDefaultScoringResources(),
  queryVector: readonly number[] | null = null,
  queryText = queryTokens.map((token) => token.token).join(" "),
  questionRuleIds: readonly string[] = [],
  cardVectors: readonly PerCardVector[] = []
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
        usedSemantic: false,
        perCardSelected: []
      }
    };
  }

  const { scored, excludedCuratedRuleCount, usedSemantic, ruleVectorById } = scoreIndex(
    queryTokens,
    queryRuleIds,
    index,
    excludeRuleIds,
    resources,
    queryVector,
    questionRuleIds
  );
  const picked = selectWithPerCardSlots(scored, max, cardVectors, index, excludeRuleIds, ruleVectorById);
  const selected = picked.selected.map(toRetrievedGameRule);
  const selectedIds = new Set(selected.map((rule) => rule.ruleId));
  const runnerUp = scored.filter((candidate) => !selectedIds.has(candidate.entry.ruleId)).slice(0, 10).map(toRetrievedGameRule);

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
      usedSemantic,
      perCardSelected: picked.perCardSelected
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
  questionRuleIds: readonly string[] = [],
  cardVectors: readonly PerCardVector[] = []
): RetrievedGameRule[] {
  if (index.length === 0) return [];
  const { scored, ruleVectorById } = scoreIndex(queryTokens, queryRuleIds, index, excludeRuleIds, resources, queryVector, questionRuleIds);
  return selectWithPerCardSlots(scored, max, cardVectors, index, excludeRuleIds, ruleVectorById).selected.map(toRetrievedGameRule);
}

export function retrieveSupplementalRulesWithDebug(
  context: PromptContext,
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  max = 5,
  resources: ScoringResources = getDefaultScoringResources(),
  queryVector: readonly number[] | null = null,
  cardVectors: readonly PerCardVector[] = []
): SupplementalRulesWithDebug {
  const query = buildRetrievalQuery(retrievalInputFromPromptContext(context), resources);
  return retrieveRulesForQueryWithDebug(
    query.tokens,
    query.queryRuleIds,
    index,
    excludeRuleIds,
    max,
    resources,
    queryVector,
    query.queryText,
    query.questionRuleIds,
    cardVectors
  );
}

export function retrieveSupplementalRules(
  context: PromptContext,
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  max = 5,
  resources: ScoringResources = getDefaultScoringResources(),
  queryVector: readonly number[] | null = null,
  cardVectors: readonly PerCardVector[] = []
): RetrievedGameRule[] {
  const query = buildRetrievalQuery(retrievalInputFromPromptContext(context), resources);
  return retrieveRulesForQuery(
    query.tokens,
    query.queryRuleIds,
    index,
    excludeRuleIds,
    max,
    resources,
    queryVector,
    query.questionRuleIds,
    cardVectors
  );
}
