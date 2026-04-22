import { buildMockAnswer } from "../mockAskAi.js";
import { buildPromptContext } from "../promptContext.js";
import type { AskAiProvider } from "./askAiProvider.js";

export const mockAskAiProvider: AskAiProvider = {
  generateAnswer(request) {
    const promptContext = buildPromptContext(request);
    return buildMockAnswer(promptContext);
  }
};
