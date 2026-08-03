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
    startingLife: 40,
    players: FOUR_PLAYERS,
    onPlayerCountChange: vi.fn(),
    onLayoutModeChange: vi.fn(),
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
    it("changes player count through the 2-8 pill row and marks the active count", async () => {
      const user = userEvent.setup();
      const props = renderPanel({ playerCount: 4 });
      const controls = screen.getByLabelText("Player count");

      expect(within(controls).getAllByRole("button")).toHaveLength(7);
      expect(within(controls).getByRole("button", { name: "Set player count to 4" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );

      await user.click(within(controls).getByRole("button", { name: "Set player count to 7" }));

      expect(props.onPlayerCountChange).toHaveBeenCalledWith(7);
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

    it("applies a valid custom integer and collapses back to a pill", async () => {
      const user = userEvent.setup();
      const props = renderPanel();

      await user.click(screen.getByRole("button", { name: "Set custom starting life" }));
      await user.type(screen.getByRole("spinbutton", { name: "Custom starting life" }), "55");
      await user.click(screen.getByRole("button", { name: "Apply custom starting life" }));

      expect(props.onStartingLifeChange).toHaveBeenCalledWith(55);
      expect(screen.getByRole("button", { name: "Set custom starting life" })).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it.each(["0", "1000", "1.5", "not-a-number"])("rejects invalid custom value %s", async (value) => {
      const user = userEvent.setup();
      const props = renderPanel();

      await user.click(screen.getByRole("button", { name: "Set custom starting life" }));
      await user.type(screen.getByRole("spinbutton", { name: "Custom starting life" }), value);
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
      await user.type(input, "55");
      await user.keyboard("{Escape}");
      expect(screen.getByRole("button", { name: "Set custom starting life" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Set custom starting life" }));
      await user.type(screen.getByRole("spinbutton", { name: "Custom starting life" }), "55");
      await user.tab();

      expect(screen.getByRole("button", { name: "Set custom starting life" })).toBeInTheDocument();
      expect(props.onStartingLifeChange).not.toHaveBeenCalled();
    });

    it("keeps Reset and New Game as explicit actions", async () => {
      const user = userEvent.setup();
      const props = renderPanel();

      await user.click(screen.getByRole("button", { name: "Reset current game" }));
      await user.click(screen.getByRole("button", { name: "Start new game" }));

      expect(props.onReset).toHaveBeenCalledOnce();
      expect(props.onNewGame).toHaveBeenCalledOnce();
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

  });
});
