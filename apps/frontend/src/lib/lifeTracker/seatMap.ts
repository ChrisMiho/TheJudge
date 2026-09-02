import type { PlayerLabel } from "../../types";
import type { SeatArrangementLayout } from "./seatArrangement";
import type { TrackerPlayer } from "./types";

/**
 * One player's cell within a seat map (REQ-173): the placement copied straight from that same
 * player's own entry in the active `SeatArrangementLayout`, not from array order. Content (the
 * commander-damage value, "me", the panel's `CommanderDamageCell`) is decided by the caller —
 * `buildSeatMapCells` only answers "where does this player's cell sit".
 */
export type SeatMapCell = {
  label: PlayerLabel;
  isSelf: boolean;
  gridRow: string;
  gridColumn: string;
  gridArea: string;
};

/**
 * Places every player in `players` at that player's own seat in `layout` - a pure, framework-
 * agnostic function like `seatArrangement.ts` itself: no React import, no DOM/browser global
 * read, no `lib/lifeTracker/state.ts` import.
 *
 * A player whose label has no matching seat in `layout.seats` is skipped (mirrors the existing
 * `if (!player) return null` guard in `PlayerLifeTrackerApp`) rather than crashing - the seat map
 * is only ever built from an already-consistent `players` + `layout` pair, but a partial mismatch
 * should degrade rather than throw.
 */
export function buildSeatMapCells(
  layout: SeatArrangementLayout,
  players: TrackerPlayer[],
  viewerLabel: PlayerLabel
): SeatMapCell[] {
  const cells: SeatMapCell[] = [];

  for (const player of players) {
    const seat = layout.seats.find((candidate) => candidate.label === player.label);
    if (!seat) continue;

    cells.push({
      label: player.label,
      isSelf: player.label === viewerLabel,
      gridRow: seat.gridRow,
      gridColumn: seat.gridColumn,
      gridArea: seat.gridArea
    });
  }

  return cells;
}
