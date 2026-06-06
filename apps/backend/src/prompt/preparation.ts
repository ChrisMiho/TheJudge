import {
  collectCardsForRulings,
  resolveRulingsForPrompt,
  resolveRulingsForPromptWithDebug,
  type RulingEntry
} from "../cardRulings.js";
import { formatGameRulesSection, type GameRulesTopic } from "../gameRules.js";
import {
  collectCuratedRuleIds,
  retrieveSupplementalRules,
  retrieveSupplementalRulesWithDebug,
  type GameRulesRuleIndexEntry
} from "../gameRulesRetrieval.js";
import { buildPromptContext } from "./context.js";
import type { EnrichmentDebug } from "./enrichmentDebug.js";
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
  enrichmentDebug?: EnrichmentDebug;
};

export type PreparePromptInputOptions = {
  cardRulingsIndex?: Map<string, RulingEntry[]>;
  gameRulesTopics?: GameRulesTopic[];
  gameRulesRuleIndex?: GameRulesRuleIndexEntry[];
  collectEnrichmentDebug?: boolean;
};

export function preparePromptInput(request: AskAiRequest, options: PreparePromptInputOptions = {}): PreparedPromptInput {
  const context = buildPromptContext(request);
  const cardsForRulings = collectCardsForRulings(context);
  const limits = {
    maxRulingsPerCard: MAX_RULINGS_PER_CARD,
    maxCommentChars: MAX_RULING_COMMENT_CHARS,
    maxSectionChars: MAX_RULINGS_SECTION_CHARS
  };
  const gameRulesTopics = options.gameRulesTopics ?? [];
  const gameRulesSection = formatGameRulesSection(gameRulesTopics);
  const curatedRuleIds = collectCuratedRuleIds(gameRulesTopics);

  if (options.collectEnrichmentDebug) {
    const rulingsResult = resolveRulingsForPromptWithDebug(cardsForRulings, options.cardRulingsIndex ?? new Map(), limits);
    const supplementalResult = retrieveSupplementalRulesWithDebug(context, options.gameRulesRuleIndex ?? [], curatedRuleIds);
    const supplementalRulesSection = formatSupplementalRulesSection(supplementalResult.selected);
    const promptText = buildPromptText(context, {
      rulings: rulingsResult,
      gameRulesTopics,
      supplementalRules: supplementalResult.selected
    });
    const diagnostics = getPromptDiagnostics(promptText, {
      resolvedRulings: rulingsResult,
      gameRulesTopics,
      gameRulesSectionChars: gameRulesSection.length,
      supplementalRules: supplementalResult.selected,
      supplementalRulesSectionChars: supplementalRulesSection.length
    });
    const enrichmentDebug: EnrichmentDebug = {
      supplemental: supplementalResult.debug,
      curatedGameRules: {
        topicIds: gameRulesTopics.map((t) => t.id),
        topics: gameRulesTopics.map((t) => ({ id: t.id, title: t.title, ruleNumbers: t.ruleNumbers }))
      },
      rulings: rulingsResult.debug
    };
    return { context, promptText, diagnostics, enrichmentDebug };
  }

  const resolvedRulings = resolveRulingsForPrompt(cardsForRulings, options.cardRulingsIndex ?? new Map(), limits);
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
  return { context, promptText, diagnostics };
}
