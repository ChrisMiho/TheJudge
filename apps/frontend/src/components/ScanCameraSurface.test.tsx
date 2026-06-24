import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScanCameraSurface } from "./ScanCameraSurface";
import type { ScanConvergence, ScanDebugMetrics } from "../hooks/useScanCapture";

// jsdom has no camera; resolve getUserMedia + play so the surface settles to a
// non-error state and the convergence indicator (not "Camera unavailable") shows.
beforeEach(() => {
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

const searching: ScanConvergence = { phase: "searching", leaderName: null, votes: 0, votesNeeded: 6 };
const locking: ScanConvergence = { phase: "locking", leaderName: "Lightning Bolt", votes: 3, votesNeeded: 6 };

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
  marginMin: 14
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
