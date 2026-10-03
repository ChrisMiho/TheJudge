import type { CSSProperties } from "react";

/**
 * The two custom properties the ported `flow.css` reads from the element itself: a ring card's
 * signed distance from the front card (`--d`, `--ad` its magnitude) and a question box's fill
 * of its 300-character budget (`--fill`, 0 to 100). Token-layer helpers so a component never
 * declares a custom property of its own (REQ-216).
 */
export function ringPlacementStyle(distance: number): CSSProperties {
  return { "--d": distance, "--ad": Math.abs(distance) } as CSSProperties;
}

export function budgetFillStyle(percent: number): CSSProperties {
  return { "--fill": percent.toFixed(1) } as CSSProperties;
}
