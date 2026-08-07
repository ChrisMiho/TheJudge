import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { ReactElement, ReactNode } from "react";
import { BrowserRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useActiveDestination } from "./useActiveDestination";

const storageKey = "thejudge.portal.activeDestinationId";
const validIds = ["quick-lookup", "mtg-assistant", "player-life-tracker", "trade-balancer"] as const;

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

function RouterWrapper({ children }: { children: ReactNode }): ReactElement {
  return createElement(BrowserRouter, null, children);
}

describe("Frontend - Portal", () => {
  describe("useActiveDestination", () => {
    beforeEach(() => {
      vi.stubGlobal("sessionStorage", createMemoryStorage());
      window.history.replaceState(null, "", "/");
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it.each([
      ["/quick-lookup", "quick-lookup"],
      ["/in-depth", "mtg-assistant"],
      ["/life-tracker", "player-life-tracker"],
      ["/trade-balancer", "trade-balancer"]
    ])("resolves %s to %s regardless of the stored preference", (path, expectedId) => {
      sessionStorage.setItem(storageKey, "quick-lookup");
      window.history.replaceState(null, "", path);

      const { result } = renderHook(() => useActiveDestination(validIds), {
        wrapper: RouterWrapper
      });

      expect(result.current.activeDestinationId).toBe(expectedId);
    });

    it("replace-navigates bare root to the valid stored destination", async () => {
      sessionStorage.setItem(storageKey, "trade-balancer");

      const { result } = renderHook(() => useActiveDestination(validIds), {
        wrapper: RouterWrapper
      });

      expect(result.current.activeDestinationId).toBe("trade-balancer");
      await waitFor(() => expect(window.location.pathname).toBe("/trade-balancer"));
    });

    it.each([null, "deleted-destination"])(
      "replace-navigates bare root to registry order when storage contains %s",
      async (storedId) => {
        if (storedId !== null) sessionStorage.setItem(storageKey, storedId);

        const { result } = renderHook(() => useActiveDestination(validIds), {
          wrapper: RouterWrapper
        });

        expect(result.current.activeDestinationId).toBe("quick-lookup");
        await waitFor(() => expect(window.location.pathname).toBe("/quick-lookup"));
      }
    );

    it("redirects an unknown path through root and resolves the stored fallback", async () => {
      sessionStorage.setItem(storageKey, "player-life-tracker");
      window.history.replaceState(null, "", "/nope");

      const { result } = renderHook(() => useActiveDestination(validIds), {
        wrapper: RouterWrapper
      });

      await waitFor(() => expect(window.location.pathname).toBe("/life-tracker"));
      expect(result.current.activeDestinationId).toBe("player-life-tracker");
    });

    it("push-navigates selections and saves the selected destination", async () => {
      window.history.replaceState(null, "", "/quick-lookup");
      const { result } = renderHook(() => useActiveDestination(validIds), {
        wrapper: RouterWrapper
      });

      act(() => {
        result.current.setActiveDestinationId("mtg-assistant");
      });

      await waitFor(() => expect(window.location.pathname).toBe("/in-depth"));
      expect(sessionStorage.getItem(storageKey)).toBe("mtg-assistant");
    });
  });
});
