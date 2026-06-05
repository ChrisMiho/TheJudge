import {
  collectCardsForRulings,
  resolveRulingsForPrompt,
  type RulingEntry
} from "../cardRulings.js";
import { buildPromptContext } from "./context.js";
import {
  MAX_RULING_COMMENT_CHARS,
  MAX_RULINGS_PER_CARD,
  MAX_RULINGS_SECTION_CHARS,
  buildPromptText,
  getPromptDiagnostics,
  type PromptDiagnostics
} from "./normalization.js";
import type { AskAiRequest, PromptContext } from "../types/index.js";

export type PreparedPromptInput = {
  context: PromptContext;
  promptText: string;
  diagnostics: PromptDiagnostics;
};

export type PreparePromptInputOptions = {
  cardRulingsIndex?: Map<string, RulingEntry[]>;
};

export function preparePromptInput(request: AskAiRequest, options: PreparePromptInputOptions = {}): PreparedPromptInput {
  const context = buildPromptContext(request);
  const cardsForRulings = collectCardsForRulings(context);
  const resolvedRulings = resolveRulingsForPrompt(cardsForRulings, options.cardRulingsIndex ?? new Map(), {
    maxRulingsPerCard: MAX_RULINGS_PER_CARD,
    maxCommentChars: MAX_RULING_COMMENT_CHARS,
    maxSectionChars: MAX_RULINGS_SECTION_CHARS
  });
  const promptText = buildPromptText(context, { rulings: resolvedRulings });
  const diagnostics = getPromptDiagnostics(promptText, resolvedRulings);
  return {
    context,
    promptText,
    diagnostics
  };
}
