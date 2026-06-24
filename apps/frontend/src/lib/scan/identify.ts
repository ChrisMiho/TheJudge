// identify.ts -- art-hash identification. Ported from the Cardomancer
// ts_scaffold (reference/identify.py): auto-levels, 180-degree rotation,
// Region A crop, Hamming matching, orientation selection, ranking, and
// __back canonicalization. Hashing is delegated to recipe.ts directly (no
// injected image backend -- the shared recipe is the only resize/hash path).

import { phashRegionPacked } from "./recipe";
import {
  QUERY_AUTO_CONTRAST_BLACK_PERCENTILE,
  QUERY_AUTO_CONTRAST_WHITE_PERCENTILE,
  QUERY_GLARE_CHROMA_MAX,
  QUERY_GLARE_COMPRESSION,
  QUERY_GLARE_LUMA_THRESHOLD,
  QUERY_GLARE_TARGET,
  QUERY_WHITE_BALANCE_MAX_SCALE,
  QUERY_WHITE_BALANCE_MIN_SCALE
} from "./tuning";
import type { Candidate, HashDb, IdentifyResult, RgbImage } from "./types";

// --- Canonical geometry (SPEC.md section 2) ---
export const CARD_WIDTH = 745;
export const CARD_HEIGHT = 1040;
export const REGION_A = { x1: 30, y1: 105, x2: 715, y2: 520 };

// --- Thresholds, 0..256 scale (SPEC.md section 6.3) ---
export const MATCH_THRESHOLD = 120;
export const CARD_BACK_THRESHOLD = 100;

const BACK_FACE_SUFFIX = "__back";
const CARD_BACK_ID = "_card_back";

// Popcount lookup: byte -> set-bit count.
const POPCOUNT = (() => {
  const t = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let c = 0;
    let v = i;
    while (v) {
      c += v & 1;
      v >>= 1;
    }
    t[i] = c;
  }
  return t;
})();

function canonicalize(id: string): string {
  return id.endsWith(BACK_FACE_SUFFIX) ? id.slice(0, -BACK_FACE_SUFFIX.length) : id;
}

function clampByte(value: number): number {
  if (value <= 0) return 0;
  if (value >= 255) return 255;
  return Math.trunc(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// --- numpy-compatible percentile (method "linear"), via histogram. ---
function percentile(channelData: Uint8Array, strideStart: number, percent: number): number {
  const n = channelData.length / 3; // RGB interleaved
  const hist = new Uint32Array(256);
  for (let i = strideStart; i < channelData.length; i += 3) hist[channelData[i]]++;
  // cumulative -> order statistic lookup
  const orderStat = (k: number): number => {
    let cum = 0;
    for (let v = 0; v < 256; v++) {
      cum += hist[v];
      if (cum > k) return v;
    }
    return 255;
  };
  const r = (percent / 100) * (n - 1);
  const i = Math.floor(r);
  const frac = r - i;
  const a0 = orderStat(i);
  const a1 = frac > 0 ? orderStat(Math.min(i + 1, n - 1)) : a0;
  return Math.trunc(a0 + frac * (a1 - a0)); // int() truncates
}

/**
 * Per-channel black/white-point stretch. QUERY ONLY.
 * Uses uint8 TRUNCATION, not rounding, to keep generated fixtures byte-stable.
 */
export function autoLevels(img: RgbImage): RgbImage {
  const { width, height, data } = img;
  const out = new Uint8Array(data); // copy
  for (let ch = 0; ch < 3; ch++) {
    const lo = percentile(data, ch, QUERY_AUTO_CONTRAST_BLACK_PERCENTILE);
    const hi = percentile(data, ch, QUERY_AUTO_CONTRAST_WHITE_PERCENTILE);
    if (hi <= lo) continue;
    const lut = new Uint8Array(256);
    const scale = 255.0 / (hi - lo);
    for (let v = 0; v < 256; v++) {
      lut[v] = v <= lo ? 0 : v >= hi ? 255 : clampByte((v - lo) * scale);
    }
    for (let p = ch; p < out.length; p += 3) out[p] = lut[data[p]];
  }
  return { width, height, data: out };
}

/** Gray-world per-query white balance with bounded channel scales. */
export function whiteBalanceQueryImage(img: RgbImage): RgbImage {
  const { width, height, data } = img;
  const pixels = width * height;
  if (pixels === 0) return { width, height, data: new Uint8Array(data) };

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  for (let p = 0; p < data.length; p += 3) {
    rSum += data[p];
    gSum += data[p + 1];
    bSum += data[p + 2];
  }

  const means = [rSum / pixels, gSum / pixels, bSum / pixels];
  const target = (means[0] + means[1] + means[2]) / 3;
  const scales = means.map((mean) =>
    mean <= 0
      ? 1
      : clamp(target / mean, QUERY_WHITE_BALANCE_MIN_SCALE, QUERY_WHITE_BALANCE_MAX_SCALE)
  );

  const out = new Uint8Array(data.length);
  for (let p = 0; p < data.length; p += 3) {
    out[p] = clampByte(data[p] * scales[0]);
    out[p + 1] = clampByte(data[p + 1] * scales[1]);
    out[p + 2] = clampByte(data[p + 2] * scales[2]);
  }
  return { width, height, data: out };
}

/** Compress neutral specular highlights in the query image before Region A hashing. */
export function suppressQueryGlare(img: RgbImage): RgbImage {
  const { width, height, data } = img;
  const out = new Uint8Array(data);
  for (let p = 0; p < data.length; p += 3) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < QUERY_GLARE_LUMA_THRESHOLD || max - min > QUERY_GLARE_CHROMA_MAX) continue;

    out[p] = clampByte(QUERY_GLARE_TARGET + (r - QUERY_GLARE_TARGET) * QUERY_GLARE_COMPRESSION);
    out[p + 1] = clampByte(
      QUERY_GLARE_TARGET + (g - QUERY_GLARE_TARGET) * QUERY_GLARE_COMPRESSION
    );
    out[p + 2] = clampByte(
      QUERY_GLARE_TARGET + (b - QUERY_GLARE_TARGET) * QUERY_GLARE_COMPRESSION
    );
  }
  return { width, height, data: out };
}

