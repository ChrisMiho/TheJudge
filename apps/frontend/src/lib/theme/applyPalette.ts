import type { Palette } from "./palettes";

const accentVarNames = {
  accent: "--accent",
  accentStrong: "--accent-strong",
  accentSoft: "--accent-soft",
  accentContrast: "--accent-contrast"
} as const;

/**
 * Sets the active palette's `data-theme` attribute and accent CSS variables
 * on the document root. Touches document-root styling only — never reads or
 * mutates flow/scan/conversation state.
 */
export function applyPalette(palette: Palette): void {
  const root = document.documentElement;
  root.dataset.theme = palette.id;
  root.style.setProperty(accentVarNames.accent, palette.accent);
  root.style.setProperty(accentVarNames.accentStrong, palette.accentStrong);
  root.style.setProperty(accentVarNames.accentSoft, palette.accentSoft);
  root.style.setProperty(accentVarNames.accentContrast, palette.accentContrast);
}
