import { describe, expect, it } from "vitest";
import {
  MAX_CONTEXT_NOTES_CHARS,
  MAX_ORACLE_TEXT_CHARS,
  MAX_PROMPT_CHAR_BUDGET,
  MAX_TARGET_LABEL_CHARS,
  SYSTEM_ROLE_PREAMBLE_LINES,
  buildPromptText,
  buildZoneScopeSentence,
  formatConversationHistorySection,
  formatSupplementalRulesSection,
  getPromptDiagnostics,
  normalizeCardText,
  normalizeQuestion,
  normalizeWhitespace,
  truncateConversationHistory,
  truncateOracleText
} from "./normalization.js";
import type { RetrievedGameRule } from "../gameRulesRetrieval.js";
import type { GameRulesTopic } from "../gameRules.js";
import type { ConversationTurn, PromptContext } from "../types/index.js";

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
      items: [{ cardId: "rhystic-study", name: "Rhystic Study", details: "Tax effect", targets: [{ kind: "none" }] }]
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

describe("prompt normalization", () => {
  it("normalizes whitespace consistently", () => {
    expect(normalizeWhitespace("  A   B\nC\tD  ")).toBe("A B C D");
    expect(normalizeQuestion("  What   happens\t now? ")).toBe("What happens now?");
  });

  it("truncates long oracle text with deterministic suffix", () => {
    const longText = "x".repeat(MAX_ORACLE_TEXT_CHARS + 50);
    const truncated = truncateOracleText(longText);

    expect(truncated.length).toBe(MAX_ORACLE_TEXT_CHARS);
    expect(truncated.endsWith(" ...(truncated)")).toBe(true);
  });

  it("normalizes and truncates card text", () => {
    const longText = `  line one\n\n${"y".repeat(MAX_ORACLE_TEXT_CHARS + 10)}  `;
    const normalized = normalizeCardText(longText);

    expect(normalized.includes("\n")).toBe(false);
    expect(normalized.length).toBe(MAX_ORACLE_TEXT_CHARS);
  });
});

