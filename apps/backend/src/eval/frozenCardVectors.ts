// REQ-235: committed frozen per-card vectors for the offline gates.
//
// Per-card search embeds each card's oracle text on its own (`buildPerCardSearchTexts`). The offline
// gates -- the rules gate (REQ-222), the labelled context-eval checks (REQ-032) and
// `npm run eval:worked-solutions` -- must not call an embedder, so one vector per distinct card text
// is committed here, built by the shipped local embedder
// (`npm run eval:build-frozen-card-vectors`). The store is keyed by a hash of the card text it was
// embedded from, so a card whose text changed in a data refresh no longer finds its vector: the case
// is "awaiting a re-freeze" (reported, never failed), exactly like a changed query text.
//
// Lives under `src/eval/`, never `apps/backend/data/`, so the Lambda package never carries it.
// Encoding: base64 of the little-endian float32 values (the local embedder produces float32, so the
// round trip is exact).

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CardDetailEntry } from "../cardDetail.js";
import { buildPerCardSearchTexts } from "../prompt/preparation.js";
import type { AskAiRequest } from "../types/index.js";
import { decodeVector } from "./vectorEncoding.js";

const currentDir = dirname(fileURLToPath(import.meta.url));

export const FROZEN_CARD_VECTORS_PATH = resolve(currentDir, "frozen-card-vectors.json");

/** `perCardTextKey(text)` (a SHA-256 of the card's search text) -> base64 float32 vector. */
export type FrozenCardVectorFile = Record<string, string>;

let cachedStore: FrozenCardVectorFile | null = null;

/** Reads the committed store; a missing file is an empty store, so cards without a vector are reported, not hidden. */
export function loadFrozenCardVectors(path = FROZEN_CARD_VECTORS_PATH): FrozenCardVectorFile {
  if (path === FROZEN_CARD_VECTORS_PATH && cachedStore) return cachedStore;
  let store: FrozenCardVectorFile = {};
  try {
    store = JSON.parse(readFileSync(path, "utf8")) as FrozenCardVectorFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (path === FROZEN_CARD_VECTORS_PATH) cachedStore = store;
  return store;
}

export type FrozenCardEmbeddings = {
  /** Key (hash of the card text) -> vector, for the request's cards that have a frozen vector. */
  embeddings: Map<string, number[]>;
  /** The request's per-card search texts that have no frozen vector (their cards contribute nothing until re-frozen). */
  missingKeys: string[];
};

/** The frozen vectors for a request's cards, and which cards still lack one. */
export function resolveFrozenCardEmbeddings(
  request: AskAiRequest,
  cardDetailIndex: Map<string, CardDetailEntry>,
  store: FrozenCardVectorFile = loadFrozenCardVectors()
): FrozenCardEmbeddings {
  const embeddings = new Map<string, number[]>();
  const missingKeys: string[] = [];
  for (const card of buildPerCardSearchTexts(request, { cardDetailIndex })) {
    const encoded = store[card.key];
    if (encoded === undefined) missingKeys.push(card.key);
    else embeddings.set(card.key, decodeVector(encoded));
  }
  return { embeddings, missingKeys };
}
