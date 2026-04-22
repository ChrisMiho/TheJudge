import type { PromptContext } from "./types.js";

export const MAX_ORACLE_TEXT_CHARS = 480;
export const MAX_CONTEXT_DETAILS_CHARS = 220;
export const MAX_PROMPT_CHAR_BUDGET = 12000;
const TRUNCATION_SUFFIX = " ...(truncated)";

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function truncateOracleText(value: string, maxChars = MAX_ORACLE_TEXT_CHARS): string {
  if (value.length <= maxChars) {
    return value;
  }

  const maxWithoutSuffix = Math.max(0, maxChars - TRUNCATION_SUFFIX.length);
  return `${value.slice(0, maxWithoutSuffix)}${TRUNCATION_SUFFIX}`;
}

export function normalizeQuestion(value: string): string {
  return normalizeWhitespace(value);
}

export function normalizeCardText(value: string): string {
  return truncateOracleText(normalizeWhitespace(value));
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "(none)";
}

function formatTargets(targets: PromptContext["orderedStack"][number]["targets"]): string {
  if (targets.length === 0) {
    return "(none)";
  }

  return targets
    .map((target) => {
      if (target.kind === "none") {
        return "none:does-not-target";
      }

      if (target.kind === "player") {
        return `player:${target.targetPlayer}`;
      }

      if (target.kind === "battlefield") {
        return `battlefield:${target.targetPermanent}`;
      }

      return `stack:${target.targetCardName} (${target.targetCardId})`;
    })
    .join(" | ");
}

function formatBattlefieldContext(context: PromptContext): string {
  if (context.battlefieldContext.length === 0) {
    return "(none)";
  }

  return context.battlefieldContext
    .map((item, index) =>
      [
        `Battlefield ${index + 1}`,
        `name: ${item.name}`,
        `details: ${item.details ? truncateOracleText(item.details, MAX_CONTEXT_DETAILS_CHARS) : "(none)"}`,
        `targets: ${formatTargets(item.targets)}`
      ].join("\n")
    )
    .join("\n\n");
}

export function estimatePromptChars(prompt: string): number {
  return prompt.length;
}

export function buildPromptText(context: PromptContext): string {
  const cardsSection = context.orderedStack
    .map(
      (card, index) =>
        [
          `Card ${index + 1} (${card.stackRole})`,
          `cardId: ${card.cardId}`,
          `name: ${card.name}`,
          `manaCost: ${card.manaCost || "(none)"}`,
          `manaValue: ${card.manaValue}`,
          `typeLine: ${card.typeLine || "(none)"}`,
          `colors: ${formatList(card.colors)}`,
          `supertypes: ${formatList(card.supertypes)}`,
          `subtypes: ${formatList(card.subtypes)}`,
          `caster: ${card.caster}`,
          `targets: ${formatTargets(card.targets)}`,
          `manaSpent: ${card.manaSpent ?? card.manaValue}`,
          `contextNotes: ${card.contextNotes || "(none)"}`,
          `oracleText: ${card.oracleText}`
        ].join("\n")
    )
    .join("\n\n");

  const prompt = [
    "INSTRUCTIONS",
    "- Explain reasoning clearly and concisely.",
    "- State uncertainty when context is incomplete.",
    "- Do not invent hidden state, targets, or board conditions.",
    "",
    "QUESTION",
    context.finalQuestion,
    "",
    "GAME CONTEXT",
    `playerCount: ${context.gameContext.playerCount}`,
    ...context.gameContext.players.map((player) => `${player.label}: lifeTotal=${player.lifeTotal}`),
    "",
    "BATTLEFIELD CONTEXT",
    formatBattlefieldContext(context),
    "",
    "ORDERED STACK (BOTTOM TO TOP)",
    cardsSection
  ].join("\n");

  return prompt;
}
