import type { AskAiRequest, AskAiResponse } from "../types.js";

export type AskAiProvider = {
  generateAnswer(request: AskAiRequest): Promise<AskAiResponse> | AskAiResponse;
};
