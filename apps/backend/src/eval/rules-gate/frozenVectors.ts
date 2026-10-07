// REQ-222: committed frozen query vectors for the offline prompt gate.
//
// One vector per rules test case, built once by the shipped local embedder
// (`npm run eval:build-rules-gate-vectors`) from the exact retrieval query text
// production embeds (`buildRetrievalQueryText`: the question plus each attached
// card's compact signal), so the gate ranks rules the way production does
// without a live embedding call. This follows REQ-181's
// `fixtures/frozen-query-embeddings.json`. A lexical pass gives 14/18 on the
// first-ship cases, not production's 16/18, so frozen vectors are required.
//
// Each vector is stored with a SHA-256 hash of the query text it was embedded
// from. When a card-data refresh changes a case's query text (a keyword added
// to a card, say), the stored hash no longer matches, and the case is "awaiting
// a re-freeze": the gate reports it and skips it in the ratchet instead of
// failing, so a data refresh never fails the weekly `data:refresh-pr`.
//
// Encoding: a vector is base64 of its little-endian float32 values. The local
// embedder produces float32, so the round trip is exact, and 384 dimensions fit
// in about 2 KB instead of the 9 KB a JSON number array takes.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CardDetailEntry } from "../../cardDetail.js";
import { buildRetrievalQueryText } from "../../prompt/preparation.js";
import type { AskAiRequest } from "../../types/index.js";

const currentDir = dirname(fileURLToPath(import.meta.url));

/** Under `src/eval/`, never `apps/backend/data/`, so the Lambda package never carries it. */
export const FROZEN_VECTORS_PATH = resolve(currentDir, "frozen-query-vectors.json");

export type FrozenVectorEntry = {
  /** SHA-256 of the retrieval query text this vector was embedded from. */
  queryTextHash: string;
  /** Base64 of the vector's little-endian float32 values. */
  vector: string;
};

export type FrozenVectorFile = Record<string, FrozenVectorEntry>;

export function hashQueryText(queryText: string): string {
  return createHash("sha256").update(queryText, "utf8").digest("hex");
}

/** The retrieval query text production would embed for this request. */
export function buildCaseQueryText(request: AskAiRequest, cardDetailIndex: Map<string, CardDetailEntry>): string {
  return buildRetrievalQueryText(request, { cardDetailIndex });
}

export function encodeVector(vector: ArrayLike<number>): string {
  const floats = Float32Array.from(vector);
  return Buffer.from(floats.buffer, floats.byteOffset, floats.byteLength).toString("base64");
}

export function decodeVector(encoded: string): number[] {
  const bytes = Buffer.from(encoded, "base64");
  const floats = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / Float32Array.BYTES_PER_ELEMENT);
  return Array.from(floats);
}

/** Reads the committed vector file; a missing file is an empty set, so a fresh corpus fails loudly per case. */
export function loadFrozenVectors(path = FROZEN_VECTORS_PATH): FrozenVectorFile {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as FrozenVectorFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

export type ReFreezeCheck =
  | { state: "missing" }
  | { state: "awaiting-refreeze"; storedHash: string; currentHash: string }
  | { state: "fresh"; vector: number[] };

/**
 * The one re-freeze check (A5): rebuilds the case's retrieval query text,
 * hashes it, and compares it with the hash stored beside its vector. The
 * offline gate and the staleness report both call it; nothing re-implements it.
 * `missing` (no vector at all) fails the gate; `awaiting-refreeze` never does.
 */
export function checkReFreeze(
  caseId: string,
  request: AskAiRequest,
  cardDetailIndex: Map<string, CardDetailEntry>,
  vectors: FrozenVectorFile
): ReFreezeCheck {
  const entry = vectors[caseId];
  if (!entry) return { state: "missing" };
  const currentHash = hashQueryText(buildCaseQueryText(request, cardDetailIndex));
  if (currentHash !== entry.queryTextHash) {
    return { state: "awaiting-refreeze", storedHash: entry.queryTextHash, currentHash };
  }
  return { state: "fresh", vector: decodeVector(entry.vector) };
}
