import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { DestinationOutlet } from "../DestinationOutlet";
import type { DestinationId, PortalDestination } from "../../../lib/portal/types";
import { PlayerLifeTrackerApp } from "./PlayerLifeTrackerApp";

function createMemoryStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => Array.from(entries.keys())[index] ?? null,
    removeItem: (key) => {
      entries.delete(key);
    },
    setItem: (key, value) => {
      entries.set(key, String(value));
    }
  };
}

function trackerCards(): HTMLElement[] {
  return screen.getAllByTestId(/^life-card-Player /);
}

async function openGameSetup(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Show game setup" }));
}

function DestinationHarness(): JSX.Element {
  const [activeDestinationId, setActiveDestinationId] = useState<DestinationId>("player-life-tracker");
  const destinations: PortalDestination[] = [
    { id: "player-life-tracker", label: "Life Tracker", render: () => <PlayerLifeTrackerApp /> },
    { id: "other", label: "Other", render: () => <div>Other destination</div> }
  ];

  return (
    <>
      <button type="button" onClick={() => setActiveDestinationId("other")}>
        Go elsewhere
      </button>
      <button type="button" onClick={() => setActiveDestinationId("player-life-tracker")}>
        Return to tracker
      </button>
      <DestinationOutlet destinations={destinations} activeDestinationId={activeDestinationId} />
    </>
  );
}

