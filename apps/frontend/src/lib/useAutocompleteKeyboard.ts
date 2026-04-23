import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_MIN_QUERY_LENGTH = 3;

type UseAutocompleteKeyboardParams<T> = {
  query: string;
  suggestions: T[];
  onSelect: (suggestion: T) => void;
  minQueryLength?: number;
};

type UseAutocompleteKeyboardResult = {
  activeIndex: number;
  isOpen: boolean;
  setActiveIndex: (index: number) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  closeSuggestions: () => void;
};

export function useAutocompleteKeyboard<T>({
  query,
  suggestions,
  onSelect,
  minQueryLength = DEFAULT_MIN_QUERY_LENGTH
}: UseAutocompleteKeyboardParams<T>): UseAutocompleteKeyboardResult {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [suppressedQuery, setSuppressedQuery] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < minQueryLength || suggestions.length === 0) {
      setIsOpen(false);
      setActiveIndex(-1);
      setSuppressedQuery(null);
      return;
    }

    if (suppressedQuery === query) {
      return;
    }

    setIsOpen(true);
    setActiveIndex((current) => (current >= suggestions.length ? 0 : current));
  }, [minQueryLength, query, suggestions, suppressedQuery]);

  const closeSuggestions = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    setSuppressedQuery(query);
  }, [query]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (query.trim().length < minQueryLength || suggestions.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex((current) => (current >= suggestions.length - 1 ? 0 : current + 1));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
        return;
      }

      if (event.key === "Enter") {
        if (!isOpen || activeIndex < 0 || activeIndex >= suggestions.length) {
          return;
        }

        event.preventDefault();
        onSelect(suggestions[activeIndex]);
        closeSuggestions();
        return;
      }

      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        closeSuggestions();
      }
    },
    [activeIndex, closeSuggestions, isOpen, minQueryLength, onSelect, query, suggestions]
  );

  return {
    activeIndex,
    isOpen,
    setActiveIndex,
    handleKeyDown,
    closeSuggestions
  };
}
