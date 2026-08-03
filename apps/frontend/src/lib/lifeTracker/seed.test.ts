import { describe, expect, it } from "vitest";
import { NAMED_COUNTER_PALETTE } from "./counters";
import { trackerStateToRosterSeed } from "./seed";
import {
  addCustomCounter,
  adjustCommanderDamage,
  adjustPlayerLife,
  createInitialState,
  setCustomCounter,
  setNamedCounter,
  setPlayerDisplayName
} from "./state";
import type { TrackerState } from "./types";

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function customCounterIdAt(state: TrackerState, playerIndex: number, counterIndex: number): string {
  const counter = state.players[playerIndex].customCounters[counterIndex];
  if (!counter) {
    throw new Error(`No custom counter at player ${playerIndex}, index ${counterIndex}`);
  }
  return counter.id;
}

/** A four-player game exercising names, life, every counter kind, and commander damage. */
function createPopulatedGame(): TrackerState {
  let state = createInitialState(4, 40);

  state = setPlayerDisplayName(state, "Player 1", "  Nissa  ");
  state = setPlayerDisplayName(state, "Player 2", "   ");
  state = setPlayerDisplayName(state, "Player 3", "Player 3");

  state = adjustPlayerLife(state, "Player 1", -13);
  state = adjustPlayerLife(state, "Player 2", 5);

  state = setNamedCounter(state, "Player 1", "poison", 4);
  state = setNamedCounter(state, "Player 1", "energy", 7);
  state = setNamedCounter(state, "Player 1", "exp", 2);
  state = setNamedCounter(state, "Player 1", "treasure", 3);
  state = setNamedCounter(state, "Player 1", "monarch", 1);
  state = setNamedCounter(state, "Player 1", "rad", 0);

  state = addCustomCounter(state, "Player 1", "Shield");
  state = setCustomCounter(state, "Player 1", customCounterIdAt(state, 0, 0), 6);
  state = addCustomCounter(state, "Player 1", "Stun");
  state = setCustomCounter(state, "Player 1", customCounterIdAt(state, 0, 1), 0);

  state = adjustCommanderDamage(state, "Player 1", "Player 4", 9);
  state = adjustCommanderDamage(state, "Player 1", "Player 2", 12);
  state = adjustCommanderDamage(state, "Player 1", "Player 3", 0);

  return state;
}

