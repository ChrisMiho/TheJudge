import {
  MAX_CONTEXT_NOTES_CHARS,
  MAX_CONVERSATION_TURN_CHARS,
  MAX_TARGET_LABEL_CHARS,
  truncateOracleText
} from "./normalization.js";
import { CANONICAL_ZONE_ORDER, PLAYER_LABELS } from "../constants.js";
import type { ResolvedRulings } from "../cardRulings.js";
import type { ConversationTurn, PlayerLabel, PromptContext, ZoneId } from "../types/index.js";

/**
 * The preamble lines every prompt carries. "Use only the provided context" stays as it was
 * (REQ-243: its wording is left for a later paid test).
 */
const PREAMBLE_HEAD = [
  "You are TheJudge assistant for Magic: The Gathering stack-resolution support.",
  "Use only the provided context to explain likely interactions and resolution order."
] as const;

const PREAMBLE_TAIL = [
  "State assumptions when context is incomplete.",
  "Do not claim hidden state, private-zone information, or unseen effects.",
  "Do not present output as an official tournament ruling."
] as const;

/** REQ-243: the stack is numbered one way, 1-based like the stack section's `Stack item N` labels. */
const STACK_ORDER_PREAMBLE_LINE =
  "Treat ordered stack semantics as authoritative: Stack item 1 is the bottom of the stack and the highest-numbered Stack item is the top.";

/** In-Depth preamble: carries the stack-order line, since only In-Depth sends a stack. */
export const SYSTEM_ROLE_PREAMBLE_LINES = [...PREAMBLE_HEAD, STACK_ORDER_PREAMBLE_LINE, ...PREAMBLE_TAIL] as const;

/** Quick Lookup preamble: the same lines without the stack-order line (REQ-243). */
export const LOOKUP_ROLE_PREAMBLE_LINES = [...PREAMBLE_HEAD, ...PREAMBLE_TAIL] as const;

/**
 * REQ-243: one instruction list for both modes. The rules are framed once as binding, and one line says
 * they never override the submitted game state or a card's oracle text. Nothing here names a section
 * only one mode contains.
 */
export const SHARED_INSTRUCTION_LINES = [
  "- Explain reasoning clearly and concisely.",
  "- State uncertainty when context is incomplete.",
  "- Do not invent hidden state, targets, or board conditions.",
  "- For verbatim fidelity, quote rule text only from the rules sections of this prompt; present genuinely relevant excerpts verbatim with an explanation; never invent rule numbers or text.",
  "- The Comprehensive Rules excerpts in this prompt are the binding rules of the game.",
  "- Rules and rulings never override the submitted game state (stack order, zones, targets, notes) or a card's oracle text."
] as const;

/**
 * REQ-168 (REQ-243): Quick Lookup's off-domain line -- common Magic-adjacent phrasing is in-domain; the
 * "not found in the rules corpus" reply is reserved for input genuinely not about Magic.
 */
export const LOOKUP_OFF_DOMAIN_INSTRUCTION =
  "- Treat common Magic-adjacent phrasing (combo, infinite combo, aggro, control, ramp, tempo, stax, wheel, mill, blink, sacrifice outlet, and similar community terms) as in-domain and answer it normally; reserve the \"not found in the rules corpus\" reply for input that is genuinely not about Magic, and then ask the player to check spelling or rephrase toward a Magic term; never answer an off-domain question directly.";

/** In-Depth's follow-up line (a conversation already in progress). */
export const GAME_FOLLOW_UP_INSTRUCTION =
  "- Treat follow-up questions as refinements or clarifications against the frozen game state and prior answers.";

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

