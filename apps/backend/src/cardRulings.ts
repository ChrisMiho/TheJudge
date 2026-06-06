import { existsSync, readFileSync } from "node:fs";
import type { PromptContext, ZoneId } from "./types/index.js";

export type RulingEntry = {
  publishedAt: string;
  comment: string;
};

export type PromptRulingCard = {
  cardId: string;
  name: string;
};

export type ResolvedRulingCard = PromptRulingCard & {
  rulings: RulingEntry[];
};

export type ResolvedRulings = {
  cards: ResolvedRulingCard[];
  sectionChars: number;
};

export type RulingsDebug = {
  cardsConsidered: Array<{ cardId: string; name: string }>;
  cardsIncluded: Array<{ cardId: string; name: string; rulingCount: number }>;
  cardsSkippedNoMatch: Array<{ cardId: string; name: string }>;
  sectionTruncated: boolean;
};

export type ResolvedRulingsWithDebug = ResolvedRulings & { debug: RulingsDebug };

export type RulingLimits = {
  maxRulingsPerCard: number;
  maxCommentChars: number;
  maxSectionChars: number;
};

const NON_STACK_CANONICAL_ZONE_ORDER: Array<Exclude<ZoneId, "stack">> = [
  "battlefield",
  "hand",
  "graveyard",
  "exile",
  "library",
  "command"
];
const warnedLoadFailures = new Set<string>();

function truncateWithSuffix(value: string, maxChars: number): string {
  const suffix = " ...(truncated)";
  if (value.length <= maxChars) {
    return value;
  }

  if (maxChars <= 0) {
    return "";
  }

  if (maxChars <= suffix.length) {
    return suffix.slice(0, maxChars);
  }

  const maxWithoutSuffix = Math.max(0, maxChars - suffix.length);
  return `${value.slice(0, maxWithoutSuffix)}${suffix}`;
}

function isRulingEntry(value: unknown): value is RulingEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RulingEntry>;
  return typeof candidate.publishedAt === "string" && typeof candidate.comment === "string";
}

function normalizeRulingsIndex(value: unknown): Map<string, RulingEntry[]> {
  const index = new Map<string, RulingEntry[]>();
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return index;
  }

  for (const [oracleId, rulings] of Object.entries(value)) {
    if (!Array.isArray(rulings)) {
      continue;
    }

    const validRulings = rulings.filter(isRulingEntry);
    if (oracleId.trim().length > 0 && validRulings.length > 0) {
      index.set(oracleId, validRulings);
    }
  }

  return index;
}

export function loadCardRulingsIndex(filePath: string): Map<string, RulingEntry[]> {
  if (!existsSync(filePath)) {
    warnLoadFailureOnce(filePath, `Card rulings file missing; official rulings prompt section disabled: ${filePath}`);
    return new Map();
  }

  try {
    return normalizeRulingsIndex(JSON.parse(readFileSync(filePath, "utf8")));
  } catch (error) {
    warnLoadFailureOnce(filePath, `Card rulings file could not be parsed; official rulings prompt section disabled: ${filePath}`, error);
    return new Map();
  }
}

function warnLoadFailureOnce(filePath: string, message: string, error?: unknown): void {
  if (warnedLoadFailures.has(filePath)) {
    return;
  }

  warnedLoadFailures.add(filePath);
  if (error) {
    console.warn(message, error);
    return;
  }

  console.warn(message);
}

export function collectCardsForRulings(context: PromptContext): PromptRulingCard[] {
  const cards: PromptRulingCard[] = [];
  const seenCardIds = new Set<string>();

  const addCard = (cardId: string, name: string) => {
    if (cardId.length === 0 || seenCardIds.has(cardId)) {
      return;
    }

    seenCardIds.add(cardId);
    cards.push({ cardId, name });
  };

  for (const item of context.orderedStack) {
    addCard(item.cardId, item.name);
  }

  for (const zoneId of NON_STACK_CANONICAL_ZONE_ORDER) {
    const zone = context.populatedZones.find((candidate) => candidate.zoneId === zoneId);
    if (!zone) {
      continue;
    }

    for (const item of zone.items) {
      addCard(item.cardId, item.name);
    }
  }

  return cards;
}

