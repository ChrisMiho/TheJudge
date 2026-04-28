import { buildMockAnswer } from "../mockAskAi.js";
import type { AskAiProvider } from "./askAiProvider.js";

export const mockAskAiProvider: AskAiProvider = {
  generateAnswer(preparedPrompt) {
    return buildMockAnswer(preparedPrompt);
  }
};
