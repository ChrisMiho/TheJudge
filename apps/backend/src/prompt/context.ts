import type { AskAiRequest, ContextTarget, PromptContext, PromptContextStackItem, PromptContextStackTarget, PromptContextZoneItem, ZoneId } from "../types/index.js";
import { normalizeCardText, normalizeQuestion, normalizeWhitespace } from "./normalization.js";

const DEFAULT_STACK_QUESTION = "Resolve the stack";
const DEFAULT_BOARD_QUESTION = "Explain the interaction with the provided game state";

const NON_STACK_CANONICAL_ZONE_ORDER: Array<Exclude<ZoneId, "stack">> = [
  "battlefield",
  "hand",
  "graveyard",
  "exile",
  "library",
  "command"
];

function toStackRole(stackIndex: number, stackLength: number): PromptContextStackItem["stackRole"] {
  if (stackIndex === stackLength - 1) {
    return "top";
  }

  if (stackIndex === 0) {
    return "bottom";
  }

  return "middle";
}

function normalizeTagList(values: string[]): string[] {
  return [...new Set(values.map((value) => normalizeWhitespace(value)).filter((value) => value.length > 0))];
}

function normalizeOptionalText(value: string | undefined): string {
  return normalizeWhitespace(value ?? "");
}

function normalizeOptionalList(values: string[] | undefined): string[] {
  return normalizeTagList(values ?? []);
}

function normalizeContextTarget(target: ContextTarget): PromptContextStackTarget | null {
  if (target.kind === "none") {
    return { kind: "none" };
  }

  if (target.kind === "other") {
    const targetDescription = normalizeWhitespace(target.targetDescription);
    if (targetDescription.length === 0) {
      return null;
    }
    return { kind: "other", targetDescription };
  }

  if (target.kind === "player") {
    return { kind: "player", targetPlayer: target.targetPlayer };
  }

  // kind === "card": map to internal stack or battlefield target based on zone
  const cardName = normalizeWhitespace(target.cardName);
  const cardId = normalizeWhitespace(target.cardId);

  if (cardName.length === 0 || cardId.length === 0) {
    return null;
  }

  if (target.zone === "battlefield") {
    return { kind: "battlefield", targetPermanent: cardName };
  }

  return { kind: "stack", targetCardId: cardId, targetCardName: cardName };
}

function normalizeTargets(targets: ContextTarget[] | undefined): PromptContextStackTarget[] {
  return (targets ?? [])
    .map((target) => normalizeContextTarget(target))
    .filter((target): target is PromptContextStackTarget => target !== null);
}

function normalizeOptionalNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function normalizeLifeTotal(value: number): number {
  return Number.isFinite(value) ? Math.trunc(value) : 20;
}

function normalizeZoneItem(card: import("../types/index.js").ZoneCardItem): PromptContextZoneItem | null {
  const name = normalizeWhitespace(card.name);
  if (name.length === 0) return null;
  const owner = card.owner;
  return {
    name,
    owner: owner && normalizeWhitespace(owner).length > 0 ? owner : undefined,
    details: normalizeOptionalText(card.contextNotes) || undefined,
    targets: normalizeTargets(card.targets)
  };
}

function resolveFallbackQuestion(zones: AskAiRequest["gameContext"]["zones"] | undefined): string {
  if ((zones?.stack?.length ?? 0) > 0) {
    return DEFAULT_STACK_QUESTION;
  }

  const hasNonStackCards = NON_STACK_CANONICAL_ZONE_ORDER.some(
    (zoneId) => (zones?.[zoneId]?.length ?? 0) > 0
  );

  return hasNonStackCards ? DEFAULT_BOARD_QUESTION : DEFAULT_STACK_QUESTION;
}

export function buildPromptContext(payload: AskAiRequest): PromptContext {
  const normalizedQuestion = normalizeQuestion(payload.question);
  const gameCtx = payload.gameContext;

  const normalizedGameContext = {
    playerCount: gameCtx.playerCount,
    players: gameCtx.players.map((player) => ({
      label: player.label,
      lifeTotal: normalizeLifeTotal(player.lifeTotal),
      displayName: normalizeOptionalText(player.displayName) || undefined
    })),
    turnPhase: gameCtx.turnPhase,
    activePlayer: gameCtx.activePlayer,
    selectedZones: gameCtx.selectedZones
  };

  const stackZoneCards = gameCtx.zones?.stack ?? [];

  const zonesMap = (gameCtx.zones ?? {}) as Record<string, import("../types/index.js").ZoneCardItem[] | undefined>;

  const populatedZones = NON_STACK_CANONICAL_ZONE_ORDER
    .map((zoneId) => {
      const cards = zonesMap[zoneId] ?? [];
      const items = cards
        .map((card) => normalizeZoneItem(card))
        .filter((item): item is PromptContextZoneItem => item !== null);
      if (items.length === 0) return null;
      return { zoneId, items };
    })
    .filter((z): z is NonNullable<typeof z> => z !== null);

  return {
    finalQuestion:
      normalizedQuestion.length > 0 ? normalizedQuestion : resolveFallbackQuestion(gameCtx.zones),
    gameContext: normalizedGameContext,
    populatedZones,
    orderedStack: stackZoneCards.map((card, stackIndex, stack) => ({
      cardId: normalizeWhitespace(card.cardId),
      name: normalizeWhitespace(card.name),
      oracleText: normalizeCardText(card.oracleText),
      imageUrl: normalizeOptionalText(card.imageUrl),
      manaCost: normalizeOptionalText(card.manaCost),
      manaValue: normalizeOptionalNumber(card.manaValue),
      typeLine: normalizeOptionalText(card.typeLine),
      colors: normalizeOptionalList(card.colors),
      supertypes: normalizeOptionalList(card.supertypes),
      subtypes: normalizeOptionalList(card.subtypes),
      caster: card.caster ?? "Player 1",
      targets: normalizeTargets(card.targets),
      contextNotes: normalizeOptionalText(card.contextNotes) || undefined,
      manaSpent:
        typeof card.manaSpent === "number" && Number.isFinite(card.manaSpent) && card.manaSpent >= 0
          ? card.manaSpent
          : normalizeOptionalNumber(card.manaValue),
      stackIndex,
      stackRole: toStackRole(stackIndex, stack.length)
    }))
  };
}
