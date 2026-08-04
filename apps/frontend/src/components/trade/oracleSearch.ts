import { levenshteinDistance, normalize } from "../../lib/search";
import type { CardPrices } from "../../lib/trade/loadCardPrices";

export const MIN_TRADE_SEARCH_LENGTH = 3;
const MAX_TYPO_DISTANCE = 2;
const DEFAULT_LIMIT = 8;

export interface OracleSearchEntry {
  oracleId: string;
  name: string;
  normalizedName: string;
  printingCount: number;
}

/**
 * Collapses the printing-price artifact into one searchable row per oracle card,
 * so manual entry resolves a card by name before the printing is chosen.
 */
export function buildOracleSearchIndex(prices: CardPrices): OracleSearchEntry[] {
  const index: OracleSearchEntry[] = [];

  for (const [oracleId, printingIds] of Object.entries(prices.byOracleId)) {
    const firstPrinting = printingIds
      .map((printingId) => prices.printings[printingId] ?? null)
      .find((printing) => printing !== null);

    if (!firstPrinting) continue;

    index.push({
      oracleId,
      name: firstPrinting.name,
      normalizedName: normalize(firstPrinting.name),
      printingCount: printingIds.length
    });
  }

  return index;
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
