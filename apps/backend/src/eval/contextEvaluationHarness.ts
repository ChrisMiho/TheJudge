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
  | "prompt-section-order";

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
  const stackIndex = promptText.indexOf("ORDERED STACK (BOTTOM TO TOP)");
  const passed =
    instructionsIndex !== -1 &&
    questionIndex !== -1 &&
    stackIndex !== -1 &&
    instructionsIndex < questionIndex &&
    questionIndex < stackIndex;

  return {
    id: "prompt-section-order",
    passed,
    details: passed
      ? "Prompt sections appear in deterministic order."
      : "Expected section order INSTRUCTIONS -> QUESTION -> ORDERED STACK (BOTTOM TO TOP)."
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
    checkPromptSectionOrder(promptText)
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
