import { DEFAULT_LAYOUT_DENSITY, isValidLayoutDensity, type LayoutDensity } from "./layoutDensity";

const storageKey = "thejudge.theme.layoutDensity";

export function loadLayoutDensity(): LayoutDensity {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return DEFAULT_LAYOUT_DENSITY;
    const stored = storage.getItem(storageKey);
    return stored !== null && isValidLayoutDensity(stored) ? stored : DEFAULT_LAYOUT_DENSITY;
  } catch {
    return DEFAULT_LAYOUT_DENSITY;
  }
}

export function saveLayoutDensity(density: LayoutDensity): void {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return;
    storage.setItem(storageKey, density);
  } catch {
    // Density preference persistence must never interfere with the app's core flow.
  }
}
