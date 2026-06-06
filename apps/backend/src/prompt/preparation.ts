import {
  collectCardsForRulings,
  resolveRulingsForPrompt,
  type RulingEntry
} from "../cardRulings.js";
import { formatGameRulesSection, type GameRulesTopic } from "../gameRules.js";
import {
  collectCuratedRuleIds,
  retrieveSupplementalRules,
  type GameRulesRuleIndexEntry
} from "../gameRulesRetrieval.js";
import { buildPromptContext } from "./context.js";
import {
  MAX_RULING_COMMENT_CHARS,
  MAX_RULINGS_PER_CARD,
  MAX_RULINGS_SECTION_CHARS,
  buildPromptText,
  formatSupplementalRulesSection,
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
  gameRulesTopics?: GameRulesTopic[];
  gameRulesRuleIndex?: GameRulesRuleIndexEntry[];
};

export function preparePromptInput(request: AskAiRequest, options: PreparePromptInputOptions = {}): PreparedPromptInput {
  const context = buildPromptContext(request);
  const cardsForRulings = collectCardsForRulings(context);
  const resolvedRulings = resolveRulingsForPrompt(cardsForRulings, options.cardRulingsIndex ?? new Map(), {
    maxRulingsPerCard: MAX_RULINGS_PER_CARD,
    maxCommentChars: MAX_RULING_COMMENT_CHARS,
    maxSectionChars: MAX_RULINGS_SECTION_CHARS
  });
  const gameRulesTopics = options.gameRulesTopics ?? [];
  const gameRulesSection = formatGameRulesSection(gameRulesTopics);
  const curatedRuleIds = collectCuratedRuleIds(gameRulesTopics);
  const supplementalRules = retrieveSupplementalRules(context, options.gameRulesRuleIndex ?? [], curatedRuleIds);
  const supplementalRulesSection = formatSupplementalRulesSection(supplementalRules);
  const promptText = buildPromptText(context, { rulings: resolvedRulings, gameRulesTopics, supplementalRules });
  const diagnostics = getPromptDiagnostics(promptText, {
    resolvedRulings,
    gameRulesTopics,
    gameRulesSectionChars: gameRulesSection.length,
    supplementalRules,
    supplementalRulesSectionChars: supplementalRulesSection.length
  });
  return {
    context,
    promptText,
    diagnostics
  };
}
