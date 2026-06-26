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
// Current on-device tuning trial: lock after fewer consistent votes, while retaining
// a longer rolling history so brief no-vote frames do not reset a real card.
export const SCAN_STABILIZER_CONFIG: StabilizerConfig = {
  windowSize: 13,
  minVotes: 3,
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

/** Query-side percentile stretch bounds. DB hashes are never conditioned with these. */
export const QUERY_AUTO_CONTRAST_BLACK_PERCENTILE = 0.5;
export const QUERY_AUTO_CONTRAST_WHITE_PERCENTILE = 99.5;

/** Gray-world query white balance clamps, kept conservative for art with intentional casts. */
export const QUERY_WHITE_BALANCE_MIN_SCALE = 0.65;
export const QUERY_WHITE_BALANCE_MAX_SCALE = 1.45;

/** Neutral high-luma pixels above this point are treated as likely specular glare. */
export const QUERY_GLARE_LUMA_THRESHOLD = 232;
export const QUERY_GLARE_CHROMA_MAX = 12;
export const QUERY_GLARE_TARGET = 220;
export const QUERY_GLARE_COMPRESSION = 0.25;

// --- Frame quality (frameQuality.ts) and best-frame selection (frameSelection.ts) ---
// Pure control-layer signals scored on the warped canonical image's Region A crop,
// used to keep poor frames from feeding noisy votes into the stabilizer (DEC-062).
// Independent of the QUERY_* conditioning constants above, which only affect hashing.

/** Outer ring of the Region A crop (fraction of crop width/height) used for the occlusion signal. */
export const FRAME_QUALITY_BORDER_BAND_FRACTION = 0.12;

/** Normalizes raw Laplacian-variance sharpness into a 0..1 score. */
// 1080p and 640×480 warps produce similar raw Laplacian variance (~2–3); the sharpness contribution
// is small in both cases and the detail score is the dominant quality signal.
export const FRAME_QUALITY_SHARPNESS_NORM = 230;

/** Normalizes raw mean Sobel-magnitude interior detail into a 0..1 score. */
// Real 1080p warp detail scores are ~9–12 raw, same order as 640×480; the assumed 2–3× improvement
// did not materialise in measured frames, so the norm stays at the validated 640×480 baseline.
export const FRAME_QUALITY_DETAIL_NORM = 40;

/** Neutral high-luma pixels above this point count toward a frame's glareFraction. */
export const FRAME_QUALITY_GLARE_LUMA_THRESHOLD = 232;
export const FRAME_QUALITY_GLARE_CHROMA_MAX = 18;

/** Below this mean interior Sobel magnitude, the crop is treated as too flat to judge occlusion (it's a blur/low-detail problem instead). */
export const FRAME_QUALITY_OCCLUSION_MIN_INTERIOR_DETAIL = 5;

/** Weights combining the four sub-scores into one qualityScore; sum to 1. */
export const FRAME_QUALITY_WEIGHT_SHARPNESS = 0.35;
export const FRAME_QUALITY_WEIGHT_DETAIL = 0.25;
export const FRAME_QUALITY_WEIGHT_GLARE = 0.2;
export const FRAME_QUALITY_WEIGHT_OCCLUSION = 0.2;

/** Per-metric thresholds used to label a frame's dominant degrade reason (checked glare, then occlusion, then blur, then low-detail). */
export const FRAME_QUALITY_GLARE_REASON_THRESHOLD = 0.12;
export const FRAME_QUALITY_OCCLUSION_REASON_THRESHOLD = 0.45;
export const FRAME_QUALITY_BLUR_REASON_THRESHOLD = 0.3;
export const FRAME_QUALITY_LOW_DETAIL_REASON_THRESHOLD = 0.25;

/** A frame is acceptable for identification only once its qualityScore clears this bar. */
// 0.45 is the outcome-validated baseline from real device captures; frames that identify correctly
// (e.g. close-up captures at dist≈60) score 0.45–0.47 with the current norms.
export const FRAME_QUALITY_ACCEPT_THRESHOLD = 0.45;

/** Recent warped frames retained by the best-frame selector when choosing which one to identify. */
// Reduced from 5: a 3-frame window is sufficient at higher source resolution (sharper frames converge faster).
export const FRAME_SELECTOR_WINDOW_SIZE = 3;

/** Reversible diagnostic trial: compare against rolling selection without adding a user-facing scanner mode. */
export const FRAME_SELECTOR_CURRENT_FRAME_ONLY_WINDOW_SIZE = 1;
