export type LayoutDensity = "chunky" | "slim";

export const DEFAULT_LAYOUT_DENSITY: LayoutDensity = "slim";

const VALID_DENSITIES: ReadonlySet<string> = new Set(["chunky", "slim"]);

export function isValidLayoutDensity(value: string): value is LayoutDensity {
  return VALID_DENSITIES.has(value);
}
