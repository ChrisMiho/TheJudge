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

export type LayoutMode = "grid" | "list";

/**
 * Life-card surface treatment. `"gradient"` is the original three-stop ombre (its bright `via-*-50`
 * mid stop is a lot of near-white on screen); `"flat"` is a single solid, lower-luminance tint.
 */
export type CardStyle = "gradient" | "flat";

/** MTG's day/night is one game-wide designation that flips, never a per-player value. */
export type DayNightPhase = "day" | "night";

/** Settings that describe how the table is presented/played rather than the live game itself. */
export type TrackerPreferences = {
  layoutMode: LayoutMode;
  cardStyle: CardStyle;
};

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
  /** Whether the current game's starting life was set explicitly (preset or Custom) rather than by a count-driven default. */
  hasManualStartingLife: boolean;
  layoutMode: LayoutMode;
  cardStyle: CardStyle;
  dayNightPhase: DayNightPhase;
  players: TrackerPlayer[];
};
