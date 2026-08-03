import { useState } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlayerRosterEditor, type RosterPlayer } from "./PlayerRosterEditor";
import type { PlayerLabel } from "../types";

afterEach(cleanup);

const TWO_PLAYERS: RosterPlayer[] = [
  { label: "Player 1", displayName: "Player 1", lifeTotal: "20" },
  { label: "Player 2", displayName: "Player 2", lifeTotal: "20" }
];

function EditorHarness({
  initialPlayers = TWO_PLAYERS,
  initialExpanded = false,
  initialCount = 2,
  showLifeTotals,
  onLifeTotalChange,
  renderPlayerExtras
}: {
  initialPlayers?: RosterPlayer[];
  initialExpanded?: boolean;
  initialCount?: number;
  showLifeTotals?: boolean;
  onLifeTotalChange?: (player: PlayerLabel, value: string) => void;
  renderPlayerExtras?: (player: RosterPlayer) => JSX.Element;
}): JSX.Element {
  const [players, setPlayers] = useState(initialPlayers);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [playerCount, setPlayerCount] = useState(initialCount);

  function updateDisplayName(player: PlayerLabel, value: string): void {
    setPlayers((current) => current.map((p) => (p.label === player ? { ...p, displayName: value } : p)));
  }

  function addPlayer(): void {
    setPlayerCount((current) => Math.min(current + 1, 8));
  }

  function removePlayer(): void {
    setPlayerCount((current) => Math.max(current - 1, 2));
  }

  return (
    <PlayerRosterEditor
      players={players}
      playerCount={playerCount}
      isExpanded={isExpanded}
      onToggleExpanded={() => setIsExpanded((current) => !current)}
      onAddPlayer={addPlayer}
      onRemovePlayer={removePlayer}
      onDisplayNameChange={updateDisplayName}
      onLifeTotalChange={onLifeTotalChange}
      showLifeTotals={showLifeTotals}
      renderPlayerExtras={renderPlayerExtras}
    />
  );
}

describe("Frontend - Shared", () => {
describe("PlayerRosterEditor", () => {
  it("starts collapsed and expands the per-player rows on toggle", async () => {
    const user = userEvent.setup();
    render(<EditorHarness />);

    expect(screen.getByRole("button", { name: "Show player details" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Player 1 display name")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show player details" }));

    expect(screen.getByRole("button", { name: "Hide player details" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Player 1 display name")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide player details" }));

    expect(screen.getByRole("button", { name: "Show player details" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Player 1 display name")).not.toBeInTheDocument();
  });

  it("orders the remove control before the add control and enforces 2-8 bounds", async () => {
    const user = userEvent.setup();
    render(<EditorHarness initialCount={2} />);

    const removeButton = screen.getByRole("button", { name: "Remove last player" });
    const addButton = screen.getByRole("button", { name: "Add player" });

    const buttons = screen.getAllByRole("button").filter((button) => button.textContent === "−" || button.textContent === "+");
    expect(buttons[0]).toBe(removeButton);
    expect(buttons[1]).toBe(addButton);

    expect(removeButton).toBeDisabled();
    expect(addButton).not.toBeDisabled();

    for (let i = 2; i < 8; i += 1) {
      await user.click(addButton);
    }

    expect(screen.getByText("8 players")).toBeInTheDocument();
    expect(addButton).toBeDisabled();
    expect(removeButton).not.toBeDisabled();
  });

  it("meets the 44x44 minimum touch target on the count controls", () => {
    render(<EditorHarness />);

    for (const name of ["Show player details", "Remove last player", "Add player"]) {
      const button = screen.getByRole("button", { name });
      expect(button.className).toContain("min-h-[2.75rem]");
      expect(button.className).toContain("min-w-[3.5rem]");
    }
  });

  it("invokes the display-name callback when a player's name is edited", async () => {
    const user = userEvent.setup();
    render(<EditorHarness initialExpanded />);

    const nameInput = screen.getByLabelText("Player 1 display name");
    await user.clear(nameInput);
    await user.type(nameInput, "Alice");

    expect(nameInput).toHaveValue("Alice");
  });

  it("invokes the optional life-total callback when provided", async () => {
    const user = userEvent.setup();
    const onLifeTotalChange = vi.fn();
    render(<EditorHarness initialExpanded onLifeTotalChange={onLifeTotalChange} />);

    const lifeInput = screen.getByLabelText("Player 1 life total");
    await user.type(lifeInput, "5");

    expect(onLifeTotalChange).toHaveBeenCalledWith("Player 1", "205");
  });

  it("does not throw when a life total is edited without an onLifeTotalChange callback", async () => {
    const user = userEvent.setup();
    render(<EditorHarness initialExpanded />);

    const lifeInput = screen.getByLabelText("Player 1 life total");
    await expect(user.type(lifeInput, "5")).resolves.not.toThrow();
  });

  it("hides life-total inputs when showLifeTotals is false", () => {
    render(<EditorHarness initialExpanded showLifeTotals={false} />);

    expect(screen.getByLabelText("Player 1 display name")).toBeInTheDocument();
    expect(screen.queryByLabelText("Player 1 life total")).not.toBeInTheDocument();
    expect(screen.queryByText("Life total")).not.toBeInTheDocument();
  });

  it("shows life-total inputs when showLifeTotals is true", () => {
    render(<EditorHarness initialExpanded showLifeTotals />);

    expect(screen.getByLabelText("Player 1 life total")).toBeInTheDocument();
    expect(screen.getByLabelText("Player 2 life total")).toBeInTheDocument();
  });

  it("renders renderPlayerExtras output inside each expanded player's row", () => {
    render(
      <EditorHarness
        initialExpanded
        renderPlayerExtras={(player) => <span data-testid={`extra-${player.label}`}>Extra for {player.label}</span>}
      />
    );

    const player1Row = screen.getByLabelText("Player 1 display name").closest("div");
    expect(player1Row).not.toBeNull();
    expect(within(player1Row as HTMLElement).getByTestId("extra-Player 1")).toBeInTheDocument();

    const player2Row = screen.getByLabelText("Player 2 display name").closest("div");
    expect(player2Row).not.toBeNull();
    expect(within(player2Row as HTMLElement).getByTestId("extra-Player 2")).toBeInTheDocument();
  });

  it("renders no extras when renderPlayerExtras is not provided", () => {
    render(<EditorHarness initialExpanded />);

    expect(screen.queryByTestId(/extra-/)).not.toBeInTheDocument();
  });
});
});
