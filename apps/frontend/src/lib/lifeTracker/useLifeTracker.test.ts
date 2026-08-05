import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRACKER_STORAGE_KEY } from "./persistence";
import { adjustPlayerLife, createDefaultGame, createInitialState } from "./state";
import { useLifeTracker } from "./useLifeTracker";

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

describe("Frontend - Shared", () => {
  describe("useLifeTracker", () => {
    beforeEach(() => {
      vi.stubGlobal("localStorage", createMemoryStorage());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("creates the documented default game when nothing is persisted", () => {
      const { result } = renderHook(() => useLifeTracker());
      expect(result.current.state).toEqual(createDefaultGame());
    });

    it("hydrates once from a valid persisted snapshot", () => {
      const stored = adjustPlayerLife(createInitialState(3, 30), "Player 1", -5);
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(stored));

      const { result } = renderHook(() => useLifeTracker());

      expect(result.current.state).toEqual(stored);
    });

    it("falls back to the default game when the persisted snapshot is malformed", () => {
      localStorage.setItem(TRACKER_STORAGE_KEY, "{not valid json");

      const { result } = renderHook(() => useLifeTracker());

      expect(result.current.state).toEqual(createDefaultGame());
    });

    it("synchronously saves the computed next state before the action returns", () => {
      const { result } = renderHook(() => useLifeTracker());

      act(() => {
        result.current.adjustPlayerLife("Player 1", -3);
      });

      const saved = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) as string);
      expect(saved.players[0].life).toBe(37);
      expect(result.current.state.players[0].life).toBe(37);
    });

    it("updates and synchronously persists the layout mode", () => {
      const { result } = renderHook(() => useLifeTracker());

      act(() => {
        result.current.setLayoutMode("list");
      });

      const saved = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) as string);
      expect(result.current.state.layoutMode).toBe("list");
      expect(saved.layoutMode).toBe("list");
    });

    it("saves synchronously across a sequence of actions in the same tick", () => {
      const { result } = renderHook(() => useLifeTracker());

      act(() => {
        result.current.adjustPlayerLife("Player 1", -3);
        result.current.adjustPlayerLife("Player 1", -3);
      });

      const saved = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) as string);
      expect(saved.players[0].life).toBe(34);
      expect(result.current.state.players[0].life).toBe(34);
    });

    it("reset clears the storage key instead of rewriting it, then a mutation resumes persistence", () => {
      const { result } = renderHook(() => useLifeTracker());

      act(() => {
        result.current.adjustPlayerLife("Player 1", -3);
      });
      expect(localStorage.getItem(TRACKER_STORAGE_KEY)).not.toBeNull();

      act(() => {
        result.current.reset();
      });
      expect(localStorage.getItem(TRACKER_STORAGE_KEY)).toBeNull();
      expect(result.current.state.players[0].life).toBe(40);

      act(() => {
        result.current.adjustPlayerLife("Player 2", -1);
      });
      const saved = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) as string);
      expect(saved).not.toBeNull();
      expect(saved.players[1].life).toBe(39);
    });

    it("newGame clears the storage key instead of rewriting it, then a mutation resumes persistence", () => {
      const { result } = renderHook(() => useLifeTracker());

      act(() => {
        result.current.setPlayerCount(6);
        result.current.adjustPlayerLife("Player 1", -3);
      });
      expect(localStorage.getItem(TRACKER_STORAGE_KEY)).not.toBeNull();

      act(() => {
        result.current.newGame();
      });
      expect(localStorage.getItem(TRACKER_STORAGE_KEY)).toBeNull();
      expect(result.current.state).toEqual(createDefaultGame());

      act(() => {
        result.current.adjustPlayerLife("Player 1", -1);
      });
      const saved = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) as string);
      expect(saved.players[0].life).toBe(39);
    });

    it("always applies commander damage to life through the hook", () => {
      const { result } = renderHook(() => useLifeTracker());

      act(() => {
        result.current.adjustCommanderDamage("Player 1", "Player 2", 4);
      });

      expect(result.current).not.toHaveProperty("setCommanderDamageToLife");
      expect(result.current.state.players[0].commanderDamage["Player 2"]).toBe(4);
      expect(result.current.state.players[0].life).toBe(36);
    });

    it("commits an exact typed life total through setPlayerLife", () => {
      const { result } = renderHook(() => useLifeTracker());

      act(() => {
        result.current.setPlayerLife("Player 1", 100000);
      });
      expect(result.current.state.players[0].life).toBe(100000);
      expect(JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) as string).players[0].life).toBe(100000);

      act(() => {
        result.current.setPlayerLife("Player 1", -7);
      });
      expect(result.current.state.players[0].life).toBe(-7);
    });

    it("persists the card style and day/night phase as they change", () => {
      const { result } = renderHook(() => useLifeTracker());

      act(() => {
        result.current.setCardStyle("flat");
        result.current.toggleDayNightPhase();
      });

      expect(result.current.state.cardStyle).toBe("flat");
      expect(result.current.state.dayNightPhase).toBe("night");

      const stored = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) as string);
      expect(stored.cardStyle).toBe("flat");
      expect(stored.dayNightPhase).toBe("night");
    });

    it("keeps presentation preferences across New Game while discarding the game", () => {
      const { result } = renderHook(() => useLifeTracker());

      act(() => {
        result.current.setLayoutMode("list");
        result.current.setCardStyle("flat");
        result.current.setPlayerCount(6);
        result.current.toggleDayNightPhase();
      });

      act(() => {
        result.current.newGame();
      });

      expect(result.current.state.layoutMode).toBe("list");
      expect(result.current.state.cardStyle).toBe("flat");
      expect(result.current.state.dayNightPhase).toBe("day");
      expect(result.current.state.playerCount).toBe(4);
      expect(localStorage.getItem(TRACKER_STORAGE_KEY)).toBeNull();
    });

    it("applies the count-driven starting-life default when crossing tiers without a manual choice", () => {
      const { result } = renderHook(() => useLifeTracker());

      act(() => {
        result.current.setPlayerCount(2);
      });

      expect(result.current.state.startingLife).toBe(20);
      expect(result.current.state.hasManualStartingLife).toBe(false);
      expect(result.current.state.players.every((player) => player.life === 20)).toBe(true);

      act(() => {
        result.current.setPlayerCount(3);
      });

      expect(result.current.state.startingLife).toBe(40);
      expect(result.current.state.players.every((player) => player.life === 40)).toBe(true);
    });

    it("does not apply the count-driven default after a manual starting-life choice", () => {
      const { result } = renderHook(() => useLifeTracker());

      act(() => {
        result.current.setStartingLife(30);
        result.current.setPlayerCount(2);
      });

      expect(result.current.state.hasManualStartingLife).toBe(true);
      expect(result.current.state.startingLife).toBe(30);
      expect(result.current.state.players.every((player) => player.life === 30)).toBe(true);
    });

    it("newGame resets hasManualStartingLife to false", () => {
      const { result } = renderHook(() => useLifeTracker());

      act(() => {
        result.current.setStartingLife(30);
      });
      expect(result.current.state.hasManualStartingLife).toBe(true);

      act(() => {
        result.current.newGame();
      });

      expect(result.current.state.hasManualStartingLife).toBe(false);
    });

    it("exposes named and custom counter actions that update the returned state", () => {
      const { result } = renderHook(() => useLifeTracker());

      act(() => {
        result.current.adjustNamedCounter("Player 1", "monarch", 1);
        result.current.addCustomCounter("Player 1", "Storm");
      });

      expect(result.current.state.players[0].namedCounters.monarch).toBe(1);
      expect(result.current.state.players[0].customCounters).toHaveLength(1);

      const counterId = result.current.state.players[0].customCounters[0].id;

      act(() => {
        result.current.adjustCustomCounter("Player 1", counterId, 5);
      });
      expect(result.current.state.players[0].customCounters[0].amount).toBe(5);

      act(() => {
        result.current.removeCustomCounter("Player 1", counterId);
      });
      expect(result.current.state.players[0].customCounters).toHaveLength(0);
    });
  });
});
