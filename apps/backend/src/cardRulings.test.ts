import { describe, expect, it, vi } from "vitest";
import { collectCardsForRulings, loadCardRulingsIndex, resolveRulingsForPrompt } from "./cardRulings.js";
import type { PromptContext } from "./types/index.js";

const context: PromptContext = {
  finalQuestion: "How does this resolve?",
  gameContext: {
    playerCount: 2,
    players: [
      { label: "Player 1", lifeTotal: 20 },
      { label: "Player 2", lifeTotal: 20 }
    ],
    turnPhase: "main_1",
    selectedZones: ["stack", "battlefield", "graveyard"]
  },
  orderedStack: [
    {
      cardId: "oracle-bottom",
      name: "Bottom Spell",
      oracleText: "Bottom text",
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
      stackIndex: 0,
      stackRole: "bottom"
    },
    {
      cardId: "oracle-top",
      name: "Top Spell",
      oracleText: "Top text",
      imageUrl: "",
      manaCost: "{R}",
      manaValue: 1,
      typeLine: "Instant",
      colors: ["R"],
      supertypes: [],
      subtypes: [],
      caster: "Player 2",
      targets: [],
      manaSpent: 1,
      stackIndex: 1,
      stackRole: "top"
    }
  ],
  populatedZones: [
    {
      zoneId: "battlefield",
      items: [
        { cardId: "oracle-top", name: "Top Spell permanent", targets: [] },
        { cardId: "oracle-battlefield", name: "Battlefield Card", targets: [] }
      ]
    },
    {
      zoneId: "graveyard",
      items: [{ cardId: "", name: "Missing Id Card", targets: [] }]
    }
  ]
};

describe("card rulings", () => {
  it("collects unique card ids in stack then canonical zone order", () => {
    expect(collectCardsForRulings(context)).toEqual([
      { cardId: "oracle-bottom", name: "Bottom Spell" },
      { cardId: "oracle-top", name: "Top Spell" },
      { cardId: "oracle-battlefield", name: "Battlefield Card" }
    ]);
  });

  it("limits rulings per card and truncates long comments", () => {
    const resolved = resolveRulingsForPrompt(
      [{ cardId: "oracle-top", name: "Top Spell" }],
      new Map([
        [
          "oracle-top",
          [
            { publishedAt: "2024-01-01", comment: "x".repeat(40) },
            { publishedAt: "2023-01-01", comment: "Second ruling" },
            { publishedAt: "2022-01-01", comment: "Third ruling" }
          ]
        ]
      ]),
      { maxRulingsPerCard: 2, maxCommentChars: 24 }
    );

    expect(resolved).toEqual([
      {
        cardId: "oracle-top",
        name: "Top Spell",
        rulings: [
          { publishedAt: "2024-01-01", comment: "xxxxxxxxx ...(truncated)" },
          { publishedAt: "2023-01-01", comment: "Second ruling" }
        ]
      }
    ]);
  });

  it("returns an empty index and warns once when the artifact is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const missingPath = "missing-card-rulings-for-test.json";

    expect(loadCardRulingsIndex(missingPath)).toEqual(new Map());
    expect(loadCardRulingsIndex(missingPath)).toEqual(new Map());
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });
});
