import {
  DEFAULT_BOARD_QUESTION,
  DEFAULT_STACK_QUESTION,
  NON_STACK_CANONICAL_ZONE_ORDER
} from "../constants.js";
import type {
  ContextTarget,
  GameAskAiRequest,
  LookupAskAiRequest,
  LookupPromptCard,
  LookupPromptContext,
  PromptContext,
  PromptContextStackItem,
  PromptContextStackTarget,
  PromptContextZoneItem
} from "../types/index.js";
import { normalizeCardText, normalizeQuestion, normalizeWhitespace } from "./normalization.js";

function toStackRole(stackIndex: number, stackLength: number): PromptContextStackItem["stackRole"] {
  if (stackIndex === stackLength - 1) {
    return "top";
  }

  if (stackIndex === 0) {
    return "bottom";
  }

  return "middle";
}

function normalizeTagList(values: string[]): string[] {
  return [...new Set(values.map((value) => normalizeWhitespace(value)).filter((value) => value.length > 0))];
}

function normalizeOptionalText(value: string | undefined): string {
  return normalizeWhitespace(value ?? "");
}

function normalizeOptionalList(values: string[] | undefined): string[] {
  return normalizeTagList(values ?? []);
}

function normalizeContextTarget(target: ContextTarget): PromptContextStackTarget | null {
  if (target.kind === "none") {
    return { kind: "none" };
  }

  if (target.kind === "other") {
    const targetDescription = normalizeWhitespace(target.targetDescription);
    if (targetDescription.length === 0) {
      return null;
    }
    return { kind: "other", targetDescription };
  }

  if (target.kind === "player") {
    return { kind: "player", targetPlayer: target.targetPlayer };
  }

  // kind === "card": map to internal stack or battlefield target based on zone
  const cardName = normalizeWhitespace(target.cardName);
  const cardId = normalizeWhitespace(target.cardId);

  if (cardName.length === 0 || cardId.length === 0) {
    return null;
  }

  if (target.zone === "battlefield") {
    return { kind: "battlefield", targetPermanent: cardName };
  }

  return { kind: "stack", targetCardId: cardId, targetCardName: cardName };
}

function normalizeTargets(targets: ContextTarget[] | undefined): PromptContextStackTarget[] {
  return (targets ?? [])
    .map((target) => normalizeContextTarget(target))
    .filter((target): target is PromptContextStackTarget => target !== null);
}

function normalizeOptionalNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function normalizeLifeTotal(value: number): number {
  return Number.isFinite(value) ? Math.trunc(value) : 20;
}

type PlayerCounterFields = GameAskAiRequest["gameContext"]["players"][number];
type CommanderDamageEntry = NonNullable<PlayerCounterFields["commanderDamage"]>[number];
type NamedCounterEntry = NonNullable<PlayerCounterFields["counters"]>[number];

/** Normalizes a counter amount to a positive integer, or undefined if zero/unset (DEC-102). */
function normalizeCounterAmount(value: number | undefined): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const truncated = Math.trunc(value);
  return truncated > 0 ? truncated : undefined;
}

function normalizeCommanderDamage(entries: CommanderDamageEntry[] | undefined): CommanderDamageEntry[] {
  return (entries ?? []).reduce<CommanderDamageEntry[]>((normalized, entry) => {
    const amount = normalizeCounterAmount(entry.amount);
    if (amount !== undefined) {
      normalized.push({ from: entry.from, amount });
    }
    return normalized;
  }, []);
}

function normalizeNamedCounters(entries: NamedCounterEntry[] | undefined): NamedCounterEntry[] {
  return (entries ?? []).reduce<NamedCounterEntry[]>((normalized, entry) => {
    const amount = normalizeCounterAmount(entry.amount);
    const name = normalizeWhitespace(entry.name);
    if (amount !== undefined && name.length > 0) {
      normalized.push({ name, amount });
    }
    return normalized;
  }, []);
}

function normalizeZoneItem(card: import("../types/index.js").ZoneCardItem): PromptContextZoneItem | null {
  const name = normalizeWhitespace(card.name);
  if (name.length === 0) return null;
  const owner = card.owner;
  return {
    cardId: normalizeWhitespace(card.cardId),
    name,
    oracleText: normalizeCardText(card.oracleText),
    imageUrl: normalizeOptionalText(card.imageUrl),
    manaCost: normalizeOptionalText(card.manaCost),
    manaValue: normalizeOptionalNumber(card.manaValue),
    typeLine: normalizeOptionalText(card.typeLine),
    colors: normalizeOptionalList(card.colors),
    supertypes: normalizeOptionalList(card.supertypes),
    subtypes: normalizeOptionalList(card.subtypes),
    owner: owner && normalizeWhitespace(owner).length > 0 ? owner : undefined,
    targets: normalizeTargets(card.targets),
    contextNotes: normalizeOptionalText(card.contextNotes) || undefined
  };
}

