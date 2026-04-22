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

function normalizeOptionalNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

export function buildPromptContext(payload: AskAiRequest): PromptContext {
  const normalizedQuestion = normalizeQuestion(payload.question);

  return {
    finalQuestion: normalizedQuestion.length > 0 ? normalizedQuestion : fallbackQuestion,
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
      stackIndex,
      stackRole: toStackRole(stackIndex, stack.length)
    }))
  };
}
