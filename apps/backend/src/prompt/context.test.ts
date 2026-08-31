import { describe, expect, it } from "vitest";
import { buildLookupPromptContext, buildPromptContext } from "./context.js";
import { MAX_ORACLE_TEXT_CHARS } from "./normalization.js";
import type { GameAskAiRequest, LookupAskAiRequest } from "../types/index.js";

function createStackZoneCards(size: number): NonNullable<GameAskAiRequest["gameContext"]["zones"]["stack"]> {
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

function createBattlefieldCard(name = "Rhystic Study"): NonNullable<GameAskAiRequest["gameContext"]["zones"]["battlefield"]>[number] {
  return {
    cardId: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    oracleText: "Whenever a player casts a spell, unless that player pays {1}, you draw a card.",
    imageUrl: "",
    manaCost: "",
    manaValue: 0,
    typeLine: "Enchantment",
    colors: [],
    supertypes: [],
    subtypes: [],
    targets: []
  };
}

describe("Backend - Ask AI", () => {
  describe("buildPromptContext", () => {
    const defaultGameContext: GameAskAiRequest["gameContext"] = {
      playerCount: 2,
      players: [
        { label: "Player 1", lifeTotal: 20 },
        { label: "Player 2", lifeTotal: 20 }
      ],
      turnPhase: "main_1",
      selectedZones: ["stack"],
      zones: {}
    };

    it("applies stack fallback question for blank input when stack has cards", () => {
      const context = buildPromptContext({
        question: "   ",
        gameContext: {
          ...defaultGameContext,
          zones: { stack: createStackZoneCards(1) }
        }
      });

      expect(context.finalQuestion).toBe("Resolve the stack");
    });

    it("applies board-state fallback question for blank input when only non-stack zones have cards", () => {
      const context = buildPromptContext({
        question: "   ",
        gameContext: {
          ...defaultGameContext,
          selectedZones: ["battlefield", "stack"],
          zones: {
            battlefield: [createBattlefieldCard()]
          }
        }
      });

      expect(context.finalQuestion).toBe("Explain the interaction with the provided game state");
    });

    it("applies stack fallback question for blank input when stack and battlefield both have cards", () => {
      const context = buildPromptContext({
        question: "",
        gameContext: {
          ...defaultGameContext,
          selectedZones: ["battlefield", "stack"],
          zones: {
            battlefield: [createBattlefieldCard()],
            stack: createStackZoneCards(1)
          }
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

    it("preserves active player in prompt context", () => {
      const context = buildPromptContext({
        question: "Who is active?",
        gameContext: {
          ...defaultGameContext,
          activePlayer: "Player 2",
          zones: { stack: createStackZoneCards(1) }
        }
      });

      expect(context.gameContext.activePlayer).toBe("Player 2");
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
      expect(context.gameContext.turnPhase).toBe("combat");
      expect(context.populatedZones[0]?.zoneId).toBe("battlefield");
      expect(context.populatedZones[0]?.items[0]?.name).toBe("Rhystic Study");
      expect((context.orderedStack[0]?.oracleText.length ?? 0) <= MAX_ORACLE_TEXT_CHARS).toBe(true);
    });

    it("populates oracleText and metadata on non-stack zone items", () => {
      const context = buildPromptContext({
        question: "What does this do?",
        gameContext: {
          playerCount: 2,
          players: [
            { label: "Player 1", lifeTotal: 20 },
            { label: "Player 2", lifeTotal: 20 }
          ],
          turnPhase: "main_1",
          selectedZones: ["hand", "battlefield"],
          zones: {
            hand: [
              {
                cardId: "lightning-bolt",
                name: "Lightning Bolt",
                oracleText: "Lightning Bolt deals 3 damage to any target.",
                imageUrl: "https://example.com/bolt.png",
                manaCost: "{R}",
                manaValue: 1,
                typeLine: "Instant",
                colors: ["R"],
                supertypes: [],
                subtypes: [],
                contextNotes: "in hand",
                targets: []
              }
            ],
            battlefield: [createBattlefieldCard()]
          }
        }
      });

      const handZone = context.populatedZones.find((z) => z.zoneId === "hand");
      expect(handZone).toBeDefined();
      const handCard = handZone?.items[0];
      expect(handCard?.oracleText).toBe("Lightning Bolt deals 3 damage to any target.");
      expect(handCard?.manaCost).toBe("{R}");
      expect(handCard?.manaValue).toBe(1);
      expect(handCard?.typeLine).toBe("Instant");
      expect(handCard?.colors).toEqual(["R"]);
      expect(handCard?.supertypes).toEqual([]);
      expect(handCard?.subtypes).toEqual([]);
      expect(handCard?.contextNotes).toBe("in hand");
    });

    it("normalizes non-stack oracle text whitespace and truncates at cap", () => {
      const longOracle = `\n${"z".repeat(MAX_ORACLE_TEXT_CHARS + 40)}\n`;
      const context = buildPromptContext({
        question: "?",
        gameContext: {
          playerCount: 2,
          players: [
            { label: "Player 1", lifeTotal: 20 },
            { label: "Player 2", lifeTotal: 20 }
          ],
          turnPhase: "main_1",
          selectedZones: ["battlefield"],
          zones: {
            battlefield: [
              {
                cardId: "test-card",
                name: "Test Card",
                oracleText: longOracle,
                imageUrl: "",
                manaCost: "",
                manaValue: 0,
                typeLine: "Creature",
                colors: [],
                supertypes: [],
                subtypes: [],
                targets: []
              }
            ]
          }
        }
      });

      const item = context.populatedZones[0]?.items[0];
      expect(item?.oracleText.includes("\n")).toBe(false);
      expect((item?.oracleText.length ?? 0) <= MAX_ORACLE_TEXT_CHARS).toBe(true);
    });

    it("sets contextNotes on non-stack items from request contextNotes field", () => {
      const context = buildPromptContext({
        question: "?",
        gameContext: {
          playerCount: 2,
          players: [
            { label: "Player 1", lifeTotal: 20 },
            { label: "Player 2", lifeTotal: 20 }
          ],
          turnPhase: "main_1",
          selectedZones: ["graveyard"],
          zones: {
            graveyard: [
              {
                cardId: "snapcaster-mage",
                name: "Snapcaster Mage",
                oracleText: "Flash. When Snapcaster Mage enters, target instant or sorcery card in your graveyard gains flashback until end of turn.",
                imageUrl: "",
                manaCost: "{1}{U}",
                manaValue: 2,
                typeLine: "Creature — Human Wizard",
                colors: ["U"],
                supertypes: [],
                subtypes: ["Human", "Wizard"],
                contextNotes: "  flashback target  ",
                targets: []
              }
            ]
          }
        }
      });

      const item = context.populatedZones[0]?.items[0];
      expect(item?.contextNotes).toBe("flashback target");
    });

    it("normalizes populated player counters, strips zero/empty entries, and preserves request immutability", () => {
      const request: GameAskAiRequest = {
        question: "Status check",
        gameContext: {
          ...defaultGameContext,
          players: [
            {
              label: "Player 1",
              lifeTotal: 30,
              poison: 3,
              experience: 0,
              energy: 4,
              commanderDamage: [
                { from: "Player 2", amount: 5 },
                { from: "Player 2", amount: 0 }
              ],
              counters: [
                { name: "Monarch", amount: 1 },
                { name: "Ignored", amount: 0 }
              ]
            },
            { label: "Player 2", lifeTotal: 20 }
          ]
        }
      };
      const requestSnapshot = JSON.parse(JSON.stringify(request));

      const context = buildPromptContext(request);

      expect(context.gameContext.players[0]).toEqual({
        label: "Player 1",
        lifeTotal: 30,
        poison: 3,
        energy: 4,
        commanderDamage: [{ from: "Player 2", amount: 5 }],
        counters: [{ name: "Monarch", amount: 1 }]
      });
      expect(context.gameContext.players[1]).toEqual({ label: "Player 2", lifeTotal: 20 });
      expect(request).toEqual(requestSnapshot);
    });

    it("omits counter fields entirely for players with no populated counters", () => {
      const context = buildPromptContext({
        question: "Status",
        gameContext: defaultGameContext
      });

      expect(context.gameContext.players).toEqual([
        { label: "Player 1", lifeTotal: 20 },
        { label: "Player 2", lifeTotal: 20 }
      ]);
    });
  });

  describe("buildLookupPromptContext", () => {
    it("normalizes the question, conversation history, and complete card metadata for a single attached card", () => {
      const request: LookupAskAiRequest = {
        mode: "lookup",
        question: "  How   does this work? ",
        cards: [
          {
            cardId: "  questing-beast ",
            name: "  Questing   Beast ",
            oracleText: "  Vigilance,   deathtouch, haste  ",
            imageUrl: " https://example.com/questing-beast.png ",
            manaCost: " {2}{G}{G} ",
            manaValue: 4,
            typeLine: " Legendary   Creature — Beast ",
            colors: ["G", "G", " "],
            supertypes: ["Legendary", " "],
            subtypes: ["Beast", "Beast"]
          }
        ],
        conversationHistory: [
          { role: "user", content: "Earlier question" },
          { role: "assistant", content: "Earlier answer" }
        ]
      };

      expect(buildLookupPromptContext(request)).toEqual({
        finalQuestion: "How does this work?",
        cards: [
          {
            cardId: "questing-beast",
            name: "Questing Beast",
            oracleText: "Vigilance, deathtouch, haste",
            imageUrl: "https://example.com/questing-beast.png",
            manaCost: "{2}{G}{G}",
            manaValue: 4,
            typeLine: "Legendary Creature — Beast",
            colors: ["G"],
            supertypes: ["Legendary"],
            subtypes: ["Beast"],
            targets: []
          }
        ],
        conversationHistory: request.conversationHistory
      });
    });

    it("normalizes every attached card, in order, for a multi-card lookup request (REQ-167)", () => {
      const request: LookupAskAiRequest = {
        mode: "lookup",
        question: "How do these interact?",
        cards: [
          {
            cardId: "card-one",
            name: "Card One",
            oracleText: "Card one text",
            imageUrl: "",
            manaCost: "{1}",
            manaValue: 1,
            typeLine: "Instant",
            colors: [],
            supertypes: [],
            subtypes: []
          },
          {
            cardId: "card-two",
            name: "Card Two",
            oracleText: "Card two text",
            imageUrl: "",
            manaCost: "{2}",
            manaValue: 2,
            typeLine: "Sorcery",
            colors: [],
            supertypes: [],
            subtypes: []
          }
        ]
      };

      const context = buildLookupPromptContext(request);
      expect(context.cards).toHaveLength(2);
      expect(context.cards?.map((card) => card.cardId)).toEqual(["card-one", "card-two"]);
      expect(context.cards?.map((card) => card.name)).toEqual(["Card One", "Card Two"]);
    });

    it("does not apply the game-mode fallback question when lookup text is blank", () => {
      expect(buildLookupPromptContext({ mode: "lookup", question: "   " })).toEqual({
        finalQuestion: ""
      });
    });

    it("omits cards entirely when zero cards are attached", () => {
      expect(buildLookupPromptContext({ mode: "lookup", question: "How does trample work?" })).toEqual({
        finalQuestion: "How does trample work?"
      });
    });
  });
});
