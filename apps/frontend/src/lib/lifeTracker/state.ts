import type { PlayerLabel } from "../../types";
import { clampCounterValue, createEmptyNamedCounters, type NamedCounterId } from "./counters";
import type {
  CardStyle,
  DayNightPhase,
  LayoutMode,
  TrackerPlayer,
  TrackerPreferences,
  TrackerState
} from "./types";

export const MIN_PLAYER_COUNT = 2;
export const MAX_PLAYER_COUNT = 8;

export const DEFAULT_PLAYER_COUNT = 4;
export const DEFAULT_STARTING_LIFE = 40;
export const DEFAULT_LAYOUT_MODE: LayoutMode = "grid";
/** Unchanged from the original shipped look, so existing games keep the ombre they already had. */
export const DEFAULT_CARD_STYLE: CardStyle = "gradient";
/** Day/night is opt-in: off costs nothing for the many games that never use the mechanic. */
export const DEFAULT_DAY_NIGHT_ENABLED = false;
export const DEFAULT_DAY_NIGHT_PHASE: DayNightPhase = "day";

/** The presentation/format settings that survive a New Game, unlike the game's own live values. */
export const DEFAULT_PREFERENCES: TrackerPreferences = {
  layoutMode: DEFAULT_LAYOUT_MODE,
  cardStyle: DEFAULT_CARD_STYLE,
  dayNightEnabled: DEFAULT_DAY_NIGHT_ENABLED
};

/** Every fixed player label, in seat order. The tracker roster is always a contiguous prefix of this list. */
export const ALL_PLAYER_LABELS: readonly PlayerLabel[] = [
  "Player 1",
  "Player 2",
  "Player 3",
  "Player 4",
  "Player 5",
  "Player 6",
  "Player 7",
  "Player 8"
];

function clampPlayerCount(count: number): number {
  const rounded = Math.round(count);
  return Math.min(MAX_PLAYER_COUNT, Math.max(MIN_PLAYER_COUNT, rounded));
}

