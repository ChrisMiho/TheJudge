import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

const shellCss = readFileSync(resolve(process.cwd(), "src/styles/shell.css"), "utf8");

describe("Frontend - Theme", () => {
  describe("ThemeSection", () => {
    it("renders one cell per palette, named by its hover title and accessible name, not a visible label", () => {
      renderThemeSection();

      for (const palette of PALETTES) {
        const cell = screen.getByRole("button", { name: `Theme: ${palette.name}` });
        expect(cell).toHaveAttribute("title", palette.name);
        expect(screen.queryByText(palette.name)).not.toBeInTheDocument();
      }
    });

    // REQ-131/REQ-207 A4: the band's six cells are never narrower than 40px.
    // Look-matching pass (slice L): cells are 46px tall (shell.css:614-657's
    // `.theme-orb`) — only the height changed, the 40px width/touch-target
    // floor is unchanged.
    it("renders every cell at least 40px wide and 46px tall, inside a single scrollable band track", () => {
      renderThemeSection();

      const band = screen.getByRole("group", { name: "Theme palettes" });
      // `.theme-orbs` scrolls horizontally and `.theme-orb` is at least 40px wide, 46px tall (shell.css).
      expect(band).toHaveClass("theme-orbs");
      expect(shellCss).toMatch(/\.theme-orbs \{[^}]*overflow-x: auto/);
      expect(shellCss).toMatch(/\.theme-orb \{[^}]*min-width: 40px;[^}]*min-height: 46px/s);

      for (const palette of PALETTES) {
        const cell = screen.getByRole("button", { name: `Theme: ${palette.name}` });
        expect(cell.parentElement).toBe(band);
        expect(cell).toHaveClass("theme-orb");
      }
    });

    it("marks the active palette's cell as current (the mockup fills it with the colour's light), not with a check", () => {
      renderThemeSection({ paletteId: "white" });

      const whiteButton = screen.getByRole("button", { name: "Theme: White" });
      const blueButton = screen.getByRole("button", { name: "Theme: Blue" });

      expect(whiteButton).toHaveAttribute("aria-pressed", "true");
      expect(blueButton).toHaveAttribute("aria-pressed", "false");
      expect(whiteButton).toHaveAttribute("data-current", "true");
      expect(blueButton).toHaveAttribute("data-current", "false");
      expect(within(whiteButton).queryByText("✓")).not.toBeInTheDocument();
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

    it("paints each cell from its profile's own colours through the token layer, never an inline colour", () => {
      renderThemeSection({ paletteId: "white" });

      const cell = screen.getByRole("button", { name: "Theme: White" });
      expect(cell.getAttribute("style")).toMatch(/--orb: #ede7d6/);
      expect(cell.getAttribute("style")).toMatch(/--orb-soft: #faf8f2/);
      expect(cell.getAttribute("style")).not.toMatch(/background|color:/);
    });

    it("renders all six cells, including Colorless, in the same band track", () => {
      renderThemeSection({ paletteId: "colorless" });

      const band = screen.getByRole("group", { name: "Theme palettes" });
      const colorlessButton = screen.getByRole("button", { name: "Theme: Colorless" });

      expect(colorlessButton.parentElement).toBe(band);
      expect(within(band).getAllByRole("button", { name: /^Theme: / })).toHaveLength(6);
    });

    // REQ-131/REQ-207: overflow arrows appear only when six 40px cells do not fit the
    // band's own width — jsdom reports 0 for scrollWidth/clientWidth (no real layout), so
    // both read as "nothing to scroll" and neither arrow shows; this asserts the hook (an
    // arrow hidden by default, present but hidden in the DOM, not conditionally unmounted)
    // rather than real overflow geometry, which is exercised manually at A10.
    it("renders both scroll arrows hidden by default (no overflow to scroll)", () => {
      const { container } = renderThemeSection();

      const leftArrow = container.querySelector('[aria-label="Scroll Theme band left"]');
      const rightArrow = container.querySelector('[aria-label="Scroll Theme band right"]');
      expect(container.querySelector(".theme-band")).toHaveAttribute("data-overflow", "false");
      expect(leftArrow).toHaveAttribute("data-off", "true");
      expect(rightArrow).toHaveAttribute("data-off", "true");
    });

    it("scrolls the track left/right when an arrow is activated", () => {
      const { container } = renderThemeSection();

      const band = screen.getByRole("group", { name: "Theme palettes" });
      const scrollBySpy = vi.fn();
      band.scrollBy = scrollBySpy as unknown as typeof band.scrollBy;

      // Arrows stay mounted (just hidden, no overflow in jsdom) rather than conditionally
      // unmounted, the same "stay mounted, just inert/hidden" pattern FeaturePortalMenu's
      // rail-inert rule uses — queried by attribute directly since a `hidden` element is
      // excluded from `getByRole`'s accessible-name lookup by default.
      const rightArrow = container.querySelector('[aria-label="Scroll Theme band right"]') as HTMLElement;
      fireEvent.click(rightArrow);
      expect(scrollBySpy).toHaveBeenCalledWith({ left: 84, behavior: "smooth" });

      const leftArrow = container.querySelector('[aria-label="Scroll Theme band left"]') as HTMLElement;
      fireEvent.click(leftArrow);
      expect(scrollBySpy).toHaveBeenCalledWith({ left: -84, behavior: "smooth" });
    });

    it("centers the Colorless custom-color controls under the band", () => {
      renderThemeSection({ paletteId: "colorless" });

      const input = screen.getByLabelText("Customize Colorless color");
      const controlsRow = input.parentElement;

      expect(controlsRow).toHaveClass("theme-custom");
      expect(controlsRow).toHaveAttribute("data-show", "true");
      expect(shellCss).toMatch(/\.theme-custom \{[^}]*justify-content: center/);
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
