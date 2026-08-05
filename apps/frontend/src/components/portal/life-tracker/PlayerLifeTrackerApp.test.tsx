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
  await user.click(screen.getByRole("button", { name: "Open game setup" }));
  expect(screen.getByRole("dialog", { name: "Game Setup" })).toBeInTheDocument();
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
    it("renders portal chrome and lets names be edited from the Players section of Game Setup", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByText("TheJudge")).toBeInTheDocument();

      await openGameSetup(user);
      expect(screen.getByLabelText("Player count")).toBeInTheDocument();
      expect(screen.queryByLabelText("Player 1 display name")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Edit player names" }));
      const playerOneName = screen.getByLabelText("Player 1 display name");

      await user.clear(playerOneName);
      await user.type(playerOneName, "Alice");
      expect(screen.getByText("Player 1 (Alice)")).toBeInTheDocument();
    });

    it("wraps its full-bleed content in the shell-bounds pass-through wrapper (REQ-113)", () => {
      const { container } = render(<PlayerLifeTrackerApp />);

      const bleedWrapper = container.querySelector(".page-shell-bleed");
      expect(bleedWrapper).toBeInTheDocument();
      expect(bleedWrapper?.querySelector(".portal-shell-bounds")).toBeInTheDocument();
      // The full-bleed wrapper is a bare pass-through box — Life Tracker's own layout
      // (its inner flex column) is still the direct structural content, pixel-identical
      // to before this wrapper existed.
      expect(screen.getByTestId("life-tracker-table")).toBeInTheDocument();
    });

    it("opens and closes Game Setup from the header button", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);

      const openButton = screen.getByRole("button", { name: "Open game setup" });
      expect(openButton).toHaveAttribute("aria-haspopup", "dialog");
      expect(openButton).toHaveAttribute("aria-expanded", "false");

      await user.click(openButton);
      expect(openButton).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("dialog", { name: "Game Setup" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Close game setup" }));
      expect(screen.queryByRole("dialog", { name: "Game Setup" })).not.toBeInTheDocument();
      expect(openButton).toHaveAttribute("aria-expanded", "false");
    });

    it("closes the Game Setup dialog on Escape", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);
      await openGameSetup(user);

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog", { name: "Game Setup" })).not.toBeInTheDocument();
    });

    it("supports every player count from two through eight", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);
      await openGameSetup(user);

      const decreaseButton = screen.getByRole("button", { name: "Decrease player count" });
      const increaseButton = screen.getByRole("button", { name: "Increase player count" });

      // The default game starts at 4 players; step down to the minimum first.
      await user.click(decreaseButton);
      await user.click(decreaseButton);
      expect(trackerCards()).toHaveLength(2);
      expect(decreaseButton).toBeDisabled();

      for (let count = 3; count <= 8; count += 1) {
        await user.click(increaseButton);
        expect(trackerCards()).toHaveLength(count);
      }

      expect(increaseButton).toBeDisabled();
    });

    it("applies the four-player seat contract literally to every fixed label", () => {
      render(<PlayerLifeTrackerApp />);

      const expected = [
        ["Player 1", "left", "seat-player-1", "1 / 2", "1 / 2", "translate(-50%, -50%) rotate(90deg)"],
        ["Player 2", "left", "seat-player-2", "2 / 3", "1 / 2", "translate(-50%, -50%) rotate(90deg)"],
        ["Player 3", "right", "seat-player-3", "1 / 2", "2 / 3", "translate(-50%, -50%) rotate(270deg)"],
        ["Player 4", "right", "seat-player-4", "2 / 3", "2 / 3", "translate(-50%, -50%) rotate(270deg)"]
      ] as const;

      for (const [label, side, gridArea, gridRow, gridColumn, transform] of expected) {
        const card = screen.getByTestId(`life-card-${label}`);
        expect(card).toHaveAttribute("data-side", side);
        expect(card).toHaveStyle({ gridArea, gridRow, gridColumn });
        expect(screen.getByTestId(`life-card-content-${label}`)).toHaveStyle({ transform });
      }
    });

    it("switches the life table to the head/pair/foot list layout", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);
      await openGameSetup(user);

      await user.click(screen.getByRole("button", { name: "Use list layout" }));

      expect(screen.getByTestId("life-tracker-table")).toHaveStyle({
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        // Rows share the screen's height with no rem floor, so 5-8 seats still fit on one
        // screen instead of summing past the fold.
        gridTemplateRows: "repeat(3, minmax(0, 1fr))"
      });

      const expected = [
        ["Player 1", "top", "1 / 2", "1 / 3", "rotate(180deg)"],
        ["Player 2", "bottom", "2 / 3", "1 / 2", "rotate(0deg)"],
        ["Player 3", "bottom", "2 / 3", "2 / 3", "rotate(0deg)"],
        ["Player 4", "bottom", "3 / 4", "1 / 3", "rotate(0deg)"]
      ] as const;

      for (const [label, side, gridRow, gridColumn, rotate] of expected) {
        const card = screen.getByTestId(`life-card-${label}`);
        expect(card).toHaveAttribute("data-side", side);
        expect(card).toHaveStyle({ gridRow, gridColumn });
        expect(screen.getByTestId(`life-card-content-${label}`)).toHaveStyle({
          transform: `translate(-50%, -50%) ${rotate}`
        });
      }

      // Half-card life zones orientated by the seat's own rotation, not by layout mode or
      // seat width: the head seat faces the top edge (180) so its halves mirror, while the
      // upright pair and foot seats keep `−` on the screen-left half.
      expect(screen.getByRole("button", { name: "Decrease life for Player 1" })).toHaveClass("right-0", "w-1/2");
      expect(screen.getByRole("button", { name: "Decrease life for Player 2" })).toHaveClass("left-0", "w-1/2");
      expect(screen.getByRole("button", { name: "Decrease life for Player 4" })).toHaveClass("left-0", "w-1/2");
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
      await user.click(screen.getByRole("button", { name: "Confirm reset current game" }));
      expect(within(screen.getByTestId("life-card-Player 1")).getByText("40")).toBeInTheDocument();
      expect(localStorage.length).toBe(0);

      await user.click(screen.getByRole("button", { name: "Decrease player count" }));
      await user.click(screen.getByRole("button", { name: "Start new game" }));
      await user.click(screen.getByRole("button", { name: "Confirm start new game" }));
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

    it("always links positive commander damage to life", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);

      await user.click(screen.getByRole("button", { name: "Open counters for Player 1" }));
      await user.click(screen.getByRole("button", { name: "Increase commander damage from Player 2" }));
      await user.click(screen.getByRole("button", { name: "Close counters" }));
      expect(within(screen.getByTestId("life-card-Player 1")).getByText("39")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Open counters for Player 1" }));
      await user.click(screen.getByRole("button", { name: "Increase commander damage from Player 2" }));
      await user.click(screen.getByRole("button", { name: "Increase commander damage from Player 2" }));
      await user.click(screen.getByRole("tab", { name: "Counters" }));
      await user.click(screen.getByRole("button", { name: "Increment Poison" }));
      await user.click(screen.getByRole("button", { name: "Close counters" }));

      expect(within(screen.getByTestId("life-card-Player 1")).getByText("37")).toBeInTheDocument();
    });

    it("persists commander, named, and custom values across reopen and remount", async () => {
      const user = userEvent.setup();
      const firstMount = render(<PlayerLifeTrackerApp />);

      await user.click(screen.getByRole("button", { name: "Open counters for Player 1" }));
      await user.click(screen.getByRole("button", { name: "Increase commander damage from Player 2" }));
      await user.click(screen.getByRole("tab", { name: "Counters" }));
      await user.click(screen.getByRole("button", { name: "Increment Poison" }));
      await user.type(screen.getByRole("textbox", { name: "Custom counter name" }), "Storm");
      await user.click(screen.getByRole("button", { name: "Add custom counter" }));
      await user.click(screen.getByRole("button", { name: "Increment Storm" }));
      await user.click(screen.getByRole("button", { name: "Close counters" }));

      await user.click(screen.getByRole("button", { name: "Open counters for Player 1" }));
      expect(screen.getByTestId("commander-value-Player 2")).toHaveTextContent("1");
      await user.click(screen.getByRole("tab", { name: "Counters" }));
      expect(screen.getByRole("button", { name: "Increment Poison" })).toHaveTextContent("1");
      expect(screen.getByRole("button", { name: "Increment Storm" })).toHaveTextContent("1");
      await user.click(screen.getByRole("button", { name: "Close counters" }));

      firstMount.unmount();
      render(<PlayerLifeTrackerApp />);
      await user.click(screen.getByRole("button", { name: "Open counters for Player 1" }));
      expect(screen.getByTestId("commander-value-Player 2")).toHaveTextContent("1");
      await user.click(screen.getByRole("tab", { name: "Counters" }));
      expect(screen.getByRole("button", { name: "Increment Poison" })).toHaveTextContent("1");
      expect(screen.getByRole("button", { name: "Increment Storm" })).toHaveTextContent("1");
    });

    it("drops a pending Reset confirm when Game Setup is closed and reopened", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);
      await openGameSetup(user);

      await user.click(screen.getByRole("button", { name: "Reset current game" }));
      expect(screen.getByRole("button", { name: "Confirm reset current game" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Close game setup" }));
      await openGameSetup(user);

      expect(screen.queryByRole("button", { name: "Confirm reset current game" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reset current game" })).toBeInTheDocument();
    });

    it("applies the chosen card style to every seat and keeps it across a remount", async () => {
      const user = userEvent.setup();
      const firstMount = render(<PlayerLifeTrackerApp />);
      await openGameSetup(user);

      expect(trackerCards().every((card) => card.dataset.cardStyle === "gradient")).toBe(true);

      await user.click(screen.getByRole("button", { name: "Use flat card style" }));
      expect(trackerCards().every((card) => card.dataset.cardStyle === "flat")).toBe(true);

      firstMount.unmount();
      render(<PlayerLifeTrackerApp />);
      expect(trackerCards().every((card) => card.dataset.cardStyle === "flat")).toBe(true);
    });

    it("commits a typed life total from a life card", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);

      await user.click(screen.getByRole("button", { name: "Set life for Player 1" }));
      const input = screen.getByRole("textbox", { name: "Set life for Player 1" });
      await user.clear(input);
      await user.type(input, "100000{Enter}");

      expect(within(screen.getByTestId("life-card-Player 1")).getByText("100000")).toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem("thejudge.lifeTracker.state") as string).players[0].life).toBe(100000);
    });

    it("always shows the day/night header control, with no Game Setup toggle to hide it, and flips it on tap", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);

      const dayControl = screen.getByRole("button", {
        name: "Day and night: currently day. Flip designation."
      });
      expect(screen.getByTestId("day-night-toggle")).toBeInTheDocument();
      expect(dayControl).toHaveTextContent("Day");

      await openGameSetup(user);
      expect(screen.queryByRole("switch", { name: "Track day and night" })).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Close game setup" }));

      await user.click(dayControl);

      const nightControl = screen.getByRole("button", {
        name: "Day and night: currently night. Flip designation."
      });
      expect(nightControl).toHaveTextContent("Night");
      expect(nightControl).toHaveAttribute("data-day-night-phase", "night");
    });

    it("resets the day/night designation back to Day on Reset", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);

      await user.click(
        screen.getByRole("button", { name: "Day and night: currently day. Flip designation." })
      );
      expect(
        screen.getByRole("button", { name: "Day and night: currently night. Flip designation." })
      ).toBeInTheDocument();

      await openGameSetup(user);
      await user.click(screen.getByRole("button", { name: "Reset current game" }));
      await user.click(screen.getByRole("button", { name: "Confirm reset current game" }));

      expect(
        screen.getByRole("button", { name: "Day and night: currently day. Flip designation." })
      ).toBeInTheDocument();
    });

    it("uses accent-soft for the dark Game Setup modal's accent heading", async () => {
      const user = userEvent.setup();
      render(<PlayerLifeTrackerApp />);
      await openGameSetup(user);

      expect(screen.getByText("Life Tracker")).toHaveClass("text-accent-soft");
    });
  });
});
