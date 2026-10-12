// REQ-222 / REQ-235: the one base64-float32 encoding the committed frozen vectors share (the local
// embedder produces float32, so the round trip is exact, and 384 dimensions fit in about 2 KB).

export function encodeVector(vector: ArrayLike<number>): string {
  const floats = Float32Array.from(vector);
  return Buffer.from(floats.buffer, floats.byteOffset, floats.byteLength).toString("base64");
}

export function decodeVector(encoded: string): number[] {
  const bytes = Buffer.from(encoded, "base64");
  const floats = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / Float32Array.BYTES_PER_ELEMENT);
  return Array.from(floats);
}
