// Shared types for the on-device card identification core.
// Ported from the Cardomancer ts_scaffold (reference/identify.py, reference/dbformat.py).

/** An RGB image: row-major, 3 bytes/pixel, length = width*height*3. */
export interface RgbImage {
  width: number;
  height: number;
  data: Uint8Array; // RGB RGB RGB ...
}

/** A single 8-bit channel plane: row-major, length = width*height. */
export interface Plane {
  width: number;
  height: number;
  data: Uint8Array;
}

/** A loaded hash database (portable cardhashes.bin -> memory). */
export interface HashDb {
  ids: string[]; // length N (may include "<id>__back" and "_card_back")
  hashes: Uint8Array; // flat, 96 bytes per entry (R[32]|G[32]|B[32]); length N*96
  count: number; // N
}

/** One ranked identification candidate. */
export interface Candidate {
  card_id: string; // canonical front-face id (__back stripped)
  distance: number; // mean per-channel Hamming, 0..256 (lower = closer)
}

/** Result of identify(). Mirrors reference/identify.py CardIdentifier.identify(). */
export interface IdentifyResult {
  matched: boolean; // best distance <= MATCH_THRESHOLD
  was_rotated: boolean; // the 180-degree orientation won
  candidates: Candidate[]; // sorted ascending by distance, length <= top_n
}
