import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_PALETTE_ID } from "../lib/theme/palettes";
import { useThemePalette } from "./useThemePalette";

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null
  };
}

describe("useThemePalette", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.theme;
    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--accent-strong");
    document.documentElement.style.removeProperty("--accent-soft");
    document.documentElement.style.removeProperty("--accent-contrast");
  });

  it("applies the default palette on mount when nothing is stored", () => {
    const { result } = renderHook(() => useThemePalette());

    expect(result.current.paletteId).toBe(DEFAULT_PALETTE_ID);
    expect(document.documentElement.dataset.theme).toBe(DEFAULT_PALETTE_ID);
  });

  it("applies the stored palette on mount", () => {
    localStorage.setItem("thejudge.theme.paletteId", "violet");

    const { result } = renderHook(() => useThemePalette());

    expect(result.current.paletteId).toBe("violet");
    expect(document.documentElement.dataset.theme).toBe("violet");
  });

  it("setPalette updates document-root state and persists the selection", () => {
    const { result } = renderHook(() => useThemePalette());

    act(() => {
      result.current.setPalette("emerald");
    });

    expect(result.current.paletteId).toBe("emerald");
    expect(document.documentElement.dataset.theme).toBe("emerald");
    expect(localStorage.getItem("thejudge.theme.paletteId")).toBe("emerald");
  });
});
