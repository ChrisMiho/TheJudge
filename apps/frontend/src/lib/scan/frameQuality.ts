// frameQuality.ts -- pure, framework-free quality scoring for a captured/warped
// canonical card image. Feeds the best-frame selector (frameSelection.ts) so
// poor frames abstain or lose priority before hashing (DEC-062). Scored on
// Region A, the same crop identify.ts hashes, so the signal tracks exactly
// what the matcher reads. This is a control-layer/selection signal only: it
// never changes the matching engine or the stabilizer's distance/margin gate,
// and finger occlusion is a quality penalty here, not masked/partial hashing.

import { cropRegionA } from "./identify";
import {
  FRAME_QUALITY_ACCEPT_THRESHOLD,
  FRAME_QUALITY_BLUR_REASON_THRESHOLD,
  FRAME_QUALITY_BORDER_BAND_FRACTION,
  FRAME_QUALITY_DETAIL_NORM,
  FRAME_QUALITY_GLARE_CHROMA_MAX,
  FRAME_QUALITY_GLARE_LUMA_THRESHOLD,
  FRAME_QUALITY_GLARE_REASON_THRESHOLD,
  FRAME_QUALITY_LOW_DETAIL_REASON_THRESHOLD,
  FRAME_QUALITY_OCCLUSION_MIN_INTERIOR_DETAIL,
  FRAME_QUALITY_OCCLUSION_REASON_THRESHOLD,
  FRAME_QUALITY_SHARPNESS_NORM,
  FRAME_QUALITY_WEIGHT_DETAIL,
  FRAME_QUALITY_WEIGHT_GLARE,
  FRAME_QUALITY_WEIGHT_OCCLUSION,
  FRAME_QUALITY_WEIGHT_SHARPNESS
} from "./tuning";
import type { RgbImage } from "./types";

/** Dominant adverse-capture condition for a frame, in priority order when several trip at once. */
export type ConditionReason = "glare" | "occlusion" | "blur" | "low-detail";

