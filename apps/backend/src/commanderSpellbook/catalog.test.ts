import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { brotliCompressSync, constants as zlibConstants } from "node:zlib";
import { describe, expect, it, vi } from "vitest";
import { loadComboCatalog, type ComboVariant } from "./catalog.js";

const COMBO_BLOCK_SIZE = 128;

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

function brotliBlock(buffer: Buffer): Buffer {
  return brotliCompressSync(buffer, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      [zlibConstants.BROTLI_PARAM_SIZE_HINT]: buffer.length
    }
  });
}

/** Group variants into 128-per-block NDJSON, brotli-compressed, mirroring the build script's format. */
function serializeDetail(variants: unknown[]): {
  buffer: Buffer;
  blocks: { offset: number; length: number }[];
  variantIds: string[];
} {
  const variantIds = variants.map((variant) => {
    const variantId = (variant as { variantId?: unknown })?.variantId;
    return typeof variantId === "string" ? variantId : "";
  });

  const chunks: Buffer[] = [];
  const blocks: { offset: number; length: number }[] = [];
  let cursor = 0;
  for (let start = 0; start < variants.length; start += COMBO_BLOCK_SIZE) {
    const blockVariants = variants.slice(start, start + COMBO_BLOCK_SIZE);
    const ndjson = blockVariants.map((variant) => JSON.stringify(variant)).join("\n");
    const compressed = brotliBlock(Buffer.from(ndjson, "utf8"));
    blocks.push({ offset: cursor, length: compressed.length });
    chunks.push(compressed);
    cursor += compressed.length;
  }

  return { buffer: Buffer.concat(chunks), blocks, variantIds };
}

function writeArtifacts(
  variants: unknown[],
  indexOverrides: Record<string, unknown> = {}
): { detailPath: string; indexPath: string } {
  const dir = tempDir();
  const detailPath = join(dir, "commanderSpellbookComboBlocks.br");
  const indexPath = join(dir, "commanderSpellbookComboIndex.json.br");

  const { buffer, blocks, variantIds } = serializeDetail(variants);
  writeFileSync(detailPath, buffer);

  const index = {
    byOracleId: {},
    byTemplateOracleId: {},
    blocks,
    variantIds,
    ...indexOverrides
  };
  writeFileSync(indexPath, brotliBlock(Buffer.from(JSON.stringify(index), "utf8")));

  return { detailPath, indexPath };
}

describe("Backend - Ask AI", () => {
  describe("Combo catalog loading", () => {
    it("loads variants and membership from valid artifacts", () => {
      // Membership is written as integer positions into variantIds (slice E);
      // "1000-2000" is the only variant, at position 0.
      const { detailPath, indexPath } = writeArtifacts([sampleVariant], {
        byOracleId: { "oracle-1": [0], "oracle-2": [0] }
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

    it("reads only the requested variant's block byte range, decoding by position/line arithmetic", () => {
      // 300 variants -> 3 blocks (128, 128, 44). Position 150 is block 1, line 22.
      const variants = Array.from({ length: 300 }, (_, index) => ({
        ...sampleVariant,
        variantId: `v${index}`
      }));
      const { detailPath, indexPath } = writeArtifacts(variants);
      const catalog = loadComboCatalog(detailPath, indexPath);

      expect(catalog.variantCount).toBe(300);
      expect(catalog.getVariant("v0")?.variantId).toBe("v0");
      expect(catalog.getVariant("v150")?.variantId).toBe("v150");
      expect(catalog.getVariant("v299")?.variantId).toBe("v299");
    });

    it("returns the empty result and warns once per path when the detail artifact is absent", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const dir = tempDir();
      const detailPath = join(dir, "missing-detail.br");
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
      const indexPath = join(tempDir(), "missing-index.br");

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("returns the empty result for an unreadable (non-brotli) index without throwing", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const dir = tempDir();
      const detailPath = join(dir, "commanderSpellbookComboBlocks.br");
      const indexPath = join(dir, "commanderSpellbookComboIndex.json.br");
      writeFileSync(detailPath, Buffer.from([]));
      writeFileSync(indexPath, Buffer.from("{ not brotli"));

      expect(() => loadComboCatalog(detailPath, indexPath)).not.toThrow();
      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("returns the empty result for an empty detail file whose index still records a block range", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const dir = tempDir();
      const detailPath = join(dir, "commanderSpellbookComboBlocks.br");
      const indexPath = join(dir, "commanderSpellbookComboIndex.json.br");
      writeFileSync(detailPath, Buffer.from([]));
      writeFileSync(
        indexPath,
        brotliBlock(
          Buffer.from(
            JSON.stringify({
              byOracleId: {},
              byTemplateOracleId: {},
              blocks: [{ offset: 0, length: 10 }],
              variantIds: ["x"]
            })
          )
        )
      );

      // The detail file is shorter than the recorded block range — caught
      // structurally, without ever decompressing anything.
      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("returns the empty result for an index that is valid JSON of the wrong shape", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const dir = tempDir();
      const detailPath = join(dir, "commanderSpellbookComboBlocks.br");
      const indexPath = join(dir, "commanderSpellbookComboIndex.json.br");
      writeFileSync(detailPath, Buffer.from([]));
      writeFileSync(indexPath, brotliBlock(Buffer.from(JSON.stringify(["not", "an", "object"]))));

      expect(loadComboCatalog(detailPath, indexPath).variantCount).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("a corrupt single variant record fails open for that variant only, leaving the rest of the catalog loadable", () => {
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

    it("a corrupted block's bytes never prevent decompressing another block's variants", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      // 130 variants -> block 0 (128) is untouched, block 1 (2 variants) gets
      // its bytes replaced with garbage. Isolation is per block, not per
      // variant, since a block is one brotli member.
      const variants = Array.from({ length: 130 }, (_, index) => ({
        ...sampleVariant,
        variantId: `v${index}`
      }));
      const { buffer, blocks, variantIds } = serializeDetail(variants);

      const garbage = Buffer.from("this is not brotli data at all, just garbage bytes padded out long");
      const secondBlock = blocks[1];
      const corrupted = Buffer.concat([
        buffer.subarray(0, secondBlock.offset),
        garbage,
        buffer.subarray(secondBlock.offset + secondBlock.length)
      ]);
      const adjustedBlocks = [blocks[0], { offset: secondBlock.offset, length: garbage.length }];

      const dir = tempDir();
      const detailPath = join(dir, "commanderSpellbookComboBlocks.br");
      const indexPath = join(dir, "commanderSpellbookComboIndex.json.br");
      writeFileSync(detailPath, corrupted);
      writeFileSync(
        indexPath,
        brotliBlock(
          Buffer.from(JSON.stringify({ byOracleId: {}, byTemplateOracleId: {}, blocks: adjustedBlocks, variantIds }))
        )
      );

      const catalog = loadComboCatalog(detailPath, indexPath);
      expect(catalog.getVariant("v0")?.variantId).toBe("v0"); // block 0, untouched
      expect(catalog.getVariant("v128")).toBeUndefined(); // block 1, corrupted
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("disables enrichment when the index is absent even though the detail loads", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { detailPath } = writeArtifacts([sampleVariant]);
      const indexPath = join(tempDir(), "commanderSpellbookComboIndex.json.br");

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
      writeFileSync(
        indexPath,
        brotliBlock(Buffer.from(JSON.stringify({ byOracleId: {}, byTemplateOracleId: {}, blocks: [], variantIds: [] })))
      );

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
