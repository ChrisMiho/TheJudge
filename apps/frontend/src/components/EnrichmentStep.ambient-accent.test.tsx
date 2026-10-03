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
  it("marks only the card sheet current while a card is being edited", () => {
    renderEnrichment();

    expect(cardSurface()).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");
    expect(cardSurface()).toHaveAttribute("data-accent-current", "true");
    expect(document.querySelector(".enrichment-question-surface")).toBeNull();
  });

  it("marks the review and question submission current once every card is reviewed", async () => {
    const user = renderEnrichment();

    await user.click(screen.getByRole("button", { name: "OK — finish context" }));

    expect(cardSurface()).toHaveAttribute("data-accent-current", "false");
    expect(questionSurface()).toHaveAttribute("data-accent-current", "true");
    const questionComposer = questionSurface().querySelector(".ambient-accent-surface");
    expect(questionComposer).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");
  });

  it("Skip to review also leaves the card sheet resting and the question current", async () => {
    const user = renderEnrichment();

    await user.click(screen.getByRole("button", { name: "Skip to review" }));

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
    // Look-matching pass (slice N, review 1 fix — finding 3), requirement 10: the
    // trigger is now the mockup's small "◈ View context" chip in the chat-head's
    // own tools row, not the full-width ambient-accent panel — the same
    // icon-chip shape QuickLookupApp's own "Edit cards" chip already uses.
    const contextTrigger = screen.getByRole("button", { name: /View context:/ });
    expect(contextTrigger).toHaveClass("icon-chip");
    await user.click(contextTrigger);
    expect(screen.getByRole("dialog", { name: "Frozen game context" })).toHaveClass(
      "ambient-accent-surface"
    );
    expect(screen.getByRole("dialog", { name: "Frozen game context" })).toHaveAttribute(
      "data-accent-current",
      "true"
    );

    // Look-matching pass (slice M, review 1 fix — finding 4): the follow-up box is
    // ComposerPill's `.q-box` now, not a `<form>` of its own.
    const composer = screen.getByPlaceholderText("Ask a follow-up…").closest('[data-testid="composer-pill"]');
    expect(composer).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");
    expect(composer).toHaveAttribute("data-accent-current", "false");
    expect(screen.getByText("Initial answer").closest(".conversation-thread")).not.toHaveClass(
      "ambient-accent-surface"
    );
    // Look-matching pass (slice N): Start Over is the chat-head's round ↺ now.
    expect(screen.getByRole("button", { name: "Start over — clears everything" })).not.toHaveClass(
      "ambient-accent-surface"
    );
  });
});
});
