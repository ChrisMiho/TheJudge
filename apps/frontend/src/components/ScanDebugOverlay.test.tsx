import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ScanDebugOverlay } from "./ScanDebugOverlay";
import type { ScanDebugMetrics } from "../hooks/useScanCapture";
import type { AcquisitionFrameDiagnostic } from "../lib/scan/acquisitionDiagnostics";
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

const acquisitionDiagnostic: AcquisitionFrameDiagnostic = {
  reason: "detector-miss",
  capture: {
    frameIndex: 7,
    timestampMs: 1234,
    nativeWidth: 1280,
    nativeHeight: 720,
    trackWidth: 1920,
    trackHeight: 1080,
    trackFrameRate: 30,
    trackFacingMode: "environment",
    trackDeviceId: "device-a",
    trackGroupId: "group-a",
    trackFocusMode: "continuous"
  },
  detector: {
    success: false,
    nativeWidth: 1280,
    nativeHeight: 720,
    maxDetectDimension: 640,
    guideRect: { x: 402, y: 65, width: 476, height: 590 }
  }
};

const votingAcquisitionDiagnostic: AcquisitionFrameDiagnostic = {
  reason: "accepted-vote",
  frameSelection: {
    abstain: false,
    source: "retained-prior",
    qualityScore: 0.82,
    qualityReason: null,
    provenance: "retained-prior",
    selectedFrameAge: 2,
    selectedFrameIndex: 11
  },
  identity: {
    bestName: "Opt",
    bestDistance: 7,
    runnerUpName: "Consider",
    runnerUpDistance: 35,
    margin: 28,
    unresolved: false
  },
  stabilizer: {
    votesAccumulated: 2,
    votesNeeded: 3,
    lockDistance: 78,
    marginMin: 14
  }
};

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

  it("renders capture and detector acquisition diagnostics when present", () => {
    render(
      <ScanDebugOverlay
        metrics={metrics}
        corners={null}
        frameWidth={null}
        frameHeight={null}
        acquisitionDiagnostic={acquisitionDiagnostic}
      />
    );

    expect(screen.getByText("7")).toBeInTheDocument(); // frame index
    expect(screen.getByText("1280×720")).toBeInTheDocument(); // native capture size
    expect(screen.getByText("1920×1080")).toBeInTheDocument(); // track size
    expect(screen.getByText("environment")).toBeInTheDocument();
    expect(screen.getByText("continuous")).toBeInTheDocument();
    expect(screen.getByText("miss")).toBeInTheDocument();
    expect(screen.getByText("detector-miss")).toBeInTheDocument();
    expect(screen.getByText("640")).toBeInTheDocument(); // detector max dimension
    expect(screen.getByText("402,65 476×590")).toBeInTheDocument(); // guide rect
  });

  it("renders selector, identity, and vote acquisition diagnostics when present", () => {
    render(
      <ScanDebugOverlay
        metrics={null}
        corners={null}
        frameWidth={null}
        frameHeight={null}
        acquisitionDiagnostic={votingAcquisitionDiagnostic}
      />
    );

    expect(screen.getByText("accepted-vote")).toBeInTheDocument();
    expect(screen.getByText("retained-prior")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // selected frame age
    expect(screen.getByText("0.82")).toBeInTheDocument(); // selector quality
    expect(screen.getByText("Opt (7)")).toBeInTheDocument();
    expect(screen.getByText("Consider (35)")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument(); // identity margin
    expect(screen.getByText("2/3")).toBeInTheDocument(); // stabilizer vote progress
  });

  it("degrades missing acquisition diagnostic fields to dashes", () => {
    render(
      <ScanDebugOverlay
        metrics={metrics}
        corners={null}
        frameWidth={null}
        frameHeight={null}
        acquisitionDiagnostic={{ detector: { success: true, nativeWidth: 320, nativeHeight: 240, maxDetectDimension: 640 } }}
      />
    );

    expect(screen.getByText("hit")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(6);
  });
});
