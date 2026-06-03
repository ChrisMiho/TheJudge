import { MTG_PROMPT_REFERENCE } from "./promptMtgReference.js";
import type { PromptContext, ZoneId } from "./types.js";

export const MAX_ORACLE_TEXT_CHARS = 480;
export const MAX_CONTEXT_DETAILS_CHARS = 220;
export const MAX_CONTEXT_NOTES_CHARS = 180;
export const MAX_TARGET_LABEL_CHARS = 120;
export const MAX_PROMPT_CHAR_BUDGET = 12000;
export const PROMPT_BUDGET_NEAR_LIMIT_BUFFER = 800;
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

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "(none)";
}

function toPlayerLabelIndex(label: string): number {
  const index = PLAYER_LABEL_ORDER.indexOf(label as (typeof PLAYER_LABEL_ORDER)[number]);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function formatTargets(targets: PromptContext["orderedStack"][number]["targets"]): string {
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
        return `player:${target.targetPlayer}`;
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

  return [
    `turnPhase: ${context.gameContext.turnPhase}`,
    `playerCount: ${context.gameContext.playerCount}`,
    ...players.map((player) => `${player.label}: lifeTotal=${player.lifeTotal}`)
  ].join("\n");
}

function formatStackSection(context: PromptContext): string {
  if (context.orderedStack.length === 0) {
    return "";
  }

  const cardsSection = context.orderedStack
    .map(
      (card, index) =>
        [
          `Stack item ${index + 1} (${card.stackRole})`,
          `card: ${card.name}`,
          `manaCost: ${card.manaCost || "(none)"}`,
          `manaValue: ${card.manaValue}`,
          `typeLine: ${card.typeLine || "(none)"}`,
          `colors: ${formatList(card.colors)}`,
          `supertypes: ${formatList(card.supertypes)}`,
          `subtypes: ${formatList(card.subtypes)}`,
          `caster: ${card.caster}`,
          `targets: ${formatTargets(card.targets)}`,
          `manaSpent: ${card.manaSpent ?? card.manaValue}`,
          `contextNotes: ${
            card.contextNotes ? truncatePromptLabel(card.contextNotes, MAX_CONTEXT_NOTES_CHARS) : "(none)"
          }`,
          `oracleText: ${card.oracleText}`
        ].join("\n")
    )
    .join("\n\n");

  return ["ZONE: STACK (BOTTOM TO TOP)", cardsSection].join("\n");
}

function formatNonStackZoneSections(context: PromptContext): string {
  if (context.populatedZones.length === 0) {
    return "";
  }

  return context.populatedZones
    .map((zone) => {
      const sectionHeader = ZONE_SECTION_LABEL[zone.zoneId] ?? `ZONE: ${zone.zoneId.toUpperCase()}`;
      const itemLabel = ZONE_ITEM_LABEL[zone.zoneId] ?? zone.zoneId;
      const itemsText = zone.items
        .map((item, index) =>
          [
            `${itemLabel} ${index + 1}`,
            `name: ${item.name}`,
            `details: ${item.details ? truncateOracleText(item.details, MAX_CONTEXT_DETAILS_CHARS) : "(none)"}`,
            `targets: ${formatTargets(item.targets)}`
          ].join("\n")
        )
        .join("\n\n");
      return [sectionHeader, itemsText].join("\n");
    })
    .join("\n\n");
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
};

export function getPromptDiagnostics(prompt: string): PromptDiagnostics {
  const promptChars = estimatePromptChars(prompt);
  const promptBudgetChars = MAX_PROMPT_CHAR_BUDGET;
  const remainingChars = promptBudgetChars - promptChars;
  const utilizationPercent = Math.round((promptChars / promptBudgetChars) * 1000) / 10;

  return {
    promptChars,
    promptBudgetChars,
    remainingChars,
    utilizationPercent,
    nearLimit: promptChars > promptBudgetChars - PROMPT_BUDGET_NEAR_LIMIT_BUFFER,
    exceedsBudget: promptChars > promptBudgetChars
  };
}

export function buildPromptText(context: PromptContext): string {
  const populatedZoneIds: ZoneId[] = [
    ...(context.orderedStack.length > 0 ? (["stack"] as ZoneId[]) : []),
    ...context.populatedZones.map((z) => z.zoneId as ZoneId)
  ];

  const scopeSentence = buildZoneScopeSentence(context.gameContext.selectedZones, populatedZoneIds);

  const stackSection = formatStackSection(context);
  const nonStackSections = formatNonStackZoneSections(context);

  const zoneSections = [stackSection, nonStackSections].filter(Boolean).join("\n\n");

  const sections: string[] = [
    "SYSTEM ROLE PREAMBLE",
    ...SYSTEM_ROLE_PREAMBLE_LINES,
    "",
    "INSTRUCTIONS",
    "- Explain reasoning clearly and concisely.",
    "- State uncertainty when context is incomplete.",
    "- Do not invent hidden state, targets, or board conditions.",
    "",
    "MTG REFERENCE",
    MTG_PROMPT_REFERENCE,
    "",
    "GENERAL GAME CONTEXT",
    formatGameContext(context)
  ];

  if (zoneSections.length > 0) {
    sections.push("", zoneSections);
  }

  sections.push("", "SCOPE", scopeSentence, "", "QUESTION", context.finalQuestion);

  return sections.join("\n");
}
