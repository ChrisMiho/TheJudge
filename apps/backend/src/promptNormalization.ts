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

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "(none)";
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
          `oracleText: ${card.oracleText}`
        ].join("\n")
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
