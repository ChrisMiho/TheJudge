import { describe, expect, it } from "vitest";
import {
  listSeatArrangement,
  type SeatArrangementLayout,
  type SeatPlacement,
  seatArrangement
} from "./seatArrangement";

/** Parses a CSS grid-row/grid-column value (`"<start> / <end>"`) into numeric line numbers. */
function parseGridLine(value: string): { start: number; end: number } {
  const [start, end] = value.split(" / ").map(Number);
  return { start, end };
}

/** True when two seats' grid rectangles occupy any shared cell. */
function placementsOverlap(a: SeatPlacement, b: SeatPlacement): boolean {
  const rowA = parseGridLine(a.gridRow);
  const rowB = parseGridLine(b.gridRow);
  const columnA = parseGridLine(a.gridColumn);
  const columnB = parseGridLine(b.gridColumn);

  const rowsOverlap = rowA.start < rowB.end && rowB.start < rowA.end;
  const columnsOverlap = columnA.start < columnB.end && columnB.start < columnA.end;

  return rowsOverlap && columnsOverlap;
}

function expectNoOverlaps(layout: SeatArrangementLayout): void {
  for (let i = 0; i < layout.seats.length; i += 1) {
    for (let j = i + 1; j < layout.seats.length; j += 1) {
      expect(placementsOverlap(layout.seats[i], layout.seats[j])).toBe(false);
    }
  }
}

const VALID_ROTATIONS = new Set([0, 90, 180, 270]);

