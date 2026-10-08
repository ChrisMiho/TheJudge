import type { GameRulesTopic } from "./gameRules.js";
import type { PromptContext } from "./types/index.js";

/**
 * System 2 (curated general rules) topic selection — DEC-045.
 *
 * Selection reads game state — `turnPhase`, `combatStep`, and populated-zone
 * presence — plus one card-wording gate (REQ-220): when two or more cards carry
 * the whole word "instead" or "prevent" in their oracle text, the
 * replacement-and-prevention interaction topic is added. No card names or
 * keywords influence this selection (those are System 3's job, DEC-046).
 */

/** Always included on every prompt regardless of game state. */
export const ALWAYS_ON_TOPIC_IDS = [
  "stack-and-priority",
  "targets-basics",
  "zones-basics",
  "abilities-trigger-basics"
] as const;

/** Added when the stack zone is non-empty. */
const STACK_TOPIC_IDS = [
  "spell-casting-choices",
  "spell-casting-costs",
  "effects-resolution-targets",
  "copying-spells-abilities",
  "effects-source-impossible"
] as const;

/** Added when the battlefield zone is populated. */
const BATTLEFIELD_TOPIC_IDS = [
  "replacement-effects-basics",
  "replacement-etb-effects",
  "layers-order",
  "layers-power-toughness",
  "layers-timestamps-dependencies",
  "abilities-zone-change-triggers"
] as const;

const COMBAT_STRUCTURE_TOPIC_ID = "combat-phase-structure";
const COMBAT_DECLARE_ATTACKERS_TOPIC_ID = "combat-declare-attackers";
const COMBAT_DECLARE_BLOCKERS_TOPIC_ID = "combat-declare-blockers";

/** Combat-damage step topics (also part of the full combat fallback set). */
const COMBAT_DAMAGE_TOPIC_IDS = [
  "combat-damage-assignment",
  "damage-basics",
  "damage-marked-lethal",
  "damage-lifelink-deathtouch"
] as const;

/** Full combat + damage set, used when `combatStep` is absent or unrecognized. */
const FULL_COMBAT_TOPIC_IDS = [
  COMBAT_STRUCTURE_TOPIC_ID,
  COMBAT_DECLARE_ATTACKERS_TOPIC_ID,
  COMBAT_DECLARE_BLOCKERS_TOPIC_ID,
  ...COMBAT_DAMAGE_TOPIC_IDS
] as const;

/** Added during upkeep/draw/end_step/cleanup phases. */
const DELAYED_TRIGGER_TOPIC_ID = "abilities-delayed-triggers";

const DELAYED_TRIGGER_PHASES = new Set(["upkeep", "draw", "end_step", "cleanup"]);

/** REQ-220: how replacement and prevention effects interact (614.1a, 616.1, 616.2). */
export const REPLACEMENT_INTERACTION_TOPIC_ID = "replacement-effects-interaction";

/** Whole words only: "prevention" and "preventing" do not count. */
const REPLACEMENT_WORDING = /\binstead\b|\bprevent(?:s|ed)?\b/i;

/**
 * REQ-220: the card-wording gate. Reads only each card's `oracleText`; with two
 * or more cards carrying replacement or prevention wording it returns the
 * interaction topic id, otherwise nothing. Two copies of one card count as two.
 * One function for lookup mode and game mode, so the two cannot drift apart.
 */
export function selectCardWordingTopicIds(cards: ReadonlyArray<{ oracleText: string }>): string[] {
  const marked = cards.filter((card) => REPLACEMENT_WORDING.test(card.oracleText)).length;
  return marked >= 2 ? [REPLACEMENT_INTERACTION_TOPIC_ID] : [];
}

/** Every card on the stack and in any populated zone — the set System 3 reads. */
function collectContextCards(context: PromptContext): Array<{ oracleText: string }> {
  return [...context.orderedStack, ...context.populatedZones.flatMap((zone) => zone.items)];
}

function isStackPopulated(context: PromptContext): boolean {
  return context.orderedStack.length > 0;
}

function isBattlefieldPopulated(context: PromptContext): boolean {
  return context.populatedZones.some(
    (zone) => zone.zoneId === "battlefield" && zone.items.length > 0
  );
}

function collectCombatTopicIds(context: PromptContext): string[] {
  const { combatStep } = context.gameContext;

  switch (combatStep) {
    case "declare_attackers":
      return [COMBAT_STRUCTURE_TOPIC_ID, COMBAT_DECLARE_ATTACKERS_TOPIC_ID];
    case "declare_blockers":
      return [COMBAT_STRUCTURE_TOPIC_ID, COMBAT_DECLARE_BLOCKERS_TOPIC_ID];
    case "combat_damage":
      return [COMBAT_STRUCTURE_TOPIC_ID, ...COMBAT_DAMAGE_TOPIC_IDS];
    default:
      // Absent or other combatStep (beginning_of_combat, end_of_combat): full set.
      return [...FULL_COMBAT_TOPIC_IDS];
  }
}

/**
 * Select the System 2 curated topics relevant to the current game state.
 *
 * @param context  Normalized prompt context (game-state signals plus the cards'
 *                 oracle text for the REQ-220 wording gate are read).
 * @param allTopics Full topic list loaded at startup; output is filtered to ids
 *                  present here. Unknown selected ids are ignored, and missing
 *                  manifest ids are no-ops.
 * @returns Selected topics, deduplicated and sorted by `id` ascending.
 */
export function selectGameRulesTopics(
  context: PromptContext,
  allTopics: GameRulesTopic[]
): GameRulesTopic[] {
  const selectedIds = new Set<string>(ALWAYS_ON_TOPIC_IDS);

  if (isStackPopulated(context)) {
    for (const id of STACK_TOPIC_IDS) selectedIds.add(id);
  }

  if (isBattlefieldPopulated(context)) {
    for (const id of BATTLEFIELD_TOPIC_IDS) selectedIds.add(id);
  }

  if (context.gameContext.turnPhase === "combat") {
    for (const id of collectCombatTopicIds(context)) selectedIds.add(id);
  }

  if (DELAYED_TRIGGER_PHASES.has(context.gameContext.turnPhase)) {
    selectedIds.add(DELAYED_TRIGGER_TOPIC_ID);
  }

  for (const id of selectCardWordingTopicIds(collectContextCards(context))) selectedIds.add(id);

  return allTopics
    .filter((topic) => selectedIds.has(topic.id))
    .sort((a, b) => a.id.localeCompare(b.id));
}
