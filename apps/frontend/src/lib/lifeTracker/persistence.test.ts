import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NAMED_COUNTER_PALETTE } from "./counters";
import {
  TRACKER_STORAGE_KEY,
  clearTrackerState,
  loadTrackerState,
  saveTrackerState
} from "./persistence";
import {
  addCustomCounter,
  createInitialState,
  setCommanderDamage,
  setLayoutMode,
  setNamedCounter
} from "./state";
import type { TrackerState } from "./types";

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

function buildFullState(): TrackerState {
  let state = createInitialState(3, 30);
  state = setNamedCounter(state, "Player 1", "poison", 4);
  state = setCommanderDamage(state, "Player 1", "Player 2", 7);
  state = addCustomCounter(state, "Player 1", "Doom Counters");
  return state;
}

describe("Frontend - Shared", () => {
  describe("lifeTracker persistence", () => {
    beforeEach(() => {
      vi.stubGlobal("localStorage", createMemoryStorage());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("uses the documented storage key", () => {
      expect(TRACKER_STORAGE_KEY).toBe("thejudge.lifeTracker.state");
    });

    it("returns null when nothing is stored", () => {
      expect(loadTrackerState()).toBeNull();
    });

    it("round-trips names, life, every counter kind, settings, and starting life", () => {
      const state = buildFullState();

      saveTrackerState(state);
      const loaded = loadTrackerState();

      expect(loaded).toEqual(state);
      expect(loaded?.startingLife).toBe(30);
      expect(loaded?.players[0].namedCounters.poison).toBe(4);
      expect(loaded?.players[0].commanderDamage["Player 2"]).toBe(7);
      expect(loaded?.players[0].customCounters[0].name).toBe("Doom Counters");
    });

    it("round-trips a valid list layout unchanged", () => {
      const state = setLayoutMode(buildFullState(), "list");

      saveTrackerState(state);

      expect(loadTrackerState()).toEqual(state);
    });

    it("loads a valid pre-layoutMode snapshot with the grid default", () => {
      const legacyState = JSON.parse(JSON.stringify(buildFullState())) as Partial<TrackerState>;
      delete legacyState.layoutMode;
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(legacyState));

      expect(loadTrackerState()).toEqual({ ...legacyState, layoutMode: "grid" });
    });

    it("normalizes an invalid stored layoutMode to grid", () => {
      const state = { ...buildFullState(), layoutMode: "nonsense" };
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(state));

      expect(loadTrackerState()).toEqual({ ...state, layoutMode: "grid" });
    });

    it("returns null for malformed JSON", () => {
      localStorage.setItem(TRACKER_STORAGE_KEY, "{not valid json");
      expect(loadTrackerState()).toBeNull();
    });

    it("returns null when playerCount is out of the 2-8 range", () => {
      const state = { ...buildFullState(), playerCount: 1 };
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(state));
      expect(loadTrackerState()).toBeNull();
    });

    it("returns null when players.length does not match playerCount", () => {
      const state = buildFullState();
      const tampered = { ...state, players: state.players.slice(0, 1) };
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(tampered));
      expect(loadTrackerState()).toBeNull();
    });

    it("returns null when a player label is out of order or duplicated", () => {
      const state = buildFullState();
      const tampered = {
        ...state,
        players: [state.players[1], state.players[0], state.players[2]]
      };
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(tampered));
      expect(loadTrackerState()).toBeNull();
    });

    it("returns null when a named counter is missing from the stored roster", () => {
      const state = buildFullState();
      const brokenPlayer = { ...state.players[0], namedCounters: { monarch: 0 } };
      const tampered = { ...state, players: [brokenPlayer, state.players[1], state.players[2]] };
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(tampered));
      expect(loadTrackerState()).toBeNull();
    });

    it("returns null when a named counter value is negative", () => {
      const state = buildFullState();
      const brokenPlayer = { ...state.players[0], namedCounters: { ...state.players[0].namedCounters, poison: -1 } };
      const tampered = { ...state, players: [brokenPlayer, state.players[1], state.players[2]] };
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(tampered));
      expect(loadTrackerState()).toBeNull();
    });

    it("returns null when commander damage stores a self entry for the own-seat me cell", () => {
      const state = buildFullState();
      const brokenPlayer = { ...state.players[0], commanderDamage: { "Player 1": 2 } };
      const tampered = { ...state, players: [brokenPlayer, state.players[1], state.players[2]] };
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(tampered));
      expect(loadTrackerState()).toBeNull();
    });

    it("returns null when a custom counter is malformed", () => {
      const state = buildFullState();
      const brokenPlayer = { ...state.players[0], customCounters: [{ id: "x", name: "Storm" }] };
      const tampered = { ...state, players: [brokenPlayer, state.players[1], state.players[2]] };
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(tampered));
      expect(loadTrackerState()).toBeNull();
    });

    it("accepts a current snapshot without commanderDamageToLife", () => {
      const currentState = JSON.parse(JSON.stringify(buildFullState())) as Record<string, unknown>;
      delete currentState.commanderDamageToLife;
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(currentState));

      expect(loadTrackerState()).toEqual(currentState);
    });

    it("returns null when localStorage is unavailable", () => {
      vi.stubGlobal("localStorage", undefined);
      expect(loadTrackerState()).toBeNull();
    });

    it("returns null when localStorage reads throw", () => {
      vi.stubGlobal("localStorage", {
        ...createMemoryStorage(),
        getItem: () => {
          throw new Error("blocked");
        }
      });
      expect(loadTrackerState()).toBeNull();
    });

    it("does not throw when localStorage writes throw", () => {
      vi.stubGlobal("localStorage", {
        ...createMemoryStorage(),
        setItem: () => {
          throw new Error("blocked");
        }
      });
      expect(() => saveTrackerState(buildFullState())).not.toThrow();
    });

    it("does not throw when localStorage is unavailable during save", () => {
      vi.stubGlobal("localStorage", undefined);
      expect(() => saveTrackerState(buildFullState())).not.toThrow();
    });

    it("clears the stored key", () => {
      saveTrackerState(buildFullState());
      expect(loadTrackerState()).not.toBeNull();

      clearTrackerState();

      expect(localStorage.getItem(TRACKER_STORAGE_KEY)).toBeNull();
      expect(loadTrackerState()).toBeNull();
    });

    it("does not throw when localStorage removal throws", () => {
      vi.stubGlobal("localStorage", {
        ...createMemoryStorage(),
        removeItem: () => {
          throw new Error("blocked");
        }
      });
      expect(() => clearTrackerState()).not.toThrow();
    });

    it("keeps NAMED_COUNTER_PALETTE and the persisted named-counter keys in sync", () => {
      const state = createInitialState(2, 40);
      saveTrackerState(state);
      const loaded = loadTrackerState();

      expect(loaded && Object.keys(loaded.players[0].namedCounters).sort()).toEqual(
        NAMED_COUNTER_PALETTE.map((definition) => definition.id).sort()
      );
    });
  });
});
