import type { PlayerLabel } from "../../types";

/**
 * Seat-arrangement contract for the player life tracker table (REQ-081 / DEC-101).
 *
 * `seatArrangement(count)` is a pure, deterministic, framework-agnostic function: it does not
 * read the DOM, tracker state, or any browser global, and it imports nothing from React or from
 * the tracker domain (`lib/lifeTracker/state.ts` etc). Given a supported player count it returns
 * one placement/rotation descriptor per fixed seat, so a rendering layer can lay seats out on a
 * CSS grid without re-deriving per-count layout rules.
 *
 * Supported counts are the integers 2-8 inclusive; every other input (1, 9, non-integers, and
 * `NaN`) throws a `RangeError` rather than silently returning a partial layout.
 *
 * v1 layouts (the 4-player orientation is a manual match against
 * `PRD/work/player-life-tracker/references/IMG_9504.PNG`):
 * - 2: top/bottom halves (1 grid column x 2 rows).
 * - 3: one top seat spanning the full width, plus two bottom seats split into two columns.
 * - 4: a 2x2 table - 2 seats in a left column, 2 seats in a right column.
 * - 5-8: left/right seat columns split 3/2, 3/3, 4/3, and 4/4.
 *
 * Rotation convention (degrees, clockwise, matches the CSS `rotate()` function):
 * - top seats: 180 - upside-down relative to the default/bottom orientation, facing the top edge.
 * - bottom seats: 0 - the default/upright orientation, facing the bottom edge.
 * - left-column seats: 90 - rotated clockwise to face the left edge.
 * - right-column seats: 270 - rotated counter-clockwise to face the right edge.
 *
 * Seats are filled in a fixed, deterministic scan order per layout - top-to-bottom then
 * left-to-right for the 2- and 3-player row layouts; left column top-to-bottom, then right
 * column top-to-bottom, for the 4-8 player column layouts - so `Player 1..N` always maps to the
 * same seat for a given count.
 */

export const MIN_SEAT_ARRANGEMENT_PLAYER_COUNT = 2;
export const MAX_SEAT_ARRANGEMENT_PLAYER_COUNT = 8;

/** Which table edge a seat's content faces once rotated. */
export type SeatSide = "top" | "bottom" | "left" | "right";

/** Clockwise rotation, in degrees, applied to a seat's content so it faces `side`. */
export type SeatRotationDegrees = 0 | 90 | 180 | 270;

/** One fixed seat's placement and rotation within its player-count layout. */
export type SeatPlacement = {
  /** The fixed player label occupying this seat (stable across counts: `Player 1`, `Player 2`, ...). */
  label: PlayerLabel;
  /** Which table edge this seat faces once rotated. */
  side: SeatSide;
  /** Clockwise rotation, in degrees, to apply to the seat's content. */
  rotation: SeatRotationDegrees;
  /** Stable, unique CSS `grid-area` name for this seat within its layout. */
  gridArea: string;
  /** CSS `grid-row` value (`"<start-line> / <end-line>"`). */
  gridRow: string;
  /** CSS `grid-column` value (`"<start-line> / <end-line>"`). */
  gridColumn: string;
};

/** The exhaustive placement/rotation descriptor for every seat at a given supported player count. */
export type SeatArrangementLayout = {
  playerCount: number;
  /** Total CSS grid columns the container should declare (e.g. `grid-template-columns: repeat(columns, 1fr)`). */
  columns: number;
  /** Total CSS grid rows the container should declare (e.g. `grid-template-rows: repeat(rows, 1fr)`). */
  rows: number;
  /** One descriptor per active seat, in `Player 1..N` order. */
  seats: SeatPlacement[];
};

function playerLabelAt(index: number): PlayerLabel {
  return `Player ${index + 1}` as PlayerLabel;
}

function gridAreaFor(label: PlayerLabel): string {
  return `seat-${label.toLowerCase().replace(" ", "-")}`;
}

function seat(
  label: PlayerLabel,
  side: SeatSide,
  rotation: SeatRotationDegrees,
  rowStart: number,
  rowEnd: number,
  columnStart: number,
  columnEnd: number
): SeatPlacement {
  return {
    label,
    side,
    rotation,
    gridArea: gridAreaFor(label),
    gridRow: `${rowStart} / ${rowEnd}`,
    gridColumn: `${columnStart} / ${columnEnd}`
  };
}

/** Top/bottom halves: one seat facing the top edge, one facing the bottom edge. */
function twoPlayerLayout(): SeatArrangementLayout {
  return {
    playerCount: 2,
    columns: 1,
    rows: 2,
    seats: [seat(playerLabelAt(0), "top", 180, 1, 2, 1, 2), seat(playerLabelAt(1), "bottom", 0, 2, 3, 1, 2)]
  };
}

/** One top seat spanning the full width, plus two bottom seats split into two columns. */
function threePlayerLayout(): SeatArrangementLayout {
  return {
    playerCount: 3,
    columns: 2,
    rows: 2,
    seats: [
      seat(playerLabelAt(0), "top", 180, 1, 2, 1, 3),
      seat(playerLabelAt(1), "bottom", 0, 2, 3, 1, 2),
      seat(playerLabelAt(2), "bottom", 0, 2, 3, 2, 3)
    ]
  };
}

