import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliDecompressSync } from "node:zlib";
import { beforeAll, describe, expect, it } from "vitest";
import { loadComboCatalog, type ComboCatalog } from "./catalog.js";
import { selectComboCandidates, type ComboMatchInstance, type ComboMatchRequest } from "./matcher.js";
import { COMBO_ZONE_TO_ZONE_ID } from "./zones.js";

// These tests read the committed combo data, the same files the server loads.
const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../data");
const detailPath = resolve(dataDir, "commanderSpellbookComboBlocks.br");
const indexPath = resolve(dataDir, "commanderSpellbookComboIndex.json.br");

/** Small seeded generator (mulberry32), so the sampled boards are the same on every run. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Board = { label: string; cardIds: string[]; zones: Array<ComboMatchInstance["zone"]> };

function toRequest(
  board: Board,
  mode: ComboMatchRequest["mode"],
  hasExplicitIntent: boolean
): ComboMatchRequest {
  const instances: ComboMatchInstance[] = board.cardIds.map((cardId, index) => ({
    instanceId: `${cardId}-${index}`,
    cardId,
    cardName: `Card ${cardId}`,
    // Lookup attaches cards without a zone; a game board carries each card's zone.
    ...(mode === "game" ? { zone: board.zones[index] } : {})
  }));
  return {
    mode,
    instances,
    questionText: hasExplicitIntent ? "Does this combo with anything on the board?" : "What happens when this resolves?",
    hasExplicitIntent
  };
}

describe("Backend - Ask AI", () => {
  describe("Combo matching prefilter (committed catalog)", () => {
    let catalog: ComboCatalog;
    let topCardIds: string[];
    let boards: Board[];

    beforeAll(() => {
      catalog = loadComboCatalog(detailPath, indexPath);
      expect(catalog.variantCount).toBeGreaterThan(0);

      // The 50 most-comboed cards: the ones the prefilter saves the most work for.
      topCardIds = [...catalog.byOracleId.entries()]
        .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
        .slice(0, 50)
        .map(([cardId]) => cardId);

      const random = seededRandom(20261018);
      const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
      boards = topCardIds.map((cardId) => ({ label: `alone ${cardId}`, cardIds: [cardId], zones: ["battlefield"] }));

      // Pairs and full-combo boards built from real variants, so some of them do complete a combo.
      const zoneFor = (zones: readonly string[]): ComboMatchInstance["zone"] =>
        COMBO_ZONE_TO_ZONE_ID[(zones[0] ?? "B") as keyof typeof COMBO_ZONE_TO_ZONE_ID];
      // Anchors come from the lighter half of the top 50 so the unfiltered reference scans stay quick.
      const lighterTopCardIds = topCardIds.slice(25);
      for (let index = 0; index < 8; index += 1) {
        const anchor = pick(lighterTopCardIds);
        const variant = catalog.getVariant(pick(catalog.byOracleId.get(anchor)!));
        if (!variant) continue;
        const ingredients = variant.cardIngredients.slice(0, 5);
        if (ingredients.length >= 2) {
          boards.push({
            label: `full ${variant.variantId}`,
            cardIds: ingredients.map((ingredient) => ingredient.cardId),
            zones: ingredients.map((ingredient) => zoneFor(ingredient.zones))
          });
          const [first, second] = [ingredients[0]!, pick(ingredients.slice(1))];
          boards.push({
            label: `pair ${first.cardId}+${second.cardId}`,
            cardIds: [first.cardId, second.cardId],
            zones: [zoneFor(first.zones), zoneFor(second.zones)]
          });
        }
      }
      // Seeded pairs of top cards that mostly do not share a combo.
      for (let index = 0; index < 6; index += 1) {
        const first = pick(lighterTopCardIds);
        const second = pick(lighterTopCardIds);
        if (first === second) continue;
        boards.push({ label: `random ${first}+${second}`, cardIds: [first, second], zones: ["battlefield", "graveyard"] });
      }
    });

    it("returns exactly what the unfiltered scan returns, in game mode without combo wording", () => {
      let boardsWithResults = 0;
      for (const board of boards) {
        const request = toRequest(board, "game", false);
        const filtered = selectComboCandidates(catalog, request);
        const reference = selectComboCandidates(catalog, request, { prefilter: false });
        expect(filtered, board.label).toEqual(reference);
        if (reference.length > 0) boardsWithResults += 1;
      }
      // The sample must include boards that really complete combos, or the comparison proves little.
      expect(boardsWithResults).toBeGreaterThanOrEqual(6);
    }, 60_000);

    it("returns exactly what the unfiltered scan returns with combo wording, in game and lookup modes", () => {
      // Combo wording turns the prefilter off, so both paths are the same scan; a handful of boards is enough.
      for (const board of boards.filter((_, index) => index % 14 === 4)) {
        for (const mode of ["game", "lookup"] as const) {
          const request = toRequest(board, mode, true);
          expect(selectComboCandidates(catalog, request), `${mode} ${board.label}`).toEqual(
            selectComboCandidates(catalog, request, { prefilter: false })
          );
        }
      }
    }, 60_000);

    it("returns nothing in lookup mode without combo wording, with or without the prefilter", () => {
      for (const board of boards.filter((_, index) => index % 10 === 0)) {
        const request = toRequest(board, "lookup", false);
        expect(selectComboCandidates(catalog, request)).toEqual([]);
        expect(selectComboCandidates(catalog, request, { prefilter: false })).toEqual([]);
      }
    });

    it("does not fetch variants that cannot be fully assigned when the question has no combo wording", () => {
      const heavyCardId = topCardIds[0]!;
      let fetched = 0;
      const counting: ComboCatalog = {
        byOracleId: catalog.byOracleId,
        byTemplateOracleId: catalog.byTemplateOracleId,
        variantCount: catalog.variantCount,
        getVariant: (variantId) => {
          fetched += 1;
          return catalog.getVariant(variantId);
        }
      };
      const request = toRequest({ label: "heavy", cardIds: [heavyCardId], zones: ["battlefield"] }, "game", false);

      selectComboCandidates(counting, request);
      const filteredFetches = fetched;
      fetched = 0;
      selectComboCandidates(counting, request, { prefilter: false });

      expect(fetched).toBeGreaterThan(1000);
      expect(filteredFetches).toBeLessThan(fetched / 10);
    });
  });

  describe("Combo matching integrity (committed catalog)", () => {
    it("decodes every committed combo variant without an integrity failure", () => {
      const catalog = loadComboCatalog(detailPath, indexPath);
      const index = JSON.parse(brotliDecompressSync(readFileSync(indexPath)).toString("utf8")) as {
        variantIds: string[];
      };
      expect(index.variantIds.length).toBe(catalog.variantCount);

      // In stored order, so each compressed block is read once.
      const failed = index.variantIds.filter((variantId) => catalog.getVariant(variantId) === undefined);
      expect(failed).toEqual([]);
    });
  });
});
