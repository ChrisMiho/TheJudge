import { forwardRef } from "react";

export interface OverlayCloseButtonProps {
  /** Full accessible name for this adopter's close control, e.g. "Close conversation history". */
  label: string;
  onClick: () => void;
  className?: string;
}

/**
 * The overlay family's one theme-derived close control (DEC-159/REQ-142). Color comes from
 * the active palette's accent tokens (index.css `--accent*`, set by applyPalette.ts) rather
 * than hardcoded zinc chrome, so it stays legible and visibly changes across all six fixed
 * palettes. Every adopter supplies its own accessible name and keeps the 44x44px hit area.
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
          "motion-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-zinc-900/60 text-lg font-semibold leading-none text-accent-soft transition hover:border-accent/70 hover:bg-accent/15",
          className
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span aria-hidden="true">×</span>
      </button>
    );
  }
);
