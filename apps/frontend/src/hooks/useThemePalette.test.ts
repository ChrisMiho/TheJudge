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

describe("Frontend - Theme", () => {
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

  it("deletes a malformed stored custom Colorless value and resolves to fixed gray on mount", () => {
    localStorage.setItem("thejudge.theme.paletteId", "colorless");
    localStorage.setItem("thejudge.theme.colorlessCustomRgb", "not-a-hex-color");

    const { result } = renderHook(() => useThemePalette());

    expect(result.current.colorlessCustomHex).toBeUndefined();
    expect(result.current.palette.accent).toBe("82 82 91");
    expect(localStorage.getItem("thejudge.theme.colorlessCustomRgb")).toBeNull();
  });

  it("applies the stored palette on mount", () => {
    localStorage.setItem("thejudge.theme.paletteId", "white");

    const { result } = renderHook(() => useThemePalette());

    expect(result.current.paletteId).toBe("white");
    expect(document.documentElement.dataset.theme).toBe("white");
  });

  it("setPalette updates document-root state and persists the selection", () => {
    const { result } = renderHook(() => useThemePalette());

    act(() => {
      result.current.setPalette("green");
    });

    expect(result.current.paletteId).toBe("green");
    expect(document.documentElement.dataset.theme).toBe("green");
    expect(localStorage.getItem("thejudge.theme.paletteId")).toBe("green");
  });

  it("selecting Colorless with no saved custom value applies fixed gray", () => {
    const { result } = renderHook(() => useThemePalette());

    act(() => {
      result.current.setPalette("colorless");
    });

    expect(result.current.paletteId).toBe("colorless");
    expect(result.current.palette.accent).toBe("82 82 91");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("82 82 91");
  });

  it("setColorlessCustom copies the hex unchanged into accent/accent-strong/accent-soft and keeps white contrast", () => {
    const { result } = renderHook(() => useThemePalette());

    act(() => {
      result.current.setPalette("colorless");
    });
    act(() => {
      result.current.setColorlessCustom("#123456");
    });

    expect(result.current.colorlessCustomHex).toBe("#123456");
    expect(result.current.palette.accent).toBe("18 52 86");
    expect(result.current.palette.accentStrong).toBe("18 52 86");
    expect(result.current.palette.accentSoft).toBe("18 52 86");
    expect(result.current.palette.accentContrast).toBe("255 255 255");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("18 52 86");
    expect(document.documentElement.style.getPropertyValue("--accent-strong")).toBe("18 52 86");
    expect(document.documentElement.style.getPropertyValue("--accent-soft")).toBe("18 52 86");
    expect(localStorage.getItem("thejudge.theme.colorlessCustomRgb")).toBe("#123456");
  });

  it("switching away from Colorless and back restores the remembered custom value", () => {
    const { result } = renderHook(() => useThemePalette());

    act(() => {
      result.current.setPalette("colorless");
    });
    act(() => {
      result.current.setColorlessCustom("#123456");
    });
    act(() => {
      result.current.setPalette("green");
    });

    expect(result.current.colorlessCustomHex).toBe("#123456");

    act(() => {
      result.current.setPalette("colorless");
    });

    expect(result.current.palette.accent).toBe("18 52 86");
  });

  it("resetColorlessCustom clears only the custom value and restores fixed Colorless gray", () => {
    const { result } = renderHook(() => useThemePalette());

    act(() => {
      result.current.setPalette("colorless");
    });
    act(() => {
      result.current.setColorlessCustom("#123456");
    });
    act(() => {
      result.current.resetColorlessCustom();
    });

    expect(result.current.colorlessCustomHex).toBeUndefined();
    expect(result.current.paletteId).toBe("colorless");
    expect(result.current.palette.accent).toBe("82 82 91");
    expect(localStorage.getItem("thejudge.theme.colorlessCustomRgb")).toBeNull();
  });

  it("keeps the chosen selection and custom value active for the session when storage writes throw", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("storage unavailable");
      },
      removeItem: () => {
        throw new Error("storage unavailable");
      },
      clear: () => {},
      key: () => null,
      length: 0
    } as unknown as Storage);

    const { result } = renderHook(() => useThemePalette());

    act(() => {
      result.current.setPalette("colorless");
    });
    act(() => {
      result.current.setColorlessCustom("#123456");
    });

    expect(result.current.paletteId).toBe("colorless");
    expect(result.current.colorlessCustomHex).toBe("#123456");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("18 52 86");
  });
});
});
