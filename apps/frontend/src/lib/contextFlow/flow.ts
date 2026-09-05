import type {
  CardMetadataItem,
  ConversationMessage,
  GameContext,
  TurnPhase,
  ZoneCardItem,
  ZoneId
} from "../../types";
import type { FlowStepId } from "./steps";
import { CANONICAL_ZONE_ORDER } from "./phaseZoneDefaults";

/** Minimum fields needed by canAdvance for each step. */
export type FlowNavigationState = {
  gameContext: Pick<Partial<GameContext>, "players" | "playerCount" | "selectedZones" | "turnPhase" | "zones">;
};

/**
 * Zone-based payload for the new backend contract (slice 01+).
 * Distinct from the legacy AskAiRequest which carries battlefieldContext + stack.
 */
export type ZoneAskAiPayload = {
  question: string;
  gameContext: GameContext;
  conversationHistory?: ConversationMessage[];
};

/** Identity-only wire shape for an attached lookup card (REQ-176): the
 * descriptive block is resolved server-side by cardId, not sent. */
export type LookupWireCard = Pick<CardMetadataItem, "cardId" | "name" | "imageUrl">;

export type LookupAskAiPayload = {
  mode: "lookup";
  question: string;
  cards?: LookupWireCard[];
  conversationHistory?: ConversationMessage[];
};

/** One card entry in the enrichment queue, with its source zone. */
export type EnrichmentQueueEntry = {
  zone: ZoneId;
  card: ZoneCardItem;
};

export const DEFAULT_STACK_QUESTION = "Resolve the stack";
export const DEFAULT_BOARD_QUESTION = "Explain the interaction with the provided game state";
export const DEFAULT_TURN_PHASE: TurnPhase = "main_1";
export const NON_STACK_ZONES_WITH_OWNER: Exclude<ZoneId, "stack">[] = [
  "battlefield",
  "hand",
  "graveyard",
  "exile",
  "library",
  "command"
];

export function hasAtLeastOneCardInSelectedZones(
  selectedZones: ZoneId[] | undefined,
  zones: Partial<Record<ZoneId, ZoneCardItem[]>> | undefined
): boolean {
  return selectedZones?.some((zoneId) => (zones?.[zoneId]?.length ?? 0) > 0) ?? false;
}

export function resolveFallbackQuestion(
  zones: Partial<Record<ZoneId, ZoneCardItem[]>> | undefined
): string {
  if ((zones?.stack?.length ?? 0) > 0) {
    return DEFAULT_STACK_QUESTION;
  }

  const hasNonStackCards = CANONICAL_ZONE_ORDER.some(
    (zoneId) => zoneId !== "stack" && (zones?.[zoneId]?.length ?? 0) > 0
  );

  return hasNonStackCards ? DEFAULT_BOARD_QUESTION : DEFAULT_STACK_QUESTION;
}

/**
 * Whether the user may advance from a given step.
 */
export function canAdvance(step: FlowStepId, state: FlowNavigationState): boolean {
  switch (step) {
    case "game-context":
      return (
        Array.isArray(state.gameContext.players) &&
        state.gameContext.players.length >= 2 &&
        state.gameContext.turnPhase !== undefined &&
        state.gameContext.players.every((p) => Number.isFinite(p.lifeTotal))
      );
    case "zone-confirm":
      return (
        Array.isArray(state.gameContext.selectedZones) && state.gameContext.selectedZones.length > 0
      );
    case "zone-collection":
      return hasAtLeastOneCardInSelectedZones(state.gameContext.selectedZones, state.gameContext.zones);
    case "enrichment":
      return hasAtLeastOneCardInSelectedZones(state.gameContext.selectedZones, state.gameContext.zones);
  }
}

/**
 * Flatten all zone cards into a single list in canonical zone order.
 * Stable ordering: each zone's cards appear together, zones in CANONICAL_ZONE_ORDER sequence.
 */
export function buildEnrichmentQueue(gameContext: GameContext): EnrichmentQueueEntry[] {
  const zones = gameContext.zones ?? {};
  const queue: EnrichmentQueueEntry[] = [];
  for (const zoneId of CANONICAL_ZONE_ORDER) {
    const cards = zones[zoneId] ?? [];
    for (const card of cards) {
      queue.push({ zone: zoneId, card });
    }
  }
  return queue;
}

/**
 * Build the zone-based API payload from in-memory state.
 * Omits zone keys with empty arrays so the backend schema (min:1 per zone) is satisfied.
 */
export function buildAskAiRequest(question: string, gameContext: GameContext): ZoneAskAiPayload {
  const rawZones = gameContext.zones ?? {};
  const nonEmptyZones: Partial<Record<ZoneId, ZoneCardItem[]>> = {};
  for (const zoneId of CANONICAL_ZONE_ORDER) {
    const cards = rawZones[zoneId];
    if (cards && cards.length > 0) {
      // Strip instanceId (frontend-only; backend schema is .strict()) and colors
      // (REQ-176: local-only rendering state for the identity ring — the backend
      // resolves the descriptive block, colors included, server-side by cardId).
      nonEmptyZones[zoneId] = cards.map((card) => {
        const wireCard = { ...card };
        delete wireCard.instanceId;
        delete wireCard.colors;
        return wireCard;
      });
    }
  }
  return {
    question: question.trim().length > 0 ? question.trim() : resolveFallbackQuestion(nonEmptyZones),
    gameContext: {
      ...gameContext,
      turnPhase: gameContext.turnPhase ?? DEFAULT_TURN_PHASE,
      zones: nonEmptyZones
    }
  };
}

/** REQ-167: the single optional card generalizes to a bounded (max 5) list.
 * REQ-176: the descriptive block is resolved server-side by cardId now — only
 * identity and the image (for rendering) go on the wire. */
export function buildLookupAskAiRequest(
  question: string,
  cards?: Pick<CardMetadataItem, "cardId" | "name" | "imageUrl">[] | null,
  conversationHistory?: ConversationMessage[]
): LookupAskAiPayload {
  const wireCards = (cards ?? []).map((card) => ({
    cardId: card.cardId,
    name: card.name,
    imageUrl: card.imageUrl
  }));

  return {
    mode: "lookup",
    question: question.trim(),
    ...(wireCards.length > 0 ? { cards: wireCards } : {}),
    ...(conversationHistory ? { conversationHistory } : {})
  };
}
