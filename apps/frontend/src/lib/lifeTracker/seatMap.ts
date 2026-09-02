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

/**
 * One player's cell within the on-card compact-horizontal block (REQ-173): a 0-indexed
 * row/column within the block's own grid, plus the matching CSS grid-row/grid-column strings.
 * Unlike `SeatMapCell`, this carries no `gridArea` - the block is a plain row/column grid, not a
 * named-area layout.
 */
export type CompactSeatMapCell = {
  label: PlayerLabel;
  isSelf: boolean;
  row: number;
  column: number;
  gridRow: string;
  gridColumn: string;
};

/**
 * The compact block's own declared shape (at most 2 rows, growing wider) plus every player's cell
 * within it, so a rendering layer can build a grid template without recomputing shape logic.
 */
export type CompactSeatMap = {
  columns: number;
  rows: number;
  cells: CompactSeatMapCell[];
};

const COMPACT_SEAT_MAP_ROWS = 2;

/**
 * Builds the on-card commander-damage preview's own geometry (REQ-173): a compact, horizontal
 * block - always `COMPACT_SEAT_MAP_ROWS` (2) rows tall, growing wider (more columns) as the
 * player count grows - decoupled from the active `SeatArrangementLayout`'s real `columns`/`rows`.
 * This is deliberately a second, independent builder alongside `buildSeatMapCells`: the panel's
 * matrix stays a top-down replica of the real table, while the on-card preview never uses that
 * shape (the owner's compact-horizontal clarification, 2026-09-02) - never `layout.columns`/
 * `layout.rows`, never a near-square `ceil(sqrt(N))` grid.
 *
 * The viewer's own cell always sits at the block's fixed top-left corner (row 0, column 0), the
 * same corner at every player count. Every opponent fills the remaining cells row-major (row 0
 * left-to-right, then row 1), in "table order" starting from the viewer's own seat and wrapping
 * around `layout.seats` - a best-effort stand-in for real table direction: `layout.seats` is
 * always ordered `Player 1..N` in both `seatArrangement` and `listSeatArrangement` (each function
 * fills seats by strictly increasing player index, whichever real position that index lands in),
 * so walking it from the viewer's own index reproduces the same relative table order in either
 * layout mode without ever reading `layout.columns`/`layout.rows` - which is what keeps this
 * builder's output identical for the same player count regardless of which arrangement supplied
 * the seat data (grid mode's tall column layout vs. list mode's stacked rows never leaks through).
 *
 * Pure and framework-agnostic like `seatArrangement.ts` and `buildSeatMapCells`: no React import,
 * no DOM/browser global read, no `lib/lifeTracker/state.ts` import.
 *
 * A player whose label has no matching seat in `layout.seats` is skipped, mirroring
 * `buildSeatMapCells`'s existing partial-mismatch guard rather than crashing.
 */
export function buildCompactSeatMapCells(
  layout: SeatArrangementLayout,
  players: TrackerPlayer[],
  viewerLabel: PlayerLabel
): CompactSeatMap {
  const seatOrder = layout.seats.map((seat) => seat.label);
  const knownLabels = new Set(players.filter((player) => seatOrder.includes(player.label)).map((player) => player.label));

  const orderedLabels: PlayerLabel[] = [];
  const viewerIndex = seatOrder.indexOf(viewerLabel);
  if (viewerIndex === -1) {
    // The viewer has no seat in this layout - fall back to roster order with the viewer first
    // when present, rather than crashing on a partial mismatch (mirrors buildSeatMapCells).
    if (knownLabels.has(viewerLabel)) orderedLabels.push(viewerLabel);
    for (const label of knownLabels) {
      if (label !== viewerLabel) orderedLabels.push(label);
    }
  } else {
    for (let offset = 0; offset < seatOrder.length; offset += 1) {
      const label = seatOrder[(viewerIndex + offset) % seatOrder.length];
      if (knownLabels.has(label)) orderedLabels.push(label);
    }
  }

  const rows = COMPACT_SEAT_MAP_ROWS;
  const columns = Math.max(1, Math.ceil(orderedLabels.length / rows));

  const cells: CompactSeatMapCell[] = orderedLabels.map((label, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    return {
      label,
      isSelf: label === viewerLabel,
      row,
      column,
      gridRow: `${row + 1} / ${row + 2}`,
      gridColumn: `${column + 1} / ${column + 2}`
    };
  });

  return { columns, rows, cells };
}
