import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_LAYOUT_DENSITY } from "./layoutDensity";
import { loadLayoutDensity, saveLayoutDensity } from "./layoutDensityPrefs";

const storageKey = "thejudge.theme.layoutDensity";

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
describe("layoutDensityPrefs", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to chunky when nothing is stored", () => {
    expect(loadLayoutDensity()).toBe(DEFAULT_LAYOUT_DENSITY);
    expect(loadLayoutDensity()).toBe("chunky");
  });

  it("round-trips a valid density value", () => {
    saveLayoutDensity("slim");
    expect(loadLayoutDensity()).toBe("slim");
  });

  it("round-trips chunky", () => {
    saveLayoutDensity("chunky");
    expect(loadLayoutDensity()).toBe("chunky");
  });

  it("falls back to chunky for an unsupported stored value", () => {
    localStorage.setItem(storageKey, "ultra-compact");

    expect(loadLayoutDensity()).toBe("chunky");
  });

  it("falls back to chunky when localStorage is unavailable", () => {
    vi.stubGlobal("localStorage", undefined);

    expect(loadLayoutDensity()).toBe("chunky");
  });

  it("falls back to chunky when localStorage reads throw", () => {
    vi.stubGlobal("localStorage", {
      ...createMemoryStorage(),
      getItem: () => {
        throw new Error("blocked");
      }
    });

    expect(loadLayoutDensity()).toBe("chunky");
  });

  it("does not throw when localStorage writes throw", () => {
    vi.stubGlobal("localStorage", {
      ...createMemoryStorage(),
      setItem: () => {
        throw new Error("blocked");
      }
    });

    expect(() => saveLayoutDensity("slim")).not.toThrow();
  });
});
});
