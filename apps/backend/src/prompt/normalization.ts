import type { ConversationTurn } from "../types/index.js";

export const EFFECTIVELY_UNLIMITED_CHARS = 1_000_000;
export const MAX_ORACLE_TEXT_CHARS = EFFECTIVELY_UNLIMITED_CHARS / 10;
export const MAX_CONVERSATION_HISTORY_CHARS = EFFECTIVELY_UNLIMITED_CHARS;
export const MAX_CONTEXT_DETAILS_CHARS = EFFECTIVELY_UNLIMITED_CHARS / 10;
export const MAX_CONTEXT_NOTES_CHARS = EFFECTIVELY_UNLIMITED_CHARS / 10;
export const MAX_TARGET_LABEL_CHARS = EFFECTIVELY_UNLIMITED_CHARS / 10;
export const MAX_PROMPT_CHAR_BUDGET = EFFECTIVELY_UNLIMITED_CHARS;
export const MAX_RULINGS_PER_CARD = 100;
export const MAX_RULING_COMMENT_CHARS = EFFECTIVELY_UNLIMITED_CHARS / 10;
export const MAX_RULINGS_SECTION_CHARS = EFFECTIVELY_UNLIMITED_CHARS;
export const PROMPT_BUDGET_NEAR_LIMIT_BUFFER = 10_000;
const TRUNCATION_SUFFIX = " ...(truncated)";

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function truncateOracleText(value: string, maxChars = MAX_ORACLE_TEXT_CHARS): string {
  if (value.length <= maxChars) {
    return value;
  }

  if (maxChars <= 0) {
    return "";
  }

  if (maxChars <= TRUNCATION_SUFFIX.length) {
    return TRUNCATION_SUFFIX.slice(0, maxChars);
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

export function truncateConversationHistory(turns: ConversationTurn[], budget: number): ConversationTurn[] {
  let total = turns.reduce((sum, t) => sum + t.content.length, 0);
  if (total <= budget) return turns;
  const result = [...turns];
  while (result.length > 0 && total > budget) {
    total -= result[0]!.content.length;
    result.shift();
  }
  return result;
}
