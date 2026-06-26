import type { LayoutDensity } from "./layoutDensity";

export function applyLayoutDensity(density: LayoutDensity): void {
  document.documentElement.dataset.layoutDensity = density;
}
