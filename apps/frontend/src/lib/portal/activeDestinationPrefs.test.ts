import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadActiveDestinationId, saveActiveDestinationId } from "./activeDestinationPrefs";
import { createMemoryStorage } from "../../test/memoryStorage";

const storageKey = "thejudge.portal.activeDestinationId";
const validIds = ["mtg-assistant", "quick-lookup"] as const;

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
