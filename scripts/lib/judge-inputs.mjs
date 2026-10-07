// What the lone judge is told about the prompt an answer was written from
// (REQ-186). One builder for the routine loop, the experiment loop and a
// regrade, so the inputs are identical for every model, cap and arm: they
// depend only on the case and the prompt, never on who answered.

/** Lines the prompt prints for a case's game state (REQ-222's fact-to-line mapping), in prompt order. */
const STATE_LINE_PATTERNS = [
  /^turnPhase:/,
  /^playerCount:/,
  /^activePlayer:/,
  /^[^:]+: lifeTotal=/,
  /^ZONE: /,
  /^Stack item \d+ \(/,
  /^card: /,
  /^name: /,
  /^caster: /,
  /^owner: /,
  /^targets:/,
  /^contextNotes:/
];

/** The game-state lines the prompt printed; none for a lookup prompt. */
export function extractGameStateLines(promptText) {
  return String(promptText ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => STATE_LINE_PATTERNS.some((pattern) => pattern.test(line)));
}

/** The rule id and text of each excerpt the answer prompt carried, from the committed rule index. */
export function attachedExcerptsFor({ ruleIds, ruleIndex }) {
  const textById = new Map((ruleIndex ?? []).map((entry) => [entry.ruleId, entry.text]));
  return ruleIds.filter((ruleId) => textById.has(ruleId)).map((ruleId) => ({ ruleId, text: textById.get(ruleId) }));
}

/**
 * The judge's inputs beyond the question, answer and reference: the excerpts
 * the prompt actually carried (labelled as attached), the case's deciding rule
 * ids (labelled separately), and the printed state lines for a case with a game state.
 */
export function buildJudgeInputs({ caseEntry, promptText, attachedRuleIds, ruleIndex }) {
  return {
    attachedExcerpts: attachedExcerptsFor({ ruleIds: attachedRuleIds, ruleIndex }),
    decidingRuleIds: [...caseEntry.expected.decidingRuleIds],
    stateLines: caseEntry.gameState ? extractGameStateLines(promptText) : []
  };
}

/** The System 3 excerpt ids a prepared prompt attached (arm A); an arm that adds rules passes its own list. */
export function attachedRuleIdsOf(prepared, extraRuleIds = []) {
  const selected = (prepared?.enrichmentDebug?.supplemental?.selected ?? []).map((rule) => rule.ruleId);
  return [...new Set([...selected, ...extraRuleIds])];
}

/**
 * The excerpt rule ids printed in a stored prompt (the lines under
 * "ADDITIONAL RELEVANT RULE EXCERPTS", each `<rule id>. <text>`). A regrade uses it
 * for a transcript that predates the stored `attachedRuleIds` field.
 */
export function extractExcerptRuleIds(promptText) {
  const text = String(promptText ?? "");
  const start = text.indexOf("ADDITIONAL RELEVANT RULE EXCERPTS");
  if (start < 0) return [];
  const ids = [];
  for (const match of text.slice(start).matchAll(/^(\d{3}\.\d+[a-z]*)\. /gm)) ids.push(match[1]);
  return [...new Set(ids)];
}
