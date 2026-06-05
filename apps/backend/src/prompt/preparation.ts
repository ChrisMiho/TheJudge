import { buildPromptContext } from "./context.js";
import { buildPromptText, getPromptDiagnostics, type PromptDiagnostics } from "./normalization.js";
import { retrieveRelevantRules } from "../rules/rulesRetrieval.js";
import type { RetrievedRuleReference } from "../rules/types.js";
import type { AskAiRequest, PromptContext } from "../types/index.js";

export type PreparedPromptInput = {
  context: PromptContext;
  promptText: string;
  diagnostics: PromptDiagnostics;
  relevantRules: RetrievedRuleReference[];
};

export function preparePromptInput(request: AskAiRequest): PreparedPromptInput {
  const context = buildPromptContext(request);
  const relevantRules = retrieveRelevantRules(context);
  const promptText = buildPromptText(context, relevantRules);
  const diagnostics = getPromptDiagnostics(promptText);
  return {
    context,
    promptText,
    diagnostics,
    relevantRules
  };
}
