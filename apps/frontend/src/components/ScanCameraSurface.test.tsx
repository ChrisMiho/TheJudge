import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScanCameraSurface } from "./ScanCameraSurface";
import type { ScanConvergence, ScanDebugMetrics } from "../hooks/useScanCapture";
import * as audioPrefs from "../lib/scan/audioPrefs";

// jsdom has no camera; resolve getUserMedia + play so the surface settles to a
// non-error state and the convergence indicator (not "Camera unavailable") shows.
beforeEach(() => {
  globalThis.localStorage?.clear();
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }) }
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const searching: ScanConvergence = {
  phase: "searching",
  leaderName: null,
  votes: 0,
  votesNeeded: 6,
  conditionHint: null
};
const locking: ScanConvergence = {
  phase: "locking",
  leaderName: "Lightning Bolt",
  votes: 3,
  votesNeeded: 6,
  conditionHint: null
};

describe("ScanCameraSurface convergence indicator", () => {
  it("shows searching copy when there is no confident leader", () => {
    render(<ScanCameraSurface onCapture={() => undefined} convergence={searching} />);
    expect(screen.getByText("Searching for a card…")).toBeInTheDocument();
  });

  it("shows the named leader and vote progress while locking", () => {
    render(<ScanCameraSurface onCapture={() => undefined} convergence={locking} />);
    expect(screen.getByText("Locking on Lightning Bolt")).toBeInTheDocument();
    expect(screen.getByText("3/6")).toBeInTheDocument();
  });

  it("no longer leaks the raw camera status copy", () => {
    render(<ScanCameraSurface onCapture={() => undefined} convergence={searching} />);
    expect(screen.queryByText("Scanning")).not.toBeInTheDocument();
    expect(screen.queryByText("No card found")).not.toBeInTheDocument();
    expect(screen.queryByText("No match")).not.toBeInTheDocument();
    expect(screen.queryByText("Ready")).not.toBeInTheDocument();
  });
});

describe("ScanCameraSurface condition hints", () => {
  it("renders a glare hint while searching under glare conditions", () => {
    render(
      <ScanCameraSurface
        onCapture={() => undefined}
        convergence={{ ...searching, conditionHint: "glare" }}
      />
    );
    expect(screen.getByText("Searching for a card…")).toBeInTheDocument();
    expect(screen.getByText("Too much glare — tilt the card")).toBeInTheDocument();
  });

  it("renders a hold-steady hint for a blur reason while searching", () => {
    render(
      <ScanCameraSurface
        onCapture={() => undefined}
        convergence={{ ...searching, conditionHint: "blur" }}
      />
    );
    expect(screen.getByText("Hold steady")).toBeInTheDocument();
  });

  it("renders a move-closer hint for a low-detail reason while searching", () => {
    render(
      <ScanCameraSurface
        onCapture={() => undefined}
        convergence={{ ...searching, conditionHint: "low-detail" }}
      />
    );
    expect(screen.getByText("Move closer")).toBeInTheDocument();
  });

  it("renders an edges-in-view hint for an occlusion reason while searching", () => {
    render(
      <ScanCameraSurface
        onCapture={() => undefined}
        convergence={{ ...searching, conditionHint: "occlusion" }}
      />
    );
    expect(screen.getByText("Keep the card edges in view")).toBeInTheDocument();
  });

  it("does not show a condition hint while locking", () => {
    render(
      <ScanCameraSurface
        onCapture={() => undefined}
        convergence={{ ...locking, conditionHint: "glare" }}
      />
    );
    expect(screen.getByText("Locking on Lightning Bolt")).toBeInTheDocument();
    expect(screen.queryByText("Too much glare — tilt the card")).not.toBeInTheDocument();
  });

  it("does not show a condition hint when there is no reason", () => {
    render(<ScanCameraSurface onCapture={() => undefined} convergence={searching} />);
    expect(screen.queryByText("Too much glare — tilt the card")).not.toBeInTheDocument();
    expect(screen.queryByText("Hold steady")).not.toBeInTheDocument();
  });
});

