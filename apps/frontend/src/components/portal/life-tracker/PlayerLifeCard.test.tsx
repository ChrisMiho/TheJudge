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
          cardStyle="gradient"
          isWideSeat={false}
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
          layoutMode="grid"
          cardStyle="gradient"
          isWideSeat={false}
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
          layoutMode="grid"
          cardStyle="gradient"
          isWideSeat={false}
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
          layoutMode="grid"
          cardStyle="gradient"
          isWideSeat={false}
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
          layoutMode="grid"
          cardStyle="gradient"
          isWideSeat={false}
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
          layoutMode="grid"
          cardStyle="gradient"
          isWideSeat={false}
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

    it("puts the life adjustment bands on top/bottom in grid mode and for list mode's narrow paired seats", () => {
      const player = playerAtLife(40);
      const { rerender } = render(
        <PlayerLifeCard
          player={player}
          players={rosterWith(player)}
          placement={placement}
          layoutMode="grid"
          cardStyle="gradient"
          isWideSeat={false}
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
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
          cardStyle="gradient"
          isWideSeat={false}
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
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
          cardStyle="gradient"
          isWideSeat={true}
          onAdjustLife={vi.fn()}
          onSetLife={vi.fn()}
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
          cardStyle="gradient"
          isWideSeat={false}
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
          layoutMode="grid"
          cardStyle="gradient"
          isWideSeat={false}
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
          layoutMode="grid"
          cardStyle="gradient"
          isWideSeat={false}
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
            layoutMode="grid"
            cardStyle={cardStyle}
            isWideSeat={false}
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
            layoutMode="grid"
            cardStyle="gradient"
            isWideSeat={false}
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

      it("leaves the +/- adjustment bands above the card content so they still take their own taps", async () => {
        const user = userEvent.setup();
        const { onAdjustLife, onSetLife } = renderEditable(40);

        expect(screen.getByTestId("life-card-content-Player 1").className).toContain("z-10");
        expect(screen.getByRole("button", { name: "Increase life for Player 1 (Alice)" }).className).toContain("z-20");

        await user.click(screen.getByRole("button", { name: "Increase life for Player 1 (Alice)" }));

        expect(onAdjustLife).toHaveBeenCalledWith("Player 1", 1);
        expect(onSetLife).not.toHaveBeenCalled();
      });
    });
  });
});
