import { useState } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlayerRosterEditor, type RosterPlayer } from "./PlayerRosterEditor";
import type { PlayerLabel } from "../types";

afterEach(cleanup);

const PLAYER_LABELS: PlayerLabel[] = [
  "Player 1",
  "Player 2",
  "Player 3",
  "Player 4",
  "Player 5",
  "Player 6",
  "Player 7",
  "Player 8"
];

function buildPlayers(count: number): RosterPlayer[] {
  return PLAYER_LABELS.slice(0, count).map((label) => ({ label, displayName: label, lifeTotal: "20" }));
}

function EditorHarness({
  initialExpanded = false,
  initialSecondaryExpanded = false,
  initialCount = 2,
  showLifeTotals,
  onLifeTotalChange,
  renderPlayerExtras
}: {
  initialExpanded?: boolean;
  initialSecondaryExpanded?: boolean;
  initialCount?: number;
  showLifeTotals?: boolean;
  onLifeTotalChange?: (player: PlayerLabel, value: string) => void;
  renderPlayerExtras?: (player: RosterPlayer) => JSX.Element;
}): JSX.Element {
  const [playerCount, setPlayerCount] = useState(initialCount);
  const [players, setPlayers] = useState(buildPlayers(initialCount));
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [secondaryDetailsExpanded, setSecondaryDetailsExpanded] = useState(initialSecondaryExpanded);

  function updateDisplayName(player: PlayerLabel, value: string): void {
    setPlayers((current) => current.map((p) => (p.label === player ? { ...p, displayName: value } : p)));
  }

  function addPlayer(): void {
    setPlayerCount((current) => {
      const next = Math.min(current + 1, 8);
      setPlayers(buildPlayers(next));
      return next;
    });
  }

  function removePlayer(): void {
    setPlayerCount((current) => {
      const next = Math.max(current - 1, 2);
      setPlayers(buildPlayers(next));
      return next;
    });
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
      secondaryDetailsExpanded={secondaryDetailsExpanded}
      onToggleSecondaryDetails={() => setSecondaryDetailsExpanded((current) => !current)}
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

  it("renders renderPlayerExtras output inside each player's row once secondary details are expanded", () => {
    render(
      <EditorHarness
        initialExpanded
        initialSecondaryExpanded
        renderPlayerExtras={(player) => <span data-testid={`extra-${player.label}`}>Extra for {player.label}</span>}
      />
    );

    const player1Row = screen.getByLabelText("Player 1 display name").closest("div");
    expect(player1Row).not.toBeNull();
    expect(within(player1Row?.parentElement as HTMLElement).getByTestId("extra-Player 1")).toBeInTheDocument();

    const player2Row = screen.getByLabelText("Player 2 display name").closest("div");
    expect(player2Row).not.toBeNull();
    expect(within(player2Row?.parentElement as HTMLElement).getByTestId("extra-Player 2")).toBeInTheDocument();
  });

  it("renders no extras when renderPlayerExtras is not provided", () => {
    render(<EditorHarness initialExpanded />);

    expect(screen.queryByTestId(/extra-/)).not.toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("keeps name and life visible with no nested arrow or extras when renderPlayerExtras is absent", () => {
    render(<EditorHarness initialExpanded />);

    expect(screen.getByLabelText("Player 1 display name")).toBeInTheDocument();
    expect(screen.getByLabelText("Player 1 life total")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /secondary details for all players/i })
    ).not.toBeInTheDocument();
  });

  it("shows compact name/life for every active player with extras absent when secondary details are collapsed", () => {
    render(
      <EditorHarness
        initialExpanded
        renderPlayerExtras={(player) => <span data-testid={`extra-${player.label}`}>Extra for {player.label}</span>}
      />
    );

    expect(screen.getByLabelText("Player 1 display name")).toBeInTheDocument();
    expect(screen.getByLabelText("Player 2 display name")).toBeInTheDocument();
    expect(screen.queryByTestId(/extra-/)).not.toBeInTheDocument();

    const arrows = screen.getAllByRole("button", { name: /secondary details for all players/i });
    expect(arrows).toHaveLength(2);
    for (const arrow of arrows) {
      expect(arrow).toHaveAttribute("aria-expanded", "false");
      expect(arrow.className).toContain("min-h-[2.75rem]");
      expect(arrow.className).toContain("min-w-[2.75rem]");
      expect(arrow).toHaveAccessibleName("Show secondary details for all players");
    }
  });

  it("expands every card from Player 1's arrow and collapses every card from Player 2's arrow with no mixed state", async () => {
    const user = userEvent.setup();
    render(
      <EditorHarness
        initialExpanded
        renderPlayerExtras={(player) => <span data-testid={`extra-${player.label}`}>Extra for {player.label}</span>}
      />
    );

    const [arrow1, arrow2] = screen.getAllByRole("button", { name: /secondary details for all players/i });

    await user.click(arrow1);

    const expandedArrows = screen.getAllByRole("button", { name: /secondary details for all players/i });
    expect(expandedArrows).toHaveLength(2);
    for (const arrow of expandedArrows) {
      expect(arrow).toHaveAttribute("aria-expanded", "true");
      expect(arrow).toHaveAccessibleName("Hide secondary details for all players");
    }
    expect(screen.getByTestId("extra-Player 1")).toBeInTheDocument();
    expect(screen.getByTestId("extra-Player 2")).toBeInTheDocument();

    await user.click(arrow2);

    const collapsedArrows = screen.getAllByRole("button", { name: /secondary details for all players/i });
    for (const arrow of collapsedArrows) {
      expect(arrow).toHaveAttribute("aria-expanded", "false");
    }
    expect(screen.queryByTestId(/extra-/)).not.toBeInTheDocument();
  });

  it("keeps an added active player following the shared expanded state", async () => {
    const user = userEvent.setup();
    render(
      <EditorHarness
        initialExpanded
        initialSecondaryExpanded
        renderPlayerExtras={(player) => <span data-testid={`extra-${player.label}`}>Extra for {player.label}</span>}
      />
    );

    expect(screen.queryByTestId("extra-Player 3")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add player" }));

    expect(screen.getByText("3 players")).toBeInTheDocument();
    expect(screen.getByTestId("extra-Player 3")).toBeInTheDocument();
    expect(screen.getByTestId("extra-Player 1")).toBeInTheDocument();
  });

  it("keeps remaining cards expanded after removal and retains 2-8 bounds", async () => {
    const user = userEvent.setup();
    render(
      <EditorHarness
        initialExpanded
        initialSecondaryExpanded
        initialCount={3}
        renderPlayerExtras={(player) => <span data-testid={`extra-${player.label}`}>Extra for {player.label}</span>}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove last player" }));

    expect(screen.getByText("2 players")).toBeInTheDocument();
    expect(screen.getByTestId("extra-Player 1")).toBeInTheDocument();
    expect(screen.getByTestId("extra-Player 2")).toBeInTheDocument();
    expect(screen.queryByTestId("extra-Player 3")).not.toBeInTheDocument();

    const removeButton = screen.getByRole("button", { name: "Remove last player" });
    expect(removeButton).toBeDisabled();
  });
});
});
