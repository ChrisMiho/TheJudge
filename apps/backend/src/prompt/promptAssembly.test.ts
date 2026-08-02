import { describe, expect, it } from "vitest";
import { buildLookupPromptText, buildPromptText } from "./promptAssembly.js";
import { SYSTEM_ROLE_PREAMBLE_LINES } from "./promptFormatting.js";
import { MAX_CONTEXT_NOTES_CHARS, MAX_PROMPT_CHAR_BUDGET, MAX_TARGET_LABEL_CHARS } from "./normalization.js";
import type { RetrievedGameRule } from "../gameRulesRetrieval.js";
import type { GameRulesTopic } from "../gameRules.js";
import type { ConversationTurn, LookupPromptContext, PromptContext } from "../types/index.js";

const sampleGameRulesTopics: GameRulesTopic[] = [
  {
    id: "stack-basics",
    title: "The Stack",
    ruleNumbers: ["405.1"],
    excerpt: "405.1. When a spell is cast, the physical card is put on the stack."
  },
  {
    id: "zone-change",
    title: "Zone Changes",
    ruleNumbers: ["400.1"],
    excerpt: "400.1. A zone is a place where objects can be during a game."
  }
];

const baseContext: PromptContext = {
  finalQuestion: "How does this resolve?",
  gameContext: {
    playerCount: 2,
    players: [
      { label: "Player 1", lifeTotal: 20 },
      { label: "Player 2", lifeTotal: 17 }
    ],
    turnPhase: "main_1",
    selectedZones: ["battlefield", "stack"]
  },
  populatedZones: [
    {
      zoneId: "battlefield",
      items: [
        {
          cardId: "rhystic-study",
          name: "Rhystic Study",
          oracleText: "Whenever a player casts a spell, unless that player pays {1}, you draw a card.",
          imageUrl: "",
          manaCost: "{2}{U}",
          manaValue: 3,
          typeLine: "Enchantment",
          colors: ["U"],
          supertypes: [],
          subtypes: [],
          targets: [{ kind: "none" }],
          contextNotes: "Tax effect"
        }
      ]
    }
  ],
  orderedStack: [
    {
      cardId: "card-1",
      name: "Opt",
      oracleText: "Scry 1, then draw a card.",
      imageUrl: "",
      manaCost: "{U}",
      manaValue: 1,
      typeLine: "Instant",
      colors: ["U"],
      supertypes: [],
      subtypes: [],
      caster: "Player 1",
      targets: [],
      manaSpent: 1,
      contextNotes: "",
      stackIndex: 0,
      stackRole: "bottom"
    },
    {
      cardId: "card-2",
      name: "Counterspell",
      oracleText: "Counter target spell.",
      imageUrl: "",
      manaCost: "{U}{U}",
      manaValue: 2,
      typeLine: "Instant",
      colors: ["U"],
      supertypes: [],
      subtypes: [],
      caster: "Player 3",
      targets: [
        { kind: "stack", targetCardId: "card-1", targetCardName: "Opt" },
        { kind: "none" },
        { kind: "other", targetDescription: "custom context target" }
      ],
      manaSpent: 5,
      contextNotes: "kicker paid",
      stackIndex: 1,
      stackRole: "top"
    }
  ]
};

