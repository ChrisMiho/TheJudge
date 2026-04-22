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

export function buildPromptContext(payload: AskAiRequest): PromptContext {
  const normalizedQuestion = normalizeQuestion(payload.question);

  return {
    finalQuestion: normalizedQuestion.length > 0 ? normalizedQuestion : fallbackQuestion,
    orderedStack: payload.stack.map((card, stackIndex, stack) => ({
      cardId: normalizeWhitespace(card.cardId),
      name: normalizeWhitespace(card.name),
      oracleText: normalizeCardText(card.oracleText),
      imageUrl: normalizeWhitespace(card.imageUrl),
      stackIndex,
      stackRole: toStackRole(stackIndex, stack.length)
    }))
  };
}
