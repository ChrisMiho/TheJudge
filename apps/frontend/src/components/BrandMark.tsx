export type BrandMarkProps = {
  onClick?: () => void;
};

/**
 * `inline-block` keeps the gradient's `to right` stops mapped onto the glyph run itself —
 * a block-level element (the header's `1fr` grid column) would stretch the background box
 * far past the text, diluting the gradient down to a near-flat single hue.
 */
const BRAND_CLASSES =
  "staged-step-brand inline-block bg-gradient-to-r from-accent-soft to-accent-strong bg-clip-text font-bold tracking-tight text-transparent";

export function BrandMark({ onClick }: BrandMarkProps): JSX.Element {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`motion-hover motion-press motion-focus ${BRAND_CLASSES}`}
      >
        TheJudge
      </button>
    );
  }

  return <h1 className={BRAND_CLASSES}>TheJudge</h1>;
}
