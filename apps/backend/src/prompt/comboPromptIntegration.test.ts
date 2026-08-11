import { describe, expect, it, vi } from "vitest";
import type { ComboCardIngredient, ComboCatalog, ComboVariant } from "../commanderSpellbook/catalog.js";
import { COMBO_SECTION_HEADING } from "../commanderSpellbook/formatting.js";
import * as matcher from "../commanderSpellbook/matcher.js";
import { buildMockAnswer } from "../mockAskAi.js";
import { createGameContext, createZoneCardItem } from "../test-utils/requestBuilders.js";
import type { GameAskAiRequest, LookupAskAiRequest } from "../types/index.js";
import { preparePromptInput } from "./preparation.js";

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

function variant(overrides: Partial<ComboVariant> & { variantId: string }): ComboVariant {
  return {
    sourceUrl: `https://commanderspellbook.com/combo/${overrides.variantId}/`,
    popularity: 500,
    steps: "Assemble the pieces.\nWin the game.",
    manaNeeded: "{U}",
    easyPrerequisites: "All permanents are untapped.",
    notablePrerequisites: "",
    notes: "",
    producedEffects: ["Win the game"],
    cardIngredients: [],
    templateIngredients: [],
    ...overrides
  };
}

function catalogOf(variants: ComboVariant[]): ComboCatalog {
  const byOracleId = new Map<string, string[]>();
  for (const entry of variants) {
    for (const ingredient of entry.cardIngredients) {
      byOracleId.set(ingredient.cardId, [...(byOracleId.get(ingredient.cardId) ?? []), entry.variantId]);
    }
  }
  return {
    variants: new Map(variants.map((entry) => [entry.variantId, entry])),
    byOracleId,
    byTemplateOracleId: new Map(),
    variantCount: variants.length
  };
}

const twoPieceCombo = variant({
  variantId: "1000-2000",
  cardIngredients: [
    cardIngredient({ cardId: "oracle-a", cardName: "Thassa's Oracle", cardState: { battlefield: "untapped" } }),
    cardIngredient({ cardId: "oracle-b", cardName: "Demonic Consultation", zones: ["H"] })
  ]
});

const catalog = catalogOf([twoPieceCombo]);

function gameRequestWithBoard(question: string, battlefield: string[], hand: string[] = []): GameAskAiRequest {
  return {
    question,
    gameContext: {
      ...createGameContext(),
      selectedZones: ["battlefield", "hand"],
      zones: {
        battlefield: battlefield.map((cardId) =>
          createZoneCardItem({ cardId, name: cardId === "oracle-a" ? "Thassa's Oracle" : cardId, owner: "Player 1" })
        ),
        hand: hand.map((cardId) =>
          createZoneCardItem({ cardId, name: cardId === "oracle-b" ? "Demonic Consultation" : cardId, owner: "Player 1" })
        )
      }
    }
  } as GameAskAiRequest;
}

function lookupRequest(question: string, cardId?: string): LookupAskAiRequest {
  return {
    mode: "lookup",
    question,
    ...(cardId
      ? {
          card: {
            cardId,
            name: "Thassa's Oracle",
            oracleText: "When this enters, look at the top of your library.",
            imageUrl: "",
            manaCost: "{U}{U}",
            manaValue: 2,
            typeLine: "Creature — Merfolk Wizard",
            colors: ["U"],
            supertypes: [],
            subtypes: ["Merfolk", "Wizard"]
          }
        }
      : {})
  } as LookupAskAiRequest;
}

