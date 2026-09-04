import { apiBaseUrl } from "./env";

/** One card's descriptive block, fetched on demand by oracle id (REQ-175, FLOW-024). */
export type CardDetailBlock = {
  oracleText: string;
  typeLine: string;
  manaCost: string;
  manaValue: number;
  colors: string[];
  supertypes: string[];
  subtypes: string[];
};

type CacheEntry =
  | { status: "resolved"; value: CardDetailBlock | null }
  | { status: "loading"; promise: Promise<CardDetailBlock | null> };

// Module-level: one in-memory cache per oracle id, shared by every popup/preview
// instance for the life of the page session (FLOW-024) — a reopened card issues
// no repeat request.
const cache = new Map<string, CacheEntry>();

async function requestCardDetail(oracleId: string): Promise<CardDetailBlock | null> {
  const response = await fetch(`${apiBaseUrl}/api/cards/${encodeURIComponent(oracleId)}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Card detail request failed with status ${response.status}`);
  }

  return (await response.json()) as CardDetailBlock;
}

/**
 * Returns the cached descriptive block for `oracleId` if this session has already
 * resolved it (a successful fetch or a confirmed not-found both count), or
 * `undefined` if it has never been requested or a prior request failed. Lets a
 * popup render with no loading flash on a cache hit.
 */
export function peekCardDetail(oracleId: string): CardDetailBlock | null | undefined {
  const entry = cache.get(oracleId);
  return entry?.status === "resolved" ? entry.value : undefined;
}

/**
 * Fetches one card's descriptive block by oracle id (REQ-175) from
 * `GET /api/cards/:oracleId`, caching the result (including a confirmed
 * not-found) for the rest of the session. A failed/offline request is not
 * cached, so a retry attempts the fetch again (A5, A11).
 */
export function fetchCardDetail(oracleId: string): Promise<CardDetailBlock | null> {
  const existing = cache.get(oracleId);
  if (existing?.status === "resolved") {
    return Promise.resolve(existing.value);
  }
  if (existing?.status === "loading") {
    return existing.promise;
  }

  const promise = requestCardDetail(oracleId)
    .then((value) => {
      cache.set(oracleId, { status: "resolved", value });
      return value;
    })
    .catch((error) => {
      cache.delete(oracleId);
      throw error;
    });

  cache.set(oracleId, { status: "loading", promise });
  return promise;
}

/** Test-only escape hatch: the cache is otherwise module-lifetime, matching FLOW-024. */
export function clearCardDetailCache(): void {
  cache.clear();
}
