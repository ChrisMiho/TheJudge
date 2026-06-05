import type { PreparedPromptInput } from "../prompt/preparation.js";
import type { AskAiResponse } from "../types/index.js";

export type AskAiProvider = {
  generateAnswer(preparedPrompt: PreparedPromptInput): Promise<AskAiResponse> | AskAiResponse;
};
