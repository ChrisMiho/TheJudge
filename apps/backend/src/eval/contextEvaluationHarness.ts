import type { AskAiRequest, PromptContext } from "../types/index.js";
import { MAX_PROMPT_CHAR_BUDGET, normalizeQuestion } from "../prompt/normalization.js";

const FALLBACK_QUESTION = "Resolve the stack";

const REQUIRED_GUARDRAIL_LINES = [
  "- Explain reasoning clearly and concisely.",
  "- State uncertainty when context is incomplete.",
  "- Do not invent hidden state, targets, or board conditions."
] as const;

type EvaluationCheckId =
  | "stack-order-preserved"
  | "final-question-behavior"
  | "required-guardrails-present"
  | "mtg-reference-present"
  | "general-game-context-section"
  | "populated-zones-section"
  | "scope-sentence-present"
  | "prompt-section-order"
  | "mana-spent-output"
  | "llm-prompt-omits-cardid"
  | "game-rules-section-present"
  | "game-rules-before-rulings"
  | "supplemental-rules-section-present"
  | "supplemental-rules-after-game-rules"
  | "supplemental-rules-before-rulings"
  | "prompt-under-budget";

export type EvaluationFixture = {
  id: string;
  description: string;
  request: AskAiRequest;
};

export type EvaluationCheckResult = {
  id: EvaluationCheckId;
  passed: boolean;
  details: string;
};

export type EvaluationResult = {
  fixtureId: string;
  passed: boolean;
  score: number;
  maxScore: number;
  checks: EvaluationCheckResult[];
};

function checkStackOrder(fixture: EvaluationFixture, context: PromptContext): EvaluationCheckResult {
  const expectedOrder = (fixture.request.gameContext.zones?.stack ?? []).map((card) => card.cardId);
  const actualOrder = context.orderedStack.map((card) => card.cardId);
  const passed = expectedOrder.join("|") === actualOrder.join("|");

  return {
    id: "stack-order-preserved",
    passed,
    details: passed
      ? "Stack card IDs remain in original bottom-to-top order."
      : `Expected order [${expectedOrder.join(", ")}], received [${actualOrder.join(", ")}].`
  };
}

function checkFinalQuestionBehavior(fixture: EvaluationFixture, context: PromptContext): EvaluationCheckResult {
  const normalizedInput = normalizeQuestion(fixture.request.question);
  const expectedQuestion = normalizedInput.length > 0 ? normalizedInput : FALLBACK_QUESTION;
  const passed = context.finalQuestion === expectedQuestion;

  return {
    id: "final-question-behavior",
    passed,
    details: passed
      ? `Final question resolved correctly to "${context.finalQuestion}".`
      : `Expected final question "${expectedQuestion}", received "${context.finalQuestion}".`
  };
}

function checkRequiredGuardrails(promptText: string): EvaluationCheckResult {
  const missingLines = REQUIRED_GUARDRAIL_LINES.filter((line) => !promptText.includes(line));
  const passed = missingLines.length === 0;

  return {
    id: "required-guardrails-present",
    passed,
    details: passed
      ? "All required guardrail instructions are present."
      : `Missing guardrail lines: ${missingLines.join(" | ")}`
  };
}

function checkMtgReferencePresent(promptText: string): EvaluationCheckResult {
  const hasMtgReference = promptText.includes("MTG REFERENCE");
  const hasLayerSystem = promptText.includes("layer system");
  const passed = hasMtgReference && hasLayerSystem;

  return {
    id: "mtg-reference-present",
    passed,
    details: passed
      ? "MTG reference block is present with expected rules content."
      : "MTG reference block or expected layer-system content is missing."
  };
}

function checkPromptSectionOrder(promptText: string): EvaluationCheckResult {
  const mtgReferenceIndex = promptText.indexOf("MTG REFERENCE");
  const gameContextIndex = promptText.indexOf("GENERAL GAME CONTEXT");
  const scopeIndex = promptText.indexOf("SCOPE");
  const questionIndex = promptText.indexOf("QUESTION");
  const passed =
    mtgReferenceIndex !== -1 &&
    gameContextIndex !== -1 &&
    scopeIndex !== -1 &&
    questionIndex !== -1 &&
    mtgReferenceIndex < gameContextIndex &&
    gameContextIndex < scopeIndex &&
    scopeIndex < questionIndex;

  return {
    id: "prompt-section-order",
    passed,
    details: passed
      ? "Prompt sections appear in deterministic order."
      : "Expected section order MTG REFERENCE -> GENERAL GAME CONTEXT -> SCOPE -> QUESTION."
  };
}

