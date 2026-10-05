import { useState, type CSSProperties, type ReactNode } from "react";
import { useActiveThemeMotif } from "../hooks/useActiveThemeMotif";
import { useVisualViewportHeight } from "../hooks/useVisualViewportHeight";
import { AmbientScene } from "./AmbientScene";
import { MockModeBanner } from "./MockModeBanner";
import { PageShellHeaderSlotContext } from "./pageShellContext";

type PageShellProps = {
  children: ReactNode;
  /**
   * "standard" (default) wraps children in the width-capped `.page-content`
   * column. "full-bleed" keeps the shell chrome but lets the caller's content
   * use the full viewport width (Life Tracker's live table). "narrow": the
   * same column at the mockup's 36rem cap (Ask a Question, In-depth details).
   * "wide-fit": a 56rem column that fits the viewport instead of scrolling
   * (Trade Balancer). "narrow-fit": the 36rem column with the same viewport
   * fit (the scanner, Ask a Question, the In-depth Enrichment station).
   */
  variant?: "standard" | "full-bleed" | "narrow" | "wide-fit" | "narrow-fit";
};

/**
 * REQ-207 / REQ-216: the page shell in the mockup's DOM order — the colour's
 * ambient scene (a fixed canvas behind everything), the header slot (the app
 * header and mock-mode strip render here, at the top edge of the page, never
 * inside the column's padding), then the `.page-content` column.
 */
export function PageShell({ children, variant = "standard" }: PageShellProps): JSX.Element {
  const motif = useActiveThemeMotif();
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  const visualViewportHeight = useVisualViewportHeight();
  // REQ-218: the 36rem fit frame resolves its height against the visual viewport so a growing
  // question box stays above the phone keyboard; `.page-shell-fit` falls back to `100dvh`.
  const fitStyle =
    variant === "narrow-fit" && visualViewportHeight !== null
      ? ({ "--visual-viewport-height": `${visualViewportHeight}px` } as CSSProperties)
      : undefined;

  return (
    <main
      className={variant === "wide-fit" || variant === "narrow-fit" ? "page-shell page-shell-fit" : "page-shell"}
      style={fitStyle}
    >
      <AmbientScene motif={motif} />
      <div ref={setHeaderSlot} className="page-shell-header" />
      <PageShellHeaderSlotContext.Provider value={headerSlot}>
        {variant === "full-bleed" ? (
          <div className="page-shell-bleed">
            <MockModeBanner />
            <div className="page-shell-bleed-content">{children}</div>
          </div>
        ) : (
          <div
            className={
              variant === "narrow"
                ? "page-content page-content-narrow"
                : variant === "wide-fit"
                  ? "page-content page-content-wide-fit"
                  : variant === "narrow-fit"
                    ? "page-content page-content-narrow page-content-narrow-fit"
                    : "page-content"
            }
          >
            {children}
          </div>
        )}
      </PageShellHeaderSlotContext.Provider>
    </main>
  );
}
