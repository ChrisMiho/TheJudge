import { useEffect, useMemo, useState } from "react";
import type { CardMetadataItem } from "../types";
import { buildSearchIndex, DEFAULT_MIN_QUERY_LENGTH, getSuggestionsFromIndex } from "../lib/search";

export const AUTOCOMPLETE_DEBOUNCE_MS = 60;

type UseAutocompleteSuggestionsParams = {
  cards: CardMetadataItem[];
  query: string;
  debounceMs?: number;
  /** Characters typed before suggestions appear (default 3; Ask a Question's search passes 1, REQ-167). */
  minQueryLength?: number;
};

export function useAutocompleteSuggestions({
  cards,
  query,
  debounceMs = AUTOCOMPLETE_DEBOUNCE_MS,
  minQueryLength = DEFAULT_MIN_QUERY_LENGTH
}: UseAutocompleteSuggestionsParams): CardMetadataItem[] {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const searchIndex = useMemo(() => buildSearchIndex(cards), [cards]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, query]);

  return useMemo(() => getSuggestionsFromIndex(searchIndex, debouncedQuery, minQueryLength), [debouncedQuery, minQueryLength, searchIndex]);
}
