import type { ReactNode } from "react";
import { isMockProvider } from "../lib/env";
import { MockModeBanner } from "./MockModeBanner";

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
  return (
    <main className="page-shell" data-mock-banner={isMockProvider ? "true" : undefined}>
      <MockModeBanner />
      {variant === "full-bleed" ? (
        children
      ) : (
        <section className="page-card">{children}</section>
      )}
    </main>
  );
}
