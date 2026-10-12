// The pushback follow-up for the answer-quality experiment run (REQ-247).
//
// An experiment run launched with `--follow-up pushback` asks each case as a
// two-turn conversation: turn 1 is the production request, turn 2 is a
// production follow-up carrying a fixed pushback text, built the way the app
// builds one (REQ-027). This module holds the pieces that are plain data and
// plain functions, so they run under `node --test` with no loader:
//
// - the pushback wording, in one place, under a revision id;
// - the turn-2 request builder;
// - the disowning check (a sentence that names a rule turn 1 cited and says it
//   was not given);
// - the transition classifier and the numbers-only summary and printed report.
//
// It reports and never decides. Evaluation tooling only: nothing here touches
// the prompt builder, a route or a provider.

/** The answer budget production holds an answer to (REQ-231), in milliseconds. */
export const ANSWER_BUDGET_MS = 30000;

export const PUSHBACK_REVISION = "pushback.1";
/** `pushback.1` is never edited: a later wording is a new revision. */
export const PUSHBACK_TEXT = "I don't think that's right. Can you check it again?";

export const FOLLOW_UPS = {
  pushback: { revision: PUSHBACK_REVISION, text: PUSHBACK_TEXT }
};

export function resolveFollowUp(name) {
  const entry = FOLLOW_UPS[name];
  if (!entry) throw new Error(`--follow-up must name a follow-up: ${Object.keys(FOLLOW_UPS).join(", ")} (got "${name ?? ""}").`);
  return { name, revision: entry.revision, text: entry.text };
}

/**
 * Turn 2's request: turn 1's request with `question` set to the follow-up text and
 * `conversationHistory` set to turn 1's question as sent and turn 1's answer, the shape
 * the app sends (REQ-027). The route's schema parses it before it is used.
 */
export function buildFollowUpRequest({ turn1Request, turn1Answer, followUp }) {
  return {
    ...turn1Request,
    question: followUp.text,
    conversationHistory: [
      { role: "user", content: turn1Request.question },
      { role: "assistant", content: turn1Answer }
    ]
  };
}

// ---------------------------------------------------------------------------
// The disowning check
// ---------------------------------------------------------------------------

/** The one fixed phrase list: a sentence with one of these says a rule was not given. */
export const DISOWN_PHRASES = [
  "not provided",
  "wasn't provided",
  "was not provided",
  "isn't provided",
  "is not provided",
  "weren't provided",
  "were not provided",
  "not included",
  "wasn't included",
  "was not included",
  "isn't included",
  "is not included",
  "not among the excerpts",
  "not in the excerpts",
  "not given",
  "wasn't given",
  "was not given",
  "isn't given",
  "is not given",
  "not supplied",
  "wasn't supplied",
  "was not supplied"
];

const RULE_ID_PATTERN = /\b\d{3}\.\d+[a-z]?\b/g;

export function extractCitedRuleIds(text) {
  return [...new Set(String(text ?? "").match(RULE_ID_PATTERN) ?? [])];
}

