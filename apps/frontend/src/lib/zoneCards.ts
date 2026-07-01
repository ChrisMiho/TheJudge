import type { CardMetadataItem, ZoneCardItem, ZoneId } from "../types";
import { DUPLICATE_CARD_MESSAGE, MAX_STACK_SIZE, STACK_LIMIT_MESSAGE } from "./stackLimits";
import { createCorrelationId } from "./debugLogger";

export type ZoneCardAddValidationResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

export function buildZoneCardFromMetadata(card: CardMetadataItem, scanImageUrl?: string): ZoneCardItem {
  return {
    instanceId: createCorrelationId(),
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

export function zoneCardToMetadata(card: ZoneCardItem): CardMetadataItem {
  return {
    cardId: card.cardId,
    name: card.name,
    oracleText: card.oracleText,
    imageUrl: card.imageUrl ?? "",
    manaCost: card.manaCost ?? "",
    manaValue: card.manaValue ?? 0,
    typeLine: card.typeLine ?? "",
    colors: card.colors ?? [],
    supertypes: card.supertypes ?? [],
    subtypes: card.subtypes ?? []
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
