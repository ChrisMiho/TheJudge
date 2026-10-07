// Answer-quality deterministic assertions (REQ-186 layer 1).
//
// Free, model-free, computed identically on every run: did the answer name a
// deciding rule id of the case, is it non-empty, how long is it, and which
// Comprehensive Rules ids does it cite that the committed rule index lacks.
// These are recorded per case per leg alongside the judge's axis scores
// (REQ-189) and are never folded into any axis score.

export type DeterministicAssertions = {
  /** Whether the answer text mentions one of the case's deciding rule ids. */
  namesGoldRuleId: boolean;
  /** Whether the answer text is non-empty once trimmed. */
  nonEmpty: boolean;
  /** The answer text's length in characters. */
  length: number;
  /**
   * Cited rule ids that are "not in the committed rule index". Present only
   * when the caller supplied the index's rule ids. This is not proof of a made-up
   * rule number: the committed index can lag the newest Comprehensive Rules
   * (five mechanics in the 2026-08-07 text are not in it), so a real, newer id
   * can appear here.
   */
  unknownRuleIds?: string[];
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
 * True when the answer names at least one of the case's deciding rule ids
 * (`expected.decidingRuleIds`). A case with multiple deciding ids is
 * satisfied by naming any one of them.
 */
export function namesGoldRuleId(answerText: string, decidingRuleIds: readonly string[]): boolean {
  return decidingRuleIds.some((ruleId) => namesRuleId(answerText, ruleId));
}

// A Comprehensive Rules subrule id as it appears in prose: three digits, a dot, one or more
// digits, an optional trailing letter ("603.7a", "702.19b", "100.1"). The lookbehind keeps a
// longer number ("1603.7") and a decimal ("0.603") from matching; the lookahead keeps a longer
// token ("603.7a9") and a further dotted number ("603.7.1") from matching, while still allowing
// a sentence-ending full stop ("... see 603.7a.").
const CITED_RULE_ID = /(?<![\w.])\d{3}\.\d+[a-z]?(?![\w]|\.\d)/g;

/** Every distinct rule id the answer text cites, in order of first appearance. */
export function citedRuleIds(answerText: string): string[] {
  return [...new Set(answerText.match(CITED_RULE_ID) ?? [])];
}

/**
 * The free made-up-rule-number check (REQ-186): cited rule ids the committed
 * rule index does not hold. Worded "not in the committed rule index", never
 * "made up", because the index lags the newest Comprehensive Rules.
 */
export function findUnknownRuleIds(answerText: string, knownRuleIds: ReadonlySet<string>): string[] {
  return citedRuleIds(answerText).filter((ruleId) => !knownRuleIds.has(ruleId));
}

export function computeDeterministicAssertions(
  answerText: string,
  decidingRuleIds: readonly string[],
  knownRuleIds?: ReadonlySet<string>
): DeterministicAssertions {
  const trimmed = answerText.trim();
  const assertions: DeterministicAssertions = {
    namesGoldRuleId: namesGoldRuleId(answerText, decidingRuleIds),
    nonEmpty: trimmed.length > 0,
    length: answerText.length
  };
  if (knownRuleIds) assertions.unknownRuleIds = findUnknownRuleIds(answerText, knownRuleIds);
  return assertions;
}
