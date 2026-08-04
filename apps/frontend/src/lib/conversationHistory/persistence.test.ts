import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConversationHistoryEntry } from "./persistence";
import { CONVERSATION_HISTORY_STORAGE_KEY, loadHistoryEntries, saveHistoryEntry } from "./persistence";

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

function buildEntry(overrides: Partial<ConversationHistoryEntry> = {}): ConversationHistoryEntry {
  return {
    id: "entry-1",
    mode: "lookup",
    flowLabel: "Quick Question",
    frozenContext: { kind: "lookup", card: null },
    hiddenInitialQuestion: "How does hexproof work?",
    visibleMessages: [{ role: "assistant", content: "Hexproof restricts opposing targets." }],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

describe("Frontend - Shared", () => {
  describe("conversationHistory persistence", () => {
    beforeEach(() => {
      vi.stubGlobal("localStorage", createMemoryStorage());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns an empty list when storage is empty", () => {
      expect(loadHistoryEntries()).toEqual([]);
    });

    it("never throws on corrupt JSON in storage", () => {
      localStorage.setItem(CONVERSATION_HISTORY_STORAGE_KEY, "{not json");
      expect(loadHistoryEntries()).toEqual([]);
    });

    it("saves and reloads an entry", () => {
      const entry = buildEntry();
      saveHistoryEntry(entry);
      expect(loadHistoryEntries()).toEqual([entry]);
    });

    it("returns entries most-recent-first", () => {
      const older = buildEntry({ id: "older", updatedAt: "2026-01-01T00:00:00.000Z" });
      const newer = buildEntry({ id: "newer", updatedAt: "2026-01-02T00:00:00.000Z" });
      saveHistoryEntry(older);
      saveHistoryEntry(newer);

      expect(loadHistoryEntries().map((entry) => entry.id)).toEqual(["newer", "older"]);
    });

    it("filters by mode without affecting the underlying combined list", () => {
      const gameEntry = buildEntry({ id: "game-1", mode: "game", frozenContext: { kind: "game", gameContext: {} as never } });
      const lookupEntry = buildEntry({ id: "lookup-1", mode: "lookup" });
      saveHistoryEntry(gameEntry);
      saveHistoryEntry(lookupEntry);

      expect(loadHistoryEntries("game").map((entry) => entry.id)).toEqual(["game-1"]);
      expect(loadHistoryEntries("lookup").map((entry) => entry.id)).toEqual(["lookup-1"]);
      expect(loadHistoryEntries().map((entry) => entry.id).sort()).toEqual(["game-1", "lookup-1"]);
    });

    it("drops only a corrupt entry, keeping the rest of the list", () => {
      const valid = buildEntry({ id: "valid" });
      localStorage.setItem(
        CONVERSATION_HISTORY_STORAGE_KEY,
        JSON.stringify([valid, { id: "broken" }])
      );

      expect(loadHistoryEntries().map((entry) => entry.id)).toEqual(["valid"]);
    });

    it("upserts by id, updating content and updatedAt instead of duplicating", () => {
      const original = buildEntry({ updatedAt: "2026-01-01T00:00:00.000Z" });
      saveHistoryEntry(original);

      const updated = buildEntry({
        updatedAt: "2026-01-02T00:00:00.000Z",
        visibleMessages: [
          { role: "assistant", content: "Hexproof restricts opposing targets." },
          { role: "user", content: "And ward?" },
          { role: "assistant", content: "Ward adds a countering cost." }
        ]
      });
      saveHistoryEntry(updated);

      const entries = loadHistoryEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual(updated);
    });

    it("prunes to the 20 most-recently-updated entries across all modes combined", () => {
      for (let index = 0; index < 21; index += 1) {
        saveHistoryEntry(
          buildEntry({
            id: `entry-${index}`,
            updatedAt: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`
          })
        );
      }

      const entries = loadHistoryEntries();
      expect(entries).toHaveLength(20);
      expect(entries.map((entry) => entry.id)).not.toContain("entry-0");
      expect(entries.map((entry) => entry.id)).toContain("entry-20");
    });

    it("swallows a write failure without throwing or affecting prior state", () => {
      const failingStorage: Storage = {
        ...createMemoryStorage(),
        setItem: () => {
          throw new Error("QuotaExceededError");
        }
      };
      vi.stubGlobal("localStorage", failingStorage);

      expect(() => saveHistoryEntry(buildEntry())).not.toThrow();
    });
  });
});
