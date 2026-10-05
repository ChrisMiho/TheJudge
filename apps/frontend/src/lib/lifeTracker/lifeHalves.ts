import type { LayoutMode } from "./types";
import type { SeatArrangementLayout, SeatPlacement, SeatSide } from "./seatArrangement";

/**
 * Near-edge life split (REQ-217): which card edge carries `−` and which carries `+`.
 *
 * Pure and framework-agnostic. It reads only what the seat arrangements already emit
 * (`side`, `rotation`, `gridColumn`, `layout.columns`) and adds nothing to `SeatPlacement`.
 */
export type LifeHalves = { decrease: SeatSide; increase: SeatSide };

const OPPOSITE: Record<SeatSide, SeatSide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left"
};

/** List seats split by the seated player's own left/right, which rotation alone supplies. */
function lifeHalvesForRotation(rotation: number): LifeHalves {
  switch (rotation) {
    case 180:
      return { decrease: "right", increase: "left" };
    case 90:
      return { decrease: "top", increase: "bottom" };
    case 270:
      return { decrease: "bottom", increase: "top" };
    default:
      return { decrease: "left", increase: "right" };
  }
}

/** True when the seat is the right-hand seat of a side-by-side pair row (not full width). */
function isRightOfPair(placement: SeatPlacement, layout: SeatArrangementLayout): boolean {
  if (layout.columns < 2) return false;
  const [start, end] = placement.gridColumn.split("/").map((part) => Number(part.trim()));
  return end - start === 1 && start === layout.columns;
}

export function lifeHalvesForSeat(
  placement: SeatPlacement,
  layout: SeatArrangementLayout,
  layoutMode: LayoutMode
): LifeHalves {
  if (layoutMode === "grid") {
    return { decrease: placement.side, increase: OPPOSITE[placement.side] };
  }

  // Both pair seats are upright (0deg), so the right-hand seat mirrors: its player's near side
  // is the card's right edge.
  if (placement.rotation === 0 && isRightOfPair(placement, layout)) {
    return { decrease: "right", increase: "left" };
  }
  return lifeHalvesForRotation(placement.rotation);
}
