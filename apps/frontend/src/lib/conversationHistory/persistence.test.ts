import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConversationHistoryEntry, GameDraftState, LookupDraftState } from "./persistence";
import {
  CONVERSATION_HISTORY_STORAGE_KEY,
  clearDraft,
  deleteHistoryEntry,
  loadDraft,
  loadHistoryEntries,
  saveDraft,
  saveHistoryEntry
} from "./persistence";

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
    frozenContext: { kind: "lookup", cards: [] },
    hiddenInitialQuestion: "How does hexproof work?",
    visibleMessages: [{ role: "assistant", content: "Hexproof restricts opposing targets." }],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function buildGameDraft(overrides: Partial<Omit<GameDraftState, "mode">> = {}): Omit<GameDraftState, "updatedAt"> {
  return {
    mode: "game",
    flowStep: "zone-confirm",
    gameContext: null,
    selectedZones: ["battlefield"],
    zoneCardsByZone: {},
    question: "",
    turnPhase: "main_1",
    combatStep: "declare_blockers",
    confirmedPhase: "main_1",
    activePlayer: "Player 1",
    ...overrides
  };
}

function buildLookupDraft(
  overrides: Partial<Omit<LookupDraftState, "mode">> = {}
): Omit<LookupDraftState, "updatedAt"> {
  return {
    mode: "lookup",
    selectedCards: [],
    question: "Does trample interact with deathtouch?",
    lockedTopic: null,
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

    it("removes an entry by id, leaving the rest of the list intact", () => {
      const keep = buildEntry({ id: "keep" });
      const remove = buildEntry({ id: "remove" });
      saveHistoryEntry(keep);
      saveHistoryEntry(remove);

      deleteHistoryEntry("remove");

      expect(loadHistoryEntries().map((entry) => entry.id)).toEqual(["keep"]);
    });

    it("is a no-op when the id is not present", () => {
      const entry = buildEntry();
      saveHistoryEntry(entry);

      expect(() => deleteHistoryEntry("does-not-exist")).not.toThrow();
      expect(loadHistoryEntries()).toEqual([entry]);
    });

    it("swallows a delete write failure without throwing", () => {
      saveHistoryEntry(buildEntry());
      const failingStorage: Storage = {
        ...createMemoryStorage(),
        setItem: () => {
          throw new Error("QuotaExceededError");
        }
      };
      vi.stubGlobal("localStorage", failingStorage);

      expect(() => deleteHistoryEntry("entry-1")).not.toThrow();
    });
  });

  describe("conversationHistory Draft persistence", () => {
    beforeEach(() => {
      vi.stubGlobal("localStorage", createMemoryStorage());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns null when no Draft is stored for a mode", () => {
      expect(loadDraft("game")).toBeNull();
      expect(loadDraft("lookup")).toBeNull();
    });

    it("saves and reloads a game Draft, stamping updatedAt", () => {
      saveDraft(buildGameDraft());
      const loaded = loadDraft("game");

      expect(loaded).not.toBeNull();
      expect(loaded).toMatchObject(buildGameDraft());
      expect(typeof loaded?.updatedAt).toBe("string");
    });

    it("saves and reloads a lookup Draft", () => {
      saveDraft(buildLookupDraft());
      const loaded = loadDraft("lookup");

      expect(loaded).not.toBeNull();
      expect(loaded).toMatchObject(buildLookupDraft());
    });

    it("keeps game and lookup Drafts in separate slots", () => {
      saveDraft(buildGameDraft());
      saveDraft(buildLookupDraft());

      expect(loadDraft("game")?.mode).toBe("game");
      expect(loadDraft("lookup")?.mode).toBe("lookup");
    });

    it("overwrites the single Draft slot for a mode rather than accumulating", () => {
      saveDraft(buildGameDraft({ question: "first" }));
      saveDraft(buildGameDraft({ question: "second" }));

      expect(loadDraft("game")?.question).toBe("second");
    });

    it("clears the Draft slot for a mode without affecting the other mode", () => {
      saveDraft(buildGameDraft());
      saveDraft(buildLookupDraft());

      clearDraft("game");

      expect(loadDraft("game")).toBeNull();
      expect(loadDraft("lookup")).not.toBeNull();
    });

    it("never throws on corrupt JSON in Draft storage and drops it", () => {
      localStorage.setItem("thejudge.conversationDraft.game", "{not json");
      expect(loadDraft("game")).toBeNull();
    });

    it("drops a Draft with the wrong shape rather than returning it", () => {
      localStorage.setItem("thejudge.conversationDraft.game", JSON.stringify({ mode: "game" }));
      expect(loadDraft("game")).toBeNull();
    });

    it("does not affect the completed-history entries or its 20-entry cap", () => {
      for (let index = 0; index < 20; index += 1) {
        saveHistoryEntry(
          buildEntry({
            id: `entry-${index}`,
            updatedAt: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`
          })
        );
      }
      saveDraft(buildGameDraft());

      expect(loadHistoryEntries()).toHaveLength(20);
      expect(loadDraft("game")).not.toBeNull();
    });

    it("swallows a Draft write failure without throwing", () => {
      const failingStorage: Storage = {
        ...createMemoryStorage(),
        setItem: () => {
          throw new Error("QuotaExceededError");
        }
      };
      vi.stubGlobal("localStorage", failingStorage);

      expect(() => saveDraft(buildGameDraft())).not.toThrow();
    });
  });
});
