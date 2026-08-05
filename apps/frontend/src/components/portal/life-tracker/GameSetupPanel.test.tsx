import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { GameSetupPanel } from "./GameSetupPanel";

const FOUR_PLAYERS = [
  { label: "Player 1" as const, displayName: "Player 1" },
  { label: "Player 2" as const, displayName: "Player 2" },
  { label: "Player 3" as const, displayName: "Player 3" },
  { label: "Player 4" as const, displayName: "Player 4" }
];

function renderPanel(overrides: Partial<ComponentProps<typeof GameSetupPanel>> = {}) {
  const props: ComponentProps<typeof GameSetupPanel> = {
    playerCount: 4,
    layoutMode: "grid",
    cardStyle: "gradient",
    startingLife: 40,
    players: FOUR_PLAYERS,
    onPlayerCountChange: vi.fn(),
    onLayoutModeChange: vi.fn(),
    onCardStyleChange: vi.fn(),
    onStartingLifeChange: vi.fn(),
    onDisplayNameChange: vi.fn(),
    onReset: vi.fn(),
    onNewGame: vi.fn(),
    ...overrides
  };

  const view = render(<GameSetupPanel {...props} />);
  return Object.assign(props, {
    rerenderPanel: (nextProps: Partial<ComponentProps<typeof GameSetupPanel>>) => {
      Object.assign(props, nextProps);
      view.rerender(<GameSetupPanel {...props} />);
    }
  });
}

