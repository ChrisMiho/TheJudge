import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NAMED_COUNTER_PALETTE } from "../../../lib/lifeTracker/counters";
import { seatArrangement } from "../../../lib/lifeTracker/seatArrangement";
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
    layout: seatArrangement(state.playerCount),
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
      // Look-matching pass (slice Q): the title is "Counters · <player>" plus
      // a muted "<life> life" caption (both make up the dialog's accessible
      // name via aria-labelledby).
      expect(screen.getByRole("dialog", { name: "Counters · Player 1 (Alice) 40 life" })).toBeInTheDocument();
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
      // Look-matching pass (slice Q): "your seat · life total" replaces the
      // old bare "me" caption.
      expect(within(matrix).getByText("your seat · life total")).toBeInTheDocument();
      expect(within(matrix).getByText("Player 2")).toBeInTheDocument();
      expect(within(matrix).queryByRole("button", { name: /Player 1/ })).not.toBeInTheDocument();
      expect(within(matrix).queryByRole("button", { name: /Options for/ })).not.toBeInTheDocument();

      await user.click(within(matrix).getByRole("button", { name: "Increase commander damage from Player 2" }));
      expect(props.onAdjustCommanderDamage).toHaveBeenCalledWith("Player 1", "Player 2", 1);

      await user.click(within(matrix).getByRole("button", { name: "Decrease commander damage from Player 2" }));
      expect(props.onAdjustCommanderDamage).toHaveBeenCalledWith("Player 1", "Player 2", -1);
    });

    it("renders commander damage decrease/increase as one joined stepper pill (look-matching pass, slice Q)", () => {
      const props = panelProps();
      render(<CounterPanel {...props} />);

      const matrix = screen.getByRole("group", { name: "Commander damage by source" });
      const decrease = within(matrix).getByRole("button", { name: "Decrease commander damage from Player 2" });
      const increase = within(matrix).getByRole("button", { name: "Increase commander damage from Player 2" });
      // `.seat .bands` (index.css) is the joined −|+ pill at the seat's foot.
      expect(decrease.closest(".bands")).not.toBeNull();
      expect(increase.closest(".bands")).toBe(decrease.closest(".bands"));
    });

    it("sizes the commander-damage matrix to the active layout's real columns/rows, not a hardcoded grid-cols-2", () => {
      const state = createInitialState(8, 40);
      const props = panelProps(state);
      render(<CounterPanel {...props} />);

      const matrix = screen.getByRole("group", { name: "Commander damage by source" });
      // seatArrangement(8) is columns: 2, rows: 4 - this happens to match `grid-cols-2` in
      // value, so the guard is that it comes from `layout`, not the class name, which is gone.
      expect(matrix.className).not.toContain("grid-cols-2");
      expect(matrix).toHaveStyle({
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gridTemplateRows: "repeat(4, minmax(0, 1fr))"
      });
    });

    it("places every opponent's cell at that opponent's own seat, and drops min-h-36 from the me cell", () => {
      const state = createInitialState(8, 40);
      const layout = seatArrangement(8);
      const props = panelProps(state, { layout });
      render(<CounterPanel {...props} />);

      const ownSeat = layout.seats.find((seat) => seat.label === "Player 1")!;
      // Player 1 is nearest at the bottom-left (row 4); Player 8 sits at the bottom of the right
      // column, sharing that same bottom row even though it is roster index 7 - so this proves
      // placement is seat-derived, not a roster-order scan.
      const player8Seat = layout.seats.find((seat) => seat.label === "Player 8")!;

      const meCell = screen.getByTestId("commander-cell-Player 1");
      expect(meCell).toHaveTextContent("your seat · life total");
      expect(meCell.className).not.toContain("min-h-36");
      expect(meCell).toHaveStyle({ gridRow: ownSeat.gridRow, gridColumn: ownSeat.gridColumn });

      const opponentCell = screen.getByTestId("commander-cell-Player 8");
      expect(opponentCell).toHaveStyle({ gridRow: player8Seat.gridRow, gridColumn: player8Seat.gridColumn });
      expect(player8Seat.gridRow).toBe(ownSeat.gridRow);
      expect(player8Seat.gridColumn).not.toBe(ownSeat.gridColumn);
    });

    it("marks a commander-damage cell LETHAL at 21 and not below it (REQ-202)", () => {
      const state = populatedState();
      const atTwenty: TrackerState = {
        ...state,
        players: state.players.map((entry, index) =>
          index === 0 ? { ...entry, commanderDamage: { ...entry.commanderDamage, "Player 2": 20 } } : entry
        )
      };
      const { rerender } = render(<CounterPanel {...panelProps(atTwenty)} />);

      expect(screen.getByTestId("commander-cell-Player 2")).toHaveAttribute("data-lethal", "false");
      expect(screen.queryByTestId("commander-lethal-Player 2")).not.toBeInTheDocument();

      const atTwentyOne: TrackerState = {
        ...state,
        players: state.players.map((entry, index) =>
          index === 0 ? { ...entry, commanderDamage: { ...entry.commanderDamage, "Player 2": 21 } } : entry
        )
      };
      rerender(<CounterPanel {...panelProps(atTwentyOne)} />);

      expect(screen.getByTestId("commander-cell-Player 2")).toHaveAttribute("data-lethal", "true");
      expect(screen.getByTestId("commander-lethal-Player 2")).toHaveTextContent(/lethal/i);
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

      expect(screen.getByText("Life Tracker").closest(".lt-head")).not.toBeNull();
      // The active tab's own accent styling comes from `.seg button[aria-selected="true"]` (index.css),
      // asserted structurally (the shared segmented control, `aria-selected`) rather than as a colour class.
      const commanderTab = screen.getByRole("tab", { name: "Commander damage" });
      expect(commanderTab.closest(".seg")).not.toBeNull();
      expect(commanderTab).toHaveAttribute("aria-selected", "true");

      await user.click(screen.getByRole("tab", { name: "Counters" }));
      expect(screen.getByRole("tab", { name: "Counters" })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByTestId("counter-label-poison").closest(".tile")).toHaveAttribute("data-on", "true");

      await user.type(screen.getByRole("textbox", { name: "Custom counter name" }), "Shield");
      expect(screen.getByRole("button", { name: "Add custom counter" })).toHaveClass("btn");
    });

    // REQ-082 (as amended): the panel is the suite's shared sheet, sized to its content like every other
    // sheet — no fixed tall frame of its own; only the sheet's body scrolls when the content is taller.
    it("is hosted on the shared sheet and sized to its content, with no fixed full-height frame", () => {
      render(<CounterPanel {...panelProps()} />);

      const surface = screen.getByRole("dialog");
      expect(surface).toHaveClass("drawer-panel", "lt-sheet");
      expect(surface.parentElement).toBe(document.body);
      expect(surface.className).not.toMatch(/\bh-full\b|\bmax-h-\[|items-stretch/);
      // Head, body and the Done foot bar are the sheet's own three bands, in that order.
      const bands = Array.from(surface.children).filter((child) => /lt-head|lt-body|lt-foot/.test(child.className));
      expect(bands.map((band) => band.className.split(" ").find((name) => name.startsWith("lt-")))).toEqual([
        "lt-head",
        "lt-scope",
        "lt-foot"
      ]);
    });

    it("closes from the Done bar, the ✕ and Escape", async () => {
      const user = userEvent.setup();
      const props = panelProps();
      const { rerender } = render(<CounterPanel {...props} />);

      await user.click(screen.getByRole("button", { name: "Done" }));
      expect(props.onClose).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole("button", { name: "Close counters" }));
      expect(props.onClose).toHaveBeenCalledTimes(2);

      await user.keyboard("{Escape}");
      expect(props.onClose).toHaveBeenCalledTimes(3);
      rerender(<CounterPanel {...props} />);
    });
  });
});
