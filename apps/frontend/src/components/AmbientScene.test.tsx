import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

type CallLog = { name: string; args: unknown[] }[];

/** A 2D context that records every call and answers gradient/measure requests. */
function createRecordingContext(log: CallLog): CanvasRenderingContext2D {
  const gradient = { addColorStop: vi.fn() };
  const target: Record<string, unknown> = {};
  return new Proxy(target, {
    get(_target, property: string) {
      if (property in target) return target[property];
      return (...args: unknown[]) => {
        log.push({ name: property, args });
        if (property.startsWith("create") && property.endsWith("Gradient")) return gradient;
        return undefined;
      };
    },
    set(_target, property: string, value: unknown) {
      target[property] = value;
      return true;
    }
  }) as unknown as CanvasRenderingContext2D;
}

describe("Frontend - AmbientScene", () => {
  let log: CallLog;

  beforeEach(() => {
    log = [];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => createRecordingContext(log) as unknown as RenderingContext
    );
    document.documentElement.setAttribute("data-profile", "blue");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("data-profile");
  });

  it("renders the mockup's page layer: two haze sheets and one fixed canvas, decorative and non-interactive", () => {
    for (const palette of PALETTES) {
      const { container, unmount } = render(<AmbientScene motif={palette.motif} />);
      const scene = screen.getByTestId("ambient-scene");
      expect(scene).toHaveAttribute("aria-hidden", "true");
      expect(scene.dataset.motif).toBe(palette.motif);
      expect(scene).toHaveClass("ambience");
      expect(container.querySelectorAll(".haze").length).toBe(2);
      expect(container.querySelectorAll("canvas").length).toBe(1);
      expect(scene.querySelectorAll("button, a, input, [role]").length).toBe(0);
      unmount();
    }
  });

  it("renders at full strength behind the page by default and as the Menu tray's whisper copy in the tray", () => {
    const { rerender } = render(<AmbientScene motif="runes" />);
    expect(screen.getByTestId("ambient-scene").dataset.variant).toBe("page");

    rerender(<AmbientScene motif="runes" variant="tray" />);
    const tray = screen.getByTestId("ambient-scene");
    expect(tray.dataset.variant).toBe("tray");
    expect(tray).toHaveClass("tray-flair");
    expect(tray.querySelector("canvas.flair-canvas")).not.toBeNull();
  });

  it("paints one still frame under prefers-reduced-motion and schedules no animation", () => {
    mockMatchMedia(true);
    const raf = vi.spyOn(window, "requestAnimationFrame");
    render(<AmbientScene motif="runes" />);

    expect(log.some((call) => call.name === "clearRect")).toBe(true);
    expect(log.some((call) => call.name === "arc")).toBe(true);
    expect(raf).not.toHaveBeenCalled();
  });

  it("paints the identical still frame every time under reduced motion (seeded)", () => {
    mockMatchMedia(true);
    const first = render(<AmbientScene motif="runes" />);
    const firstFrame = JSON.stringify(log.filter((call) => call.name === "arc"));
    first.unmount();
    log.length = 0;
    render(<AmbientScene motif="runes" />);

    expect(JSON.stringify(log.filter((call) => call.name === "arc"))).toBe(firstFrame);
  });

  it("keeps animating when motion is allowed", () => {
    mockMatchMedia(false);
    const raf = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    render(<AmbientScene motif="runes" />);

    expect(raf).toHaveBeenCalled();
  });

  it("redraws in the new colour when the Theme changes the profile", async () => {
    mockMatchMedia(true);
    render(<AmbientScene motif="runes" />);
    const before = log.length;

    document.documentElement.setAttribute("data-profile", "red");

    await waitFor(() => expect(log.length).toBeGreaterThan(before));
  });

  it("stops its loop when it unmounts", () => {
    mockMatchMedia(false);
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(7);
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    const { unmount } = render(<AmbientScene motif="runes" />);

    unmount();

    expect(cancel).toHaveBeenCalledWith(7);
  });
});
