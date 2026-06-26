import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps): JSX.Element {
  return (
    <main className="page-shell">
      <section className="page-card">{children}</section>
    </main>
  );
}
