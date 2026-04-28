import type { AskAiRequest, PromptContext, PromptContextStackItem } from "./types.js";
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

function normalizeStackTarget(
  target: AskAiRequest["stack"][number]["targets"][number]
): AskAiRequest["stack"][number]["targets"][number] | null {
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

  if (target.kind === "battlefield") {
    const targetPermanent = normalizeWhitespace(target.targetPermanent);
    if (targetPermanent.length === 0) {
      return null;
    }

    return {
      kind: "battlefield",
      targetPermanent
    };
  }

  const targetCardId = normalizeWhitespace(target.targetCardId);
  const targetCardName = normalizeWhitespace(target.targetCardName);

  if (targetCardId.length === 0 || targetCardName.length === 0) {
    return null;
  }

  return {
    kind: "stack",
    targetCardId,
    targetCardName
  };
}

function normalizeTargets(
  targets: AskAiRequest["stack"][number]["targets"] | undefined
): AskAiRequest["stack"][number]["targets"] {
  const normalized = (targets ?? [])
    .map((target) => normalizeStackTarget(target))
    .filter((target): target is AskAiRequest["stack"][number]["targets"][number] => target !== null);

  return normalized;
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
  const normalizedBattlefieldContext = payload.battlefieldContext
    .map((item) => ({
      name: normalizeWhitespace(item.name),
      details: normalizeOptionalText(item.details) || undefined,
      targets: normalizeTargets(item.targets)
    }))
    .filter((item) => item.name.length > 0);

  return {
    finalQuestion: normalizedQuestion.length > 0 ? normalizedQuestion : fallbackQuestion,
    gameContext: normalizedGameContext,
    battlefieldContext: normalizedBattlefieldContext,
    orderedStack: payload.stack.map((card, stackIndex, stack) => ({
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
      caster: card.caster,
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
