import { describe, expect, it } from "vitest";
import { isValidElement } from "react";
import { PORTAL_DESTINATIONS } from "./destinationRegistry";

describe("Frontend - Portal", () => {
describe("PORTAL_DESTINATIONS", () => {
  it("registers the portal destinations in order", () => {
    expect(PORTAL_DESTINATIONS.map((destination) => destination.id)).toEqual([
      "mtg-assistant",
      "quick-lookup",
      "player-life-tracker"
    ]);
    expect(PORTAL_DESTINATIONS.map((destination) => destination.label)).toEqual([
      "In-Depth Question",
      "Quick Question",
      "Life Tracker"
    ]);
  });

  it("each destination's render(isActive) returns a node for both activity values", () => {
    for (const destination of PORTAL_DESTINATIONS) {
      expect(isValidElement(destination.render(true))).toBe(true);
      expect(isValidElement(destination.render(false))).toBe(true);
    }
  });
});
});
