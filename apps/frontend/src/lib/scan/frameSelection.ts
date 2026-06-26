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
import type { FrameProvenance } from "./acquisitionDiagnostics";
import type { RgbImage } from "./types";

export type FrameSelection =
  | {
      abstain: false;
      image: RgbImage;
      quality: FrameQuality;
      provenance: FrameProvenance;
      selectedFrameAge: number;
      selectedFrameIndex: number;
    }
  | { abstain: true; quality: FrameQuality; provenance: "abstain"; selectedFrameAge: null; selectedFrameIndex: null };

type WindowEntry = { image: RgbImage; quality: FrameQuality; frameIndex: number };

export class FrameSelector {
  private readonly windowSize: number;
  private readonly window: WindowEntry[] = [];
  private frameIndex = 0;

  constructor(windowSize: number = FRAME_SELECTOR_WINDOW_SIZE) {
    this.windowSize = windowSize;
  }

  /** Score and retain one warped frame; return the best acceptable frame in the window, or abstain. */
  push(image: RgbImage): FrameSelection {
    this.frameIndex += 1;
    const frameIndex = this.frameIndex;
    const quality = scoreFrameQuality(image);
    this.window.push({ image, quality, frameIndex });
    while (this.window.length > this.windowSize) this.window.shift();

    let best: WindowEntry | null = null;
    for (const entry of this.window) {
      if (!entry.quality.acceptable) continue;
      if (!best || entry.quality.qualityScore > best.quality.qualityScore) best = entry;
    }

    if (best) {
      const selectedFrameAge = frameIndex - best.frameIndex;
      return {
        abstain: false,
        image: best.image,
        quality: best.quality,
        provenance: selectedFrameAge === 0 ? "current" : "retained-prior",
        selectedFrameAge,
        selectedFrameIndex: best.frameIndex
      };
    }
    return { abstain: true, quality, provenance: "abstain", selectedFrameAge: null, selectedFrameIndex: null };
  }

  /** Clear the retained window (called on accept / rescan / close, alongside the stabilizer). */
  reset(): void {
    this.window.length = 0;
    this.frameIndex = 0;
  }
}
