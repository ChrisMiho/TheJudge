import type { AskAiRequest, BattlefieldContextItem, ContextTarget, PromptContext, PromptContextStackItem, PromptContextStackTarget } from "./types.js";
import { normalizeCardText, normalizeQuestion, normalizeWhitespace } from "./promptNormalization.js";

const fallbackQuestion = "Resolve the stack";

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

export function buildPromptContext(payload: AskAiRequest): PromptContext {
  const normalizedQuestion = normalizeQuestion(payload.question);
  const normalizedGameContext = {
    playerCount: payload.gameContext.playerCount,
    players: payload.gameContext.players.map((player) => ({
      label: player.label,
      lifeTotal: normalizeLifeTotal(player.lifeTotal)
    }))
  };

  const stackZoneCards = payload.gameContext.zones?.stack ?? [];
  const battlefieldZoneCards = payload.gameContext.zones?.battlefield ?? [];

  const normalizedBattlefieldContext: BattlefieldContextItem[] = battlefieldZoneCards
    .map((card) => ({
      name: normalizeWhitespace(card.name),
      details: normalizeOptionalText(card.contextNotes) || undefined,
      targets: normalizeTargets(card.targets)
    }))
    .filter((item) => item.name.length > 0);

  return {
    finalQuestion: normalizedQuestion.length > 0 ? normalizedQuestion : fallbackQuestion,
    gameContext: normalizedGameContext,
    battlefieldContext: normalizedBattlefieldContext,
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
