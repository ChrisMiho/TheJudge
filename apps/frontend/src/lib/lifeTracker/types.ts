import type { PlayerLabel } from "../../types";
import type { NamedCounterId } from "./counters";

/** A user-added generic counter with a stable id, display name, and amount. */
export type CustomCounter = {
  id: string;
  name: string;
  amount: number;
};

/** Commander damage taken by a player, keyed by the opponent source's fixed label. */
export type CommanderDamageBySource = Partial<Record<PlayerLabel, number>>;

export type TrackerPlayer = {
  label: PlayerLabel;
  displayName: string;
  life: number;
  namedCounters: Record<NamedCounterId, number>;
  commanderDamage: CommanderDamageBySource;
  customCounters: CustomCounter[];
};

export type TrackerState = {
  /** 2-8, always equal to `players.length`. */
  playerCount: number;
  startingLife: number;
  /** When enabled, an applied positive increase in commander damage also reduces the target's life. */
  commanderDamageToLife: boolean;
  players: TrackerPlayer[];
};
