import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PALETTES } from "../lib/theme/palettes";
import { ThemeControl } from "./ThemeControl";

function renderThemeControl(overrides: Partial<React.ComponentProps<typeof ThemeControl>> = {}) {
  return render(
    <ThemeControl
      paletteId="blue"
      onSelect={vi.fn()}
      density="chunky"
      onDensityChange={vi.fn()}
      {...overrides}
    />
  );
}

describe("ThemeControl", () => {
  it("renders one swatch per palette, labeled by name, once opened", async () => {
    const user = userEvent.setup();
    renderThemeControl();

    await user.click(screen.getByRole("button", { name: "Theme" }));

    for (const palette of PALETTES) {
      expect(screen.getByRole("button", { name: `Theme: ${palette.name}` })).toBeInTheDocument();
    }
  });

  it("indicates the active palette", async () => {
    const user = userEvent.setup();
    renderThemeControl({ paletteId: "violet" });

    await user.click(screen.getByRole("button", { name: "Theme" }));

    expect(screen.getByRole("button", { name: "Theme: Violet" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Theme: Blue" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onSelect with the chosen palette id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderThemeControl({ onSelect });

    await user.click(screen.getByRole("button", { name: "Theme" }));
    await user.click(screen.getByRole("button", { name: "Theme: Emerald" }));

    expect(onSelect).toHaveBeenCalledWith("emerald");
  });

  it("selecting the current palette does not throw", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderThemeControl({ onSelect });

    await user.click(screen.getByRole("button", { name: "Theme" }));
    await user.click(screen.getByRole("button", { name: "Theme: Blue" }));

    expect(onSelect).toHaveBeenCalledWith("blue");
  });

  it("renders Chunky and Slim density buttons once opened", async () => {
    const user = userEvent.setup();
    renderThemeControl();

    await user.click(screen.getByRole("button", { name: "Theme" }));

    expect(screen.getByRole("button", { name: "Layout: Chunky" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Layout: Slim" })).toBeInTheDocument();
  });

  it("indicates the active density", async () => {
    const user = userEvent.setup();
    renderThemeControl({ density: "slim" });

    await user.click(screen.getByRole("button", { name: "Theme" }));

    expect(screen.getByRole("button", { name: "Layout: Slim" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Layout: Chunky" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onDensityChange when a density option is clicked", async () => {
    const user = userEvent.setup();
    const onDensityChange = vi.fn();
    renderThemeControl({ onDensityChange });

    await user.click(screen.getByRole("button", { name: "Theme" }));
    await user.click(screen.getByRole("button", { name: "Layout: Slim" }));

    expect(onDensityChange).toHaveBeenCalledWith("slim");
  });
});
