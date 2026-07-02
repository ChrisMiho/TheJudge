import type { ReactNode } from "react";
import { isMockProvider } from "../lib/env";
import { MockModeBanner } from "./MockModeBanner";

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps): JSX.Element {
  return (
    <main className="page-shell" data-mock-banner={isMockProvider ? "true" : undefined}>
      <MockModeBanner />
      <section className="page-card">{children}</section>
    </main>
  );
}
