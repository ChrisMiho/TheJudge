import type { PlayerLabel } from "../../types";
import { NAMED_COUNTER_IDS } from "./counters";
import {
  ALL_PLAYER_LABELS,
  DEFAULT_LAYOUT_MODE,
  MAX_PLAYER_COUNT,
  MIN_PLAYER_COUNT
} from "./state";
import type { CustomCounter, TrackerState } from "./types";

/** DEC-103: browser-local, single-device, frontend-only persistence key for the live tracker game. */
export const TRACKER_STORAGE_KEY = "thejudge.lifeTracker.state";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isPlayerLabel(value: unknown): value is PlayerLabel {
  return typeof value === "string" && (ALL_PLAYER_LABELS as readonly string[]).includes(value);
}

function isValidCustomCounter(value: unknown): value is CustomCounter {
  if (typeof value !== "object" || value === null) return false;
  const counter = value as Record<string, unknown>;
  return (
    typeof counter.id === "string" &&
    counter.id.length > 0 &&
    typeof counter.name === "string" &&
    isNonNegativeNumber(counter.amount)
  );
}

function isValidNamedCounters(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const counters = value as Record<string, unknown>;
  return NAMED_COUNTER_IDS.every((id) => isNonNegativeNumber(counters[id]));
}

function isValidCommanderDamage(value: unknown, ownLabel: PlayerLabel): boolean {
  if (typeof value !== "object" || value === null) return false;
  return Object.entries(value as Record<string, unknown>).every(
    ([sourceLabel, amount]) => isPlayerLabel(sourceLabel) && sourceLabel !== ownLabel && isNonNegativeNumber(amount)
  );
}

function isValidTrackerPlayer(value: unknown, expectedLabel: PlayerLabel): boolean {
  if (typeof value !== "object" || value === null) return false;
  const player = value as Record<string, unknown>;
  return (
    player.label === expectedLabel &&
    typeof player.displayName === "string" &&
    isFiniteNumber(player.life) &&
    isValidNamedCounters(player.namedCounters) &&
    isValidCommanderDamage(player.commanderDamage, expectedLabel) &&
    Array.isArray(player.customCounters) &&
    player.customCounters.every(isValidCustomCounter)
  );
}

/** Validates the stored shape and the 2-8 fixed-label roster invariant before trusting persisted data. */
export function isValidTrackerState(value: unknown): value is TrackerState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Record<string, unknown>;

  if (
    !isFiniteNumber(state.playerCount) ||
    !Number.isInteger(state.playerCount) ||
    state.playerCount < MIN_PLAYER_COUNT ||
    state.playerCount > MAX_PLAYER_COUNT
  ) {
    return false;
  }

  if (!isFiniteNumber(state.startingLife)) return false;

  const players: unknown[] = Array.isArray(state.players) ? state.players : [];
  if (players.length !== state.playerCount) return false;

  const expectedLabels = ALL_PLAYER_LABELS.slice(0, state.playerCount);
  return expectedLabels.every((label, index) => isValidTrackerPlayer(players[index], label));
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Returns the persisted tracker state, or `null` when absent, malformed, or storage is unavailable. Never throws. */
export function loadTrackerState(): TrackerState | null {
  try {
    const storage = getStorage();
    if (!storage) return null;

    const raw = storage.getItem(TRACKER_STORAGE_KEY);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidTrackerState(parsed)) return null;

    const layoutMode = parsed.layoutMode === "grid" || parsed.layoutMode === "list"
      ? parsed.layoutMode
      : DEFAULT_LAYOUT_MODE;
    return { ...parsed, layoutMode };
  } catch {
    return null;
  }
}

/** Persists the complete tracker state. Never throws. */
export function saveTrackerState(state: TrackerState): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Tracker persistence must never interfere with the app's core flow.
  }
}

/** Removes the persisted tracker state (New Game / Reset). Never throws. */
export function clearTrackerState(): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(TRACKER_STORAGE_KEY);
  } catch {
    // Tracker persistence must never interfere with the app's core flow.
  }
}
