import { useEffect, useMemo, useState } from "react";
import type { CardMetadataItem } from "../types";
import { buildSearchIndex, getSuggestionsFromIndex } from "./search";

export const AUTOCOMPLETE_DEBOUNCE_MS = 60;

type UseAutocompleteSuggestionsParams = {
  cards: CardMetadataItem[];
  query: string;
  debounceMs?: number;
};

export function useAutocompleteSuggestions({
  cards,
  query,
  debounceMs = AUTOCOMPLETE_DEBOUNCE_MS
}: UseAutocompleteSuggestionsParams): CardMetadataItem[] {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const searchIndex = useMemo(() => buildSearchIndex(cards), [cards]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, query]);

  return useMemo(() => getSuggestionsFromIndex(searchIndex, debouncedQuery), [debouncedQuery, searchIndex]);
}
