import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../../../lib/lifeTracker/state";
import type { SeatPlacement } from "../../../lib/lifeTracker/seatArrangement";
import { PlayerLifeCard } from "./PlayerLifeCard";

const placement: SeatPlacement = {
  label: "Player 1",
  side: "left",
  rotation: 90,
  gridArea: "seat-player-1",
  gridRow: "1 / 2",
  gridColumn: "1 / 2"
};

function fourPlayerRoster() {
  return createInitialState(4, 40).players;
}

function playerAtLife(life: number) {
  return {
    ...fourPlayerRoster()[0],
    displayName: "Alice",
    life
  };
}

function rosterWith(player: ReturnType<typeof playerAtLife>) {
  const roster = fourPlayerRoster();
  return roster.map((seat) => (seat.label === player.label ? player : seat));
}

describe("Frontend - Shared", () => {
  describe("PlayerLifeCard", () => {
    it("renders the formatted player, life, tint, and exact seat descriptor", () => {
      const player = playerAtLife(40);
      render(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={placement}
          layoutMode="grid"
          isWideSeat={false}
          onAdjustLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      const card = screen.getByTestId("life-card-Player 1");
      expect(card).toHaveTextContent("Player 1 (Alice)");
      expect(card).toHaveTextContent("40");
      expect(card).toHaveAttribute("data-life-state", "healthy");
      expect(card).toHaveAttribute("data-side", "left");
      expect(card).toHaveStyle({
        gridArea: "seat-player-1",
        gridRow: "1 / 2",
        gridColumn: "1 / 2"
      });
      expect(screen.getByTestId("life-card-content-Player 1")).toHaveStyle({
        transform: "translate(-50%, -50%) rotate(90deg)"
      });
    });

    it("targets only the card's fixed player from the edge zones", async () => {
      const user = userEvent.setup();
      const onAdjustLife = vi.fn();
      const player = playerAtLife(40);
      render(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={placement}
          layoutMode="grid"
          isWideSeat={false}
          onAdjustLife={onAdjustLife}
          onOpenCounters={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: "Decrease life for Player 1 (Alice)" }));
      await user.click(screen.getByRole("button", { name: "Increase life for Player 1 (Alice)" }));

      expect(onAdjustLife.mock.calls).toEqual([
        ["Player 1", -1],
        ["Player 1", 1]
      ]);
    });

    it("shows the visual-only death cue at zero and clears it above zero without disabling controls", () => {
      const deadPlayer = playerAtLife(0);
      const { rerender } = render(
        <PlayerLifeCard
          player={deadPlayer}
          players={rosterWith(deadPlayer)}
          placement={placement}
          layoutMode="grid"
          isWideSeat={false}
          onAdjustLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByRole("img", { name: "Player 1 (Alice) is at zero or less life" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Decrease life for Player 1 (Alice)" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Increase life for Player 1 (Alice)" })).toBeEnabled();

      const revivedPlayer = playerAtLife(1);
      rerender(
        <PlayerLifeCard
          player={revivedPlayer}
          players={rosterWith(revivedPlayer)}
          placement={placement}
          layoutMode="grid"
          isWideSeat={false}
          onAdjustLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.queryByRole("img", { name: /zero or less life/i })).not.toBeInTheDocument();
    });

    it("exposes the Wave 3 counter-opening boundary", async () => {
      const user = userEvent.setup();
      const onOpenCounters = vi.fn();
      const player = playerAtLife(40);
      render(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={placement}
          layoutMode="grid"
          isWideSeat={false}
          onAdjustLife={vi.fn()}
          onOpenCounters={onOpenCounters}
        />
      );

      await user.click(screen.getByRole("button", { name: "Open counters for Player 1 (Alice)" }));

      expect(onOpenCounters).toHaveBeenCalledOnce();
      expect(onOpenCounters).toHaveBeenCalledWith("Player 1");
    });

    it("shows a mini commander-damage grid (one 'me' tile plus one tile per opponent) as the counters entry point", () => {
      const roster = fourPlayerRoster();
      const player = {
        ...roster[0],
        displayName: "Alice",
        commanderDamage: { ...roster[0].commanderDamage, "Player 2": 3 }
      };
      render(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={placement}
          layoutMode="grid"
          isWideSeat={false}
          onAdjustLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      const preview = screen.getByTestId("commander-preview-Player 1");
      expect(preview).toHaveAttribute("aria-label", "Open counters for Player 1 (Alice)");
      expect(screen.getByTestId("commander-preview-cell-Player 1")).toHaveTextContent("me");
      expect(screen.getByTestId("commander-preview-cell-Player 2")).toHaveTextContent("3");
      expect(screen.getByTestId("commander-preview-cell-Player 3")).toHaveTextContent("0");
      expect(screen.getByTestId("commander-preview-cell-Player 4")).toHaveTextContent("0");
    });

    it("puts the life adjustment bands on top/bottom in grid mode and for list mode's narrow paired seats", () => {
      const player = playerAtLife(40);
      const { rerender } = render(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={placement}
          layoutMode="grid"
          isWideSeat={false}
          onAdjustLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: "Decrease life for Player 1 (Alice)" })).toHaveClass(
        "top-0",
        "h-12"
      );
      expect(screen.getByRole("button", { name: "Increase life for Player 1 (Alice)" })).toHaveClass(
        "bottom-0",
        "h-12"
      );

      rerender(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={placement}
          layoutMode="list"
          isWideSeat={false}
          onAdjustLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: "Decrease life for Player 1 (Alice)" })).toHaveClass(
        "top-0",
        "h-12"
      );
      expect(screen.getByRole("button", { name: "Increase life for Player 1 (Alice)" })).toHaveClass(
        "bottom-0",
        "h-12"
      );
    });

    it("puts the life adjustment bands on left/right for list mode's full-width head/foot seats", () => {
      const player = playerAtLife(40);
      render(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={placement}
          layoutMode="list"
          isWideSeat={true}
          onAdjustLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: "Decrease life for Player 1 (Alice)" })).toHaveClass(
        "left-0",
        "w-12"
      );
      expect(screen.getByRole("button", { name: "Increase life for Player 1 (Alice)" })).toHaveClass(
        "right-0",
        "w-12"
      );
    });

    it("swaps the rotated content box's width/height source so a 90/270 rotation can't overflow a non-square card", () => {
      const player = playerAtLife(40);
      const sidewaysPlacement: SeatPlacement = { ...placement, rotation: 270 };
      const { rerender } = render(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={placement}
          layoutMode="grid"
          isWideSeat={false}
          onAdjustLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByTestId("life-card-content-Player 1")).toHaveStyle({
        width: "100cqh",
        height: "100cqw"
      });

      rerender(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={sidewaysPlacement}
          layoutMode="grid"
          isWideSeat={false}
          onAdjustLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByTestId("life-card-content-Player 1")).toHaveStyle({
        width: "100cqh",
        height: "100cqw"
      });

      const uprightPlacement: SeatPlacement = { ...placement, rotation: 0 };
      rerender(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={uprightPlacement}
          layoutMode="grid"
          isWideSeat={false}
          onAdjustLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByTestId("life-card-content-Player 1")).toHaveStyle({
        width: "100cqw",
        height: "100cqh"
      });
    });
  });
});
