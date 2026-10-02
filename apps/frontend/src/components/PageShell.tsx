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
   * live tabletop life-table view).
   */
  variant?: "standard" | "full-bleed";
};

export function PageShell({ children, variant = "standard" }: PageShellProps): JSX.Element {
  const motif = useActiveThemeMotif();

  return (
    <main className="page-shell">
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
        <div className="page-content">
          {children}
          <ShellBounds />
        </div>
      )}
    </main>
  );
}
