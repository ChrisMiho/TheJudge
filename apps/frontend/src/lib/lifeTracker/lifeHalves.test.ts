import { describe, expect, it } from "vitest";
import { lifeHalvesForSeat } from "./lifeHalves";
import { listSeatArrangement, seatArrangement, type SeatSide } from "./seatArrangement";

const COUNTS = [2, 3, 4, 5, 6, 7, 8];
const OPPOSITE: Record<SeatSide, SeatSide> = { top: "bottom", bottom: "top", left: "right", right: "left" };

describe("Frontend - Life Tracker", () => {
  describe("lifeHalvesForSeat", () => {
    it("grid 2-3 players: `-` on the seat's own top/bottom edge, `+` opposite", () => {
      for (const count of [2, 3]) {
        const layout = seatArrangement(count);
        for (const seat of layout.seats) {
          expect(["top", "bottom"]).toContain(seat.side);
          expect(lifeHalvesForSeat(seat, layout, "grid")).toEqual({
            decrease: seat.side,
            increase: OPPOSITE[seat.side]
          });
        }
      }
    });

    it("grid 4-8 players: left column `-` left, right column `-` right", () => {
      for (const count of [4, 5, 6, 7, 8]) {
        const layout = seatArrangement(count);
        for (const seat of layout.seats) {
          const halves = lifeHalvesForSeat(seat, layout, "grid");
          expect(seat.side === "left" || seat.side === "right").toBe(true);
          expect(halves.decrease).toBe(seat.side);
          expect(halves.increase).toBe(OPPOSITE[seat.side]);
        }
      }
    });

    it("list: head `-` right, foot/left-of-pair `-` left, right-of-pair `-` right", () => {
      for (const count of COUNTS) {
        const layout = listSeatArrangement(count);
        for (const seat of layout.seats) {
          const halves = lifeHalvesForSeat(seat, layout, "list");
          const fullWidth = seat.gridColumn === `1 / ${layout.columns + 1}`;
          if (seat.side === "top") {
            expect(halves).toEqual({ decrease: "right", increase: "left" });
          } else if (fullWidth || seat.gridColumn === "1 / 2") {
            expect(halves).toEqual({ decrease: "left", increase: "right" });
          } else {
            expect(seat.gridColumn).toBe("2 / 3");
            expect(halves).toEqual({ decrease: "right", increase: "left" });
          }
        }
      }
    });

    it("never puts `-` on the edge farthest from the player, in either layout", () => {
      for (const count of COUNTS) {
        for (const mode of ["grid", "list"] as const) {
          const layout = mode === "grid" ? seatArrangement(count) : listSeatArrangement(count);
          for (const seat of layout.seats) {
            const { decrease, increase } = lifeHalvesForSeat(seat, layout, mode);
            expect(decrease).not.toBe(OPPOSITE[seat.side]);
            expect(increase).toBe(OPPOSITE[decrease]);
            if (mode === "grid") expect(decrease).toBe(seat.side);
          }
        }
      }
    });
  });
});
