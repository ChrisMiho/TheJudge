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
  MAX_CONVERSATION_HISTORY_CHARS,
  MAX_RULING_COMMENT_CHARS,
  MAX_RULINGS_PER_CARD,
  MAX_RULINGS_SECTION_CHARS,
  buildPromptText,
  formatSupplementalRulesSection,
  getPromptDiagnostics,
  truncateConversationHistory,
  type PromptDiagnostics
} from "./normalization.js";
import type { AskAiRequest, ConversationTurn, PromptContext } from "../types/index.js";

export type PreparedPromptInput = {
  context: PromptContext;
  promptText: string;
  diagnostics: PromptDiagnostics;
  enrichmentDebug?: EnrichmentDebug;
  conversationHistory?: ConversationTurn[];
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
  const conversationHistory = request.conversationHistory;
  const truncatedHistory = truncateConversationHistory(conversationHistory ?? [], MAX_CONVERSATION_HISTORY_CHARS);
  const conversationHistoryChars = truncatedHistory.reduce((sum, t) => sum + t.content.length, 0);

  if (options.collectEnrichmentDebug) {
    const rulingsResult = resolveRulingsForPromptWithDebug(cardsForRulings, options.cardRulingsIndex ?? new Map(), limits);
    const supplementalResult = retrieveSupplementalRulesWithDebug(context, options.gameRulesRuleIndex ?? [], curatedRuleIds);
    const supplementalRulesSection = formatSupplementalRulesSection(supplementalResult.selected);
    const promptText = buildPromptText(context, {
      rulings: rulingsResult,
      gameRulesTopics,
      supplementalRules: supplementalResult.selected,
      conversationHistory
    });
    const diagnostics = getPromptDiagnostics(promptText, {
      resolvedRulings: rulingsResult,
      gameRulesTopics,
      gameRulesSectionChars: gameRulesSection.length,
      supplementalRules: supplementalResult.selected,
      supplementalRulesSectionChars: supplementalRulesSection.length,
      conversationHistoryChars
    });
    const enrichmentDebug: EnrichmentDebug = {
      supplemental: supplementalResult.debug,
      curatedGameRules: {
        topicIds: gameRulesTopics.map((t) => t.id),
        topics: gameRulesTopics.map((t) => ({ id: t.id, title: t.title, ruleNumbers: t.ruleNumbers }))
      },
      rulings: rulingsResult.debug
    };
    return { context, promptText, diagnostics, enrichmentDebug, conversationHistory };
  }

  const resolvedRulings = resolveRulingsForPrompt(cardsForRulings, options.cardRulingsIndex ?? new Map(), limits);
  const supplementalRules = retrieveSupplementalRules(context, options.gameRulesRuleIndex ?? [], curatedRuleIds);
  const supplementalRulesSection = formatSupplementalRulesSection(supplementalRules);
  const promptText = buildPromptText(context, { rulings: resolvedRulings, gameRulesTopics, supplementalRules, conversationHistory });
  const diagnostics = getPromptDiagnostics(promptText, {
    resolvedRulings,
    gameRulesTopics,
    gameRulesSectionChars: gameRulesSection.length,
    supplementalRules,
    supplementalRulesSectionChars: supplementalRulesSection.length,
    conversationHistoryChars
  });
  return { context, promptText, diagnostics, conversationHistory };
}
