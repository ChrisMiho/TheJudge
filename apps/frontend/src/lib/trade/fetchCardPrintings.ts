import { apiBaseUrl } from "../env";

/**
 * One printing's price/identity fields, as served by
 * `GET /api/cards/:oracleId/prices` (REQ-066, REQ-175). No `oracleId`, `name`,
 * or `imageUrl` per printing: the oracle id is the caller's own lookup key,
 * the card name comes from the shared `cardMetadata` index (REQ-174), and the
 * image derives from `id` via `deriveCardImageUrl` (`lib/cardImage.ts`).
 */
export type CardPrintingPrice = {
  id: string;
  set: string;
  setName: string;
  collectorNumber: string;
  /** USD price for the non-foil printing; `null` when the source has no price. */
  usd: number | null;
  /** USD price for the foil printing; `null` when the source has no price. */
  usdFoil: number | null;
};

/** One card's printings, as served by the route — the response minus the
 * echoed `oracleId` the caller already knows (it made the request). */
export type CardPrintingsBlock = {
  snapshotDate: string;
  printings: CardPrintingPrice[];
};

type CacheEntry =
  | { status: "resolved"; value: CardPrintingsBlock | null }
  | { status: "loading"; promise: Promise<CardPrintingsBlock | null> };

// Module-level: one in-memory cache per oracle id, shared by every trade-side
// instance for the life of the page session (FLOW-025) — re-adding or
// re-opening the same card issues no repeat request.
const cache = new Map<string, CacheEntry>();

async function requestCardPrintings(oracleId: string): Promise<CardPrintingsBlock | null> {
  const response = await fetch(`${apiBaseUrl}/api/cards/${encodeURIComponent(oracleId)}/prices`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Card prices request failed with status ${response.status}`);
  }

  const body = (await response.json()) as { snapshotDate: string; printings: CardPrintingPrice[] };
  return { snapshotDate: body.snapshotDate, printings: body.printings };
}

/**
 * Returns the cached printings block for `oracleId` if this session has
 * already resolved it (a successful fetch or a confirmed not-found both
 * count), or `undefined` if it has never been requested or a prior request
 * failed.
 */
export function peekCardPrintings(oracleId: string): CardPrintingsBlock | null | undefined {
  const entry = cache.get(oracleId);
  return entry?.status === "resolved" ? entry.value : undefined;
}

/**
 * Fetches one card's printings and prices by oracle id (REQ-066, REQ-175)
 * from `GET /api/cards/:oracleId/prices`, caching the result (including a
 * confirmed not-found) for the rest of the session. A failed/offline request
 * is not cached, so a retry attempts the fetch again (D7, FLOW-025). An
 * in-flight request is de-duplicated: a second caller for the same oracle id
 * while the first is still pending gets the same promise, not a second
 * request.
 */
export function fetchCardPrintings(oracleId: string): Promise<CardPrintingsBlock | null> {
  const existing = cache.get(oracleId);
  if (existing?.status === "resolved") {
    return Promise.resolve(existing.value);
  }
  if (existing?.status === "loading") {
    return existing.promise;
  }

  const promise = requestCardPrintings(oracleId)
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

/** Test-only escape hatch: the cache is otherwise module-lifetime, matching FLOW-025. */
export function clearCardPrintingsCache(): void {
  cache.clear();
}