export function resolveRulingsForPrompt(
  cards: PromptRulingCard[],
  index: Map<string, RulingEntry[]>,
  limits: RulingLimits
): ResolvedRulings {
  const resolvedCards: ResolvedRulingCard[] = [];
  let sectionChars = 0;

  for (const card of cards) {
    const sourceRulings = index.get(card.cardId);
    if (!sourceRulings || sourceRulings.length === 0) {
      continue;
    }

    const rulings = sourceRulings.slice(0, limits.maxRulingsPerCard).map((ruling) => ({
      publishedAt: ruling.publishedAt,
      comment: truncateWithSuffix(ruling.comment, limits.maxCommentChars)
    }));
    const candidate = { ...card, rulings };
    const candidateChars = [card.name, ...rulings.map((ruling) => `- ${ruling.publishedAt}: ${ruling.comment}`)].join("\n").length;

    if (sectionChars + candidateChars > limits.maxSectionChars) {
      const remainingChars = limits.maxSectionChars - sectionChars;
      if (remainingChars > card.name.length + 1) {
        const firstRuling = rulings[0];
        if (firstRuling) {
          const prefix = `- ${firstRuling.publishedAt}: `;
          const maxCommentChars = Math.max(0, remainingChars - card.name.length - 1 - prefix.length);
          resolvedCards.push({
            ...card,
            rulings: [{ ...firstRuling, comment: truncateWithSuffix(firstRuling.comment, maxCommentChars) }]
          });
          sectionChars = limits.maxSectionChars;
        }
      }
      break;
    }

    resolvedCards.push(candidate);
    sectionChars += candidateChars;
  }

  return { cards: resolvedCards, sectionChars };
}

export function resolveRulingsForPromptWithDebug(
  cards: PromptRulingCard[],
  index: Map<string, RulingEntry[]>,
  limits: RulingLimits
): ResolvedRulingsWithDebug {
  const resolvedCards: ResolvedRulingCard[] = [];
  let sectionChars = 0;
  let sectionTruncated = false;

  const cardsConsidered: Array<{ cardId: string; name: string }> = [];
  const cardsIncluded: Array<{ cardId: string; name: string; rulingCount: number }> = [];
  const cardsSkippedNoMatch: Array<{ cardId: string; name: string }> = [];

  for (const card of cards) {
    cardsConsidered.push({ cardId: card.cardId, name: card.name });

    const sourceRulings = index.get(card.cardId);
    if (!sourceRulings || sourceRulings.length === 0) {
      cardsSkippedNoMatch.push({ cardId: card.cardId, name: card.name });
      continue;
    }

    const rulings = sourceRulings.slice(0, limits.maxRulingsPerCard).map((ruling) => ({
      publishedAt: ruling.publishedAt,
      comment: truncateWithSuffix(ruling.comment, limits.maxCommentChars)
    }));
    const candidate = { ...card, rulings };
    const candidateChars = [card.name, ...rulings.map((ruling) => `- ${ruling.publishedAt}: ${ruling.comment}`)].join("\n").length;

    if (sectionChars + candidateChars > limits.maxSectionChars) {
      const remainingChars = limits.maxSectionChars - sectionChars;
      if (remainingChars > card.name.length + 1) {
        const firstRuling = rulings[0];
        if (firstRuling) {
          const prefix = `- ${firstRuling.publishedAt}: `;
          const maxCommentChars = Math.max(0, remainingChars - card.name.length - 1 - prefix.length);
          resolvedCards.push({
            ...card,
            rulings: [{ ...firstRuling, comment: truncateWithSuffix(firstRuling.comment, maxCommentChars) }]
          });
          cardsIncluded.push({ cardId: card.cardId, name: card.name, rulingCount: 1 });
          sectionChars = limits.maxSectionChars;
        }
      }
      sectionTruncated = true;
      break;
    }

    resolvedCards.push(candidate);
    cardsIncluded.push({ cardId: card.cardId, name: card.name, rulingCount: rulings.length });
    sectionChars += candidateChars;
  }

  return {
    cards: resolvedCards,
    sectionChars,
    debug: { cardsConsidered, cardsIncluded, cardsSkippedNoMatch, sectionTruncated }
  };
}
