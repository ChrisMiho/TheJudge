import type { ReactNode } from "react";
import { useActiveThemeMotif } from "../hooks/useActiveThemeMotif";
import { AmbientScene } from "./AmbientScene";
import { MockModeBanner } from "./MockModeBanner";
import { ShellBounds } from "./portal/ShellBounds";

type PageShellProps = {
  children: ReactNode;
  /**
   * "standard" (default) wraps children in the width-capped `.page-content`
   * column (look-matching pass, slice L: no more bordered `.page-card`
   * frame). "full-bleed" keeps the `.page-shell` background/ambient-scene
   * chrome but lets the caller's content use the full viewport width (e.g. a
   * live tabletop life-table view). "narrow" (look-matching pass, slice M):
   * the same width-capped column, pinned to the mockup's 36rem content cap
   * instead of the suite's default 48rem — `quick-question.html:17` and
   * `in-depth-question.html:14` both override `.page-content` this way;
   * Ask a Question (slice M) and In-depth details (slice N) are the two
   * destinations that opt in. "wide-fit" (look-matching pass, slice O): a
   * wider column (`trade-balancer.html`'s own `56rem` override, wider than
   * the suite's `48rem` default) that fits the viewport instead of scrolling
   * — `.page-shell-fit` gives `<main>` a flex column exactly `100dvh` tall so
   * `.page-content-wide-fit` (a flex child) gets the exact remainder below
   * the header/banner with no JS measurement, and only Trade Balancer's own
   * scrolling entry lists move. Trade Balancer (slice O) is its one adopter.
   * "narrow-fit" (look-matching pass, slice P): the same `100dvh` fit
   * behaviour at the "narrow" 36rem width instead of "wide-fit"'s 56rem —
   * the scanner (`card-scan.html`'s own `.page-content` override is also
   * 36rem) needs the fit without the wider column. Ask a Question's scan
   * state (slice P) is its one adopter, swapping in only while scanning;
   * its own non-scanning state keeps plain "narrow" (that state already
   * scrolls by design, e.g. with General rules topics open).
   */
  variant?: "standard" | "full-bleed" | "narrow" | "wide-fit" | "narrow-fit";
};

export function PageShell({ children, variant = "standard" }: PageShellProps): JSX.Element {
  const motif = useActiveThemeMotif();

  return (
    <main className={variant === "wide-fit" || variant === "narrow-fit" ? "page-shell page-shell-fit" : "page-shell"}>
      {/* REQ-207: the chosen colour's ambient scene plays behind every page, behind
          solid panels (`.page-content` / `.page-shell-bleed`'s own content), decorative
          only. One instance per PageShell keeps it inside this destination's own
          React tree rather than a single app-wide instance, so Life Tracker's
          full-bleed shell and every standard `.page-content` destination each get
          their own copy with no shared DOM node to coordinate — look-matching pass
          (slice L) makes its rendered layer a fixed viewport box (`.ambient-scene`
          in index.css), not a box scoped to this component's own markup, so this
          per-PageShell instancing is about ownership/lifecycle, not paint position. */}
      <AmbientScene motif={motif} />
      {/* Look-matching pass (slice L): standard destinations no longer render the
          banner here — it moved into `StagedStepHeader`, directly under
          `.app-header`, matching the mockup's header-then-strip body order
          (`shared-chrome-menu.html`). Life Tracker's full-bleed variant has no
          `StagedStepHeader`, so this is the one remaining call site for it —
          same `isMockProvider` gate, unchanged visibility. */}
      {variant === "full-bleed" ? (
        <div className="page-shell-bleed">
          <MockModeBanner />
          {children}
          <ShellBounds />
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
          <ShellBounds />
        </div>
      )}
    </main>
  );
}
