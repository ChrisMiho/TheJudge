import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
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

let uniqueSuffix = 0;

/**
 * Each case gets its own directory: `warnOnce` is keyed by absolute path (or
 * `path#variantId` for a per-variant failure) and intentionally persists for
 * the process, so reusing a path across cases would suppress the very
 * warning under assertion.
 */
function tempDir(): string {
  return mkdtempSync(join(tmpdir(), `combo-catalog-${uniqueSuffix++}-`));
}

/** Gzip each variant individually and concatenate, mirroring the build script's format. */
function serializeDetail(variants: unknown[]): { buffer: Buffer; offsets: Record<string, [number, number]> } {
  const chunks: Buffer[] = [];
  const offsets: Record<string, [number, number]> = {};
  let cursor = 0;
  for (const raw of variants) {
    const compressed = gzipSync(Buffer.from(JSON.stringify(raw), "utf8"));
    const variantId = (raw as { variantId?: unknown })?.variantId;
    if (typeof variantId === "string") offsets[variantId] = [cursor, compressed.length];
    chunks.push(compressed);
    cursor += compressed.length;
  }
  return { buffer: Buffer.concat(chunks), offsets };
}

function writeArtifacts(
  variants: unknown[],
  indexOverrides: Record<string, unknown> = {}
): { detailPath: string; indexPath: string } {
  const dir = tempDir();
  const detailPath = join(dir, "commanderSpellbookCombos.json.gz");
  const indexPath = join(dir, "commanderSpellbookComboIndex.json.gz");

  const { buffer, offsets } = serializeDetail(variants);
  writeFileSync(detailPath, buffer);

  const index = {
    byOracleId: {},
    byTemplateOracleId: {},
    detailOffsets: offsets,
    ...indexOverrides
  };
  writeFileSync(indexPath, gzipSync(Buffer.from(JSON.stringify(index), "utf8")));

  return { detailPath, indexPath };
}

