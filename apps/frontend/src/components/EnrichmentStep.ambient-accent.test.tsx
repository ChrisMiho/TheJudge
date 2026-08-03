import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderEnrichment, singlePlayerGameContext } from "../test/enrichmentStep";

afterEach(cleanup);

function cardSurface(): HTMLElement {
  const surface = document.querySelector<HTMLElement>(".enrichment-card-surface");
  expect(surface).not.toBeNull();
  return surface!;
}

function questionSurface(): HTMLElement {
  const surface = document.querySelector<HTMLElement>(".enrichment-question-surface");
  expect(surface).not.toBeNull();
  return surface!;
}

describe("Frontend - Theme", () => {
describe("Ambient accent surfaces", () => {
  it("marks only card enrichment current while the wizard is editing", () => {
    renderEnrichment();

    expect(cardSurface()).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");
    expect(cardSurface()).toHaveAttribute("data-accent-current", "true");
    expect(document.querySelector(".enrichment-question-surface")).toBeNull();
  });

  it("marks card enrichment and question submission current in list mode", async () => {
    const user = renderEnrichment();

    const viewModeControl = screen.getByRole("button", { name: "View all cards" });
    expect(viewModeControl).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");

    await user.click(viewModeControl);

    expect(cardSurface()).toHaveAttribute("data-accent-current", "true");
    expect(questionSurface()).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");
    expect(questionSurface()).toHaveAttribute("data-accent-current", "true");
  });

  it("leaves card enrichment resting and marks question submission current after wizard completion", async () => {
    const user = renderEnrichment();

    await user.click(screen.getByRole("button", { name: "OK — finish enrichment" }));

    expect(cardSurface()).toHaveAttribute("data-accent-current", "false");
    expect(questionSurface()).toHaveAttribute("data-accent-current", "true");
  });

  it("applies the answered-view inventory to context and the docked composer", async () => {
    const user = renderEnrichment({
      isConversationActive: true,
      answer: "Initial answer",
      visibleMessages: [{ role: "assistant", content: "Initial answer" }],
      frozenGameContext: singlePlayerGameContext
    });

    const workspace = screen.getByTestId("conversation-workspace");
    expect(workspace).toHaveClass("conversation-workspace");
    const contextTrigger = screen.getByRole("button", { name: /View context:/ });
    expect(contextTrigger).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");
    await user.click(contextTrigger);
    expect(screen.getByRole("dialog", { name: "Frozen game context" })).toHaveClass(
      "ambient-accent-surface"
    );
    expect(screen.getByRole("dialog", { name: "Frozen game context" })).toHaveAttribute(
      "data-accent-current",
      "true"
    );

    const composer = screen.getByPlaceholderText("Ask a follow-up…").closest("form");
    expect(composer).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");
    expect(composer).toHaveAttribute("data-accent-current", "false");
    expect(screen.getByText("Initial answer").closest(".conversation-thread")).not.toHaveClass(
      "ambient-accent-surface"
    );
    expect(screen.getByRole("button", { name: "Start Over" })).not.toHaveClass(
      "ambient-accent-surface"
    );
  });
});
});
