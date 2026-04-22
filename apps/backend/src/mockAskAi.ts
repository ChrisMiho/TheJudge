import type { AskAiResponse, PromptContext } from "./types.js";

type MockOutboundPayload = {
  question: string;
  stack: Array<{
    cardId: string;
    name: string;
    oracleText: string;
    imageUrl: string;
  }>;
};

function toOutboundPayload(context: PromptContext): MockOutboundPayload {
  return {
    question: context.finalQuestion,
    stack: context.orderedStack.map(({ cardId, name, oracleText, imageUrl }) => ({
      cardId,
      name,
      oracleText,
      imageUrl
    }))
  };
}

function toPrettyJson(payload: MockOutboundPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function buildMockAnswer(context: PromptContext): AskAiResponse {
  const outboundPayload = toOutboundPayload(context);

  return {
    answer: `MOCK RESPONSE\n${toPrettyJson(outboundPayload)}`
  };
}
