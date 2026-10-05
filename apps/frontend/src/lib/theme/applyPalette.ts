import { getPaletteById, type Palette } from "./palettes";

const customVarNames = ["--accent", "--accent-strong", "--accent-soft", "--accent-contrast", "--wash-tint", "--focus-ring"] as const;

function triplet(channels: string): string {
  const hex = channels
    .split(" ")
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("");
  return `#${hex}`;
}

/**
 * REQ-219: the browser tab follows the active profile. Sets the mobile browser
 * bar tint (`theme-color`) to the profile accent, derived from the palette (the
 * one token source, REQ-216), creating the meta when absent. Never duplicates it.
 */
function syncTabChrome(palette: Palette): void {
  const accent = triplet(palette.accent);
  let meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta === null) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = accent;
}

/**
 * Selects the active profile on the document root. The six profiles' values
 * live in `styles/tokens.css` under `[data-profile="<id>"]` (REQ-216: one token
 * source), so a built-in profile only sets the attribute and clears any custom
 * Colorless override. A custom Colorless colour (REQ-099) is derived by
 * `resolveColorlessPalette` and written as inline overrides of the same
 * variables, the way the mockup's `applyCustom` does, plus `data-accent` so the
 * ambient scene restarts on the new colour. Touches document-root styling only.
 */
export function applyPalette(palette: Palette): void {
  const root = document.documentElement;
  root.dataset.theme = palette.id;
  root.dataset.themeMotif = palette.motif;
  root.setAttribute("data-profile", palette.id);
  syncTabChrome(palette);
  const base = getPaletteById(palette.id);
  const custom = base !== undefined && palette.swatch !== base.swatch;
  if (!custom) {
    for (const name of customVarNames) root.style.removeProperty(name);
    root.removeAttribute("data-accent");
    return;
  }
  const accent = triplet(palette.accent);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-strong", triplet(palette.accentStrong));
  root.style.setProperty("--accent-soft", triplet(palette.accentSoft));
  root.style.setProperty("--accent-contrast", triplet(palette.accentContrast));
  root.style.setProperty("--wash-tint", `color-mix(in srgb, ${accent} 16%, #0c0c0d)`);
  root.style.setProperty("--focus-ring", triplet(palette.accentSoft));
  root.setAttribute("data-accent", palette.swatch);
}
