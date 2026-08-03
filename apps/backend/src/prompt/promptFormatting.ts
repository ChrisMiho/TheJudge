import {
  EFFECTIVELY_UNLIMITED_CHARS,
  MAX_CONTEXT_NOTES_CHARS,
  MAX_TARGET_LABEL_CHARS,
  truncateOracleText
} from "./normalization.js";
import { CANONICAL_ZONE_ORDER, PLAYER_LABELS } from "../constants.js";
import type { ResolvedRulings } from "../cardRulings.js";
import type { RetrievedGameRule } from "../gameRulesRetrieval.js";
import type { ConversationTurn, PlayerLabel, PromptContext, ZoneId } from "../types/index.js";

export const SYSTEM_ROLE_PREAMBLE_LINES = [
  "You are TheJudge assistant for Magic: The Gathering stack-resolution support.",
  "Use only the provided context to explain likely interactions and resolution order.",
  "Treat ordered stack semantics as authoritative: stack[0] is the bottom spell and the last entry is the top spell.",
  "State assumptions when context is incomplete.",
  "Do not claim hidden state, private-zone information, or unseen effects.",
  "Do not present output as an official tournament ruling."
] as const;

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

function truncatePromptLabel(value: string, maxChars: number): string {
  return truncateOracleText(value, maxChars);
}

export function formatConversationHistorySection(turns: ConversationTurn[]): string {
  if (turns.length === 0) return "";
  const lines = turns.map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${truncateOracleText(t.content, EFFECTIVELY_UNLIMITED_CHARS / 10)}`);
  return ["CONVERSATION HISTORY", ...lines].join("\n");
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "(none)";
}

export function buildPlayerDisplayNameLookup(
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

export function formatPlayerRef(
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

export function toPlayerLabelIndex(label: string): number {
  const index = PLAYER_LABELS.indexOf(label as (typeof PLAYER_LABELS)[number]);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function formatTargets(
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

/**
 * Builds one deterministic counter line for a populated player, or undefined when the
 * player has no populated poison/experience/energy/commanderDamage/counters (DEC-102).
 * Order: poison, experience, energy; commander-damage entries by PlayerLabel; then
 * generic counters in input order.
 */
function formatPlayerCounterLine(player: PromptContext["gameContext"]["players"][number]): string | undefined {
  const parts: string[] = [];

  if (typeof player.poison === "number" && player.poison > 0) {
    parts.push(`poison=${player.poison}`);
  }
  if (typeof player.experience === "number" && player.experience > 0) {
    parts.push(`experience=${player.experience}`);
  }
  if (typeof player.energy === "number" && player.energy > 0) {
    parts.push(`energy=${player.energy}`);
  }

  const commanderDamage = [...(player.commanderDamage ?? [])].sort(
    (left, right) => toPlayerLabelIndex(left.from) - toPlayerLabelIndex(right.from)
  );
  for (const entry of commanderDamage) {
    parts.push(`commanderDamage[${entry.from}]=${entry.amount}`);
  }

  for (const entry of player.counters ?? []) {
    parts.push(`${entry.name}=${entry.amount}`);
  }

  if (parts.length === 0) {
    return undefined;
  }

  return `${player.label} counters: ${parts.join(", ")}`;
}

export function formatGameContext(context: PromptContext): string {
  const players = [...context.gameContext.players].sort(
    (left, right) => toPlayerLabelIndex(left.label) - toPlayerLabelIndex(right.label)
  );
  const displayNamesByPlayer = buildPlayerDisplayNameLookup(players);

  return [
    `turnPhase: ${context.gameContext.turnPhase}`,
    `playerCount: ${context.gameContext.playerCount}`,
    ...players.flatMap((player) => {
      const display =
        player.displayName && player.displayName !== player.label
          ? ` displayName=${player.displayName}`
          : "";
      const lifeLine = `${player.label}: lifeTotal=${player.lifeTotal}${display}`;
      const counterLine = formatPlayerCounterLine(player);
      return counterLine ? [lifeLine, counterLine] : [lifeLine];
    }),
    ...(context.gameContext.activePlayer
      ? [`activePlayer: ${formatPlayerRef(context.gameContext.activePlayer, displayNamesByPlayer)}`]
      : [])
  ].join("\n");
}

export function formatZoneCardMetadataLines(
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

export function formatStackSection(context: PromptContext): string {
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

export function formatNonStackZoneSections(context: PromptContext): string {
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
