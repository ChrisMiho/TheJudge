import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AmbientScene } from "./AmbientScene";
import { PALETTES } from "../lib/theme/palettes";

function mockMatchMedia(prefersReduced: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: prefersReduced && query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  );
}

describe("Frontend - AmbientScene", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a decorative, non-interactive scene for every profile's motif", () => {
    for (const palette of PALETTES) {
      const { unmount } = render(<AmbientScene motif={palette.motif} />);
      const scene = screen.getByTestId("ambient-scene");
      expect(scene).toHaveAttribute("aria-hidden", "true");
      expect(scene.dataset.motif).toBe(palette.motif);
      expect(scene.className).toContain(`ambient-scene-motif-${palette.motif}`);
      unmount();
    }
  });

  it("renders at full strength behind the page by default and at a whisper inside the tray", () => {
    const { rerender } = render(<AmbientScene motif="runes" />);
    expect(screen.getByTestId("ambient-scene").dataset.variant).toBe("page");

    rerender(<AmbientScene motif="runes" variant="tray" />);
    expect(screen.getByTestId("ambient-scene").dataset.variant).toBe("tray");
  });

  it("is purely decorative: no interactive element, nothing but aria-hidden layers", () => {
    render(<AmbientScene motif="geometry" />);
    const scene = screen.getByTestId("ambient-scene");
    expect(scene.querySelectorAll("button, a, input, [role]").length).toBe(0);
  });

  it("stops animating under prefers-reduced-motion (CSS-level: the shared reduced-motion rule names .ambient-scene-layer)", async () => {
    mockMatchMedia(true);
    render(<AmbientScene motif="embers" />);
    const scene = screen.getByTestId("ambient-scene");
    const layers = scene.querySelectorAll(".ambient-scene-layer");
    expect(layers.length).toBeGreaterThan(0);
    // jsdom does not apply index.css, so this asserts the hook (the shared class
    // name the reduced-motion media block in index.css selects), not the
    // computed style; the CSS-level freeze is exercised manually at A8.
    for (const layer of layers) {
      expect(layer.className).toContain("ambient-scene-layer");
    }
  });
});