const debugMetrics: ScanDebugMetrics = {
  phase: "locking",
  bestName: "Lightning Bolt",
  bestDistance: 28,
  runnerUpName: "Shock",
  runnerUpDistance: 95,
  margin: 67,
  votes: 3,
  votesNeeded: 4,
  lockDistance: 78,
  marginMin: 14,
  glareFraction: null,
  sharpness: null,
  frameQualityScore: null,
  conditionReason: null
};

describe("ScanCameraSurface debug overlay toggle", () => {
  it("defaults the debug overlay off (toggle present, overlay not rendered)", () => {
    render(<ScanCameraSurface onCapture={() => undefined} convergence={searching} debug={debugMetrics} />);
    expect(screen.getByRole("button", { name: "Debug" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByTestId("scan-debug-overlay")).not.toBeInTheDocument();
  });

  it("renders the overlay metrics only after the toggle is enabled", () => {
    render(<ScanCameraSurface onCapture={() => undefined} convergence={searching} debug={debugMetrics} />);
    fireEvent.click(screen.getByRole("button", { name: "Debug" }));
    expect(screen.getByTestId("scan-debug-overlay")).toBeInTheDocument();
    expect(screen.getByText("Lightning Bolt (28)")).toBeInTheDocument();
  });
});

describe("ScanCameraSurface confirmation popup", () => {
  it("pops a thumbs-up with the added card name on confirmation", () => {
    render(
      <ScanCameraSurface
        onCapture={() => undefined}
        convergence={searching}
        confirmation={{ id: 1, cardName: "Opt" }}
      />
    );
    expect(screen.getByText("Added Opt")).toBeInTheDocument();
    expect(screen.getByText("👍")).toBeInTheDocument();
  });

  it("does not render the popup without a confirmation", () => {
    render(<ScanCameraSurface onCapture={() => undefined} convergence={searching} />);
    expect(screen.queryByText("👍")).not.toBeInTheDocument();
  });
});

describe("ScanCameraSurface audio confirmation", () => {
  it("plays the bundled ding on a confirmation change when sound is on", () => {
    const playSpy = vi.mocked(HTMLMediaElement.prototype.play);
    const { container, rerender } = render(<ScanCameraSurface onCapture={() => undefined} convergence={searching} />);

    expect(container.querySelector('audio[src="/assets/scanSuccess.wav"]')).toBeInTheDocument();

    playSpy.mockClear();
    rerender(
      <ScanCameraSurface
        onCapture={() => undefined}
        convergence={searching}
        confirmation={{ id: 1, cardName: "Opt" }}
      />
    );

    expect(playSpy).toHaveBeenCalled();
    expect(screen.getByText("Added Opt")).toBeInTheDocument();
  });

  it("does not play the ding on confirmation when sound starts muted", () => {
    vi.spyOn(audioPrefs, "loadScanAudioMuted").mockReturnValue(true);
    const playSpy = vi.mocked(HTMLMediaElement.prototype.play);
    const { rerender } = render(<ScanCameraSurface onCapture={() => undefined} convergence={searching} />);

    playSpy.mockClear();
    rerender(
      <ScanCameraSurface
        onCapture={() => undefined}
        convergence={searching}
        confirmation={{ id: 1, cardName: "Opt" }}
      />
    );

    expect(playSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Added Opt")).toBeInTheDocument();
  });

  it("persists mute toggle changes through an accessible pressed button", () => {
    const saveSpy = vi.spyOn(audioPrefs, "saveScanAudioMuted").mockImplementation(() => undefined);
    render(<ScanCameraSurface onCapture={() => undefined} convergence={searching} />);

    const button = screen.getByRole("button", { name: "Mute scan sound" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Unmute scan sound" })).toBeInTheDocument();
    expect(saveSpy).toHaveBeenCalledWith(true);
  });

  it("silently ignores rejected ding playback while keeping the popup visible", () => {
    const playSpy = vi.mocked(HTMLMediaElement.prototype.play);
    const { rerender } = render(<ScanCameraSurface onCapture={() => undefined} convergence={searching} />);

    playSpy.mockClear();
    playSpy.mockRejectedValue(new Error("blocked"));

    expect(() =>
      rerender(
        <ScanCameraSurface
          onCapture={() => undefined}
          convergence={searching}
          confirmation={{ id: 1, cardName: "Opt" }}
        />
      )
    ).not.toThrow();
    expect(screen.getByText("Added Opt")).toBeInTheDocument();
  });
});
