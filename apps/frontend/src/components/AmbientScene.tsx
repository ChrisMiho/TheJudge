import type { Palette } from "../lib/theme/palettes";

export type AmbientSceneProps = {
  /** The active profile's motif id (REQ-201); selects which element shapes render. */
  motif: Palette["motif"];
  /**
   * "page" (default): the full-strength scene behind every page. "tray": the
   * Menu tray's own whisper-strength copy, playing at a lower density/opacity
   * over a pool of the colour's light fading in at its foot (REQ-207).
   */
  variant?: "page" | "tray";
};

const MOTIF_LABEL: Record<Palette["motif"], string> = {
  beams: "White",
  runes: "Blue",
  fog: "Black",
  embers: "Red",
  leaves: "Green",
  geometry: "Colorless"
};

/**
 * REQ-207 / REQ-201: a slow, faint, CSS-only scene of the chosen colour's
 * element behind every page — two drifting haze sheets, a field of glowing
 * dust, the colour's badge large/blurred/faint in the centre, and the
 * colour's element (White beams, Blue runes, Black fog, Red embers, Green
 * leaves, Colorless turning geometry). Density and opacity are each one
 * number (`--ambient-density`, `--ambient-opacity`) so the whole scene can be
 * tuned without redrawing it. Decorative only: `aria-hidden`, no meaning, no
 * interactive element, `pointer-events: none` throughout. CSS transform/
 * opacity animation only (NFR-006) — no canvas, no animation library, no
 * script-driven loop; `prefers-reduced-motion: reduce` stops every layer
 * (index.css's shared reduced-motion block).
 */
export function AmbientScene({ motif, variant = "page" }: AmbientSceneProps): JSX.Element {
  return (
    <div
      aria-hidden="true"
      data-testid="ambient-scene"
      data-motif={motif}
      data-variant={variant}
      className={`ambient-scene ambient-scene-${variant} ambient-scene-motif-${motif}`}
    >
      <div className="ambient-scene-layer ambient-scene-haze ambient-scene-haze-a" />
      <div className="ambient-scene-layer ambient-scene-haze ambient-scene-haze-b" />
      <div className="ambient-scene-layer ambient-scene-dust" />
      <div className="ambient-scene-layer ambient-scene-badge" aria-label={`${MOTIF_LABEL[motif]} badge`} />
      <div className={`ambient-scene-layer ambient-scene-element ambient-scene-element-${motif}`} />
    </div>
  );
}
