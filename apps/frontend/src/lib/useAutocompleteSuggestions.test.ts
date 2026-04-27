import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CardMetadataItem } from "../types";
import { getSuggestions } from "./search";
import { AUTOCOMPLETE_DEBOUNCE_MS, useAutocompleteSuggestions } from "./useAutocompleteSuggestions";

const cards: CardMetadataItem[] = [
  {
    cardId: "1",
    name: "Lightning Bolt",
    oracleText: "Deal 3 damage.",
    imageUrl: "",
    manaCost: "{R}",
    manaValue: 1,
    typeLine: "Instant",
    colors: ["R"],
    supertypes: [],
    subtypes: []
  },
  {
    cardId: "2",
    name: "Counterspell",
    oracleText: "Counter target spell.",
    imageUrl: "",
    manaCost: "{U}{U}",
    manaValue: 2,
    typeLine: "Instant",
    colors: ["U"],
    supertypes: [],
    subtypes: []
  }
];

describe("useAutocompleteSuggestions", () => {
  it("returns the same suggestions as shared search helper", () => {
    const query = "lig";
    const { result } = renderHook(() => useAutocompleteSuggestions({ cards, query, debounceMs: 0 }));

    expect(result.current).toEqual(getSuggestions(cards, query));
  });

  it("preserves threshold behavior", () => {
    const query = "li";
    const { result } = renderHook(() => useAutocompleteSuggestions({ cards, query, debounceMs: 0 }));

    expect(result.current).toEqual([]);
  });

  it("debounces query updates before computing suggestions", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ query }) => useAutocompleteSuggestions({ cards, query, debounceMs: AUTOCOMPLETE_DEBOUNCE_MS }),
      { initialProps: { query: "li" } }
    );

    expect(result.current).toEqual([]);
    rerender({ query: "lig" });
    expect(result.current).toEqual([]);

    act(() => {
      vi.advanceTimersByTime(AUTOCOMPLETE_DEBOUNCE_MS);
    });

    expect(result.current).toEqual(getSuggestions(cards, "lig"));
    vi.useRealTimers();
  });
});
