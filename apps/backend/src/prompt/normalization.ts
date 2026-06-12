import { MTG_PROMPT_REFERENCE } from "./mtgReference.js";
import { getPhaseGuidance } from "./phaseGuidance.js";
import type { ResolvedRulings } from "../cardRulings.js";
import { formatGameRulesSection, type GameRulesTopic } from "../gameRules.js";
import type { RetrievedGameRule } from "../gameRulesRetrieval.js";
import type { ConversationTurn, PlayerLabel, PromptContext, ZoneId } from "../types/index.js";

export const EFFECTIVELY_UNLIMITED_CHARS = 1_000_000;
export const MAX_ORACLE_TEXT_CHARS = EFFECTIVELY_UNLIMITED_CHARS / 10;
export const MAX_CONVERSATION_HISTORY_CHARS = EFFECTIVELY_UNLIMITED_CHARS;
export const MAX_CONTEXT_DETAILS_CHARS = EFFECTIVELY_UNLIMITED_CHARS / 10;
export const MAX_CONTEXT_NOTES_CHARS = EFFECTIVELY_UNLIMITED_CHARS / 10;
export const MAX_TARGET_LABEL_CHARS = EFFECTIVELY_UNLIMITED_CHARS / 10;
export const MAX_PROMPT_CHAR_BUDGET = EFFECTIVELY_UNLIMITED_CHARS;
export const MAX_RULINGS_PER_CARD = 100;
export const MAX_RULING_COMMENT_CHARS = EFFECTIVELY_UNLIMITED_CHARS / 10;
export const MAX_RULINGS_SECTION_CHARS = EFFECTIVELY_UNLIMITED_CHARS;
export const PROMPT_BUDGET_NEAR_LIMIT_BUFFER = 10_000;
const TRUNCATION_SUFFIX = " ...(truncated)";
const PLAYER_LABEL_ORDER = [
  "Player 1",
  "Player 2",
  "Player 3",
  "Player 4",
  "Player 5",
  "Player 6",
  "Player 7",
  "Player 8"
] as const;
export const SYSTEM_ROLE_PREAMBLE_LINES = [
  "You are TheJudge assistant for Magic: The Gathering stack-resolution support.",
  "Use only the provided context to explain likely interactions and resolution order.",
  "Treat ordered stack semantics as authoritative: stack[0] is the bottom spell and the last entry is the top spell.",
  "State assumptions when context is incomplete.",
  "Do not claim hidden state, private-zone information, or unseen effects.",
  "Do not present output as an official tournament ruling."
] as const;

const CANONICAL_ZONE_ORDER: ZoneId[] = [
  "stack",
  "battlefield",
  "hand",
  "graveyard",
  "exile",
  "library",
  "command"
];

const ZONE_SECTION_LABEL: Record<string, string> = {
  battlefield: "ZONE: BATTLEFIELD",
  hand: "ZONE: HAND",
  graveyard: "ZONE: GRAVEYARD",
  exile: "ZONE: EXILE",
  library: "ZONE: LIBRARY",
  command: "ZONE: COMMAND"
};

const ZONE_ITEM_LABEL: Record<string, string> = {
  battlefield: "Battlefield",
  hand: "Hand",
  graveyard: "Graveyard",
  exile: "Exile",
  library: "Library",
  command: "Command"
};

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function truncateOracleText(value: string, maxChars = MAX_ORACLE_TEXT_CHARS): string {
  if (value.length <= maxChars) {
    return value;
  }

  const maxWithoutSuffix = Math.max(0, maxChars - TRUNCATION_SUFFIX.length);
  return `${value.slice(0, maxWithoutSuffix)}${TRUNCATION_SUFFIX}`;
}

function truncatePromptLabel(value: string, maxChars: number): string {
  return truncateOracleText(value, maxChars);
}

export function normalizeQuestion(value: string): string {
  return normalizeWhitespace(value);
}

export function normalizeCardText(value: string): string {
  return truncateOracleText(normalizeWhitespace(value));
}

