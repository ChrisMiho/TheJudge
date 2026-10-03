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
  /**
   * REQ-200 surface roles (ground/wash/panel/panel-edge/focus-ring), named without
   * reference to dark/light so a light theme is additive later. Dark values only
   * in this pass. The ground never goes fully black (REQ-200: stays at or above
   * the measured `#09090B` luminance) and neutral ground/panel fills stay the
   * visual majority of every screen — the profile colour reads as a faint wash,
   * never a dominant fill.
   */
  ground: string;
  groundWash: string;
  panel: string;
  panelEdge: string;
  focusRing: string;
  /** REQ-201 motif language id, selects the AmbientScene's per-profile element art. */
  motif: "beams" | "runes" | "fog" | "embers" | "leaves" | "geometry";
}

export const DEFAULT_PALETTE_ID = "blue";

const WHITE_CONTRAST = "255 255 255";

/**
 * REQ-200: the ground never goes fully black — stays at or above the measured
 * `#09090B` luminance floor. Shared across every profile; the profile colour
 * reads only as a faint wash (`groundWash`), edges, rings and accents on top
 * of it, never as a dominant fill.
 */
const GROUND = "9 9 11";
/** Measured `#18181B` panel fill — the primary-text-on-panel contrast floor (14.37:1 with `#E2E8F0`). */
const PANEL = "24 24 27";
const PANEL_EDGE = "63 63 70";

/**
 * Ordered, named palette list. Six globally shared Magic-inspired profiles in
 * WUBRGC order; `blue` remains the app default.
 */
export const PALETTES: Palette[] = [
  {
    id: "white",
    name: "White",
    swatch: "#FAF8F2",
    accent: "237 231 214",
    accentStrong: "176 163 130",
    accentSoft: "250 248 242",
    accentContrast: "9 9 11",
    ground: GROUND,
    groundWash: "237 231 214",
    panel: PANEL,
    panelEdge: PANEL_EDGE,
    focusRing: "250 248 242",
    motif: "beams"
  },
  {
    id: "blue",
    name: "Blue",
    swatch: "#38E1FF",
    accent: "0 80 216",
    accentStrong: "30 58 156",
    accentSoft: "56 225 255",
    accentContrast: WHITE_CONTRAST,
    ground: GROUND,
    groundWash: "0 80 216",
    panel: PANEL,
    panelEdge: PANEL_EDGE,
    focusRing: "56 225 255",
    motif: "runes"
  },
  {
    id: "black",
    name: "Black",
    swatch: "#C77DFF",
    accent: "124 58 237",
    accentStrong: "46 26 71",
    accentSoft: "199 125 255",
    accentContrast: WHITE_CONTRAST,
    ground: GROUND,
    groundWash: "124 58 237",
    panel: PANEL,
    panelEdge: PANEL_EDGE,
    focusRing: "199 125 255",
    motif: "fog"
  },
  {
    id: "red",
    name: "Red",
    swatch: "#FF4D6D",
    accent: "193 2 48",
    accentStrong: "122 4 36",
    accentSoft: "255 77 109",
    accentContrast: WHITE_CONTRAST,
    ground: GROUND,
    groundWash: "193 2 48",
    panel: PANEL,
    panelEdge: PANEL_EDGE,
    focusRing: "255 77 109",
    motif: "embers"
  },
  {
    id: "green",
    name: "Green",
    swatch: "#4AFFA0",
    accent: "10 122 66",
    accentStrong: "10 92 51",
    accentSoft: "74 255 160",
    accentContrast: WHITE_CONTRAST,
    ground: GROUND,
    groundWash: "10 122 66",
    panel: PANEL,
    panelEdge: PANEL_EDGE,
    focusRing: "74 255 160",
    motif: "leaves"
  },
  {
    id: "colorless",
    name: "Colorless",
    swatch: "#71717A",
    accent: "82 82 91",
    accentStrong: "39 39 42",
    accentSoft: "228 228 231",
    accentContrast: WHITE_CONTRAST,
    ground: GROUND,
    groundWash: "82 82 91",
    panel: PANEL,
    panelEdge: PANEL_EDGE,
    focusRing: "228 228 231",
    motif: "geometry"
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

function channelTripleToRgb(triple: string): [number, number, number] {
  const [r, g, b] = triple.split(" ").map((part) => Number(part));
  return [r, g, b];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) {
    return [0, 0, l];
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }
  return [h * 60, s, l];
}

function hueToRgbChannel(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hn = h / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hueToRgbChannel(p, q, hn + 1 / 3) * 255),
    Math.round(hueToRgbChannel(p, q, hn) * 255),
    Math.round(hueToRgbChannel(p, q, hn - 1 / 3) * 255)
  ];
}

function srgbChannelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of an "R G B" channel triple. */
function relativeLuminance(triple: string): number {
  const [r, g, b] = channelTripleToRgb(triple);
  return 0.2126 * srgbChannelToLinear(r) + 0.7152 * srgbChannelToLinear(g) + 0.0722 * srgbChannelToLinear(b);
}

/** WCAG contrast ratio between two "R G B" channel triples. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * REQ-099 / REQ-200: lifts a custom Colorless hex's lightness (hue and
 * saturation kept) in HSL space until its contrast against `against` meets
 * `minRatio`, binary-searching toward white or black depending on which half
 * of the lightness range is darker/lighter than the background. Never
 * returns a ratio worse than the input's own, so an already-readable pick is
 * returned unchanged in substance (a fixed rule, not a generated contrast
 * engine — REQ-099's note).
 */
function liftToContrastFloor(triple: string, against: string, minRatio: number): string {
  if (contrastRatio(triple, against) >= minRatio) {
    return triple;
  }
  const [r, g, b] = channelTripleToRgb(triple);
  const [h, s] = rgbToHsl(r, g, b);
  const backgroundIsDark = relativeLuminance(against) < 0.5;
  // Against a dark background, lightening the colour raises contrast; against a
  // light background, darkening it does. This app ships dark values only
  // (REQ-200 note), so the ground is always dark in practice, but the search
  // stays correct either way.
  let lo = backgroundIsDark ? rgbToHsl(r, g, b)[2] : 0;
  let hi = backgroundIsDark ? 1 : rgbToHsl(r, g, b)[2];
  let best = triple;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    const [mr, mg, mb] = hslToRgb(h, s, mid);
    const candidate = `${mr} ${mg} ${mb}`;
    const ratio = contrastRatio(candidate, against);
    if (ratio >= minRatio) {
      best = candidate;
      if (backgroundIsDark) {
        hi = mid;
      } else {
        lo = mid;
      }
    } else if (backgroundIsDark) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return best;
}

/** REQ-200: 7:1 for accent text and decorative dust against the ground. */
const COLORLESS_ACCENT_TEXT_FLOOR = 7;
/** REQ-200: 2.4:1 for a filled control against the ground. */
const COLORLESS_FILLED_CONTROL_FLOOR = 2.4;

/**
 * Resolves the Colorless profile: a custom hex keeps its hue everywhere, lifted
 * only where it would fail the REQ-099/REQ-200 readability floors — accent text
 * and decorative dust (`accentSoft`) to at least 7:1 against the ground,
 * filled controls (`accent`, `accentStrong`) to at least 2.4:1 against the
 * ground, and the text that sits on a filled control (`accentContrast`)
 * switched to white or near-black, whichever reads — never a warning or a
 * rejection. A missing or invalid custom value falls back to the fixed
 * Colorless palette.
 */
export function resolveColorlessPalette(customHex?: string | null): Palette {
  if (customHex === null || customHex === undefined || !isValidHexColor(customHex)) {
    return COLORLESS_PALETTE;
  }

  const channelTriple = hexToChannelTriple(customHex);
  const ground = COLORLESS_PALETTE.ground;
  const liftedAccentSoft = liftToContrastFloor(channelTriple, ground, COLORLESS_ACCENT_TEXT_FLOOR);
  const liftedAccent = liftToContrastFloor(channelTriple, ground, COLORLESS_FILLED_CONTROL_FLOOR);
  const liftedAccentStrong = liftToContrastFloor(channelTriple, ground, COLORLESS_FILLED_CONTROL_FLOOR);
  const NEAR_BLACK = "9 9 11";
  const accentContrast =
    contrastRatio(WHITE_CONTRAST, liftedAccent) >= contrastRatio(NEAR_BLACK, liftedAccent)
      ? WHITE_CONTRAST
      : NEAR_BLACK;

  return {
    ...COLORLESS_PALETTE,
    swatch: customHex,
    accent: liftedAccent,
    accentStrong: liftedAccentStrong,
    accentSoft: liftedAccentSoft,
    accentContrast,
    groundWash: channelTriple
  };
}
