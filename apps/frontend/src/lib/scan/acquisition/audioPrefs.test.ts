import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadScanAudioMuted, saveScanAudioMuted } from "../audioPrefs";

const storageKey = "thejudge.scan.audioMuted";

// This project's jsdom environment runs on an opaque origin (no URL configured),
// so `localStorage` is undefined by default. Provide a self-contained in-memory
// store per test — mirrors the `vi.stubGlobal` pattern used in loadScanMap.test.ts.
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

describe("Frontend - Card Scan", () => {
describe("audioPrefs", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to unmuted when nothing is stored", () => {
    expect(loadScanAudioMuted()).toBe(false);
  });

  it("round-trips the muted preference", () => {
    saveScanAudioMuted(true);
    expect(loadScanAudioMuted()).toBe(true);

    saveScanAudioMuted(false);
    expect(loadScanAudioMuted()).toBe(false);
  });

  it("defaults to unmuted for corrupt stored values", () => {
    localStorage.setItem(storageKey, "blocked");

    expect(loadScanAudioMuted()).toBe(false);
  });

  it("defaults to unmuted when localStorage is unavailable", () => {
    vi.stubGlobal("localStorage", undefined);

    expect(loadScanAudioMuted()).toBe(false);
  });

  it("defaults to unmuted when localStorage reads throw", () => {
    vi.stubGlobal("localStorage", {
      ...createMemoryStorage(),
      getItem: () => {
        throw new Error("blocked");
      }
    });

    expect(loadScanAudioMuted()).toBe(false);
  });

  it("does not throw when localStorage writes throw", () => {
    vi.stubGlobal("localStorage", {
      ...createMemoryStorage(),
      setItem: () => {
        throw new Error("blocked");
      }
    });

    expect(() => saveScanAudioMuted(true)).not.toThrow();
  });
});
});
