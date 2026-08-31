import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { describe, expect, it, vi } from "vitest";
import { loadComboCatalog, type ComboCardIngredient, type ComboCatalog, type ComboVariant } from "../commanderSpellbook/catalog.js";
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
  const byId = new Map(variants.map((entry) => [entry.variantId, entry]));

  return {
    byOracleId,
    byTemplateOracleId: new Map(),
    variantCount: variants.length,
    getVariant: (variantId) => byId.get(variantId)
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

function lookupRequest(question: string, ...cardIds: string[]): LookupAskAiRequest {
  return {
    mode: "lookup",
    question,
    ...(cardIds.length > 0
      ? {
          cards: cardIds.map((cardId) => ({
            cardId,
            name: cardId === "oracle-a" ? "Thassa's Oracle" : cardId,
            oracleText: "When this enters, look at the top of your library.",
            imageUrl: "",
            manaCost: "{U}{U}",
            manaValue: 2,
            typeLine: "Creature — Merfolk Wizard",
            colors: ["U"],
            supertypes: [],
            subtypes: ["Merfolk", "Wizard"]
          }))
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

    it("explains a complete combo when the attached card set fills every ingredient slot (REQ-167/REQ-094 amended)", () => {
      const prepared = preparePromptInput(
        lookupRequest("How do these cards combo with each other?", "oracle-a", "oracle-b"),
        { comboCatalog: catalog }
      );

      expect(prepared.promptText).toContain(COMBO_SECTION_HEADING);
      expect(prepared.promptText).toContain("all pieces present; card state unverified");
      expect(prepared.promptText).not.toContain("MISSING");
    });

    it("names the missing role, not a card recommendation, for a partial multi-card lookup candidate", () => {
      const prepared = preparePromptInput(lookupRequest("Does this card combo with anything?", "oracle-a"), {
        comboCatalog: catalog
      });

      expect(prepared.promptText).toContain(COMBO_SECTION_HEADING);
      expect(prepared.promptText).toContain("partial; missing pieces named below");
      expect(prepared.promptText).toContain("Demonic Consultation — MISSING");
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

    describe("at real scale (slice I)", () => {
      /**
       * Loads a real lazy-format catalog (gzip-per-record detail + byte-offset
       * index, through the actual `loadComboCatalog`) with many more variants
       * than any hand-sized fixture, and proves both prompt paths still render
       * correctly end to end: section present, never "complete", and the
       * state-verification instruction present in both modes — the "likely
       * intact, confirm it" risk the DEC-162 amendment flagged for slice D.
       */
      function loadAtScaleCatalog(): ComboCatalog {
        const filler: ComboVariant[] = Array.from({ length: 500 }, (_, index) => ({
          variantId: `filler-${String(index).padStart(4, "0")}`,
          sourceUrl: `https://commanderspellbook.com/combo/filler-${index}/`,
          popularity: index,
          steps: "Do the unrelated thing.",
          manaNeeded: "{1}",
          easyPrerequisites: "",
          notablePrerequisites: "",
          notes: "",
          producedEffects: ["Draw a card"],
          cardIngredients: [
            cardIngredient({ cardId: `unsubmitted-${index}`, cardName: `Filler ${index}` })
          ],
          templateIngredients: []
        }));
        const variants = [...filler, twoPieceCombo];

        const dir = mkdtempSync(join(tmpdir(), "combo-prompt-at-scale-"));
        const detailPath = join(dir, "commanderSpellbookCombos.json.gz");
        const indexPath = join(dir, "commanderSpellbookComboIndex.json.gz");
        const chunks: Buffer[] = [];
        const detailOffsets: Record<string, [number, number]> = {};
        const byOracleId: Record<string, string[]> = {};
        let cursor = 0;
        for (const entry of variants) {
          const compressed = gzipSync(Buffer.from(JSON.stringify(entry), "utf8"));
          detailOffsets[entry.variantId] = [cursor, compressed.length];
          chunks.push(compressed);
          cursor += compressed.length;
          for (const ingredient of entry.cardIngredients) {
            byOracleId[ingredient.cardId] = [...(byOracleId[ingredient.cardId] ?? []), entry.variantId];
          }
        }
        writeFileSync(detailPath, Buffer.concat(chunks));
        writeFileSync(
          indexPath,
          gzipSync(Buffer.from(JSON.stringify({ byOracleId, byTemplateOracleId: {}, detailOffsets }), "utf8"))
        );
        return loadComboCatalog(detailPath, indexPath);
      }

      it("renders the combo section correctly in both prompt modes against a large real-format catalog", () => {
        const atScaleCatalog = loadAtScaleCatalog();
        expect(atScaleCatalog.variantCount).toBe(501);

        const game = preparePromptInput(gameRequestWithBoard("Any combos?", ["oracle-a"], ["oracle-b"]), {
          comboCatalog: atScaleCatalog
        });
        const lookup = preparePromptInput(lookupRequest("Does this combo with anything?", "oracle-a"), {
          comboCatalog: atScaleCatalog
        });

        for (const promptText of [game.promptText, lookup.promptText]) {
          expect(promptText).toContain(COMBO_SECTION_HEADING);
          expect(promptText).toContain("check each ingredient's applicable card state");
          expect(promptText.slice(promptText.indexOf(COMBO_SECTION_HEADING))).not.toMatch(/\bcomplete\b/i);
        }
      });
    });

    describe("real answer-quality scenarios (slice J)", () => {
      /**
       * `scripts/compare-combo-answer-quality.mjs`'s curated scenarios used to
       * reference the slice E eval fixtures' synthetic oracle ids
       * (`eval-oracle-a`, ...), which exist in no real corpus — both A/B legs
       * would produce byte-identical prompts and spend live provider calls
       * proving nothing (DEC-162). They now carry inline requests with real
       * oracle ids. This proves J2 directly: with a real variant containing
       * those ids loaded, the enrichment-on and enrichment-off legs produce
       * genuinely different prompts for the "complete-no-intent" scenario —
       * checked against prompt text, never the live provider.
       */
      const scenariosPath = join(
        dirname(fileURLToPath(import.meta.url)),
        "../../../../scripts/fixtures/combo-answer-quality-scenarios.json"
      );
      const scenarios = JSON.parse(readFileSync(scenariosPath, "utf8")).scenarios as Array<{
        id: string;
        request: unknown;
      }>;

      function loadRealVariantCatalog(): ComboCatalog {
        const avatarOfGrowthVariant: ComboVariant = {
          variantId: "5702-8097",
          sourceUrl: "https://commanderspellbook.com/combo/5702-8097/",
          popularity: 500,
          steps: "Play a land to trigger Springheart Nantuko, copying Avatar of Growth.",
          manaNeeded: "{1}{G}",
          easyPrerequisites: "",
          notablePrerequisites: "",
          notes: "",
          producedEffects: ["Repeatable +1/+1 counters"],
          cardIngredients: [
            cardIngredient({
              cardId: "07db0374-3297-49c3-886d-a6bb42f7bb18",
              cardName: "Avatar of Growth"
            }),
            cardIngredient({
              cardId: "8a3ad2ef-8bcb-40c0-85de-f03328c2b644",
              cardName: "Springheart Nantuko"
            })
          ],
          templateIngredients: []
        };

        const dir = mkdtempSync(join(tmpdir(), "combo-scenario-real-"));
        const detailPath = join(dir, "commanderSpellbookCombos.json.gz");
        const indexPath = join(dir, "commanderSpellbookComboIndex.json.gz");
        const compressed = gzipSync(Buffer.from(JSON.stringify(avatarOfGrowthVariant), "utf8"));
        writeFileSync(detailPath, compressed);
        writeFileSync(
          indexPath,
          gzipSync(
            Buffer.from(
              JSON.stringify({
                byOracleId: {
                  "07db0374-3297-49c3-886d-a6bb42f7bb18": ["5702-8097"],
                  "8a3ad2ef-8bcb-40c0-85de-f03328c2b644": ["5702-8097"]
                },
                byTemplateOracleId: {},
                detailOffsets: { "5702-8097": [0, compressed.length] }
              }),
              "utf8"
            )
          )
        );
        return loadComboCatalog(detailPath, indexPath);
      }

      it("carries real oracle ids, not the eval fixtures' synthetic ones", () => {
        expect(scenarios.length).toBeGreaterThanOrEqual(6);
        const serialized = JSON.stringify(scenarios);
        expect(serialized).not.toMatch(/eval-oracle-/);
      });

      it("produces genuinely different prompts on and off for the complete-no-intent scenario", () => {
        const scenario = scenarios.find((entry) => entry.id === "complete-no-intent");
        expect(scenario).toBeDefined();

        const catalog = loadRealVariantCatalog();
        const enriched = preparePromptInput(scenario!.request as GameAskAiRequest, { comboCatalog: catalog });
        const disabled = preparePromptInput(scenario!.request as GameAskAiRequest, {});

        expect(enriched.promptText).toContain(COMBO_SECTION_HEADING);
        expect(disabled.promptText).not.toContain(COMBO_SECTION_HEADING);
        expect(enriched.promptText).not.toBe(disabled.promptText);
      });
    });
  });
});