describe("Backend - Ask AI", () => {
  describe("Combo prompt integration", () => {
    it("never invokes the matcher when no catalog is supplied", () => {
      const spy = vi.spyOn(matcher, "selectComboCandidates");
      const request = gameRequestWithBoard("Does this combo?", ["oracle-a"], ["oracle-b"]);

      const withoutCatalog = preparePromptInput(request, {});
      expect(spy).not.toHaveBeenCalled();
      expect(withoutCatalog.promptText).not.toContain("COMMANDER SPELLBOOK COMBO CONTEXT");

      // Guards the assertion above from being vacuous: the same spy must observe
      // the call that a supplied catalog does make.
      preparePromptInput(request, { comboCatalog: catalog });
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("omits the section entirely when nothing matches", () => {
      const prepared = preparePromptInput(gameRequestWithBoard("How does this resolve?", ["unrelated"]), {
        comboCatalog: catalog
      });

      expect(prepared.promptText).not.toContain("COMMANDER SPELLBOOK COMBO CONTEXT");
      expect(prepared.diagnostics.comboCandidateCount).toBeUndefined();
    });

    it("places the game-mode section after rulings and before SCOPE", () => {
      const prepared = preparePromptInput(
        gameRequestWithBoard("How does this resolve?", ["oracle-a"], ["oracle-b"]),
        { comboCatalog: catalog }
      );

      const comboIndex = prepared.promptText.indexOf(COMBO_SECTION_HEADING);
      const scopeIndex = prepared.promptText.indexOf("\nSCOPE");
      const questionIndex = prepared.promptText.indexOf("\nQUESTION");

      expect(comboIndex).toBeGreaterThan(-1);
      expect(comboIndex).toBeLessThan(scopeIndex);
      expect(scopeIndex).toBeLessThan(questionIndex);
    });

    it("supplies a fully assigned candidate automatically without combo intent", () => {
      const prepared = preparePromptInput(
        gameRequestWithBoard("How does this resolve?", ["oracle-a"], ["oracle-b"]),
        { comboCatalog: catalog }
      );

      expect(prepared.promptText).toContain("all pieces present; card state unverified");
      expect(prepared.promptText).toContain("required state (battlefield): untapped");
    });

    it("withholds a partial candidate without combo intent but supplies it with intent", () => {
      const withoutIntent = preparePromptInput(gameRequestWithBoard("How does this resolve?", ["oracle-a"]), {
        comboCatalog: catalog
      });
      expect(withoutIntent.promptText).not.toContain(COMBO_SECTION_HEADING);

      const withIntent = preparePromptInput(gameRequestWithBoard("Do I have a combo here?", ["oracle-a"]), {
        comboCatalog: catalog
      });
      expect(withIntent.promptText).toContain(COMBO_SECTION_HEADING);
      expect(withIntent.promptText).toContain("Demonic Consultation — MISSING");
    });

    it("places the lookup-mode section after rulings and before conversation history", () => {
      const prepared = preparePromptInput(lookupRequest("Does this card combo with anything?", "oracle-a"), {
        comboCatalog: catalog
      });

      const comboIndex = prepared.promptText.indexOf(COMBO_SECTION_HEADING);
      const questionIndex = prepared.promptText.indexOf("\nQUESTION");
      const cardIndex = prepared.promptText.indexOf("CARD (looked up)");

      expect(comboIndex).toBeGreaterThan(cardIndex);
      expect(comboIndex).toBeLessThan(questionIndex);
    });

    it("retrieves nothing in lookup mode without intent or without a card", () => {
      const noIntent = preparePromptInput(lookupRequest("What does this card do?", "oracle-a"), {
        comboCatalog: catalog
      });
      expect(noIntent.promptText).not.toContain(COMBO_SECTION_HEADING);

      const noCard = preparePromptInput(lookupRequest("What combos exist?"), { comboCatalog: catalog });
      expect(noCard.promptText).not.toContain(COMBO_SECTION_HEADING);
    });

    it("includes the state-verification instruction in both prompt modes", () => {
      const game = preparePromptInput(gameRequestWithBoard("Any combos?", ["oracle-a"], ["oracle-b"]), {
        comboCatalog: catalog
      });
      const lookup = preparePromptInput(lookupRequest("Does this combo with anything?", "oracle-a"), {
        comboCatalog: catalog
      });

      for (const promptText of [game.promptText, lookup.promptText]) {
        expect(promptText).toContain("check each ingredient's applicable card state");
        expect(promptText).toContain("must-be-commander requirement against the submitted board");
      }
    });

    it("includes the community-source and WotC-authority lines in both prompt modes", () => {
      const game = preparePromptInput(gameRequestWithBoard("Any combos?", ["oracle-a"], ["oracle-b"]), {
        comboCatalog: catalog
      });
      const lookup = preparePromptInput(lookupRequest("Does this combo with anything?", "oracle-a"), {
        comboCatalog: catalog
      });

      for (const promptText of [game.promptText, lookup.promptText]) {
        expect(promptText).toContain("community-maintained catalog data from Commander Spellbook");
        expect(promptText).toContain("Comprehensive Rules remain authoritative");
      }
    });

    it("reports the combo section's char contribution in diagnostics", () => {
      const prepared = preparePromptInput(
        gameRequestWithBoard("How does this resolve?", ["oracle-a"], ["oracle-b"]),
        { comboCatalog: catalog }
      );

      expect(prepared.diagnostics.comboCandidateCount).toBe(1);
      expect(prepared.diagnostics.comboSectionChars).toBeGreaterThan(0);
    });

    it("renders the same section on the enrichment-debug path", () => {
      const plain = preparePromptInput(gameRequestWithBoard("Any combos?", ["oracle-a"], ["oracle-b"]), {
        comboCatalog: catalog
      });
      const debug = preparePromptInput(gameRequestWithBoard("Any combos?", ["oracle-a"], ["oracle-b"]), {
        comboCatalog: catalog,
        collectEnrichmentDebug: true
      });

      expect(debug.promptText).toContain(COMBO_SECTION_HEADING);
      expect(debug.diagnostics.comboCandidateCount).toBe(plain.diagnostics.comboCandidateCount);
    });

    it("exposes the assembled section verbatim through the mock provider", () => {
      const prepared = preparePromptInput(
        gameRequestWithBoard("How does this resolve?", ["oracle-a"], ["oracle-b"]),
        { comboCatalog: catalog }
      );
      const mock = buildMockAnswer(prepared);

      const section = prepared.promptText.slice(prepared.promptText.indexOf(COMBO_SECTION_HEADING));
      expect(mock.answer).toContain(section);
    });

    it("never emits the standalone word complete in either prompt mode", () => {
      const game = preparePromptInput(gameRequestWithBoard("Any combos?", ["oracle-a"], ["oracle-b"]), {
        comboCatalog: catalog
      });
      const lookup = preparePromptInput(lookupRequest("Does this combo with anything?", "oracle-a"), {
        comboCatalog: catalog
      });

      const comboSectionOf = (promptText: string) => promptText.slice(promptText.indexOf(COMBO_SECTION_HEADING));
      expect(comboSectionOf(game.promptText)).not.toMatch(/\bcomplete\b/i);
      expect(comboSectionOf(lookup.promptText)).not.toMatch(/\bcomplete\b/i);
    });
  });
});
