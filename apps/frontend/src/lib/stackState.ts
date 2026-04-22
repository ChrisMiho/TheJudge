import type { AskAiRequest, CardMetadataItem, PlayerLabel, StackItem, StackTarget } from "../types";

export const MAX_STACK_SIZE = 10;
export const DEFAULT_QUESTION = "Resolve the stack";
export const DUPLICATE_CARD_MESSAGE = "Duplicate cards are not supported in MVP1.";
export const STACK_LIMIT_MESSAGE = "MVP stack limit reached (10 cards).";
export const DEFAULT_CASTER: PlayerLabel = "Player 1";

type StackEntryContextInput = {
  caster?: PlayerLabel;
  targets?: StackTarget[];
  contextNotes?: string;
};

type StackAddValidationResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

export function getFinalQuestion(question: string): string {
  const trimmed = question.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_QUESTION;
}

export function buildAskAiRequest(question: string, stack: StackItem[]): AskAiRequest {
  return {
    question: getFinalQuestion(question),
    stack
  };
}

export function buildStackItemFromMetadata(
  card: CardMetadataItem,
  context: StackEntryContextInput = {}
): StackItem {
  const trimmedContextNotes = context.contextNotes?.trim() ?? "";

  return {
    ...card,
    caster: context.caster ?? DEFAULT_CASTER,
    targets: context.targets ?? [],
    contextNotes: trimmedContextNotes.length > 0 ? trimmedContextNotes : undefined
  };
}

export function validateStackAdd(stack: StackItem[], nextCard: StackItem): StackAddValidationResult {
  if (stack.some((item) => item.cardId === nextCard.cardId)) {
    return { ok: false, message: DUPLICATE_CARD_MESSAGE };
  }

  if (stack.length >= MAX_STACK_SIZE) {
    return { ok: false, message: STACK_LIMIT_MESSAGE };
  }

  return { ok: true };
}

export function appendToStack(stack: StackItem[], nextCard: StackItem): StackItem[] {
  return [...stack, nextCard];
}

export function removeFromStackById(stack: StackItem[], cardId: string): StackItem[] {
  return stack.filter((item) => item.cardId !== cardId);
}