describe("buildZoneScopeSentence", () => {
  it("lists all zones when none are populated", () => {
    const sentence = buildZoneScopeSentence(["stack"], []);
    expect(sentence).toContain("stack, battlefield, hand, graveyard, exile, library, command");
    expect(sentence).toContain("Zones with no cards or not included");
  });

  it("excludes populated zones from scope sentence", () => {
    const sentence = buildZoneScopeSentence(["stack", "battlefield"], ["stack", "battlefield"]);
    expect(sentence).toContain("hand, graveyard, exile, library, command");
    expect(sentence).not.toContain("stack");
    expect(sentence).not.toContain("battlefield");
  });

  it("uses canonical zone order in scope sentence", () => {
    const sentence = buildZoneScopeSentence(["stack"], ["stack"]);
    const colonIdx = sentence.indexOf(":");
    const zonesPart = sentence.slice(colonIdx + 2);
    expect(zonesPart.startsWith("battlefield")).toBe(true);
  });

  it("returns all-included string when every zone is populated", () => {
    const allZones = ["stack", "battlefield", "hand", "graveyard", "exile", "library", "command"] as const;
    const sentence = buildZoneScopeSentence([...allZones], [...allZones]);
    expect(sentence).toBe("(all zones included)");
  });
});

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

  it("PHASE GUIDANCE appears after GENERAL GAME CONTEXT and before any ZONE section", () => {
    const prompt = buildPromptText(baseContext);
    const gcIdx = prompt.indexOf("GENERAL GAME CONTEXT");
    const pgIdx = prompt.indexOf("PHASE GUIDANCE");
    const zoneIdx = prompt.indexOf("ZONE:");
    expect(gcIdx).toBeLessThan(pgIdx);
    expect(pgIdx).toBeLessThan(zoneIdx);
  });

  it("combat guidance with declare_blockers combatStep differs from generic combat guidance", () => {
    const genericContext = { ...baseContext, gameContext: { ...baseContext.gameContext, turnPhase: "combat" as const } };
    const stepContext = { ...baseContext, gameContext: { ...baseContext.gameContext, turnPhase: "combat" as const, combatStep: "declare_blockers" as const } };
    const genericPrompt = buildPromptText(genericContext);
    const stepPrompt = buildPromptText(stepContext);
    const genericGuidance = genericPrompt.slice(genericPrompt.indexOf("PHASE GUIDANCE"), genericPrompt.indexOf("SCOPE"));
    const stepGuidance = stepPrompt.slice(stepPrompt.indexOf("PHASE GUIDANCE"), stepPrompt.indexOf("SCOPE"));
    expect(stepGuidance).not.toBe(genericGuidance);
    expect(stepGuidance).toContain("declare blockers");
  });

  it("main_2 PHASE GUIDANCE is distinct from and longer than main_1 PHASE GUIDANCE", () => {
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
    expect(MAX_PROMPT_CHAR_BUDGET).toBe(35000);
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

describe("formatSupplementalRulesSection", () => {
  it("returns empty string when no rules provided", () => {
    expect(formatSupplementalRulesSection([])).toBe("");
  });

  it("renders header, disclaimer, and rule entries", () => {
    const rules: RetrievedGameRule[] = [
      { ruleId: "116.1", sectionTitle: "Timing", text: "Unless a spell or ability has a timing restriction.", score: 10 },
      { ruleId: "116.2a", sectionTitle: "Timing", text: "A player may cast an instant spell any time.", score: 5 }
    ];
    const section = formatSupplementalRulesSection(rules);
    expect(section).toContain("ADDITIONAL RELEVANT RULE EXCERPTS");
    expect(section).toContain("They do not override the user's submitted game state");
    expect(section).toContain("116.1. Unless a spell or ability has a timing restriction.");
    expect(section).toContain("116.2a. A player may cast an instant spell any time.");
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

describe("getPromptDiagnostics supplemental rules", () => {
  it("includes supplemental diagnostic fields when rules present", () => {
    const rules: RetrievedGameRule[] = [
      { ruleId: "116.1", sectionTitle: "Timing", text: "Some text.", score: 10 },
      { ruleId: "116.2", sectionTitle: "Timing", text: "More text.", score: 5 }
    ];
    const diagnostics = getPromptDiagnostics("test prompt", {
      supplementalRules: rules,
      supplementalRulesSectionChars: 200
    });
    expect(diagnostics.supplementalRuleCount).toBe(2);
    expect(diagnostics.supplementalRulesSectionChars).toBe(200);
    expect(diagnostics.supplementalRuleIds).toEqual(["116.1", "116.2"]);
  });

  it("omits supplemental diagnostic fields when no supplemental rules", () => {
    const diagnostics = getPromptDiagnostics("test prompt");
    expect(diagnostics.supplementalRuleCount).toBeUndefined();
    expect(diagnostics.supplementalRulesSectionChars).toBeUndefined();
    expect(diagnostics.supplementalRuleIds).toBeUndefined();
  });

  it("omits supplemental diagnostic fields when supplemental rules array is empty", () => {
    const diagnostics = getPromptDiagnostics("test prompt", { supplementalRules: [] });
    expect(diagnostics.supplementalRuleCount).toBeUndefined();
    expect(diagnostics.supplementalRuleIds).toBeUndefined();
  });
});

describe("truncateConversationHistory", () => {
  it("returns all turns when total chars are within budget", () => {
    const turns: ConversationTurn[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "World" }
    ];
    expect(truncateConversationHistory(turns, 100)).toEqual(turns);
  });

  it("removes oldest turns first until within budget", () => {
    const turns: ConversationTurn[] = [
      { role: "user", content: "a".repeat(3000) },
      { role: "assistant", content: "b".repeat(3000) },
      { role: "user", content: "newer question" },
      { role: "assistant", content: "newer answer" }
    ];
    const result = truncateConversationHistory(turns, 6000);
    expect(result.length).toBeLessThan(turns.length);
    expect(result[result.length - 1]?.content).toBe("newer answer");
  });

  it("returns empty array when all turns exceed budget", () => {
    const turns: ConversationTurn[] = [
      { role: "user", content: "a".repeat(4000) },
      { role: "assistant", content: "b".repeat(4000) }
    ];
    const result = truncateConversationHistory(turns, 100);
    expect(result).toEqual([]);
  });
});

describe("formatConversationHistorySection", () => {
  it("returns empty string for empty turns array", () => {
    expect(formatConversationHistorySection([])).toBe("");
  });

  it("formats each turn as User:/Assistant: prefixed lines under header", () => {
    const turns: ConversationTurn[] = [
      { role: "user", content: "What happens?" },
      { role: "assistant", content: "It resolves." }
    ];
    const section = formatConversationHistorySection(turns);
    expect(section).toContain("CONVERSATION HISTORY");
    expect(section).toContain("User: What happens?");
    expect(section).toContain("Assistant: It resolves.");
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

  it("includes full history when total chars are within 6000", () => {
    const history: ConversationTurn[] = [
      { role: "user", content: "short question" },
      { role: "assistant", content: "short answer" }
    ];
    const prompt = buildPromptText(baseContext, { conversationHistory: history });
    expect(prompt).toContain("User: short question");
    expect(prompt).toContain("Assistant: short answer");
  });

  it("truncates oldest turns when history exceeds 6000 chars", () => {
    // 4 turns × 2000 chars = 8000 + 28 chars for new turns = 8028 > 6000
    // Removing turn[0] (2000): 6028 > 6000; removing turn[1] (2000): 4028 ≤ 6000 → stop
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
    expect(prompt).not.toContain("OLDEST-USER-");
    expect(prompt).not.toContain("OLDEST-ASST-");
  });
});

describe("getPromptDiagnostics conversation history", () => {
  it("includes conversationHistoryChars as 0 when no history provided", () => {
    const diagnostics = getPromptDiagnostics("test prompt");
    expect(diagnostics.conversationHistoryChars).toBe(0);
  });

  it("includes conversationHistoryChars as 0 when empty options passed", () => {
    const diagnostics = getPromptDiagnostics("test prompt", {});
    expect(diagnostics.conversationHistoryChars).toBe(0);
  });

  it("includes positive conversationHistoryChars when history chars provided", () => {
    const diagnostics = getPromptDiagnostics("test prompt", { conversationHistoryChars: 350 });
    expect(diagnostics.conversationHistoryChars).toBe(350);
  });
});

describe("getPromptDiagnostics", () => {
  it("reports budget diagnostics and near-limit status", () => {
    const shortDiagnostics = getPromptDiagnostics("hello");
    expect(shortDiagnostics.promptChars).toBe(5);
    expect(shortDiagnostics.exceedsBudget).toBe(false);
    expect(shortDiagnostics.nearLimit).toBe(false);

    const nearLimitPrompt = "x".repeat(MAX_PROMPT_CHAR_BUDGET - 400);
    const nearLimitDiagnostics = getPromptDiagnostics(nearLimitPrompt);
    expect(nearLimitDiagnostics.nearLimit).toBe(true);
    expect(nearLimitDiagnostics.exceedsBudget).toBe(false);

    const exceededPrompt = "y".repeat(MAX_PROMPT_CHAR_BUDGET + 5);
    const exceededDiagnostics = getPromptDiagnostics(exceededPrompt);
    expect(exceededDiagnostics.exceedsBudget).toBe(true);
    expect(exceededDiagnostics.remainingChars).toBe(-5);
  });

  it("includes gameRulesSectionChars and gameRulesTopicCount when game rules topics present", () => {
    const diagnostics = getPromptDiagnostics("test prompt", {
      gameRulesTopics: sampleGameRulesTopics,
      gameRulesSectionChars: 500
    });
    expect(diagnostics.gameRulesTopicCount).toBe(2);
    expect(diagnostics.gameRulesSectionChars).toBe(500);
  });

  it("omits game rules diagnostics fields when no topics provided", () => {
    const diagnostics = getPromptDiagnostics("test prompt");
    expect(diagnostics.gameRulesTopicCount).toBeUndefined();
    expect(diagnostics.gameRulesSectionChars).toBeUndefined();
  });
});
