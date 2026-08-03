import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_PALETTE_ID } from "./palettes";
import {
  loadColorlessCustomRgb,
  loadThemePaletteId,
  removeColorlessCustomRgb,
  saveColorlessCustomRgb,
  saveThemePaletteId
} from "./themePrefs";

const paletteIdStorageKey = "thejudge.theme.paletteId";
const colorlessCustomRgbStorageKey = "thejudge.theme.colorlessCustomRgb";

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

describe("Frontend - Theme", () => {
describe("themePrefs", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("selected palette id", () => {
    it("defaults to the default palette id when nothing is stored", () => {
      expect(loadThemePaletteId()).toBe(DEFAULT_PALETTE_ID);
    });

    it("round-trips a valid palette id", () => {
      saveThemePaletteId("white");
      expect(loadThemePaletteId()).toBe("white");
    });

    it("deletes an unsupported stored id and falls back to the default id", () => {
      localStorage.setItem(paletteIdStorageKey, "not-a-real-palette");

      expect(loadThemePaletteId()).toBe(DEFAULT_PALETTE_ID);
      expect(localStorage.getItem(paletteIdStorageKey)).toBeNull();
    });

    it("deletes a retired palette id and falls back to the default id", () => {
      localStorage.setItem(paletteIdStorageKey, "violet");

      expect(loadThemePaletteId()).toBe(DEFAULT_PALETTE_ID);
      expect(localStorage.getItem(paletteIdStorageKey)).toBeNull();
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

      expect(() => saveThemePaletteId("white")).not.toThrow();
    });
  });

  describe("Colorless custom RGB", () => {
    it("returns no custom value when nothing is stored", () => {
      expect(loadColorlessCustomRgb()).toBeUndefined();
    });

    it("round-trips a valid custom hex value, independently of the selected id", () => {
      saveThemePaletteId("colorless");
      saveColorlessCustomRgb("#ff8800");

      expect(loadColorlessCustomRgb()).toBe("#ff8800");
      expect(localStorage.getItem(paletteIdStorageKey)).toBe("colorless");
      expect(localStorage.getItem(colorlessCustomRgbStorageKey)).toBe("#ff8800");
    });

    it("deletes a malformed stored custom value and returns no custom value", () => {
      localStorage.setItem(colorlessCustomRgbStorageKey, "not-a-hex");

      expect(loadColorlessCustomRgb()).toBeUndefined();
      expect(localStorage.getItem(colorlessCustomRgbStorageKey)).toBeNull();
    });

    it("removes only the custom RGB key on reset", () => {
      saveThemePaletteId("colorless");
      saveColorlessCustomRgb("#ff8800");

      removeColorlessCustomRgb();

      expect(loadColorlessCustomRgb()).toBeUndefined();
      expect(localStorage.getItem(paletteIdStorageKey)).toBe("colorless");
    });

    it("falls back to no custom value when localStorage is unavailable", () => {
      vi.stubGlobal("localStorage", undefined);

      expect(loadColorlessCustomRgb()).toBeUndefined();
    });

    it("falls back to no custom value when localStorage reads throw", () => {
      vi.stubGlobal("localStorage", {
        ...createMemoryStorage(),
        getItem: () => {
          throw new Error("blocked");
        }
      });

      expect(loadColorlessCustomRgb()).toBeUndefined();
    });

    it("does not throw when localStorage writes or removals throw", () => {
      vi.stubGlobal("localStorage", {
        ...createMemoryStorage(),
        setItem: () => {
          throw new Error("blocked");
        },
        removeItem: () => {
          throw new Error("blocked");
        }
      });

      expect(() => saveColorlessCustomRgb("#ff8800")).not.toThrow();
      expect(() => removeColorlessCustomRgb()).not.toThrow();
    });
  });
});
});
