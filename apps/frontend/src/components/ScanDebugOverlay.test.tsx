import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ScanDebugOverlay } from "./ScanDebugOverlay";
import type { ScanDebugMetrics } from "../hooks/useScanCapture";
import type { Point } from "../lib/scan/detector";

afterEach(cleanup);

const metrics: ScanDebugMetrics = {
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

// A plausible quad in native frame pixels (TL, TR, BR, BL).
const corners: Point[] = [
  { x: 100, y: 80 },
  { x: 540, y: 90 },
  { x: 535, y: 700 },
  { x: 95, y: 690 }
];

describe("ScanDebugOverlay", () => {
  it("renders nothing when there are no metrics", () => {
    const { container } = render(
      <ScanDebugOverlay metrics={null} corners={corners} frameWidth={640} frameHeight={800} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the text metrics and active thresholds when enabled", () => {
    render(<ScanDebugOverlay metrics={metrics} corners={null} frameWidth={null} frameHeight={null} />);
    expect(screen.getByText("locking")).toBeInTheDocument();
    expect(screen.getByText("Lightning Bolt (28)")).toBeInTheDocument();
    expect(screen.getByText("Shock (95)")).toBeInTheDocument();
    expect(screen.getByText("67")).toBeInTheDocument(); // margin
    expect(screen.getByText("3/4")).toBeInTheDocument(); // votes
    expect(screen.getByText("78")).toBeInTheDocument(); // lockDistance
    expect(screen.getByText("14")).toBeInTheDocument(); // marginMin
  });

  it("draws the geometry layer (outline + read region) when corners and frame dims are present", () => {
    render(<ScanDebugOverlay metrics={metrics} corners={corners} frameWidth={640} frameHeight={800} />);
    const geometry = screen.getByTestId("scan-debug-geometry");
    expect(geometry.querySelectorAll("polygon")).toHaveLength(2);
  });

  it("degrades to text-only without crashing when corners are absent", () => {
    render(<ScanDebugOverlay metrics={metrics} corners={null} frameWidth={640} frameHeight={800} />);
    expect(screen.queryByTestId("scan-debug-geometry")).not.toBeInTheDocument();
    expect(screen.getByText("no card geometry")).toBeInTheDocument();
    // Text metrics still render.
    expect(screen.getByText("Lightning Bolt (28)")).toBeInTheDocument();
  });

  it("renders the frame-quality metrics when present", () => {
    const qualityMetrics: ScanDebugMetrics = {
      ...metrics,
      glareFraction: 0.18,
      sharpness: 0.42,
      frameQualityScore: 0.73,
      conditionReason: "glare"
    };
    render(<ScanDebugOverlay metrics={qualityMetrics} corners={null} frameWidth={null} frameHeight={null} />);
    expect(screen.getByText("18%")).toBeInTheDocument(); // glare fraction
    expect(screen.getByText("0.42")).toBeInTheDocument(); // sharpness
    expect(screen.getByText("0.73")).toBeInTheDocument(); // frame quality score
    expect(screen.getByText("glare")).toBeInTheDocument(); // condition reason
  });

  it("shows em-dashes for absent frame-quality metrics", () => {
    render(<ScanDebugOverlay metrics={metrics} corners={null} frameWidth={null} frameHeight={null} />);
    // glare/sharpness/quality/reason all fall back to "—" alongside the existing rows.
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
  });
});
