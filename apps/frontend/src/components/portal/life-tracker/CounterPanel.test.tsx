import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NAMED_COUNTER_PALETTE } from "../../../lib/lifeTracker/counters";
import { addCustomCounter, createInitialState } from "../../../lib/lifeTracker/state";
import type { TrackerState } from "../../../lib/lifeTracker/types";
import { CounterPanel } from "./CounterPanel";

function populatedState(): TrackerState {
  const state = createInitialState(4, 40);
  return {
    ...state,
    players: state.players.map((player, index) =>
      index === 0 ? { ...player, displayName: "Alice" } : player
    )
  };
}

function panelProps(
  state: TrackerState = populatedState(),
  overrides: Partial<ComponentProps<typeof CounterPanel>> = {}
): ComponentProps<typeof CounterPanel> {
  return {
    player: state.players[0],
    players: state.players,
    onClose: vi.fn(),
    onAdjustNamedCounter: vi.fn(),
    onSetNamedCounter: vi.fn(),
    onAddCustomCounter: vi.fn(),
    onAdjustCustomCounter: vi.fn(),
    onSetCustomCounter: vi.fn(),
    onRemoveCustomCounter: vi.fn(),
    onAdjustCommanderDamage: vi.fn(),
    ...overrides
  };
}

function FocusHarness(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const state = populatedState();
  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open Alice counters
      </button>
      {isOpen && <CounterPanel {...panelProps(state, { onClose: () => setIsOpen(false) })} />}
    </>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Frontend - Shared", () => {
  describe("CounterPanel", () => {
    it("opens an accessible player dialog and restores focus on close", async () => {
      const user = userEvent.setup();
      render(<FocusHarness />);
      const trigger = screen.getByRole("button", { name: "Open Alice counters" });

      await user.click(trigger);
      expect(screen.getByRole("dialog", { name: "Counters for Player 1 (Alice)" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Close counters" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it("closes with Escape and restores focus", async () => {
      const user = userEvent.setup();
      render(<FocusHarness />);
      const trigger = screen.getByRole("button", { name: "Open Alice counters" });

      await user.click(trigger);
      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it("shows one me cell and one independently adjustable cell per opponent, labeled by name only", async () => {
      const user = userEvent.setup();
      const props = panelProps();
      render(<CounterPanel {...props} />);

      const matrix = screen.getByRole("group", { name: "Commander damage by source" });
      expect(within(matrix).getAllByTestId(/^commander-cell-/)).toHaveLength(4);
      expect(within(matrix).getByText("me")).toBeInTheDocument();
      expect(within(matrix).getByText("Player 2")).toBeInTheDocument();
      expect(within(matrix).queryByRole("button", { name: /Player 1/ })).not.toBeInTheDocument();
      expect(within(matrix).queryByRole("button", { name: /Options for/ })).not.toBeInTheDocument();

      await user.click(within(matrix).getByRole("button", { name: "Increase commander damage from Player 2" }));
      expect(props.onAdjustCommanderDamage).toHaveBeenCalledWith("Player 1", "Player 2", 1);

      await user.click(within(matrix).getByRole("button", { name: "Decrease commander damage from Player 2" }));
      expect(props.onAdjustCommanderDamage).toHaveBeenCalledWith("Player 1", "Player 2", -1);
    });

    it("renders commander damage decrease/increase bands at the widened tap-target height", () => {
      const props = panelProps();
      render(<CounterPanel {...props} />);

      const matrix = screen.getByRole("group", { name: "Commander damage by source" });
      expect(
        within(matrix).getByRole("button", { name: "Decrease commander damage from Player 2" })
      ).toHaveClass("min-h-[53px]");
      expect(
        within(matrix).getByRole("button", { name: "Increase commander damage from Player 2" })
      ).toHaveClass("min-h-[53px]");
    });

    it("renders the shared palette exactly once and increments each value independently", async () => {
      const user = userEvent.setup();
      const props = panelProps();
      render(<CounterPanel {...props} />);
      await user.click(screen.getByRole("tab", { name: "Counters" }));

      for (const definition of NAMED_COUNTER_PALETTE) {
        expect(screen.getAllByTestId(`counter-label-${definition.id}`)).toHaveLength(1);
      }

      await user.click(screen.getByRole("button", { name: "Increment Poison" }));
      expect(props.onAdjustNamedCounter).toHaveBeenCalledWith("Player 1", "poison", 1);
      expect(props.onAdjustCommanderDamage).not.toHaveBeenCalled();
    });

    it("opens decrement/set options after a long press without also incrementing", () => {
      vi.useFakeTimers();
      const props = panelProps();
      render(<CounterPanel {...props} />);
      fireEvent.click(screen.getByRole("tab", { name: "Counters" }));
      const poison = screen.getByRole("button", { name: "Increment Poison" });

      fireEvent.pointerDown(poison, { pointerId: 1, clientX: 10, clientY: 10 });
      act(() => vi.advanceTimersByTime(600));
      fireEvent.pointerUp(poison, { pointerId: 1, clientX: 10, clientY: 10 });
      fireEvent.click(poison);

      expect(screen.getByRole("group", { name: "Poison options" })).toBeInTheDocument();
      expect(props.onAdjustNamedCounter).not.toHaveBeenCalled();
    });

    it("cancels long press on early release or pointer movement", () => {
      vi.useFakeTimers();
      render(<CounterPanel {...panelProps()} />);
      fireEvent.click(screen.getByRole("tab", { name: "Counters" }));
      const poison = screen.getByRole("button", { name: "Increment Poison" });

      fireEvent.pointerDown(poison, { pointerId: 1, clientX: 0, clientY: 0 });
      act(() => vi.advanceTimersByTime(200));
      fireEvent.pointerUp(poison, { pointerId: 1, clientX: 0, clientY: 0 });
      act(() => vi.advanceTimersByTime(600));
      expect(screen.queryByRole("group", { name: "Poison options" })).not.toBeInTheDocument();

      fireEvent.pointerDown(poison, { pointerId: 2, clientX: 0, clientY: 0 });
      fireEvent.pointerMove(poison, { pointerId: 2, clientX: 20, clientY: 0 });
      act(() => vi.advanceTimersByTime(600));
      expect(screen.queryByRole("group", { name: "Poison options" })).not.toBeInTheDocument();
    });

    it("provides keyboard-accessible decrement and numeric set controls", async () => {
      const user = userEvent.setup();
      const props = panelProps();
      render(<CounterPanel {...props} />);
      await user.click(screen.getByRole("tab", { name: "Counters" }));
      await user.click(screen.getByRole("button", { name: "Options for Poison" }));

      const options = screen.getByRole("group", { name: "Poison options" });
      await user.click(within(options).getByRole("button", { name: "Decrease Poison" }));
      await user.clear(within(options).getByRole("spinbutton", { name: "Set Poison" }));
      await user.type(within(options).getByRole("spinbutton", { name: "Set Poison" }), "5");
      await user.click(within(options).getByRole("button", { name: "Apply Poison value" }));

      expect(props.onAdjustNamedCounter).toHaveBeenCalledWith("Player 1", "poison", -1);
      expect(props.onSetNamedCounter).toHaveBeenCalledWith("Player 1", "poison", 5);
    });

    it("trims valid custom names and rejects blank, duplicate, and overlong names", async () => {
      const user = userEvent.setup();
      let state = addCustomCounter(populatedState(), "Player 1", "Storm");
      state = {
        ...state,
        players: state.players.map((player, index) =>
          index === 0 ? { ...player, customCounters: [{ ...player.customCounters[0], amount: 2 }] } : player
        )
      };
      const props = panelProps(state);
      render(<CounterPanel {...props} />);
      await user.click(screen.getByRole("tab", { name: "Counters" }));
      const input = screen.getByRole("textbox", { name: "Custom counter name" });
      const add = screen.getByRole("button", { name: "Add custom counter" });

      await user.type(input, "   ");
      await user.click(add);
      expect(screen.getByRole("alert")).toHaveTextContent("Enter a counter name");

      await user.clear(input);
      await user.type(input, "storm");
      await user.click(add);
      expect(screen.getByRole("alert")).toHaveTextContent("already exists");

      await user.clear(input);
      await user.type(input, "x".repeat(41));
      await user.click(add);
      expect(screen.getByRole("alert")).toHaveTextContent("40 characters or fewer");

      await user.clear(input);
      await user.type(input, "  Shield  ");
      await user.click(add);
      expect(props.onAddCustomCounter).toHaveBeenCalledOnce();
      expect(props.onAddCustomCounter).toHaveBeenCalledWith("Player 1", "Shield");
    });

    it("uses accent-soft for dark-surface accent text on headings, active tab, and active counter labels", async () => {
      const user = userEvent.setup();
      const state = populatedState();
      const activeState: TrackerState = {
        ...state,
        players: state.players.map((player, index) =>
          index === 0 ? { ...player, namedCounters: { ...player.namedCounters, poison: 1 } } : player
        )
      };
      const props = panelProps(activeState);
      render(<CounterPanel {...props} />);

      expect(screen.getByText("Life Tracker")).toHaveClass("text-accent-soft");
      expect(screen.getByRole("tab", { name: "Player" })).toHaveClass("text-accent-soft");

      await user.click(screen.getByRole("tab", { name: "Counters" }));
      expect(screen.getByRole("tab", { name: "Counters" })).toHaveClass("text-accent-soft");
      expect(screen.getByTestId("counter-label-poison")).toHaveClass("text-accent-soft");

      await user.type(screen.getByRole("textbox", { name: "Custom counter name" }), "Shield");
      expect(screen.getByRole("button", { name: "Add custom counter" })).toHaveClass("text-accent-soft");
    });
  });
});