describe("Backend - Ask AI", () => {
  describe("Combo catalog loading", () => {
    it("loads variants and membership from valid artifacts", () => {
      const { detailPath, indexPath } = writeArtifacts([sampleVariant], {
        byOracleId: { "oracle-1": ["1000-2000"], "oracle-2": ["1000-2000"] }
      });
      const catalog = loadComboCatalog(detailPath, indexPath);

      expect(catalog.variantCount).toBe(1);
      expect(catalog.getVariant("1000-2000")?.steps).toBe("Cast the spell, then win.");
      expect(catalog.byOracleId.get("oracle-1")).toEqual(["1000-2000"]);
    });

    it("keeps zone-scoped card state uncollapsed", () => {
      const { detailPath, indexPath } = writeArtifacts([sampleVariant]);
      const catalog = loadComboCatalog(detailPath, indexPath);
      const ingredient = catalog.getVariant("1000-2000")?.cardIngredients[1];

      expect(ingredient?.zones).toEqual(["B", "G"]);
      expect(ingredient?.cardState).toEqual({ battlefield: "untapped", graveyard: "with three other cards" });
    });

    it("returns the empty result and warns once per path when the detail artifact is absent", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const dir = tempDir();
      const detailPath = join(dir, "missing-detail.json.gz");
      const { indexPath } = writeArtifacts([sampleVariant]);

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      // Same path again in the same process: still exactly one warning.
      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("returns the empty result and warns once per path when the index artifact is absent", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { detailPath } = writeArtifacts([sampleVariant]);
      const indexPath = join(tempDir(), "missing-index.json.gz");

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("returns the empty result for an unreadable (non-gzip) index without throwing", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const dir = tempDir();
      const detailPath = join(dir, "commanderSpellbookCombos.json.gz");
      const indexPath = join(dir, "commanderSpellbookComboIndex.json.gz");
      writeFileSync(detailPath, Buffer.from([]));
      writeFileSync(indexPath, Buffer.from("{ not gzip"));

      expect(() => loadComboCatalog(detailPath, indexPath)).not.toThrow();
      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("returns the empty result for an empty detail file whose index still records offsets", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const dir = tempDir();
      const detailPath = join(dir, "commanderSpellbookCombos.json.gz");
      const indexPath = join(dir, "commanderSpellbookComboIndex.json.gz");
      writeFileSync(detailPath, Buffer.from([]));
      writeFileSync(
        indexPath,
        gzipSync(Buffer.from(JSON.stringify({ byOracleId: {}, byTemplateOracleId: {}, detailOffsets: { x: [0, 10] } })))
      );

      // The detail file is shorter than the recorded range — caught structurally,
      // without ever decompressing anything.
      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("returns the empty result for an index that is valid JSON of the wrong shape", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const dir = tempDir();
      const detailPath = join(dir, "commanderSpellbookCombos.json.gz");
      const indexPath = join(dir, "commanderSpellbookComboIndex.json.gz");
      writeFileSync(detailPath, Buffer.from([]));
      writeFileSync(indexPath, gzipSync(Buffer.from(JSON.stringify(["not", "an", "object"]))));

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("a corrupt single variant fails open for that variant only, leaving the rest of the catalog loadable", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      for (const field of ["steps", "manaNeeded", "easyPrerequisites", "notablePrerequisites", "notes"] as const) {
        const goodVariant = { ...sampleVariant, variantId: `${field}-good` };
        const badVariant = { ...sampleVariant, variantId: `${field}-bad`, [field]: null };
        const { detailPath, indexPath } = writeArtifacts([goodVariant, badVariant]);

        const catalog = loadComboCatalog(detailPath, indexPath);

        expect(catalog.variantCount).toBe(2);
        expect(catalog.getVariant(`${field}-good`)?.variantId).toBe(`${field}-good`);
        expect(catalog.getVariant(`${field}-bad`)).toBeUndefined();
      }
      expect(spy).toHaveBeenCalledTimes(5);
      spy.mockRestore();
    });

    it("null card state fails open for that variant only", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const badVariant = {
        ...sampleVariant,
        variantId: "bad-state",
        cardIngredients: [{ ...sampleVariant.cardIngredients[0], cardState: null }]
      };
      const { detailPath, indexPath } = writeArtifacts([sampleVariant, badVariant]);

      const catalog = loadComboCatalog(detailPath, indexPath);

      expect(catalog.getVariant("1000-2000")).toBeDefined();
      expect(catalog.getVariant("bad-state")).toBeUndefined();
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("a corrupt variant's bytes never prevent decompressing another variant's bytes", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const dir = tempDir();
      const detailPath = join(dir, "commanderSpellbookCombos.json.gz");
      const indexPath = join(dir, "commanderSpellbookComboIndex.json.gz");

      const goodCompressed = gzipSync(Buffer.from(JSON.stringify({ ...sampleVariant, variantId: "good" }), "utf8"));
      const garbage = Buffer.from("this is not gzip data at all, just garbage bytes");
      writeFileSync(detailPath, Buffer.concat([goodCompressed, garbage]));
      writeFileSync(
        indexPath,
        gzipSync(
          Buffer.from(
            JSON.stringify({
              byOracleId: {},
              byTemplateOracleId: {},
              detailOffsets: { good: [0, goodCompressed.length], corrupt: [goodCompressed.length, garbage.length] }
            })
          )
        )
      );

      const catalog = loadComboCatalog(detailPath, indexPath);
      expect(catalog.getVariant("good")?.variantId).toBe("good");
      expect(catalog.getVariant("corrupt")).toBeUndefined();
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("disables enrichment when the index is absent even though the detail loads", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { detailPath } = writeArtifacts([sampleVariant]);
      const indexPath = join(tempDir(), "commanderSpellbookComboIndex.json.gz");

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("loads an empty corpus without warning", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { detailPath, indexPath } = writeArtifacts([]);

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).not.toHaveBeenCalled();

      spy.mockRestore();
    });

    it("does not memoize across separate loads, so a later load reflects the artifact on disk", () => {
      const { detailPath, indexPath } = writeArtifacts([sampleVariant]);
      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(1);

      const { buffer } = serializeDetail([]);
      writeFileSync(detailPath, buffer);
      writeFileSync(indexPath, gzipSync(Buffer.from(JSON.stringify({ byOracleId: {}, byTemplateOracleId: {}, detailOffsets: {} }))));

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
    });

    it("caches a fetched variant within one loaded catalog, returning the same object on repeat lookups", () => {
      const { detailPath, indexPath } = writeArtifacts([sampleVariant]);
      const catalog = loadComboCatalog(detailPath, indexPath);

      const first = catalog.getVariant("1000-2000");
      const second = catalog.getVariant("1000-2000");
      expect(first).toBeDefined();
      expect(first).toBe(second);
    });

    it("evicts the least-recently-used variant once the cache exceeds its capacity", () => {
      const capacity = 64;
      const variants = Array.from({ length: capacity + 1 }, (_, index) => ({
        ...sampleVariant,
        variantId: `v${index}`
      }));
      const { detailPath, indexPath } = writeArtifacts(variants);
      const catalog = loadComboCatalog(detailPath, indexPath);

      const firstFetch = catalog.getVariant("v0");
      // Fetching every other variant pushes v0 out of a capacity-64 cache.
      for (let index = 1; index <= capacity; index += 1) catalog.getVariant(`v${index}`);
      const refetch = catalog.getVariant("v0");

      expect(firstFetch).toBeDefined();
      expect(refetch).toBeDefined();
      expect(refetch).not.toBe(firstFetch);
    });
  });
});
