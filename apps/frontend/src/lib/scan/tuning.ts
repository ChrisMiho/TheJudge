// tuning.ts -- one place for the scanner's control-layer calibration knobs.
//
// These govern how raw per-frame identification is gated and stabilized into a
// "lock-in" (see stabilizer.ts and useScanCapture.ts). They are first-pass
// estimates to be finalized during real-device validation (DEC-052); keeping
// them isolated here makes calibration a single-file edit with no logic change.

import type { StabilizerConfig } from "./stabilizer";

/** Stabilizer window/vote/confidence/margin config used by the capture hook. */
// Tuned to lock readily on a clearly-leading card; one-tap removal (DEC-058) is the
// safety net (DEC-059, amends DEC-056). Round 1 was strict ("essentially never wrong")
// but too hard to lock on real devices, so the attainability knobs (window / votes /
// lockDistance) are loosened from 8 / 6 / 70 toward the stabilizer defaults, while the
// runner-up margin guard (marginMin) is retained as the primary false-lock protection.
// First-pass loosened starting points; final values are outcome-validated in Slice E
// against both intended (phone) and adverse (webcam / fingers / noise) conditions.
export const SCAN_STABILIZER_CONFIG: StabilizerConfig = {
  windowSize: 6,
  minVotes: 4,
  lockDistance: 78,
  marginMin: 14
};

/**
 * A frame's best resolved candidate is only surfaced as a live "possible match"
 * hint when its distance is <= this. Above it the match is near-random noise and
 * is suppressed so the picker no longer floods with wrong names. Looser than the
 * stabilizer's lockDistance: a hint may show before there is enough evidence to lock.
 */
export const SURFACE_DISTANCE = 90;

/** Cap on how many live hint candidates are shown while still searching. */
export const MAX_SURFACED_CANDIDATES = 3;