describe("Frontend - Shared", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("PlayerLifeTrackerApp", () => {
    it("renders portal chrome, setup, and the shared roster editor without life inputs", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Player Life Tracker" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Game setup" })).not.toBeInTheDocument();

      await openGameSetup(user);
      expect(screen.getByRole("heading", { name: "Game setup" })).toBeInTheDocument();
      expect(screen.getByText("4 players")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Remove last player" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Add player" })).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Show player details" }));
      const playerOneName = screen.getByLabelText("Player 1 display name");
      expect(screen.queryByLabelText("Player 1 life total")).not.toBeInTheDocument();

      await user.clear(playerOneName);
      await user.type(playerOneName, "Alice");
      expect(screen.getByText("Player 1 (Alice)")).toBeInTheDocument();
    });

    it("supports every player count from two through eight", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);
      await openGameSetup(user);

      await user.click(screen.getByRole("button", { name: "Set player count to 2" }));
      expect(trackerCards()).toHaveLength(2);

      for (let count = 3; count <= 8; count += 1) {
        await user.click(screen.getByRole("button", { name: `Set player count to ${count}` }));
        expect(trackerCards()).toHaveLength(count);
      }

      expect(screen.getByRole("button", { name: "Set player count to 8" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });

    it("applies the four-player seat contract literally to every fixed label", () => {
      render(<PlayerLifeTrackerApp />);

      const expected = [
        ["Player 1", "left", "seat-player-1", "1 / 2", "1 / 2", "rotate(90deg)"],
        ["Player 2", "left", "seat-player-2", "2 / 3", "1 / 2", "rotate(90deg)"],
        ["Player 3", "right", "seat-player-3", "1 / 2", "2 / 3", "rotate(270deg)"],
        ["Player 4", "right", "seat-player-4", "2 / 3", "2 / 3", "rotate(270deg)"]
      ] as const;

      for (const [label, side, gridArea, gridRow, gridColumn, transform] of expected) {
        const card = screen.getByTestId(`life-card-${label}`);
        expect(card).toHaveAttribute("data-side", side);
        expect(card).toHaveStyle({ gridArea, gridRow, gridColumn });
        expect(screen.getByTestId(`life-card-content-${label}`)).toHaveStyle({ transform });
      }
    });

    it("switches the life table to an unrotated single-column list", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);
      await openGameSetup(user);

      await user.click(screen.getByRole("button", { name: "Use list layout" }));

      expect(screen.getByTestId("life-tracker-table")).toHaveStyle({
        gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
        gridTemplateRows: "repeat(4, minmax(15rem, 1fr))"
      });
      for (const [index, card] of trackerCards().entries()) {
        expect(card).toHaveAttribute("data-side", "bottom");
        expect(card).toHaveStyle({
          gridRow: `${index + 1} / ${index + 2}`,
          gridColumn: "1 / 2"
        });
        expect(screen.getByTestId(`life-card-content-Player ${index + 1}`)).toHaveStyle({
          transform: "rotate(0deg)"
        });
      }
    });

    it("changes only the selected player's life and applies starting life to the full table", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);

      await user.click(screen.getByRole("button", { name: "Increase life for Player 2" }));

      expect(within(screen.getByTestId("life-card-Player 1")).getByText("40")).toBeInTheDocument();
      expect(within(screen.getByTestId("life-card-Player 2")).getByText("41")).toBeInTheDocument();

      await openGameSetup(user);
      await user.click(screen.getByRole("button", { name: "Set starting life to 20" }));
      for (const card of trackerCards()) {
        expect(within(card).getByText("20")).toBeInTheDocument();
      }
    });

    it("preserves live values while switching away and back without a reload", async () => {
      const user = userEvent.setup();
      render(<DestinationHarness />);

      await user.click(screen.getByRole("button", { name: "Increase life for Player 1" }));
      await user.click(screen.getByRole("button", { name: "Go elsewhere" }));
      expect(screen.getByText("Other destination")).toBeVisible();

      await user.click(screen.getByRole("button", { name: "Return to tracker" }));
      expect(within(screen.getByTestId("life-card-Player 1")).getByText("41")).toBeInTheDocument();
    });

    it("hydrates the latest life values after a remount", async () => {
      const user = userEvent.setup();
      const firstMount = render(<PlayerLifeTrackerApp />);

      await user.click(screen.getByRole("button", { name: "Decrease life for Player 1" }));
      firstMount.unmount();
      render(<PlayerLifeTrackerApp />);

      expect(within(screen.getByTestId("life-card-Player 1")).getByText("39")).toBeInTheDocument();
    });

    it("wires Reset and New Game through the tracker's cleanup behavior", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);
      await openGameSetup(user);

      await user.click(screen.getByRole("button", { name: "Decrease life for Player 1" }));
      expect(localStorage.length).toBe(1);
      await user.click(screen.getByRole("button", { name: "Reset current game" }));
      expect(within(screen.getByTestId("life-card-Player 1")).getByText("40")).toBeInTheDocument();
      expect(localStorage.length).toBe(0);

      await user.click(screen.getByRole("button", { name: "Set player count to 3" }));
      await user.click(screen.getByRole("button", { name: "Start new game" }));
      expect(trackerCards()).toHaveLength(4);
      expect(localStorage.length).toBe(0);
    });

    it("exposes the selected player through the counter-opening app boundary", async () => {
      const user = userEvent.setup();
      const onOpenCounters = vi.fn();
      render(<PlayerLifeTrackerApp onOpenCounters={onOpenCounters} />);

      await user.click(screen.getByRole("button", { name: "Open counters for Player 3" }));

      expect(onOpenCounters).toHaveBeenCalledOnce();
      expect(onOpenCounters).toHaveBeenCalledWith("Player 3");
    });

    it("opens the selected player's counter dialog and clamps decrements at zero", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);

      await user.click(screen.getByRole("button", { name: "Open counters for Player 2" }));
      expect(screen.getByRole("dialog", { name: "Counters for Player 2" })).toBeInTheDocument();
      await user.click(screen.getByRole("tab", { name: "Counters" }));
      await user.click(screen.getByRole("button", { name: "Options for Poison" }));
      await user.click(screen.getByRole("button", { name: "Decrease Poison" }));

      expect(screen.getByRole("button", { name: "Increment Poison" })).toHaveTextContent("0");
    });

    it("links only positive commander damage to life when the game setting is enabled", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);

      await user.click(screen.getByRole("button", { name: "Open counters for Player 1" }));
      await user.click(screen.getByRole("button", { name: "Increment Commander damage from Player 2" }));
      await user.click(screen.getByRole("button", { name: "Close counters" }));
      expect(within(screen.getByTestId("life-card-Player 1")).getByText("40")).toBeInTheDocument();

      await openGameSetup(user);
      await user.click(screen.getByRole("checkbox", { name: "Commander damage also reduces life" }));
      await user.click(screen.getByRole("button", { name: "Open counters for Player 1" }));
      await user.click(screen.getByRole("button", { name: "Increment Commander damage from Player 2" }));
      await user.click(screen.getByRole("button", { name: "Increment Commander damage from Player 2" }));
      await user.click(screen.getByRole("tab", { name: "Counters" }));
      await user.click(screen.getByRole("button", { name: "Increment Poison" }));
      await user.click(screen.getByRole("button", { name: "Close counters" }));

      expect(within(screen.getByTestId("life-card-Player 1")).getByText("38")).toBeInTheDocument();
    });

    it("persists commander, named, custom, and setting values across reopen and remount", async () => {
      const user = userEvent.setup();
      const firstMount = render(<PlayerLifeTrackerApp />);
      await openGameSetup(user);

      await user.click(screen.getByRole("checkbox", { name: "Commander damage also reduces life" }));
      await user.click(screen.getByRole("button", { name: "Open counters for Player 1" }));
      await user.click(screen.getByRole("button", { name: "Increment Commander damage from Player 2" }));
      await user.click(screen.getByRole("tab", { name: "Counters" }));
      await user.click(screen.getByRole("button", { name: "Increment Poison" }));
      await user.type(screen.getByRole("textbox", { name: "Custom counter name" }), "Storm");
      await user.click(screen.getByRole("button", { name: "Add custom counter" }));
      await user.click(screen.getByRole("button", { name: "Increment Storm" }));
      await user.click(screen.getByRole("button", { name: "Close counters" }));

      await user.click(screen.getByRole("button", { name: "Open counters for Player 1" }));
      expect(screen.getByRole("button", { name: "Increment Commander damage from Player 2" })).toHaveTextContent("1");
      await user.click(screen.getByRole("tab", { name: "Counters" }));
      expect(screen.getByRole("button", { name: "Increment Poison" })).toHaveTextContent("1");
      expect(screen.getByRole("button", { name: "Increment Storm" })).toHaveTextContent("1");
      await user.click(screen.getByRole("button", { name: "Close counters" }));

      firstMount.unmount();
      render(<PlayerLifeTrackerApp />);
      await openGameSetup(user);
      expect(screen.getByRole("checkbox", { name: "Commander damage also reduces life" })).toBeChecked();
      await user.click(screen.getByRole("button", { name: "Open counters for Player 1" }));
      expect(screen.getByRole("button", { name: "Increment Commander damage from Player 2" })).toHaveTextContent("1");
      await user.click(screen.getByRole("tab", { name: "Counters" }));
      expect(screen.getByRole("button", { name: "Increment Poison" })).toHaveTextContent("1");
      expect(screen.getByRole("button", { name: "Increment Storm" })).toHaveTextContent("1");
    });
  });
});
