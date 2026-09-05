import { describe, expect, it } from "vitest";
import {
  choosePreferredCard,
  isStandardPrinting,
  shouldIncludeCard,
  transformCards
} from "../../../../scripts/build-card-metadata.mjs";

/** REQ-174: `cards` is the slim shape actually written to
 * `cardMetadata.json`; `fullCards` (the pre-slim descriptive block) exists
 * only so the build can measure the NFR-019 gzipped-size reduction — it is
 * never written to disk. */
type SlimTransformResultCard = {
  cardId: string;
  name: string;
  imageUrl: string;
  colors: string[];
};

type FullTransformResultCard = {
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
  cards: SlimTransformResultCard[];
  fullCards: FullTransformResultCard[];
  stats: {
    parsedCount: number;
    includedCount: number;
    skippedAsDuplicate: number;
    skippedByFilter: number;
  };
};

describe("Frontend - Shared", () => {
describe("isStandardPrinting", () => {
  it("returns true for a normal non-promo printing", () => {
    expect(
      isStandardPrinting({
        set_type: "expansion",
        promo: false,
        border_color: "black",
        frame_effects: []
      })
    ).toBe(true);
  });

  it("returns false for a Secret Lair (set_type funny)", () => {
    expect(isStandardPrinting({ set_type: "funny" })).toBe(false);
  });

  it("returns false for a memorabilia set", () => {
    expect(isStandardPrinting({ set_type: "memorabilia" })).toBe(false);
  });

  it("returns false for a promo-flagged card", () => {
    expect(isStandardPrinting({ promo: true, set_type: "expansion" })).toBe(false);
  });

  it("returns false when promo_types is non-empty", () => {
    expect(isStandardPrinting({ promo_types: ["release"], set_type: "expansion" })).toBe(false);
  });

  it("returns false for showcase frame effect", () => {
    expect(isStandardPrinting({ set_type: "expansion", frame_effects: ["showcase"] })).toBe(false);
  });

  it("returns false for extendedart frame effect", () => {
    expect(isStandardPrinting({ set_type: "expansion", frame_effects: ["extendedart"] })).toBe(false);
  });

  it("returns false for borderless border_color", () => {
    expect(isStandardPrinting({ set_type: "expansion", border_color: "borderless" })).toBe(false);
  });

  it("returns false for gold border_color", () => {
    expect(isStandardPrinting({ set_type: "expansion", border_color: "gold" })).toBe(false);
  });

  it("returns true when frame_effects is absent or empty", () => {
    expect(isStandardPrinting({ set_type: "expansion" })).toBe(true);
    expect(isStandardPrinting({ set_type: "expansion", frame_effects: [] })).toBe(true);
  });
});

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

  it("prefers a standard printing over a same-quality special printing even when the special one is newer", () => {
    const standardBase = {
      id: "standard-id",
      oracle_id: "oracle-opt",
      lang: "en",
      games: ["paper"],
      digital: false,
      released_at: "2020-01-01",
      name: "Opt",
      oracle_text: "Scry 1, then draw a card.",
      image_uris: { normal: "https://img/opt-standard.jpg" },
      set_type: "expansion",
      promo: false,
      border_color: "black",
      frame_effects: []
    };

    const showcaseNewer = {
      ...standardBase,
      id: "showcase-id",
      released_at: "2024-01-01",
      image_uris: { normal: "https://img/opt-showcase.jpg" },
      frame_effects: ["showcase"]
    };

    expect(choosePreferredCard(standardBase, showcaseNewer)).toBe(standardBase);
    expect(choosePreferredCard(showcaseNewer, standardBase)).toBe(standardBase);
  });

  it("prefers the newer standard printing when both are standard", () => {
    const olderStandard = {
      id: "older-id",
      oracle_id: "oracle-opt",
      lang: "en",
      games: ["paper"],
      digital: false,
      released_at: "2020-01-01",
      name: "Opt",
      oracle_text: "Scry 1, then draw a card.",
      image_uris: { normal: "https://img/opt-old.jpg" },
      set_type: "expansion",
      promo: false,
      border_color: "black",
      frame_effects: []
    };

    const newerStandard = {
      ...olderStandard,
      id: "newer-id",
      released_at: "2024-01-01",
      image_uris: { normal: "https://img/opt-new.jpg" }
    };

    expect(choosePreferredCard(olderStandard, newerStandard)).toBe(newerStandard);
  });

  it("falls through to recency tiebreak when both candidates are special", () => {
    const olderSpecial = {
      id: "older-special",
      oracle_id: "oracle-bolt",
      lang: "en",
      games: ["paper"],
      digital: false,
      released_at: "2020-01-01",
      name: "Lightning Bolt",
      oracle_text: "Lightning Bolt deals 3 damage to any target.",
      image_uris: { normal: "https://img/bolt-old.jpg" },
      set_type: "expansion",
      frame_effects: ["showcase"]
    };

    const newerSpecial = {
      ...olderSpecial,
      id: "newer-special",
      released_at: "2024-01-01",
      image_uris: { normal: "https://img/bolt-new.jpg" }
    };

    expect(choosePreferredCard(olderSpecial, newerSpecial)).toBe(newerSpecial);
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

    // REQ-174: `cards` (written to cardMetadata.json) carries only the
    // up-front tile fields — no descriptive block.
    expect(result.cards.map((card) => card.name)).toEqual(["Brainstorm", "Lightning Bolt"]);
    for (const card of result.cards) {
      expect(Object.keys(card).sort()).toEqual(["cardId", "colors", "imageUrl", "name"]);
      expect(card.name.length).toBeGreaterThan(0);
    }

    // `fullCards` (never written to disk) proves the inclusion/dedup/filter
    // pipeline and the descriptive-field derivation are still correct — it is
    // also the NFR-019 gzipped-size comparison's "before" side.
    expect(result.fullCards.map((card) => card.name)).toEqual(["Brainstorm", "Lightning Bolt"]);
    for (const card of result.fullCards) {
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

    const brainstorm = result.fullCards.find((card) => card.name === "Brainstorm");
    expect(brainstorm).toMatchObject({
      manaCost: "{U}",
      manaValue: 1,
      typeLine: "Instant",
      colors: ["U"],
      supertypes: [],
      subtypes: []
    });

    const lightningBolt = result.fullCards.find((card) => card.name === "Lightning Bolt");
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
});
