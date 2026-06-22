// tuning.ts -- one place for the scanner's control-layer calibration knobs.
//
// These govern how raw per-frame identification is gated and stabilized into a
// "lock-in" (see stabilizer.ts and useScanCapture.ts). They are first-pass
// estimates to be finalized during real-device validation (DEC-052); keeping
// them isolated here makes calibration a single-file edit with no logic change.

import { DEFAULT_STABILIZER_CONFIG, type StabilizerConfig } from "./stabilizer";

/** Stabilizer window/vote/confidence/margin config used by the capture hook. */
export const SCAN_STABILIZER_CONFIG: StabilizerConfig = DEFAULT_STABILIZER_CONFIG;

/**
 * A frame's best resolved candidate is only surfaced as a live "possible match"
 * hint when its distance is <= this. Above it the match is near-random noise and
 * is suppressed so the picker no longer floods with wrong names. Looser than the
 * stabilizer's lockDistance: a hint may show before there is enough evidence to lock.
 */
export const SURFACE_DISTANCE = 90;

/** Cap on how many live hint candidates are shown while still searching. */
export const MAX_SURFACED_CANDIDATES = 3;
