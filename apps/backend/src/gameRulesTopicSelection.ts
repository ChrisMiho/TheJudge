import type { GameRulesTopic } from "./gameRules.js";
import { conceptTermsForCards } from "./gameRulesConceptMap.js";
import { tokenizeSearchText } from "./gameRulesStemmer.js";
import type { PromptContext } from "./types/index.js";

/**
 * System 2 (curated general rules) topic selection — DEC-045.
 *
 * Selection reads game state — `turnPhase` and `combatStep` — plus card wording in two fixed forms:
 * the REQ-220 gate (when two or more cards carry the whole word "instead" or "prevent" in their
 * oracle text, the replacement-and-prevention interaction topic is added) and, in In-Depth only, the
 * REQ-242 trigger table (the topics that populated zones used to select are chosen by the cards'
 * concept terms and the question's words). No card names or keywords influence this selection (those
 * are System 3's job, DEC-046).
 */

/** Always included on every prompt regardless of game state. */
export const ALWAYS_ON_TOPIC_IDS = [
  "stack-and-priority",
  "targets-basics",
  "zones-basics",
  "abilities-trigger-basics"
] as const;

/**
 * REQ-242: the topics that a populated stack (five) or battlefield (six) used to add in In-Depth, now
 * chosen by wording. Each topic's trigger words are words of the topic's own title or of the section
 * titles of the rules it lists (the rule book's own words, never a keyword or a card name); a test
 * asserts that, and that every trigger word appears in the committed rule index. A topic is selected
 * when any trigger word matches (after the same stemming System 3 uses, REQ-233) a word of the
 * question or of a card's concept terms (REQ-234).
 */
export const IN_DEPTH_TOPIC_TRIGGERS: Readonly<Record<string, readonly string[]>> = {
  // formerly selected when the stack held cards
  "spell-casting-choices": ["casting", "choices", "targets"],
  "spell-casting-costs": ["casting", "costs", "completion"],
  "effects-resolution-targets": ["resolving", "targeted"],
  "copying-spells-abilities": ["copying"],
  "effects-source-impossible": ["impossible", "sources"],
  // formerly selected when the battlefield held cards
  "replacement-effects-basics": ["replacement"],
  "replacement-etb-effects": ["replacement", "enter"],
  "layers-order": ["layer", "continuous"],
  "layers-power-toughness": ["power", "toughness", "layers"],
  "layers-timestamps-dependencies": ["timestamps", "dependency", "continuous"],
  "abilities-zone-change-triggers": ["zone"]
};

const STEMMED_TRIGGERS: ReadonlyArray<readonly [string, ReadonlySet<string>]> = Object.entries(IN_DEPTH_TOPIC_TRIGGERS).map(
  ([id, words]) => [id, new Set(words.flatMap((word) => tokenizeSearchText(word)))] as const
);

/** REQ-242: the trigger-table topics the question's words and the cards' concept terms select. */
function selectTriggeredTopicIds(
  questionText: string,
  cards: ReadonlyArray<{ name: string; typeLine: string; oracleText: string }>
): string[] {
  const words = new Set(tokenizeSearchText([questionText, ...conceptTermsForCards(cards)].join(" ")));
  return STEMMED_TRIGGERS.filter(([, triggers]) => [...triggers].some((trigger) => words.has(trigger))).map(([id]) => id);
}

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
function collectContextCards(context: PromptContext): Array<{ name: string; typeLine: string; oracleText: string }> {
  return [...context.orderedStack, ...context.populatedZones.flatMap((zone) => zone.items)];
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
 * @param ruleQuestion The question whose words trigger topics (REQ-242). A request-driven caller passes
 *                  the one rule-selection question (`ruleSelectionQuestion`, REQ-246), the conversation's
 *                  opening question on a follow-up; a caller holding only a context (the offline
 *                  reports) has no history, so the context's own question stands in.
 * @returns Selected topics, deduplicated and sorted by `id` ascending.
 */
export function selectGameRulesTopics(
  context: PromptContext,
  allTopics: GameRulesTopic[],
  ruleQuestion: string = context.finalQuestion
): GameRulesTopic[] {
  const selectedIds = new Set<string>(ALWAYS_ON_TOPIC_IDS);

  // REQ-242: no zone-presence triggers; the cards' wording and the question choose these topics.
  for (const id of selectTriggeredTopicIds(ruleQuestion, collectContextCards(context))) selectedIds.add(id);

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
