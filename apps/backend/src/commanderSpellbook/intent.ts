/**
 * The single combo-intent detector, imported by both the game and lookup paths.
 *
 * Deliberately narrow: these terms mean the user is asking about a combo, not
 * merely about how two cards interact. Broad language — "synergy",
 * "interaction", "works with" — must not activate partial combo retrieval,
 * because that would pull speculative combo lists into ordinary rules questions.
 *
 * Detection is deterministic and word/phrase-boundary anchored. No model call.
 */
export const COMBO_INTENT_TERMS: readonly string[] = Object.freeze([
  "combo",
  "combos",
  "infinite",
  "go infinite",
  "goes infinite",
  "loop",
  "win condition"
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * One alternation of boundary-anchored terms. Multi-word phrases tolerate any
 * run of whitespace so "win  condition" and "win\ncondition" still match.
 */
const COMBO_INTENT_PATTERN = new RegExp(
  `\\b(?:${COMBO_INTENT_TERMS.map((term) => escapeRegExp(term).replace(/\s+/g, "\\s+")).join("|")})\\b`,
  "i"
);

/**
 * `true` when the text explicitly asks about a combo. Boundary anchoring is what
 * keeps "comboing" and "discombobulate" from matching "combo".
 */
export function hasExplicitComboIntent(text: string | undefined): boolean {
  if (!text) return false;
  return COMBO_INTENT_PATTERN.test(text);
}
