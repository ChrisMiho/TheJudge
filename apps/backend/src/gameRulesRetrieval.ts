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

/** Scoring resources used by System 3 retrieval. */
export type ScoringResources = {
  tokenStats: GameRulesTokenStats | null;
  keywordVocabulary: Set<string>;
};

let defaultResources: ScoringResources | null = null;

function getDefaultScoringResources(): ScoringResources {
  if (defaultResources) return defaultResources;
  const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../data");
  defaultResources = {
    tokenStats: loadGameRulesTokenStats(resolve(dataDir, "gameRulesTokenStats.json")),
    keywordVocabulary: loadGameRulesKeywordVocabulary(resolve(dataDir, "gameRulesKeywordVocabulary.json"))
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
 * and an oracle-sourced string (turn phase, zones, card fields, and context notes).
 */
function buildQueryParts(context: PromptContext): { questionText: string; oracleText: string } {
  const questionText = context.finalQuestion;

  const oracleParts: string[] = [];
  oracleParts.push(context.gameContext.turnPhase);
  oracleParts.push(context.gameContext.selectedZones.join(" "));

  for (const stackItem of context.orderedStack) {
    const stackParts = [stackItem.name, stackItem.typeLine, stackItem.oracleText];
    if (stackItem.contextNotes) {
      stackParts.push(stackItem.contextNotes);
    }
    oracleParts.push(stackParts.join(" "));
  }

  for (const zone of context.populatedZones) {
    for (const item of zone.items) {
      const itemParts = [zone.zoneId, item.name, item.typeLine, item.oracleText];
      if (item.contextNotes) {
        itemParts.push(item.contextNotes);
      }
      oracleParts.push(itemParts.join(" "));
    }
  }

  return { questionText, oracleText: oracleParts.join(" ") };
}

/** Thin concatenation of question + oracle parts, retained for debug output. */
export function buildQueryText(context: PromptContext): string {
  const { questionText, oracleText } = buildQueryParts(context);
  return `${questionText} ${oracleText}`;
}

export function buildQueryTokens(
  context: PromptContext,
  keywordVocabulary: Set<string> = getDefaultScoringResources().keywordVocabulary
): { queryText: string; tokens: QueryToken[]; queryRuleIds: string[] } {
  return buildQueryTokensFromParts(buildQueryParts(context), keywordVocabulary);
}

export function buildQueryTokensFromParts(
  { questionText, oracleText }: { questionText: string; oracleText: string },
  keywordVocabulary: Set<string> = getDefaultScoringResources().keywordVocabulary
): { queryText: string; tokens: QueryToken[]; queryRuleIds: string[] } {
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

  return { queryText, tokens: [...byToken.values()], queryRuleIds: extractRuleIds(queryText) };
}

// ---------------------------------------------------------------------------
// Scoring (DEC-046)
// ---------------------------------------------------------------------------

type ScoredEntry = { entry: GameRulesRuleIndexEntry; score: number; topTokenIdf: number };

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

function scoreIndex(
  tokens: QueryToken[],
  queryRuleIds: string[],
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  resources: ScoringResources
): { scored: ScoredEntry[]; excludedCuratedRuleCount: number } {
  const N = resources.tokenStats?.N ?? index.length;
  const df = resources.tokenStats?.df ?? null;
  const queryRuleIdSet = new Set(queryRuleIds);

  const scored: ScoredEntry[] = [];
  let excludedCuratedRuleCount = 0;

  for (const entry of index) {
    if (excludeRuleIds.has(entry.ruleId)) {
      excludedCuratedRuleCount++;
      continue;
    }
    const { score, topTokenIdf } = scoreEntry(entry, tokens, queryRuleIdSet, N, df);
    if (score > 0) {
      scored.push({ entry, score, topTokenIdf });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.topTokenIdf !== a.topTokenIdf) return b.topTokenIdf - a.topTokenIdf;
    return parseFloat(a.entry.ruleId) - parseFloat(b.entry.ruleId);
  });

  return { scored, excludedCuratedRuleCount };
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
  queryText = queryTokens.map((token) => token.token).join(" ")
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
        candidatesScored: 0
      }
    };
  }

  const { scored, excludedCuratedRuleCount } = scoreIndex(
    queryTokens,
    queryRuleIds,
    index,
    excludeRuleIds,
    resources
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
      candidatesScored: scored.length
    }
  };
}

export function retrieveRulesForQuery(
  queryTokens: QueryToken[],
  queryRuleIds: string[],
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  max = 5,
  resources: ScoringResources = getDefaultScoringResources()
): RetrievedGameRule[] {
  if (index.length === 0) return [];
  const { scored } = scoreIndex(queryTokens, queryRuleIds, index, excludeRuleIds, resources);
  return scored.slice(0, max).map(toRetrievedGameRule);
}

export function retrieveSupplementalRulesWithDebug(
  context: PromptContext,
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  max = 5,
  resources: ScoringResources = getDefaultScoringResources()
): SupplementalRulesWithDebug {
  const query = buildQueryTokens(context, resources.keywordVocabulary);
  return retrieveRulesForQueryWithDebug(
    query.tokens,
    query.queryRuleIds,
    index,
    excludeRuleIds,
    max,
    resources,
    query.queryText
  );
}

export function retrieveSupplementalRules(
  context: PromptContext,
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  max = 5,
  resources: ScoringResources = getDefaultScoringResources()
): RetrievedGameRule[] {
  const query = buildQueryTokens(context, resources.keywordVocabulary);
  return retrieveRulesForQuery(query.tokens, query.queryRuleIds, index, excludeRuleIds, max, resources);
}
