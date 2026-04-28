import type { PreparedPromptInput } from "../promptPreparation.js";
import type { AskAiResponse } from "../types.js";

export type AskAiProvider = {
  generateAnswer(preparedPrompt: PreparedPromptInput): Promise<AskAiResponse> | AskAiResponse;
};
