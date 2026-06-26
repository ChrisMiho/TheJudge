import { describe, expect, it } from "vitest";

import { DEFAULT_PALETTE_ID, getPaletteById, isValidPaletteId, PALETTES } from "./palettes";

describe("palettes", () => {
  it("exports an ordered, non-empty palette list", () => {
    expect(PALETTES.length).toBeGreaterThan(0);
  });

  it("each palette has an id, name, swatch, and accent variable values", () => {
    for (const palette of PALETTES) {
      expect(typeof palette.id).toBe("string");
      expect(palette.id.length).toBeGreaterThan(0);
      expect(typeof palette.name).toBe("string");
      expect(palette.name.length).toBeGreaterThan(0);
      expect(typeof palette.swatch).toBe("string");
      expect(typeof palette.accent).toBe("string");
      expect(typeof palette.accentStrong).toBe("string");
      expect(typeof palette.accentSoft).toBe("string");
      expect(typeof palette.accentContrast).toBe("string");
    }
  });

  it("includes a default blue palette matching DEFAULT_PALETTE_ID", () => {
    expect(DEFAULT_PALETTE_ID).toBe("blue");
    const defaultPalette = getPaletteById(DEFAULT_PALETTE_ID);
    expect(defaultPalette).toBeDefined();
    expect(defaultPalette?.name.toLowerCase()).toContain("blue");
  });

  it("looks up a palette by id", () => {
    const palette = getPaletteById("blue");
    expect(palette?.id).toBe("blue");
  });

  it("returns undefined for an unknown id", () => {
    expect(getPaletteById("not-a-real-palette")).toBeUndefined();
  });

  it("validates known and unknown ids", () => {
    expect(isValidPaletteId("blue")).toBe(true);
    expect(isValidPaletteId("not-a-real-palette")).toBe(false);
  });
});
