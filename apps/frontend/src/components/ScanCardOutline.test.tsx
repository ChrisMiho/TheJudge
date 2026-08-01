import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ScanCardOutline } from "./ScanCardOutline";
import type { Point } from "../lib/scan/detector";

afterEach(cleanup);

// A plausible quad in native frame pixels (TL, TR, BR, BL).
const corners: Point[] = [
  { x: 100, y: 80 },
  { x: 540, y: 90 },
  { x: 535, y: 700 },
  { x: 95, y: 690 }
];

describe("Frontend - Card Scan", () => {
  describe("Card outline", () => {
    it("renders the outline polygon for a valid quad", () => {
      render(<ScanCardOutline corners={corners} frameWidth={640} frameHeight={800} variant="debug" />);
      const outline = screen.getByTestId("scan-card-outline");
      expect(outline.querySelectorAll("polygon")).toHaveLength(1);
    });

    it("returns null when corners are null", () => {
      const { container } = render(
        <ScanCardOutline corners={null} frameWidth={640} frameHeight={800} variant="debug" />
      );
      expect(container.firstChild).toBeNull();
    });

    it("returns null when the quad is incomplete", () => {
      const { container } = render(
        <ScanCardOutline corners={corners.slice(0, 3)} frameWidth={640} frameHeight={800} variant="debug" />
      );
      expect(container.firstChild).toBeNull();
    });

    it("returns null when frame dims are missing", () => {
      const { container } = render(
        <ScanCardOutline corners={corners} frameWidth={null} frameHeight={null} variant="debug" />
      );
      expect(container.firstChild).toBeNull();
    });

    it("applies the debug stroke for the debug variant", () => {
      render(<ScanCardOutline corners={corners} frameWidth={640} frameHeight={800} variant="debug" />);
      const polygon = screen.getByTestId("scan-card-outline").querySelector("polygon");
      expect(polygon).toHaveAttribute("stroke", "#38bdf8");
    });

    it("applies the affirmative stroke for the affirmative variant", () => {
      render(<ScanCardOutline corners={corners} frameWidth={640} frameHeight={800} variant="affirmative" />);
      const polygon = screen.getByTestId("scan-card-outline").querySelector("polygon");
      expect(polygon).toHaveAttribute("stroke", "#34d399");
    });
  });
});
