// Binary codec for committed raw-pixel parity fixtures. Decode-free: this
// has no PNG/image dependency, just a fixed 8-byte header (width, height as
// uint32 LE) followed by raw RGB bytes. Used by both the vector-regeneration
// script (scripts/build-scan-vectors.mjs) and the *.test.ts parity tests so
// neither needs a PNG decoder.

import type { RgbImage } from "./types";

const HEADER_BYTES = 8;

export function encodeRawImageFixture(img: RgbImage): Uint8Array {
  const out = new Uint8Array(HEADER_BYTES + img.data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, img.width, true);
  dv.setUint32(4, img.height, true);
  out.set(img.data, HEADER_BYTES);
  return out;
}

export function decodeRawImageFixture(bytes: Uint8Array): RgbImage {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = dv.getUint32(0, true);
  const height = dv.getUint32(4, true);
  const data = bytes.subarray(HEADER_BYTES, HEADER_BYTES + width * height * 3);
  return { width, height, data };
}
