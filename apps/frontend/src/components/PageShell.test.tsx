import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageShell } from "./PageShell";

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
});
});