describe("Frontend - Shared", () => {
  describe("lifeTracker roster seed mapping", () => {
    it("maps player count, fixed labels, and current life", () => {
      const state = createInitialState(6, 20);
      const seed = trackerStateToRosterSeed(adjustPlayerLife(state, "Player 5", -8));

      expect(seed.playerCount).toBe(6);
      expect(seed.players.map((player) => player.label)).toEqual([
        "Player 1",
        "Player 2",
        "Player 3",
        "Player 4",
        "Player 5",
        "Player 6"
      ]);
      expect(seed.players.map((player) => player.lifeTotal)).toEqual([20, 20, 20, 20, 12, 20]);
    });

    it("carries a trimmed display name and omits blank or label-equal names", () => {
      const seed = trackerStateToRosterSeed(createPopulatedGame());

      expect(seed.players[0].displayName).toBe("Nissa");
      expect(seed.players[1]).not.toHaveProperty("displayName");
      expect(seed.players[2]).not.toHaveProperty("displayName");
      expect(seed.players[3]).not.toHaveProperty("displayName");
    });

    it("routes Poison, Energy, and Exp to the scalar contract fields", () => {
      const seed = trackerStateToRosterSeed(createPopulatedGame());

      expect(seed.players[0].poison).toBe(4);
      expect(seed.players[0].energy).toBe(7);
      expect(seed.players[0].experience).toBe(2);
    });

    it("keeps scalar-routed counters out of the generic counters list", () => {
      const scalarLabels = NAMED_COUNTER_PALETTE.filter(
        (definition) => definition.gameContextTarget !== undefined
      ).map((definition) => definition.label);
      const seed = trackerStateToRosterSeed(createPopulatedGame());
      const counterNames = seed.players[0].counters?.map((counter) => counter.name) ?? [];

      expect(scalarLabels).toEqual(["Poison", "Energy", "Exp"]);
      for (const label of scalarLabels) {
        expect(counterNames).not.toContain(label);
      }
    });

    it("maps populated remaining palette counters and custom counters under their labels", () => {
      const seed = trackerStateToRosterSeed(createPopulatedGame());

      expect(seed.players[0].counters).toEqual([
        { name: "Monarch", amount: 1 },
        { name: "Treasure", amount: 3 },
        { name: "Shield", amount: 6 }
      ]);
    });

    it("emits every non-scalar palette counter that is populated", () => {
      let state = createInitialState(2, 40);
      for (const definition of NAMED_COUNTER_PALETTE) {
        state = setNamedCounter(state, "Player 1", definition.id, 2);
      }

      const seed = trackerStateToRosterSeed(state);
      const expectedNames = NAMED_COUNTER_PALETTE.filter(
        (definition) => definition.gameContextTarget === undefined
      ).map((definition) => definition.label);

      expect(seed.players[0].counters?.map((counter) => counter.name)).toEqual(expectedNames);
    });

    it("sorts commander damage by fixed seat order and drops zero sources", () => {
      const seed = trackerStateToRosterSeed(createPopulatedGame());

      expect(seed.players[0].commanderDamage).toEqual([
        { from: "Player 2", amount: 12 },
        { from: "Player 4", amount: 9 }
      ]);
    });

    it("omits zero counters, empty arrays, and untouched player fields", () => {
      const seed = trackerStateToRosterSeed(createInitialState(3, 40));

      expect(seed.players).toEqual([
        { label: "Player 1", lifeTotal: 40 },
        { label: "Player 2", lifeTotal: 40 },
        { label: "Player 3", lifeTotal: 40 }
      ]);
      for (const player of seed.players) {
        expect(Object.keys(player)).toEqual(["label", "lifeTotal"]);
      }
    });

    it("omits a zeroed custom counter and a zeroed palette counter", () => {
      const seed = trackerStateToRosterSeed(createPopulatedGame());
      const counterNames = seed.players[0].counters?.map((counter) => counter.name) ?? [];

      expect(counterNames).not.toContain("Stun");
      expect(counterNames).not.toContain("Rad");
      expect(seed.players[1]).not.toHaveProperty("counters");
      expect(seed.players[1]).not.toHaveProperty("commanderDamage");
    });

    it("merges same-name custom counters into one summed entry in first-seen order", () => {
      let state = createInitialState(2, 40);
      state = addCustomCounter(state, "Player 1", "Shield");
      state = addCustomCounter(state, "Player 1", "Rust");
      state = addCustomCounter(state, "Player 1", " Shield ");
      state = setCustomCounter(state, "Player 1", customCounterIdAt(state, 0, 0), 2);
      state = setCustomCounter(state, "Player 1", customCounterIdAt(state, 0, 1), 1);
      state = setCustomCounter(state, "Player 1", customCounterIdAt(state, 0, 2), 5);

      const seed = trackerStateToRosterSeed(state);

      expect(seed.players[0].counters).toEqual([
        { name: "Shield", amount: 7 },
        { name: "Rust", amount: 1 }
      ]);
    });

    it("merges a custom counter that collides with a palette counter label", () => {
      let state = createInitialState(2, 40);
      state = setNamedCounter(state, "Player 1", "treasure", 3);
      state = addCustomCounter(state, "Player 1", "Treasure");
      state = setCustomCounter(state, "Player 1", customCounterIdAt(state, 0, 0), 4);

      const seed = trackerStateToRosterSeed(state);

      expect(seed.players[0].counters).toEqual([{ name: "Treasure", amount: 7 }]);
    });

    it("drops a populated custom counter with a blank name", () => {
      let state = createInitialState(2, 40);
      state = addCustomCounter(state, "Player 1", "   ");
      state = setCustomCounter(state, "Player 1", customCounterIdAt(state, 0, 0), 3);

      const seed = trackerStateToRosterSeed(state);

      expect(seed.players[0]).not.toHaveProperty("counters");
    });

    it("leaves the source tracker state deeply unchanged", () => {
      const state = createPopulatedGame();
      const before = deepClone(state);

      const seed = trackerStateToRosterSeed(state);
      seed.players[0].lifeTotal = 999;
      seed.players[0].counters?.push({ name: "Injected", amount: 1 });

      expect(state).toEqual(before);
    });

    it("returns a player count that always matches the seeded roster length", () => {
      for (const count of [2, 3, 4, 5, 6, 7, 8]) {
        const seed = trackerStateToRosterSeed(createInitialState(count, 40));

        expect(seed.playerCount).toBe(count);
        expect(seed.players).toHaveLength(count);
      }
    });
  });
});
