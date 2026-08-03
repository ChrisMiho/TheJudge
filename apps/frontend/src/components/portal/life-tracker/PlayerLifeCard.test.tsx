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

function playerAtLife(life: number) {
  return {
    ...createInitialState(2, 40).players[0],
    displayName: "Alice",
    life
  };
}

describe("Frontend - Shared", () => {
  describe("PlayerLifeCard", () => {
    it("renders the formatted player, life, tint, and exact seat descriptor", () => {
      render(
        <PlayerLifeCard
          player={playerAtLife(40)}
          placement={placement}
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
      expect(screen.getByTestId("life-card-content-Player 1")).toHaveStyle({ transform: "rotate(90deg)" });
    });

    it("targets only the card's fixed player from the edge zones", async () => {
      const user = userEvent.setup();
      const onAdjustLife = vi.fn();
      render(
        <PlayerLifeCard
          player={playerAtLife(40)}
          placement={placement}
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
      const { rerender } = render(
        <PlayerLifeCard
          player={playerAtLife(0)}
          placement={placement}
          onAdjustLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByRole("img", { name: "Player 1 (Alice) is at zero or less life" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Decrease life for Player 1 (Alice)" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Increase life for Player 1 (Alice)" })).toBeEnabled();

      rerender(
        <PlayerLifeCard
          player={playerAtLife(1)}
          placement={placement}
          onAdjustLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.queryByRole("img", { name: /zero or less life/i })).not.toBeInTheDocument();
    });

    it("exposes the Wave 3 counter-opening boundary", async () => {
      const user = userEvent.setup();
      const onOpenCounters = vi.fn();
      render(
        <PlayerLifeCard
          player={playerAtLife(40)}
          placement={placement}
          onAdjustLife={vi.fn()}
          onOpenCounters={onOpenCounters}
        />
      );

      await user.click(screen.getByRole("button", { name: "Open counters for Player 1 (Alice)" }));

      expect(onOpenCounters).toHaveBeenCalledOnce();
      expect(onOpenCounters).toHaveBeenCalledWith("Player 1");
    });
  });
});
