import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_PALETTE_ID } from "./palettes";
import { loadThemePaletteId, saveThemePaletteId } from "./themePrefs";

const storageKey = "thejudge.theme.paletteId";

// This project's jsdom environment runs on an opaque origin (no URL configured),
// so `localStorage` is undefined by default. Provide a self-contained in-memory
// store per test — mirrors the pattern used in audioPrefs.test.ts.
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

describe("themePrefs", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to the default palette id when nothing is stored", () => {
    expect(loadThemePaletteId()).toBe(DEFAULT_PALETTE_ID);
  });

  it("round-trips a valid palette id", () => {
    saveThemePaletteId("violet");
    expect(loadThemePaletteId()).toBe("violet");
  });

  it("falls back to the default id for an unsupported stored id", () => {
    localStorage.setItem(storageKey, "not-a-real-palette");

    expect(loadThemePaletteId()).toBe(DEFAULT_PALETTE_ID);
  });

  it("falls back to the default id when localStorage is unavailable", () => {
    vi.stubGlobal("localStorage", undefined);

    expect(loadThemePaletteId()).toBe(DEFAULT_PALETTE_ID);
  });

  it("falls back to the default id when localStorage reads throw", () => {
    vi.stubGlobal("localStorage", {
      ...createMemoryStorage(),
      getItem: () => {
        throw new Error("blocked");
      }
    });

    expect(loadThemePaletteId()).toBe(DEFAULT_PALETTE_ID);
  });

  it("does not throw when localStorage writes throw", () => {
    vi.stubGlobal("localStorage", {
      ...createMemoryStorage(),
      setItem: () => {
        throw new Error("blocked");
      }
    });

    expect(() => saveThemePaletteId("violet")).not.toThrow();
  });
});
