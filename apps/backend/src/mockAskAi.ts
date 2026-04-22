import type { AskAiResponse, PromptContext } from "./types.js";

type MockOutboundPayload = {
  question: string;
  stackOrderConvention: "bottom-to-top";
  stack: Array<{
    cardId: string;
    name: string;
    oracleText: string;
    manaCost: string;
    manaValue: number;
    typeLine: string;
    colors: string[];
    supertypes: string[];
    subtypes: string[];
    stackIndex: number;
    stackRole: "bottom" | "middle" | "top";
  }>;
};

function toOutboundPayload(context: PromptContext): MockOutboundPayload {
  return {
    question: context.finalQuestion,
    stackOrderConvention: "bottom-to-top",
    stack: context.orderedStack.map(
      ({ cardId, name, oracleText, manaCost, manaValue, typeLine, colors, supertypes, subtypes, stackIndex, stackRole }) => ({
      cardId,
      name,
      oracleText,
      manaCost,
      manaValue,
      typeLine,
      colors,
      supertypes,
      subtypes,
      stackIndex,
      stackRole
      })
    )
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
