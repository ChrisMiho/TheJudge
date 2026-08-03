// Pure tracker-to-GameContext roster adapter. The seed is one-way (tracker ->
// Assistant): it reads a TrackerState and returns a fresh plain payload without
// mutating or retaining the source state. Counter routing comes exclusively
// from NAMED_COUNTER_PALETTE — this file never restates that mapping.

import type { GamePlayerContext, PlayerLabel } from "../../types";
import {
  NAMED_COUNTER_PALETTE,
  type GameContextCounterTarget,
  type NamedCounterDefinition
} from "./counters";
import { ALL_PLAYER_LABELS } from "./state";
import type { TrackerPlayer, TrackerState } from "./types";

/** The roster slice of a `GameContext` handed to the Assistant on a tracker handoff. */
export type RosterSeed = {
  playerCount: number;
  players: GamePlayerContext[];
};

type ScalarCounterDefinition = NamedCounterDefinition & {
  gameContextTarget: GameContextCounterTarget;
};

/** Named counters that feed a scalar `GamePlayerContext` field instead of the generic `counters` list. */
const SCALAR_COUNTERS: readonly ScalarCounterDefinition[] = NAMED_COUNTER_PALETTE.filter(
  (definition): definition is ScalarCounterDefinition => definition.gameContextTarget !== undefined
);

/** Named counters with no scalar target; they seed the generic `counters` list under their palette label. */
const GENERIC_NAMED_COUNTERS = NAMED_COUNTER_PALETTE.filter(
  (definition) => definition.gameContextTarget === undefined
);

/** Blank or label-equal display names carry no information, so they are omitted from the payload. */
function toDisplayName(player: TrackerPlayer): string | undefined {
  const trimmed = player.displayName.trim();
  return trimmed.length > 0 && trimmed !== player.label ? trimmed : undefined;
}

/**
 * Populated remaining-palette counters followed by populated custom counters, in tracker order.
 * Entries sharing a trimmed name are merged into the first occurrence so the payload never
 * carries duplicate counter names.
 */
function toGenericCounters(player: TrackerPlayer): { name: string; amount: number }[] {
  const merged: { name: string; amount: number }[] = [];
  const indexByName = new Map<string, number>();

  const addCounter = (name: string, amount: number): void => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0 || amount <= 0) {
      return;
    }

    const existingIndex = indexByName.get(trimmedName);
    if (existingIndex === undefined) {
      indexByName.set(trimmedName, merged.length);
      merged.push({ name: trimmedName, amount });
      return;
    }

    merged[existingIndex] = {
      name: trimmedName,
      amount: merged[existingIndex].amount + amount
    };
  };

  for (const definition of GENERIC_NAMED_COUNTERS) {
    addCounter(definition.label, player.namedCounters[definition.id] ?? 0);
  }

  for (const counter of player.customCounters) {
    addCounter(counter.name, counter.amount);
  }

  return merged;
}

/** Positive per-source commander damage, emitted in fixed seat order regardless of key insertion order. */
function toCommanderDamage(player: TrackerPlayer): { from: PlayerLabel; amount: number }[] {
  const entries: { from: PlayerLabel; amount: number }[] = [];

  for (const source of ALL_PLAYER_LABELS) {
    const amount = player.commanderDamage[source] ?? 0;
    if (amount > 0) {
      entries.push({ from: source, amount });
    }
  }

  return entries;
}

function toGamePlayerContext(player: TrackerPlayer): GamePlayerContext {
  const seeded: GamePlayerContext = {
    label: player.label,
    lifeTotal: player.life
  };

  const displayName = toDisplayName(player);
  if (displayName !== undefined) {
    seeded.displayName = displayName;
  }

  for (const definition of SCALAR_COUNTERS) {
    const amount = player.namedCounters[definition.id] ?? 0;
    if (amount > 0) {
      seeded[definition.gameContextTarget as "poison" | "energy" | "experience"] = amount;
    }
  }

  const commanderDamage = toCommanderDamage(player);
  if (commanderDamage.length > 0) {
    seeded.commanderDamage = commanderDamage;
  }

  const counters = toGenericCounters(player);
  if (counters.length > 0) {
    seeded.counters = counters;
  }

  return seeded;
}

/**
 * Maps a tracker game to the additive roster payload the Assistant seeds from.
 * Zero and unset counters, empty arrays, and uninformative display names are
 * omitted so existing no-counter payloads stay byte-identical. The source state
 * is only read; it is never mutated.
 */
export function trackerStateToRosterSeed(state: TrackerState): RosterSeed {
  const players = state.players.map(toGamePlayerContext);
  return {
    playerCount: players.length,
    players
  };
}
