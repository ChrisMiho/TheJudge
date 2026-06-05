import { normalizeWhitespace } from "../prompt/normalization.js";
import type { PromptContext } from "../types/index.js";
import { loadRulesMetadata } from "./rulesMetadata.js";
import type { RetrievedRuleReference, RuleMetadataItem } from "./types.js";

const MAX_RETRIEVED_RULES = 5;
const STOP_WORDS = new Set([
  "and",
  "are",
  "can",
  "card",
  "cards",
  "does",
  "for",
  "from",
  "has",
  "have",
  "how",
  "one",
  "that",
  "the",
  "this",
  "what",
  "when",
  "will",
  "with"
]);

function normalizeSearchText(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}

function tokenize(value: string): string[] {
  return normalizeSearchText(value)
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

function buildQueryText(context: PromptContext): string {
  const stackCards = context.orderedStack
    .map((card) => `${card.name} ${card.typeLine} ${card.oracleText} ${card.contextNotes ?? ""}`)
    .join(" ");
  const zoneCards = context.populatedZones
    .flatMap((zone) => zone.items.map((item) => `${zone.zoneId} ${item.name} ${item.details ?? ""}`))
    .join(" ");

  return [
    context.finalQuestion,
    context.gameContext.turnPhase,
    context.gameContext.selectedZones.join(" "),
    stackCards,
    zoneCards
  ].join(" ");
}

function scoreRule(rule: RuleMetadataItem, queryTokens: string[], exactRuleIds: Set<string>): number {
  let score = 0;
  if (exactRuleIds.has(rule.ruleId)) {
    score += 100;
  }

  for (const parentRuleId of rule.parentRuleIds) {
    if (exactRuleIds.has(parentRuleId)) {
      score += 20;
    }
  }

  for (const token of queryTokens) {
    if (rule.searchText.includes(token)) {
      score += token.includes(".") ? 8 : 1;
    }
  }

  return score;
}

export function retrieveRelevantRules(
  context: PromptContext,
  rules: RuleMetadataItem[] = loadRulesMetadata()
): RetrievedRuleReference[] {
  if (rules.length === 0) {
    return [];
  }

  const queryText = buildQueryText(context);
  const queryTokens = tokenize(queryText);
  const exactRuleIds = new Set(extractRuleIds(queryText));

  return rules
    .map((rule) => ({ rule, score: scoreRule(rule, queryTokens, exactRuleIds) }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      return left.rule.ruleId.localeCompare(right.rule.ruleId, undefined, { numeric: true });
    })
    .slice(0, MAX_RETRIEVED_RULES)
    .map(({ rule, score }) => ({
      ruleId: rule.ruleId,
      sectionTitle: rule.sectionTitle,
      text: rule.text,
      score
    }));
}
