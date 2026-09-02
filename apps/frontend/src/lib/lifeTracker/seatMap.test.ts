import { describe, expect, it } from "vitest";
import { listSeatArrangement, seatArrangement } from "./seatArrangement";
import { buildCompactSeatMapCells, buildSeatMapCells } from "./seatMap";
import { createInitialState } from "./state";

describe("Frontend - Shared", () => {
  describe("buildSeatMapCells", () => {
    it("places every player at that player's own seat from layout.seats, not array order (4 players)", () => {
      const { players } = createInitialState(4, 40);
      const layout = seatArrangement(4);

      const cells = buildSeatMapCells(layout, players, "Player 1");

      expect(cells).toHaveLength(players.length);
      for (const cell of cells) {
        const ownSeat = layout.seats.find((seat) => seat.label === cell.label);
        expect(ownSeat).toBeDefined();
        expect(cell.gridRow).toBe(ownSeat!.gridRow);
        expect(cell.gridColumn).toBe(ownSeat!.gridColumn);
        expect(cell.gridArea).toBe(ownSeat!.gridArea);
      }
    });

    it("places every player at that player's own seat from layout.seats, not array order (8 players)", () => {
      const { players } = createInitialState(8, 40);
      const layout = seatArrangement(8);

      const cells = buildSeatMapCells(layout, players, "Player 1");

      expect(cells).toHaveLength(players.length);
      for (const cell of cells) {
        const ownSeat = layout.seats.find((seat) => seat.label === cell.label);
        expect(ownSeat).toBeDefined();
        expect(cell.gridRow).toBe(ownSeat!.gridRow);
        expect(cell.gridColumn).toBe(ownSeat!.gridColumn);
        expect(cell.gridArea).toBe(ownSeat!.gridArea);
      }
    });

    it("marks exactly one cell isSelf, matching the viewer label", () => {
      const { players } = createInitialState(6, 40);
      const layout = seatArrangement(6);

      const cells = buildSeatMapCells(layout, players, "Player 4");
      const selfCells = cells.filter((cell) => cell.isSelf);

      expect(selfCells).toHaveLength(1);
      expect(selfCells[0].label).toBe("Player 4");
    });

    it("skips a player whose label has no matching seat in layout.seats, rather than crashing", () => {
      const { players } = createInitialState(4, 40);
      const layout = seatArrangement(4);
      const shortLayout = { ...layout, seats: layout.seats.slice(0, 2) };

      const cells = buildSeatMapCells(shortLayout, players, "Player 1");

      expect(cells).toHaveLength(2);
      expect(cells.map((cell) => cell.label)).toEqual(["Player 1", "Player 2"]);
    });
  });

  describe("buildCompactSeatMapCells", () => {
    it("has at most 2 rows at every supported player count (2-8)", () => {
      for (let count = 2; count <= 8; count += 1) {
        const { players } = createInitialState(count, 40);
        const layout = seatArrangement(count);

        const block = buildCompactSeatMapCells(layout, players, "Player 1");

        expect(block.rows).toBeLessThanOrEqual(2);
        expect(block.cells.every((cell) => cell.row < block.rows)).toBe(true);
      }
    });

    it("grows wider (more columns), not taller, as the player count rises - 8 players is 2x4, not 4x2 or a ceil(sqrt(8))=3 square", () => {
      const eight = buildCompactSeatMapCells(seatArrangement(8), createInitialState(8, 40).players, "Player 1");
      expect(eight.rows).toBe(2);
      expect(eight.columns).toBe(4);
      expect(eight.columns).toBeGreaterThan(eight.rows);

      const four = buildCompactSeatMapCells(seatArrangement(4), createInitialState(4, 40).players, "Player 1");
      const six = buildCompactSeatMapCells(seatArrangement(6), createInitialState(6, 40).players, "Player 1");
      // Six matches the reference images exactly: 2 rows x 3 columns.
      expect(six.rows).toBe(2);
      expect(six.columns).toBe(3);
      expect(four.columns).toBeLessThanOrEqual(six.columns);
      expect(six.columns).toBeLessThanOrEqual(eight.columns);
    });

    it("marks exactly one cell as the viewer's own, at a fixed corner position, for every supported count", () => {
      for (let count = 2; count <= 8; count += 1) {
        const { players } = createInitialState(count, 40);
        const layout = seatArrangement(count);

        const block = buildCompactSeatMapCells(layout, players, "Player 1");
        const selfCells = block.cells.filter((cell) => cell.isSelf);

        expect(selfCells).toHaveLength(1);
        expect(selfCells[0].row).toBe(0);
        expect(selfCells[0].column).toBe(0);
      }
    });

    it("does not depend on layout.columns/layout.rows - seatArrangement and listSeatArrangement produce the same block shape for the same count and viewer", () => {
      for (const count of [4, 6, 8]) {
        const { players } = createInitialState(count, 40);
        const gridLayout = seatArrangement(count);
        const listLayout = listSeatArrangement(count);

        // The two arrangements' own row counts differ (grid stays short, list stacks tall) -
        // that difference must never leak into the compact block's own shape.
        expect(gridLayout.rows).not.toBe(listLayout.rows);

        const fromGrid = buildCompactSeatMapCells(gridLayout, players, "Player 1");
        const fromList = buildCompactSeatMapCells(listLayout, players, "Player 1");

        expect(fromGrid.rows).toBe(fromList.rows);
        expect(fromGrid.columns).toBe(fromList.columns);
        expect(fromGrid.cells.map((cell) => ({ label: cell.label, row: cell.row, column: cell.column }))).toEqual(
          fromList.cells.map((cell) => ({ label: cell.label, row: cell.row, column: cell.column }))
        );
      }
    });

    it("places every player exactly once, with no gaps in row/column indices beyond the block's own declared shape", () => {
      const { players } = createInitialState(7, 40);
      const layout = seatArrangement(7);

      const block = buildCompactSeatMapCells(layout, players, "Player 3");

      expect(block.cells).toHaveLength(7);
      expect(new Set(block.cells.map((cell) => cell.label)).size).toBe(7);
      for (const cell of block.cells) {
        expect(cell.column).toBeLessThan(block.columns);
        expect(cell.row).toBeLessThan(block.rows);
      }
    });
  });
});
