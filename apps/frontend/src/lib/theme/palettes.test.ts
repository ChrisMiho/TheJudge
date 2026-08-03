import { describe, expect, it } from "vitest";

import {
  COLORLESS_PALETTE,
  DEFAULT_PALETTE_ID,
  getPaletteById,
  hexToChannelTriple,
  isValidHexColor,
  isValidPaletteId,
  PALETTES,
  resolveColorlessPalette
} from "./palettes";

const WUBRGC_IDS = ["white", "blue", "black", "red", "green", "colorless"];

function channelTripleToRgb(triple: string): [number, number, number] {
  const [r, g, b] = triple.split(" ").map((value) => Number(value));
  return [r, g, b];
}

function relativeLuminance(triple: string): number {
  const [r, g, b] = channelTripleToRgb(triple).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(tripleA: string, tripleB: string): number {
  const luminanceA = relativeLuminance(tripleA);
  const luminanceB = relativeLuminance(tripleB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Frontend - Theme", () => {
describe("palettes", () => {
  it("exports exactly the six WUBRGC profiles in order", () => {
    expect(PALETTES.map((palette) => palette.id)).toEqual(WUBRGC_IDS);
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

  it("contains no retired Violet/Emerald/Amber/Rose definitions", () => {
    for (const retiredId of ["violet", "emerald", "amber", "rose"]) {
      expect(isValidPaletteId(retiredId)).toBe(false);
      expect(getPaletteById(retiredId)).toBeUndefined();
    }
  });

  it("asserts the approved fixed token values for every profile", () => {
    expect(getPaletteById("white")).toMatchObject({
      accent: "243 230 179",
      accentStrong: "198 161 91",
      accentSoft: "255 224 102",
      accentContrast: "9 9 11"
    });
    expect(getPaletteById("blue")).toMatchObject({
      accent: "3 105 161",
      accentStrong: "29 78 216",
      accentSoft: "56 189 248",
      accentContrast: "255 255 255"
    });
    expect(getPaletteById("black")).toMatchObject({
      accent: "107 79 112",
      accentStrong: "36 31 41",
      accentSoft: "216 180 254",
      accentContrast: "255 255 255"
    });
    expect(getPaletteById("red")).toMatchObject({
      accent: "185 28 28",
      accentStrong: "127 29 29",
      accentSoft: "255 107 107",
      accentContrast: "255 255 255"
    });
    expect(getPaletteById("green")).toMatchObject({
      accent: "21 128 61",
      accentStrong: "20 83 45",
      accentSoft: "74 222 128",
      accentContrast: "255 255 255"
    });
    expect(getPaletteById("colorless")).toMatchObject({
      accent: "82 82 91",
      accentStrong: "39 39 42",
      accentSoft: "228 228 231",
      accentContrast: "255 255 255"
    });
  });

  it("clears 4.5:1 contrast for accentContrast against both accent and accentStrong", () => {
    for (const palette of PALETTES) {
      expect(contrastRatio(palette.accentContrast, palette.accent)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.accentContrast, palette.accentStrong)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps fixed Black and fixed Colorless visually distinct", () => {
    const black = getPaletteById("black")!;
    const colorless = getPaletteById("colorless")!;
    expect(black.accent).not.toBe(colorless.accent);
    expect(black.accentStrong).not.toBe(colorless.accentStrong);
    expect(black.accentSoft).not.toBe(colorless.accentSoft);
  });

  describe("isValidHexColor", () => {
    it("accepts a complete six-digit hex value", () => {
      expect(isValidHexColor("#52525b")).toBe(true);
      expect(isValidHexColor("#ABCDEF")).toBe(true);
    });

    it("rejects malformed or incomplete values", () => {
      expect(isValidHexColor("#fff")).toBe(false);
      expect(isValidHexColor("52525b")).toBe(false);
      expect(isValidHexColor("#gggggg")).toBe(false);
      expect(isValidHexColor("")).toBe(false);
      expect(isValidHexColor("#5252b")).toBe(false);
    });
  });

  describe("hexToChannelTriple", () => {
    it("converts a hex value to its decimal channel triple", () => {
      expect(hexToChannelTriple("#52525b")).toBe("82 82 91");
      expect(hexToChannelTriple("#FFFFFF")).toBe("255 255 255");
      expect(hexToChannelTriple("#000000")).toBe("0 0 0");
    });
  });

  describe("resolveColorlessPalette", () => {
    it("returns the fixed Colorless palette when no custom value is given", () => {
      expect(resolveColorlessPalette(undefined)).toEqual(COLORLESS_PALETTE);
      expect(resolveColorlessPalette(null)).toEqual(COLORLESS_PALETTE);
    });

    it("returns the fixed Colorless palette for a malformed custom value", () => {
      expect(resolveColorlessPalette("not-a-hex")).toEqual(COLORLESS_PALETTE);
    });

    it("applies a valid custom hex unchanged to accent, accentStrong, and accentSoft", () => {
      const resolved = resolveColorlessPalette("#ff8800");
      expect(resolved.accent).toBe("255 136 0");
      expect(resolved.accentStrong).toBe("255 136 0");
      expect(resolved.accentSoft).toBe("255 136 0");
      expect(resolved.accentContrast).toBe("255 255 255");
    });
  });
});
});
