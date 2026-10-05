import { MOTIF_SYMBOLS } from "./motifSymbols";
import type { Palette } from "./palettes";

/**
 * REQ-219: the browser-tab icon. Wraps the active profile's motif (read-only
 * reuse of `MOTIF_SYMBOLS`, REQ-201) in a 100x100 SVG on a dark rounded badge,
 * draws it in the accent the caller passes (the helper holds no profile colour,
 * REQ-216), and returns an inline `data:image/svg+xml` URI: no fetch, no CDN.
 */
const BADGE_FILL = "rgb(9,9,11)";

export function buildFaviconHref(motif: Palette["motif"], accentHex: string): string {
  const art = MOTIF_SYMBOLS[motif].split("currentColor").join(accentHex);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">` +
    `<rect width="100" height="100" rx="22" fill="${BADGE_FILL}"/>${art}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
