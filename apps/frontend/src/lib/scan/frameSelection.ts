// frameSelection.ts -- best-frame selection over a short rolling window of
// warped canonical card images (DEC-062). Scores each incoming frame with
// frameQuality.ts and either hands back the best acceptable frame currently
// retained, or abstains with the dominant condition reason so the caller can
// skip identification and feed the stabilizer no candidates for that tick.
//
// Pure and framework-free: no camera, no DOM, no React state. Mirrors the
// ScanStabilizer shape (push() / reset()) so it can be unit-tested the same
// way -- additive/control-layer only, it never touches the matching engine or
// the stabilizer's distance/margin gate.

import { scoreFrameQuality, type FrameQuality } from "./frameQuality";
import { FRAME_SELECTOR_WINDOW_SIZE } from "./tuning";
import type { RgbImage } from "./types";

export type FrameSelection =
  | { abstain: false; image: RgbImage; quality: FrameQuality }
  | { abstain: true; quality: FrameQuality };

type WindowEntry = { image: RgbImage; quality: FrameQuality };

export class FrameSelector {
  private readonly windowSize: number;
  private readonly window: WindowEntry[] = [];

  constructor(windowSize: number = FRAME_SELECTOR_WINDOW_SIZE) {
    this.windowSize = windowSize;
  }

  /** Score and retain one warped frame; return the best acceptable frame in the window, or abstain. */
  push(image: RgbImage): FrameSelection {
    const quality = scoreFrameQuality(image);
    this.window.push({ image, quality });
    while (this.window.length > this.windowSize) this.window.shift();

    let best: WindowEntry | null = null;
    for (const entry of this.window) {
      if (!entry.quality.acceptable) continue;
      if (!best || entry.quality.qualityScore > best.quality.qualityScore) best = entry;
    }

    if (best) return { abstain: false, image: best.image, quality: best.quality };
    return { abstain: true, quality };
  }

  /** Clear the retained window (called on accept / rescan / close, alongside the stabilizer). */
  reset(): void {
    this.window.length = 0;
  }
}
