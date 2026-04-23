import type { AskAiRequest, PromptContext } from "../types.js";
import { normalizeQuestion } from "../promptNormalization.js";

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
  | "general-game-context-section"
  | "battlefield-context-section"
  | "prompt-section-order"
<<<<<<< HEAD
  | "mana-spent-output"
  | "llm-prompt-omits-cardid";
=======
  | "mana-spent-output";
>>>>>>> origin/main

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
  const expectedOrder = fixture.request.stack.map((card) => card.cardId);
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

function checkPromptSectionOrder(promptText: string): EvaluationCheckResult {
  const instructionsIndex = promptText.indexOf("INSTRUCTIONS");
  const questionIndex = promptText.indexOf("QUESTION");
  const gameContextIndex = promptText.indexOf("GENERAL GAME CONTEXT");
  const battlefieldContextIndex = promptText.indexOf("OPTIONAL BATTLEFIELD CONTEXT");
  const stackIndex = promptText.indexOf("ORDERED STACK CONTEXT (BOTTOM TO TOP)");
  const passed =
    instructionsIndex !== -1 &&
    questionIndex !== -1 &&
    gameContextIndex !== -1 &&
    battlefieldContextIndex !== -1 &&
    stackIndex !== -1 &&
    instructionsIndex < questionIndex &&
    questionIndex < gameContextIndex &&
    gameContextIndex < battlefieldContextIndex &&
    battlefieldContextIndex < stackIndex;

  return {
    id: "prompt-section-order",
    passed,
    details: passed
      ? "Prompt sections appear in deterministic order."
      : "Expected section order INSTRUCTIONS -> QUESTION -> GENERAL GAME CONTEXT -> OPTIONAL BATTLEFIELD CONTEXT -> ORDERED STACK CONTEXT (BOTTOM TO TOP)."
  };
}

function checkGeneralGameContextSection(context: PromptContext, promptText: string): EvaluationCheckResult {
  const hasHeader = promptText.includes("GENERAL GAME CONTEXT");
  const hasPlayerCount = promptText.includes(`playerCount: ${context.gameContext.playerCount}`);
  const missingPlayerLines = context.gameContext.players.filter(
    (player) => !promptText.includes(`${player.label}: lifeTotal=${player.lifeTotal}`)
  );
  const passed = hasHeader && hasPlayerCount && missingPlayerLines.length === 0;

  return {
    id: "general-game-context-section",
    passed,
    details: passed
      ? "General game context section is present with deterministic player lines."
      : "Missing GENERAL GAME CONTEXT header and/or expected playerCount/player life-total lines."
  };
}

function checkBattlefieldContextSection(context: PromptContext, promptText: string): EvaluationCheckResult {
  const hasHeader = promptText.includes("OPTIONAL BATTLEFIELD CONTEXT");
  const hasExpectedContent =
    context.battlefieldContext.length === 0
      ? promptText.includes("OPTIONAL BATTLEFIELD CONTEXT\n(none)")
      : context.battlefieldContext.every((item, index) => {
          const marker = `Battlefield ${index + 1}`;
          return promptText.includes(marker) && promptText.includes(`name: ${item.name}`);
        });
  const passed = hasHeader && hasExpectedContent;

  return {
    id: "battlefield-context-section",
    passed,
    details: passed
      ? "Optional battlefield section is present and matches full/skip scenario expectations."
      : "Battlefield section header/content does not match expected full-context or skip-path behavior."
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
<<<<<<< HEAD
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
=======
>>>>>>> origin/main
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
    checkGeneralGameContextSection(context, promptText),
    checkBattlefieldContextSection(context, promptText),
    checkPromptSectionOrder(promptText),
<<<<<<< HEAD
    checkManaSpentOutput(context, promptText),
    checkPromptOmitsCardId(promptText)
=======
    checkManaSpentOutput(context, promptText)
>>>>>>> origin/main
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
