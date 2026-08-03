import { describe, expect, it } from "vitest";
import { NAMED_COUNTER_PALETTE } from "./counters";
import {
  ALL_PLAYER_LABELS,
  DEFAULT_LAYOUT_MODE,
  addCustomCounter,
  adjustCommanderDamage,
  adjustCustomCounter,
  adjustNamedCounter,
  adjustPlayerLife,
  createDefaultGame,
  createInitialState,
  removeCustomCounter,
  resetGame,
  setCommanderDamage,
  setCommanderDamageToLife,
  setCustomCounter,
  setNamedCounter,
  setLayoutMode,
  setPlayerCount,
  setPlayerDisplayName,
  setStartingLife,
  startNewGame
} from "./state";
import type { TrackerState } from "./types";

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("Frontend - Shared", () => {
  describe("lifeTracker named counter palette", () => {
    it("contains exactly the documented eleven counters in order", () => {
      expect(NAMED_COUNTER_PALETTE.map((definition) => definition.label)).toEqual([
        "Monarch",
        "Treasure",
        "Initiative",
        "Poison",
        "Ascend",
        "Rad",
        "Day/night",
        "C.Tax",
        "K.O.",
        "Energy",
        "Exp"
      ]);
    });

    it("maps only Poison, Energy, and Exp to their GameContext targets", () => {
      const targetsById = Object.fromEntries(
        NAMED_COUNTER_PALETTE.map((definition) => [definition.id, definition.gameContextTarget])
      );

      expect(targetsById.poison).toBe("poison");
      expect(targetsById.energy).toBe("energy");
      expect(targetsById.exp).toBe("experience");
      expect(targetsById.monarch).toBeUndefined();
      expect(targetsById.treasure).toBeUndefined();
      expect(targetsById.initiative).toBeUndefined();
      expect(targetsById.ascend).toBeUndefined();
      expect(targetsById.rad).toBeUndefined();
      expect(targetsById.dayNight).toBeUndefined();
      expect(targetsById.cTax).toBeUndefined();
      expect(targetsById.ko).toBeUndefined();
    });

    it("gives every counter a stable, unique id", () => {
      const ids = NAMED_COUNTER_PALETTE.map((definition) => definition.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("lifeTracker createInitialState", () => {
    it("returns fixed labels Player 1-4 at 40 with zeroed named counters, empty custom counters, and empty commander damage", () => {
      const state = createInitialState(4, 40);

      expect(state.playerCount).toBe(4);
      expect(state.startingLife).toBe(40);
      expect(state.commanderDamageToLife).toBe(false);
      expect(state.layoutMode).toBe("grid");
      expect(state.players.map((player) => player.label)).toEqual(["Player 1", "Player 2", "Player 3", "Player 4"]);

      for (const player of state.players) {
        expect(player.life).toBe(40);
        expect(player.customCounters).toEqual([]);
        expect(player.commanderDamage).toEqual({});
        for (const definition of NAMED_COUNTER_PALETTE) {
          expect(player.namedCounters[definition.id]).toBe(0);
        }
      }
    });

    it("clamps an out-of-range player count into 2-8", () => {
      expect(createInitialState(1, 40).playerCount).toBe(2);
      expect(createInitialState(20, 40).playerCount).toBe(8);
    });

    it("accepts an explicit layout mode", () => {
      expect(createInitialState(4, 40, false, "list").layoutMode).toBe("list");
    });
  });

  describe("lifeTracker createDefaultGame / startNewGame", () => {
    it("createDefaultGame returns the documented default game", () => {
      const state = createDefaultGame();
      expect(state.playerCount).toBe(4);
      expect(state.startingLife).toBe(40);
      expect(state.commanderDamageToLife).toBe(false);
      expect(state.layoutMode).toBe(DEFAULT_LAYOUT_MODE);
    });

    it("startNewGame restores the documented default game regardless of prior state", () => {
      const customized = setPlayerCount(setStartingLife(createInitialState(6, 20), 25), 8);
      const fresh = startNewGame();

      expect(fresh).toEqual(createDefaultGame());
      expect(customized.playerCount).toBe(8);
    });
  });

  describe("lifeTracker immutability", () => {
    const base = createInitialState(4, 40);

    const mutations: Array<[string, (state: TrackerState) => TrackerState]> = [
      ["setPlayerCount", (state) => setPlayerCount(state, 6)],
      ["setPlayerDisplayName", (state) => setPlayerDisplayName(state, "Player 1", "Alice")],
      ["setStartingLife", (state) => setStartingLife(state, 20)],
      ["adjustPlayerLife", (state) => adjustPlayerLife(state, "Player 1", -5)],
      ["adjustNamedCounter", (state) => adjustNamedCounter(state, "Player 1", "monarch", 1)],
      ["setNamedCounter", (state) => setNamedCounter(state, "Player 1", "poison", 3)],
      ["addCustomCounter", (state) => addCustomCounter(state, "Player 1", "Storm")],
      ["setCommanderDamage", (state) => setCommanderDamage(state, "Player 1", "Player 2", 5)],
      ["adjustCommanderDamage", (state) => adjustCommanderDamage(state, "Player 1", "Player 2", 3)],
      ["setCommanderDamageToLife", (state) => setCommanderDamageToLife(state, true)],
      ["setLayoutMode", (state) => setLayoutMode(state, "list")],
      ["resetGame", (state) => resetGame(state)]
    ];

    it.each(mutations)("%s returns a new state and leaves its input unchanged", (_name, mutate) => {
      const before = deepClone(base);

      const result = mutate(base);

      expect(base).toEqual(before);
      expect(result).not.toBe(base);
    });

    it("addCustomCounter followed by adjust/set/remove never mutate an intermediate snapshot", () => {
      const withCounter = addCustomCounter(base, "Player 1", "Storm");
      const snapshot = deepClone(withCounter);
      const counterId = withCounter.players[0].customCounters[0].id;

      const adjusted = adjustCustomCounter(withCounter, "Player 1", counterId, 4);
      expect(withCounter).toEqual(snapshot);

      const set = setCustomCounter(adjusted, "Player 1", counterId, 9);
      expect(adjusted.players[0].customCounters[0].amount).toBe(4);
      expect(set.players[0].customCounters[0].amount).toBe(9);

      const removed = removeCustomCounter(set, "Player 1", counterId);
      expect(set.players[0].customCounters).toHaveLength(1);
      expect(removed.players[0].customCounters).toHaveLength(0);
    });
  });

  describe("lifeTracker layout mode", () => {
    it("updates the layout mode without changing the input state", () => {
      const state = createInitialState(4, 40);

      const next = setLayoutMode(state, "list");

      expect(next.layoutMode).toBe("list");
      expect(state.layoutMode).toBe("grid");
    });
  });

  describe("lifeTracker counter clamping", () => {
    it("never lets a named counter fall below zero", () => {
      const state = createInitialState(2, 40);
      const decremented = adjustNamedCounter(state, "Player 1", "monarch", -5);
      expect(decremented.players[0].namedCounters.monarch).toBe(0);

      const setNegative = setNamedCounter(state, "Player 1", "monarch", -5);
      expect(setNegative.players[0].namedCounters.monarch).toBe(0);
    });

    it("never lets a custom counter fall below zero", () => {
      const withCounter = addCustomCounter(createInitialState(2, 40), "Player 1", "Storm");
      const counterId = withCounter.players[0].customCounters[0].id;

      const decremented = adjustCustomCounter(withCounter, "Player 1", counterId, -5);
      expect(decremented.players[0].customCounters[0].amount).toBe(0);

      const setNegative = setCustomCounter(withCounter, "Player 1", counterId, -5);
      expect(setNegative.players[0].customCounters[0].amount).toBe(0);
    });

    it("never lets commander damage fall below zero", () => {
      const state = createInitialState(2, 40);
      const decremented = adjustCommanderDamage(state, "Player 1", "Player 2", -5);
      expect(decremented.players[0].commanderDamage["Player 2"]).toBe(0);

      const setNegative = setCommanderDamage(state, "Player 1", "Player 2", -5);
      expect(setNegative.players[0].commanderDamage["Player 2"]).toBe(0);
    });

    it("allows life to go negative so the visual-only skull cue can trigger", () => {
      const state = createInitialState(2, 1);
      const damaged = adjustPlayerLife(state, "Player 1", -5);
      expect(damaged.players[0].life).toBe(-4);
    });
  });

  describe("lifeTracker commander damage automation", () => {
    it("lowers target life by the applied positive increase only when automation is enabled", () => {
      const state = setCommanderDamageToLife(createInitialState(2, 40), true);
      const next = adjustCommanderDamage(state, "Player 1", "Player 2", 2);

      expect(next.players[0].commanderDamage["Player 2"]).toBe(2);
      expect(next.players[0].life).toBe(38);
    });

    it("does not reduce life when automation is disabled", () => {
      const state = createInitialState(2, 40);
      const next = adjustCommanderDamage(state, "Player 1", "Player 2", 2);

      expect(next.players[0].commanderDamage["Player 2"]).toBe(2);
      expect(next.players[0].life).toBe(40);
    });

    it("never stores or applies life loss for the own-seat me cell", () => {
      const state = setCommanderDamageToLife(createInitialState(2, 40), true);
      const next = adjustCommanderDamage(state, "Player 1", "Player 1", 5);

      expect(next).toEqual(state);
      expect(next.players[0].commanderDamage["Player 1"]).toBeUndefined();
    });

    it("does not restore life when a commander-damage value is decreased", () => {
      const withDamage = setCommanderDamage(
        setCommanderDamageToLife(createInitialState(2, 40), true),
        "Player 1",
        "Player 2",
        6
      );
      expect(withDamage.players[0].life).toBe(34);

      const decreased = setCommanderDamage(withDamage, "Player 1", "Player 2", 2);
      expect(decreased.players[0].commanderDamage["Player 2"]).toBe(2);
      expect(decreased.players[0].life).toBe(34);
    });

    it("only applies the positive portion when a decrease and increase cross the previous value", () => {
      const state = setCommanderDamageToLife(createInitialState(2, 40), true);
      const raised = setCommanderDamage(state, "Player 1", "Player 2", 5);
      expect(raised.players[0].life).toBe(35);

      const loweredThenReRaised = setCommanderDamage(raised, "Player 1", "Player 2", 3);
      expect(loweredThenReRaised.players[0].life).toBe(35);
    });
  });

  describe("lifeTracker player count changes", () => {
    it("preserves retained players by fixed label and their current life/counters when growing", () => {
      const state = adjustPlayerLife(createInitialState(2, 40), "Player 1", -10);
      const grown = setPlayerCount(state, 4);

      expect(grown.playerCount).toBe(4);
      expect(grown.players.map((player) => player.label)).toEqual([
        "Player 1",
        "Player 2",
        "Player 3",
        "Player 4"
      ]);
      expect(grown.players[0].life).toBe(30);
      expect(grown.players[2].life).toBe(40);
      expect(grown.players[3].life).toBe(40);
    });

    it("initializes new players at the current starting life, not the original", () => {
      const state = setStartingLife(createInitialState(2, 40), 20);
      const grown = setPlayerCount(state, 3);

      expect(grown.players[2].life).toBe(20);
    });

    it("drops trailing players and keeps the retained ones untouched when shrinking", () => {
      const state = adjustPlayerLife(createInitialState(4, 40), "Player 2", -3);
      const shrunk = setPlayerCount(state, 2);

      expect(shrunk.playerCount).toBe(2);
      expect(shrunk.players.map((player) => player.label)).toEqual(["Player 1", "Player 2"]);
      expect(shrunk.players[1].life).toBe(37);
    });
  });

  describe("lifeTracker starting life and reset", () => {
    it("setStartingLife seeds all active players' current life", () => {
      const state = adjustPlayerLife(createInitialState(3, 40), "Player 1", -30);
      const reseeded = setStartingLife(state, 25);

      expect(reseeded.startingLife).toBe(25);
      for (const player of reseeded.players) {
        expect(player.life).toBe(25);
      }
    });

    it("reset preserves count, names, and settings while zeroing counters and restoring life", () => {
      let state = createInitialState(3, 40);
      state = setPlayerDisplayName(state, "Player 1", "Alice");
      state = setCommanderDamageToLife(state, true);
      state = adjustPlayerLife(state, "Player 1", -15);
      state = adjustNamedCounter(state, "Player 1", "monarch", 1);
      state = addCustomCounter(state, "Player 1", "Storm");
      const counterId = state.players[0].customCounters[0].id;
      state = adjustCustomCounter(state, "Player 1", counterId, 4);
      state = setCommanderDamage(state, "Player 2", "Player 1", 6);

      const reset = resetGame(state);

      expect(reset.playerCount).toBe(3);
      expect(reset.commanderDamageToLife).toBe(true);
      expect(reset.players[0].displayName).toBe("Alice");
      expect(reset.players[0].life).toBe(40);
      expect(reset.players[0].namedCounters.monarch).toBe(0);
      expect(reset.players[0].customCounters).toEqual([{ id: counterId, name: "Storm", amount: 0 }]);
      expect(reset.players[1].commanderDamage).toEqual({});
    });
  });

  describe("lifeTracker roster labels", () => {
    it("exposes all eight fixed player labels in seat order", () => {
      expect(ALL_PLAYER_LABELS).toEqual([
        "Player 1",
        "Player 2",
        "Player 3",
        "Player 4",
        "Player 5",
        "Player 6",
        "Player 7",
        "Player 8"
      ]);
    });
  });
});
