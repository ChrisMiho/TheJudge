import {
  MAX_CONVERSATION_HISTORY_CHARS,
  truncateConversationHistory
} from "./normalization.js";
import {
  SYSTEM_ROLE_PREAMBLE_LINES,
  buildZoneScopeSentence,
  formatConversationHistorySection,
  formatGameContext,
  formatNonStackZoneSections,
  formatOfficialRulingsSection,
  formatStackSection,
  formatSupplementalRulesSection,
  formatZoneCardMetadataLines
} from "./promptFormatting.js";
import { MTG_PROMPT_REFERENCE } from "./mtgReference.js";
import { getPhaseGuidance } from "./phaseGuidance.js";
import type { ResolvedRulings } from "../cardRulings.js";
import { formatGameRulesSection, type GameRulesTopic } from "../gameRules.js";
import type { RetrievedGameRule } from "../gameRulesRetrieval.js";
import type { ConversationTurn, LookupPromptContext, PlayerLabel, PromptContext, ZoneId } from "../types/index.js";
import { formatComboSection } from "../commanderSpellbook/formatting.js";
import type { ComboCandidate } from "../commanderSpellbook/matcher.js";

export type BuildPromptTextOptions = {
  rulings?: ResolvedRulings;
  gameRulesTopics?: GameRulesTopic[];
  supplementalRules?: RetrievedGameRule[];
  conversationHistory?: ConversationTurn[];
  comboCandidates?: ComboCandidate[];
};

export function buildPromptText(context: PromptContext, options: BuildPromptTextOptions = {}): string {
  const populatedZoneIds: ZoneId[] = [
    ...(context.orderedStack.length > 0 ? (["stack"] as ZoneId[]) : []),
    ...context.populatedZones.map((z) => z.zoneId as ZoneId)
  ];

  const scopeSentence = buildZoneScopeSentence(context.gameContext.selectedZones, populatedZoneIds);

  const stackSection = formatStackSection(context);
  const nonStackSections = formatNonStackZoneSections(context);
  const gameRulesSection = formatGameRulesSection(options.gameRulesTopics ?? []);
  const supplementalRulesSection = formatSupplementalRulesSection(options.supplementalRules ?? []);
  const officialRulingsSection = formatOfficialRulingsSection(options.rulings);
  const comboSection = formatComboSection(options.comboCandidates ?? []);

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
    "- Explain reasoning clearly and concisely.",
    "- State uncertainty when context is incomplete.",
    "- Do not invent hidden state, targets, or board conditions.",
    ...(conversationHistory.length > 0
      ? ["- Treat follow-up questions as refinements or clarifications against the frozen game state and prior answers."]
      : []),
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

  if (officialRulingsSection.length > 0) {
    sections.push("", officialRulingsSection);
  }

  // Immediately after rulings and before SCOPE, keeping all enrichment contiguous.
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
  const gameRulesSection = formatGameRulesSection(options.gameRulesTopics ?? []);
  const supplementalRulesSection = formatSupplementalRulesSection(options.supplementalRules ?? []);
  const cardSection = context.card
    ? [
        "CARD (looked up)",
        `name: ${context.card.name}`,
        ...formatZoneCardMetadataLines(
          { ...context.card, targets: [] },
          {} as Record<PlayerLabel, string | undefined>
        ).filter((line) => !line.startsWith("targets:") && !line.startsWith("contextNotes:"))
      ].join("\n")
    : "";
  const officialRulingsSection = context.card ? formatOfficialRulingsSection(options.rulings) : "";
  const comboSection = formatComboSection(options.comboCandidates ?? []);
  const conversationHistory = context.conversationHistory ?? [];
  const conversationHistorySection = formatConversationHistorySection(
    truncateConversationHistory(conversationHistory, MAX_CONVERSATION_HISTORY_CHARS)
  );

  const sections = [
    "SYSTEM ROLE PREAMBLE",
    ...SYSTEM_ROLE_PREAMBLE_LINES,
    "",
    "INSTRUCTIONS",
    "- Explain reasoning clearly and concisely.",
    "- State uncertainty when context is incomplete.",
    "- Do not invent hidden state, targets, or board conditions.",
    "- For verbatim fidelity, quote rule text only from the provided GAME RULES / ADDITIONAL RELEVANT RULE EXCERPTS sections; present genuinely relevant excerpts verbatim with an explanation; never invent rule numbers or text.",
    "- Treat unrecognized or off-domain terms as not found in the rules corpus; ask the user to check spelling or rephrase toward a Magic term; never answer the off-domain question directly.",
    "",
    "MTG REFERENCE",
    MTG_PROMPT_REFERENCE
  ];

  for (const section of [
    gameRulesSection,
    supplementalRulesSection,
    cardSection,
    officialRulingsSection,
    comboSection,
    conversationHistorySection
  ]) {
    if (section.length > 0) sections.push("", section);
  }

  sections.push("", "QUESTION", context.finalQuestion);
  return sections.join("\n");
}
