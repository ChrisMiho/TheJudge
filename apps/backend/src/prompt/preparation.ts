import {
  collectCardsForRulings,
  resolveRulingsForPrompt,
  type RulingEntry
} from "../cardRulings.js";
import { formatGameRulesSection, type GameRulesTopic } from "../gameRules.js";
import { ALWAYS_ON_TOPIC_IDS, selectGameRulesTopics } from "../gameRulesTopicSelection.js";
import {
  buildCompactCardSignal,
  buildQueryText,
  buildQueryTokensFromParts,
  collectCuratedRuleIds,
  retrieveRulesForQuery,
  retrieveRulesForQueryWithDebug,
  retrieveSupplementalRules,
  retrieveSupplementalRulesWithDebug,
  type GameRulesRuleIndexEntry
} from "../gameRulesRetrieval.js";
import { buildLookupPromptContext, buildPromptContext, type CardDetailIndex } from "./context.js";
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

/**
 * REQ-190: the number of System 3 supplemental-rule excerpts a prepared
 * prompt attaches. Every production call site passes no override and gets
 * exactly this value; the answer-quality run (REQ-188) is the only caller
 * that ever overrides it, via `PreparePromptInputOptions.supplementalRuleCap`,
 * so a larger cap is an experiment parameter, never a production change.
 */
export const DEFAULT_SUPPLEMENTAL_RULE_CAP = 5;

export type PreparedPromptInput = {
  context: PromptInputContext;
  promptText: string;
  diagnostics: PromptDiagnostics;
  enrichmentDebug?: EnrichmentDebug;
  conversationHistory?: ConversationTurn[];
};

export type PreparePromptInputOptions = {
  cardRulingsIndex?: Map<string, RulingEntry[]>;
  cardDetailIndex?: CardDetailIndex;
  gameRulesTopics?: GameRulesTopic[];
  gameRulesRuleIndex?: GameRulesRuleIndexEntry[];
  comboCatalog?: ComboCatalog;
  collectEnrichmentDebug?: boolean;
  /**
   * REQ-181: the player's question, already embedded by the async route
   * handler (or `null` under `EMBEDDING_PROVIDER=mock`, on embedding
   * failure, or with no provider configured). Passing it in as data — rather
   * than embedding here — is what keeps `preparePromptInput` itself
   * synchronous.
   */
  queryEmbedding?: number[] | null;
  /**
   * REQ-190: overrides the System 3 supplemental-rule excerpt cap
   * (default: `DEFAULT_SUPPLEMENTAL_RULE_CAP`). Every production call site
   * leaves this unset; only the answer-quality run passes a value, so it can
   * assemble a cap-10 prompt from the identical ranking production uses at
   * cap 5 — `retrieveRulesForQueryWithDebug` already returns ranks 6–15 as
   * `runnerUp`, so no scoring, query construction, corpus, or embedding
   * behavior changes for the experiment.
   */
  supplementalRuleCap?: number;
};

export function preparePromptInput(request: AskAiRequest, options: PreparePromptInputOptions = {}): PreparedPromptInput {
  if (request.mode === "lookup") {
    return prepareLookupPromptInput(request, options);
  }

  return prepareGamePromptInput(request as GameAskAiRequest, options);
}

/**
 * REQ-181: the exact System 3 retrieval query text — question plus each
 * card's compact signal (REQ-178/REQ-180) — for the async route handler to
 * embed *before* calling `preparePromptInput`, so the vector can be passed
 * in as data and `preparePromptInput` itself stays synchronous. Pure and
 * side-effect-free; duplicates the (cheap) context-build `preparePromptInput`
 * does internally rather than making that function async.
 */
