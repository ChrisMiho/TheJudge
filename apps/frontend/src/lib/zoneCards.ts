import type { CardMetadataItem, ZoneCardItem, ZoneId } from "../types";
import { DUPLICATE_CARD_MESSAGE, MAX_STACK_SIZE, STACK_LIMIT_MESSAGE } from "./stackLimits";

// Stable per-card identity used as the React key and removal handle. This is a
// distinct concern from debug correlation ids, so it has its own generator —
// reusing createCorrelationId() coupled instance identity to logging and let a
// mocked-constant correlation id collapse every card onto one key.
export function createInstanceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `inst-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export type ZoneCardAddValidationResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

export function buildZoneCardFromMetadata(card: CardMetadataItem, scanImageUrl?: string): ZoneCardItem {
  return {
    instanceId: createInstanceId(),
    cardId: card.cardId,
    name: card.name,
    oracleText: card.oracleText,
    imageUrl: scanImageUrl ?? card.imageUrl,
    manaCost: card.manaCost,
    manaValue: card.manaValue,
    typeLine: card.typeLine,
    colors: card.colors,
    supertypes: card.supertypes,
    subtypes: card.subtypes
  };
}

export function validateZoneCardAdd(
  existingCards: ZoneCardItem[],
  nextCard: ZoneCardItem,
  zoneId: ZoneId
): ZoneCardAddValidationResult {
  if (zoneId === "stack") {
    if (existingCards.some((item) => item.cardId === nextCard.cardId)) {
      return { ok: false, message: DUPLICATE_CARD_MESSAGE };
    }

    if (existingCards.length >= MAX_STACK_SIZE) {
      return { ok: false, message: STACK_LIMIT_MESSAGE };
    }
  }

  return { ok: true };
}

export function appendZoneCard(cards: ZoneCardItem[], nextCard: ZoneCardItem): ZoneCardItem[] {
  return [...cards, nextCard];
}

export function removeZoneCardByInstanceId(cards: ZoneCardItem[], instanceId: string): ZoneCardItem[] {
  return cards.filter((item) => item.instanceId !== instanceId);
}
