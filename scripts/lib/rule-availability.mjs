// Where a deciding rule's text can reach the prompt (REQ-229, REQ-189).
//
// A deciding rule is "available to answer" when its text is anywhere in the
// final prompt: a supplemental excerpt System 3 selected, a curated rules topic
// that already carries it, or a published card ruling that quotes it. This
// module is the one place that decides it, so the evidence trace and the
// `allDecidingRulesInPrompt` field of an answer record cannot drift apart.
//
// Pure over plain data (no TypeScript, no file, no network): runs under
// `node --test`. Callers hand it what the production prompt builder exposes --
// the enrichment debug block, the attached cards' rulings, the rule index.

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collapse(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

/** True when `text` names the rule exactly: "514.3" is not a mention of "514.3a" or "514.30". */
export function mentionsRule(text, ruleId) {
  return new RegExp(`(?<![\\w.])${escapeRegExp(ruleId)}(?![\\w]|\\.\\d)`).test(text);
}

/** The rule one level up: "514.3a" -> "514.3". A rule with no trailing letter has none. */
export function parentRuleId(ruleId) {
  const match = /^(\d+\.\d+)[a-z]+$/.exec(ruleId);
  return match ? match[1] : null;
}

/** The lettered subrules of a rule, from the committed rule index: "514.3" -> ["514.3a", ...]. */
export function letteredSubrules(ruleId, indexRuleIds) {
  if (parentRuleId(ruleId)) return [];
  const pattern = new RegExp(`^${escapeRegExp(ruleId)}[a-z]+$`);
  return [...indexRuleIds].filter((candidate) => pattern.test(candidate)).sort();
}

/** The card ids a request attaches, in a lookup (`cards`) or an In-Depth request (zone cards). */
export function attachedCardIds(request) {
  const ids = new Set();
  for (const card of request?.cards ?? []) if (card?.cardId) ids.add(card.cardId);
  for (const items of Object.values(request?.gameContext?.zones ?? {})) {
    for (const item of items ?? []) if (item?.cardId) ids.add(item.cardId);
  }
  return [...ids];
}

/**
 * The ruling comments that reached the prompt: every published ruling of an
 * attached card whose printed line (`- <date>: <comment>`) is in the prompt text.
 */
export function rulingCommentsInPrompt({ request, promptText, cardRulingsIndex }) {
  const collapsedPrompt = collapse(promptText ?? "");
  const comments = [];
  for (const cardId of attachedCardIds(request)) {
    for (const ruling of cardRulingsIndex?.get?.(cardId) ?? []) {
      if (collapsedPrompt.includes(collapse(`- ${ruling.publishedAt}: ${ruling.comment}`))) comments.push(ruling.comment);
    }
  }
  return comments;
}

/** How one rule is (or is not) available: selected excerpt, curated topic, ruling quote. */
export function ruleAvailability(ruleId, { selectedRuleIds, curatedRuleIds, rulingComments }) {
  const selectedInSearch = selectedRuleIds.has(ruleId);
  const curatedTopic = curatedRuleIds.has(ruleId);
  const rulingQuote = rulingComments.some((comment) => mentionsRule(comment, ruleId));
  return { ruleId, selectedInSearch, curatedTopic, rulingQuote, availableToAnswer: selectedInSearch || curatedTopic || rulingQuote };
}

/** The sets a prepared prompt exposes: selected excerpt ids, the ruleNumbers of the curated topics it carries. */
export function availabilityInputsFrom({ prepared, request, cardRulingsIndex, extraRuleIds = [] }) {
  const debug = prepared?.enrichmentDebug;
  // `extraRuleIds`: rules a diagnostic arm added to the excerpts section (REQ-230); they count as attached excerpts.
  const selectedRuleIds = new Set([...(debug?.supplemental?.selected ?? []).map((rule) => rule.ruleId), ...extraRuleIds]);
  const curatedRuleIds = new Set((debug?.curatedGameRules?.topics ?? []).flatMap((topic) => topic.ruleNumbers ?? []));
  const rulingComments = rulingCommentsInPrompt({ request, promptText: prepared?.promptText, cardRulingsIndex });
  return { selectedRuleIds, curatedRuleIds, rulingComments };
}

/**
 * Case level: per deciding rule availability, plus `allDecidingRulesInPrompt`
 * (every deciding rule available) and `anyDecidingRuleSelected` (today's
 * `goldRuleInPrompt`: one deciding rule among the System 3 selections).
 */
export function describeDecidingRules({ decidingRuleIds, prepared, request, cardRulingsIndex, extraRuleIds = [] }) {
  const inputs = availabilityInputsFrom({ prepared, request, cardRulingsIndex, extraRuleIds });
  const rules = decidingRuleIds.map((ruleId) => ruleAvailability(ruleId, inputs));
  return {
    rules,
    allDecidingRulesInPrompt: rules.length > 0 && rules.every((rule) => rule.availableToAnswer),
    anyDecidingRuleSelected: rules.some((rule) => rule.selectedInSearch)
  };
}