function checkGeneralGameContextSection(context: PromptContext, promptText: string): EvaluationCheckResult {
  const hasHeader = promptText.includes("GENERAL GAME CONTEXT");
  const hasTurnPhase = promptText.includes(`turnPhase: ${context.gameContext.turnPhase}`);
  const hasPlayerCount = promptText.includes(`playerCount: ${context.gameContext.playerCount}`);
  const missingPlayerLines = context.gameContext.players.filter(
    (player) => !promptText.includes(`${player.label}: lifeTotal=${player.lifeTotal}`)
  );
  const passed = hasHeader && hasTurnPhase && hasPlayerCount && missingPlayerLines.length === 0;

  return {
    id: "general-game-context-section",
    passed,
    details: passed
      ? "General game context section is present with deterministic turnPhase and player lines."
      : "Missing GENERAL GAME CONTEXT header and/or expected turnPhase/playerCount/player life-total lines."
  };
}

function checkPopulatedZonesSections(context: PromptContext, promptText: string): EvaluationCheckResult {
  const stackExpected = context.orderedStack.length > 0;
  const stackPresent = promptText.includes("ZONE: STACK (BOTTOM TO TOP)");
  const stackOk = stackExpected === stackPresent;

  const zoneSectionsMissing = context.populatedZones
    .filter((zone) => !promptText.includes(`ZONE: ${zone.zoneId.toUpperCase()}`))
    .map((zone) => zone.zoneId);

  const passed = stackOk && zoneSectionsMissing.length === 0;

  return {
    id: "populated-zones-section",
    passed,
    details: passed
      ? "Populated zone sections appear with correct headers."
      : `Zone section issues: stack expected=${String(stackExpected)} present=${String(stackPresent)}; missing zones: ${zoneSectionsMissing.join(", ")}`
  };
}

function checkScopeSentencePresent(promptText: string): EvaluationCheckResult {
  const passed = promptText.includes("SCOPE\n");

  return {
    id: "scope-sentence-present",
    passed,
    details: passed
      ? "Scope sentence section (SCOPE) is present."
      : "Scope sentence section (SCOPE) is missing from the prompt."
  };
}

function checkManaSpentOutput(context: PromptContext, promptText: string): EvaluationCheckResult {
  const missing = context.orderedStack.filter((item) => typeof item.manaSpent !== "number");
  const missingPromptLines = context.orderedStack.filter(
    (item) => !promptText.includes(`manaSpent: ${item.manaSpent ?? item.manaValue}`)
  );
  const passed = missing.length === 0;
  const promptPassed = missingPromptLines.length === 0;

  return {
    id: "mana-spent-output",
    passed: passed && promptPassed,
    details:
      passed && promptPassed
        ? "Every stack item has deterministic manaSpent value and prompt output line."
        : `Missing deterministic manaSpent context for: ${[
            ...missing.map((item) => item.cardId),
            ...missingPromptLines.map((item) => `${item.cardId}:prompt-line`)
          ].join(", ")}`
  };
}

function checkPromptOmitsCardId(promptText: string): EvaluationCheckResult {
  const hasCardIdField = promptText.includes("cardId:");
  const hasStackTargetWithId = /stack:[^\n]+\s\([^)]+\)/.test(promptText);
  const passed = !hasCardIdField && !hasStackTargetWithId;

  return {
    id: "llm-prompt-omits-cardid",
    passed,
    details: passed
      ? "LLM-facing prompt text omits internal cardId references."
      : "Prompt still contains cardId field lines or stack-target ID suffixes."
  };
}

function checkGameRulesSectionPresent(promptText: string): EvaluationCheckResult {
  const passed = promptText.includes("GAME RULES (reference)");

  return {
    id: "game-rules-section-present",
    passed,
    details: passed
      ? "GAME RULES (reference) section is present in the prompt."
      : "GAME RULES (reference) section is missing from the prompt."
  };
}

function checkGameRulesBeforeRulings(promptText: string): EvaluationCheckResult {
  const gameRulesIndex = promptText.indexOf("GAME RULES (reference)");
  const officialRulingsIndex = promptText.indexOf("OFFICIAL RULINGS");
  const hasGameRules = gameRulesIndex !== -1;
  const hasOfficialRulings = officialRulingsIndex !== -1;
  const passed = hasGameRules && (!hasOfficialRulings || gameRulesIndex < officialRulingsIndex);

  return {
    id: "game-rules-before-rulings",
    passed,
    details: passed
      ? "GAME RULES (reference) appears before OFFICIAL RULINGS (or no OFFICIAL RULINGS present)."
      : "GAME RULES (reference) is absent or appears after OFFICIAL RULINGS."
  };
}

