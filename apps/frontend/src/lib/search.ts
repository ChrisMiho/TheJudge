import type { StackItem } from "../types";

export const NO_MATCH_COPY = "No matching card found";

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
  return levenshteinDistance(normalizedCandidate, normalizedQuery) <= 2;
}

export function getSuggestions(cards: StackItem[], query: string): StackItem[] {
  if (query.trim().length < 3) return [];
  return cards.filter((card) => isFuzzyMatch(card.name, query)).slice(0, 3);
}
