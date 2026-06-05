import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAutocompleteKeyboard } from "./useAutocompleteKeyboard";

const suggestions = ["Alpha", "Beta", "Gamma"];

describe("useAutocompleteKeyboard", () => {
  it("opens suggestions when query and list are long enough", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useAutocompleteKeyboard({
        query: "alp",
        suggestions,
        onSelect
      })
    );

    expect(result.current.isOpen).toBe(true);
  });

  it("selects the active suggestion on Enter", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useAutocompleteKeyboard({
        query: "bet",
        suggestions,
        onSelect
      })
    );

    act(() => {
      result.current.setActiveIndex(1);
    });

    act(() => {
      result.current.handleKeyDown({
        key: "Enter",
        preventDefault: vi.fn()
      } as never);
    });

    expect(onSelect).toHaveBeenCalledWith("Beta");
    expect(result.current.isOpen).toBe(false);
  });

  it("closes suggestions on Escape", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useAutocompleteKeyboard({
        query: "gam",
        suggestions,
        onSelect
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "Escape",
        preventDefault: vi.fn()
      } as never);
    });

    expect(result.current.isOpen).toBe(false);
  });
});
