import { describe, expect, it } from "vitest";
import {
  choosePreferredCard,
  shouldIncludeCard,
  transformCards
} from "../../../../scripts/build-card-metadata.mjs";

type TransformResultCard = {
  cardId: string;
  name: string;
  oracleText: string;
  imageUrl: string;
  manaCost: string;
  manaValue: number;
  typeLine: string;
  colors: string[];
  supertypes: string[];
  subtypes: string[];
};

type TransformResult = {
  cards: TransformResultCard[];
  stats: {
    parsedCount: number;
    includedCount: number;
    skippedAsDuplicate: number;
    skippedByFilter: number;
  };
};

describe("metadata transform policy", () => {
  it("filters cards to english paper records with valid names", () => {
    expect(shouldIncludeCard({ lang: "en", games: ["paper"], digital: false, name: "Opt" })).toBe(true);
    expect(shouldIncludeCard({ lang: "ja", games: ["paper"], digital: false, name: "Opt" })).toBe(false);
    expect(shouldIncludeCard({ lang: "en", games: ["arena"], digital: false, name: "Opt" })).toBe(false);
    expect(shouldIncludeCard({ lang: "en", games: ["paper"], digital: true, name: "Opt" })).toBe(false);
    expect(shouldIncludeCard({ lang: "en", games: ["paper"], digital: false, name: "   " })).toBe(false);
  });

  it("uses deterministic duplicate tie-breaks by quality then latest release date", () => {
    const lowerQuality = {
      id: "z-id",
      oracle_id: "oracle-lightning-bolt",
      lang: "en",
      games: ["paper"],
      digital: false,
      released_at: "2020-01-01",
      name: "Lightning Bolt",
      oracle_text: "",
      image_uris: {}
    };

    const higherQuality = {
      id: "a-id",
      oracle_id: "oracle-lightning-bolt",
      lang: "en",
      games: ["paper"],
      digital: false,
      released_at: "2022-01-01",
      name: "Lightning Bolt",
      oracle_text: "Lightning Bolt deals 3 damage to any target.",
      image_uris: { small: "https://img/lightning-bolt.jpg" }
    };

    expect(choosePreferredCard(lowerQuality, higherQuality)).toBe(higherQuality);

    const sameQualityNewer = { ...higherQuality, id: "b-id", released_at: "2024-08-05" };
    expect(choosePreferredCard(higherQuality, sameQualityNewer)).toBe(sameQualityNewer);
  });

  it("produces stable output shape and representative search-ready data", () => {
    const sourceCards = [
      {
        id: "bolt-z",
        oracle_id: "oracle-bolt",
        lang: "en",
        games: ["paper"],
        digital: false,
        released_at: "2020-01-01",
        name: "Lightning Bolt",
        mana_cost: "{R}",
        cmc: 1,
        type_line: "Instant",
        colors: ["R"],
        oracle_text: "",
        image_uris: {}
      },
      {
        id: "bolt-a",
        oracle_id: "oracle-bolt",
        lang: "en",
        games: ["paper"],
        digital: false,
        released_at: "2024-01-01",
        name: "Lightning Bolt",
        mana_cost: "{R}",
        cmc: 1,
        type_line: "Legendary Creature — Goblin Wizard",
        colors: ["R"],
        oracle_text: "Lightning Bolt deals 3 damage to any target.",
        image_uris: { small: "https://img/lightning-bolt.jpg" }
      },
      {
        id: "brainstorm-1",
        oracle_id: "oracle-brainstorm",
        lang: "en",
        games: ["paper"],
        digital: false,
        released_at: "2018-01-01",
        name: "Brainstorm",
        cmc: 1,
        card_faces: [
          {
            mana_cost: "{U}",
            type_line: "Instant",
            colors: ["U"],
            oracle_text: "Draw three cards.",
            image_uris: { small: "https://img/brainstorm.jpg" }
          }
        ]
      },
      {
        id: "arena-only",
        oracle_id: "oracle-arena-only",
        lang: "en",
        games: ["arena"],
        digital: true,
        released_at: "2024-01-01",
        name: "Arena Card",
        oracle_text: "Not paper legal."
      }
    ];

    const result = transformCards(sourceCards) as TransformResult;
    expect(result.stats.parsedCount).toBe(4);
    expect(result.stats.includedCount).toBe(2);
    expect(result.stats.skippedAsDuplicate).toBe(1);
    expect(result.stats.skippedByFilter).toBe(1);

    expect(result.cards.map((card) => card.name)).toEqual(["Brainstorm", "Lightning Bolt"]);
    for (const card of result.cards) {
      expect(Object.keys(card).sort()).toEqual([
        "cardId",
        "colors",
        "imageUrl",
        "manaCost",
        "manaValue",
        "name",
        "oracleText",
        "subtypes",
        "supertypes",
        "typeLine"
      ]);
      expect(card.name.length).toBeGreaterThan(0);
      expect(card.oracleText.length).toBeGreaterThan(0);
    }

    const brainstorm = result.cards.find((card) => card.name === "Brainstorm");
    expect(brainstorm).toMatchObject({
      manaCost: "{U}",
      manaValue: 1,
      typeLine: "Instant",
      colors: ["U"],
      supertypes: [],
      subtypes: []
    });

    const lightningBolt = result.cards.find((card) => card.name === "Lightning Bolt");
    expect(lightningBolt).toMatchObject({
      manaCost: "{R}",
      manaValue: 1,
      typeLine: "Legendary Creature — Goblin Wizard",
      colors: ["R"],
      supertypes: ["Legendary"],
      subtypes: ["Goblin", "Wizard"]
    });
  });
});