describe("Frontend - Shared", () => {
  describe("seatArrangement", () => {
    it("returns the exact 2-player top/bottom halves layout", () => {
      expect(seatArrangement(2)).toEqual<SeatArrangementLayout>({
        playerCount: 2,
        columns: 1,
        rows: 2,
        seats: [
          {
            label: "Player 1",
            side: "top",
            rotation: 180,
            gridArea: "seat-player-1",
            gridRow: "1 / 2",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 2",
            side: "bottom",
            rotation: 0,
            gridArea: "seat-player-2",
            gridRow: "2 / 3",
            gridColumn: "1 / 2"
          }
        ]
      });
    });

    it("returns the exact 3-player one-top-two-bottom layout", () => {
      expect(seatArrangement(3)).toEqual<SeatArrangementLayout>({
        playerCount: 3,
        columns: 2,
        rows: 2,
        seats: [
          {
            label: "Player 1",
            side: "top",
            rotation: 180,
            gridArea: "seat-player-1",
            gridRow: "1 / 2",
            gridColumn: "1 / 3"
          },
          {
            label: "Player 2",
            side: "bottom",
            rotation: 0,
            gridArea: "seat-player-2",
            gridRow: "2 / 3",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 3",
            side: "bottom",
            rotation: 0,
            gridArea: "seat-player-3",
            gridRow: "2 / 3",
            gridColumn: "2 / 3"
          }
        ]
      });
    });

    it("returns the exact 4-player 2x2 layout matching the reference photo orientation", () => {
      expect(seatArrangement(4)).toEqual<SeatArrangementLayout>({
        playerCount: 4,
        columns: 2,
        rows: 2,
        seats: [
          {
            label: "Player 1",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-1",
            gridRow: "1 / 2",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 2",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-2",
            gridRow: "2 / 3",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 3",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-3",
            gridRow: "1 / 2",
            gridColumn: "2 / 3"
          },
          {
            label: "Player 4",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-4",
            gridRow: "2 / 3",
            gridColumn: "2 / 3"
          }
        ]
      });
    });

    it("returns the exact 5-player left/right column layout split 3/2", () => {
      expect(seatArrangement(5)).toEqual<SeatArrangementLayout>({
        playerCount: 5,
        columns: 2,
        rows: 3,
        seats: [
          {
            label: "Player 1",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-1",
            gridRow: "1 / 2",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 2",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-2",
            gridRow: "2 / 3",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 3",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-3",
            gridRow: "3 / 4",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 4",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-4",
            gridRow: "1 / 2",
            gridColumn: "2 / 3"
          },
          {
            label: "Player 5",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-5",
            gridRow: "2 / 3",
            gridColumn: "2 / 3"
          }
        ]
      });
    });

    it("returns the exact 6-player left/right column layout split 3/3", () => {
      expect(seatArrangement(6)).toEqual<SeatArrangementLayout>({
        playerCount: 6,
        columns: 2,
        rows: 3,
        seats: [
          {
            label: "Player 1",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-1",
            gridRow: "1 / 2",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 2",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-2",
            gridRow: "2 / 3",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 3",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-3",
            gridRow: "3 / 4",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 4",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-4",
            gridRow: "1 / 2",
            gridColumn: "2 / 3"
          },
          {
            label: "Player 5",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-5",
            gridRow: "2 / 3",
            gridColumn: "2 / 3"
          },
          {
            label: "Player 6",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-6",
            gridRow: "3 / 4",
            gridColumn: "2 / 3"
          }
        ]
      });
    });

    it("returns the exact 7-player left/right column layout split 4/3", () => {
      expect(seatArrangement(7)).toEqual<SeatArrangementLayout>({
        playerCount: 7,
        columns: 2,
        rows: 4,
        seats: [
          {
            label: "Player 1",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-1",
            gridRow: "1 / 2",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 2",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-2",
            gridRow: "2 / 3",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 3",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-3",
            gridRow: "3 / 4",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 4",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-4",
            gridRow: "4 / 5",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 5",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-5",
            gridRow: "1 / 2",
            gridColumn: "2 / 3"
          },
          {
            label: "Player 6",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-6",
            gridRow: "2 / 3",
            gridColumn: "2 / 3"
          },
          {
            label: "Player 7",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-7",
            gridRow: "3 / 4",
            gridColumn: "2 / 3"
          }
        ]
      });
    });

    it("returns the exact 8-player left/right column layout split 4/4", () => {
      expect(seatArrangement(8)).toEqual<SeatArrangementLayout>({
        playerCount: 8,
        columns: 2,
        rows: 4,
        seats: [
          {
            label: "Player 1",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-1",
            gridRow: "1 / 2",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 2",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-2",
            gridRow: "2 / 3",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 3",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-3",
            gridRow: "3 / 4",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 4",
            side: "left",
            rotation: 90,
            gridArea: "seat-player-4",
            gridRow: "4 / 5",
            gridColumn: "1 / 2"
          },
          {
            label: "Player 5",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-5",
            gridRow: "1 / 2",
            gridColumn: "2 / 3"
          },
          {
            label: "Player 6",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-6",
            gridRow: "2 / 3",
            gridColumn: "2 / 3"
          },
          {
            label: "Player 7",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-7",
            gridRow: "3 / 4",
            gridColumn: "2 / 3"
          },
          {
            label: "Player 8",
            side: "right",
            rotation: 270,
            gridArea: "seat-player-8",
            gridRow: "4 / 5",
            gridColumn: "2 / 3"
          }
        ]
      });
    });

    describe.each([2, 3, 4, 5, 6, 7, 8])("layout invariants for %i players", (count) => {
      const layout = seatArrangement(count);

      it("has exactly one descriptor per active seat with unique fixed labels", () => {
        expect(layout.seats).toHaveLength(count);
        expect(new Set(layout.seats.map((placement) => placement.label)).size).toBe(count);
      });

      it("only uses documented seat sides and rotation degrees", () => {
        for (const placement of layout.seats) {
          expect(["top", "bottom", "left", "right"]).toContain(placement.side);
          expect(VALID_ROTATIONS.has(placement.rotation)).toBe(true);
        }
      });

      it("never places two seats on overlapping grid cells", () => {
        expectNoOverlaps(layout);
      });
    });

    describe("invalid player counts", () => {
      it.each([1, 9, 4.5, Number.NaN])("rejects %s rather than returning a partial layout", (count) => {
        expect(() => seatArrangement(count)).toThrow(RangeError);
      });
    });
  });

  describe("listSeatArrangement", () => {
    it.each([2, 8])("returns an unrotated single-column list for %i players", (count) => {
      const layout = listSeatArrangement(count);

      expect(layout.playerCount).toBe(count);
      expect(layout.columns).toBe(1);
      expect(layout.rows).toBe(count);
      expect(layout.seats.map((placement) => placement.label)).toEqual(
        Array.from({ length: count }, (_, index) => `Player ${index + 1}`)
      );

      for (const [index, placement] of layout.seats.entries()) {
        expect(placement.side).toBe("bottom");
        expect(placement.rotation).toBe(0);
        expect(placement.gridArea).toBe(`seat-player-${index + 1}`);
        expect(placement.gridRow).toBe(`${index + 1} / ${index + 2}`);
        expect(placement.gridColumn).toBe("1 / 2");
      }
    });

    it.each([1, 9, 2.5, Number.NaN])("rejects invalid player count %s", (count) => {
      expect(() => listSeatArrangement(count)).toThrow(RangeError);
    });
  });
});
