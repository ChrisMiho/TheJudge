import { useMemo } from "react";
import type { CardMetadataItem } from "../types";
import { getSuggestions } from "./search";

type UseAutocompleteSuggestionsParams = {
  cards: CardMetadataItem[];
  query: string;
};

export function useAutocompleteSuggestions({
  cards,
  query
}: UseAutocompleteSuggestionsParams): CardMetadataItem[] {
  return useMemo(() => getSuggestions(cards, query), [cards, query]);
}
