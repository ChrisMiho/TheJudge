export interface Palette {
  id: string;
  name: string;
  /** Hex preview color shown on the swatch control. */
  swatch: string;
  /** "R G B" channel triples consumed via `rgb(var(--accent-token) / <alpha-value>)`. */
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentContrast: string;
}

export const DEFAULT_PALETTE_ID = "blue";

const WHITE_CONTRAST = "255 255 255";

/**
 * Ordered, named palette list. Six globally shared Magic-inspired profiles in
 * WUBRGC order; `blue` remains the app default.
 */
export const PALETTES: Palette[] = [
  {
    id: "white",
    name: "White",
    swatch: "#F4D35E",
    accent: "243 230 179",
    accentStrong: "198 161 91",
    accentSoft: "255 224 102",
    accentContrast: "9 9 11"
  },
  {
    id: "blue",
    name: "Blue",
    swatch: "#0EA5E9",
    accent: "3 105 161",
    accentStrong: "29 78 216",
    accentSoft: "56 189 248",
    accentContrast: WHITE_CONTRAST
  },
  {
    id: "black",
    name: "Black",
    swatch: "#A855F7",
    accent: "107 79 112",
    accentStrong: "36 31 41",
    accentSoft: "216 180 254",
    accentContrast: WHITE_CONTRAST
  },
  {
    id: "red",
    name: "Red",
    swatch: "#EF4444",
    accent: "185 28 28",
    accentStrong: "127 29 29",
    accentSoft: "255 107 107",
    accentContrast: WHITE_CONTRAST
  },
  {
    id: "green",
    name: "Green",
    swatch: "#22C55E",
    accent: "21 128 61",
    accentStrong: "20 83 45",
    accentSoft: "74 222 128",
    accentContrast: WHITE_CONTRAST
  },
  {
    id: "colorless",
    name: "Colorless",
    swatch: "#71717A",
    accent: "82 82 91",
    accentStrong: "39 39 42",
    accentSoft: "228 228 231",
    accentContrast: WHITE_CONTRAST
  }
];

const palettesById = new Map(PALETTES.map((palette) => [palette.id, palette]));

export function getPaletteById(id: string): Palette | undefined {
  return palettesById.get(id);
}

export function isValidPaletteId(id: string): boolean {
  return palettesById.has(id);
}

export const DEFAULT_PALETTE = palettesById.get(DEFAULT_PALETTE_ID) as Palette;

export const COLORLESS_PALETTE = palettesById.get("colorless") as Palette;

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Strictly recognizes a complete six-digit `#rrggbb` hex value. */
export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

/** Converts a strict six-digit hex value to the "R G B" channel-triple representation. */
export function hexToChannelTriple(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

/**
 * Resolves the Colorless profile: a custom hex applies unchanged to `accent`,
 * `accentStrong`, and `accentSoft` while `accentContrast` stays white. A
 * missing or invalid custom value falls back to the fixed Colorless palette.
 */
export function resolveColorlessPalette(customHex?: string | null): Palette {
  if (customHex === null || customHex === undefined || !isValidHexColor(customHex)) {
    return COLORLESS_PALETTE;
  }

  const channelTriple = hexToChannelTriple(customHex);
  return {
    ...COLORLESS_PALETTE,
    swatch: customHex,
    accent: channelTriple,
    accentStrong: channelTriple,
    accentSoft: channelTriple,
    accentContrast: WHITE_CONTRAST
  };
}
