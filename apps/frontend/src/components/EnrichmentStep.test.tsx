import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameContext, ZoneCardItem } from "../types";
import { EnrichmentStep } from "./EnrichmentStep";

afterEach(cleanup);

const card1: ZoneCardItem = {
  instanceId: "inst-1",
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

const card2: ZoneCardItem = {
  instanceId: "inst-2",
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
  playerCount: 2,
  players: [
    { label: "Player 1", lifeTotal: 20 },
    { label: "Player 2", lifeTotal: 20 }
  ],
  turnPhase: "main_1",
  activePlayer: "Player 1",
  selectedZones: ["stack"]
};

function renderEnrichmentWithDuplicates(onZonesChange = vi.fn()): ReturnType<typeof userEvent.setup> {
  const user = userEvent.setup();
  render(
    <EnrichmentStep
      gameContext={gameContext}
      zones={{ stack: [card1, card2] }}
      onZonesChange={onZonesChange}
      activePlayers={["Player 1", "Player 2"]}
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
    />
  );
  return user;
}

describe("EnrichmentStep per-instance identity (Slice C)", () => {
  it("removing one duplicate card calls onZonesChange with only the other remaining", async () => {
    const onZonesChange = vi.fn();
    const user = renderEnrichmentWithDuplicates(onZonesChange);

    await user.click(screen.getByRole("button", { name: "View all cards" }));

    const removeButtons = screen.getAllByRole("button", { name: "Remove Opt" });
    expect(removeButtons).toHaveLength(2);

    await user.click(removeButtons[0]);

    expect(onZonesChange).toHaveBeenCalledWith({ stack: [card2] });
  });

  it("removing the second duplicate leaves the first intact", async () => {
    const onZonesChange = vi.fn();
    const user = renderEnrichmentWithDuplicates(onZonesChange);

    await user.click(screen.getByRole("button", { name: "View all cards" }));

    const removeButtons = screen.getAllByRole("button", { name: "Remove Opt" });
    await user.click(removeButtons[1]);

    expect(onZonesChange).toHaveBeenCalledWith({ stack: [card1] });
  });

  it("editing contextNotes on one duplicate does not affect the other", async () => {
    const onZonesChange = vi.fn();
    const user = renderEnrichmentWithDuplicates(onZonesChange);

    await user.click(screen.getByRole("button", { name: "View all cards" }));

    const notesTextareas = screen.getAllByLabelText("Context notes for Opt");
    expect(notesTextareas).toHaveLength(2);

    await user.type(notesTextareas[0], "a");

    const lastCallZones = onZonesChange.mock.calls[onZonesChange.mock.calls.length - 1][0] as {
      stack: ZoneCardItem[];
    };
    expect(lastCallZones.stack[0].instanceId).toBe("inst-1");
    expect(lastCallZones.stack[0].contextNotes).toBeTruthy();
    expect(lastCallZones.stack[1].instanceId).toBe("inst-2");
    expect(lastCallZones.stack[1].contextNotes).toBeUndefined();
  });

  it("pending-target kind state is tracked independently per duplicate row", async () => {
    const user = renderEnrichmentWithDuplicates();

    await user.click(screen.getByRole("button", { name: "View all cards" }));

    const targetKindSelects = screen.getAllByLabelText("Target kind for Opt");
    expect(targetKindSelects).toHaveLength(2);

    await user.selectOptions(targetKindSelects[0], "none");

    expect(targetKindSelects[1]).toHaveValue("player");
  });
});