export function formatConversationHistorySection(turns: ConversationTurn[]): string {
  if (turns.length === 0) return "";
  const lines = turns.map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${truncateOracleText(t.content, MAX_CONVERSATION_TURN_CHARS)}`);
  return ["CONVERSATION HISTORY", ...lines].join("\n");
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "(none)";
}

function buildPlayerDisplayNameLookup(
  players: PromptContext["gameContext"]["players"]
): Record<PlayerLabel, string | undefined> {
  return Object.fromEntries(players.map((player) => [player.label, player.displayName])) as Record<
    PlayerLabel,
    string | undefined
  >;
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
  const index = PLAYER_LABELS.indexOf(label as (typeof PLAYER_LABELS)[number]);
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
        return `other:${truncateOracleText(target.targetDescription, MAX_TARGET_LABEL_CHARS)}`;
      }

      if (target.kind === "player") {
        return `player:${formatPlayerRef(target.targetPlayer, displayNamesByPlayer)}`;
      }

      if (target.kind === "battlefield") {
        return `battlefield:${truncateOracleText(target.targetPermanent, MAX_TARGET_LABEL_CHARS)}`;
      }

      return `stack:${truncateOracleText(target.targetCardName, MAX_TARGET_LABEL_CHARS)}`;
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

/** What a card's metadata lines add beyond the card's own fields, each in its final position. */
export type CardMetadataLineOptions = {
  /** Stack items only: the caster line, printed right before `targets:`. */
  caster?: string;
  /** Printed right after `targets:` when given. */
  manaSpent?: number;
  /** Stack items only (REQ-211): printed right after `manaSpent:` when given. */
  copies?: number;
  /** `false` leaves out `targets:` and `contextNotes:` (a looked-up card is not part of a game). Default `true`. */
  includeTargetsAndNotes?: boolean;
};

/**
 * One card's metadata lines in their final order: the card's own fields, then (for a card in a game)
 * caster, targets, mana spent, copies and context notes, then the oracle text.
 */
export function formatZoneCardMetadataLines(
  card: {
    manaCost: string;
    manaValue: number;
    typeLine: string;
    colors: string[];
    supertypes: string[];
    subtypes: string[];
    /** REQ-245: printed as their own lines when the card has them. */
    power?: string;
    toughness?: string;
    loyalty?: string;
    targets?: PromptContext["orderedStack"][number]["targets"];
    contextNotes?: string;
    oracleText: string;
    /** REQ-245: the oracle text with its line breaks kept; falls back to `oracleText`. */
    oracleTextDisplay?: string;
  },
  displayNamesByPlayer: Record<PlayerLabel, string | undefined>,
  options: CardMetadataLineOptions = {}
): string[] {
  const includeTargetsAndNotes = options.includeTargetsAndNotes ?? true;
  return [
    `manaCost: ${card.manaCost || "(none)"}`,
    `manaValue: ${card.manaValue}`,
    `typeLine: ${card.typeLine || "(none)"}`,
    `colors: ${formatList(card.colors)}`,
    `supertypes: ${formatList(card.supertypes)}`,
    `subtypes: ${formatList(card.subtypes)}`,
    ...(card.power ? [`power: ${card.power}`] : []),
    ...(card.toughness ? [`toughness: ${card.toughness}`] : []),
    ...(card.loyalty ? [`loyalty: ${card.loyalty}`] : []),
    ...(options.caster !== undefined ? [`caster: ${options.caster}`] : []),
    ...(includeTargetsAndNotes ? [`targets: ${formatTargets(card.targets ?? [], displayNamesByPlayer)}`] : []),
    ...(options.manaSpent !== undefined ? [`manaSpent: ${options.manaSpent}`] : []),
    ...(options.copies !== undefined ? [`copies: ${options.copies}`] : []),
    ...(includeTargetsAndNotes
      ? [`contextNotes: ${card.contextNotes ? truncateOracleText(card.contextNotes, MAX_CONTEXT_NOTES_CHARS) : "(none)"}`]
      : []),
    `oracleText: ${card.oracleTextDisplay || card.oracleText || "(none) — no oracle text recorded for this card"}`
  ];
}

/** REQ-241: the rulings of a card, once, under its first appearance. */
export type RulingsPlacement = {
  /** The lines to print under this card: a framing line and its rulings, or none (no rulings, or already printed). */
  take(cardId: string, name: string): string[];
};

export function createRulingsPlacement(resolved: ResolvedRulings | undefined): RulingsPlacement {
  const byCardId = new Map((resolved?.cards ?? []).filter((card) => card.rulings.length > 0).map((card) => [card.cardId, card]));
  const shown = new Set<string>();
  return {
    take(cardId, name) {
      const card = byCardId.get(cardId);
      if (!card || shown.has(cardId)) return [];
      shown.add(cardId);
      return [
        `Rulings for ${name} (published by Wizards of the Coast; apply one only when the situation matches it):`,
        ...card.rulings.map((ruling) => `- ${ruling.publishedAt}: ${ruling.comment}`)
      ];
    }
  };
}

export function formatStackSection(context: PromptContext, rulings?: RulingsPlacement): string {
  if (context.orderedStack.length === 0) {
    return "";
  }

  const displayNamesByPlayer = buildPlayerDisplayNameLookup(context.gameContext.players);
  const cardsSection = context.orderedStack
    .map((card, index) => {
      // Stack-only fields: caster before targets, then manaSpent. REQ-211: copies (the storm case)
      // is sent only when the player set it above 0 — an untouched card adds no line, keeping
      // every prompt that doesn't use this byte-identical.
      const metaLines = formatZoneCardMetadataLines(card, displayNamesByPlayer, {
        caster: formatPlayerRef(card.caster, displayNamesByPlayer),
        manaSpent: card.manaSpent ?? card.manaValue,
        copies: card.copies
      });
      return [
        `Stack item ${index + 1} (${card.stackRole})`,
        `card: ${card.name}`,
        ...metaLines,
        ...(rulings?.take(card.cardId, card.name) ?? [])
      ].join("\n");
    })
    .join("\n\n");

  return ["ZONE: STACK (BOTTOM TO TOP)", cardsSection].join("\n");
}

export function formatNonStackZoneSections(context: PromptContext, rulings?: RulingsPlacement): string {
  if (context.populatedZones.length === 0) {
    return "";
  }

  const displayNamesByPlayer = buildPlayerDisplayNameLookup(context.gameContext.players);
  return context.populatedZones
    .map((zone) => {
      const sectionHeader = ZONE_SECTION_LABEL[zone.zoneId] ?? `ZONE: ${zone.zoneId.toUpperCase()}`;
      const itemLabel = ZONE_ITEM_LABEL[zone.zoneId] ?? zone.zoneId;
      const itemsText = zone.items
        .map((item, index) => {
          // REQ-210: an explicitly sent mana-spent value prints right after targets (the same
          // relative position the Stack's own manaSpent line takes) — an untouched card (no
          // sent value) adds no line, so today's prompts stay byte-identical.
          const metaLines = formatZoneCardMetadataLines(item, displayNamesByPlayer, { manaSpent: item.manaSpent });
          return [
            `${itemLabel} ${index + 1}`,
            `name: ${item.name}`,
            `owner: ${formatPlayerRef(item.owner, displayNamesByPlayer)}`,
            ...metaLines,
            ...(rulings?.take(item.cardId, item.name) ?? [])
          ].join("\n");
        })
        .join("\n\n");
      return [sectionHeader, itemsText].join("\n");
    })
    .join("\n\n");
}

/**
 * Builds the scope sentence listing every canonical zone that has no cards in
 * this submission (all canonical zones minus the populated ones, in canonical
 * order). The selection set is not consulted.
 */
export function buildZoneScopeSentence(populatedZoneIds: ZoneId[]): string {
  const populatedSet = new Set<string>(populatedZoneIds);
  const scopeZones = CANONICAL_ZONE_ORDER.filter((z) => !populatedSet.has(z));
  if (scopeZones.length === 0) {
    return "(all zones included)";
  }
  return `Zones with no cards or not included in this submission (ignore for scope unless the question says otherwise): ${scopeZones.join(", ")}.`;
}
