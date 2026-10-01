import type { Palette } from "./palettes";

const accentVarNames = {
  accent: "--accent",
  accentStrong: "--accent-strong",
  accentSoft: "--accent-soft",
  accentContrast: "--accent-contrast",
  ground: "--ground",
  groundWash: "--ground-wash",
  panel: "--panel",
  panelEdge: "--panel-edge",
  focusRing: "--focus-ring"
} as const;

/**
 * Sets the active palette's `data-theme` attribute and REQ-200 token-set CSS
 * variables on the document root. Touches document-root styling only — never
 * reads or mutates flow/scan/conversation state. `data-theme` also selects
 * which AmbientScene motif (REQ-201) renders, via `palette.motif` read by the
 * scene component rather than a second attribute.
 */
export function applyPalette(palette: Palette): void {
  const root = document.documentElement;
  root.dataset.theme = palette.id;
  root.dataset.themeMotif = palette.motif;
  root.style.setProperty(accentVarNames.accent, palette.accent);
  root.style.setProperty(accentVarNames.accentStrong, palette.accentStrong);
  root.style.setProperty(accentVarNames.accentSoft, palette.accentSoft);
  root.style.setProperty(accentVarNames.accentContrast, palette.accentContrast);
  root.style.setProperty(accentVarNames.ground, palette.ground);
  root.style.setProperty(accentVarNames.groundWash, palette.groundWash);
  root.style.setProperty(accentVarNames.panel, palette.panel);
  root.style.setProperty(accentVarNames.panelEdge, palette.panelEdge);
  root.style.setProperty(accentVarNames.focusRing, palette.focusRing);
}
