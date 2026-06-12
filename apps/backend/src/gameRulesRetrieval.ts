import { existsSync, readFileSync } from "node:fs";
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

export function collectCuratedRuleIds(topics: GameRulesTopic[]): Set<string> {
  const ids = new Set<string>();
  for (const topic of topics) {
    for (const ruleNumber of topic.ruleNumbers) {
      ids.add(ruleNumber);
    }
  }
  return ids;
}

const SCORE_EXACT_RULE_ID = 100;
const SCORE_PARENT_RULE_ID = 20;
const SCORE_DOTTED_TOKEN_MATCH = 8;
const SCORE_TOKEN_MATCH = 1;

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

export function buildQueryText(context: PromptContext): string {
  const parts: string[] = [];

  parts.push(context.finalQuestion);
  parts.push(context.gameContext.turnPhase);
  parts.push(context.gameContext.selectedZones.join(" "));

  for (const stackItem of context.orderedStack) {
    const stackParts = [stackItem.name, stackItem.typeLine, stackItem.oracleText];
    if (stackItem.contextNotes) {
      stackParts.push(stackItem.contextNotes);
    }
    parts.push(stackParts.join(" "));
  }

  for (const zone of context.populatedZones) {
    for (const item of zone.items) {
      const itemParts = [zone.zoneId, item.name, item.typeLine, item.oracleText];
      if (item.contextNotes) {
        itemParts.push(item.contextNotes);
      }
      parts.push(itemParts.join(" "));
    }
  }

  return parts.join(" ");
}

function scoreEntry(entry: GameRulesRuleIndexEntry, queryTokens: string[], queryRuleIds: string[]): number {
  let score = 0;

  if (queryRuleIds.includes(entry.ruleId)) {
    score += SCORE_EXACT_RULE_ID;
  }

  for (const parentId of entry.parentRuleIds) {
    if (queryRuleIds.includes(parentId)) {
      score += SCORE_PARENT_RULE_ID;
      break;
    }
  }

  const searchTextTokens = tokenize(entry.searchText);
  const searchTextTokenSet = new Set(searchTextTokens);

  for (const token of queryTokens) {
    if (searchTextTokenSet.has(token)) {
      score += token.includes(".") ? SCORE_DOTTED_TOKEN_MATCH : SCORE_TOKEN_MATCH;
    }
  }

  return score;
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

export function retrieveSupplementalRulesWithDebug(
  context: PromptContext,
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  max = 5
): SupplementalRulesWithDebug {
  const queryText = buildQueryText(context);
  const queryTokens = tokenize(queryText);
  const queryRuleIds = extractRuleIds(queryText);

  if (index.length === 0) {
    return {
      selected: [],
      runnerUp: [],
      debug: {
        queryText,
        queryTokens,
        queryRuleIds,
        excludedCuratedRuleCount: 0,
        selected: [],
        runnerUp: [],
        candidatesScored: 0
      }
    };
  }

  const scored: RetrievedGameRule[] = [];
  let excludedCuratedRuleCount = 0;

  for (const entry of index) {
    if (excludeRuleIds.has(entry.ruleId)) {
      excludedCuratedRuleCount++;
      continue;
    }

    const score = scoreEntry(entry, queryTokens, queryRuleIds);
    if (score > 0) {
      scored.push({ ruleId: entry.ruleId, sectionTitle: entry.sectionTitle, text: entry.text, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return parseFloat(a.ruleId) - parseFloat(b.ruleId);
  });

  const selected = scored.slice(0, max);
  const runnerUp = scored.slice(max, max + 10);

  return {
    selected,
    runnerUp,
    debug: {
      queryText,
      queryTokens,
      queryRuleIds,
      excludedCuratedRuleCount,
      selected: selected.map((r) => ({ ruleId: r.ruleId, sectionTitle: r.sectionTitle, score: r.score })),
      runnerUp: runnerUp.map((r) => ({ ruleId: r.ruleId, sectionTitle: r.sectionTitle, score: r.score })),
      candidatesScored: scored.length
    }
  };
}

export function retrieveSupplementalRules(
  context: PromptContext,
  index: GameRulesRuleIndexEntry[],
  excludeRuleIds: Set<string>,
  max = 5
): RetrievedGameRule[] {
  if (index.length === 0) return [];

  const queryText = buildQueryText(context);
  const queryTokens = tokenize(queryText);
  const queryRuleIds = extractRuleIds(queryText);

  const scored: RetrievedGameRule[] = [];

  for (const entry of index) {
    if (excludeRuleIds.has(entry.ruleId)) continue;

    const score = scoreEntry(entry, queryTokens, queryRuleIds);
    if (score > 0) {
      scored.push({
        ruleId: entry.ruleId,
        sectionTitle: entry.sectionTitle,
        text: entry.text,
        score
      });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Ties: sort by ruleId numerically ascending
    return parseFloat(a.ruleId) - parseFloat(b.ruleId);
  });

  return scored.slice(0, max);
}