function normalizeLookupCard(card: NonNullable<LookupAskAiRequest["cards"]>[number]): LookupPromptCard | undefined {
  const normalized = normalizeZoneItem({ ...card, targets: [] });
  if (!normalized) return undefined;
  const lookupCard = { ...normalized };
  delete lookupCard.owner;
  delete lookupCard.contextNotes;
  return lookupCard;
}

/** REQ-167: normalizes the bounded (max 5) attached-card list. */
function normalizeLookupCards(cards: LookupAskAiRequest["cards"]): LookupPromptCard[] {
  return (cards ?? [])
    .map((card) => normalizeLookupCard(card))
    .filter((card): card is LookupPromptCard => card !== undefined);
}

function resolveFallbackQuestion(zones: GameAskAiRequest["gameContext"]["zones"] | undefined): string {
  if ((zones?.stack?.length ?? 0) > 0) {
    return DEFAULT_STACK_QUESTION;
  }

  const hasNonStackCards = NON_STACK_CANONICAL_ZONE_ORDER.some(
    (zoneId) => (zones?.[zoneId]?.length ?? 0) > 0
  );

  return hasNonStackCards ? DEFAULT_BOARD_QUESTION : DEFAULT_STACK_QUESTION;
}

export function buildPromptContext(payload: GameAskAiRequest): PromptContext {
  const normalizedQuestion = normalizeQuestion(payload.question);
  const gameCtx = payload.gameContext;

  const normalizedGameContext = {
    playerCount: gameCtx.playerCount,
    players: gameCtx.players.map((player) => {
      const poison = normalizeCounterAmount(player.poison);
      const experience = normalizeCounterAmount(player.experience);
      const energy = normalizeCounterAmount(player.energy);
      const commanderDamage = normalizeCommanderDamage(player.commanderDamage);
      const counters = normalizeNamedCounters(player.counters);

      return {
        label: player.label,
        lifeTotal: normalizeLifeTotal(player.lifeTotal),
        displayName: normalizeOptionalText(player.displayName) || undefined,
        ...(poison !== undefined ? { poison } : {}),
        ...(experience !== undefined ? { experience } : {}),
        ...(energy !== undefined ? { energy } : {}),
        ...(commanderDamage.length > 0 ? { commanderDamage } : {}),
        ...(counters.length > 0 ? { counters } : {})
      };
    }),
    turnPhase: gameCtx.turnPhase,
    ...(gameCtx.combatStep !== undefined ? { combatStep: gameCtx.combatStep } : {}),
    activePlayer: gameCtx.activePlayer,
    selectedZones: gameCtx.selectedZones
  };

  const stackZoneCards = gameCtx.zones?.stack ?? [];

  const zonesMap = (gameCtx.zones ?? {}) as Record<string, import("../types/index.js").ZoneCardItem[] | undefined>;

  const populatedZones = NON_STACK_CANONICAL_ZONE_ORDER
    .map((zoneId) => {
      const cards = zonesMap[zoneId] ?? [];
      const items = cards
        .map((card) => normalizeZoneItem(card))
        .filter((item): item is PromptContextZoneItem => item !== null);
      if (items.length === 0) return null;
      return { zoneId, items };
    })
    .filter((z): z is NonNullable<typeof z> => z !== null);

  return {
    finalQuestion:
      normalizedQuestion.length > 0 ? normalizedQuestion : resolveFallbackQuestion(gameCtx.zones),
    gameContext: normalizedGameContext,
    populatedZones,
    orderedStack: stackZoneCards.map((card, stackIndex, stack) => ({
      cardId: normalizeWhitespace(card.cardId),
      name: normalizeWhitespace(card.name),
      oracleText: normalizeCardText(card.oracleText),
      imageUrl: normalizeOptionalText(card.imageUrl),
      manaCost: normalizeOptionalText(card.manaCost),
      manaValue: normalizeOptionalNumber(card.manaValue),
      typeLine: normalizeOptionalText(card.typeLine),
      colors: normalizeOptionalList(card.colors),
      supertypes: normalizeOptionalList(card.supertypes),
      subtypes: normalizeOptionalList(card.subtypes),
      caster: card.caster ?? "Player 1",
      targets: normalizeTargets(card.targets),
      contextNotes: normalizeOptionalText(card.contextNotes) || undefined,
      manaSpent:
        typeof card.manaSpent === "number" && Number.isFinite(card.manaSpent) && card.manaSpent >= 0
          ? card.manaSpent
          : normalizeOptionalNumber(card.manaValue),
      stackIndex,
      stackRole: toStackRole(stackIndex, stack.length)
    }))
  };
}

export function buildLookupPromptContext(payload: LookupAskAiRequest): LookupPromptContext {
  const cards = normalizeLookupCards(payload.cards);
  return {
    finalQuestion: normalizeQuestion(payload.question),
    ...(cards.length > 0 ? { cards } : {}),
    ...(payload.conversationHistory ? { conversationHistory: payload.conversationHistory } : {})
  };
}