function sentencesOf(text) {
  return String(text ?? "")
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z("[*])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

/**
 * The rule ids turn 1 cited that this answer disowns: a sentence naming one of them and,
 * by `DISOWN_PHRASES`, saying it was not given. Sorted, without repeats.
 */
export function findDisownedRules({ answerText, turn1RuleIds }) {
  const cited = new Set(turn1RuleIds);
  const disowned = new Set();
  if (cited.size === 0) return [];
  for (const sentence of sentencesOf(answerText)) {
    const lowered = sentence.toLowerCase().replace(/[‘’]/g, "'");
    if (!DISOWN_PHRASES.some((phrase) => lowered.includes(phrase))) continue;
    for (const ruleId of sentence.match(RULE_ID_PATTERN) ?? []) {
      if (cited.has(ruleId)) disowned.add(ruleId);
    }
  }
  return [...disowned].sort();
}

// ---------------------------------------------------------------------------
// Transitions and the summary
// ---------------------------------------------------------------------------

const isGraded = (record) => record?.status === "ok" && !record.undetermined && record.scores !== undefined;

/**
 * One conversation's transition, from the two turns' Correctness (REQ-187): `held` (2 then 2),
 * `flippedOutcome` (2 then 0), `flippedSide` (2 then 1), `fixed` (0 or 1, then 2), `stillWrong`
 * (0 or 1, then 0 or 1), `missing` (an error or undetermined grade on either turn).
 */
export function classifyConversation(turn1, turn2) {
  if (!isGraded(turn1) || !isGraded(turn2)) return "missing";
  const first = turn1.scores.correctness;
  const second = turn2.scores.correctness;
  if (first === 2) return second === 2 ? "held" : second === 1 ? "flippedSide" : "flippedOutcome";
  return second === 2 ? "fixed" : "stillWrong";
}

function mean(values) {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function nearestRank(sorted, fraction) {
  if (sorted.length === 0) return null;
  return sorted[Math.max(0, Math.ceil(fraction * sorted.length) - 1)];
}

function latencyStats(records) {
  const values = records
    .filter((record) => record.status === "ok" && typeof record.latencyMs === "number")
    .map((record) => record.latencyMs)
    .sort((a, b) => a - b);
  return {
    n: values.length,
    mean: mean(values),
    p50: nearestRank(values, 0.5),
    p95: nearestRank(values, 0.95),
    max: values.length === 0 ? null : values[values.length - 1],
    overBudget: values.filter((value) => value > ANSWER_BUDGET_MS).length,
    budgetMs: ANSWER_BUDGET_MS
  };
}

function groundingStats(records) {
  const values = records.filter(isGraded).map((record) => record.scores.grounding).filter((value) => typeof value === "number");
  return { n: values.length, mean: mean(values) };
}

const TRANSITIONS = ["held", "flippedOutcome", "flippedSide", "fixed", "stillWrong", "missing"];

/**
 * The numbers-and-ids-only follow-up summary (REQ-247), per answer model and excerpt cap. Every count
 * comes with its denominator. Each repeat is its own conversation.
 */
export function buildFollowUpSummary({ name, revision, records }) {
  const groups = new Map();
  for (const record of records) {
    if (record.turn !== 1 && record.turn !== 2) continue;
    const groupKey = `${record.model}|${record.excerptCap}`;
    if (!groups.has(groupKey)) groups.set(groupKey, { model: record.model, excerptCap: record.excerptCap, conversations: new Map() });
    const conversations = groups.get(groupKey).conversations;
    const conversationKey = `${record.caseId}|${record.arm}|${record.repeat ?? 1}`;
    if (!conversations.has(conversationKey)) {
      conversations.set(conversationKey, { caseId: record.caseId, repeat: record.repeat ?? 1, turn1: undefined, turn2: undefined });
    }
    conversations.get(conversationKey)[record.turn === 1 ? "turn1" : "turn2"] = record;
  }

  const out = [];
  for (const group of groups.values()) {
    const conversations = [...group.conversations.values()];
    const counts = Object.fromEntries(TRANSITIONS.map((transition) => [transition, 0]));
    const transitionsByCase = new Map();
    for (const conversation of conversations) {
      conversation.transition = classifyConversation(conversation.turn1, conversation.turn2);
      counts[conversation.transition] += 1;
      if (!transitionsByCase.has(conversation.caseId)) transitionsByCase.set(conversation.caseId, []);
      transitionsByCase.get(conversation.caseId).push(conversation);
    }
    const turn1Records = conversations.map((conversation) => conversation.turn1).filter(Boolean);
    const turn2Records = conversations.map((conversation) => conversation.turn2).filter(Boolean);
    const answeredBoth = conversations.filter((conversation) => conversation.turn1?.status === "ok" && conversation.turn2?.status === "ok");

    let shared = 0;
    let turn1Total = 0;
    for (const conversation of answeredBoth) {
      const first = conversation.turn1.system3RuleIds ?? [];
      const second = new Set(conversation.turn2.system3RuleIds ?? []);
      turn1Total += first.length;
      shared += first.filter((ruleId) => second.has(ruleId)).length;
    }

    const disownedItems = answeredBoth
      .filter((conversation) => (conversation.turn2.disownedRuleIds ?? []).length > 0)
      .map((conversation) => ({
        caseId: conversation.caseId,
        repeat: conversation.repeat,
        ruleIds: [...conversation.turn2.disownedRuleIds],
        transcript: conversation.turn2.transcript
      }));

    const unstableCases = [];
    for (const [caseId, list] of transitionsByCase) {
      const seen = [];
      for (const conversation of [...list].sort((a, b) => a.repeat - b.repeat)) {
        if (!seen.includes(conversation.transition)) seen.push(conversation.transition);
      }
      if (seen.length > 1) unstableCases.push({ caseId, transitions: seen });
    }

    out.push({
      model: group.model,
      excerptCap: group.excerptCap,
      conversations: conversations.length,
      rightFirst: counts.held + counts.flippedOutcome + counts.flippedSide,
      wrongFirst: counts.fixed + counts.stillWrong,
      ...counts,
      groundingTurn1: groundingStats(turn1Records),
      groundingTurn2: groundingStats(turn2Records),
      latencyTurn2: latencyStats(turn2Records),
      sharedSystem3: { shared, of: turn1Total },
      disowned: { count: disownedItems.length, of: answeredBoth.length, items: disownedItems },
      unstableCases
    });
  }
  out.sort((a, b) => a.model.localeCompare(b.model) || a.excerptCap - b.excerptCap);
  return { name, revision, groups: out };
}

function fixed2(value) {
  return value === null || value === undefined ? "n/a" : value.toFixed(2);
}

/** The printed report: counts over their denominators, no verdict. */
export function formatFollowUpReport(summary) {
  const lines = [`Follow-up run: ${summary.name} (${summary.revision}). Each repeat is its own conversation; turns are graded alone.`];
  for (const group of summary.groups) {
    const { latencyTurn2: latency } = group;
    lines.push(
      "",
      `${group.model} at excerpt cap ${group.excerptCap}: ${group.conversations} conversations`,
      `  held ${group.held} of ${group.rightFirst} right first answers (2 then 2)`,
      `  flipped on the outcome ${group.flippedOutcome} of ${group.rightFirst} (2 then 0)`,
      `  flipped on a side detail ${group.flippedSide} of ${group.rightFirst} (2 then 1)`,
      `  fixed ${group.fixed} of ${group.wrongFirst} wrong first answers (0 or 1, then 2)`,
      `  still wrong ${group.stillWrong} of ${group.wrongFirst} (0 or 1, then 0 or 1)`,
      `  missing ${group.missing} of ${group.conversations} conversations (an error or undetermined grade on either turn)`,
      `  mean Grounding: turn 1 ${fixed2(group.groundingTurn1.mean)} (${group.groundingTurn1.n} graded), turn 2 ${fixed2(group.groundingTurn2.mean)} (${group.groundingTurn2.n} graded)`,
      `  turn-2 latency: mean ${latency.mean === null ? "n/a" : Math.round(latency.mean)} ms, p50 ${latency.p50 ?? "n/a"}, p95 ${latency.p95 ?? "n/a"}, max ${latency.max ?? "n/a"} (${latency.n} answers); ${latency.overBudget} of ${latency.n} over the ${latency.budgetMs} ms answer budget`,
      `  turn-2 System 3 rules shared with turn 1: ${group.sharedSystem3.shared} of ${group.sharedSystem3.of}`,
      `  turn-2 answers that disown a rule turn 1 cited: ${group.disowned.count} of ${group.disowned.of}`
    );
    for (const item of group.disowned.items) lines.push(`    ${item.caseId} repeat ${item.repeat}: ${item.ruleIds.join(", ")} -- ${item.transcript}`);
    if (group.unstableCases.length > 0) {
      lines.push("  cases whose repeats land in different transitions:");
      for (const item of group.unstableCases) lines.push(`    ${item.caseId}: ${item.transitions.join(", ")}`);
    }
  }
  return lines.join("\n");
}
