import type { CardMetadataItem } from "../types";

export const NO_MATCH_COPY = "No matching card found";
const MAX_SUGGESTIONS = 3;
const MAX_TYPO_DISTANCE = 2;

export function normalize(input: string): string {
  return input.trim().toLowerCase();
}

export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array.from({ length: b.length + 1 }, () =>
    Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= b.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const substitutionCost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + substitutionCost
      );
    }
  }

  return matrix[b.length][a.length];
}

export function isFuzzyMatch(candidateName: string, query: string): boolean {
  const normalizedCandidate = normalize(candidateName);
  const normalizedQuery = normalize(query);
  if (normalizedCandidate.includes(normalizedQuery)) return true;
  return levenshteinDistance(normalizedCandidate, normalizedQuery) <= MAX_TYPO_DISTANCE;
}

type MatchTier = 0 | 1 | 2 | 3;

type RankedSuggestion = {
  card: CardMetadataItem;
  matchTier: MatchTier;
  typoDistance: number;
  normalizedName: string;
};

export type SearchIndexEntry = {
  card: CardMetadataItem;
  normalizedName: string;
};

export function buildSearchIndex(cards: CardMetadataItem[]): SearchIndexEntry[] {
  return cards.map((card) => ({
    card,
    normalizedName: normalize(card.name)
  }));
}

function rankSuggestionFromIndex(entry: SearchIndexEntry, normalizedQuery: string): RankedSuggestion | null {
  const { card, normalizedName } = entry;
  if (normalizedName.length === 0) {
    return null;
  }

  if (normalizedName === normalizedQuery) {
    return { card, matchTier: 0, typoDistance: 0, normalizedName };
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return {
      card,
      matchTier: 1,
      typoDistance: levenshteinDistance(normalizedName, normalizedQuery),
      normalizedName
    };
  }

  if (normalizedName.includes(normalizedQuery)) {
    return {
      card,
      matchTier: 2,
      typoDistance: levenshteinDistance(normalizedName, normalizedQuery),
      normalizedName
    };
  }

  const typoDistance = levenshteinDistance(normalizedName, normalizedQuery);
  if (typoDistance > MAX_TYPO_DISTANCE) {
    return null;
  }

  return { card, matchTier: 3, typoDistance, normalizedName };
}

export function getSuggestionsFromIndex(index: SearchIndexEntry[], query: string): CardMetadataItem[] {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 3) return [];

  return index
    .map((entry) => rankSuggestionFromIndex(entry, normalizedQuery))
    .filter((ranked): ranked is RankedSuggestion => ranked !== null)
    .sort((left, right) => {
      if (left.matchTier !== right.matchTier) {
        return left.matchTier - right.matchTier;
      }
      if (left.typoDistance !== right.typoDistance) {
        return left.typoDistance - right.typoDistance;
      }
      if (left.normalizedName !== right.normalizedName) {
        return left.normalizedName.localeCompare(right.normalizedName);
      }
      return left.card.cardId.localeCompare(right.card.cardId);
    })
    .slice(0, MAX_SUGGESTIONS)
    .map((ranked) => ranked.card);
}

export function getSuggestions(cards: CardMetadataItem[], query: string): CardMetadataItem[] {
  return getSuggestionsFromIndex(buildSearchIndex(cards), query);
}
