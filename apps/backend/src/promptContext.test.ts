import { describe, expect, it } from "vitest";
import { buildPromptContext } from "./promptContext.js";
import { MAX_ORACLE_TEXT_CHARS } from "./promptNormalization.js";
import type { AskAiRequest } from "./types.js";

function createStackZoneCards(size: number): NonNullable<AskAiRequest["gameContext"]["zones"]["stack"]> {
  return Array.from({ length: size }, (_, index) => ({
    cardId: `card-${index + 1}`,
    name: `Card ${index + 1}`,
    oracleText: `Oracle text ${index + 1}`,
    imageUrl: "",
    manaCost: `{${index + 1}}`,
    manaValue: index + 1,
    typeLine: "Instant",
    colors: ["U"],
    supertypes: [] as string[],
    subtypes: [] as string[],
    caster: "Player 1" as const,
    targets: []
  }));
}

describe("buildPromptContext", () => {
  const defaultGameContext: AskAiRequest["gameContext"] = {
    playerCount: 2,
    players: [
      { label: "Player 1", lifeTotal: 20 },
      { label: "Player 2", lifeTotal: 20 }
    ],
    turnPhase: "main_1",
    selectedZones: ["stack"],
    zones: {}
  };

  it("applies fallback question for blank input", () => {
    const context = buildPromptContext({
      question: "   ",
      gameContext: {
        ...defaultGameContext,
        zones: { stack: createStackZoneCards(1) }
      }
    });

    expect(context.finalQuestion).toBe("Resolve the stack");
  });

  it("keeps stack order for multi-card input", () => {
    const context = buildPromptContext({
      question: "How does this resolve?",
      gameContext: {
        ...defaultGameContext,
        zones: { stack: createStackZoneCards(3) }
      }
    });

    expect(context.orderedStack.map((item) => item.cardId)).toEqual([
      "card-1",
      "card-2",
      "card-3"
    ]);
    expect(context.orderedStack.map((item) => item.stackRole)).toEqual([
      "bottom",
      "middle",
      "top"
    ]);
  });

  it("sets top role on single-card stacks", () => {
    const context = buildPromptContext({
      question: "Single",
      gameContext: {
        ...defaultGameContext,
        zones: { stack: createStackZoneCards(1) }
      }
    });

    expect(context.orderedStack).toHaveLength(1);
    expect(context.orderedStack[0]?.stackIndex).toBe(0);
    expect(context.orderedStack[0]?.stackRole).toBe("top");
  });

  it("supports near-cap stacks while preserving indexes", () => {
    const context = buildPromptContext({
      question: "Near cap",
      gameContext: {
        ...defaultGameContext,
        zones: { stack: createStackZoneCards(9) }
      }
    });

    expect(context.orderedStack).toHaveLength(9);
    expect(context.orderedStack[0]?.stackIndex).toBe(0);
    expect(context.orderedStack[8]?.stackIndex).toBe(8);
    expect(context.orderedStack[8]?.stackRole).toBe("top");
  });

  it("normalizes noisy text fields and truncates long oracle text", () => {
    const context = buildPromptContext({
      question: "  How   does\tthis resolve?\n",
      gameContext: {
        playerCount: 3,
        players: [
          { label: "Player 1", lifeTotal: 30 },
          { label: "Player 2", lifeTotal: 20 },
          { label: "Player 3", lifeTotal: 10 }
        ],
        turnPhase: "combat",
        selectedZones: ["battlefield", "stack"],
        zones: {
          battlefield: [
            {
              cardId: "rhystic-study",
              name: "  Rhystic   Study ",
              oracleText: "Whenever a player casts a spell, unless that player pays {1}, you draw a card.",
              imageUrl: "",
              manaCost: "",
              manaValue: 2,
              typeLine: "Enchantment",
              colors: [],
              supertypes: [],
              subtypes: [],
              contextNotes: "  tax effect ",
              targets: [{ kind: "none" as const }]
            }
          ],
          stack: [
            {
              cardId: "  card-1 ",
              name: "  Fancy   Name ",
              oracleText: `\n${"z".repeat(MAX_ORACLE_TEXT_CHARS + 60)}\n`,
              imageUrl: "  https://example.com/image.png  ",
              manaCost: " {1}{U} ",
              manaValue: 2,
              typeLine: "  Legendary   Creature —  Wizard  ",
              colors: ["U", "U", " "] as string[],
              supertypes: ["Legendary", "  "] as string[],
              subtypes: ["Wizard", "Wizard"] as string[],
              caster: "Player 4" as const,
              targets: [
                {
                  kind: "card" as const,
                  zone: "battlefield" as const,
                  cardId: "delver-of-secrets",
                  cardName: "   Delver of Secrets   "
                },
                {
                  kind: "player" as const,
                  targetPlayer: "Player 1" as const
                },
                {
                  kind: "none" as const
                },
                {
                  kind: "other" as const,
                  targetDescription: "   custom   target details   "
                }
              ],
              contextNotes: "  kicked  "
            }
          ]
        }
      }
    });

    expect(context.finalQuestion).toBe("How does this resolve?");
    expect(context.orderedStack[0]?.cardId).toBe("card-1");
    expect(context.orderedStack[0]?.name).toBe("Fancy Name");
    expect(context.orderedStack[0]?.imageUrl).toBe("https://example.com/image.png");
    expect(context.orderedStack[0]?.manaCost).toBe("{1}{U}");
    expect(context.orderedStack[0]?.typeLine).toBe("Legendary Creature — Wizard");
    expect(context.orderedStack[0]?.colors).toEqual(["U"]);
    expect(context.orderedStack[0]?.supertypes).toEqual(["Legendary"]);
    expect(context.orderedStack[0]?.subtypes).toEqual(["Wizard"]);
    expect(context.orderedStack[0]?.caster).toBe("Player 4");
    expect(context.orderedStack[0]?.targets).toEqual([
      { kind: "battlefield", targetPermanent: "Delver of Secrets" },
      { kind: "player", targetPlayer: "Player 1" },
      { kind: "none" },
      { kind: "other", targetDescription: "custom target details" }
    ]);
    expect(context.orderedStack[0]?.contextNotes).toBe("kicked");
    expect(context.orderedStack[0]?.manaSpent).toBe(2);
    expect(context.gameContext.players).toHaveLength(3);
    expect(context.battlefieldContext[0]?.name).toBe("Rhystic Study");
    expect((context.orderedStack[0]?.oracleText.length ?? 0) <= MAX_ORACLE_TEXT_CHARS).toBe(true);
  });
});
