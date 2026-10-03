import { describe, expect, it } from "vitest";
import { computeShelfDropIndex, type ShelfTileRect } from "./shelfDragReorder";

const tiles: ShelfTileRect[] = [
  { instanceId: "a", left: 0, width: 100 },
  { instanceId: "b", left: 100, width: 100 },
  { instanceId: "c", left: 200, width: 100 }
];

describe("computeShelfDropIndex", () => {
  it("keeps the dragged tile at index 0 when the pointer stays left of every other tile's center", () => {
    expect(computeShelfDropIndex(tiles, "a", 10)).toBe(0);
  });

  it("moves the dragged tile past a tile once the pointer crosses its center", () => {
    // Dragging "a" past "b"'s center (150) but before "c"'s center (250).
    expect(computeShelfDropIndex(tiles, "a", 160)).toBe(1);
  });

  it("moves the dragged tile to the end once the pointer passes every other tile's center", () => {
    expect(computeShelfDropIndex(tiles, "a", 999)).toBe(2);
  });

  it("computes the drop index relative to the tiles excluding the dragged one", () => {
    // Dragging "c" back toward the start — remaining tiles are "a" (center 50) and
    // "b" (center 150).
    expect(computeShelfDropIndex(tiles, "c", 10)).toBe(0);
    expect(computeShelfDropIndex(tiles, "c", 120)).toBe(1);
  });
});
