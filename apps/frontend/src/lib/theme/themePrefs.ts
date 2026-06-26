import { DEFAULT_PALETTE_ID, isValidPaletteId } from "./palettes";

const themePaletteIdStorageKey = "thejudge.theme.paletteId";

export function loadThemePaletteId(): string {
  try {
    const stored = localStorage.getItem(themePaletteIdStorageKey);
    return stored !== null && isValidPaletteId(stored) ? stored : DEFAULT_PALETTE_ID;
  } catch {
    return DEFAULT_PALETTE_ID;
  }
}

export function saveThemePaletteId(id: string): void {
  try {
    localStorage.setItem(themePaletteIdStorageKey, id);
  } catch {
    // Theme preference persistence must never interfere with the app's core flow.
  }
}
