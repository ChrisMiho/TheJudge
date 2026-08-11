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
import type { ComboCatalog } from "../commanderSpellbook/catalog.js";
import { formatComboSection } from "../commanderSpellbook/formatting.js";
import { hasExplicitComboIntent } from "../commanderSpellbook/intent.js";
import { selectComboCandidates, type ComboCandidate, type ComboMatchInstance } from "../commanderSpellbook/matcher.js";
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
import type {
  AskAiRequest,
  ConversationTurn,
  GameAskAiRequest,
  LookupAskAiRequest,
  LookupPromptContext,
  PromptContext,
  PromptInputContext
} from "../types/index.js";

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
  comboCatalog?: ComboCatalog;
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

/**
 * Every submitted card occurrence, as distinct instances. Two copies of the same
 * card are two instances, so a variant needing 2x can be satisfied while a single
 * copy can never fill both slots.
 */
function collectComboInstances(context: PromptContext): ComboMatchInstance[] {
  const instances: ComboMatchInstance[] = [];

  context.orderedStack.forEach((item, index) => {
    instances.push({ instanceId: `stack-${index}`, cardId: item.cardId, cardName: item.name, zone: "stack" });
  });

  for (const zone of context.populatedZones) {
    zone.items.forEach((item, index) => {
      instances.push({
        instanceId: `${zone.zoneId}-${index}`,
        cardId: item.cardId,
        cardName: item.name,
        zone: zone.zoneId
      });
    });
  }

  return instances;
}

/**
 * The matcher runs only when a catalog was supplied. An absent option — because
 * the artifact is missing or `COMBO_ENRICHMENT_ENABLED` is false — means no
 * matcher run and therefore no section; this branch never learns which.
 */
function resolveGameComboCandidates(
  request: GameAskAiRequest,
  context: PromptContext,
  options: PreparePromptInputOptions
): ComboCandidate[] {
  if (!options.comboCatalog) return [];

  return selectComboCandidates(options.comboCatalog, {
    mode: "game",
    instances: collectComboInstances(context),
    questionText: request.question,
    hasExplicitIntent: hasExplicitComboIntent(request.question)
  });
}

function resolveLookupComboCandidates(
  request: LookupAskAiRequest,
  context: LookupPromptContext,
  options: PreparePromptInputOptions
): ComboCandidate[] {
  if (!options.comboCatalog) return [];

  // A looked-up card carries no zone: the user is asking about the card, not
  // reporting where it sits on a board.
  const instances: ComboMatchInstance[] = context.card
    ? [{ instanceId: "attached", cardId: context.card.cardId, cardName: context.card.name }]
    : [];

  return selectComboCandidates(options.comboCatalog, {
    mode: "lookup",
    instances,
    questionText: request.question,
    hasExplicitIntent: hasExplicitComboIntent(request.question),
    attachedCardId: context.card?.cardId
  });
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
  const comboCandidates = resolveLookupComboCandidates(request, context, options);
  const comboSectionChars = formatComboSection(comboCandidates).length;

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
      supplementalRules: supplementalResult.selected,
      comboCandidates
    });
    const diagnostics = getPromptDiagnostics(promptText, {
      resolvedRulings: rulingsResult,
      gameRulesTopics,
      gameRulesSectionChars: gameRulesSection.length,
      supplementalRules: supplementalResult.selected,
      supplementalRulesSectionChars: supplementalRulesSection.length,
      comboSectionChars,
      comboCandidateCount: comboCandidates.length,
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
    supplementalRules,
    comboCandidates
  });
  const diagnostics = getPromptDiagnostics(promptText, {
    resolvedRulings,
    gameRulesTopics,
    gameRulesSectionChars: gameRulesSection.length,
    supplementalRules,
    supplementalRulesSectionChars: supplementalRulesSection.length,
    comboSectionChars,
    comboCandidateCount: comboCandidates.length,
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
  const comboCandidates = resolveGameComboCandidates(request, context, options);
  const comboSectionChars = formatComboSection(comboCandidates).length;

  if (options.collectEnrichmentDebug) {
    const rulingsResult = resolveRulingsForPrompt(cardsForRulings, options.cardRulingsIndex ?? new Map(), limits, true);
    const supplementalResult = retrieveSupplementalRulesWithDebug(context, options.gameRulesRuleIndex ?? [], curatedRuleIds);
    const supplementalRulesSection = formatSupplementalRulesSection(supplementalResult.selected);
    const promptText = buildPromptText(context, {
      rulings: rulingsResult,
      gameRulesTopics,
      supplementalRules: supplementalResult.selected,
      conversationHistory,
      comboCandidates
    });
    const diagnostics = getPromptDiagnostics(promptText, {
      resolvedRulings: rulingsResult,
      gameRulesTopics,
      gameRulesSectionChars: gameRulesSection.length,
      supplementalRules: supplementalResult.selected,
      supplementalRulesSectionChars: supplementalRulesSection.length,
      comboSectionChars,
      comboCandidateCount: comboCandidates.length,
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
  const promptText = buildPromptText(context, {
    rulings: resolvedRulings,
    gameRulesTopics,
    supplementalRules,
    conversationHistory,
    comboCandidates
  });
  const diagnostics = getPromptDiagnostics(promptText, {
    resolvedRulings,
    gameRulesTopics,
    gameRulesSectionChars: gameRulesSection.length,
    supplementalRules,
    supplementalRulesSectionChars: supplementalRulesSection.length,
    comboSectionChars,
    comboCandidateCount: comboCandidates.length,
    conversationHistoryChars
  });
  return { context, promptText, diagnostics, conversationHistory };
}
