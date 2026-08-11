import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { loadComboCatalog, type ComboVariant } from "./catalog.js";

const sampleVariant: ComboVariant = {
  variantId: "1000-2000",
  sourceUrl: "https://commanderspellbook.com/combo/1000-2000/",
  popularity: 900,
  steps: "Cast the spell, then win.",
  manaNeeded: "{U}{B}",
  easyPrerequisites: "All permanents are untapped.",
  notablePrerequisites: "Your library has at most five cards.",
  notes: "The trigger must still be on the stack.",
  producedEffects: ["Win the game"],
  cardIngredients: [
    {
      cardId: "oracle-1",
      cardName: "Thassa's Oracle",
      quantity: 1,
      zones: ["B"],
      cardState: {},
      mustBeCommander: false
    },
    {
      cardId: "oracle-2",
      cardName: "Underworld Breach",
      quantity: 1,
      zones: ["B", "G"],
      cardState: { battlefield: "untapped", graveyard: "with three other cards" },
      mustBeCommander: false
    }
  ],
  templateIngredients: []
};

const sampleIndex = {
  byOracleId: { "oracle-1": ["1000-2000"], "oracle-2": ["1000-2000"] },
  byTemplateOracleId: {},
  templates: {},
  unresolvedTemplateIds: []
};

let uniqueSuffix = 0;

/**
 * Each case gets its own directory: `warnOnce` is keyed by absolute path and
 * intentionally persists for the process, so reusing a path across cases would
 * suppress the very warning under assertion.
 */
const OMIT = Symbol("omit");

function writeArtifacts(
  detail: unknown,
  index: unknown | typeof OMIT = sampleIndex
): { detailPath: string; indexPath: string } {
  const dir = mkdtempSync(join(tmpdir(), `combo-catalog-${uniqueSuffix++}-`));
  const detailPath = join(dir, "commanderSpellbookCombos.json");
  const indexPath = join(dir, "commanderSpellbookComboIndex.json");
  writeFileSync(detailPath, JSON.stringify(detail), "utf8");
  if (index !== OMIT) writeFileSync(indexPath, JSON.stringify(index), "utf8");
  return { detailPath, indexPath };
}

function writeRawArtifacts(detailContents: string): { detailPath: string; indexPath: string } {
  const dir = mkdtempSync(join(tmpdir(), `combo-catalog-${uniqueSuffix++}-`));
  const detailPath = join(dir, "commanderSpellbookCombos.json");
  const indexPath = join(dir, "commanderSpellbookComboIndex.json");
  writeFileSync(detailPath, detailContents, "utf8");
  writeFileSync(indexPath, JSON.stringify(sampleIndex), "utf8");
  return { detailPath, indexPath };
}

describe("Backend - Ask AI", () => {
  describe("Combo catalog loading", () => {
    it("loads variants and membership from valid artifacts", () => {
      const { detailPath, indexPath } = writeArtifacts({ variants: [sampleVariant] });
      const catalog = loadComboCatalog(detailPath, indexPath);

      expect(catalog.variantCount).toBe(1);
      expect(catalog.variants.get("1000-2000")?.steps).toBe("Cast the spell, then win.");
      expect(catalog.byOracleId.get("oracle-1")).toEqual(["1000-2000"]);
    });

    it("keeps zone-scoped card state uncollapsed", () => {
      const { detailPath, indexPath } = writeArtifacts({ variants: [sampleVariant] });
      const catalog = loadComboCatalog(detailPath, indexPath);
      const ingredient = catalog.variants.get("1000-2000")?.cardIngredients[1];

      expect(ingredient?.zones).toEqual(["B", "G"]);
      expect(ingredient?.cardState).toEqual({ battlefield: "untapped", graveyard: "with three other cards" });
    });

    it("returns the empty result and warns once per path when both artifacts are absent", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const dir = mkdtempSync(join(tmpdir(), `combo-catalog-${uniqueSuffix++}-`));
      const detailPath = join(dir, "missing-detail.json");
      const indexPath = join(dir, "missing-index.json");

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      // Same paths again in the same process: still exactly one warning per path.
      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("returns the empty result for malformed JSON without throwing", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { detailPath, indexPath } = writeRawArtifacts("{ not json");

      expect(() => loadComboCatalog(detailPath, indexPath)).not.toThrow();
      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("returns the empty result for an empty file", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { detailPath, indexPath } = writeRawArtifacts("");

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("returns the empty result for valid JSON of the wrong shape", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { detailPath, indexPath } = writeArtifacts([sampleVariant]);

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("treats a null editorial field as an integrity failure rather than skipping the variant", () => {
      for (const field of ["steps", "manaNeeded", "easyPrerequisites", "notablePrerequisites", "notes"]) {
        const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { detailPath, indexPath } = writeArtifacts({
          variants: [sampleVariant, { ...sampleVariant, variantId: "9999", [field]: null }]
        });

        const catalog = loadComboCatalog(detailPath, indexPath);

        expect(catalog.variantCount).toBe(0);
        expect(catalog.variants.size).toBe(0);
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
      }
    });

    it("treats null card state as an integrity failure", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { detailPath, indexPath } = writeArtifacts({
        variants: [{ ...sampleVariant, cardIngredients: [{ ...sampleVariant.cardIngredients[0], cardState: null }] }]
      });

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("disables enrichment when the index is absent even though the detail loads", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { detailPath, indexPath } = writeArtifacts({ variants: [sampleVariant] }, OMIT);

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("loads an empty corpus without warning", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { detailPath, indexPath } = writeArtifacts(
        { variants: [] },
        { byOracleId: {}, byTemplateOracleId: {}, templates: {}, unresolvedTemplateIds: [] }
      );

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).not.toHaveBeenCalled();

      spy.mockRestore();
    });

    it("does not memoize, so repeated loads reflect the artifact on disk", () => {
      const { detailPath, indexPath } = writeArtifacts({ variants: [sampleVariant] });

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(1);
      writeFileSync(detailPath, JSON.stringify({ variants: [] }), "utf8");
      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
    });
  });
});
