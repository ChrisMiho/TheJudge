import {
  MAX_CONVERSATION_HISTORY_CHARS,
  truncateConversationHistory
} from "./normalization.js";
import {
  GAME_FOLLOW_UP_INSTRUCTION,
  LOOKUP_OFF_DOMAIN_INSTRUCTION,
  LOOKUP_ROLE_PREAMBLE_LINES,
  SHARED_INSTRUCTION_LINES,
  SYSTEM_ROLE_PREAMBLE_LINES,
  buildZoneScopeSentence,
  createRulingsPlacement,
  formatConversationHistorySection,
  formatGameContext,
  formatNonStackZoneSections,
  formatStackSection,
  formatZoneCardMetadataLines
} from "./promptFormatting.js";
import { MTG_LOOKUP_REFERENCE, MTG_PROMPT_REFERENCE } from "./mtgReference.js";
import { describeTurnSteps, getPhaseGuidance, type TurnStepKey } from "./phaseGuidance.js";
import { layoutPromptRuleSections, type PromptRuleSections } from "./ruleLayout.js";
import type { ResolvedRulings } from "../cardRulings.js";
import type { GameRulesTopic } from "../gameRules.js";
import type { GameRulesRuleIndexEntry, RetrievedGameRule } from "../gameRulesRetrieval.js";
import type { ConversationTurn, LookupPromptContext, PlayerLabel, PromptContext, ZoneId } from "../types/index.js";
import { formatComboSection } from "../commanderSpellbook/formatting.js";
import type { ComboCandidate } from "../commanderSpellbook/matcher.js";

export type BuildPromptTextOptions = {
  rulings?: ResolvedRulings;
  gameRulesTopics?: GameRulesTopic[];
  supplementalRules?: RetrievedGameRule[];
  /** The committed rule index: list items, lead-in sentences and pointers (REQ-239, REQ-240, REQ-244). */
  gameRulesRuleIndex?: readonly GameRulesRuleIndexEntry[];
  /** Both rules sections already laid out; the builders lay them out themselves when absent. */
  ruleSections?: PromptRuleSections;
  /** Quick Lookup: the turn steps the question or an attached card's concept terms name (REQ-238). */
  namedSteps?: readonly TurnStepKey[];
  conversationHistory?: ConversationTurn[];
  comboCandidates?: ComboCandidate[];
  /** The combo section already formatted (`preparePromptInput` formats it once and passes it in); takes precedence over `comboCandidates`. */
  comboSection?: string;
};

function ruleSectionsFor(options: BuildPromptTextOptions): PromptRuleSections {
  return (
    options.ruleSections ??
    layoutPromptRuleSections({
      topics: options.gameRulesTopics ?? [],
      supplementalRules: options.supplementalRules ?? [],
      ruleIndex: options.gameRulesRuleIndex
    })
  );
}

