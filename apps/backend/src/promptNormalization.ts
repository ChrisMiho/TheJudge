import type { PromptContext } from "./types.js";

export const MAX_ORACLE_TEXT_CHARS = 480;
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

export function buildPromptText(context: PromptContext): string {
  const cardsSection = context.orderedStack
    .map(
      (card, index) =>
        `Card ${index + 1} (${card.stackRole})\ncardId: ${card.cardId}\nname: ${card.name}\noracleText: ${card.oracleText}`
    )
    .join("\n\n");

  return [
    "INSTRUCTIONS",
    "- Explain reasoning clearly and concisely.",
    "- State uncertainty when context is incomplete.",
    "- Do not invent hidden state, targets, or board conditions.",
    "",
    "QUESTION",
    context.finalQuestion,
    "",
    "ORDERED STACK (BOTTOM TO TOP)",
    cardsSection
  ].join("\n");
}
