import type { CardMetadataItem } from "../types";

export const CARD_METADATA_URL = "/data/cardMetadata.json";

// One download and parse of the card list per page, shared by Quick Question,
// In-Depth Question and the Trade Balancer (NFR-014 tier 3). Screens keep their own
// loading state, failure copy and search index over the shared array.
let loadPromise: Promise<CardMetadataItem[]> | undefined;
let loadedCards: CardMetadataItem[] | undefined;

/** Start the card-list download, or join the one already in flight or finished. */
export function loadCardMetadata(): Promise<CardMetadataItem[]> {
  if (loadPromise) return loadPromise;

  const attempt: Promise<CardMetadataItem[]> = (async () => {
    const response = await fetch(CARD_METADATA_URL);
    if (!response.ok) {
      throw new Error(`Card list fetch failed with status ${response.status}`);
    }
    return (await response.json()) as CardMetadataItem[];
  })().then(
    (cards) => {
      if (loadPromise === attempt) loadedCards = cards;
      return cards;
    },
    (error: unknown) => {
      // A failed download clears the shared load so the next caller fetches fresh.
      if (loadPromise === attempt) loadPromise = undefined;
      throw error;
    }
  );
  loadPromise = attempt;
  return attempt;
}

/** The finished list if it has already arrived, else undefined. */
export function readCardMetadata(): CardMetadataItem[] | undefined {
  return loadedCards;
}

/** Test-only: forget any shared load so no list leaks between tests. */
export function resetCardMetadataForTests(): void {
  loadPromise = undefined;
  loadedCards = undefined;
}