export type FrameQuality = {
  /** 0..1, higher = crisper. Laplacian-variance based. */
  sharpness: number;
  /** 0..1, fraction of crop pixels flagged as specular glare. */
  glareFraction: number;
  /** 0..1, interior (non-border) edge/detail density. */
  detailScore: number;
  /** 0..1, border-band detail loss relative to the interior (the occlusion signal). */
  occlusionPenalty: number;
  /** 0..1 weighted combination of the four metrics above; higher = better to identify. */
  qualityScore: number;
  /** Whether qualityScore clears FRAME_QUALITY_ACCEPT_THRESHOLD. */
  acceptable: boolean;
  /** Dominant degrade reason, independent of `acceptable` (DEC-057 additive-diagnostics precedent). */
  reason: ConditionReason | null;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function toGrayscale(img: RgbImage): Float64Array {
  const { width, height, data } = img;
  const gray = new Float64Array(width * height);
  for (let i = 0, p = 0; i < gray.length; i++, p += 3) {
    gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  return gray;
}

/** Sobel gradient magnitude at an interior pixel (caller guarantees in-bounds 3x3 neighborhood). */
function sobelMagnitude(gray: Float64Array, width: number, x: number, y: number): number {
  const i = y * width + x;
  const gx =
    -gray[i - width - 1] -
    2 * gray[i - 1] -
    gray[i + width - 1] +
    gray[i - width + 1] +
    2 * gray[i + 1] +
    gray[i + width + 1];
  const gy =
    -gray[i - width - 1] -
    2 * gray[i - width] -
    gray[i - width + 1] +
    gray[i + width - 1] +
    2 * gray[i + width] +
    gray[i + width + 1];
  return Math.hypot(gx, gy);
}

/** Laplacian response at an interior pixel; its variance over the crop is the sharpness signal. */
function laplacianResponse(gray: Float64Array, width: number, x: number, y: number): number {
  const i = y * width + x;
  return 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - width] - gray[i + width];
}

function isBorderBand(
  x: number,
  y: number,
  width: number,
  height: number,
  bandX: number,
  bandY: number
): boolean {
  return x < bandX || x >= width - bandX || y < bandY || y >= height - bandY;
}

type CropMetrics = {
  sharpness: number;
  glareFraction: number;
  detailScore: number;
  occlusionPenalty: number;
};

function scoreCrop(crop: RgbImage): CropMetrics {
  const { width, height, data } = crop;
  const pixelCount = width * height;

  let glareCount = 0;
  for (let p = 0; p < data.length; p += 3) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max >= FRAME_QUALITY_GLARE_LUMA_THRESHOLD && max - min <= FRAME_QUALITY_GLARE_CHROMA_MAX) {
      glareCount++;
    }
  }
  const glareFraction = pixelCount > 0 ? glareCount / pixelCount : 0;

  const gray = toGrayscale(crop);
  const bandX = Math.max(1, Math.round(width * FRAME_QUALITY_BORDER_BAND_FRACTION));
  const bandY = Math.max(1, Math.round(height * FRAME_QUALITY_BORDER_BAND_FRACTION));

  let lapSum = 0;
  let lapSumSq = 0;
  let lapCount = 0;
  let interiorEdgeSum = 0;
  let interiorEdgeCount = 0;
  let borderEdgeSum = 0;
  let borderEdgeCount = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const lap = laplacianResponse(gray, width, x, y);
      lapSum += lap;
      lapSumSq += lap * lap;
      lapCount++;

      const edge = sobelMagnitude(gray, width, x, y);
      if (isBorderBand(x, y, width, height, bandX, bandY)) {
        borderEdgeSum += edge;
        borderEdgeCount++;
      } else {
        interiorEdgeSum += edge;
        interiorEdgeCount++;
      }
    }
  }

  const lapMean = lapCount > 0 ? lapSum / lapCount : 0;
  const lapVariance = lapCount > 0 ? lapSumSq / lapCount - lapMean * lapMean : 0;
  const sharpness = clamp01(Math.sqrt(Math.max(0, lapVariance)) / FRAME_QUALITY_SHARPNESS_NORM);

  const interiorDetail = interiorEdgeCount > 0 ? interiorEdgeSum / interiorEdgeCount : 0;
  const borderDetail = borderEdgeCount > 0 ? borderEdgeSum / borderEdgeCount : 0;
  const detailScore = clamp01(interiorDetail / FRAME_QUALITY_DETAIL_NORM);
  const occlusionPenalty =
    interiorDetail > FRAME_QUALITY_OCCLUSION_MIN_INTERIOR_DETAIL
      ? clamp01(1 - borderDetail / interiorDetail)
      : 0;

  return { sharpness, glareFraction, detailScore, occlusionPenalty };
}

function determineReason(metrics: CropMetrics): ConditionReason | null {
  if (metrics.glareFraction >= FRAME_QUALITY_GLARE_REASON_THRESHOLD) return "glare";
  if (metrics.occlusionPenalty >= FRAME_QUALITY_OCCLUSION_REASON_THRESHOLD) return "occlusion";
  if (metrics.sharpness <= FRAME_QUALITY_BLUR_REASON_THRESHOLD) return "blur";
  if (metrics.detailScore <= FRAME_QUALITY_LOW_DETAIL_REASON_THRESHOLD) return "low-detail";
  return null;
}

/** Score a canonical (e.g. 745x1040) warped card image's Region A art crop for capture quality. */
export function scoreFrameQuality(image: RgbImage): FrameQuality {
  const metrics = scoreCrop(cropRegionA(image));
  const qualityScore = clamp01(
    FRAME_QUALITY_WEIGHT_SHARPNESS * metrics.sharpness +
      FRAME_QUALITY_WEIGHT_DETAIL * metrics.detailScore +
      FRAME_QUALITY_WEIGHT_GLARE * (1 - metrics.glareFraction) +
      FRAME_QUALITY_WEIGHT_OCCLUSION * (1 - metrics.occlusionPenalty)
  );
  return {
    ...metrics,
    qualityScore,
    acceptable: qualityScore >= FRAME_QUALITY_ACCEPT_THRESHOLD,
    reason: determineReason(metrics)
  };
}
