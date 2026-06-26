import { describe, expect, it } from "vitest";
import { CARD_HEIGHT, CARD_WIDTH, REGION_A } from "./identify";
import { FrameSelector } from "./frameSelection";
import type { RgbImage } from "./types";

function makeImage(
  width: number,
  height: number,
  pixel: (x: number, y: number) => [number, number, number]
): RgbImage {
  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      const p = (y * width + x) * 3;
      data[p] = r;
      data[p + 1] = g;
      data[p + 2] = b;
    }
  }
  return { width, height, data };
}

/** Deterministic per-pixel noise, never reads as glare: a "best", high-quality frame. */
function noiseChannel(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = (h ^ (h >>> 16)) >>> 0;
  return 20 + (h % 200);
}

function crispPixel(x: number, y: number): [number, number, number] {
  return [noiseChannel(x, y, 1), noiseChannel(x, y, 2), noiseChannel(x, y, 3)];
}

/** Same crisp noise plus a small glare strip: still acceptable, but a lower score than bestImage(). */
function goodImage(): RgbImage {
  return makeImage(CARD_WIDTH, CARD_HEIGHT, (x, y) => {
    if (y >= REGION_A.y1 && y < REGION_A.y1 + (REGION_A.y2 - REGION_A.y1) * 0.15) return [245, 245, 245];
    return crispPixel(x, y);
  });
}

function bestImage(): RgbImage {
  return makeImage(CARD_WIDTH, CARD_HEIGHT, crispPixel);
}

/** A flat, featureless frame: always below the acceptance bar. */
function poorImage(): RgbImage {
  return makeImage(CARD_WIDTH, CARD_HEIGHT, () => [130, 130, 130]);
}

describe("FrameSelector", () => {
  it("returns the single acceptable frame pushed", () => {
    const selector = new FrameSelector();
    const selection = selector.push(bestImage());
    expect(selection.abstain).toBe(false);
    if (!selection.abstain) {
      expect(selection.quality.acceptable).toBe(true);
      expect(selection.provenance).toBe("current");
      expect(selection.selectedFrameAge).toBe(0);
      expect(selection.selectedFrameIndex).toBe(1);
    }
  });

  it("picks the highest-quality acceptable frame currently retained, regardless of arrival order", () => {
    const selector = new FrameSelector();
    const good = goodImage();
    const best = bestImage();

    selector.push(good);
    const selection = selector.push(best);

    expect(selection.abstain).toBe(false);
    if (!selection.abstain) {
      expect(selection.image).toBe(best);
      expect(selection.quality.qualityScore).toBeGreaterThan(scoreOf(good));
      expect(selection.provenance).toBe("current");
      expect(selection.selectedFrameAge).toBe(0);
      expect(selection.selectedFrameIndex).toBe(2);
    }
  });

  it("keeps preferring an earlier best frame over a later, lower-quality acceptable frame", () => {
    const selector = new FrameSelector();
    const best = bestImage();
    const good = goodImage();

    selector.push(best);
    const selection = selector.push(good);

    expect(selection.abstain).toBe(false);
    if (!selection.abstain) {
      expect(selection.image).toBe(best);
      expect(selection.provenance).toBe("retained-prior");
      expect(selection.selectedFrameAge).toBe(1);
      expect(selection.selectedFrameIndex).toBe(1);
    }
  });

  it("abstains with a condition reason when every retained frame is poor", () => {
    const selector = new FrameSelector();
    selector.push(poorImage());
    const selection = selector.push(poorImage());

    expect(selection.abstain).toBe(true);
    if (selection.abstain) {
      expect(selection.quality.acceptable).toBe(false);
      expect(selection.quality.reason).toBe("blur");
      expect(selection.provenance).toBe("abstain");
      expect(selection.selectedFrameAge).toBeNull();
      expect(selection.selectedFrameIndex).toBeNull();
    }
  });

  it("evicts a good frame once it falls outside the retained window", () => {
    const selector = new FrameSelector(2);
    selector.push(bestImage());
    selector.push(poorImage());
    const selection = selector.push(poorImage());

    expect(selection.abstain).toBe(true);
  });

  it("reset() clears the retained window", () => {
    const selector = new FrameSelector();
    selector.push(bestImage());
    selector.reset();
    const selection = selector.push(poorImage());

    expect(selection.abstain).toBe(true);
  });
});

function scoreOf(image: RgbImage): number {
  // Re-score independently of any selector's internal state, purely to compare against.
  const probe = new FrameSelector();
  const selection = probe.push(image);
  return selection.quality.qualityScore;
}
