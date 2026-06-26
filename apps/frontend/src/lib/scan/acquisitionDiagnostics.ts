// acquisitionDiagnostics.ts -- per-frame acquisition diagnostic contract (REQ-057 / DEC-077).
//
// Pure and framework-free: no DOM, React, camera, or backend imports.
// Every stage is optional so callers can assemble diagnostics incrementally.
// Read-only: nothing here participates in matching, voting, lock eligibility,
// API payloads, prompts, or backend behavior.

import type { ConditionReason } from "./frameQuality";

/** Canonical per-frame vote/no-vote reason covering the full acquisition pipeline. */
export type AcquisitionReason =
  | "detector-miss"
  | "quality-abstain"
  | "unresolved-candidate"
  | "distance-above-lock"
  | "margin-below-min"
  | "accepted-vote";

/** Native capture frame info and relevant MediaStreamTrack settings. */
export interface CaptureDiagnostic {
  frameIndex: number;
  timestampMs: number;
  nativeWidth: number;
  nativeHeight: number;
  trackWidth?: number;
  trackHeight?: number;
  trackFrameRate?: number;
  trackFacingMode?: string;
  trackDeviceId?: string;
  trackGroupId?: string;
  trackFocusModeRequested?: string;
  trackFocusMode?: string;
}

/**
 * Detector outcome, card corners, guide rect, and native frame geometry.
 * `corners` is only present when `success` is true. `guideRect` is included
 * when the caller has one, including detector misses.
 */
export interface DetectorDiagnostic {
  success: boolean;
  nativeWidth: number;
  nativeHeight: number;
  maxDetectDimension: number;
  /** 4 corners [[x,y], ...] in native pixel coordinates. */
  corners?: ReadonlyArray<readonly [number, number]>;
  guideRect?: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  retryAttempt?: number;
}

/** Which selector path was chosen for identification, or why it did not choose a frame. */
export type FrameSelectionSource = "current" | "retained-prior" | "abstain";

/** Which frame in the selector window was chosen for identification. */
export type FrameProvenance = Exclude<FrameSelectionSource, "abstain">;

/** Frame selector quality and provenance for one push(). */
export interface FrameSelectionDiagnostic {
  abstain: boolean;
  source: FrameSelectionSource;
  qualityScore: number;
  qualityReason: ConditionReason | null;
  /** Selector experiment path used for this choice; diagnostic-only. */
  selectionMode?: "rolling" | "current-frame-only";
  /** Only present when abstain is false. */
  provenance?: FrameProvenance;
  /** Frames ago the selected frame was pushed; 0 = current frame. */
  selectedFrameAge?: number;
  selectedFrameIndex?: number;
}

/** Resolved oracle-level identity: best/runner-up names, distances, margin. */
export interface IdentityDiagnostic {
  bestName: string | null;
  bestDistance: number | null;
  runnerUpName: string | null;
  runnerUpDistance: number | null;
  margin: number | null;
  /** True when resolveScanCandidatesRanked() returned an empty list. */
  unresolved: boolean;
}

/** Stabilizer vote tally and lock thresholds for one frame. */
export interface StabilizerDiagnostic {
  votesAccumulated: number;
  votesNeeded: number;
  lockDistance: number;
  marginMin: number;
  acceptedLock?: { cardId: string; bestDistance: number };
}

/** Full per-frame acquisition diagnostic. All stages are optional for partial assembly. */
export interface AcquisitionFrameDiagnostic {
  capture?: CaptureDiagnostic;
  detector?: DetectorDiagnostic;
  frameSelection?: FrameSelectionDiagnostic;
  identity?: IdentityDiagnostic;
  stabilizer?: StabilizerDiagnostic;
  /** Present as soon as the pipeline has a concrete vote/no-vote reason. */
  reason?: AcquisitionReason;
}

/** Lock-gate thresholds used by the vote-reason classifier; mirrors StabilizerConfig's gating fields. */
export interface AcquisitionThresholds {
  lockDistance: number;
  marginMin: number;
}

/** Per-frame pipeline outputs needed to classify the vote/no-vote reason. */
export interface VoteReasonInput {
  /** False when the detector found no card outline in the frame. */
  detectorHit: boolean;
  /** True when the frame selector abstained due to low quality. */
  qualityAbstain: boolean;
  /** True when resolveScanCandidatesRanked() returned at least one entry. */
  resolved: boolean;
  /** Best resolved candidate distance; null when no candidates. */
  bestDistance: number | null;
  /**
   * Margin (runner-up distance − best distance) across resolved candidates.
   * Null when fewer than two distinct oracle candidates exist; a null margin
   * skips the margin gate (mirrors stabilizer.ts evaluateFrame behavior).
   */
  margin: number | null;
}

/**
 * Classify the per-frame acquisition reason from pipeline outputs.
 * Pure: does not read or mutate stabilizer state. Thresholds are supplied by
 * the caller so this function has no hidden dependency on SCAN_STABILIZER_CONFIG.
 */
export function classifyVoteReason(input: VoteReasonInput, thresholds: AcquisitionThresholds): AcquisitionReason {
  if (!input.detectorHit) return "detector-miss";
  if (input.qualityAbstain) return "quality-abstain";
  if (!input.resolved || input.bestDistance === null) return "unresolved-candidate";
  if (input.bestDistance > thresholds.lockDistance) return "distance-above-lock";
  if (input.margin !== null && input.margin < thresholds.marginMin) return "margin-below-min";
  return "accepted-vote";
}
