import { useRef, useState } from "react";
import type { PlayerLabel } from "../../types";
import type { NamedCounterId } from "./counters";
import { clearTrackerState, loadTrackerState, saveTrackerState } from "./persistence";
import {
  addCustomCounter,
  adjustCommanderDamage,
  adjustCustomCounter,
  adjustNamedCounter,
  adjustPlayerLife,
  createDefaultGame,
  removeCustomCounter,
  resetGame,
  setCommanderDamage,
  setCommanderDamageToLife,
  setCustomCounter,
  setNamedCounter,
  setPlayerCount,
  setPlayerDisplayName,
  setStartingLife,
  startNewGame
} from "./state";
import type { TrackerState } from "./types";

export type UseLifeTrackerResult = {
  state: TrackerState;
  setPlayerCount: (count: number) => void;
  setPlayerDisplayName: (label: PlayerLabel, displayName: string) => void;
  setStartingLife: (startingLife: number) => void;
  adjustPlayerLife: (label: PlayerLabel, delta: number) => void;
  adjustNamedCounter: (label: PlayerLabel, counterId: NamedCounterId, delta: number) => void;
  setNamedCounter: (label: PlayerLabel, counterId: NamedCounterId, value: number) => void;
  addCustomCounter: (label: PlayerLabel, name: string) => void;
  adjustCustomCounter: (label: PlayerLabel, counterId: string, delta: number) => void;
  setCustomCounter: (label: PlayerLabel, counterId: string, value: number) => void;
  removeCustomCounter: (label: PlayerLabel, counterId: string) => void;
  adjustCommanderDamage: (targetLabel: PlayerLabel, sourceLabel: PlayerLabel, delta: number) => void;
  setCommanderDamage: (targetLabel: PlayerLabel, sourceLabel: PlayerLabel, value: number) => void;
  setCommanderDamageToLife: (enabled: boolean) => void;
  reset: () => void;
  newGame: () => void;
};

/**
 * Hydrates the tracker once from `thejudge.lifeTracker.state` (or creates the default game), and
 * exposes typed actions. Every mutating action synchronously saves its computed next state before
 * returning, so a same-tick portal handoff can read the latest snapshot. Reset/New Game clear the
 * storage key instead of rewriting it; the next mutation resumes normal persistence.
 */
export function useLifeTracker(): UseLifeTrackerResult {
  // Read once on mount; React only evaluates a useState initializer on first render.
  const [initialState] = useState<TrackerState>(() => loadTrackerState() ?? createDefaultGame());

  // stateRef holds the authoritative "current" state for computing each next state. Reading from
  // it (rather than the `state` variable from useState) keeps synchronous back-to-back actions in
  // the same tick correct, since React does not update `state` in place until re-render.
  const stateRef = useRef<TrackerState>(initialState);
  const [state, setState] = useState<TrackerState>(initialState);

  function commit(nextState: TrackerState): void {
    stateRef.current = nextState;
    setState(nextState);
    saveTrackerState(nextState);
  }

  function commitWithoutPersisting(nextState: TrackerState): void {
    stateRef.current = nextState;
    setState(nextState);
  }

  return {
    state,
    setPlayerCount: (count) => commit(setPlayerCount(stateRef.current, count)),
    setPlayerDisplayName: (label, displayName) => commit(setPlayerDisplayName(stateRef.current, label, displayName)),
    setStartingLife: (startingLife) => commit(setStartingLife(stateRef.current, startingLife)),
    adjustPlayerLife: (label, delta) => commit(adjustPlayerLife(stateRef.current, label, delta)),
    adjustNamedCounter: (label, counterId, delta) =>
      commit(adjustNamedCounter(stateRef.current, label, counterId, delta)),
    setNamedCounter: (label, counterId, value) => commit(setNamedCounter(stateRef.current, label, counterId, value)),
    addCustomCounter: (label, name) => commit(addCustomCounter(stateRef.current, label, name)),
    adjustCustomCounter: (label, counterId, delta) =>
      commit(adjustCustomCounter(stateRef.current, label, counterId, delta)),
    setCustomCounter: (label, counterId, value) =>
      commit(setCustomCounter(stateRef.current, label, counterId, value)),
    removeCustomCounter: (label, counterId) => commit(removeCustomCounter(stateRef.current, label, counterId)),
    adjustCommanderDamage: (targetLabel, sourceLabel, delta) =>
      commit(adjustCommanderDamage(stateRef.current, targetLabel, sourceLabel, delta)),
    setCommanderDamage: (targetLabel, sourceLabel, value) =>
      commit(setCommanderDamage(stateRef.current, targetLabel, sourceLabel, value)),
    setCommanderDamageToLife: (enabled) => commit(setCommanderDamageToLife(stateRef.current, enabled)),
    reset: () => {
      const nextState = resetGame(stateRef.current);
      clearTrackerState();
      commitWithoutPersisting(nextState);
    },
    newGame: () => {
      const nextState = startNewGame();
      clearTrackerState();
      commitWithoutPersisting(nextState);
    }
  };
}
