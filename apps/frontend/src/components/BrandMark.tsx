import { useActiveThemeMotif } from "../hooks/useActiveThemeMotif";

export type BrandMarkProps = {
  onClick?: () => void;
  /** The Menu tray's own copy of the mark: a plain, aria-hidden `<span>`, no heading. */
  decorative?: boolean;
};

/**
 * REQ-201 / REQ-207: the brand mark — a breathing orb painted with the active
 * colour's motif (`--motif`, from the token layer), the wordmark, and the
 * tagline. Rendered in the mockup's own shape (`.brand-mark` > `.orb`,
 * `.brand-text` > `.wordmark` + `.tagline`) so the ported shell stylesheet
 * applies unchanged. The header's mark is a `<h1>` heading, or a `<button>`
 * when a caller passes `onClick`; the Menu tray's own copy is decorative.
 */
export function BrandMark({ onClick, decorative = false }: BrandMarkProps): JSX.Element {
  // Subscribes to the profile so the mark re-renders with the Theme band.
  useActiveThemeMotif();

  const inner = (
    <>
      <span aria-hidden="true" className="orb" />
      <span className="brand-text">
        <span className="wordmark">TheJudge</span>
        {/* aria-hidden: decorative restatement of the mark's own tagline, not
            part of its accessible name — every caller that queries this
            control/heading by the exact name "TheJudge" (many `App.*.test.tsx`
            files) must keep resolving to that name alone. */}
        <span aria-hidden="true" className="tagline">
          MTG Assistant
        </span>
      </span>
    </>
  );

  if (decorative) {
    return (
      <span aria-hidden="true" className="brand-mark">
        {inner}
      </span>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="brand-mark motion-press">
        {inner}
      </button>
    );
  }

  return <h1 className="brand-mark">{inner}</h1>;
}
