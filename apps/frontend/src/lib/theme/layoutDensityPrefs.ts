import { DEFAULT_LAYOUT_DENSITY, isValidLayoutDensity, type LayoutDensity } from "./layoutDensity";

const storageKey = "thejudge.theme.layoutDensity";

export function loadLayoutDensity(): LayoutDensity {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored !== null && isValidLayoutDensity(stored) ? stored : DEFAULT_LAYOUT_DENSITY;
  } catch {
    return DEFAULT_LAYOUT_DENSITY;
  }
}

export function saveLayoutDensity(density: LayoutDensity): void {
  try {
    localStorage.setItem(storageKey, density);
  } catch {
    // Density preference persistence must never interfere with the app's core flow.
  }
}