describe("Backend - Ask AI", () => {
  describe("buildPromptText", () => {
    it("builds deterministic prompt output with fixed section order", () => {
      const first = buildPromptText(baseContext);
      const second = buildPromptText(baseContext);

      expect(first).toBe(second);
      expect(first.startsWith(`SYSTEM ROLE PREAMBLE\n${SYSTEM_ROLE_PREAMBLE_LINES[0]}`)).toBe(true);
      expect(first.indexOf("SYSTEM ROLE PREAMBLE")).toBeLessThan(first.indexOf("MTG REFERENCE"));
      expect(first.indexOf("MTG REFERENCE")).toBeLessThan(first.indexOf("GENERAL GAME CONTEXT"));
      expect(first.indexOf("GENERAL GAME CONTEXT")).toBeLessThan(first.indexOf("PHASE GUIDANCE"));
      expect(first.indexOf("PHASE GUIDANCE")).toBeLessThan(first.indexOf("ZONE: STACK (BOTTOM TO TOP)"));
      expect(first.indexOf("ZONE: STACK (BOTTOM TO TOP)")).toBeLessThan(first.indexOf("ZONE: BATTLEFIELD"));
      expect(first.indexOf("ZONE: BATTLEFIELD")).toBeLessThan(first.indexOf("SCOPE"));
      expect(first.indexOf("SCOPE")).toBeLessThan(first.indexOf("QUESTION"));
    });

    it("includes PHASE GUIDANCE for key phases", () => {
      const phases = ["main_1", "main_2", "combat", "untap"] as const;
      for (const phase of phases) {
        const prompt = buildPromptText({ ...baseContext, gameContext: { ...baseContext.gameContext, turnPhase: phase } });
        expect(prompt, `missing PHASE GUIDANCE for ${phase}`).toContain("PHASE GUIDANCE");
      }
    });

    it("includes PHASE GUIDANCE even when no zones are populated", () => {
      const prompt = buildPromptText({ ...baseContext, populatedZones: [], orderedStack: [] });
      expect(prompt).toContain("PHASE GUIDANCE");
    });

    it("places PHASE GUIDANCE after GENERAL GAME CONTEXT and before any ZONE section", () => {
      const prompt = buildPromptText(baseContext);
      const gcIdx = prompt.indexOf("GENERAL GAME CONTEXT");
      const pgIdx = prompt.indexOf("PHASE GUIDANCE");
      const zoneIdx = prompt.indexOf("ZONE:");
      expect(gcIdx).toBeLessThan(pgIdx);
      expect(pgIdx).toBeLessThan(zoneIdx);
    });

    it("differentiates declare_blockers combat guidance from generic combat guidance", () => {
      const genericContext = { ...baseContext, gameContext: { ...baseContext.gameContext, turnPhase: "combat" as const } };
      const stepContext = { ...baseContext, gameContext: { ...baseContext.gameContext, turnPhase: "combat" as const, combatStep: "declare_blockers" as const } };
      const genericPrompt = buildPromptText(genericContext);
      const stepPrompt = buildPromptText(stepContext);
      const genericGuidance = genericPrompt.slice(genericPrompt.indexOf("PHASE GUIDANCE"), genericPrompt.indexOf("SCOPE"));
      const stepGuidance = stepPrompt.slice(stepPrompt.indexOf("PHASE GUIDANCE"), stepPrompt.indexOf("SCOPE"));
      expect(stepGuidance).not.toBe(genericGuidance);
      expect(stepGuidance).toContain("declare blockers");
    });

    it("produces main_2 PHASE GUIDANCE that is distinct from and longer than main_1", () => {
      const main1Prompt = buildPromptText({ ...baseContext, gameContext: { ...baseContext.gameContext, turnPhase: "main_1" } });
      const main2Prompt = buildPromptText({ ...baseContext, gameContext: { ...baseContext.gameContext, turnPhase: "main_2" } });
      const main1Guidance = main1Prompt.slice(main1Prompt.indexOf("PHASE GUIDANCE"), main1Prompt.indexOf("ZONE:"));
      const main2Guidance = main2Prompt.slice(main2Prompt.indexOf("PHASE GUIDANCE"), main2Prompt.indexOf("ZONE:"));
      expect(main2Guidance.length).toBeGreaterThan(main1Guidance.length);
      expect(main2Guidance).not.toBe(main1Guidance);
    });

    it("includes MTG reference block with rules content", () => {
      const prompt = buildPromptText(baseContext);
      expect(prompt).toContain("MTG REFERENCE");
      expect(prompt).toContain("layer system");
      expect(prompt).toContain("turnPhase: main_1");
    });

    it("includes uncertainty and non-invention guardrails", () => {
      const prompt = buildPromptText(baseContext);

      expect(prompt).toContain("SYSTEM ROLE PREAMBLE");
      for (const line of SYSTEM_ROLE_PREAMBLE_LINES) {
        expect(prompt).toContain(line);
      }
      expect(prompt).toContain("State uncertainty when context is incomplete.");
      expect(prompt).toContain("Do not invent hidden state, targets, or board conditions.");
      expect(prompt).toContain("playerCount: 2");
      expect(prompt).toContain("caster: Player 3");
      expect(prompt).toContain("manaSpent: 5");
      expect(prompt).toContain("targets: stack:Opt | none:does-not-target | other:custom context target");
      expect(prompt).toContain("Stack item 1 (bottom)");
      expect(prompt).toContain("Stack item 2 (top)");
      expect(prompt).toContain("card: Opt");
      expect(prompt).toContain("card: Counterspell");
      expect(prompt).not.toContain("cardId:");
    });

    it("resolves player display names for active player, caster, owner, and player targets", () => {
      const prompt = buildPromptText({
        finalQuestion: "How does this resolve?",
        gameContext: {
          playerCount: 2,
          players: [
            { label: "Player 1", lifeTotal: 40, displayName: "Alice" },
            { label: "Player 2", lifeTotal: 40, displayName: "Bob" }
          ],
          turnPhase: "combat",
          activePlayer: "Player 1",
          selectedZones: ["battlefield", "stack"]
        },
        populatedZones: [
          {
            zoneId: "battlefield",
            items: [
              {
                cardId: "rhystic-study",
                name: "Rhystic Study",
                oracleText: "Whenever a player casts a spell, unless that player pays {1}, you draw a card.",
                imageUrl: "",
                manaCost: "{2}{U}",
                manaValue: 3,
                typeLine: "Enchantment",
                colors: ["U"],
                supertypes: [],
                subtypes: [],
                owner: "Player 1",
                targets: [{ kind: "player", targetPlayer: "Player 2" }]
              }
            ]
          }
        ],
        orderedStack: [
          {
            cardId: "card-1",
            name: "Opt",
            oracleText: "Scry 1, then draw a card.",
            imageUrl: "",
            manaCost: "{U}",
            manaValue: 1,
            typeLine: "Instant",
            colors: ["U"],
            supertypes: [],
            subtypes: [],
            caster: "Player 2",
            targets: [{ kind: "player", targetPlayer: "Player 1" }],
            manaSpent: 1,
            stackIndex: 0,
            stackRole: "top"
          }
        ]
      });

      expect(prompt).toContain("Player 1: lifeTotal=40 displayName=Alice");
      expect(prompt).toContain("Player 2: lifeTotal=40 displayName=Bob");
      expect(prompt).toContain("activePlayer: Player 1 (Alice)");
      expect(prompt).toContain("caster: Player 2 (Bob)");
      expect(prompt).toContain("targets: player:Player 1 (Alice)");
      expect(prompt).toContain("owner: Player 1 (Alice)");
      expect(prompt).toContain("targets: player:Player 2 (Bob)");
    });

    it("keeps player references unchanged when no custom display names are set", () => {
      const prompt = buildPromptText({
        ...baseContext,
        gameContext: {
          ...baseContext.gameContext,
          activePlayer: "Player 1"
        },
        populatedZones: [
          {
            zoneId: "battlefield",
            items: [
              {
                cardId: "rhystic-study",
                name: "Rhystic Study",
                oracleText: "Whenever a player casts a spell, unless that player pays {1}, you draw a card.",
                imageUrl: "",
                manaCost: "{2}{U}",
                manaValue: 3,
                typeLine: "Enchantment",
                colors: ["U"],
                supertypes: [],
                subtypes: [],
                owner: "Player 1",
                targets: [{ kind: "player", targetPlayer: "Player 2" }]
              }
            ]
          }
        ]
      });

      expect(prompt).toContain("activePlayer: Player 1");
      expect(prompt).toContain("caster: Player 1");
      expect(prompt).toContain("owner: Player 1");
      expect(prompt).toContain("targets: player:Player 2");
      expect(prompt).not.toContain("Player 1 (");
      expect(prompt).not.toContain("Player 2 (");
    });

    it("places question at the end of the prompt", () => {
      const prompt = buildPromptText(baseContext);
      const questionIdx = prompt.indexOf("QUESTION");
      const scopeIdx = prompt.indexOf("SCOPE");
      expect(scopeIdx).toBeLessThan(questionIdx);
      expect(prompt.lastIndexOf("QUESTION")).toBe(questionIdx);
    });

    it("places GAME RULES section after zones and before OFFICIAL RULINGS", () => {
      const prompt = buildPromptText(baseContext, {
        gameRulesTopics: sampleGameRulesTopics,
        rulings: {
          sectionChars: 74,
          cards: [
            {
              cardId: "rhystic-study",
              name: "Rhystic Study",
              rulings: [{ publishedAt: "2020-04-17", comment: "If an opponent casts a spell, you may draw a card." }]
            }
          ]
        }
      });

      expect(prompt).toContain("GAME RULES (reference)");
      expect(prompt).toContain("The Stack");
      expect(prompt).toContain("405.1. When a spell is cast");
      expect(prompt).toContain("Use these general Magic rules as shared vocabulary.");
      expect(prompt.indexOf("ZONE: BATTLEFIELD")).toBeLessThan(prompt.indexOf("GAME RULES (reference)"));
      expect(prompt.indexOf("GAME RULES (reference)")).toBeLessThan(prompt.indexOf("OFFICIAL RULINGS"));
      expect(prompt.indexOf("OFFICIAL RULINGS")).toBeLessThan(prompt.indexOf("SCOPE"));
    });

    it("omits GAME RULES section when no topics provided", () => {
      const prompt = buildPromptText(baseContext, { gameRulesTopics: [] });
      expect(prompt).not.toContain("GAME RULES (reference)");
    });

    it("inserts official rulings between zones and scope when provided", () => {
      const prompt = buildPromptText(baseContext, {
        rulings: {
          sectionChars: 74,
          cards: [
            {
              cardId: "rhystic-study",
              name: "Rhystic Study",
              rulings: [
                {
                  publishedAt: "2020-04-17",
                  comment: "If an opponent casts a spell, you may draw a card unless that player pays {1}."
                }
              ]
            }
          ]
        }
      });

      expect(prompt).toContain("OFFICIAL RULINGS (WotC reference)");
      expect(prompt).toContain("Rhystic Study\n- 2020-04-17: If an opponent casts a spell");
      expect(prompt.indexOf("ZONE: BATTLEFIELD")).toBeLessThan(prompt.indexOf("OFFICIAL RULINGS"));
      expect(prompt.indexOf("OFFICIAL RULINGS")).toBeLessThan(prompt.indexOf("SCOPE"));
      expect(prompt).not.toContain("rhystic-study");
    });

    it("omits official rulings section when no rulings are resolved", () => {
      const prompt = buildPromptText(baseContext, { rulings: { sectionChars: 0, cards: [] } });
      expect(prompt).not.toContain("OFFICIAL RULINGS");
    });

    it("renders ZONE: BATTLEFIELD section when battlefield is populated", () => {
      const prompt = buildPromptText(baseContext);
      expect(prompt).toContain("ZONE: BATTLEFIELD");
      expect(prompt).toContain("name: Rhystic Study");
    });

    it("renders oracleText in non-stack zone sections", () => {
      const prompt = buildPromptText(baseContext);
      expect(prompt).toContain("ZONE: BATTLEFIELD");
      expect(prompt).toContain("oracleText: Whenever a player casts a spell");
    });

    it("renders contextNotes (not details) in non-stack zone sections", () => {
      const prompt = buildPromptText(baseContext);
      expect(prompt).toContain("contextNotes: Tax effect");
      expect(prompt).not.toContain("details:");
    });

    it("renders full metadata block in non-stack zone sections", () => {
      const prompt = buildPromptText(baseContext);
      expect(prompt).toContain("manaCost: {2}{U}");
      expect(prompt).toContain("manaValue: 3");
      expect(prompt).toContain("typeLine: Enchantment");
      expect(prompt).toContain("colors: U");
    });

    it("renders oracleText sentinel when non-stack card oracle is empty", () => {
      const context: PromptContext = {
        ...baseContext,
        populatedZones: [
          {
            zoneId: "hand",
            items: [
              {
                cardId: "token-id",
                name: "Bear Token",
                oracleText: "",
                imageUrl: "",
                manaCost: "",
                manaValue: 0,
                typeLine: "Token Creature — Bear",
                colors: [],
                supertypes: [],
                subtypes: ["Bear"],
                targets: []
              }
            ]
          }
        ]
      };
      const prompt = buildPromptText(context);
      expect(prompt).toContain("oracleText: (none) — no oracle text recorded for this card");
    });

    it("renders oracleText in stack section", () => {
      const prompt = buildPromptText(baseContext);
      expect(prompt).toContain("ZONE: STACK (BOTTOM TO TOP)");
      expect(prompt).toContain("oracleText: Scry 1, then draw a card.");
    });

    it("renders no zone sections when all zones are empty", () => {
      const prompt = buildPromptText({
        ...baseContext,
        populatedZones: [],
        orderedStack: []
      });
      expect(prompt).not.toContain("ZONE:");
      expect(prompt).toContain("SCOPE");
    });

    it("includes scope sentence listing unpopulated zones", () => {
      const prompt = buildPromptText(baseContext);
      expect(prompt).toContain("SCOPE");
      expect(prompt).toContain("Zones with no cards or not included");
      expect(prompt).toContain("hand");
      expect(prompt).not.toContain("stack,");
      expect(prompt).not.toContain("battlefield,");
    });

    it("stays under configured prompt budget for normal payloads with game rules", () => {
      const prompt = buildPromptText(baseContext, { gameRulesTopics: sampleGameRulesTopics });
      expect(prompt.length).toBeLessThan(MAX_PROMPT_CHAR_BUDGET);
      expect(MAX_PROMPT_CHAR_BUDGET).toBe(1_000_000);
    });

    it("truncates long context notes and target labels deterministically", () => {
      const prompt = buildPromptText({
        ...baseContext,
        orderedStack: [
          {
            ...baseContext.orderedStack[0]!,
            targets: [
              {
                kind: "other",
                targetDescription: "z".repeat(MAX_TARGET_LABEL_CHARS + 30)
              }
            ],
            contextNotes: "n".repeat(MAX_CONTEXT_NOTES_CHARS + 40)
          }
        ]
      });

      expect(prompt).toContain("targets: other:");
      expect(prompt).toContain("...(truncated)");
      expect(prompt).toContain("contextNotes: ");
    });
  });

  describe("buildPromptText supplemental rules", () => {
    const sampleSupplementalRules: RetrievedGameRule[] = [
      { ruleId: "116.1", sectionTitle: "Timing", text: "Unless a spell or ability has a timing restriction.", score: 10 }
    ];

    it("places ADDITIONAL RELEVANT RULE EXCERPTS after GAME RULES and before OFFICIAL RULINGS", () => {
      const prompt = buildPromptText(baseContext, {
        gameRulesTopics: sampleGameRulesTopics,
        supplementalRules: sampleSupplementalRules,
        rulings: {
          sectionChars: 74,
          cards: [
            {
              cardId: "rhystic-study",
              name: "Rhystic Study",
              rulings: [{ publishedAt: "2020-04-17", comment: "If an opponent casts a spell, you may draw a card." }]
            }
          ]
        }
      });

      expect(prompt).toContain("ADDITIONAL RELEVANT RULE EXCERPTS");
      expect(prompt.indexOf("GAME RULES (reference)")).toBeLessThan(prompt.indexOf("ADDITIONAL RELEVANT RULE EXCERPTS"));
      expect(prompt.indexOf("ADDITIONAL RELEVANT RULE EXCERPTS")).toBeLessThan(prompt.indexOf("OFFICIAL RULINGS"));
      expect(prompt.indexOf("OFFICIAL RULINGS")).toBeLessThan(prompt.indexOf("SCOPE"));
    });

    it("omits ADDITIONAL RELEVANT RULE EXCERPTS section when supplemental rules array is empty", () => {
      const prompt = buildPromptText(baseContext, {
        gameRulesTopics: sampleGameRulesTopics,
        supplementalRules: []
      });
      expect(prompt).not.toContain("ADDITIONAL RELEVANT RULE EXCERPTS");
    });

    it("omits ADDITIONAL RELEVANT RULE EXCERPTS section when supplementalRules not provided", () => {
      const prompt = buildPromptText(baseContext, { gameRulesTopics: sampleGameRulesTopics });
      expect(prompt).not.toContain("ADDITIONAL RELEVANT RULE EXCERPTS");
    });

    it("renders supplemental rules when no GAME RULES section is present", () => {
      const prompt = buildPromptText(baseContext, { supplementalRules: sampleSupplementalRules });
      expect(prompt).toContain("ADDITIONAL RELEVANT RULE EXCERPTS");
      expect(prompt).toContain("116.1. Unless a spell or ability has a timing restriction.");
      expect(prompt).not.toContain("GAME RULES (reference)");
      expect(prompt.indexOf("ADDITIONAL RELEVANT RULE EXCERPTS")).toBeLessThan(prompt.indexOf("SCOPE"));
    });
  });

  describe("buildPromptText conversation history", () => {
    it("omits CONVERSATION HISTORY section when no history provided", () => {
      const prompt = buildPromptText(baseContext);
      expect(prompt).not.toContain("CONVERSATION HISTORY");
    });

    it("includes CONVERSATION HISTORY section immediately before QUESTION when history provided", () => {
      const history: ConversationTurn[] = [
        { role: "user", content: "First question" },
        { role: "assistant", content: "First answer" }
      ];
      const prompt = buildPromptText(baseContext, { conversationHistory: history });
      expect(prompt).toContain("CONVERSATION HISTORY");
      const historyIdx = prompt.indexOf("CONVERSATION HISTORY");
      const questionIdx = prompt.indexOf("\nQUESTION\n");
      const scopeIdx = prompt.indexOf("SCOPE");
      expect(scopeIdx).toBeLessThan(historyIdx);
      expect(historyIdx).toBeLessThan(questionIdx);
    });

    it("formats turns as User:/Assistant: lines in array order", () => {
      const history: ConversationTurn[] = [
        { role: "user", content: "Turn one" },
        { role: "assistant", content: "Reply one" },
        { role: "user", content: "Turn two" },
        { role: "assistant", content: "Reply two" }
      ];
      const prompt = buildPromptText(baseContext, { conversationHistory: history });
      const historyStart = prompt.indexOf("CONVERSATION HISTORY");
      const historyEnd = prompt.indexOf("\nQUESTION\n");
      const historyBlock = prompt.slice(historyStart, historyEnd);
      expect(historyBlock.indexOf("User: Turn one")).toBeLessThan(historyBlock.indexOf("Assistant: Reply one"));
      expect(historyBlock.indexOf("Assistant: Reply one")).toBeLessThan(historyBlock.indexOf("User: Turn two"));
      expect(historyBlock.indexOf("User: Turn two")).toBeLessThan(historyBlock.indexOf("Assistant: Reply two"));
    });

    it("includes INSTRUCTIONS follow-up tweak line when history is present", () => {
      const history: ConversationTurn[] = [
        { role: "user", content: "Follow-up?" },
        { role: "assistant", content: "Sure." }
      ];
      const withHistory = buildPromptText(baseContext, { conversationHistory: history });
      const withoutHistory = buildPromptText(baseContext);
      expect(withHistory).toContain("frozen game state and prior answers");
      expect(withoutHistory).not.toContain("frozen game state and prior answers");
    });

    it("includes full history when total chars are within budget", () => {
      const history: ConversationTurn[] = [
        { role: "user", content: "short question" },
        { role: "assistant", content: "short answer" }
      ];
      const prompt = buildPromptText(baseContext, { conversationHistory: history });
      expect(prompt).toContain("User: short question");
      expect(prompt).toContain("Assistant: short answer");
    });

    it("includes all turns when history is well within the 1M budget", () => {
      const history: ConversationTurn[] = [
        { role: "user", content: "OLDEST-USER-" + "x".repeat(1988) },
        { role: "assistant", content: "OLDEST-ASST-" + "x".repeat(1988) },
        { role: "user", content: "NEWER-USER-" + "x".repeat(1989) },
        { role: "assistant", content: "NEWER-ASST-" + "x".repeat(1989) },
        { role: "user", content: "recent-question" },
        { role: "assistant", content: "recent-answer" }
      ];
      const prompt = buildPromptText(baseContext, { conversationHistory: history });
      expect(prompt).toContain("recent-question");
      expect(prompt).toContain("NEWER-USER-");
      expect(prompt).toContain("OLDEST-USER-");
      expect(prompt).toContain("OLDEST-ASST-");
    });
  });

  describe("buildLookupPromptText", () => {
    const lookupContext: LookupPromptContext = {
      finalQuestion: "How does deathtouch work?"
    };

    it("assembles the no-card lookup sections in order with lookup guardrails", () => {
      const prompt = buildLookupPromptText(lookupContext, {
        gameRulesTopics: sampleGameRulesTopics,
        supplementalRules: [
          {
            ruleId: "702.2",
            sectionTitle: "Deathtouch",
            text: "Deathtouch is a static ability.",
            score: 12
          }
        ]
      });

      const headers = [
        "SYSTEM ROLE PREAMBLE\n",
        "\nINSTRUCTIONS\n",
        "\nMTG REFERENCE\n",
        "\nGAME RULES (reference)\n",
        "\nADDITIONAL RELEVANT RULE EXCERPTS\n",
        "\nQUESTION\n"
      ];
      for (let index = 1; index < headers.length; index++) {
        expect(prompt.indexOf(headers[index - 1]!)).toBeLessThan(prompt.indexOf(headers[index]!));
      }
      expect(prompt).toContain("quote rule text only from the provided GAME RULES");
      expect(prompt).toContain("not found in the rules corpus");
      expect(prompt).toContain("never answer the off-domain question directly");
      expect(prompt).not.toContain("GENERAL GAME CONTEXT");
      expect(prompt).not.toContain("PHASE GUIDANCE");
      expect(prompt).not.toContain("ZONE:");
      expect(prompt).not.toContain("\nSCOPE\n");
      expect(prompt).not.toContain("CARD (looked up)");
      expect(prompt).not.toContain("OFFICIAL RULINGS");
    });

    it("adds normalized card metadata and official rulings only for an attached card", () => {
      const prompt = buildLookupPromptText(
        {
          ...lookupContext,
          card: {
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
        },
        {
          rulings: {
            sectionChars: 42,
            cards: [
              {
                cardId: "questing-beast",
                name: "Questing Beast",
                rulings: [{ publishedAt: "2019-10-04", comment: "Combat damage can't be prevented." }]
              }
            ]
          }
        }
      );

      expect(prompt).toContain("CARD (looked up)\nname: Questing Beast");
      expect(prompt).toContain("manaCost: {2}{G}{G}");
      expect(prompt).toContain("manaValue: 4");
      expect(prompt).toContain("typeLine: Legendary Creature — Beast");
      expect(prompt).toContain("oracleText: Vigilance, deathtouch, haste");
      expect(prompt).not.toContain("targets:");
      expect(prompt).not.toContain("contextNotes:");
      expect(prompt.indexOf("CARD (looked up)")).toBeLessThan(prompt.indexOf("OFFICIAL RULINGS"));
    });

    it("places conversation history immediately before the lookup question", () => {
      const prompt = buildLookupPromptText({
        ...lookupContext,
        conversationHistory: [
          { role: "user", content: "Earlier question" },
          { role: "assistant", content: "Earlier answer" }
        ]
      });

      expect(prompt).toContain("CONVERSATION HISTORY\nUser: Earlier question\nAssistant: Earlier answer");
      expect(prompt.indexOf("CONVERSATION HISTORY")).toBeLessThan(prompt.indexOf("\nQUESTION\n"));
    });
  });
});