function createCustomCounterId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `counter-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function createPlayer(label: PlayerLabel, startingLife: number): TrackerPlayer {
  return {
    label,
    displayName: label,
    life: startingLife,
    namedCounters: createEmptyNamedCounters(),
    commanderDamage: {},
    customCounters: []
  };
}

/** Immutably applies `updater` to the player with `label`; other players and unmatched states pass through unchanged. */
function updatePlayer(
  state: TrackerState,
  label: PlayerLabel,
  updater: (player: TrackerPlayer) => TrackerPlayer
): TrackerState {
  return {
    ...state,
    players: state.players.map((player) => (player.label === label ? updater(player) : player))
  };
}

/** Player 1..N at `startingLife`, zeroed named counters, no custom counters, no commander damage. */
export function createInitialState(
  playerCount: number,
  startingLife: number,
  layoutMode: LayoutMode = DEFAULT_LAYOUT_MODE,
  preferences: Partial<Omit<TrackerPreferences, "layoutMode">> = {}
): TrackerState {
  const clampedCount = clampPlayerCount(playerCount);
  return {
    playerCount: clampedCount,
    startingLife,
    layoutMode,
    cardStyle: preferences.cardStyle ?? DEFAULT_CARD_STYLE,
    dayNightEnabled: preferences.dayNightEnabled ?? DEFAULT_DAY_NIGHT_ENABLED,
    dayNightPhase: DEFAULT_DAY_NIGHT_PHASE,
    players: ALL_PLAYER_LABELS.slice(0, clampedCount).map((label) => createPlayer(label, startingLife))
  };
}

/** The documented default game used for initial hydration and New Game. */
export function createDefaultGame(
  layoutMode: LayoutMode = DEFAULT_LAYOUT_MODE,
  preferences: Partial<Omit<TrackerPreferences, "layoutMode">> = {}
): TrackerState {
  return createInitialState(DEFAULT_PLAYER_COUNT, DEFAULT_STARTING_LIFE, layoutMode, preferences);
}

/** Preserves retained players by fixed label; new players are initialized at the current starting life. */
export function setPlayerCount(state: TrackerState, count: number): TrackerState {
  const nextCount = clampPlayerCount(count);
  const nextLabels = ALL_PLAYER_LABELS.slice(0, nextCount);
  const retainedByLabel = new Map(state.players.map((player) => [player.label, player]));

  return {
    ...state,
    playerCount: nextCount,
    players: nextLabels.map(
      (label) => retainedByLabel.get(label) ?? createPlayer(label, state.startingLife)
    )
  };
}

export function setPlayerDisplayName(state: TrackerState, label: PlayerLabel, displayName: string): TrackerState {
  return updatePlayer(state, label, (player) => ({ ...player, displayName }));
}

/** Sets the starting-life setting and seeds every active player's current life to it. */
export function setStartingLife(state: TrackerState, startingLife: number): TrackerState {
  return {
    ...state,
    startingLife,
    players: state.players.map((player) => ({ ...player, life: startingLife }))
  };
}

/** Life is not clamped: it can fall to or below zero so the (visual-only) skull cue can trigger. */
export function adjustPlayerLife(state: TrackerState, label: PlayerLabel, delta: number): TrackerState {
  return updatePlayer(state, label, (player) => ({ ...player, life: player.life + delta }));
}

/**
 * Sets an exact life total (the typed-entry path). Like `adjustPlayerLife` the value is not
 * clamped - arbitrarily large and negative totals are both legal - but a non-finite value is
 * refused outright rather than written, so a NaN can never poison persisted state.
 */
export function setPlayerLife(state: TrackerState, label: PlayerLabel, life: number): TrackerState {
  if (!Number.isFinite(life)) {
    return state;
  }

  return updatePlayer(state, label, (player) => ({ ...player, life }));
}

export function adjustNamedCounter(
  state: TrackerState,
  label: PlayerLabel,
  counterId: NamedCounterId,
  delta: number
): TrackerState {
  return updatePlayer(state, label, (player) => ({
    ...player,
    namedCounters: {
      ...player.namedCounters,
      [counterId]: clampCounterValue(player.namedCounters[counterId] + delta)
    }
  }));
}

export function setNamedCounter(
  state: TrackerState,
  label: PlayerLabel,
  counterId: NamedCounterId,
  value: number
): TrackerState {
  return updatePlayer(state, label, (player) => ({
    ...player,
    namedCounters: {
      ...player.namedCounters,
      [counterId]: clampCounterValue(value)
    }
  }));
}

export function addCustomCounter(state: TrackerState, label: PlayerLabel, name: string): TrackerState {
  return updatePlayer(state, label, (player) => ({
    ...player,
    customCounters: [...player.customCounters, { id: createCustomCounterId(), name, amount: 0 }]
  }));
}

export function adjustCustomCounter(
  state: TrackerState,
  label: PlayerLabel,
  counterId: string,
  delta: number
): TrackerState {
  return updatePlayer(state, label, (player) => ({
    ...player,
    customCounters: player.customCounters.map((counter) =>
      counter.id === counterId ? { ...counter, amount: clampCounterValue(counter.amount + delta) } : counter
    )
  }));
}

export function setCustomCounter(
  state: TrackerState,
  label: PlayerLabel,
  counterId: string,
  value: number
): TrackerState {
  return updatePlayer(state, label, (player) => ({
    ...player,
    customCounters: player.customCounters.map((counter) =>
      counter.id === counterId ? { ...counter, amount: clampCounterValue(value) } : counter
    )
  }));
}

export function removeCustomCounter(state: TrackerState, label: PlayerLabel, counterId: string): TrackerState {
  return updatePlayer(state, label, (player) => ({
    ...player,
    customCounters: player.customCounters.filter((counter) => counter.id !== counterId)
  }));
}

/**
 * Sets the commander-damage value received by `targetLabel` from `sourceLabel`. The own-seat "me"
 * cell (source === target) is never a stored entry and is a no-op. When the applied change is a
 * positive increase, the target's life drops by that same amount; decreases and non-positive
 * changes never affect life.
 */
export function setCommanderDamage(
  state: TrackerState,
  targetLabel: PlayerLabel,
  sourceLabel: PlayerLabel,
  value: number
): TrackerState {
  if (sourceLabel === targetLabel) {
    return state;
  }

  const targetPlayer = state.players.find((player) => player.label === targetLabel);
  if (!targetPlayer) {
    return state;
  }

  const previousValue = targetPlayer.commanderDamage[sourceLabel] ?? 0;
  const nextValue = clampCounterValue(value);
  const appliedIncrease = Math.max(0, nextValue - previousValue);
  const shouldReduceLife = appliedIncrease > 0;

  return updatePlayer(state, targetLabel, (player) => ({
    ...player,
    commanderDamage: {
      ...player.commanderDamage,
      [sourceLabel]: nextValue
    },
    life: shouldReduceLife ? player.life - appliedIncrease : player.life
  }));
}

export function adjustCommanderDamage(
  state: TrackerState,
  targetLabel: PlayerLabel,
  sourceLabel: PlayerLabel,
  delta: number
): TrackerState {
  const targetPlayer = state.players.find((player) => player.label === targetLabel);
  const currentValue = targetPlayer?.commanderDamage[sourceLabel] ?? 0;
  return setCommanderDamage(state, targetLabel, sourceLabel, currentValue + delta);
}

export function setLayoutMode(state: TrackerState, mode: LayoutMode): TrackerState {
  return { ...state, layoutMode: mode };
}

export function setCardStyle(state: TrackerState, cardStyle: CardStyle): TrackerState {
  return { ...state, cardStyle };
}

/** Turning tracking on always starts the game at day; turning it off leaves the phase untouched. */
export function setDayNightEnabled(state: TrackerState, dayNightEnabled: boolean): TrackerState {
  return {
    ...state,
    dayNightEnabled,
    dayNightPhase: dayNightEnabled ? DEFAULT_DAY_NIGHT_PHASE : state.dayNightPhase
  };
}

export function setDayNightPhase(state: TrackerState, dayNightPhase: DayNightPhase): TrackerState {
  return { ...state, dayNightPhase };
}

/** The only transition MTG's day/night has: it flips. There is no third designation to cycle to. */
export function toggleDayNightPhase(state: TrackerState): TrackerState {
  return setDayNightPhase(state, state.dayNightPhase === "day" ? "night" : "day");
}

/** Preserves player count, names, and settings; zeroes every counter and restores life to the starting value. */
export function resetGame(state: TrackerState): TrackerState {
  return {
    ...state,
    dayNightPhase: DEFAULT_DAY_NIGHT_PHASE,
    players: state.players.map((player) => ({
      ...player,
      life: state.startingLife,
      namedCounters: createEmptyNamedCounters(),
      commanderDamage: {},
      customCounters: player.customCounters.map((counter) => ({ ...counter, amount: 0 }))
    }))
  };
}

/**
 * Discards the current game entirely and restores the documented default game. Presentation
 * preferences (layout, card style, day/night tracking) are carried over when supplied: they
 * describe how the user wants the tracker to look/behave, not the game being discarded, so
 * silently reverting them on New Game would keep undoing the user's explicit choices.
 */
export function startNewGame(preferences: Partial<TrackerPreferences> = {}): TrackerState {
  return createDefaultGame(preferences.layoutMode ?? DEFAULT_LAYOUT_MODE, preferences);
}
