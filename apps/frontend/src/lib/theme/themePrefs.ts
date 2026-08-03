import { DEFAULT_PALETTE_ID, isValidHexColor, isValidPaletteId } from "./palettes";

const themePaletteIdStorageKey = "thejudge.theme.paletteId";
const themeColorlessCustomRgbStorageKey = "thejudge.theme.colorlessCustomRgb";

export function loadThemePaletteId(): string {
  try {
    const stored = localStorage.getItem(themePaletteIdStorageKey);
    if (stored === null) {
      return DEFAULT_PALETTE_ID;
    }
    if (isValidPaletteId(stored)) {
      return stored;
    }
    try {
      localStorage.removeItem(themePaletteIdStorageKey);
    } catch {
      // Best-effort cleanup only; the caller already falls back to the default.
    }
    return DEFAULT_PALETTE_ID;
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

export function loadColorlessCustomRgb(): string | undefined {
  try {
    const stored = localStorage.getItem(themeColorlessCustomRgbStorageKey);
    if (stored === null) {
      return undefined;
    }
    if (isValidHexColor(stored)) {
      return stored;
    }
    try {
      localStorage.removeItem(themeColorlessCustomRgbStorageKey);
    } catch {
      // Best-effort cleanup only; the caller already falls back to no custom value.
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function saveColorlessCustomRgb(hex: string): void {
  try {
    localStorage.setItem(themeColorlessCustomRgbStorageKey, hex);
  } catch {
    // Theme preference persistence must never interfere with the app's core flow.
  }
}

export function removeColorlessCustomRgb(): void {
  try {
    localStorage.removeItem(themeColorlessCustomRgbStorageKey);
  } catch {
    // Theme preference persistence must never interfere with the app's core flow.
  }
}
