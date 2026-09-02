import { describe, expect, it } from "vitest";
import { seatArrangement } from "./seatArrangement";
import { buildSeatMapCells } from "./seatMap";
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
});
