// Portable hash-DB reader. Ported from the Cardomancer ts_scaffold
// (reference/dbformat.py). Pure binary parsing, no decode/network dependency.
//
// Layout (little-endian):
//   0   char[8]  magic = "CARDHSH1"
//   8   uint32   version
//   12  uint32   hash_bytes_per_channel = 32
//   16  uint32   channels = 3
//   20  uint32   entry_count (N)
//   24..  per entry: uint16 id_len, char[id_len] id (UTF-8), uint8[96] hash

import type { HashDb } from "./types";

const MAGIC = "CARDHSH1";
const HASH_BYTES = 96; // 3 channels * 32 bytes
const VERSION = 1;
const HASH_BYTES_PER_CHANNEL = 32;
const CHANNELS = 3;

export function readDb(bytes: Uint8Array): HashDb {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const dec = new TextDecoder();

  const magic = dec.decode(bytes.subarray(0, 8));
  if (magic !== MAGIC) {
    throw new Error(`bad magic ${JSON.stringify(magic)} (expected ${MAGIC})`);
  }
  const hashBytesPerChannel = dv.getUint32(12, true);
  const channels = dv.getUint32(16, true);
  const count = dv.getUint32(20, true);
  if (hashBytesPerChannel !== 32 || channels !== 3) {
    throw new Error(`unsupported geometry: ${channels}ch x ${hashBytesPerChannel}B`);
  }

  const ids: string[] = [];
  const hashes = new Uint8Array(count * HASH_BYTES);
  let off = 24;
  for (let i = 0; i < count; i++) {
    const idLen = dv.getUint16(off, true);
    off += 2;
    ids.push(dec.decode(bytes.subarray(off, off + idLen)));
    off += idLen;
    hashes.set(bytes.subarray(off, off + HASH_BYTES), i * HASH_BYTES);
    off += HASH_BYTES;
  }

  return { ids, hashes, count };
}

export function writeDb(db: HashDb): Uint8Array {
  if (db.count !== db.ids.length) {
    throw new Error(`count mismatch: count=${db.count}, ids=${db.ids.length}`);
  }
  if (db.hashes.length !== db.count * HASH_BYTES) {
    throw new Error(`hash length mismatch: got ${db.hashes.length}, expected ${db.count * HASH_BYTES}`);
  }

  const enc = new TextEncoder();
  const encodedIds = db.ids.map((id) => {
    const encoded = enc.encode(id);
    if (encoded.length > 0xffff) {
      throw new Error(`id is too long for CARDHSH1 uint16 length: ${id}`);
    }
    return encoded;
  });
  const byteLength = 24 + encodedIds.reduce((sum, id) => sum + 2 + id.length + HASH_BYTES, 0);
  const bytes = new Uint8Array(byteLength);
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  bytes.set(enc.encode(MAGIC), 0);
  dv.setUint32(8, VERSION, true);
  dv.setUint32(12, HASH_BYTES_PER_CHANNEL, true);
  dv.setUint32(16, CHANNELS, true);
  dv.setUint32(20, db.count, true);

  let off = 24;
  for (let i = 0; i < db.count; i++) {
    const id = encodedIds[i];
    dv.setUint16(off, id.length, true);
    off += 2;
    bytes.set(id, off);
    off += id.length;
    bytes.set(db.hashes.subarray(i * HASH_BYTES, i * HASH_BYTES + HASH_BYTES), off);
    off += HASH_BYTES;
  }

  return bytes;
}
