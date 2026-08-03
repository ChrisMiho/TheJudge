// Counter palette metadata for the player life tracker. This is the single
// source of truth mapping named counters to their optional GameContext target
// so the later counter panel and seed-adapter slices import it instead of
// redefining their own mapping (reuse-before-create).

/** Optional additive `GamePlayerContext` field a named counter feeds. */
export type GameContextCounterTarget = "poison" | "energy" | "experience";

export type NamedCounterId =
  | "monarch"
  | "treasure"
  | "initiative"
  | "poison"
  | "ascend"
  | "rad"
  | "dayNight"
  | "cTax"
  | "ko"
  | "energy"
  | "exp";

export type NamedCounterDefinition = {
  id: NamedCounterId;
  label: string;
  /** Present only when this counter also feeds an additive GameContext field. */
  gameContextTarget?: GameContextCounterTarget;
};

/**
 * The full named-counter palette (DEC-101). Order matches the product
 * reference screenshots. Do not redefine this list or its GameContext
 * mapping elsewhere — import it.
 */
export const NAMED_COUNTER_PALETTE: readonly NamedCounterDefinition[] = [
  { id: "monarch", label: "Monarch" },
  { id: "treasure", label: "Treasure" },
  { id: "initiative", label: "Initiative" },
  { id: "poison", label: "Poison", gameContextTarget: "poison" },
  { id: "ascend", label: "Ascend" },
  { id: "rad", label: "Rad" },
  { id: "dayNight", label: "Day/night" },
  { id: "cTax", label: "C.Tax" },
  { id: "ko", label: "K.O." },
  { id: "energy", label: "Energy", gameContextTarget: "energy" },
  { id: "exp", label: "Exp", gameContextTarget: "experience" }
];

export const NAMED_COUNTER_IDS: readonly NamedCounterId[] = NAMED_COUNTER_PALETTE.map(
  (definition) => definition.id
);

const NAMED_COUNTER_ID_SET: ReadonlySet<string> = new Set(NAMED_COUNTER_IDS);

export function isNamedCounterId(value: string): value is NamedCounterId {
  return NAMED_COUNTER_ID_SET.has(value);
}

export function getNamedCounterDefinition(id: NamedCounterId): NamedCounterDefinition {
  const definition = NAMED_COUNTER_PALETTE.find((candidate) => candidate.id === id);
  if (!definition) {
    throw new Error(`Unknown named counter id: ${id}`);
  }
  return definition;
}

/** A fresh, fully-zeroed named-counter map keyed by every palette id. */
export function createEmptyNamedCounters(): Record<NamedCounterId, number> {
  return NAMED_COUNTER_PALETTE.reduce<Record<NamedCounterId, number>>((accumulator, definition) => {
    accumulator[definition.id] = 0;
    return accumulator;
  }, {} as Record<NamedCounterId, number>);
}

/** Counters and commander-damage values never go negative. */
export function clampCounterValue(value: number): number {
  return value < 0 ? 0 : value;
}
