import { describe, expect, it } from "vitest";
import { CARD_HEIGHT, CARD_WIDTH, REGION_A } from "./identify";
import { scoreFrameQuality } from "./frameQuality";
import { FRAME_QUALITY_BORDER_BAND_FRACTION } from "./tuning";
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

/**
 * Deterministic per-pixel noise (avoids a literal 1px checkerboard, whose
 * diagonal symmetry aliases to a zero Sobel response): a "crisp", well-lit,
 * unoccluded frame. Channels stay within [20, 219] so it never reads as glare.
 */
function noiseChannel(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = (h ^ (h >>> 16)) >>> 0;
  return 20 + (h % 200);
}

function crispPixel(x: number, y: number): [number, number, number] {
  return [noiseChannel(x, y, 1), noiseChannel(x, y, 2), noiseChannel(x, y, 3)];
}

function crispImage(): RgbImage {
  return makeImage(CARD_WIDTH, CARD_HEIGHT, crispPixel);
}

/** A flat, featureless frame: no edges anywhere -- the canonical "blurred" capture. */
function blurredImage(): RgbImage {
  return makeImage(CARD_WIDTH, CARD_HEIGHT, () => [130, 130, 130]);
}

/** Mostly crisp, but a third of Region A is blown-out neutral highlight (specular glare). */
function glareImage(): RgbImage {
  return makeImage(CARD_WIDTH, CARD_HEIGHT, (x, y) => {
    if (y >= REGION_A.y1 && y < REGION_A.y1 + (REGION_A.y2 - REGION_A.y1) / 3) return [245, 245, 245];
    return crispPixel(x, y);
  });
}

/** A smaller washed-out neutral patch: still glare, but below the old blown-out cutoff. */
function washedGlareImage(): RgbImage {
  return makeImage(CARD_WIDTH, CARD_HEIGHT, (x, y) => {
    if (y >= REGION_A.y1 && y < REGION_A.y1 + (REGION_A.y2 - REGION_A.y1) * 0.15) return [232, 232, 232];
    return crispPixel(x, y);
  });
}

/** Crisp interior, but the entire Region A border band is smoothed flat -- a finger over the edge. */
function occludedImage(): RgbImage {
  const regionWidth = REGION_A.x2 - REGION_A.x1;
  const regionHeight = REGION_A.y2 - REGION_A.y1;
  const bandX = Math.max(1, Math.round(regionWidth * FRAME_QUALITY_BORDER_BAND_FRACTION));
  const bandY = Math.max(1, Math.round(regionHeight * FRAME_QUALITY_BORDER_BAND_FRACTION));
  return makeImage(CARD_WIDTH, CARD_HEIGHT, (x, y) => {
    const rx = x - REGION_A.x1;
    const ry = y - REGION_A.y1;
    if (rx >= 0 && rx < regionWidth && ry >= 0 && ry < regionHeight) {
      const inBorder = rx < bandX || rx >= regionWidth - bandX || ry < bandY || ry >= regionHeight - bandY;
      if (inBorder) return [130, 130, 130];
    }
    return crispPixel(x, y);
  });
}

describe("scoreFrameQuality", () => {
  it("scores a crisp, evenly lit frame as acceptable with no condition reason", () => {
    const quality = scoreFrameQuality(crispImage());
    expect(quality.acceptable).toBe(true);
    expect(quality.reason).toBeNull();
    expect(quality.sharpness).toBeGreaterThan(0.5);
    expect(quality.glareFraction).toBe(0);
    expect(quality.occlusionPenalty).toBeLessThan(0.1);
  });

  it("flags a glare-heavy frame with a high glareFraction and a glare reason", () => {
    const quality = scoreFrameQuality(glareImage());
    expect(quality.glareFraction).toBeGreaterThan(0.2);
    expect(quality.reason).toBe("glare");
  });

  it("flags washed neutral glare before it becomes fully clipped", () => {
    const quality = scoreFrameQuality(washedGlareImage());
    expect(quality.glareFraction).toBeGreaterThan(0.12);
    expect(quality.reason).toBe("glare");
    expect(quality.acceptable).toBe(true);
  });

  it("gives a blurred frame lower sharpness and qualityScore than a crisp frame", () => {
    const crisp = scoreFrameQuality(crispImage());
    const blurred = scoreFrameQuality(blurredImage());
    expect(blurred.sharpness).toBeLessThan(crisp.sharpness);
    expect(blurred.qualityScore).toBeLessThan(crisp.qualityScore);
    expect(blurred.acceptable).toBe(false);
  });

  it("represents border occlusion as a quality penalty distinct from uniform blur", () => {
    const crisp = scoreFrameQuality(crispImage());
    const occluded = scoreFrameQuality(occludedImage());
    const blurred = scoreFrameQuality(blurredImage());

    // The interior is still crisp, so this isn't read as a uniformly blurred frame.
    expect(occluded.detailScore).toBeGreaterThan(blurred.detailScore);
    expect(occluded.occlusionPenalty).toBeGreaterThan(crisp.occlusionPenalty);
    expect(occluded.qualityScore).toBeLessThan(crisp.qualityScore);
    expect(occluded.reason).toBe("occlusion");
  });

  it("never produces masked/partial hashing data -- only scalar metrics", () => {
    const quality = scoreFrameQuality(occludedImage());
    expect(Object.keys(quality).sort()).toEqual(
      ["acceptable", "detailScore", "glareFraction", "occlusionPenalty", "qualityScore", "reason", "sharpness"].sort()
    );
  });
});