/**
 * Left/right seat columns (used for 4-8 players). The left column fills first (`Player 1..left`,
 * top-to-bottom), then the right column (`Player left+1..left+right`, top-to-bottom), matching the
 * 4-player 2x2 orientation confirmed against `references/IMG_9504.PNG`: left-column seats rotate
 * clockwise (90deg) to face the left edge, right-column seats rotate counter-clockwise (270deg) to
 * face the right edge.
 */
function columnSplitLayout(leftCount: number, rightCount: number): SeatArrangementLayout {
  const seats: SeatPlacement[] = [];

  for (let row = 0; row < leftCount; row += 1) {
    seats.push(seat(playerLabelAt(row), "left", 90, row + 1, row + 2, 1, 2));
  }

  for (let row = 0; row < rightCount; row += 1) {
    seats.push(seat(playerLabelAt(leftCount + row), "right", 270, row + 1, row + 2, 2, 3));
  }

  return {
    playerCount: leftCount + rightCount,
    columns: 2,
    rows: Math.max(leftCount, rightCount),
    seats
  };
}

/** `[leftColumnCount, rightColumnCount]` for each 4-8 player count, per the v1 arrangement contract. */
const COLUMN_SPLIT_BY_PLAYER_COUNT: Readonly<Record<number, readonly [number, number]>> = {
  4: [2, 2],
  5: [3, 2],
  6: [3, 3],
  7: [4, 3],
  8: [4, 4]
};

/**
 * Returns the exhaustive per-seat placement/rotation descriptor for `count` players (2-8
 * inclusive). Throws a `RangeError` for any other input - including 1, 9, non-integers, and
 * `NaN` - rather than silently returning a partial layout.
 */
export function seatArrangement(count: number): SeatArrangementLayout {
  if (
    !Number.isInteger(count) ||
    count < MIN_SEAT_ARRANGEMENT_PLAYER_COUNT ||
    count > MAX_SEAT_ARRANGEMENT_PLAYER_COUNT
  ) {
    throw new RangeError(
      `seatArrangement: unsupported player count ${count}; expected an integer from ` +
        `${MIN_SEAT_ARRANGEMENT_PLAYER_COUNT} to ${MAX_SEAT_ARRANGEMENT_PLAYER_COUNT}.`
    );
  }

  if (count === 2) {
    return twoPlayerLayout();
  }

  if (count === 3) {
    return threePlayerLayout();
  }

  const [leftCount, rightCount] = COLUMN_SPLIT_BY_PLAYER_COUNT[count];
  return columnSplitLayout(leftCount, rightCount);
}

/**
 * Row-based "symmetric rows, turned ends" layout (the alternative to `seatArrangement`'s
 * column-based grid, matching the second Layout icon in `references/IMG_9509.PNG`): a single
 * full-width "head" seat facing the top edge, side-by-side pairs facing the bottom edge in
 * between, and - for even player counts, where the remaining players divide evenly - a single
 * full-width "foot" seat facing the bottom edge. This is a direct generalization of the row
 * layouts `seatArrangement` already uses for 2 and 3 players (top seat turned 180deg, remaining
 * seats upright at 0deg) extended up through 8 players, rather than a new design: `count === 2`
 * and `count === 3` here produce the exact same shape as `twoPlayerLayout`/`threePlayerLayout`.
 *
 * Unlike `seatArrangement`'s 4-8 player column split, no seat is ever rotated 90/270deg - every
 * row reads either upright or upside-down, never sideways - which is what makes this the
 * phone-portrait-friendly option: rows stack vertically instead of requiring wide rotated
 * columns, and there are roughly half as many rows as the old one-player-per-row list.
 *
 * Seats fill in a fixed, deterministic scan order - the head seat, then each pair row
 * left-to-right top-to-bottom, then the foot seat last - so `Player 1..N` always maps to the
 * same seat for a given count.
 */
export function listSeatArrangement(count: number): SeatArrangementLayout {
  if (
    !Number.isInteger(count) ||
    count < MIN_SEAT_ARRANGEMENT_PLAYER_COUNT ||
    count > MAX_SEAT_ARRANGEMENT_PLAYER_COUNT
  ) {
    throw new RangeError(
      `listSeatArrangement: unsupported player count ${count}; expected an integer from ` +
        `${MIN_SEAT_ARRANGEMENT_PLAYER_COUNT} to ${MAX_SEAT_ARRANGEMENT_PLAYER_COUNT}.`
    );
  }

  const columns = count === 2 ? 1 : 2;
  const seats: SeatPlacement[] = [];
  let row = 1;
  let nextIndex = 0;

  seats.push(seat(playerLabelAt(nextIndex), "top", 180, row, row + 1, 1, columns + 1));
  nextIndex += 1;
  row += 1;

  const remainingAfterHead = count - nextIndex;
  const hasFootSeat = remainingAfterHead % 2 === 1;
  const pairedCount = hasFootSeat ? remainingAfterHead - 1 : remainingAfterHead;

  for (let pairRow = 0; pairRow < pairedCount / 2; pairRow += 1) {
    seats.push(seat(playerLabelAt(nextIndex), "bottom", 0, row, row + 1, 1, 2));
    seats.push(seat(playerLabelAt(nextIndex + 1), "bottom", 0, row, row + 1, 2, 3));
    nextIndex += 2;
    row += 1;
  }

  if (hasFootSeat) {
    seats.push(seat(playerLabelAt(nextIndex), "bottom", 0, row, row + 1, 1, columns + 1));
    row += 1;
  }

  return {
    playerCount: count,
    columns,
    rows: row - 1,
    seats
  };
}
