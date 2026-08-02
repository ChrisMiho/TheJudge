import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useActiveDestination } from "./useActiveDestination";

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
  describe("useActiveDestination", () => {
    beforeEach(() => {
      vi.stubGlobal("sessionStorage", createMemoryStorage());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("lazy-initializes from a stored registered destination", () => {
      sessionStorage.setItem(storageKey, "quick-lookup");

      const { result } = renderHook(() => useActiveDestination(validIds));

      expect(result.current.activeDestinationId).toBe("quick-lookup");
    });

    it("updates the active destination and persists the selection", () => {
      const { result } = renderHook(() => useActiveDestination(validIds));

      act(() => {
        result.current.setActiveDestinationId("quick-lookup");
      });

      expect(result.current.activeDestinationId).toBe("quick-lookup");
      expect(sessionStorage.getItem(storageKey)).toBe("quick-lookup");
    });
  });
});
