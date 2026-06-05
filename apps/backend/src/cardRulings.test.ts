import { mkdtempSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  collectCardsForRulings,
  loadCardRulingsIndex,
  resolveRulingsForPrompt
} from "./cardRulings.js";
import type { PromptContext } from "./types/index.js";

const context: PromptContext = {
  finalQuestion: "What happens?",
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
      cardId: "bottom-id",
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
      cardId: "top-id",
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
      zoneId: "graveyard",
      items: [
        { cardId: "graveyard-id", name: "Graveyard Card", targets: [] },
        { cardId: "top-id", name: "Duplicate Top Spell", targets: [] }
      ]
    },
    {
      zoneId: "battlefield",
      items: [
        { cardId: "battlefield-id", name: "Battlefield Card", targets: [] },
        { cardId: "", name: "No ID", targets: [] }
      ]
    }
  ]
};

describe("card rulings", () => {
  it("loads a rulings index from a committed artifact shape", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "thejudge-rulings-"));
    const filePath = join(tempDir, "cardRulingsByOracleId.json");
    writeFileSync(
      filePath,
      JSON.stringify({
        "oracle-id": [{ publishedAt: "2020-04-17", comment: "Official note." }],
        invalid: [{ publishedAt: "2020-04-17" }]
      })
    );

    const index = loadCardRulingsIndex(filePath);

    expect(index.get("oracle-id")).toEqual([{ publishedAt: "2020-04-17", comment: "Official note." }]);
    expect(index.has("invalid")).toBe(false);
  });

  it("returns an empty index and warns when the rulings file is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const missingPath = join(tmpdir(), `missing-card-rulings-${randomUUID()}.json`);

    const index = loadCardRulingsIndex(missingPath);
    const secondIndex = loadCardRulingsIndex(missingPath);

    expect(index.size).toBe(0);
    expect(secondIndex.size).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Card rulings file missing"));
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("collects unique cards in stack then canonical non-stack zone order", () => {
    expect(collectCardsForRulings(context)).toEqual([
      { cardId: "bottom-id", name: "Bottom Spell" },
      { cardId: "top-id", name: "Top Spell" },
      { cardId: "battlefield-id", name: "Battlefield Card" },
      { cardId: "graveyard-id", name: "Graveyard Card" }
    ]);
  });

  it("resolves matching rulings with per-card and comment caps", () => {
    const resolved = resolveRulingsForPrompt(
      [{ cardId: "card-id", name: "Capped Card" }],
      new Map([
        [
          "card-id",
          [
            { publishedAt: "2024-01-01", comment: "a".repeat(80) },
            { publishedAt: "2023-01-01", comment: "second" },
            { publishedAt: "2022-01-01", comment: "third" }
          ]
        ]
      ]),
      { maxRulingsPerCard: 2, maxCommentChars: 40, maxSectionChars: 1000 }
    );

    expect(resolved.cards).toHaveLength(1);
    expect(resolved.cards[0]?.rulings).toHaveLength(2);
    expect(resolved.cards[0]?.rulings[0]?.comment).toHaveLength(40);
    expect(resolved.cards[0]?.rulings[0]?.comment.endsWith(" ...(truncated)")).toBe(true);
  });

  it("omits cards without matching rulings", () => {
    const resolved = resolveRulingsForPrompt(
      [
        { cardId: "missing-id", name: "Missing" },
        { cardId: "known-id", name: "Known" }
      ],
      new Map([["known-id", [{ publishedAt: "2020-04-17", comment: "Known ruling." }]]]),
      { maxRulingsPerCard: 3, maxCommentChars: 480, maxSectionChars: 1000 }
    );

    expect(resolved.cards.map((card) => card.name)).toEqual(["Known"]);
  });
});