export function buildRetrievalQueryText(
  request: AskAiRequest,
  options: Pick<PreparePromptInputOptions, "cardDetailIndex"> = {}
): string {
  if (request.mode === "lookup") {
    const context = buildLookupPromptContext(request, options.cardDetailIndex);
    const cardSignal = (context.cards ?? [])
      .map((card) => buildCompactCardSignal(card.name, card.typeLine, card.keywords))
      .join(" ");
    return `${request.question} ${cardSignal}`.trim();
  }

  const context = buildPromptContext(request as GameAskAiRequest, options.cardDetailIndex);
  return buildQueryText(context);
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
 *
 * Exported so the eval harness exercises the production path rather than
 * reimplementing instance collection against its own fixtures.
 */
export function resolveGameComboCandidates(
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

/**
 * REQ-167 / REQ-094 (amended): one match instance per attached card (zero,
 * one, or up to five). Looked-up cards carry no zone — the user is asking
 * about the cards, not reporting where they sit on a board.
 */
function resolveLookupComboCandidates(
  request: LookupAskAiRequest,
  context: LookupPromptContext,
  options: PreparePromptInputOptions
): ComboCandidate[] {
  if (!options.comboCatalog) return [];

  const instances: ComboMatchInstance[] = (context.cards ?? []).map((card, index) => ({
    instanceId: `attached-${index}`,
    cardId: card.cardId,
    cardName: card.name
  }));

  return selectComboCandidates(options.comboCatalog, {
    mode: "lookup",
    instances,
    questionText: request.question,
    hasExplicitIntent: hasExplicitComboIntent(request.question)
  });
}

function prepareLookupPromptInput(
  request: LookupAskAiRequest,
  options: PreparePromptInputOptions
): PreparedPromptInput {
  const context = buildLookupPromptContext(request, options.cardDetailIndex);
  const limits = getRulingLimits();
  const cardsForRulings = (context.cards ?? []).map((card) => ({ cardId: card.cardId, name: card.name }));
  const allGameRulesTopics = options.gameRulesTopics ?? [];
  const gameRulesTopics = allGameRulesTopics.filter((topic) =>
    ALWAYS_ON_TOPIC_IDS.includes(topic.id as (typeof ALWAYS_ON_TOPIC_IDS)[number])
  );
  const gameRulesSection = formatGameRulesSection(gameRulesTopics);
  const curatedRuleIds = collectCuratedRuleIds(gameRulesTopics);
  // REQ-167 / REQ-178 / REQ-180: System 3 scores the question plus, for every
  // attached card, the same compact per-card signal (name, type line, real
  // Scryfall keywords resolved server-side) game mode builds via
  // `buildCompactCardSignal` — never the card's full oracle text. One shared
  // signal builder, not a second implementation, so lookup and game mode
  // cannot drift apart again.
  const query = buildQueryTokensFromParts({
    questionText: request.question,
    oracleText: (context.cards ?? [])
      .map((card) => buildCompactCardSignal(card.name, card.typeLine, card.keywords))
      .join(" ")
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
      options.supplementalRuleCap ?? DEFAULT_SUPPLEMENTAL_RULE_CAP,
      undefined,
      options.queryEmbedding ?? null,
      query.queryText,
      query.questionRuleIds
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
    curatedRuleIds,
    options.supplementalRuleCap ?? DEFAULT_SUPPLEMENTAL_RULE_CAP,
    undefined,
    options.queryEmbedding ?? null,
    query.questionRuleIds
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
  const context = buildPromptContext(request, options.cardDetailIndex);
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
    const supplementalResult = retrieveSupplementalRulesWithDebug(
      context,
      options.gameRulesRuleIndex ?? [],
      curatedRuleIds,
      options.supplementalRuleCap ?? DEFAULT_SUPPLEMENTAL_RULE_CAP,
      undefined,
      options.queryEmbedding ?? null
    );
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
  const supplementalRules = retrieveSupplementalRules(
    context,
    options.gameRulesRuleIndex ?? [],
    curatedRuleIds,
    options.supplementalRuleCap ?? DEFAULT_SUPPLEMENTAL_RULE_CAP,
    undefined,
    options.queryEmbedding ?? null
  );
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
