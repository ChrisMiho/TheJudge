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
    it("renders one cell per palette, named by its hover title and accessible name, not a visible label", () => {
      renderThemeSection();

      for (const palette of PALETTES) {
        const cell = screen.getByRole("button", { name: `Theme: ${palette.name}` });
        expect(cell).toHaveAttribute("title", palette.name);
        expect(screen.queryByText(palette.name)).not.toBeInTheDocument();
      }
    });

    // REQ-131/REQ-207 A4: the band's six cells are never narrower than 40px.
    it("renders every cell at least 40px, inside a single scrollable band track", () => {
      renderThemeSection();

      const band = screen.getByRole("group", { name: "Theme palettes" });
      expect(band.className).toContain("overflow-x-auto");

      for (const palette of PALETTES) {
        const cell = screen.getByRole("button", { name: `Theme: ${palette.name}` });
        expect(cell.parentElement).toBe(band);
        expect(cell).toHaveStyle({ minWidth: "40px", width: "40px", height: "40px" });
      }
    });

    it("indicates the active palette with an accent-contrast check, hiding the decorative motif glyph", () => {
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
      expect(leftArrow).toHaveAttribute("hidden");
      expect(rightArrow).toHaveAttribute("hidden");
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
      expect(scrollBySpy).toHaveBeenCalledWith({ left: 80, behavior: "smooth" });

      const leftArrow = container.querySelector('[aria-label="Scroll Theme band left"]') as HTMLElement;
      fireEvent.click(leftArrow);
      expect(scrollBySpy).toHaveBeenCalledWith({ left: -80, behavior: "smooth" });
    });

    it("centers the Colorless custom-color controls under the band", () => {
      renderThemeSection({ paletteId: "colorless" });

      const input = screen.getByLabelText("Customize Colorless color");
      const controlsRow = input.parentElement;

      expect(controlsRow).toHaveClass("justify-center");
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
