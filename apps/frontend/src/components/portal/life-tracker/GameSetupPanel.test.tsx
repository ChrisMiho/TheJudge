import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { GameSetupPanel } from "./GameSetupPanel";

function renderPanel(overrides: Partial<ComponentProps<typeof GameSetupPanel>> = {}) {
  const props: ComponentProps<typeof GameSetupPanel> = {
    startingLife: 40,
    commanderDamageToLife: false,
    onStartingLifeChange: vi.fn(),
    onCommanderDamageToLifeChange: vi.fn(),
    onReset: vi.fn(),
    onNewGame: vi.fn(),
    ...overrides
  };

  render(<GameSetupPanel {...props} />);
  return props;
}

describe("Frontend - Shared", () => {
  describe("GameSetupPanel", () => {
    it.each([20, 25, 30, 40, 60])("applies the %i-life preset", async (preset) => {
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

    it("applies a valid custom integer", async () => {
      const user = userEvent.setup();
      const props = renderPanel();

      await user.type(screen.getByRole("textbox", { name: "Custom starting life" }), "17");
      await user.click(screen.getByRole("button", { name: "Apply custom starting life" }));

      expect(props.onStartingLifeChange).toHaveBeenCalledWith(17);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it.each(["0", "1000", "1.5", "not-a-number"])("rejects invalid custom value %s", async (value) => {
      const user = userEvent.setup();
      const props = renderPanel();

      await user.type(screen.getByRole("textbox", { name: "Custom starting life" }), value);
      await user.click(screen.getByRole("button", { name: "Apply custom starting life" }));

      expect(props.onStartingLifeChange).not.toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent("Enter a whole number from 1 to 999");
    });

    it("keeps Reset and New Game as explicit actions", async () => {
      const user = userEvent.setup();
      const props = renderPanel();

      await user.click(screen.getByRole("button", { name: "Reset current game" }));
      await user.click(screen.getByRole("button", { name: "Start new game" }));

      expect(props.onReset).toHaveBeenCalledOnce();
      expect(props.onNewGame).toHaveBeenCalledOnce();
    });

    it("changes the commander-damage-to-life game setting", async () => {
      const user = userEvent.setup();
      const props = renderPanel();

      await user.click(screen.getByRole("checkbox", { name: "Commander damage also reduces life" }));

      expect(props.onCommanderDamageToLifeChange).toHaveBeenCalledOnce();
      expect(props.onCommanderDamageToLifeChange).toHaveBeenCalledWith(true);
    });
  });
});
