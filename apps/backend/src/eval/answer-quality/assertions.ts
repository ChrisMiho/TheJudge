// Answer-quality deterministic assertions (REQ-186 layer 1).
//
// Free, model-free, computed identically on every run: did the answer name
// the gold case's rule id, is it non-empty, and how long is it. These are
// recorded per case per leg alongside the judge's axis scores (REQ-189) and
// are never folded into any axis score.

export type DeterministicAssertions = {
  /** Whether the answer text mentions the gold case's expected rule id. */
  namesGoldRuleId: boolean;
  /** Whether the answer text is non-empty once trimmed. */
  nonEmpty: boolean;
  /** The answer text's length in characters. */
  length: number;
};

/**
 * A rule id like "603.7a" can appear in prose with adjacent punctuation
 * ("rule 603.7a," or "(603.7a)") or as a bare token; this matches the id as
 * a whole word so "603.7" doesn't false-positive on a mention of "603.7a".
 */
function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function namesRuleId(answerText: string, ruleId: string): boolean {
  if (!ruleId) return false;
  const pattern = new RegExp(`(?<![\\w.])${escapeForRegExp(ruleId)}(?![\\w.])`);
  return pattern.test(answerText);
}

/**
 * True when the answer names at least one of the gold case's
 * `expectedSupplementalRuleIds`. A case with multiple expected ids (rare) is
 * satisfied by naming any one of them.
 */
export function namesGoldRuleId(answerText: string, expectedSupplementalRuleIds: readonly string[]): boolean {
  return expectedSupplementalRuleIds.some((ruleId) => namesRuleId(answerText, ruleId));
}

export function computeDeterministicAssertions(
  answerText: string,
  expectedSupplementalRuleIds: readonly string[]
): DeterministicAssertions {
  const trimmed = answerText.trim();
  return {
    namesGoldRuleId: namesGoldRuleId(answerText, expectedSupplementalRuleIds),
    nonEmpty: trimmed.length > 0,
    length: answerText.length
  };
}
