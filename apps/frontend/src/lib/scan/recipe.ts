// recipe.ts -- the single authoritative resize + perceptual-hash definition.
//
// Imported by both the on-device identifier (identify.ts) and the offline
// fingerprint-library builder (Slice B) so the two sides cannot drift
// (DEC-051: parity by construction). The reference implementation
// (reference/phash.py) resizes with PIL LANCZOS; we deliberately do not try
// to bit-match PIL. Instead this module defines one deterministic separable
// resampler, used identically on both sides, and the golden vectors are
// regenerated from it (see scripts/build-scan-vectors.mjs).

import type { Plane, RgbImage } from "./types";

export const HASH_SIZE = 16; // 16x16 = 256-bit hash per channel
export const HIGHFREQ_FACTOR = 4;
export const IMG_SIZE = HASH_SIZE * HIGHFREQ_FACTOR; // 64 -- resize target before DCT

// --- Unnormalized DCT-II basis matrix D, 64x64, row-major.
//     D[k][m] = 2 * cos(pi * k * (2m+1) / (2*64))
const DCT_MATRIX = (() => {
  const n = IMG_SIZE;
  const m = new Float64Array(n * n);
  for (let k = 0; k < n; k++) {
    for (let j = 0; j < n; j++) {
      m[k * n + j] = 2.0 * Math.cos((Math.PI * k * (2 * j + 1)) / (2 * n));
    }
  }
  return m;
})();

/** Per-axis linear (bilinear) resample weights: half-pixel-center mapping, clamped at edges. */
function linearResampleWeights(
  srcLen: number,
  dstLen: number
): { lo: Int32Array; hi: Int32Array; frac: Float64Array } {
  const lo = new Int32Array(dstLen);
  const hi = new Int32Array(dstLen);
  const frac = new Float64Array(dstLen);
  const scale = srcLen / dstLen;
  for (let d = 0; d < dstLen; d++) {
    const srcPos = (d + 0.5) * scale - 0.5;
    const base = Math.floor(srcPos);
    lo[d] = Math.min(Math.max(base, 0), srcLen - 1);
    hi[d] = Math.min(Math.max(base + 1, 0), srcLen - 1);
    frac[d] = srcPos - base;
  }
  return { lo, hi, frac };
}

/**
 * Resize a single-channel plane to 64x64 via a deterministic separable
 * bilinear resampler (horizontal pass, then vertical pass). Parity-critical:
 * the on-device identifier and the offline DB builder must call this same
 * function so query and database hashes are computed identically.
 */
export function resizeToGray64(plane: Plane): Float64Array {
  const { width: srcW, height: srcH, data } = plane;
  const dst = IMG_SIZE;

  const hx = linearResampleWeights(srcW, dst);
  const horizontal = new Float64Array(dst * srcH);
  for (let y = 0; y < srcH; y++) {
    const rowOff = y * srcW;
    const outRowOff = y * dst;
    for (let x = 0; x < dst; x++) {
      const a = data[rowOff + hx.lo[x]];
      const b = data[rowOff + hx.hi[x]];
      horizontal[outRowOff + x] = a + (b - a) * hx.frac[x];
    }
  }

  const vy = linearResampleWeights(srcH, dst);
  const out = new Float64Array(dst * dst);
  for (let y = 0; y < dst; y++) {
    const rowLo = vy.lo[y] * dst;
    const rowHi = vy.hi[y] * dst;
    const frac = vy.frac[y];
    const outRowOff = y * dst;
    for (let x = 0; x < dst; x++) {
      const a = horizontal[rowLo + x];
      const b = horizontal[rowHi + x];
      out[outRowOff + x] = a + (b - a) * frac;
    }
  }

  return out;
}

/**
 * 2-D DCT-II of a 64x64 plane (= D @ P @ D^T), returning only the top-left
 * 16x16 low-frequency block (row-major, length 256).
 */
function dctTopLeft16(plane: Float64Array): Float64Array {
  const n = IMG_SIZE;
  const h = HASH_SIZE;
  // M[m][l] = sum_n P[m][n] * D[l][n]   (m: 0..63, l: 0..15)
  const mid = new Float64Array(n * h);
  for (let mi = 0; mi < n; mi++) {
    const prow = mi * n;
    for (let l = 0; l < h; l++) {
      let s = 0;
      const drow = l * n;
      for (let j = 0; j < n; j++) s += plane[prow + j] * DCT_MATRIX[drow + j];
      mid[mi * h + l] = s;
    }
  }
  // out[k][l] = sum_m D[k][m] * M[m][l]   (k: 0..15, l: 0..15)
  const out = new Float64Array(h * h);
  for (let k = 0; k < h; k++) {
    const drow = k * n;
    for (let l = 0; l < h; l++) {
      let s = 0;
      for (let mi = 0; mi < n; mi++) s += DCT_MATRIX[drow + mi] * mid[mi * h + l];
      out[k * h + l] = s;
    }
  }
  return out;
}

/** Median over all 256 values, DC term INCLUDED (numpy even-length median). */
function median256(values: Float64Array): number {
  const sorted = Float64Array.from(values).sort();
  return (sorted[127] + sorted[128]) / 2;
}

/** Pack 256 booleans into 32 bytes, MSB-first per byte (numpy.packbits default). */
function packBitsMSB(bits: Uint8Array): Uint8Array {
  const out = new Uint8Array(32);
  for (let i = 0; i < 256; i++) {
    if (bits[i]) out[i >> 3] |= 1 << (7 - (i & 7));
  }
  return out;
}

/** Canonical pHash of a 64x64 grayscale plane -> packed 32 bytes. */
export function phashGray64Packed(gray64: Float64Array): Uint8Array {
  const low = dctTopLeft16(gray64);
  const med = median256(low);
  const bits = new Uint8Array(256);
  for (let i = 0; i < 256; i++) bits[i] = low[i] > med ? 1 : 0;
  return packBitsMSB(bits);
}

/** Extract one channel (0=R,1=G,2=B) of an RGB image as a Plane. */
function extractChannel(img: RgbImage, ch: 0 | 1 | 2): Plane {
  const { width, height, data } = img;
  const out = new Uint8Array(width * height);
  for (let i = 0, p = ch; i < out.length; i++, p += 3) out[i] = data[p];
  return { width, height, data: out };
}

/** Hash an RGB region's three channels -> packed 96 bytes (R[32]|G[32]|B[32]). */
export function phashRegionPacked(region: RgbImage): Uint8Array {
  const out = new Uint8Array(96);
  for (let ch = 0 as 0 | 1 | 2; ch < 3; ch = (ch + 1) as 0 | 1 | 2) {
    const gray64 = resizeToGray64(extractChannel(region, ch));
    out.set(phashGray64Packed(gray64), ch * 32);
  }
  return out;
}

/** Convenience: the packed 96-byte hash as three lowercase hex strings. */
export function phashRegionHex(region: RgbImage): string[] {
  const packed = phashRegionPacked(region);
  const hex = (a: Uint8Array) => Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
  return [hex(packed.subarray(0, 32)), hex(packed.subarray(32, 64)), hex(packed.subarray(64, 96))];
}
