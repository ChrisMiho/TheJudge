import type { ReactNode } from "react";
import { isMockProvider } from "../lib/env";
import { useActiveThemeMotif } from "../hooks/useActiveThemeMotif";
import { AmbientScene } from "./AmbientScene";
import { MockModeBanner } from "./MockModeBanner";
import { ShellBounds } from "./portal/ShellBounds";

type PageShellProps = {
  children: ReactNode;
  /**
   * "standard" (default) wraps children in the bordered, width-capped `.page-card`.
   * "full-bleed" keeps the `.page-shell` background/mock-banner chrome but lets the
   * caller's content use the full viewport width (e.g. a live tabletop life-table view).
   */
  variant?: "standard" | "full-bleed";
};

export function PageShell({ children, variant = "standard" }: PageShellProps): JSX.Element {
  const motif = useActiveThemeMotif();

  return (
    <main className="page-shell" data-mock-banner={isMockProvider ? "true" : undefined}>
      {/* REQ-207: the chosen colour's ambient scene plays behind every page, behind
          solid panels (`.page-card` / `.page-shell-bleed`'s own content), decorative
          only. One instance per PageShell keeps it inside this destination's own
          stacking context rather than a single app-wide layer, so Life Tracker's
          full-bleed shell and every standard `.page-card` destination each get their
          own copy with no shared DOM node to coordinate. */}
      <AmbientScene motif={motif} />
      <MockModeBanner />
      {variant === "full-bleed" ? (
        <div className="page-shell-bleed">
          {children}
          <ShellBounds />
        </div>
      ) : (
        <section className="page-card">
          {children}
          <ShellBounds />
        </section>
      )}
    </main>
  );
}
