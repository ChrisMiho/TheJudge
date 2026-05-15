import type {
  AskAiRequest,
  BattlefieldContextItem,
  CardMetadataItem,
  GameContext,
  PlayerLabel,
  StackItem,
  StackTarget
} from "../types";

export const MAX_STACK_SIZE = 10;
export const DEFAULT_QUESTION = "Resolve the stack";
export const DUPLICATE_CARD_MESSAGE = "Duplicate cards are not supported in MVP1.";
export const STACK_LIMIT_MESSAGE = "MVP stack limit reached (10 cards).";
export const DEFAULT_CASTER: PlayerLabel = "Player 1";

type StackEntryContextInput = {
  caster?: PlayerLabel;
  targets?: StackTarget[];
  contextNotes?: string;
  manaSpent?: number;
};

type StackAddValidationResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

type TargetIntegrityRefs = {
  stackNameById: Map<string, string>;
  battlefieldNameByNormalizedName: Map<string, string>;
};

function normalizeReferenceName(value: string): string {
  return value.trim().toLowerCase();
}

function buildTargetIntegrityRefs(
  battlefieldContext: BattlefieldContextItem[],
  stack: StackItem[]
): TargetIntegrityRefs {
  const stackNameById = new Map<string, string>();
  for (const stackItem of stack) {
    stackNameById.set(stackItem.cardId, stackItem.name);
  }

  const battlefieldNameByNormalizedName = new Map<string, string>();
  for (const battlefieldItem of battlefieldContext) {
    const normalizedName = normalizeReferenceName(battlefieldItem.name);
    if (!battlefieldNameByNormalizedName.has(normalizedName)) {
      battlefieldNameByNormalizedName.set(normalizedName, battlefieldItem.name);
    }
  }

  return {
    stackNameById,
    battlefieldNameByNormalizedName
  };
}

function sanitizeTargets(targets: StackTarget[], refs: TargetIntegrityRefs): StackTarget[] {
  const sanitizedTargets: StackTarget[] = [];

  for (const target of targets) {
    if (target.kind === "stack") {
      const canonicalCardName = refs.stackNameById.get(target.targetCardId);
      if (!canonicalCardName) {
        continue;
      }
      sanitizedTargets.push({
        kind: "stack",
        targetCardId: target.targetCardId,
        targetCardName: canonicalCardName
      });
      continue;
    }

    if (target.kind === "battlefield") {
      const canonicalPermanentName = refs.battlefieldNameByNormalizedName.get(
        normalizeReferenceName(target.targetPermanent)
      );
      if (!canonicalPermanentName) {
        continue;
      }
      sanitizedTargets.push({
        kind: "battlefield",
        targetPermanent: canonicalPermanentName
      });
      continue;
    }

    sanitizedTargets.push(target);
  }

  return sanitizedTargets;
}

export function getFinalQuestion(question: string): string {
  const trimmed = question.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_QUESTION;
}

export function buildAskAiRequest(
  question: string,
  gameContext: GameContext,
  battlefieldContext: BattlefieldContextItem[],
  stack: StackItem[]
): AskAiRequest {
  const targetRefs = buildTargetIntegrityRefs(battlefieldContext, stack);
  const sanitizedBattlefieldContext = battlefieldContext.map((item) => ({
    ...item,
    targets: sanitizeTargets(item.targets, targetRefs)
  }));
  const sanitizedStack = stack.map((item) => ({
    ...item,
    targets: sanitizeTargets(item.targets, targetRefs)
  }));

  return {
    question: getFinalQuestion(question),
    gameContext,
    battlefieldContext: sanitizedBattlefieldContext,
    stack: sanitizedStack
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
    contextNotes: trimmedContextNotes.length > 0 ? trimmedContextNotes : undefined,
    manaSpent: typeof context.manaSpent === "number" && Number.isFinite(context.manaSpent) ? context.manaSpent : undefined
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
