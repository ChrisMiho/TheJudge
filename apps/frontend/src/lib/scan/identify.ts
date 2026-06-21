// identify.ts -- art-hash identification. Ported from the Cardomancer
// ts_scaffold (reference/identify.py): auto-levels, 180-degree rotation,
// Region A crop, Hamming matching, orientation selection, ranking, and
// __back canonicalization. Hashing is delegated to recipe.ts directly (no
// injected image backend -- the shared recipe is the only resize/hash path).

import { phashRegionPacked } from "./recipe";
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

// --- numpy-compatible 0.5th-percentile (method "linear"), via histogram. ---
function percentile05(channelData: Uint8Array, strideStart: number): number {
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
  const r = 0.005 * (n - 1); // (0.5/100)*(N-1)
  const i = Math.floor(r);
  const frac = r - i;
  const a0 = orderStat(i);
  const a1 = frac > 0 ? orderStat(Math.min(i + 1, n - 1)) : a0;
  return Math.trunc(a0 + frac * (a1 - a0)); // int() truncates
}

/**
 * Per-channel black-point stretch (SPEC.md section 4). QUERY ONLY.
 * Matches reference/identify.py _auto_levels, including the uint8 TRUNCATION
 * (not rounding) of the remapped values.
 */
export function autoLevels(img: RgbImage): RgbImage {
  const { width, height, data } = img;
  const out = new Uint8Array(data); // copy
  for (let ch = 0; ch < 3; ch++) {
    const lo = percentile05(data, ch);
    if (lo < 1) continue;
    const lut = new Uint8Array(256);
    const scale = 255.0 / (255 - lo);
    for (let v = 0; v < 256; v++) {
      lut[v] = v < lo ? 0 : Math.min(255, Math.trunc((v - lo) * scale));
    }
    for (let p = ch; p < out.length; p += 3) out[p] = lut[data[p]];
  }
  return { width, height, data: out };
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
    const leveled = autoLevels(cardImg);
    const hUp = phashRegionPacked(cropRegionA(leveled));
    const hRot = phashRegionPacked(cropRegionA(rotate180(leveled)));
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

    const leveled = autoLevels(cardImg);
    const hUp = phashRegionPacked(cropRegionA(leveled));
    const hRot = phashRegionPacked(cropRegionA(rotate180(leveled)));

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
