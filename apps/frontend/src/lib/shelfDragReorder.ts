/** One shelf tile's horizontal layout, left-to-right in the zone's current
 * array order (bottom-to-top for the Stack; add order elsewhere). */
export type ShelfTileRect = {
  instanceId: string;
  left: number;
  width: number;
};

/**
 * REQ-005/REQ-209: pure drop-index geometry for the shelf's pointer-driven drag
 * reorder (no drag-and-drop library, NFR-004/NFR-006). Given every tile's current
 * left-edge/width and the dragged tile's pointer X position, returns the index the
 * dragged card should land at once it is removed from the array — the same
 * `toIndexAfterRemoval` contract `ZoneCollectionStep`'s reorder handler already uses
 * for the card menu's Down/Up/To top (and Left/Right) buttons, so drag and button
 * reorder share one landing computation.
 *
 * DOM-free and deterministic so a drag pass is unit-testable without a real layout.
 */
export function computeShelfDropIndex(
  tiles: ShelfTileRect[],
  draggedInstanceId: string,
  pointerClientX: number
): number {
  const others = tiles.filter((tile) => tile.instanceId !== draggedInstanceId);
  let index = 0;
  for (const tile of others) {
    const center = tile.left + tile.width / 2;
    if (pointerClientX > center) {
      index += 1;
    } else {
      break;
    }
  }
  return index;
}

/** A pointer move only becomes a drag once it clears this threshold — short enough to
 * feel immediate, long enough that an ordinary tap (open the card menu) never starts one. */
export const DRAG_START_THRESHOLD_PX = 6;
