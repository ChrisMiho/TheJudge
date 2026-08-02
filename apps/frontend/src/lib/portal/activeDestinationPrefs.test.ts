import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadActiveDestinationId, saveActiveDestinationId } from "./activeDestinationPrefs";

const storageKey = "thejudge.portal.activeDestinationId";
const validIds = ["mtg-assistant", "quick-lookup"] as const;

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

describe("Frontend - Portal", () => {
  describe("activeDestinationPrefs", () => {
    beforeEach(() => {
      vi.stubGlobal("sessionStorage", createMemoryStorage());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("defaults to the first registered destination when nothing is stored", () => {
      expect(loadActiveDestinationId(validIds)).toBe("mtg-assistant");
    });

    it("round-trips a valid destination id", () => {
      saveActiveDestinationId("quick-lookup");

      expect(loadActiveDestinationId(validIds)).toBe("quick-lookup");
    });

    it("falls back to the first registered destination for an unregistered stored value", () => {
      sessionStorage.setItem(storageKey, "deleted-destination");

      expect(loadActiveDestinationId(validIds)).toBe("mtg-assistant");
    });

    it("falls back to the first registered destination when sessionStorage is unavailable", () => {
      vi.stubGlobal("sessionStorage", undefined);

      expect(loadActiveDestinationId(validIds)).toBe("mtg-assistant");
    });

    it("falls back to the first registered destination when sessionStorage reads throw", () => {
      vi.stubGlobal("sessionStorage", {
        ...createMemoryStorage(),
        getItem: () => {
          throw new Error("blocked");
        }
      });

      expect(loadActiveDestinationId(validIds)).toBe("mtg-assistant");
    });

    it("does not throw when sessionStorage writes throw", () => {
      vi.stubGlobal("sessionStorage", {
        ...createMemoryStorage(),
        setItem: () => {
          throw new Error("blocked");
        }
      });

      expect(() => saveActiveDestinationId("quick-lookup")).not.toThrow();
    });
  });
});
