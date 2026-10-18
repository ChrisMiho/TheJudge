import { foldApostrophes } from "../gameRulesStemmer.js";
import type { CombatStep, TurnPhase } from "../types/index.js";

/**
 * REQ-024 / REQ-238: one source of turn-step text for both modes. In-Depth prefixes a step's
 * summary with "You are in the … step." (the game is in that step); Quick Lookup prints the same
 * summary as a description of the step, for the steps its question (or an attached card's concept
 * terms) names.
 */
export type TurnStepKey =
  | "untap"
  | "upkeep"
  | "draw"
  | "main"
  | "beginning_of_combat"
  | "declare_attackers"
  | "declare_blockers"
  | "combat_damage"
  | "end_of_combat"
  | "end"
  | "cleanup";

type StepSummary = {
  /** The rule book's name for the step or phase, lower case ("cleanup step"). */
  name: string;
  /** What happens in the step, checked against the Comprehensive Rules ids in `ruleIds`. */
  body: string;
  /** The rules the body summarises; a test asserts each exists in the committed rule index. */
  ruleIds: string[];
};

export const STEP_SUMMARIES: Record<TurnStepKey, StepSummary> = {
  untap: {
    name: "untap step",
    body:
      "Permanents under the active player's control untap. No player receives priority during the " +
      "untap step, so no spells can be cast and no abilities can be activated or resolve. An ability " +
      "that triggers during untap is held and put on the stack the next time a player would receive " +
      "priority, usually in the upkeep step.",
    ruleIds: ["502.1", "502.2", "502.3", "502.4"]
  },
  upkeep: {
    name: "upkeep step",
    body:
      "Players receive priority and may cast instants or activate abilities. Triggered abilities " +
      "that say \"at the beginning of your upkeep\" trigger here.",
    ruleIds: ["503.1", "503.1a"]
  },
  draw: {
    name: "draw step",
    body:
      "The active player draws a card, a turn-based action that doesn't use the stack, and then " +
      "receives priority. Triggered abilities that fire on drawing a card go on the stack before the " +
      "active player gets priority. Players may cast instants or activate abilities once priority is " +
      "given.",
    ruleIds: ["504.1", "504.2"]
  },
  main: {
    name: "main phase",
    body:
      "The active player may cast spells of any type and activate abilities. " +
      "The stack must be empty and the active player must have priority to cast sorcery-speed spells.",
    ruleIds: ["505.1", "505.2"]
  },
  beginning_of_combat: {
    name: "beginning of combat step",
    body:
      "Players may cast instants and activate abilities. " +
      "This is the last opportunity to affect potential attackers before they are declared.",
    ruleIds: ["507.1", "507.2"]
  },
  declare_attackers: {
    name: "declare attackers step",
    body:
      "The active player has declared which creatures are " +
      "attacking and which players or planeswalkers they target. Triggered abilities that trigger on " +
      "attacking fire here; players may cast instants and activate abilities in response.",
    ruleIds: ["508.1", "508.2"]
  },
  declare_blockers: {
    name: "declare blockers step",
    body:
      "The defending player has declared which creatures are " +
      "blocking which attackers. Players may cast instants and activate abilities.",
    ruleIds: ["509.1", "509.2"]
  },
  combat_damage: {
    name: "combat damage step",
    body:
      "Creatures deal their power as combat damage simultaneously " +
      "(unless first strike or double strike applies a separate first-strike damage step). " +
      "State-based actions are checked after damage is dealt.",
    ruleIds: ["510.1", "510.2", "510.3", "510.4"]
  },
  end_of_combat: {
    name: "end of combat step",
    body:
      "Players receive priority. Triggered abilities that say " +
      "\"at end of combat\" trigger here. After this step, attacking and blocking creatures are no " +
      "longer considered attacking or blocking.",
    ruleIds: ["511.1", "511.2", "511.3"]
  },
  end: {
    name: "end step",
    body:
      "Players receive priority. Triggered abilities that say \"at the " +
      "beginning of the end step\" trigger here. This is normally the last opportunity to cast instants or " +
      "activate abilities before the cleanup step.",
    ruleIds: ["513.1"]
  },
  cleanup: {
    name: "cleanup step",
    body:
      "The active player discards down to maximum hand size (normally seven). Then, at the same " +
      "time, all damage is removed from permanents and all \"until end of turn\" and \"this turn\" " +
      "effects end, before any player gets priority. Normally no player receives priority during " +
      "cleanup. The exception: if a state-based action would be performed or a triggered ability is " +
      "waiting to go on the stack at that point, those happen, the active player gets priority, " +
      "players may cast spells and activate abilities, and once the stack is empty and all players " +
      "pass in succession, another cleanup step begins.",
    ruleIds: ["514.1", "514.2", "514.3", "514.3a"]
  }
};

/** The steps in turn order. */
export const TURN_STEP_ORDER: readonly TurnStepKey[] = [
  "untap",
  "upkeep",
  "draw",
  "main",
  "beginning_of_combat",
  "declare_attackers",
  "declare_blockers",
  "combat_damage",
  "end_of_combat",
  "end",
  "cleanup"
];

