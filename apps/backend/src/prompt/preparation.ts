import { buildPromptContext } from "./context.js";
import {
  MAX_RULING_COMMENT_CHARS,
  MAX_RULINGS_PER_CARD,
  buildPromptText,
  getPromptDiagnostics,
  type PromptDiagnostics
} from "./normalization.js";
import { collectCardsForRulings, resolveRulingsForPrompt, type RulingEntry } from "../cardRulings.js";
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
  const rulings = resolveRulingsForPrompt(collectCardsForRulings(context), options.cardRulingsIndex ?? new Map(), {
    maxRulingsPerCard: MAX_RULINGS_PER_CARD,
    maxCommentChars: MAX_RULING_COMMENT_CHARS
  });
  const promptText = buildPromptText(context, { rulings });
  const diagnostics = getPromptDiagnostics(promptText);
  return {
    context,
    promptText,
    diagnostics
  };
}
