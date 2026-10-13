import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CONCEPT_MAP, TYPE_MAP, conceptTermsForCard, conceptTermsForCards } from "./gameRulesConceptMap.js";
import type { GameRulesRuleIndexEntry } from "./gameRulesRetrieval.js";

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../data");
const ruleIndex = JSON.parse(readFileSync(resolve(dataDir, "gameRulesRuleIndex.json"), "utf8")) as GameRulesRuleIndexEntry[];

describe("REQ-234 concept map", () => {
  it("holds 84 oracle-text entries and 5 type-line entries", () => {
    expect(CONCEPT_MAP).toHaveLength(84);
    expect(TYPE_MAP).toHaveLength(5);
  });

  it("uses only words the committed rule index contains (165 distinct words over 89 entries)", () => {
    const ruleText = ruleIndex.map((entry) => entry.text).join(" ").toLowerCase().replace(/[‘’]/g, "'");
    const words = new Set([...CONCEPT_MAP, ...TYPE_MAP].flatMap(([, terms]) => terms.split(/\s+/)));
    expect(words.size).toBe(165);
    const missing = [...words].filter((word) => !ruleText.includes(word));
    expect(missing).toEqual([]);
  });

  it("turns card wording into rule-book concepts", () => {
    expect(conceptTermsForCard({ name: "Ephemeral Hydra", oracleText: "At the beginning of your upkeep, draw a card." })).toEqual([
      "upkeep step triggered ability",
      "draw card",
      "handling triggered abilities"
    ]);
    expect(conceptTermsForCard({ oracleText: "Until end of turn, target creature gains flying." })).toContain(
      "cleanup step until end of turn effects end"
    );
  });

  it("replaces the card's own name (each face of a // name) with ~ before matching", () => {
    // "Skip Rope" must not read as "skip ..." wording once the name is replaced.
    const text = "Skip Rope enters tapped.";
    expect(conceptTermsForCard({ name: "Skip Rope", oracleText: text })).not.toContain("skip step skipped replacement effect");
    expect(conceptTermsForCard({ name: "Front // Back", oracleText: "When back dies, front deals damage." })).toContain(
      "leaves-the-battlefield abilities look back in time dies"
    );
  });

  it("reads curly apostrophes as straight ones", () => {
    expect(conceptTermsForCard({ oracleText: "Creatures you control can’t be blocked." })).toContain(
      "blocking restrictions attack restrictions"
    );
  });

  it("adds the type-line entries", () => {
    expect(conceptTermsForCard({ typeLine: "Legendary Planeswalker — Jace" })).toEqual([
      "legend rule",
      "loyalty abilities planeswalker"
    ]);
  });

  it("de-duplicates across a request's cards, keeping first-seen order", () => {
    const terms = conceptTermsForCards([
      { oracleText: "When this enters, draw a card." },
      { oracleText: "Whenever a creature dies, draw a card." }
    ]);
    expect(terms.filter((term) => term === "draw card")).toHaveLength(1);
    expect(terms[0]).toBe("triggered ability trigger event");
  });

  describe("type-setting wording (owner-reviewed 2026-10-12)", () => {
    const LAYER = "type-changing effects layer continuous effect";
    it.each([
      "Each land is a Swamp in addition to its other land types.",
      "All permanents are artifacts in addition to their other types.",
      "Nonbasic lands are Mountains.",
      "Enchanted permanent is an artifact creature with base power and toughness 4/4.",
      "All permanents are artifacts.",
      "Each creature is a land in addition to its other types."
    ])("maps %s to the type-changing layer", (oracleText) => {
      expect(conceptTermsForCard({ oracleText })).toContain(LAYER);
    });

    it.each([
      "Destroy target creature.",
      "Sacrifice ~ if it is a creature.",
      "Exile target permanent that is a creature.",
      "When it is a creature, draw a card.",
      "Draw a card for each creature that is a Zombie.",
      "~'s power is equal to the number of creatures you control.",
      "Whenever a creature you control dies, if it is a token, create a Treasure.",
      "Flying. As long as you control a Forest, ~ is a creature.",
      "As long as it's your turn, enchanted permanent is an artifact.",
      "Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this artifact: Add one mana of any color.\")",
      "Create a Clue token. (It is an artifact with \"{2}, Sacrifice this artifact: Draw a card.\")",
      "Create a token that's a copy of target creature, except the copy is an artifact.",
      "Create a token that's a copy of another creature you control, except its power is half that creature's power and it is an artifact.",
      "Each +1/+1 counter on a creature you control is also a Food.",
      "Each +1/+1 counter on a permanent you control is a Treasure."
    ])("does not map conditional or targeting wording: %s", (oracleText) => {
      expect(conceptTermsForCard({ oracleText })).not.toContain(LAYER);
    });
  });

  describe("card-wording entries 79 to 84 (owner-reviewed, concept-map-wording-entries)", () => {
    const cases: Array<{ label: string; term: string; matches: string[]; nonMatches: string[] }> = [
      {
        label: "triggered abilities",
        term: "handling triggered abilities",
        matches: [
          "Whenever a creature enters the battlefield under your control, draw a card.",
          "When this creature enters, create a 1/1 Spirit token.",
          "At the beginning of your end step, each player draws a card.",
          "Whenever you cast a spell, ~ deals 1 damage to each opponent.",
          "When ~ dies, return it to your hand.",
          "Flying\nWhen this creature attacks, tap target creature."
        ],
        nonMatches: [
          "Destroy target creature.",
          "Draw two cards.",
          "Flying, vigilance",
          "{T}: Add {G}.",
          "Create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this artifact: You gain 3 life.\")",
          "Ward {2} (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {2}.)"
        ]
      },
      {
        label: "alternative cost",
        term: "alternative cost casting",
        matches: [
          "You may cast this spell rather than pay its mana cost.",
          "You may cast spells from your hand rather than paying their mana costs.",
          "If it's not your turn, you may cast ~ rather than pay its mana cost.",
          "You may cast target card rather than pay its mana cost.",
          "You may cast it rather than pay its mana cost by paying 3 life.",
          "You may cast it rather than pay its mana cost if you control a Forest."
        ],
        nonMatches: [
          "Pay {2}: Draw a card.",
          "You may pay {1}{B} rather than sacrifice a creature.",
          "As an additional cost to cast this spell, discard a card.",
          "Draw a card.",
          "Cast spells without paying their mana costs.",
          "Target creature gets +1/+1 until end of turn."
        ]
      },
      {
        label: "layer wording",
        term: "interaction of continuous effects",
        matches: [
          "Target land becomes a Elemental creature until end of turn.",
          "Gain control of target creature until end of turn.",
          "Exchange control of two target creatures.",
          "Enchanted creature loses all abilities and becomes a land.",
          "Target land becomes an artifact in addition to its other types.",
          "Enchant creature\n~ gains control of enchanted creature."
        ],
        nonMatches: [
          "Target creature becomes blocked.",
          "~ becomes tapped.",
          "Equipped creature becomes attached to another creature.",
          "It becomes night.",
          "~ becomes the target of a spell.",
          "Create a Clue token. (It becomes an artifact: gain control of nothing.)"
        ]
      },
      {
        label: "minus N minus N",
        term: "toughness state-based action",
        matches: [
          "Target creature gets -2/-2 until end of turn.",
          "Creatures your opponents control get -1/-1 until end of turn.",
          "Target creature gets -X/-X until end of turn.",
          "Enchanted creature gets -3/-3.",
          "Target creature gets -0/-4 until end of turn.",
          "Up to one target creature gets -5/-5 until end of turn."
        ],
        nonMatches: [
          "Target creature gets +2/+2 until end of turn.",
          "Target creature gets -2/-0 until end of turn.",
          "Target creature gets +1/-1 until end of turn.",
          "Target creature gets -X/-0 until end of turn.",
          "Put a -1/-1 counter on target creature.",
          "Create a token. (A creature that gets -1/-1 dies.)"
        ]
      },
      {
        label: "sacrifice as a cost",
        term: "activated ability cost",
        matches: [
          "Sacrifice this creature: Draw a card.",
          "{T}, Sacrifice ~: Add {C}{C}.",
          "{2}, Sacrifice this artifact: Destroy target enchantment.",
          "Flying\nSacrifice ~: Target creature gains indestructible until end of turn.",
          "{1}, Sacrifice this land: Search your library for a basic land card.",
          "Sacrifice this enchantment: Scry 2."
        ],
        nonMatches: [
          "Sacrifice a creature: Draw a card.",
          "When this creature enters, sacrifice it.",
          "Destroy target creature unless its controller sacrifices ~.",
          "Enchanted creature has \"Sacrifice this creature: Draw a card.\"",
          "At the beginning of your upkeep, sacrifice ~ unless you pay {2}.",
          "Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this artifact: Add one mana of any color.\")"
        ]
      },
      {
        label: "casting choices",
        term: "casting spells",
        matches: [
          "As an additional cost to cast this spell, discard a card.",
          "Choose two -\n- Draw a card.\n- Destroy target artifact.",
          "Choose one -\n- Destroy target creature.\n- Gain 4 life.",
          "You may cast this spell rather than pay its mana cost.",
          "Choose one or more -\n- Create a token.\n- Draw a card.",
          "As an additional cost to cast this spell, sacrifice a creature."
        ],
        nonMatches: [
          "Destroy target creature.",
          "Draw a card, then choose a creature you control.",
          "As an additional cost to activate this ability, pay 2 life.",
          "Pay {2}: Draw a card.",
          "Target opponent chooses one of their creatures.",
          "Cast spells from your graveyard."
        ]
      }
    ];
    for (const { label, term, matches, nonMatches } of cases) {
      it.each(matches)(`${label}: maps %s`, (oracleText) => {
        expect(conceptTermsForCard({ oracleText })).toContain(term);
      });
      it.each(nonMatches)(`${label}: does not map %s`, (oracleText) => {
        expect(conceptTermsForCard({ oracleText })).not.toContain(term);
      });
    }
  });

  it("returns nothing for a card without wording", () => {
    expect(conceptTermsForCard({})).toEqual([]);
  });
});
