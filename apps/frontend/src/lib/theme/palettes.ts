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

/**
 * Ordered, named palette list. `blue` mirrors the app's existing hardcoded
 * sky/blue accent treatment, so it is a visual no-op against today's UI.
 */
export const PALETTES: Palette[] = [
  {
    id: "blue",
    name: "Blue",
    swatch: "#0ea5e9",
    accent: "14 165 233",
    accentStrong: "37 99 235",
    accentSoft: "125 211 252",
    accentContrast: "255 255 255"
  },
  {
    id: "violet",
    name: "Violet",
    swatch: "#8b5cf6",
    accent: "139 92 246",
    accentStrong: "124 58 237",
    accentSoft: "196 181 253",
    accentContrast: "255 255 255"
  },
  {
    id: "emerald",
    name: "Emerald",
    swatch: "#10b981",
    accent: "16 185 129",
    accentStrong: "5 150 105",
    accentSoft: "110 231 183",
    accentContrast: "255 255 255"
  },
  {
    id: "amber",
    name: "Amber",
    swatch: "#f59e0b",
    accent: "245 158 11",
    accentStrong: "217 119 6",
    accentSoft: "252 211 77",
    accentContrast: "2 6 23"
  },
  {
    id: "rose",
    name: "Rose",
    swatch: "#f43f5e",
    accent: "244 63 94",
    accentStrong: "225 29 72",
    accentSoft: "253 164 175",
    accentContrast: "255 255 255"
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
