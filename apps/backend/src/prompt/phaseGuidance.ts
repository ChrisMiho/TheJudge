import type { CombatStep, TurnPhase } from "../types/index.js";

const MAIN_PHASE_BASE =
  "You are in a main phase. The active player may cast spells of any type and activate abilities. " +
  "The stack must be empty and the active player must have priority to cast sorcery-speed spells.";

const POST_COMBAT_ADDENDUM =
  " Combat has concluded. \"Until end of turn\" effects granted during combat (such as pump spells, " +
  "first strike, or haste) are still active and will expire at the cleanup step.";

const COMBAT_STEP_TEXT: Record<CombatStep, string> = {
  beginning_of_combat:
    "You are in the beginning of combat step. Players may cast instants and activate abilities. " +
    "This is the last opportunity to affect potential attackers before they are declared.",
  declare_attackers:
    "You are in the declare attackers step. The active player has declared which creatures are " +
    "attacking and which players or planeswalkers they target. Triggered abilities that trigger on " +
    "attacking fire here; players may cast instants and activate abilities in response.",
  declare_blockers:
    "You are in the declare blockers step. The defending player has declared which creatures are " +
    "blocking which attackers. The active player orders damage assignment for multiply-blocked " +
    "creatures. Players may cast instants and activate abilities.",
  combat_damage:
    "You are in the combat damage step. Creatures deal their power as combat damage simultaneously " +
    "(unless first strike or double strike applies a separate first-strike damage step). " +
    "State-based actions are checked after damage is dealt.",
  end_of_combat:
    "You are in the end of combat step. Players receive priority. Triggered abilities that say " +
    "\"at end of combat\" trigger here. After this step, attacking and blocking creatures are no " +
    "longer considered attacking or blocking."
};

const GENERIC_COMBAT_GUIDANCE =
  "You are in the combat phase. This phase includes the beginning of combat, declare attackers, " +
  "declare blockers, combat damage, and end of combat steps. Players may cast instants and " +
  "activate abilities during each step.";

const PHASE_GUIDANCE: Record<Exclude<TurnPhase, "combat">, string> = {
  untap:
    "You are in the untap step. Permanents under the active player's control untap. Players do " +
    "not receive priority during untap under normal rules; triggered abilities that fire here are " +
    "placed on the stack and resolved before moving to the upkeep step.",
  upkeep:
    "You are in the upkeep step. Players receive priority and may cast instants or activate " +
    "abilities. Triggered abilities that say \"at the beginning of your upkeep\" trigger here.",
  draw:
    "You are in the draw step. The active player draws a card. Triggered abilities that fire on " +
    "drawing a card may trigger here. Players may cast instants or activate abilities after the " +
    "draw trigger resolves.",
  main_1: MAIN_PHASE_BASE,
  main_2: MAIN_PHASE_BASE + POST_COMBAT_ADDENDUM,
  end_step:
    "You are in the end step. Players receive priority. Triggered abilities that say \"at the " +
    "beginning of the end step\" trigger here. This is the last opportunity to cast instants or " +
    "activate abilities before the cleanup step.",
  cleanup:
    "You are in the cleanup step. The active player discards down to maximum hand size (usually " +
    "seven). Damage is removed from permanents and \"until end of turn\" effects expire. Players " +
    "do not receive priority during cleanup unless a triggered ability fires."
};

export function getPhaseGuidance(phase: TurnPhase, combatStep?: CombatStep): string {
  if (phase === "combat") {
    return combatStep ? COMBAT_STEP_TEXT[combatStep] : GENERIC_COMBAT_GUIDANCE;
  }
  return PHASE_GUIDANCE[phase];
}