export function truncateConversationHistory(turns: ConversationTurn[], budget: number): ConversationTurn[] {
  let total = turns.reduce((sum, t) => sum + t.content.length, 0);
  if (total <= budget) return turns;
  const result = [...turns];
  while (result.length > 0 && total > budget) {
    total -= result[0]!.content.length;
    result.shift();
  }
  return result;
}

export function formatConversationHistorySection(turns: ConversationTurn[]): string {
  if (turns.length === 0) return "";
  const lines = turns.map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${truncateOracleText(t.content, EFFECTIVELY_UNLIMITED_CHARS / 10)}`);
  return ["CONVERSATION HISTORY", ...lines].join("\n");
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "(none)";
}

function buildPlayerDisplayNameLookup(
  players: PromptContext["gameContext"]["players"]
): Record<PlayerLabel, string | undefined> {
  return players.reduce<Record<PlayerLabel, string | undefined>>(
    (accumulator, player) => ({
      ...accumulator,
      [player.label]: player.displayName
    }),
    {} as Record<PlayerLabel, string | undefined>
  );
}

function formatPlayerRef(
  label: PlayerLabel | undefined,
  displayNamesByPlayer: Record<PlayerLabel, string | undefined>
): string {
  if (!label) {
    return "(none)";
  }

  const displayName = displayNamesByPlayer[label]?.trim() ?? "";
  if (displayName.length === 0 || displayName === label) {
    return label;
  }

  return `${label} (${displayName})`;
}

function toPlayerLabelIndex(label: string): number {
  const index = PLAYER_LABEL_ORDER.indexOf(label as (typeof PLAYER_LABEL_ORDER)[number]);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function formatTargets(
  targets: PromptContext["orderedStack"][number]["targets"],
  displayNamesByPlayer: Record<PlayerLabel, string | undefined>
): string {
  if (targets.length === 0) {
    return "(none)";
  }

  return targets
    .map((target) => {
      if (target.kind === "none") {
        return "none:does-not-target";
      }

      if (target.kind === "other") {
        return `other:${truncatePromptLabel(target.targetDescription, MAX_TARGET_LABEL_CHARS)}`;
      }

      if (target.kind === "player") {
        return `player:${formatPlayerRef(target.targetPlayer, displayNamesByPlayer)}`;
      }

      if (target.kind === "battlefield") {
        return `battlefield:${truncatePromptLabel(target.targetPermanent, MAX_TARGET_LABEL_CHARS)}`;
      }

      return `stack:${truncatePromptLabel(target.targetCardName, MAX_TARGET_LABEL_CHARS)}`;
    })
    .join(" | ");
}

function formatGameContext(context: PromptContext): string {
  const players = [...context.gameContext.players].sort(
    (left, right) => toPlayerLabelIndex(left.label) - toPlayerLabelIndex(right.label)
  );
  const displayNamesByPlayer = buildPlayerDisplayNameLookup(players);

  return [
    `turnPhase: ${context.gameContext.turnPhase}`,
    `playerCount: ${context.gameContext.playerCount}`,
    ...players.map((player) => {
      const display =
        player.displayName && player.displayName !== player.label
          ? ` displayName=${player.displayName}`
          : "";
      return `${player.label}: lifeTotal=${player.lifeTotal}${display}`;
    }),
    ...(context.gameContext.activePlayer
      ? [`activePlayer: ${formatPlayerRef(context.gameContext.activePlayer, displayNamesByPlayer)}`]
      : [])
  ].join("\n");
}

function formatZoneCardMetadataLines(
  card: {
    manaCost: string;
    manaValue: number;
    typeLine: string;
    colors: string[];
    supertypes: string[];
    subtypes: string[];
    targets: PromptContext["orderedStack"][number]["targets"];
    contextNotes?: string;
    oracleText: string;
  },
  displayNamesByPlayer: Record<PlayerLabel, string | undefined>
): string[] {
  return [
    `manaCost: ${card.manaCost || "(none)"}`,
    `manaValue: ${card.manaValue}`,
    `typeLine: ${card.typeLine || "(none)"}`,
    `colors: ${formatList(card.colors)}`,
    `supertypes: ${formatList(card.supertypes)}`,
    `subtypes: ${formatList(card.subtypes)}`,
    `targets: ${formatTargets(card.targets, displayNamesByPlayer)}`,
    `contextNotes: ${
      card.contextNotes ? truncatePromptLabel(card.contextNotes, MAX_CONTEXT_NOTES_CHARS) : "(none)"
    }`,
    `oracleText: ${card.oracleText || "(none) — no oracle text recorded for this card"}`
  ];
}

function formatStackSection(context: PromptContext): string {
  if (context.orderedStack.length === 0) {
    return "";
  }

  const displayNamesByPlayer = buildPlayerDisplayNameLookup(context.gameContext.players);
  const cardsSection = context.orderedStack
    .map((card, index) => {
      const metaLines = formatZoneCardMetadataLines(card, displayNamesByPlayer);
      // Insert stack-only fields: caster after subtypes (index 6), manaSpent after targets (index 8)
      metaLines.splice(6, 0, `caster: ${formatPlayerRef(card.caster, displayNamesByPlayer)}`);
      metaLines.splice(8, 0, `manaSpent: ${card.manaSpent ?? card.manaValue}`);
      return [`Stack item ${index + 1} (${card.stackRole})`, `card: ${card.name}`, ...metaLines].join("\n");
    })
    .join("\n\n");

  return ["ZONE: STACK (BOTTOM TO TOP)", cardsSection].join("\n");
}

function formatNonStackZoneSections(context: PromptContext): string {
  if (context.populatedZones.length === 0) {
    return "";
  }

  const displayNamesByPlayer = buildPlayerDisplayNameLookup(context.gameContext.players);
  return context.populatedZones
    .map((zone) => {
      const sectionHeader = ZONE_SECTION_LABEL[zone.zoneId] ?? `ZONE: ${zone.zoneId.toUpperCase()}`;
      const itemLabel = ZONE_ITEM_LABEL[zone.zoneId] ?? zone.zoneId;
      const itemsText = zone.items
        .map((item, index) =>
          [
            `${itemLabel} ${index + 1}`,
            `name: ${item.name}`,
            `owner: ${formatPlayerRef(item.owner, displayNamesByPlayer)}`,
            ...formatZoneCardMetadataLines(item, displayNamesByPlayer)
          ].join("\n")
        )
        .join("\n\n");
      return [sectionHeader, itemsText].join("\n");
    })
    .join("\n\n");
}

export function formatOfficialRulingsSection(resolvedRulings: ResolvedRulings | undefined): string {
  if (!resolvedRulings || resolvedRulings.cards.length === 0) {
    return "";
  }

  const cardBlocks = resolvedRulings.cards
    .filter((card) => card.rulings.length > 0)
    .map((card) =>
      [card.name, ...card.rulings.map((ruling) => `- ${ruling.publishedAt}: ${ruling.comment}`)].join("\n")
    );

  if (cardBlocks.length === 0) {
    return "";
  }

  return [
    "OFFICIAL RULINGS (WotC reference)",
    "Use these published Oracle rulings as reference for how each card works. They do not override the user's stack order, zones, or stated game state.",
    "",
    cardBlocks.join("\n\n")
  ].join("\n");
}

const SUPPLEMENTAL_RULES_DISCLAIMER =
  "Use these additional official rule excerpts as reference. They do not override the user's submitted game state, stack order, zones, targets, notes, or card oracle text.";

export function formatSupplementalRulesSection(rules: RetrievedGameRule[]): string {
  if (rules.length === 0) return "";

  const ruleBlocks = rules.map((rule) => `${rule.ruleId}. ${rule.text}`);

  return [
    "ADDITIONAL RELEVANT RULE EXCERPTS",
    SUPPLEMENTAL_RULES_DISCLAIMER,
    "",
    ruleBlocks.join("\n\n")
  ].join("\n");
}

/**
 * Builds the scope sentence listing zones with no cards.
 * Merges unselected zones and selected-but-empty zones in canonical order.
 */
export function buildZoneScopeSentence(_selectedZones: ZoneId[], populatedZoneIds: ZoneId[]): string {
  const populatedSet = new Set<string>(populatedZoneIds);
  const scopeZones = CANONICAL_ZONE_ORDER.filter((z) => !populatedSet.has(z));
  if (scopeZones.length === 0) {
    return "(all zones included)";
  }
  return `Zones with no cards or not included in this submission (ignore for scope unless the question says otherwise): ${scopeZones.join(", ")}.`;
}

export function estimatePromptChars(prompt: string): number {
  return prompt.length;
}

export type PromptDiagnostics = {
  promptChars: number;
  promptBudgetChars: number;
  remainingChars: number;
  utilizationPercent: number;
  nearLimit: boolean;
  exceedsBudget: boolean;
  conversationHistoryChars: number;
  rulingsSectionChars?: number;
  rulingsCardCount?: number;
  gameRulesSectionChars?: number;
  gameRulesTopicCount?: number;
  supplementalRuleCount?: number;
  supplementalRulesSectionChars?: number;
  supplementalRuleIds?: string[];
};

export type GetPromptDiagnosticsOptions = {
  resolvedRulings?: ResolvedRulings;
  gameRulesTopics?: GameRulesTopic[];
  gameRulesSectionChars?: number;
  supplementalRules?: RetrievedGameRule[];
  supplementalRulesSectionChars?: number;
  conversationHistoryChars?: number;
};

export function getPromptDiagnostics(prompt: string, resolvedRulingsOrOptions?: ResolvedRulings | GetPromptDiagnosticsOptions): PromptDiagnostics {
  const promptChars = estimatePromptChars(prompt);
  const promptBudgetChars = MAX_PROMPT_CHAR_BUDGET;
  const remainingChars = promptBudgetChars - promptChars;
  const utilizationPercent = Math.round((promptChars / promptBudgetChars) * 1000) / 10;

  let resolvedRulings: ResolvedRulings | undefined;
  let gameRulesTopics: GameRulesTopic[] | undefined;
  let gameRulesSectionChars: number | undefined;
  let supplementalRules: RetrievedGameRule[] | undefined;
  let supplementalRulesSectionChars: number | undefined;
  let conversationHistoryChars = 0;

  if (resolvedRulingsOrOptions && "cards" in resolvedRulingsOrOptions) {
    resolvedRulings = resolvedRulingsOrOptions;
  } else if (resolvedRulingsOrOptions) {
    const opts = resolvedRulingsOrOptions as GetPromptDiagnosticsOptions;
    resolvedRulings = opts.resolvedRulings;
    gameRulesTopics = opts.gameRulesTopics;
    gameRulesSectionChars = opts.gameRulesSectionChars;
    supplementalRules = opts.supplementalRules;
    supplementalRulesSectionChars = opts.supplementalRulesSectionChars;
    conversationHistoryChars = opts.conversationHistoryChars ?? 0;
  }

  return {
    promptChars,
    promptBudgetChars,
    remainingChars,
    utilizationPercent,
    nearLimit: promptChars > promptBudgetChars - PROMPT_BUDGET_NEAR_LIMIT_BUFFER,
    exceedsBudget: promptChars > promptBudgetChars,
    conversationHistoryChars,
    ...(resolvedRulings
      ? {
          rulingsSectionChars: resolvedRulings.sectionChars,
          rulingsCardCount: resolvedRulings.cards.length
        }
      : {}),
    ...(gameRulesTopics && gameRulesTopics.length > 0
      ? {
          gameRulesSectionChars,
          gameRulesTopicCount: gameRulesTopics.length
        }
      : {}),
    ...(supplementalRules && supplementalRules.length > 0
      ? {
          supplementalRuleCount: supplementalRules.length,
          supplementalRulesSectionChars,
          supplementalRuleIds: supplementalRules.map((r) => r.ruleId)
        }
      : {})
  };
}

export type BuildPromptTextOptions = {
  rulings?: ResolvedRulings;
  gameRulesTopics?: GameRulesTopic[];
  supplementalRules?: RetrievedGameRule[];
  conversationHistory?: ConversationTurn[];
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

  sections.push("", "SCOPE", scopeSentence);

  if (conversationHistorySection.length > 0) {
    sections.push("", conversationHistorySection);
  }

  sections.push("", "QUESTION", context.finalQuestion);

  return sections.join("\n");
}
