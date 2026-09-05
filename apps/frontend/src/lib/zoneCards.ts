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

/** REQ-176: the descriptive block (oracle text, mana cost/value, type line,
 * sub/supertypes) is resolved server-side by cardId now — this no longer
 * copies it onto the zone card. `colors` is kept: it is not sent to ask-ai
 * (`buildAskAiRequest` strips it from the wire card), but it is not
 * card-intrinsic prompt data either — it is local rendering state the
 * identity ring reads directly off `ZoneCardItem` (REQ-058, DEC-078), the
 * same way `CardMetadataItem` keeps `colors` up front for its own tile ring. */
export function buildZoneCardFromMetadata(card: CardMetadataItem, scanImageUrl?: string): ZoneCardItem {
  return {
    instanceId: createInstanceId(),
    cardId: card.cardId,
    name: card.name,
    imageUrl: scanImageUrl ?? card.imageUrl,
    colors: card.colors
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