describe("Frontend - Shared", () => {
  describe("GameSetupPanel", () => {
    it("changes player count via the −/+ stepper", async () => {
      const user = userEvent.setup();
      const props = renderPanel({ playerCount: 4 });
      const controls = screen.getByLabelText("Player count");

      expect(within(controls).getByText("4")).toBeInTheDocument();

      await user.click(within(controls).getByRole("button", { name: "Increase player count" }));
      expect(props.onPlayerCountChange).toHaveBeenCalledWith(5);

      await user.click(within(controls).getByRole("button", { name: "Decrease player count" }));
      expect(props.onPlayerCountChange).toHaveBeenCalledWith(3);
    });

    it("disables the decrease button at the minimum player count", () => {
      renderPanel({ playerCount: 2 });
      const controls = within(screen.getByLabelText("Player count"));

      expect(controls.getByRole("button", { name: "Decrease player count" })).toBeDisabled();
      expect(controls.getByRole("button", { name: "Increase player count" })).not.toBeDisabled();
    });

    it("disables the increase button at the maximum player count", () => {
      renderPanel({ playerCount: 8 });
      const controls = within(screen.getByLabelText("Player count"));

      expect(controls.getByRole("button", { name: "Increase player count" })).toBeDisabled();
      expect(controls.getByRole("button", { name: "Decrease player count" })).not.toBeDisabled();
    });

    it("changes layout mode and reflects a controlled layoutMode prop update", async () => {
      const user = userEvent.setup();
      const props = renderPanel({ layoutMode: "grid" });

      expect(screen.getByRole("button", { name: "Use grid layout" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Use list layout" })).toHaveAttribute("aria-pressed", "false");

      await user.click(screen.getByRole("button", { name: "Use list layout" }));
      expect(props.onLayoutModeChange).toHaveBeenCalledWith("list");

      props.rerenderPanel({ layoutMode: "list" });
      expect(screen.getByRole("button", { name: "Use grid layout" })).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByRole("button", { name: "Use list layout" })).toHaveAttribute("aria-pressed", "true");
    });

    it.each([20, 25, 30, 40])("applies the %i-life preset", async (preset) => {
      const user = userEvent.setup();
      const props = renderPanel();

      await user.click(screen.getByRole("button", { name: `Set starting life to ${preset}` }));

      expect(props.onStartingLifeChange).toHaveBeenCalledOnce();
      expect(props.onStartingLifeChange).toHaveBeenCalledWith(preset);
    });

    it("marks the active preset", () => {
      renderPanel({ startingLife: 25 });

      expect(screen.getByRole("button", { name: "Set starting life to 25" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "Set starting life to 40" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    it("shows an unselected Custom pill for a preset starting life", () => {
      renderPanel({ startingLife: 40 });

      const customPill = screen.getByRole("button", { name: "Set custom starting life" });
      expect(customPill).toHaveTextContent("Custom");
      expect(customPill).toHaveAttribute("aria-pressed", "false");
    });

    it("opens the inline custom-life input from the Custom pill", async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(screen.getByRole("button", { name: "Set custom starting life" }));

      expect(screen.getByRole("spinbutton", { name: "Custom starting life" })).toBeInTheDocument();
    });

    it("prefills the inline custom-life input with 60 when starting life is currently a fixed preset", async () => {
      const user = userEvent.setup();
      renderPanel({ startingLife: 40 });

      await user.click(screen.getByRole("button", { name: "Set custom starting life" }));

      expect(screen.getByRole("spinbutton", { name: "Custom starting life" })).toHaveValue(60);
    });

    it("submitting the 60 prefill unedited applies starting life 60", async () => {
      const user = userEvent.setup();
      const props = renderPanel({ startingLife: 40 });

      await user.click(screen.getByRole("button", { name: "Set custom starting life" }));
      await user.click(screen.getByRole("button", { name: "Apply custom starting life" }));

      expect(props.onStartingLifeChange).toHaveBeenCalledWith(60);
    });

    it("applies a valid custom integer and collapses back to a pill", async () => {
      const user = userEvent.setup();
      const props = renderPanel();

      await user.click(screen.getByRole("button", { name: "Set custom starting life" }));
      const input = screen.getByRole("spinbutton", { name: "Custom starting life" });
      await user.clear(input);
      await user.type(input, "55");
      await user.click(screen.getByRole("button", { name: "Apply custom starting life" }));

      expect(props.onStartingLifeChange).toHaveBeenCalledWith(55);
      expect(screen.getByRole("button", { name: "Set custom starting life" })).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it.each(["0", "1000", "1.5", "not-a-number"])("rejects invalid custom value %s", async (value) => {
      const user = userEvent.setup();
      const props = renderPanel();

      await user.click(screen.getByRole("button", { name: "Set custom starting life" }));
      const input = screen.getByRole("spinbutton", { name: "Custom starting life" });
      await user.clear(input);
      await user.type(input, value);
      await user.click(screen.getByRole("button", { name: "Apply custom starting life" }));

      expect(props.onStartingLifeChange).not.toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent("Enter a whole number from 1 to 999");
      expect(screen.getByRole("spinbutton", { name: "Custom starting life" })).toBeInTheDocument();
    });

    it("shows and selects the active custom value", () => {
      renderPanel({ startingLife: 55 });

      const customPill = screen.getByRole("button", { name: "Set custom starting life" });
      expect(customPill).toHaveTextContent("55");
      expect(customPill).toHaveAttribute("aria-pressed", "true");
    });

    it("cancels inline custom-life editing on Escape or blur", async () => {
      const user = userEvent.setup();
      const props = renderPanel();

      await user.click(screen.getByRole("button", { name: "Set custom starting life" }));
      const input = screen.getByRole("spinbutton", { name: "Custom starting life" });
      await user.clear(input);
      await user.type(input, "55");
      await user.keyboard("{Escape}");
      expect(screen.getByRole("button", { name: "Set custom starting life" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Set custom starting life" }));
      const reopenedInput = screen.getByRole("spinbutton", { name: "Custom starting life" });
      await user.clear(reopenedInput);
      await user.type(reopenedInput, "55");
      await user.tab();

      expect(screen.getByRole("button", { name: "Set custom starting life" })).toBeInTheDocument();
      expect(props.onStartingLifeChange).not.toHaveBeenCalled();
    });

    it("keeps Reset and New Game as explicit actions behind a confirming second press", async () => {
      const user = userEvent.setup();
      const props = renderPanel();

      await user.click(screen.getByRole("button", { name: "Reset current game" }));
      expect(props.onReset).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Confirm reset current game" }));

      await user.click(screen.getByRole("button", { name: "Start new game" }));
      expect(props.onNewGame).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Confirm start new game" }));

      expect(props.onReset).toHaveBeenCalledOnce();
      expect(props.onNewGame).toHaveBeenCalledOnce();
    });

    it("announces what each pending confirm will destroy and clears the message after confirming", async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(screen.getByRole("button", { name: "Reset current game" }));
      expect(screen.getByRole("status")).toHaveTextContent(/every life total goes back/i);
      expect(screen.getByRole("status")).toHaveTextContent(/players, names, and settings stay/i);

      await user.click(screen.getByRole("button", { name: "Start new game" }));
      expect(screen.getByRole("status")).toHaveTextContent(/this game is discarded/i);

      await user.click(screen.getByRole("button", { name: "Confirm start new game" }));
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });

    it("cancels a pending Reset without firing it, and drops it when New Game is confirmed instead", async () => {
      const user = userEvent.setup();
      const props = renderPanel();

      await user.click(screen.getByRole("button", { name: "Reset current game" }));
      await user.click(screen.getByRole("button", { name: "Cancel reset current game" }));

      expect(props.onReset).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Reset current game" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Reset current game" }));
      await user.click(screen.getByRole("button", { name: "Start new game" }));
      await user.click(screen.getByRole("button", { name: "Confirm start new game" }));

      expect(screen.queryByRole("button", { name: "Confirm reset current game" })).not.toBeInTheDocument();
      expect(props.onReset).not.toHaveBeenCalled();
      expect(props.onNewGame).toHaveBeenCalledOnce();
    });

    it("changes card style and reflects a controlled cardStyle prop update", async () => {
      const user = userEvent.setup();
      const props = renderPanel({ cardStyle: "gradient" });

      expect(screen.getByRole("button", { name: "Use gradient card style" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "Use flat card style" })).toHaveAttribute("aria-pressed", "false");

      await user.click(screen.getByRole("button", { name: "Use flat card style" }));
      expect(props.onCardStyleChange).toHaveBeenCalledWith("flat");

      props.rerenderPanel({ cardStyle: "flat" });
      expect(screen.getByRole("button", { name: "Use flat card style" })).toHaveAttribute("aria-pressed", "true");
    });

    it("renders with no Day/Night toggle - the control is always visible in the header instead", () => {
      renderPanel();

      expect(screen.queryByRole("switch", { name: "Track day and night" })).not.toBeInTheDocument();
      expect(screen.queryByText("Day / Night")).not.toBeInTheDocument();
    });

    it("reveals per-player name inputs for exactly the current player count from the Players section", async () => {
      const user = userEvent.setup();
      renderPanel({ playerCount: 2, players: FOUR_PLAYERS.slice(0, 2) });

      expect(screen.queryByLabelText("Player 1 display name")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Edit player names" }));

      expect(screen.getByLabelText("Player 1 display name")).toBeInTheDocument();
      expect(screen.getByLabelText("Player 2 display name")).toBeInTheDocument();
      expect(screen.queryByLabelText("Player 3 display name")).not.toBeInTheDocument();
    });

    it("invokes onDisplayNameChange when a name is edited", async () => {
      const user = userEvent.setup();
      const props = renderPanel({ playerCount: 2, players: FOUR_PLAYERS.slice(0, 2) });

      await user.click(screen.getByRole("button", { name: "Edit player names" }));
      const nameInput = screen.getByLabelText("Player 1 display name");
      await user.type(nameInput, "!");

      expect(props.onDisplayNameChange).toHaveBeenCalledWith("Player 1", "Player 1!");
    });

    it("uses accent-soft for dark-surface accent text and accent-contrast for the filled New Game control", async () => {
      const user = userEvent.setup();
      renderPanel();

      expect(screen.getByRole("button", { name: "Edit player names" })).toHaveClass("text-accent-soft");
      expect(screen.getByRole("button", { name: "Start new game" })).toHaveClass(
        "bg-accent-strong",
        "text-accent-contrast"
      );

      await user.click(screen.getByRole("button", { name: "Set custom starting life" }));
      expect(screen.getByRole("button", { name: "Apply custom starting life" })).toHaveClass("text-accent-soft");
    });

  });
});
