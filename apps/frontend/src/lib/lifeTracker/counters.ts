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
  /** Decorative-only glyph for the counter panel tile; not part of any data contract. */
  icon: string;
  /** Present only when this counter also feeds an additive GameContext field. */
  gameContextTarget?: GameContextCounterTarget;
};

/**
 * The full named-counter palette (DEC-101). Order matches the product
 * reference screenshots. Do not redefine this list or its GameContext
 * mapping elsewhere — import it.
 */
export const NAMED_COUNTER_PALETTE: readonly NamedCounterDefinition[] = [
  { id: "monarch", label: "Monarch", icon: "\u{1F451}" },
  { id: "treasure", label: "Treasure", icon: "\u{1F4B0}" },
  { id: "initiative", label: "Initiative", icon: "\u{1F6E1}\u{FE0F}" },
  { id: "poison", label: "Poison", icon: "\u{2623}\u{FE0F}", gameContextTarget: "poison" },
  { id: "ascend", label: "Ascend", icon: "\u{2B06}\u{FE0F}" },
  { id: "rad", label: "Rad", icon: "\u{2622}\u{FE0F}" },
  { id: "dayNight", label: "Day/night", icon: "\u{1F317}" },
  { id: "cTax", label: "C.Tax", icon: "\u{1F3F0}" },
  { id: "ko", label: "K.O.", icon: "\u{1F480}" },
  { id: "energy", label: "Energy", icon: "\u{26A1}", gameContextTarget: "energy" },
  { id: "exp", label: "Exp", icon: "\u{2B50}", gameContextTarget: "experience" }
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
