import { existsSync, readFileSync } from "node:fs";
import type { PromptContext } from "./types/index.js";
import { truncateOracleText } from "./prompt/normalization.js";

export type RulingEntry = {
  publishedAt: string;
  comment: string;
};

export type CardForRulings = {
  cardId: string;
  name: string;
};

export type ResolvedRulingCard = CardForRulings & {
  rulings: RulingEntry[];
};

export type RulingLimits = {
  maxRulingsPerCard: number;
  maxCommentChars: number;
};

const warnedMissingFiles = new Set<string>();

function isRulingEntry(value: unknown): value is RulingEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as RulingEntry).publishedAt === "string" &&
    typeof (value as RulingEntry).comment === "string"
  );
}

export function loadCardRulingsIndex(filePath: string): Map<string, RulingEntry[]> {
  if (!existsSync(filePath)) {
    if (!warnedMissingFiles.has(filePath)) {
      warnedMissingFiles.add(filePath);
      console.warn(`Card rulings artifact not found: ${filePath}. Official rulings prompt section will be omitted.`);
    }
    return new Map();
  }

  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Unexpected card rulings artifact shape: ${filePath}`);
  }

  const index = new Map<string, RulingEntry[]>();
  for (const [oracleId, entries] of Object.entries(parsed)) {
    if (!Array.isArray(entries) || !entries.every(isRulingEntry)) {
      throw new Error(`Unexpected card rulings entries for oracle id ${oracleId}: ${filePath}`);
    }
    index.set(oracleId, entries);
  }

  return index;
}

export function collectCardsForRulings(context: PromptContext): CardForRulings[] {
  const seen = new Set<string>();
  const cards: CardForRulings[] = [];

  const appendCard = (cardId: string, name: string) => {
    if (cardId.length === 0 || seen.has(cardId)) {
      return;
    }
    seen.add(cardId);
    cards.push({ cardId, name });
  };

  for (const card of context.orderedStack) {
    appendCard(card.cardId, card.name);
  }

  for (const zone of context.populatedZones) {
    for (const item of zone.items) {
      appendCard(item.cardId, item.name);
    }
  }

  return cards;
}

export function resolveRulingsForPrompt(
  cards: CardForRulings[],
  index: Map<string, RulingEntry[]>,
  limits: RulingLimits
): ResolvedRulingCard[] {
  const resolved: ResolvedRulingCard[] = [];

  for (const card of cards) {
    const rulings = index.get(card.cardId);
    if (!rulings || rulings.length === 0) {
      continue;
    }

    const cappedRulings = rulings.slice(0, limits.maxRulingsPerCard).map((ruling) => ({
      publishedAt: ruling.publishedAt,
      comment: truncateOracleText(ruling.comment, limits.maxCommentChars)
    }));

    if (cappedRulings.length > 0) {
      resolved.push({ ...card, rulings: cappedRulings });
    }
  }

  return resolved;
}
