import type { AskAiResponse, PromptContext } from "./types.js";

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "N/A";
}

function formatTargets(targets: PromptContext["orderedStack"][number]["targets"]): string {
  if (targets.length === 0) {
    return "N/A";
  }

  return targets
    .map((target) => {
      if (target.kind === "none") {
        return "none:does-not-target";
      }

      if (target.kind === "player") {
        return `player:${target.targetPlayer}`;
      }

      if (target.kind === "battlefield") {
        return `battlefield:${target.targetPermanent}`;
      }

      return `stack:${target.targetCardName} (${target.targetCardId})`;
    })
    .join(" | ");
}

function formatStackRows(context: PromptContext): string {
  return context.orderedStack
    .map((item) =>
      [
        `${item.stackIndex + 1}. [${item.stackRole}] ${item.name} (cardId: ${item.cardId})`,
        `   Mana: ${item.manaCost || "N/A"} | MV: ${item.manaValue}`,
        `   Type: ${item.typeLine || "N/A"}`,
        `   Colors: ${formatList(item.colors)} | Supertypes: ${formatList(item.supertypes)} | Subtypes: ${formatList(item.subtypes)}`,
        `   Caster: ${item.caster} | Targets: ${formatTargets(item.targets)}`,
        `   Notes: ${item.contextNotes || "N/A"}`,
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