/** REQ-238: at most this many step summaries reach a Quick Lookup prompt. */
const MAX_NAMED_STEP_SUMMARIES = 3;

/**
 * REQ-238: the one fixed table of the rule book's step and phase names. A Quick Lookup question (or an
 * attached card's concept terms, REQ-234) names a step when its text matches that step's pattern. "end"
 * is the end step (never "end of turn", which is a duration), "combat damage" is the combat damage step
 * (not the noun), and "draw" is the draw step (not drawing a card).
 */
const TURN_STEP_NAME_TABLE: ReadonlyArray<{ key: TurnStepKey; pattern: RegExp }> = [
  { key: "untap", pattern: /\buntap step\b/ },
  { key: "upkeep", pattern: /\bupkeep\b/ },
  { key: "draw", pattern: /\bdraw step\b/ },
  { key: "main", pattern: /\b(?:main phase|(?:pre|post)-?combat main|main (?:1|2|one|two)|(?:first|second) main)\b/ },
  { key: "beginning_of_combat", pattern: /\bbeginning of (?:the )?combat\b/ },
  { key: "declare_attackers", pattern: /\bdeclar(?:e|ing) attackers?\b/ },
  { key: "declare_blockers", pattern: /\bdeclar(?:e|ing) blockers?\b/ },
  { key: "combat_damage", pattern: /\b(?:first[- ]strike |regular )?combat damage step\b/ },
  { key: "end_of_combat", pattern: /\bend of combat\b/ },
  { key: "end", pattern: /\bend step\b/ },
  { key: "cleanup", pattern: /\bclean-?up\b/ }
];

/** REQ-238: the steps the texts name, de-duplicated, in turn order, at most three. */
export function namedTurnSteps(texts: readonly string[]): TurnStepKey[] {
  const haystack = foldApostrophes(texts.join("\n").toLowerCase());
  const named = TURN_STEP_NAME_TABLE.filter(({ pattern }) => pattern.test(haystack)).map(({ key }) => key);
  return TURN_STEP_ORDER.filter((key) => named.includes(key)).slice(0, MAX_NAMED_STEP_SUMMARIES);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** REQ-238: Quick Lookup's lines — each named step described, never claiming the game is in it. */
export function describeTurnSteps(keys: readonly TurnStepKey[]): string[] {
  return keys.map((key) => `${capitalize(STEP_SUMMARIES[key].name)}: ${STEP_SUMMARIES[key].body}`);
}

const POST_COMBAT_ADDENDUM =
  " Combat has concluded. \"Until end of turn\" effects granted during combat (such as pump spells, " +
  "first strike, or haste) are still active and will expire at the cleanup step.";

const GENERIC_COMBAT_GUIDANCE =
  "You are in the combat phase. This phase includes the beginning of combat, declare attackers, " +
  "declare blockers, combat damage, and end of combat steps. Players may cast instants and " +
  "activate abilities during each step.";

const COMBAT_STEP_KEY: Record<CombatStep, TurnStepKey> = {
  beginning_of_combat: "beginning_of_combat",
  declare_attackers: "declare_attackers",
  declare_blockers: "declare_blockers",
  combat_damage: "combat_damage",
  end_of_combat: "end_of_combat"
};

const PHASE_STEP_KEY: Record<Exclude<TurnPhase, "combat">, TurnStepKey> = {
  untap: "untap",
  upkeep: "upkeep",
  draw: "draw",
  main_1: "main",
  main_2: "main",
  end_step: "end",
  cleanup: "cleanup"
};

/** In-Depth: "You are in the … step." plus the step's summary (REQ-024). */
function inStepText(key: TurnStepKey): string {
  const { name, body } = STEP_SUMMARIES[key];
  const article = key === "main" ? "a" : "the";
  return `You are in ${article} ${name}. ${body}`;
}

/**
 * The turn step a phase (and, in combat, a combat step) is, or undefined for a phase outside the schema
 * or a combat with no (or an unknown) step. Takes plain strings so a caller holding loose values can ask.
 */
export function turnStepKeyFor(phase: string, combatStep?: string): TurnStepKey | undefined {
  const hasOwn = (table: object, key: string) => Object.prototype.hasOwnProperty.call(table, key);
  if (phase === "combat") {
    return combatStep !== undefined && hasOwn(COMBAT_STEP_KEY, combatStep)
      ? COMBAT_STEP_KEY[combatStep as CombatStep]
      : undefined;
  }
  return hasOwn(PHASE_STEP_KEY, phase) ? PHASE_STEP_KEY[phase as Exclude<TurnPhase, "combat">] : undefined;
}

export function getPhaseGuidance(phase: TurnPhase, combatStep?: CombatStep): string {
  if (phase === "combat") {
    return combatStep ? inStepText(COMBAT_STEP_KEY[combatStep]) : GENERIC_COMBAT_GUIDANCE;
  }
  const key = PHASE_STEP_KEY[phase];
  // A phase outside the schema (a legacy fixture value) has no guidance, as before.
  if (key === undefined) return "";
  const text = inStepText(key);
  return phase === "main_2" ? text + POST_COMBAT_ADDENDUM : text;
}
