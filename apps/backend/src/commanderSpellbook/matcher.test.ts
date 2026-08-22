import { describe, expect, it } from "vitest";
import type { ComboCardIngredient, ComboCatalog, ComboTemplateIngredient, ComboVariant } from "./catalog.js";
import { selectComboCandidates, type ComboMatchInstance, type ComboMatchRequest } from "./matcher.js";

function cardIngredient(overrides: Partial<ComboCardIngredient> & { cardId: string }): ComboCardIngredient {
  return {
    cardName: `Card ${overrides.cardId}`,
    quantity: 1,
    zones: ["B"],
    cardState: {},
    mustBeCommander: false,
    ...overrides
  };
}

function templateIngredient(
  overrides: Partial<ComboTemplateIngredient> & { templateId: number }
): ComboTemplateIngredient {
  return {
    templateName: `Template ${overrides.templateId}`,
    quantity: 1,
    zones: ["B"],
    cardState: {},
    mustBeCommander: false,
    scryfallApi: "https://api.scryfall.com/cards/search?q=example",
    unresolved: false,
    oracleIds: [],
    ...overrides
  };
}

function variant(overrides: Partial<ComboVariant> & { variantId: string }): ComboVariant {
  return {
    sourceUrl: `https://commanderspellbook.com/combo/${overrides.variantId}/`,
    popularity: 100,
    steps: "Do the thing.",
    manaNeeded: "{1}",
    easyPrerequisites: "",
    notablePrerequisites: "",
    notes: "",
    producedEffects: ["Win the game"],
    cardIngredients: [cardIngredient({ cardId: "a" })],
    templateIngredients: [],
    ...overrides
  };
}

function catalogOf(variants: ComboVariant[]): ComboCatalog {
  const byOracleId = new Map<string, string[]>();
  const byTemplateOracleId = new Map<string, string[]>();

  for (const entry of variants) {
    for (const ingredient of entry.cardIngredients) {
      byOracleId.set(ingredient.cardId, [...(byOracleId.get(ingredient.cardId) ?? []), entry.variantId]);
    }
    for (const ingredient of entry.templateIngredients) {
      for (const oracleId of ingredient.oracleIds) {
        byTemplateOracleId.set(oracleId, [...(byTemplateOracleId.get(oracleId) ?? []), entry.variantId]);
      }
    }
  }

  const byId = new Map(variants.map((entry) => [entry.variantId, entry]));

  return {
    byOracleId,
    byTemplateOracleId,
    variantCount: variants.length,
    getVariant: (variantId) => byId.get(variantId)
  };
}

function instance(cardId: string, zone: ComboMatchInstance["zone"], index = 0): ComboMatchInstance {
  return { instanceId: `${cardId}-${zone}-${index}`, cardId, cardName: `Card ${cardId}`, zone };
}

function gameRequest(overrides: Partial<ComboMatchRequest> = {}): ComboMatchRequest {
  return { mode: "game", instances: [], questionText: "", hasExplicitIntent: false, ...overrides };
}

const threeCardVariant = variant({
  variantId: "v1",
  cardIngredients: [
    cardIngredient({ cardId: "a" }),
    cardIngredient({ cardId: "b", zones: ["H"] }),
    cardIngredient({ cardId: "c", zones: ["B", "G"], cardState: { battlefield: "untapped", graveyard: "with three others" } })
  ]
});

