import { render, screen, within } from "@testing-library/react";
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
      density="chunky"
      onDensityChange={vi.fn()}
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
        const paletteButton = within(paletteGroup).getByRole("button", { name: `Theme: ${palette.name}` });
        expect(paletteButton).toHaveClass("h-10", "w-10", "rounded-full", "motion-focus");
        expect(paletteButton).toHaveAttribute("title", palette.name);
        expect(screen.queryByText(palette.name)).not.toBeInTheDocument();
      }
    });

    it("indicates the active palette", () => {
      renderThemeSection({ paletteId: "violet" });

      const violetButton = screen.getByRole("button", { name: "Theme: Violet" });
      const blueButton = screen.getByRole("button", { name: "Theme: Blue" });

      expect(violetButton).toHaveAttribute("aria-pressed", "true");
      expect(blueButton).toHaveAttribute("aria-pressed", "false");
      expect(within(violetButton).getByText("✓")).toBeInTheDocument();
      expect(within(blueButton).queryByText("✓")).not.toBeInTheDocument();
    });

    it("calls onSelect with the chosen palette id", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      renderThemeSection({ onSelect });

      await user.click(screen.getByRole("button", { name: "Theme: Emerald" }));

      expect(onSelect).toHaveBeenCalledWith("emerald");
    });

    it("selecting the current palette does not throw", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      renderThemeSection({ onSelect });

      await user.click(screen.getByRole("button", { name: "Theme: Blue" }));

      expect(onSelect).toHaveBeenCalledWith("blue");
    });

    it("renders Desktop and Mobile density buttons", () => {
      renderThemeSection();

      expect(screen.getByRole("button", { name: "Layout: Desktop" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Layout: Mobile" })).toBeInTheDocument();
    });

    it("indicates the active density", () => {
      renderThemeSection({ density: "slim" });

      expect(screen.getByRole("button", { name: "Layout: Mobile" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Layout: Desktop" })).toHaveAttribute("aria-pressed", "false");
    });

    it("calls onDensityChange when a density option is clicked", async () => {
      const user = userEvent.setup();
      const onDensityChange = vi.fn();
      renderThemeSection({ onDensityChange });

      await user.click(screen.getByRole("button", { name: "Layout: Mobile" }));

      expect(onDensityChange).toHaveBeenCalledWith("slim");
    });
  });
});
