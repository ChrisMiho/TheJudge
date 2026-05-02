import type { PreparedPromptInput } from "./promptPreparation.js";
import type { AskAiResponse } from "./types.js";

const CHARS_PER_TOKEN_ESTIMATE = 4;

function estimateTokensFromChars(charCount: number): number {
  return Math.ceil(charCount / CHARS_PER_TOKEN_ESTIMATE);
}

export function buildMockAnswer(preparedPrompt: PreparedPromptInput): AskAiResponse {
  const { promptText, diagnostics: promptDiagnostics } = preparedPrompt;
  const estimatedInputTokens = estimateTokensFromChars(promptDiagnostics.promptChars);
  const estimatedBudgetTokens = estimateTokensFromChars(promptDiagnostics.promptBudgetChars);
  const estimatedRemainingTokens = estimateTokensFromChars(promptDiagnostics.remainingChars);

  const lines = [
    "MOCK RESPONSE",
    "This is deterministic debug output for prompt/cost validation.",
    "",
    "PROMPT STATS",
    `Prompt chars: ${promptDiagnostics.promptChars}/${promptDiagnostics.promptBudgetChars}`,
    `Prompt remaining chars: ${promptDiagnostics.remainingChars}`,
    `Prompt utilization: ${promptDiagnostics.utilizationPercent}%`,
    `Prompt near limit: ${promptDiagnostics.nearLimit ? "yes" : "no"}`,
    `Prompt exceeds budget: ${promptDiagnostics.exceedsBudget ? "yes" : "no"}`,
    `Estimated input tokens (~${CHARS_PER_TOKEN_ESTIMATE} chars/token): ${estimatedInputTokens}`,
    `Estimated token budget (~${CHARS_PER_TOKEN_ESTIMATE} chars/token): ${estimatedBudgetTokens}`,
    `Estimated remaining tokens (~${CHARS_PER_TOKEN_ESTIMATE} chars/token): ${estimatedRemainingTokens}`,
    "",
    "FULL PROMPT (SENT TO BEDROCK)",
    "",
    promptText
  ];

  return {
    answer: lines.join("\n")
  };
}
