import type { GameRulesTopic } from "./gameRules.js";
import type { PromptContext } from "./types/index.js";

/**
 * System 2 (curated general rules) topic selection — DEC-045.
 *
 * Selection is driven only by card-agnostic game-state signals: `turnPhase`,
 * `combatStep`, and populated-zone presence. No card names, oracle text, or
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
 * @param context  Normalized prompt context (game-state signals only are read).
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

  return allTopics
    .filter((topic) => selectedIds.has(topic.id))
    .sort((a, b) => a.id.localeCompare(b.id));
}
