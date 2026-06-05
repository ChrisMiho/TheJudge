import { buildPromptContext } from "./context.js";
import { buildPromptText, getPromptDiagnostics, type PromptDiagnostics } from "./normalization.js";
import type { AskAiRequest, PromptContext } from "../types/index.js";

export type PreparedPromptInput = {
  context: PromptContext;
  promptText: string;
  diagnostics: PromptDiagnostics;
};

export function preparePromptInput(request: AskAiRequest): PreparedPromptInput {
  const context = buildPromptContext(request);
  const promptText = buildPromptText(context);
  const diagnostics = getPromptDiagnostics(promptText);
  return {
    context,
    promptText,
    diagnostics
  };
}
