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
 * Seating order (REQ-081, matching the reference photos `intake/references/4TableGrid.png` and
 * `fullTable.PNG`): **Player 1 sits nearest the viewer and the rest are seated clockwise.** In the
 * grid layout that means Player 1 is the bottom-left seat; the left column fills bottom-to-top
 * (`Player 1..left`), then the right column fills top-to-bottom (`Player left+1..N`) - so reading
 * clockwise from the bottom-left corner gives `Player 1, 2, 3, ...`.
 *
 * v1 layouts:
 * - 2: top/bottom halves (1 grid column x 2 rows) - Player 1 on the bottom.
 * - 3: two bottom seats split into two columns, plus one top seat spanning the full width.
 * - 4: a 2x2 table - a left column and a right column of two seats each.
 * - 5-8: left/right seat columns split 3/2, 3/3, 4/3, and 4/4.
 *
 * Rotation convention (degrees, clockwise, matches the CSS `rotate()` function):
 * - top seats: 180 - upside-down relative to the default/bottom orientation, facing the top edge.
 * - bottom seats: 0 - the default/upright orientation, facing the bottom edge.
 * - left-column seats: 90 - rotated clockwise to face the left edge.
 * - right-column seats: 270 - rotated counter-clockwise to face the right edge.
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

/** A seat's placement/rotation before a player label is assigned to it. */
type SeatSlot = {
  side: SeatSide;
  rotation: SeatRotationDegrees;
  gridRow: string;
  gridColumn: string;
};

function playerLabelAt(index: number): PlayerLabel {
  return `Player ${index + 1}` as PlayerLabel;
}

function gridAreaFor(label: PlayerLabel): string {
  return `seat-${label.toLowerCase().replace(" ", "-")}`;
}

function slot(
  side: SeatSide,
  rotation: SeatRotationDegrees,
  rowStart: number,
  rowEnd: number,
  columnStart: number,
  columnEnd: number
): SeatSlot {
  return {
    side,
    rotation,
    gridRow: `${rowStart} / ${rowEnd}`,
    gridColumn: `${columnStart} / ${columnEnd}`
  };
}

/**
 * Assigns `Player 1..N` to the given seat slots in order - the slots must already be listed in the
 * clockwise-from-nearest seating order, so `slots[0]` becomes Player 1 (nearest) and the array is
 * returned in `Player 1..N` order.
 */
function seatPlayers(slots: SeatSlot[]): SeatPlacement[] {
  return slots.map((seat, index) => {
    const label = playerLabelAt(index);
    return {
      label,
      side: seat.side,
      rotation: seat.rotation,
      gridArea: gridAreaFor(label),
      gridRow: seat.gridRow,
      gridColumn: seat.gridColumn
    };
  });
}

/** Top/bottom halves: Player 1 nearest on the bottom edge, Player 2 facing the top edge. */
function twoPlayerLayout(): SeatArrangementLayout {
  return {
    playerCount: 2,
    columns: 1,
    rows: 2,
    // Clockwise from the nearest seat: bottom (Player 1), then top (Player 2).
    seats: seatPlayers([slot("bottom", 0, 2, 3, 1, 2), slot("top", 180, 1, 2, 1, 2)])
  };
}

/** Two bottom seats split into two columns, plus one top seat spanning the full width. */
function threePlayerLayout(): SeatArrangementLayout {
  return {
    playerCount: 3,
    columns: 2,
    rows: 2,
    // Clockwise from the nearest seat: bottom-left (Player 1), top (Player 2), bottom-right (Player 3).
    seats: seatPlayers([
      slot("bottom", 0, 2, 3, 1, 2),
      slot("top", 180, 1, 2, 1, 3),
      slot("bottom", 0, 2, 3, 2, 3)
    ])
  };
}

/**
 * Left/right seat columns (used for 4-8 players). Player 1 is nearest at the bottom-left; the left
 * column fills bottom-to-top (`Player 1..left`), then the right column fills top-to-bottom
 * (`Player left+1..left+right`), so reading clockwise from the bottom-left corner gives
 * `Player 1, 2, 3, ...` - the seating in `references/4TableGrid.png` / `fullTable.PNG`. Left-column
 * seats rotate clockwise (90deg) to face the left edge, right-column seats rotate counter-clockwise
 * (270deg) to face the right edge.
 */
function columnSplitLayout(leftCount: number, rightCount: number): SeatArrangementLayout {
  const slots: SeatSlot[] = [];

  // Left column: Player 1..left, seated bottom-to-top so Player 1 (nearest) is the bottom-left seat.
  for (let index = 0; index < leftCount; index += 1) {
    const rowFromTop = leftCount - 1 - index;
    slots.push(slot("left", 90, rowFromTop + 1, rowFromTop + 2, 1, 2));
  }

  // Right column: Player left+1..N, top-to-bottom, continuing clockwise past the top of the table.
  for (let index = 0; index < rightCount; index += 1) {
    slots.push(slot("right", 270, index + 1, index + 2, 2, 3));
  }

  return {
    playerCount: leftCount + rightCount,
    columns: 2,
    rows: Math.max(leftCount, rightCount),
    seats: seatPlayers(slots)
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
 * Seating order (REQ-081, matching `references/4TableList.png` / `fullTableList.PNG`): Player 1
 * sits nearest, then clockwise. So Player 1 takes the foot seat (or, when there is no foot seat,
 * the bottom of the left column); the left column then fills bottom-to-top, the head seat comes
 * next, and the right column fills top-to-bottom - reading clockwise from the nearest seat gives
 * `Player 1, 2, 3, ...`.
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
  let row = 1;

  // Build the seat SLOTS (position + rotation) top-to-bottom: a head at the top, then side-by-side
  // pair rows, then - when the remaining players are odd - a foot at the bottom.
  const headSlot = slot("top", 180, row, row + 1, 1, columns + 1);
  row += 1;

  const remainingAfterHead = count - 1;
  const hasFootSeat = remainingAfterHead % 2 === 1;
  const pairedCount = hasFootSeat ? remainingAfterHead - 1 : remainingAfterHead;

  const leftColumn: SeatSlot[] = [];
  const rightColumn: SeatSlot[] = [];
  for (let pairRow = 0; pairRow < pairedCount / 2; pairRow += 1) {
    leftColumn.push(slot("bottom", 0, row, row + 1, 1, 2));
    rightColumn.push(slot("bottom", 0, row, row + 1, 2, 3));
    row += 1;
  }

  let footSlot: SeatSlot | null = null;
  if (hasFootSeat) {
    footSlot = slot("bottom", 0, row, row + 1, 1, columns + 1);
    row += 1;
  }

  // Seat clockwise from the nearest seat: the foot (bottom, nearest) first, then up the left column
  // (bottom-to-top), across the head, then down the right column (top-to-bottom). With no foot
  // (odd counts) start at the bottom of the left column so Player 1 is still the nearest seat.
  const clockwise: SeatSlot[] = [
    ...(footSlot ? [footSlot] : []),
    ...[...leftColumn].reverse(),
    headSlot,
    ...rightColumn
  ];

  return {
    playerCount: count,
    columns,
    rows: row - 1,
    seats: seatPlayers(clockwise)
  };
}
