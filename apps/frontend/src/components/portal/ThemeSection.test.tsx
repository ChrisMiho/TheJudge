import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { PALETTES } from "../../lib/theme/palettes";
import { ThemeSection } from "./ThemeSection";

function renderThemeSection(overrides: Partial<ComponentProps<typeof ThemeSection>> = {}) {
  return render(
    <ThemeSection
      paletteId="blue"
      onSelect={vi.fn()}
      colorlessCustomHex={undefined}
      onColorlessCustomChange={vi.fn()}
      onColorlessReset={vi.fn()}
      {...overrides}
    />
  );
}

describe("Frontend - Theme", () => {
  describe("ThemeSection", () => {
    it("renders one swatch per palette, labeled by name", () => {
      renderThemeSection();

      for (const palette of PALETTES) {
        expect(screen.getByRole("button", { name: `Theme: ${palette.name}` })).toBeInTheDocument();
      }
    });

    it("renders the palettes as one compact row of circular controls without visible names", () => {
      renderThemeSection();

      const paletteGroup = screen.getByRole("group", { name: "Theme palettes" });
      expect(paletteGroup).toHaveClass("grid-cols-5", "gap-0.5");

      for (const palette of PALETTES) {
        const paletteButton = screen.getByRole("button", { name: `Theme: ${palette.name}` });
        expect(paletteButton).toHaveClass("h-10", "w-10", "rounded-full", "motion-focus");
        expect(paletteButton).toHaveAttribute("title", palette.name);
        expect(screen.queryByText(palette.name)).not.toBeInTheDocument();
      }
    });

    it("indicates the active palette", () => {
      renderThemeSection({ paletteId: "white" });

      const whiteButton = screen.getByRole("button", { name: "Theme: White" });
      const blueButton = screen.getByRole("button", { name: "Theme: Blue" });

      expect(whiteButton).toHaveAttribute("aria-pressed", "true");
      expect(blueButton).toHaveAttribute("aria-pressed", "false");
      expect(within(whiteButton).getByText("✓")).toBeInTheDocument();
      expect(within(blueButton).queryByText("✓")).not.toBeInTheDocument();
    });

    it("calls onSelect with the chosen palette id", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      renderThemeSection({ onSelect });

      await user.click(screen.getByRole("button", { name: "Theme: Green" }));

      expect(onSelect).toHaveBeenCalledWith("green");
    });

    it("selecting the current palette does not throw", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      renderThemeSection({ onSelect });

      await user.click(screen.getByRole("button", { name: "Theme: Blue" }));

      expect(onSelect).toHaveBeenCalledWith("blue");
    });

    it("keeps Theme palette-only", () => {
      renderThemeSection();

      expect(screen.queryByText("Layout")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Layout:/ })).not.toBeInTheDocument();
    });

    it("renders the six profiles in exact WUBRGC order", () => {
      renderThemeSection();

      const buttons = screen.getAllByRole("button", { name: /^Theme: / });
      expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
        "Theme: White",
        "Theme: Blue",
        "Theme: Black",
        "Theme: Red",
        "Theme: Green",
        "Theme: Colorless"
      ]);
    });

    it("derives the active profile's check mark from accent-contrast so White stays readable", () => {
      renderThemeSection({ paletteId: "white" });

      const whiteCheck = within(screen.getByRole("button", { name: "Theme: White" })).getByText("✓");
      expect(whiteCheck).toHaveClass("text-accent-contrast");
    });

    it("renders the native color input and Reset to gray only when Colorless is active", () => {
      renderThemeSection({ paletteId: "colorless" });

      expect(screen.getByLabelText("Customize Colorless color")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reset to gray" })).toBeInTheDocument();
    });

    it("does not render Colorless customization controls for any fixed profile", () => {
      for (const paletteId of ["white", "blue", "black", "red", "green"]) {
        const { unmount } = renderThemeSection({ paletteId });

        expect(screen.queryByLabelText("Customize Colorless color")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Reset to gray" })).not.toBeInTheDocument();

        unmount();
      }
    });

    it("reflects the remembered custom value in the native input and calls back on change", () => {
      const onColorlessCustomChange = vi.fn();
      renderThemeSection({
        paletteId: "colorless",
        colorlessCustomHex: "#112233",
        onColorlessCustomChange
      });

      const input = screen.getByLabelText("Customize Colorless color") as HTMLInputElement;
      expect(input.value).toBe("#112233");

      fireEvent.change(input, { target: { value: "#445566" } });
      expect(onColorlessCustomChange).toHaveBeenCalledWith("#445566");
    });

    it("falls back to the fixed Colorless swatch in the native input when no custom value is saved", () => {
      renderThemeSection({ paletteId: "colorless", colorlessCustomHex: undefined });

      const input = screen.getByLabelText("Customize Colorless color") as HTMLInputElement;
      expect(input.value.toLowerCase()).toBe("#71717a");
    });

    it("calls onColorlessReset when Reset to gray is clicked", async () => {
      const user = userEvent.setup();
      const onColorlessReset = vi.fn();
      renderThemeSection({ paletteId: "colorless", onColorlessReset });

      await user.click(screen.getByRole("button", { name: "Reset to gray" }));

      expect(onColorlessReset).toHaveBeenCalledTimes(1);
    });
  });
});
