import {
  collectCardsForRulings,
  resolveRulingsForPrompt,
  type RulingEntry
} from "../cardRulings.js";
import { formatGameRulesSection, type GameRulesTopic } from "../gameRules.js";
import { ALWAYS_ON_TOPIC_IDS, selectGameRulesTopics } from "../gameRulesTopicSelection.js";
import {
  buildQueryTokensFromParts,
  collectCuratedRuleIds,
  retrieveRulesForQuery,
  retrieveRulesForQueryWithDebug,
  retrieveSupplementalRules,
  retrieveSupplementalRulesWithDebug,
  type GameRulesRuleIndexEntry
} from "../gameRulesRetrieval.js";
import { buildLookupPromptContext, buildPromptContext } from "./context.js";
import type { EnrichmentDebug } from "./enrichmentDebug.js";
import {
  MAX_CONVERSATION_HISTORY_CHARS,
  MAX_RULING_COMMENT_CHARS,
  MAX_RULINGS_PER_CARD,
  MAX_RULINGS_SECTION_CHARS,
  truncateConversationHistory
} from "./normalization.js";
import { formatSupplementalRulesSection } from "./promptFormatting.js";
import { getPromptDiagnostics, type PromptDiagnostics } from "./promptDiagnostics.js";
import { buildLookupPromptText, buildPromptText } from "./promptAssembly.js";
import type { AskAiRequest, ConversationTurn, GameAskAiRequest, LookupAskAiRequest, PromptInputContext } from "../types/index.js";

export type PreparedPromptInput = {
  context: PromptInputContext;
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
  if (request.mode === "lookup") {
    return prepareLookupPromptInput(request, options);
  }

  return prepareGamePromptInput(request as GameAskAiRequest, options);
}

function getRulingLimits() {
  return {
    maxRulingsPerCard: MAX_RULINGS_PER_CARD,
    maxCommentChars: MAX_RULING_COMMENT_CHARS,
    maxSectionChars: MAX_RULINGS_SECTION_CHARS
  };
}

function prepareLookupPromptInput(
  request: LookupAskAiRequest,
  options: PreparePromptInputOptions
): PreparedPromptInput {
  const context = buildLookupPromptContext(request);
  const limits = getRulingLimits();
  const cardsForRulings = context.card
    ? [{ cardId: context.card.cardId, name: context.card.name }]
    : [];
  const allGameRulesTopics = options.gameRulesTopics ?? [];
  const gameRulesTopics = allGameRulesTopics.filter((topic) =>
    ALWAYS_ON_TOPIC_IDS.includes(topic.id as (typeof ALWAYS_ON_TOPIC_IDS)[number])
  );
  const gameRulesSection = formatGameRulesSection(gameRulesTopics);
  const curatedRuleIds = collectCuratedRuleIds(gameRulesTopics);
  const query = buildQueryTokensFromParts({
    questionText: request.question,
    oracleText: context.card ? `${context.card.oracleText} ${context.card.typeLine}` : ""
  });
  const conversationHistory = request.conversationHistory;
  const truncatedHistory = truncateConversationHistory(conversationHistory ?? [], MAX_CONVERSATION_HISTORY_CHARS);
  const conversationHistoryChars = truncatedHistory.reduce((sum, turn) => sum + turn.content.length, 0);

  if (options.collectEnrichmentDebug) {
    const rulingsResult = resolveRulingsForPrompt(
      cardsForRulings,
      options.cardRulingsIndex ?? new Map(),
      limits,
      true
    );
    const supplementalResult = retrieveRulesForQueryWithDebug(
      query.tokens,
      query.queryRuleIds,
      options.gameRulesRuleIndex ?? [],
      curatedRuleIds,
      5,
      undefined,
      query.queryText
    );
    const supplementalRulesSection = formatSupplementalRulesSection(supplementalResult.selected);
    const promptText = buildLookupPromptText(context, {
      rulings: rulingsResult,
      gameRulesTopics,
      supplementalRules: supplementalResult.selected
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
        topicIds: gameRulesTopics.map((topic) => topic.id),
        topics: gameRulesTopics.map((topic) => ({ id: topic.id, title: topic.title, ruleNumbers: topic.ruleNumbers }))
      },
      rulings: rulingsResult.debug
    };
    return { context, promptText, diagnostics, enrichmentDebug, conversationHistory };
  }

  const resolvedRulings = resolveRulingsForPrompt(
    cardsForRulings,
    options.cardRulingsIndex ?? new Map(),
    limits
  );
  const supplementalRules = retrieveRulesForQuery(
    query.tokens,
    query.queryRuleIds,
    options.gameRulesRuleIndex ?? [],
    curatedRuleIds
  );
  const supplementalRulesSection = formatSupplementalRulesSection(supplementalRules);
  const promptText = buildLookupPromptText(context, {
    rulings: resolvedRulings,
    gameRulesTopics,
    supplementalRules
  });
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

function prepareGamePromptInput(request: GameAskAiRequest, options: PreparePromptInputOptions): PreparedPromptInput {
  const context = buildPromptContext(request);
  const cardsForRulings = collectCardsForRulings(context);
  const limits = getRulingLimits();
  const allGameRulesTopics = options.gameRulesTopics ?? [];
  const gameRulesTopics = selectGameRulesTopics(context, allGameRulesTopics);
  const gameRulesSection = formatGameRulesSection(gameRulesTopics);
  const curatedRuleIds = collectCuratedRuleIds(gameRulesTopics);
  const conversationHistory = request.conversationHistory;
  const truncatedHistory = truncateConversationHistory(conversationHistory ?? [], MAX_CONVERSATION_HISTORY_CHARS);
  const conversationHistoryChars = truncatedHistory.reduce((sum, t) => sum + t.content.length, 0);

  if (options.collectEnrichmentDebug) {
    const rulingsResult = resolveRulingsForPrompt(cardsForRulings, options.cardRulingsIndex ?? new Map(), limits, true);
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
