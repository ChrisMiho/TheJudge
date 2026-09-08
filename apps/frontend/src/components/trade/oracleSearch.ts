import { levenshteinDistance, normalize } from "../../lib/search";
import type { CardMetadataItem } from "../../types";

export const MIN_TRADE_SEARCH_LENGTH = 3;
const MAX_TYPO_DISTANCE = 2;
const DEFAULT_LIMIT = 8;

export interface OracleSearchEntry {
  oracleId: string;
  name: string;
  normalizedName: string;
}

/**
 * REQ-065/REQ-174 (Slice D): search over the shared `cardMetadata` index
 * instead of the (now backend-only, per-card-fetched) price artifact —
 * manual search no longer needs price data at all, just name/oracle-id
 * identity, which `cardMetadata` already carries at the unique-card grain
 * (one row per oracle id).
 */
export function buildOracleSearchIndex(cardMetadata: CardMetadataItem[]): OracleSearchEntry[] {
  return cardMetadata.map((card) => ({
    oracleId: card.cardId,
    name: card.name,
    normalizedName: normalize(card.name)
  }));
}

function matchTier(normalizedName: string, normalizedQuery: string): number | null {
  if (normalizedName === normalizedQuery) return 0;
  if (normalizedName.startsWith(normalizedQuery)) return 1;
  if (normalizedName.includes(normalizedQuery)) return 2;
  return null;
}

/** Name search over the oracle index: exact, then prefix, then substring, then typo-tolerant. */
export function searchOracleIndex(
  index: OracleSearchEntry[],
  query: string,
  limit: number = DEFAULT_LIMIT
): OracleSearchEntry[] {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < MIN_TRADE_SEARCH_LENGTH) return [];

  const ranked: { entry: OracleSearchEntry; tier: number; distance: number }[] = [];

  for (const entry of index) {
    const tier = matchTier(entry.normalizedName, normalizedQuery);
    if (tier !== null) {
      ranked.push({ entry, tier, distance: 0 });
      continue;
    }

    if (Math.abs(entry.normalizedName.length - normalizedQuery.length) > MAX_TYPO_DISTANCE) {
      continue;
    }

    const distance = levenshteinDistance(entry.normalizedName, normalizedQuery);
    if (distance <= MAX_TYPO_DISTANCE) {
      ranked.push({ entry, tier: 3, distance });
    }
  }

  return ranked
    .sort(
      (a, b) =>
        a.tier - b.tier ||
        a.distance - b.distance ||
        a.entry.name.localeCompare(b.entry.name)
    )
    .slice(0, limit)
    .map((match) => match.entry);
}
