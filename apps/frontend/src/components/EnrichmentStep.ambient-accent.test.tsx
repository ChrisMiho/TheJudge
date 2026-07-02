import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameContext, ZoneCardItem } from "../types";
import { EnrichmentStep } from "./EnrichmentStep";

afterEach(cleanup);

const card: ZoneCardItem = {
  cardId: "opt",
  name: "Opt",
  oracleText: "Scry 1, then draw a card.",
  imageUrl: "",
  manaCost: "{U}",
  manaValue: 1,
  typeLine: "Instant",
  colors: ["U"],
  supertypes: [],
  subtypes: []
};

const gameContext: GameContext = {
  playerCount: 1,
  players: [{ label: "Player 1", lifeTotal: 20 }],
  turnPhase: "main_1",
  activePlayer: "Player 1",
  selectedZones: ["stack"]
};

function renderEnrichment(
  overrides: Partial<Parameters<typeof EnrichmentStep>[0]> = {}
): void {
  render(
    <EnrichmentStep
      gameContext={gameContext}
      zones={{ stack: [card] }}
      onZonesChange={vi.fn()}
      activePlayers={["Player 1"]}
      question=""
      onQuestionChange={vi.fn()}
      onDecryptStack={vi.fn()}
      onBack={vi.fn()}
      canDecrypt
      isSubmitting={false}
      answer={null}
      error={null}
      canRetry
      retryCountdown={0}
      onRetry={vi.fn()}
      statusMessage={null}
      isConversationActive={false}
      isFollowUpSubmitting={false}
      visibleMessages={[]}
      frozenGameContext={null}
      onFollowUp={vi.fn()}
      onStartOver={vi.fn()}
      {...overrides}
    />
  );
}

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

describe("EnrichmentStep ambient accent surfaces", () => {
  it("marks only card enrichment current while the wizard is editing", () => {
    renderEnrichment();

    expect(cardSurface()).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");
    expect(cardSurface()).toHaveAttribute("data-accent-current", "true");
    expect(document.querySelector(".enrichment-question-surface")).toBeNull();
  });

  it("marks card enrichment and question submission current in list mode", async () => {
    const user = userEvent.setup();
    renderEnrichment();

    const viewModeControl = screen.getByRole("button", { name: "View all cards" });
    expect(viewModeControl).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");

    await user.click(viewModeControl);

    expect(cardSurface()).toHaveAttribute("data-accent-current", "true");
    expect(questionSurface()).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");
    expect(questionSurface()).toHaveAttribute("data-accent-current", "true");
  });

  it("leaves card enrichment resting and marks question submission current after wizard completion", async () => {
    const user = userEvent.setup();
    renderEnrichment();

    await user.click(screen.getByRole("button", { name: "OK — finish enrichment" }));

    expect(cardSurface()).toHaveAttribute("data-accent-current", "false");
    expect(questionSurface()).toHaveAttribute("data-accent-current", "true");
  });

  it("opts only the complete follow-up composer into a resting interactive surface", () => {
    renderEnrichment({
      isConversationActive: true,
      answer: "Initial answer",
      visibleMessages: [{ role: "assistant", content: "Initial answer" }]
    });

    const composer = screen.getByPlaceholderText("Ask a follow-up…").closest("form");
    expect(composer).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");
    expect(composer).toHaveAttribute("data-accent-current", "false");
    expect(screen.getByText("Initial answer").closest(".ambient-accent-surface")).toBeNull();
    expect(screen.getByRole("button", { name: "Start Over" })).not.toHaveClass(
      "ambient-accent-surface"
    );
  });
});
