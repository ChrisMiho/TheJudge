import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../../../lib/lifeTracker/state";
import { listSeatArrangement, seatArrangement, type SeatPlacement } from "../../../lib/lifeTracker/seatArrangement";
import { PlayerLifeCard } from "./PlayerLifeCard";

const placement: SeatPlacement = {
  label: "Player 1",
  side: "left",
  rotation: 90,
  gridArea: "seat-player-1",
  gridRow: "1 / 2",
  gridColumn: "1 / 2"
};

const layout = seatArrangement(4);

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
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
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
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={onAdjustLife}
          onSetLife={vi.fn()}
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
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
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
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
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
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
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
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
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

    it("sizes the preview grid to the compact block's own shape (2x4 at 8 players), never the arrangement's real columns/rows and never a ceil(sqrt(8))=3 square", () => {
      const eightPlayerLayout = seatArrangement(8); // arrangement's own shape: columns 2, rows 4
      const roster = createInitialState(8, 40).players;
      const player = { ...roster[0], displayName: "Alice" };

      render(
        <PlayerLifeCard
          player={player}
          players={roster.map((seat) => (seat.label === player.label ? player : seat))}
          placement={placement}
          layout={eightPlayerLayout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByTestId("commander-preview-Player 1")).toHaveStyle({
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gridTemplateRows: "repeat(2, minmax(0, 1fr))"
      });
    });

    it("has at most 2 rows in the preview grid at every tested player count (2, 4, 6, 8)", () => {
      for (const count of [2, 4, 6, 8]) {
        const roster = createInitialState(count, 40).players;
        const player = { ...roster[0], displayName: "Alice" };
        const { unmount } = render(
          <PlayerLifeCard
            player={player}
            players={roster.map((seat) => (seat.label === player.label ? player : seat))}
            placement={placement}
            layout={seatArrangement(count)}
            cardStyle="gradient"
            onAdjustLife={vi.fn()}
            onSetLife={vi.fn()}
            onOpenCounters={vi.fn()}
          />
        );

        expect(screen.getByTestId("commander-preview-Player 1")).toHaveStyle({
          gridTemplateRows: "repeat(2, minmax(0, 1fr))"
        });
        unmount();
      }
    });

    it("places the viewer's own cell at the block's fixed top-left corner, with exactly one 'me' cell, for a 4-player and an 8-player case", () => {
      for (const count of [4, 8]) {
        const roster = createInitialState(count, 40).players;
        const player = { ...roster[0], displayName: "Alice" };
        const { unmount } = render(
          <PlayerLifeCard
            player={player}
            players={roster.map((seat) => (seat.label === player.label ? player : seat))}
            placement={placement}
            layout={seatArrangement(count)}
            cardStyle="gradient"
            onAdjustLife={vi.fn()}
            onSetLife={vi.fn()}
            onOpenCounters={vi.fn()}
          />
        );

        expect(screen.getByTestId("commander-preview-cell-Player 1")).toHaveStyle({
          gridRow: "1 / 2",
          gridColumn: "1 / 2"
        });

        const meCells = screen
          .getAllByText("me")
          .filter((el) => el.getAttribute("data-testid")?.startsWith("commander-preview-cell-"));
        expect(meCells).toHaveLength(1);
        expect(meCells[0]).toHaveAttribute("data-testid", "commander-preview-cell-Player 1");

        unmount();
      }
    });

    it("renders the same preview shape for a given player count whether the card gets a grid-mode or a list-mode layout", () => {
      const count = 8;
      const roster = createInitialState(count, 40).players;
      const player = { ...roster[0], displayName: "Alice" };
      const playersProp = roster.map((seat) => (seat.label === player.label ? player : seat));

      const { unmount } = render(
        <PlayerLifeCard
          player={player}
          players={playersProp}
          placement={placement}
          layout={seatArrangement(count)}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );
      const gridModeStyle = {
        gridTemplateColumns: screen.getByTestId("commander-preview-Player 1").style.gridTemplateColumns,
        gridTemplateRows: screen.getByTestId("commander-preview-Player 1").style.gridTemplateRows
      };
      unmount();

      render(
        <PlayerLifeCard
          player={player}
          players={playersProp}
          placement={placement}
          layout={listSeatArrangement(count)}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByTestId("commander-preview-Player 1")).toHaveStyle(gridModeStyle);
      // list mode's own arrangement is tall/stacked (unlike grid mode) - the sameness above is
      // only meaningful if the two arrangements actually differ in shape.
      expect(seatArrangement(count).rows).not.toBe(listSeatArrangement(count).rows);
    });

    it("splits the whole card into two half-sized life zones, orientated by the seat's rotation", () => {
      const player = playerAtLife(40);
      const decreaseName = "Decrease life for Player 1 (Alice)";
      const increaseName = "Increase life for Player 1 (Alice)";

      // Upright seat (rotation 0): the player's left half decreases, right half increases.
      const { rerender } = render(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={{ ...placement, rotation: 0 }}
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: decreaseName })).toHaveClass("left-0", "w-1/2");
      expect(screen.getByRole("button", { name: increaseName })).toHaveClass("right-0", "w-1/2");

      // Facing the top edge (180): mirrored, so `−` is still on that player's own left.
      rerender(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={{ ...placement, rotation: 180 }}
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: decreaseName })).toHaveClass("right-0", "w-1/2");
      expect(screen.getByRole("button", { name: increaseName })).toHaveClass("left-0", "w-1/2");

      // Sideways seats split along the other axis, because the player's left-right axis
      // maps to the card's top-bottom one.
      rerender(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={{ ...placement, rotation: 90 }}
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: decreaseName })).toHaveClass("top-0", "h-1/2");
      expect(screen.getByRole("button", { name: increaseName })).toHaveClass("bottom-0", "h-1/2");

      rerender(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={{ ...placement, rotation: 270 }}
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: decreaseName })).toHaveClass("bottom-0", "h-1/2");
      expect(screen.getByRole("button", { name: increaseName })).toHaveClass("top-0", "h-1/2");
    });

    it("keeps the inner controls clickable above the two life halves", () => {
      const player = playerAtLife(40);
      render(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={placement}
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      // The content box covers the whole card, so it must not take pointer events itself -
      // only its three real controls may, or every tap meant for a half would be swallowed.
      const content = screen.getByTestId("life-card-content-Player 1");
      expect(content).toHaveClass("pointer-events-none");
      expect(screen.getByTestId("life-value-Player 1")).toHaveClass("pointer-events-auto");
      expect(screen.getByTestId("commander-preview-Player 1")).toHaveClass("pointer-events-auto");
    });

    it("swaps the rotated content box's width/height source so a 90/270 rotation can't overflow a non-square card", () => {
      const player = playerAtLife(40);
      const sidewaysPlacement: SeatPlacement = { ...placement, rotation: 270 };
      const { rerender } = render(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={placement}
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
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
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
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
          layout={layout}
          cardStyle="gradient"
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
          onOpenCounters={vi.fn()}
        />
      );

      expect(screen.getByTestId("life-card-content-Player 1")).toHaveStyle({
        width: "100cqw",
        height: "100cqh"
      });
    });

    describe("Card style", () => {
      function renderWithStyle(cardStyle: "gradient" | "flat", life = 40) {
        const player = playerAtLife(life);
        return render(
          <PlayerLifeCard
            player={player}
            players={rosterWith(player)}
            placement={placement}
            layout={layout}
            cardStyle={cardStyle}
            onAdjustLife={vi.fn()}
            onSetLife={vi.fn()}
            onOpenCounters={vi.fn()}
          />
        );
      }

      it("keeps the gradient ombre fill for the default card style", () => {
        renderWithStyle("gradient");
        const card = screen.getByTestId("life-card-Player 1");

        expect(card).toHaveAttribute("data-card-style", "gradient");
        expect(card.className).toContain("bg-gradient-to-br");
        expect(card.className).toContain("via-zinc-50");
      });

      it("drops the bright mid stop for a single solid tint in the flat card style", () => {
        renderWithStyle("flat");
        const card = screen.getByTestId("life-card-Player 1");

        expect(card).toHaveAttribute("data-card-style", "flat");
        expect(card.className).not.toContain("bg-gradient-to-br");
        expect(card.className).not.toContain("via-");
        expect(card.className).toContain("bg-accent-soft");
      });

      it("keeps the same three life states and their border/text colors in the flat card style", () => {
        const { unmount } = renderWithStyle("flat", 5);
        let card = screen.getByTestId("life-card-Player 1");
        expect(card).toHaveAttribute("data-life-state", "critical");
        expect(card.className).toContain("border-amber-400/60");
        expect(card.className).toContain("text-amber-950");
        unmount();

        renderWithStyle("flat", 0);
        card = screen.getByTestId("life-card-Player 1");
        expect(card).toHaveAttribute("data-life-state", "dead");
        expect(card.className).toContain("border-rose-400/70");
        expect(card.className).toContain("text-rose-950");
      });
    });

    describe("Typed life entry", () => {
      function renderEditable(life = 40) {
        const player = playerAtLife(life);
        const onSetLife = vi.fn();
        const onAdjustLife = vi.fn();
        render(
          <PlayerLifeCard
            player={player}
            players={rosterWith(player)}
            placement={placement}
            layout={layout}
            cardStyle="gradient"
            onAdjustLife={onAdjustLife}
            onSetLife={onSetLife}
            onOpenCounters={vi.fn()}
          />
        );
        return { onSetLife, onAdjustLife };
      }

      it("commits a typed total on Enter", async () => {
        const user = userEvent.setup();
        const { onSetLife } = renderEditable(40);

        await user.click(screen.getByRole("button", { name: "Set life for Player 1 (Alice)" }));
        const input = screen.getByRole("textbox", { name: "Set life for Player 1 (Alice)" });
        await user.clear(input);
        await user.type(input, "100000{Enter}");

        expect(onSetLife).toHaveBeenCalledWith("Player 1", 100000);
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      });

      it("commits a negative total on blur", async () => {
        const user = userEvent.setup();
        const { onSetLife } = renderEditable(3);

        await user.click(screen.getByRole("button", { name: "Set life for Player 1 (Alice)" }));
        const input = screen.getByRole("textbox", { name: "Set life for Player 1 (Alice)" });
        await user.clear(input);
        await user.type(input, "-12");
        await user.tab();

        expect(onSetLife).toHaveBeenCalledWith("Player 1", -12);
      });

      it("cancels on Escape without writing the draft", async () => {
        const user = userEvent.setup();
        const { onSetLife } = renderEditable(40);

        await user.click(screen.getByRole("button", { name: "Set life for Player 1 (Alice)" }));
        const input = screen.getByRole("textbox", { name: "Set life for Player 1 (Alice)" });
        await user.clear(input);
        await user.type(input, "7{Escape}");

        expect(onSetLife).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: "Set life for Player 1 (Alice)" })).toBeInTheDocument();
      });

      it("cancels rather than writing garbage for empty or non-numeric entry", async () => {
        const user = userEvent.setup();
        const { onSetLife } = renderEditable(40);

        await user.click(screen.getByRole("button", { name: "Set life for Player 1 (Alice)" }));
        await user.clear(screen.getByRole("textbox", { name: "Set life for Player 1 (Alice)" }));
        await user.keyboard("{Enter}");
        expect(onSetLife).not.toHaveBeenCalled();

        await user.click(screen.getByRole("button", { name: "Set life for Player 1 (Alice)" }));
        const input = screen.getByRole("textbox", { name: "Set life for Player 1 (Alice)" });
        await user.clear(input);
        await user.type(input, "lots{Enter}");

        expect(onSetLife).not.toHaveBeenCalled();
      });

      it("opens from keyboard focus with Enter and rotates with the rest of the card content", async () => {
        const user = userEvent.setup();
        renderEditable(40);

        screen.getByRole("button", { name: "Set life for Player 1 (Alice)" }).focus();
        await user.keyboard("{Enter}");

        const input = screen.getByRole("textbox", { name: "Set life for Player 1 (Alice)" });
        expect(input).toHaveFocus();
        // The entry lives inside the single rotated content box, so it inherits the seat's rotation.
        expect(screen.getByTestId("life-card-content-Player 1")).toContainElement(input);
      });

      it("keeps the +/- halves takeable under the card content, which no longer takes taps itself", async () => {
        const user = userEvent.setup();
        const { onAdjustLife, onSetLife } = renderEditable(40);

        // Inverted from the old edge-strip bands: the halves now sit *under* the content box
        // (z-0 vs z-10) and stay reachable because that box is pointer-events-none.
        expect(screen.getByTestId("life-card-content-Player 1").className).toContain("z-10");
        expect(screen.getByRole("button", { name: "Increase life for Player 1 (Alice)" }).className).toContain("z-0");

        await user.click(screen.getByRole("button", { name: "Increase life for Player 1 (Alice)" }));

        expect(onAdjustLife).toHaveBeenCalledWith("Player 1", 1);
        expect(onSetLife).not.toHaveBeenCalled();
      });
    });
  });
});
