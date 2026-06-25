import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PALETTES } from "../lib/theme/palettes";
import { ThemeControl } from "./ThemeControl";

describe("ThemeControl", () => {
  it("renders one swatch per palette, labeled by name, once opened", async () => {
    const user = userEvent.setup();
    render(<ThemeControl paletteId="blue" onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Theme" }));

    for (const palette of PALETTES) {
      expect(screen.getByRole("button", { name: `Theme: ${palette.name}` })).toBeInTheDocument();
    }
  });

  it("indicates the active palette", async () => {
    const user = userEvent.setup();
    render(<ThemeControl paletteId="violet" onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Theme" }));

    expect(screen.getByRole("button", { name: "Theme: Violet" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Theme: Blue" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onSelect with the chosen palette id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ThemeControl paletteId="blue" onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Theme" }));
    await user.click(screen.getByRole("button", { name: "Theme: Emerald" }));

    expect(onSelect).toHaveBeenCalledWith("emerald");
  });

  it("selecting the current palette does not throw", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ThemeControl paletteId="blue" onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Theme" }));
    await user.click(screen.getByRole("button", { name: "Theme: Blue" }));

    expect(onSelect).toHaveBeenCalledWith("blue");
  });
});
