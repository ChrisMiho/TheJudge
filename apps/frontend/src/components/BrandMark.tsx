import { useActiveThemeMotif } from "../hooks/useActiveThemeMotif";
import { MotifGlyph } from "./portal/ThemeSection";

export type BrandMarkProps = {
  onClick?: () => void;
};

/**
 * Look-matching pass (slice L): the brand mark grows a breathing orb and an
 * uppercase tagline below the wordmark (`shell.css:216-259`), replacing the
 * previous gradient-text-only mark. The mockup's orb paints a motif *image*
 * (`var(--motif)`, `motifs/<colour>.svg`) this codebase has no asset file
 * for — `AmbientScene`'s own REQ-201 motif rendering is CSS-only (no image
 * assets at all), so the orb reuses that same approach: `MotifGlyph`, the
 * suite's one simple-shape-per-profile SVG (already drawn for the Theme
 * band), centred on an accent-gradient disc instead of an image. The orb
 * reads the active profile's motif via `useActiveThemeMotif` directly rather
 * than a threaded prop, so every mount (the header, the Menu tray's own
 * brand row, the feedback success state) shows the current colour with no
 * plumbing.
 */
export function BrandMark({ onClick }: BrandMarkProps): JSX.Element {
  const motif = useActiveThemeMotif();

  const inner = (
    <span className="brand-mark">
      <span aria-hidden="true" className="orb">
        <MotifGlyph motif={motif} />
      </span>
      <span className="brand-text">
        <span className="wordmark">TheJudge</span>
        {/* aria-hidden: decorative restatement of the mark's own tagline, not
            part of its accessible name — every caller that queries this
            control/heading by the exact name "TheJudge" (many `App.*.test.tsx`
            files) must keep resolving to that name alone. */}
        <span aria-hidden="true" className="tagline">MTG Assistant</span>
      </span>
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="staged-step-brand motion-hover motion-press motion-focus inline-block"
      >
        {inner}
      </button>
    );
  }

  return <h1 className="staged-step-brand inline-block">{inner}</h1>;
}