/** Query-only conditioning pipeline. DB images and persisted hashes must not use this. */
export function conditionQueryImage(img: RgbImage): RgbImage {
  return suppressQueryGlare(autoLevels(whiteBalanceQueryImage(img)));
}

/** Rotate an RGB image 180 degrees. */
export function rotate180(img: RgbImage): RgbImage {
  const { width: w, height: h, data } = img;
  const out = new Uint8Array(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 3;
      const dst = ((h - 1 - y) * w + (w - 1 - x)) * 3;
      out[dst] = data[src];
      out[dst + 1] = data[src + 1];
      out[dst + 2] = data[src + 2];
    }
  }
  return { width: w, height: h, data: out };
}

/** Crop Region A from a canonical card image (clamped to bounds). */
export function cropRegionA(img: RgbImage): RgbImage {
  const { width: w, height: h, data } = img;
  const x1 = REGION_A.x1;
  const y1 = REGION_A.y1;
  const x2 = Math.min(REGION_A.x2, w);
  const y2 = Math.min(REGION_A.y2, h);
  const cw = x2 - x1;
  const ch = y2 - y1;
  const out = new Uint8Array(cw * ch * 3);
  for (let y = 0; y < ch; y++) {
    const srcRow = ((y + y1) * w + x1) * 3;
    out.set(data.subarray(srcRow, srcRow + cw * 3), y * cw * 3);
  }
  return { width: cw, height: ch, data: out };
}

/** Mean per-channel Hamming distance (0..256) between two 96-byte hashes. */
export function regionDistance(q: Uint8Array, db: Uint8Array, dbOff: number): number {
  let r = 0;
  let g = 0;
  let b = 0;
  for (let i = 0; i < 32; i++) {
    r += POPCOUNT[q[i] ^ db[dbOff + i]];
    g += POPCOUNT[q[32 + i] ^ db[dbOff + 32 + i]];
    b += POPCOUNT[q[64 + i] ^ db[dbOff + 64 + i]];
  }
  return (r + g + b) / 3;
}

export class CardIdentifier {
  readonly ids: string[] = [];
  private readonly db: Uint8Array; // N*96
  private readonly cardBack: Uint8Array | null = null;

  constructor(database: HashDb) {
    const keepHashes: Uint8Array[] = [];
    for (let i = 0; i < database.count; i++) {
      const slice = database.hashes.subarray(i * 96, i * 96 + 96);
      if (database.ids[i] === CARD_BACK_ID) {
        this.cardBack = Uint8Array.from(slice);
      } else {
        this.ids.push(database.ids[i]);
        keepHashes.push(Uint8Array.from(slice));
      }
    }
    this.db = new Uint8Array(keepHashes.length * 96);
    keepHashes.forEach((h, i) => this.db.set(h, i * 96));
  }

  /** (is_back, distance). Returns (false, 999) if the DB has no card back. */
  isCardBack(cardImg: RgbImage): { isBack: boolean; distance: number } {
    if (!this.cardBack) return { isBack: false, distance: 999.0 };
    const conditioned = conditionQueryImage(cardImg);
    const hUp = phashRegionPacked(cropRegionA(conditioned));
    const hRot = phashRegionPacked(cropRegionA(rotate180(conditioned)));
    const dist = Math.min(
      regionDistance(hUp, this.cardBack, 0),
      regionDistance(hRot, this.cardBack, 0)
    );
    return { isBack: dist <= CARD_BACK_THRESHOLD, distance: dist };
  }

  /** Identify a canonical 745x1040 RGB card image. Mirrors reference/identify.py. */
  identify(cardImg: RgbImage, topN = 10, threshold = MATCH_THRESHOLD): IdentifyResult {
    const n = this.ids.length;
    if (n === 0) return { matched: false, was_rotated: false, candidates: [] };

    const conditioned = conditionQueryImage(cardImg);
    const hUp = phashRegionPacked(cropRegionA(conditioned));
    const hRot = phashRegionPacked(cropRegionA(rotate180(conditioned)));

    const dUp = new Float64Array(n);
    const dRot = new Float64Array(n);
    let minUp = Infinity;
    let minRot = Infinity;
    for (let i = 0; i < n; i++) {
      dUp[i] = regionDistance(hUp, this.db, i * 96);
      dRot[i] = regionDistance(hRot, this.db, i * 96);
      if (dUp[i] < minUp) minUp = dUp[i];
      if (dRot[i] < minRot) minRot = dRot[i];
    }

    const dists = minUp <= minRot ? dUp : dRot;
    const was_rotated = !(minUp <= minRot);

    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => dists[a] - dists[b]);
    const candidates: Candidate[] = order.slice(0, topN).map((i) => ({
      card_id: canonicalize(this.ids[i]),
      distance: dists[i]
    }));

    const best = candidates.length ? candidates[0].distance : 999.0;
    return { matched: best <= threshold, was_rotated, candidates };
  }
}
