import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AmbientScene, shouldFallbackToStatic } from "./AmbientScene";
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

const GOLDEN: Record<string, string> = {
  // fingerprints of one seeded still frame, captured before the phone-path change
  green1280: "12865:2093576085",
  greenTray1280: "2998:522468427",
  white390: "193:2897454861",
  white1280: "193:1118732190",
  blue390: "339:883568024",
  blue1280: "207:986954215",
  black390: "1196:1382025930",
  black1280: "22136:310943361",
  red390: "205:352457340",
  red1280: "205:1515807002",
  colorless390: "195:1984659477",
  colorless1280: "217:1736726970"
};

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

  it("falls back to static when most sampled frames run slower than ~45fps", () => {
    // A weak machine: ~30fps (33ms/frame) sustained -> freeze to the still frame.
    const slow = Array.from({ length: 40 }, () => 33);
    expect(shouldFallbackToStatic(slow)).toBe(true);
  });

  it("keeps animating when the machine holds a smooth frame rate", () => {
    const smooth60 = Array.from({ length: 40 }, () => 16.7);
    expect(shouldFallbackToStatic(smooth60)).toBe(false);
    // A solid ~50fps machine (20ms) still animates — it is only borderline, not slow.
    const smooth50 = Array.from({ length: 40 }, () => 20);
    expect(shouldFallbackToStatic(smooth50)).toBe(false);
  });

  it("ignores a short sample (startup jank) and does not downgrade", () => {
    // Too few frames to judge: a couple of slow startup frames must not trip it.
    expect(shouldFallbackToStatic([40, 40, 40])).toBe(false);
  });

  it("tolerates a minority of slow frames (occasional hitches keep animating)", () => {
    const mostlySmooth = [
      ...Array.from({ length: 30 }, () => 16),
      ...Array.from({ length: 8 }, () => 40)
    ];
    expect(shouldFallbackToStatic(mostlySmooth)).toBe(false);
  });

  it("stops its loop when it unmounts", () => {
    mockMatchMedia(false);
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(7);
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    const { unmount } = render(<AmbientScene motif="runes" />);

    unmount();

    expect(cancel).toHaveBeenCalledWith(7);
  });

  describe("green on a phone (REQ-207)", () => {
    const realWidth = window.innerWidth;
    const realHeight = window.innerHeight;

    function setViewport(width: number, height: number): void {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
      Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
    }

    /** One still frame (reduced motion = seeded) of a colour's scene at a viewport. */
    function paintStill(profile: string, width: number, height: number): CallLog {
      mockMatchMedia(true);
      setViewport(width, height);
      document.documentElement.setAttribute("data-profile", profile);
      log.length = 0;
      const { unmount } = render(<AmbientScene motif="leaves" />);
      unmount();
      return [...log];
    }

    /** Deepest point any drawn limb segment reaches (leaf veins use tiny local coordinates). */
    function limbDepth(calls: CallLog): number {
      return Math.max(0, ...calls.filter((c) => c.name === "lineTo").map((c) => Number(c.args[1])));
    }

    function fingerprint(calls: CallLog): string {
      const text = JSON.stringify(calls);
      let hash = 5381;
      for (let i = 0; i < text.length; i += 1) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
      return `${calls.length}:${hash}`;
    }

    afterEach(() => setViewport(realWidth, realHeight));

    it("keeps limbs off the side edges at 390 wide", () => {
      expect(limbDepth(paintStill("green", 390, 844))).toBeLessThan(160);
    });

    it("covers the whole phone band, including 520 to 767 wide", () => {
      for (const width of [520, 600, 767]) {
        expect(limbDepth(paintStill("green", width, 1000))).toBeLessThan(160);
      }
    });

    it("draws fewer leaves on a phone than the same screen without the phone path would", () => {
      const leaves = (calls: CallLog) => calls.filter((c) => c.name === "bezierCurveTo").length;
      expect(leaves(paintStill("green", 390, 844))).toBeLessThan(leaves(paintStill("green", 800, 844)));
    });

    it("leaves green at 768 and wider with its full limbs", () => {
      expect(limbDepth(paintStill("green", 768, 1024))).toBeGreaterThan(200);
      expect(limbDepth(paintStill("green", 1280, 800))).toBeGreaterThan(200);
      expect(fingerprint(paintStill("green", 1280, 800))).toBe(GOLDEN.green1280);
    });

    it("leaves the tray-width tall scene on a wide screen as it was (vines down the edges)", () => {
      mockMatchMedia(true);
      setViewport(1280, 800);
      document.documentElement.setAttribute("data-profile", "green");
      log.length = 0;
      const { unmount } = render(<AmbientScene motif="leaves" variant="tray" />);
      unmount();
      expect(fingerprint([...log])).toBe(GOLDEN.greenTray1280);
    });

    it("renders every non-green scene exactly as before at phone and desktop widths", () => {
      for (const profile of ["white", "blue", "black", "red", "colorless"]) {
        expect(fingerprint(paintStill(profile, 390, 844))).toBe(GOLDEN[`${profile}390`]);
        expect(fingerprint(paintStill(profile, 1280, 800))).toBe(GOLDEN[`${profile}1280`]);
      }
    });
  });
});
