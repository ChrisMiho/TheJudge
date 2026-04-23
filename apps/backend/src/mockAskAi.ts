import type { AskAiResponse, PromptContext } from "./types.js";
import { buildPromptText, getPromptDiagnostics } from "./promptNormalization.js";

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

      if (target.kind === "other") {
        return `other:${target.targetDescription}`;
      }

      if (target.kind === "player") {
        return `player:${target.targetPlayer}`;
      }

      if (target.kind === "battlefield") {
        return `battlefield:${target.targetPermanent}`;
      }

      return `stack:${target.targetCardName}`;
    })
    .join(" | ");
}

function formatStackRows(context: PromptContext): string {
  return context.orderedStack
    .map((item) =>
      [
        `${item.stackIndex + 1}. [${item.stackRole}] Card: ${item.name}`,
        `   Mana: ${item.manaCost || "N/A"} | MV: ${item.manaValue}`,
        `   Type: ${item.typeLine || "N/A"}`,
        `   Colors: ${formatList(item.colors)} | Supertypes: ${formatList(item.supertypes)} | Subtypes: ${formatList(item.subtypes)}`,
        `   Mana Spent: ${item.manaSpent ?? item.manaValue}`,
        `   Caster: ${item.caster} | Targets: ${formatTargets(item.targets)}`,
        `   Notes: ${item.contextNotes || "N/A"}`,
        `   Oracle: ${item.oracleText}`
      ].join("\n")
    )
    .join("\n");
}

export function buildMockAnswer(context: PromptContext): AskAiResponse {
  const promptText = buildPromptText(context);
  const promptDiagnostics = getPromptDiagnostics(promptText);
  const stackRows = formatStackRows(context);
  const battlefieldRows =
    context.battlefieldContext.length > 0
      ? context.battlefieldContext
          .map((item, index) => {
            return `${index + 1}. ${item.name} | details=${item.details || "N/A"} | targets=${formatTargets(item.targets)}`;
          })
          .join("\n")
      : "(none)";
  const lines = [
    "MOCK RESPONSE",
    "This is deterministic debug output for prompt/context validation.",
    "",
    `Final question: ${context.finalQuestion}`,
    `Stack order convention: bottom-to-top (stack[0] is the bottom spell)`,
    `Stack size: ${context.orderedStack.length}`,
    `Prompt chars: ${promptDiagnostics.promptChars}/${promptDiagnostics.promptBudgetChars}`,
    `Prompt utilization: ${promptDiagnostics.utilizationPercent}%`,
    `Prompt near limit: ${promptDiagnostics.nearLimit ? "yes" : "no"}`,
    `Prompt remaining chars: ${promptDiagnostics.remainingChars}`,
    "",
    "General game context:",
    `playerCount: ${context.gameContext.playerCount}`,
    ...context.gameContext.players.map((player) => `${player.label}: lifeTotal=${player.lifeTotal}`),
    "",
    "Optional battlefield context:",
    `items: ${context.battlefieldContext.length}`,
    battlefieldRows,
    "",
    "Ordered stack context (bottom to top):",
    stackRows
  ];

  return {
    answer: lines.join("\n")
  };
}