function checkSupplementalRulesSectionPresent(promptText: string): EvaluationCheckResult {
  const hasSupplemental = promptText.includes("ADDITIONAL RELEVANT RULE EXCERPTS");
  const disclaimerOk = !hasSupplemental || promptText.includes("Use these additional official rule excerpts");
  const passed = disclaimerOk;

  return {
    id: "supplemental-rules-section-present",
    passed,
    details: passed
      ? hasSupplemental
        ? "ADDITIONAL RELEVANT RULE EXCERPTS section is present with expected disclaimer."
        : "No supplemental rules retrieved; section correctly omitted."
      : "ADDITIONAL RELEVANT RULE EXCERPTS section is present but missing expected disclaimer text."
  };
}

function checkSupplementalRulesAfterGameRules(promptText: string): EvaluationCheckResult {
  const gameRulesIndex = promptText.indexOf("GAME RULES (reference)");
  const supplementalIndex = promptText.indexOf("ADDITIONAL RELEVANT RULE EXCERPTS");
  const hasGameRules = gameRulesIndex !== -1;
  const hasSupplemental = supplementalIndex !== -1;
  const passed = !hasSupplemental || !hasGameRules || supplementalIndex > gameRulesIndex;

  return {
    id: "supplemental-rules-after-game-rules",
    passed,
    details: passed
      ? hasSupplemental && hasGameRules
        ? "ADDITIONAL RELEVANT RULE EXCERPTS appears after GAME RULES (reference)."
        : "Supplemental-to-game-rules ordering not applicable (one or both sections absent)."
      : "ADDITIONAL RELEVANT RULE EXCERPTS appears before GAME RULES (reference)."
  };
}

function checkSupplementalRulesBeforeRulings(promptText: string): EvaluationCheckResult {
  const supplementalIndex = promptText.indexOf("ADDITIONAL RELEVANT RULE EXCERPTS");
  const officialRulingsIndex = promptText.indexOf("OFFICIAL RULINGS");
  const hasSupplemental = supplementalIndex !== -1;
  const hasOfficialRulings = officialRulingsIndex !== -1;
  const passed = !hasSupplemental || !hasOfficialRulings || supplementalIndex < officialRulingsIndex;

  return {
    id: "supplemental-rules-before-rulings",
    passed,
    details: passed
      ? hasSupplemental && hasOfficialRulings
        ? "ADDITIONAL RELEVANT RULE EXCERPTS appears before OFFICIAL RULINGS."
        : "Supplemental-to-rulings ordering not applicable (one or both sections absent)."
      : "ADDITIONAL RELEVANT RULE EXCERPTS appears after OFFICIAL RULINGS."
  };
}

function checkPromptUnderBudget(promptText: string): EvaluationCheckResult {
  const chars = promptText.length;
  const passed = chars < MAX_PROMPT_CHAR_BUDGET;

  return {
    id: "prompt-under-budget",
    passed,
    details: passed
      ? `Prompt is ${chars} chars, within ${MAX_PROMPT_CHAR_BUDGET} char budget.`
      : `Prompt is ${chars} chars, exceeds ${MAX_PROMPT_CHAR_BUDGET} char budget.`
  };
}

export function evaluateScenario(
  fixture: EvaluationFixture,
  context: PromptContext,
  promptText: string
): EvaluationResult {
  const checks = [
    checkStackOrder(fixture, context),
    checkFinalQuestionBehavior(fixture, context),
    checkRequiredGuardrails(promptText),
    checkMtgReferencePresent(promptText),
    checkGeneralGameContextSection(context, promptText),
    checkPopulatedZonesSections(context, promptText),
    checkScopeSentencePresent(promptText),
    checkPromptSectionOrder(promptText),
    checkManaSpentOutput(context, promptText),
    checkPromptOmitsCardId(promptText),
    checkGameRulesSectionPresent(promptText),
    checkGameRulesBeforeRulings(promptText),
    checkSupplementalRulesSectionPresent(promptText),
    checkSupplementalRulesAfterGameRules(promptText),
    checkSupplementalRulesBeforeRulings(promptText),
    checkPromptUnderBudget(promptText)
  ];
  const score = checks.filter((check) => check.passed).length;

  return {
    fixtureId: fixture.id,
    passed: score === checks.length,
    score,
    maxScore: checks.length,
    checks
  };
}

export function buildChecklistReport(results: EvaluationResult[]): string {
  const header = "fixtureId | score | checks";
  const divider = "---|---|---";
  const lines = results.map((result) => {
    const failingChecks = result.checks
      .filter((check) => !check.passed)
      .map((check) => check.id)
      .join(", ");
    const checkSummary = failingChecks.length > 0 ? `FAIL: ${failingChecks}` : "PASS";

    return `${result.fixtureId} | ${result.score}/${result.maxScore} | ${checkSummary}`;
  });

  return [header, divider, ...lines].join("\n");
}
