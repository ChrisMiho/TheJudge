import type { AskAiResponse, PromptContext } from "./types.js";

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "N/A";
}

function formatStackRows(context: PromptContext): string {
  return context.orderedStack
    .map((item) =>
      [
        `${item.stackIndex + 1}. [${item.stackRole}] ${item.name} (cardId: ${item.cardId})`,
        `   Mana: ${item.manaCost || "N/A"} | MV: ${item.manaValue}`,
        `   Type: ${item.typeLine || "N/A"}`,
        `   Colors: ${formatList(item.colors)} | Supertypes: ${formatList(item.supertypes)} | Subtypes: ${formatList(item.subtypes)}`,
        `   Oracle: ${item.oracleText}`
      ].join("\n")
    )
    .join("\n");
}

export function buildMockAnswer(context: PromptContext): AskAiResponse {
  const stackRows = formatStackRows(context);
  const lines = [
    "MOCK RESPONSE",
    "This is deterministic debug output for prompt/context validation.",
    "",
    `Final question: ${context.finalQuestion}`,
    `Stack order convention: bottom-to-top (stack[0] is the bottom spell)`,
    `Stack size: ${context.orderedStack.length}`,
    "",
    "Ordered stack:",
    stackRows
  ];

  return {
    answer: lines.join("\n")
  };
}
