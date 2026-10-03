import { describe, expect, it } from "vitest";

import {
  COLORLESS_PALETTE,
  DEFAULT_PALETTE_ID,
  contrastRatio as paletteContrastRatio,
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
      expect(typeof palette.ground).toBe("string");
      expect(typeof palette.groundWash).toBe("string");
      expect(typeof palette.panel).toBe("string");
      expect(typeof palette.panelEdge).toBe("string");
      expect(typeof palette.focusRing).toBe("string");
      expect(typeof palette.motif).toBe("string");
    }
  });

  it("gives every profile the REQ-200 ground floor (never fully black) and its own REQ-201 motif", () => {
    const motifs = new Set<string>();
    for (const palette of PALETTES) {
      expect(palette.ground).toBe("9 9 11");
      motifs.add(palette.motif);
    }
    // Six distinct motif languages, one per profile (REQ-201).
    expect(motifs.size).toBe(6);
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
      swatch: "#FAF8F2",
      accent: "237 231 214",
      accentStrong: "176 163 130",
      accentSoft: "250 248 242",
      accentContrast: "9 9 11"
    });
    expect(getPaletteById("blue")).toMatchObject({
      swatch: "#38E1FF",
      accent: "0 80 216",
      accentStrong: "30 58 156",
      accentSoft: "56 225 255",
      accentContrast: "255 255 255"
    });
    expect(getPaletteById("black")).toMatchObject({
      swatch: "#C77DFF",
      accent: "124 58 237",
      accentStrong: "46 26 71",
      accentSoft: "199 125 255",
      accentContrast: "255 255 255"
    });
    expect(getPaletteById("red")).toMatchObject({
      swatch: "#FF4D6D",
      accent: "193 2 48",
      accentStrong: "122 4 36",
      accentSoft: "255 77 109",
      accentContrast: "255 255 255"
    });
    expect(getPaletteById("green")).toMatchObject({
      swatch: "#4AFFA0",
      accent: "10 122 66",
      accentStrong: "10 92 51",
      accentSoft: "74 255 160",
      accentContrast: "255 255 255"
    });
    expect(getPaletteById("colorless")).toMatchObject({
      swatch: "#71717A",
      accent: "82 82 91",
      accentStrong: "39 39 42",
      accentSoft: "228 228 231",
      accentContrast: "255 255 255"
    });
  });

  it("aligns each refreshed WUBRG swatch with its accentSoft channel triple", () => {
    for (const id of ["white", "blue", "black", "red", "green"]) {
      const palette = getPaletteById(id)!;
      expect(hexToChannelTriple(palette.swatch)).toBe(palette.accentSoft);
    }
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

    it("applies an already-readable custom hex unchanged (REQ-099: a readable pick is applied unchanged)", () => {
      // #E2E8F0 (today's primary-text colour) already clears every floor against the
      // ground, so the lift is a no-op and the exact pick is kept.
      const resolved = resolveColorlessPalette("#e2e8f0");
      expect(resolved.accent).toBe("226 232 240");
      expect(resolved.accentStrong).toBe("226 232 240");
      expect(resolved.accentSoft).toBe("226 232 240");
    });

    it("lifts a low-contrast custom hex to the REQ-099/REQ-200 readability floors while keeping its hue", () => {
      // #3B2A1E is a near-black brown: readable as picked only after a lift.
      const resolved = resolveColorlessPalette("#3b2a1e");
      const ground = resolved.ground;

      // Hue kept: never a warning, rejection, or a different hue — only lightness moves.
      expect(resolved.swatch).toBe("#3b2a1e");

      // REQ-099: accent text / decorative dust reach at least 7:1 against the ground.
      expect(paletteContrastRatio(resolved.accentSoft, ground)).toBeGreaterThanOrEqual(7);
      // REQ-099: filled controls reach at least 2.4:1 against the ground.
      expect(paletteContrastRatio(resolved.accent, ground)).toBeGreaterThanOrEqual(2.4);
      expect(paletteContrastRatio(resolved.accentStrong, ground)).toBeGreaterThanOrEqual(2.4);
      // REQ-099: text on a filled control is white or near-black, whichever reads.
      expect(["255 255 255", "9 9 11"]).toContain(resolved.accentContrast);
    });

    it("persists the exact custom RGB as `swatch` even after the lift (REQ-099: the stored value is the exact pick)", () => {
      const resolved = resolveColorlessPalette("#3b2a1e");
      expect(resolved.swatch).toBe("#3b2a1e");
    });
  });
});
});