export function buildPromptText(context: PromptContext, options: BuildPromptTextOptions = {}): string {
  const populatedZoneIds: ZoneId[] = [
    ...(context.orderedStack.length > 0 ? (["stack"] as ZoneId[]) : []),
    ...context.populatedZones.map((z) => z.zoneId as ZoneId)
  ];

  const scopeSentence = buildZoneScopeSentence(populatedZoneIds);

  // REQ-241: each card's rulings print under the card's first appearance (stack bottom to top, then the zones).
  const rulingsPlacement = createRulingsPlacement(options.rulings);
  const stackSection = formatStackSection(context, rulingsPlacement);
  const nonStackSections = formatNonStackZoneSections(context, rulingsPlacement);
  const { gameRulesSection, supplementalRulesSection } = ruleSectionsFor(options);
  const comboSection = options.comboSection ?? formatComboSection(options.comboCandidates ?? []);

  const conversationHistory = options.conversationHistory ?? [];
  const truncatedHistory = truncateConversationHistory(conversationHistory, MAX_CONVERSATION_HISTORY_CHARS);
  const conversationHistorySection = formatConversationHistorySection(truncatedHistory);

  const zoneSections = [stackSection, nonStackSections].filter(Boolean).join("\n\n");

  const phaseGuidance = getPhaseGuidance(context.gameContext.turnPhase, context.gameContext.combatStep);

  const sections: string[] = [
    "SYSTEM ROLE PREAMBLE",
    ...SYSTEM_ROLE_PREAMBLE_LINES,
    "",
    "INSTRUCTIONS",
    ...SHARED_INSTRUCTION_LINES,
    ...(conversationHistory.length > 0 ? [GAME_FOLLOW_UP_INSTRUCTION] : []),
    "",
    "MTG REFERENCE",
    MTG_PROMPT_REFERENCE,
    "",
    "GENERAL GAME CONTEXT",
    formatGameContext(context),
    "",
    "PHASE GUIDANCE",
    phaseGuidance
  ];

  if (zoneSections.length > 0) {
    sections.push("", zoneSections);
  }

  if (gameRulesSection.length > 0) {
    sections.push("", gameRulesSection);
  }

  if (supplementalRulesSection.length > 0) {
    sections.push("", supplementalRulesSection);
  }

  // After the rules sections and before SCOPE, keeping all enrichment contiguous.
  if (comboSection.length > 0) {
    sections.push("", comboSection);
  }

  sections.push("", "SCOPE", scopeSentence);

  if (conversationHistorySection.length > 0) {
    sections.push("", conversationHistorySection);
  }

  sections.push("", "QUESTION", context.finalQuestion);

  return sections.join("\n");
}

export function buildLookupPromptText(
  context: LookupPromptContext,
  options: BuildPromptTextOptions = {}
): string {
  const { gameRulesSection, supplementalRulesSection } = ruleSectionsFor(options);
  // REQ-167: one heading, one block per attached card (max 5) — matches
  // OFFICIAL RULINGS's existing one-heading/many-blocks convention below, so
  // exactly one card renders byte-identical to the prior single-card section.
  // REQ-241: each attached card's rulings follow its block.
  const rulingsPlacement = createRulingsPlacement(options.rulings);
  const cardBlocks = (context.cards ?? []).map((card) =>
    [
      `name: ${card.name}`,
      ...formatZoneCardMetadataLines(card, {} as Record<PlayerLabel, string | undefined>, {
        includeTargetsAndNotes: false
      }),
      ...rulingsPlacement.take(card.cardId, card.name)
    ].join("\n")
  );
  const cardSection = cardBlocks.length > 0 ? ["CARD (looked up)", cardBlocks.join("\n\n")].join("\n") : "";
  const comboSection = options.comboSection ?? formatComboSection(options.comboCandidates ?? []);
  const conversationHistory = context.conversationHistory ?? [];
  const conversationHistorySection = formatConversationHistorySection(
    truncateConversationHistory(conversationHistory, MAX_CONVERSATION_HISTORY_CHARS)
  );

  const sections = [
    "SYSTEM ROLE PREAMBLE",
    ...LOOKUP_ROLE_PREAMBLE_LINES,
    "",
    "INSTRUCTIONS",
    ...SHARED_INSTRUCTION_LINES,
    // REQ-168: common Magic-adjacent community phrasing is in-domain and must be answered; the refusal
    // persona is reserved for input genuinely unrelated to Magic. One instruction line -- no
    // classifier, validator, or detection branch.
    LOOKUP_OFF_DOMAIN_INSTRUCTION,
    "",
    "MTG REFERENCE",
    MTG_LOOKUP_REFERENCE
  ];

  // REQ-238: right after MTG REFERENCE, a description of each turn step the question names.
  const namedSteps = options.namedSteps ?? [];
  if (namedSteps.length > 0) {
    sections.push("", "PHASE GUIDANCE", ...describeTurnSteps(namedSteps));
  }

  for (const section of [
    gameRulesSection,
    supplementalRulesSection,
    cardSection,
    comboSection,
    conversationHistorySection
  ]) {
    if (section.length > 0) sections.push("", section);
  }

  sections.push("", "QUESTION", context.finalQuestion);
  return sections.join("\n");
}
