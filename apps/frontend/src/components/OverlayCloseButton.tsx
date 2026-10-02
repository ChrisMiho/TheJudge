import { forwardRef } from "react";

export interface OverlayCloseButtonProps {
  /** Full accessible name for this adopter's close control, e.g. "Close conversation history". */
  label: string;
  onClick: () => void;
  className?: string;
}

/**
 * The overlay family's one close control (DEC-159/REQ-142). Color still comes
 * from the active palette's accent tokens (index.css `--accent*`, set by
 * applyPalette.ts) — REQ-142 wins over the mockup's plain white ✕ on zinc
 * glass, per `DESIGN-BRIEF.md`'s "the requirement wins on behaviour" rule,
 * since the mockup's flat colourless glyph would retire REQ-142's per-palette
 * legibility test. The look-matching pass (slice L) ports only the mockup's
 * silhouette: `rounded-lg` (a rounded square, `shell.css`'s `.overlay-close`)
 * in place of the previous full circle. Every adopter supplies its own
 * accessible name and keeps the 44x44px hit area.
 */
export const OverlayCloseButton = forwardRef<HTMLButtonElement, OverlayCloseButtonProps>(
  function OverlayCloseButton({ label, onClick, className }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        onClick={onClick}
        className={[
          "motion-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/40 bg-zinc-900/60 text-lg font-semibold leading-none text-accent-soft transition hover:border-accent/70 hover:bg-accent/15",
          className
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span aria-hidden="true">✕</span>
      </button>
    );
  }
);
