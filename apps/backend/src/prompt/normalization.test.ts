import { describe, expect, it } from "vitest";
import {
  MAX_CONTEXT_NOTES_CHARS,
  MAX_ORACLE_TEXT_CHARS,
  MAX_PROMPT_CHAR_BUDGET,
  MAX_TARGET_LABEL_CHARS,
  SYSTEM_ROLE_PREAMBLE_LINES,
  buildPromptText,
  buildZoneScopeSentence,
  getPromptDiagnostics,
  normalizeCardText,
  normalizeQuestion,
  normalizeWhitespace,
  truncateOracleText
} from "./normalization.js";
import type { PromptContext } from "../types/index.js";

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
    expect(first.indexOf("GENERAL GAME CONTEXT")).toBeLessThan(first.indexOf("ZONE: STACK (BOTTOM TO TOP)"));
    expect(first.indexOf("ZONE: STACK (BOTTOM TO TOP)")).toBeLessThan(first.indexOf("ZONE: BATTLEFIELD"));
    expect(first.indexOf("ZONE: BATTLEFIELD")).toBeLessThan(first.indexOf("SCOPE"));
    expect(first.indexOf("SCOPE")).toBeLessThan(first.indexOf("QUESTION"));
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
        turnPhase: "stack_resolving",
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

  it("stays under configured prompt budget for normal payloads", () => {
    const prompt = buildPromptText(baseContext);
    expect(prompt.length).toBeLessThan(MAX_PROMPT_CHAR_BUDGET);
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
});
