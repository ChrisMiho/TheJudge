import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageShell } from "./PageShell";
import { StagedStepHeader } from "./StagedStepHeader";

afterEach(cleanup);

vi.mock("../lib/env", () => ({
  get isMockProvider() {
    return mockProviderValue;
  }
}));

let mockProviderValue = false;

afterEach(() => {
  mockProviderValue = false;
});

describe("Frontend - MTG Assistant", () => {
describe("PageShell (slice L look-matching pass)", () => {
  it("wraps standard children in .page-content, not the old bordered .page-card", () => {
    const { container } = render(
      <PageShell>
        <p>content</p>
      </PageShell>
    );

    expect(container.querySelector(".page-card")).toBeNull();
    expect(container.querySelector(".page-content")).not.toBeNull();
    expect(screen.getByText("content").closest(".page-content")).not.toBeNull();
  });

  it("renders the ambient scene behind the content for every variant", () => {
    render(
      <PageShell>
        <p>content</p>
      </PageShell>
    );
    expect(screen.getByTestId("ambient-scene")).toBeInTheDocument();
  });

  it("renders the full-bleed wrapper for the full-bleed variant, with no .page-content", () => {
    const { container } = render(
      <PageShell variant="full-bleed">
        <p>table</p>
      </PageShell>
    );

    expect(container.querySelector(".page-shell-bleed")).not.toBeNull();
    expect(container.querySelector(".page-content")).toBeNull();
  });

  it("renders the mock-mode banner itself only for the full-bleed variant — StagedStepHeader owns it for standard destinations", () => {
    mockProviderValue = true;

    const { container: standardContainer } = render(
      <PageShell>
        <p>content</p>
      </PageShell>
    );
    expect(standardContainer.querySelector(".mock-mode-banner")).toBeNull();

    const { container: bleedContainer } = render(
      <PageShell variant="full-bleed">
        <p>table</p>
      </PageShell>
    );
    expect(bleedContainer.querySelector(".mock-mode-banner")).not.toBeNull();
  });

  it("renders the header and the mock-mode strip in the shell's header slot at the top edge, before the column and outside its padding (REQ-207)", () => {
    mockProviderValue = true;

    const { container } = render(
      <PageShell>
        <StagedStepHeader />
        <p>content</p>
      </PageShell>
    );

    const shell = container.querySelector(".page-shell") as HTMLElement;
    const slot = shell.querySelector(".page-shell-header") as HTMLElement;
    const column = shell.querySelector(".page-content") as HTMLElement;
    expect(slot.querySelector(".app-header")).not.toBeNull();
    expect(slot.querySelector(".mock-mode-banner")).not.toBeNull();
    expect(column.querySelector(".app-header")).toBeNull();
    // the mockup's DOM order: scene, header slot, column
    expect(Array.from(shell.children).map((child) => child.className)).toEqual(["ambience", "page-shell-header", "page-content"]);
  });

  it("gives the shell no page padding of its own so the header can sit at y=0", () => {
    const { container } = render(
      <PageShell>
        <p>content</p>
      </PageShell>
    );

    expect(container.querySelector(".page-shell")?.className).not.toMatch(/\bp[xy]?-/);
  });
});
});