describe("Backend - Ask AI", () => {
  describe("Candidate assignment", () => {
    it("returns one fully assigned candidate in game mode with no intent", () => {
      const candidates = selectComboCandidates(
        catalogOf([threeCardVariant]),
        gameRequest({
          instances: [instance("a", "battlefield"), instance("b", "hand"), instance("c", "graveyard")]
        })
      );

      expect(candidates).toHaveLength(1);
      expect(candidates[0]!.fullyAssigned).toBe(true);
      expect(candidates[0]!.missingCount).toBe(0);
    });

    it("returns no candidate in game mode with no intent when a piece is absent", () => {
      const candidates = selectComboCandidates(
        catalogOf([threeCardVariant]),
        gameRequest({ instances: [instance("a", "battlefield"), instance("b", "hand")] })
      );

      expect(candidates).toEqual([]);
    });

    it("returns a partial candidate naming its missing ingredient with explicit intent", () => {
      const candidates = selectComboCandidates(
        catalogOf([threeCardVariant]),
        gameRequest({
          instances: [instance("a", "battlefield"), instance("b", "hand")],
          hasExplicitIntent: true
        })
      );

      expect(candidates).toHaveLength(1);
      expect(candidates[0]!.fullyAssigned).toBe(false);
      const missing = candidates[0]!.annotations.filter((annotation) => annotation.kind === "missing-exact");
      expect(missing).toHaveLength(1);
      expect(missing[0]!.label).toBe("Card c");
    });

    it("reports the remaining count missing when only one of a 2x requirement is submitted", () => {
      const twoOfVariant = catalogOf([
        variant({ variantId: "v2", cardIngredients: [cardIngredient({ cardId: "a", quantity: 2 })] })
      ]);

      const candidates = selectComboCandidates(
        twoOfVariant,
        gameRequest({ instances: [instance("a", "battlefield")], hasExplicitIntent: true })
      );

      expect(candidates[0]!.fullyAssigned).toBe(false);
      expect(candidates[0]!.annotations[0]!.quantityRequired).toBe(2);
      expect(candidates[0]!.annotations[0]!.quantitySatisfied).toBe(1);
      expect(candidates[0]!.missingCount).toBe(1);
    });

    it("satisfies a 2x requirement with two distinct instances of the same card", () => {
      const twoOfVariant = catalogOf([
        variant({ variantId: "v2", cardIngredients: [cardIngredient({ cardId: "a", quantity: 2 })] })
      ]);

      const candidates = selectComboCandidates(
        twoOfVariant,
        gameRequest({ instances: [instance("a", "battlefield", 0), instance("a", "battlefield", 1)] })
      );

      expect(candidates[0]!.fullyAssigned).toBe(true);
      expect(candidates[0]!.annotations[0]!.matchedInstanceIds).toHaveLength(2);
    });

    it("never lets one instance fill two ingredient slots", () => {
      const sharedCardVariant = catalogOf([
        variant({
          variantId: "v3",
          cardIngredients: [cardIngredient({ cardId: "a" })],
          templateIngredients: [templateIngredient({ templateId: 1, oracleIds: ["a"] })]
        })
      ]);

      const candidates = selectComboCandidates(
        sharedCardVariant,
        gameRequest({ instances: [instance("a", "battlefield")], hasExplicitIntent: true })
      );

      // The exact ingredient claims the only instance; the template stays unfilled.
      expect(candidates[0]!.fullyAssigned).toBe(false);
      expect(candidates[0]!.annotations[0]!.quantitySatisfied).toBe(1);
      expect(candidates[0]!.annotations[1]!.quantitySatisfied).toBe(0);
    });

    it("marks a battlefield-only ingredient found in the graveyard as wrong-zone and not complete", () => {
      const battlefieldOnly = catalogOf([
        variant({ variantId: "v4", cardIngredients: [cardIngredient({ cardId: "a", zones: ["B"] })] })
      ]);

      const candidates = selectComboCandidates(
        battlefieldOnly,
        gameRequest({ instances: [instance("a", "graveyard")], hasExplicitIntent: true })
      );

      expect(candidates[0]!.fullyAssigned).toBe(false);
      expect(candidates[0]!.annotations[0]!.kind).toBe("wrong-zone");
      expect(candidates[0]!.annotations[0]!.wrongZones).toEqual(["graveyard"]);
    });

    it("treats an instance on the stack as wrong-zone for every ingredient", () => {
      const battlefieldOnly = catalogOf([
        variant({ variantId: "v5", cardIngredients: [cardIngredient({ cardId: "a", zones: ["B", "G", "H"] })] })
      ]);

      const candidates = selectComboCandidates(
        battlefieldOnly,
        gameRequest({ instances: [instance("a", "stack")], hasExplicitIntent: true })
      );

      expect(candidates[0]!.annotations[0]!.kind).toBe("wrong-zone");
      expect(candidates[0]!.annotations[0]!.wrongZones).toEqual(["stack"]);
      expect(candidates[0]!.fullyAssigned).toBe(false);
    });

    it("never completes a candidate containing an unresolved template", () => {
      const unresolvedVariant = catalogOf([
        variant({
          variantId: "v6",
          cardIngredients: [cardIngredient({ cardId: "a" })],
          templateIngredients: [templateIngredient({ templateId: 9, unresolved: true, scryfallApi: null, oracleIds: [] })]
        })
      ]);

      const withoutIntent = selectComboCandidates(unresolvedVariant, gameRequest({ instances: [instance("a", "battlefield")] }));
      expect(withoutIntent).toEqual([]);

      const withIntent = selectComboCandidates(
        unresolvedVariant,
        gameRequest({ instances: [instance("a", "battlefield")], hasExplicitIntent: true })
      );
      expect(withIntent[0]!.fullyAssigned).toBe(false);
      expect(withIntent[0]!.annotations[1]!.kind).toBe("unresolved-template");
    });

    it("satisfies a resolved template through its authoritative oracle list", () => {
      const templateVariant = catalogOf([
        variant({
          variantId: "v7",
          cardIngredients: [cardIngredient({ cardId: "a" })],
          templateIngredients: [templateIngredient({ templateId: 3, oracleIds: ["t1", "t2"] })]
        })
      ]);

      const candidates = selectComboCandidates(
        templateVariant,
        gameRequest({ instances: [instance("a", "battlefield"), instance("t2", "battlefield")] })
      );

      expect(candidates[0]!.fullyAssigned).toBe(true);
      expect(candidates[0]!.annotations[1]!.kind).toBe("matched-template");
    });
  });

  describe("Card state annotation", () => {
    it("reports the matched instance's own zone state", () => {
      const candidates = selectComboCandidates(
        catalogOf([threeCardVariant]),
        gameRequest({
          instances: [instance("a", "battlefield"), instance("b", "hand"), instance("c", "battlefield")]
        })
      );

      const annotation = candidates[0]!.annotations.find((entry) => entry.label === "Card c");
      expect(annotation!.stateZone).toBe("B");
      expect(annotation!.cardState).toBe("untapped");
    });

    it("reports the same ingredient's graveyard state when the instance is in the graveyard", () => {
      const candidates = selectComboCandidates(
        catalogOf([threeCardVariant]),
        gameRequest({
          instances: [instance("a", "battlefield"), instance("b", "hand"), instance("c", "graveyard")]
        })
      );

      const annotation = candidates[0]!.annotations.find((entry) => entry.label === "Card c");
      expect(annotation!.stateZone).toBe("G");
      expect(annotation!.cardState).toBe("with three others");
    });

    it("reports the expected zone's state for a missing ingredient", () => {
      const candidates = selectComboCandidates(
        catalogOf([threeCardVariant]),
        gameRequest({
          instances: [instance("a", "battlefield"), instance("b", "hand")],
          hasExplicitIntent: true
        })
      );

      const annotation = candidates[0]!.annotations.find((entry) => entry.label === "Card c");
      expect(annotation!.kind).toBe("missing-exact");
      expect(annotation!.stateZone).toBe("B");
      expect(annotation!.cardState).toBe("untapped");
    });

    it("carries mustBeCommander on every annotation kind including missing", () => {
      const commanderVariant = catalogOf([
        variant({
          variantId: "v8",
          cardIngredients: [
            cardIngredient({ cardId: "a", zones: ["C"], mustBeCommander: true }),
            cardIngredient({ cardId: "b", mustBeCommander: true })
          ]
        })
      ]);

      const candidates = selectComboCandidates(
        commanderVariant,
        gameRequest({ instances: [instance("a", "command")], hasExplicitIntent: true })
      );

      expect(candidates[0]!.annotations.map((entry) => entry.mustBeCommander)).toEqual([true, true]);
      expect(candidates[0]!.annotations[1]!.kind).toBe("missing-exact");
    });
  });

  describe("Ranking", () => {
    it("returns at most five candidates in the documented key order", () => {
      const variants = Array.from({ length: 6 }, (_, index) =>
        variant({
          variantId: `rank-${index}`,
          popularity: 100 + index,
          cardIngredients: [cardIngredient({ cardId: "a" }), cardIngredient({ cardId: `filler-${index}` })]
        })
      );

      const candidates = selectComboCandidates(
        catalogOf(variants),
        gameRequest({ instances: [instance("a", "battlefield")], hasExplicitIntent: true })
      );

      expect(candidates).toHaveLength(5);
      // All equally partial, so popularity descending decides.
      expect(candidates.map((candidate) => candidate.variant.variantId)).toEqual([
        "rank-5",
        "rank-4",
        "rank-3",
        "rank-2",
        "rank-1"
      ]);
    });

    it("breaks a popularity tie by ascending variant id", () => {
      const variants = [
        variant({ variantId: "zzz", popularity: 500, cardIngredients: [cardIngredient({ cardId: "a" })] }),
        variant({ variantId: "aaa", popularity: 500, cardIngredients: [cardIngredient({ cardId: "a" })] })
      ];

      const candidates = selectComboCandidates(
        catalogOf(variants),
        gameRequest({ instances: [instance("a", "battlefield")] })
      );

      expect(candidates.map((candidate) => candidate.variant.variantId)).toEqual(["aaa", "zzz"]);
    });

    it("ranks fully assigned candidates ahead of partial ones", () => {
      const variants = [
        variant({
          variantId: "partial",
          popularity: 9000,
          cardIngredients: [cardIngredient({ cardId: "a" }), cardIngredient({ cardId: "missing" })]
        }),
        variant({ variantId: "complete", popularity: 1, cardIngredients: [cardIngredient({ cardId: "a" })] })
      ];

      const candidates = selectComboCandidates(
        catalogOf(variants),
        gameRequest({ instances: [instance("a", "battlefield")], hasExplicitIntent: true })
      );

      expect(candidates[0]!.variant.variantId).toBe("complete");
      expect(candidates[1]!.variant.variantId).toBe("partial");
    });

    it("restricts partial candidates to variants containing a question-named card", () => {
      const variants = [
        variant({
          variantId: "anchored",
          cardIngredients: [cardIngredient({ cardId: "a", cardName: "Basalt Monolith" }), cardIngredient({ cardId: "x" })]
        }),
        variant({
          variantId: "unanchored",
          popularity: 9999,
          cardIngredients: [cardIngredient({ cardId: "b", cardName: "Scute Swarm" }), cardIngredient({ cardId: "y" })]
        })
      ];

      const candidates = selectComboCandidates(
        catalogOf(variants),
        gameRequest({
          instances: [
            { instanceId: "i1", cardId: "a", cardName: "Basalt Monolith", zone: "battlefield" },
            { instanceId: "i2", cardId: "b", cardName: "Scute Swarm", zone: "battlefield" }
          ],
          questionText: "Does Basalt Monolith combo with anything here?",
          hasExplicitIntent: true
        })
      );

      expect(candidates.map((candidate) => candidate.variant.variantId)).toEqual(["anchored"]);
    });

    it("seeds overlap ranking from submitted cards when the question names none", () => {
      const variants = [
        variant({ variantId: "one-piece", cardIngredients: [cardIngredient({ cardId: "a" }), cardIngredient({ cardId: "x" })] }),
        variant({
          variantId: "two-pieces",
          cardIngredients: [cardIngredient({ cardId: "a" }), cardIngredient({ cardId: "b" }), cardIngredient({ cardId: "y" })]
        })
      ];

      const candidates = selectComboCandidates(
        catalogOf(variants),
        gameRequest({
          instances: [instance("a", "battlefield"), instance("b", "battlefield")],
          questionText: "any combos?",
          hasExplicitIntent: true
        })
      );

      // Both partial; the one covering more submitted cards ranks first.
      expect(candidates[0]!.variant.variantId).toBe("two-pieces");
    });

    it("produces identical selections across repeated calls", () => {
      const variants = Array.from({ length: 8 }, (_, index) =>
        variant({
          variantId: `stable-${index}`,
          popularity: index % 3,
          cardIngredients: [cardIngredient({ cardId: "a" }), cardIngredient({ cardId: `f-${index}` })]
        })
      );
      const catalog = catalogOf(variants);
      const request = gameRequest({ instances: [instance("a", "battlefield")], hasExplicitIntent: true });

      const first = selectComboCandidates(catalog, request);
      const second = selectComboCandidates(catalog, request);

      expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    });
  });

  describe("Lookup mode retrieval", () => {
    const lookupCatalog = catalogOf([
      variant({ variantId: "has-card", cardIngredients: [cardIngredient({ cardId: "a" }), cardIngredient({ cardId: "b" })] }),
      variant({ variantId: "other", cardIngredients: [cardIngredient({ cardId: "z" })] })
    ]);

    it("returns only variants containing the attached card", () => {
      const candidates = selectComboCandidates(lookupCatalog, {
        mode: "lookup",
        instances: [{ instanceId: "attached", cardId: "a", cardName: "Card a" }],
        questionText: "does this combo with anything",
        hasExplicitIntent: true,
        attachedCardId: "a"
      });

      expect(candidates.map((candidate) => candidate.variant.variantId)).toEqual(["has-card"]);
    });

    it("retrieves nothing with intent but no attached card", () => {
      const candidates = selectComboCandidates(lookupCatalog, {
        mode: "lookup",
        instances: [],
        questionText: "any combos",
        hasExplicitIntent: true
      });

      expect(candidates).toEqual([]);
    });

    it("retrieves nothing with an attached card but no intent", () => {
      const candidates = selectComboCandidates(lookupCatalog, {
        mode: "lookup",
        instances: [{ instanceId: "attached", cardId: "a", cardName: "Card a" }],
        questionText: "what does this do",
        hasExplicitIntent: false,
        attachedCardId: "a"
      });

      expect(candidates).toEqual([]);
    });

    it("matches the attached card on identity and reports the expected zone state", () => {
      const stateCatalog = catalogOf([
        variant({
          variantId: "stateful",
          cardIngredients: [cardIngredient({ cardId: "a", zones: ["B"], cardState: { battlefield: "untapped" } })]
        })
      ]);

      const candidates = selectComboCandidates(stateCatalog, {
        mode: "lookup",
        instances: [{ instanceId: "attached", cardId: "a", cardName: "Card a" }],
        questionText: "does this combo",
        hasExplicitIntent: true,
        attachedCardId: "a"
      });

      const annotation = candidates[0]!.annotations[0]!;
      expect(annotation.kind).toBe("compatible-present");
      expect(annotation.occupiedZones).toEqual([]);
      expect(annotation.stateZone).toBe("B");
      expect(annotation.cardState).toBe("untapped");
    });
  });

  describe("Catalog gating", () => {
    it("returns nothing for an empty catalog", () => {
      const empty: ComboCatalog = {
        byOracleId: new Map(),
        byTemplateOracleId: new Map(),
        variantCount: 0,
        getVariant: () => undefined
      };

      expect(selectComboCandidates(empty, gameRequest({ instances: [instance("a", "battlefield")] }))).toEqual([]);
    });
  });
});
