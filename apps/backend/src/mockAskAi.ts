import type { AskAiRequest, AskAiResponse } from "./types.js";

function toPrettyJson(payload: AskAiRequest): string {
  return JSON.stringify(payload, null, 2);
}

export function buildMockAnswer(payload: AskAiRequest): AskAiResponse {
  return {
    answer: `MOCK RESPONSE\n${toPrettyJson(payload)}`
  };
}
