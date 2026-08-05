import { describe, expect, it } from "vitest";
import { isValidElement } from "react";
import { PORTAL_DESTINATIONS } from "./destinationRegistry";

describe("Frontend - Portal", () => {
describe("PORTAL_DESTINATIONS", () => {
  // Order is both the menu's rendered order and the default active destination, since
  // `loadActiveDestinationId` falls back to the first id.
  it("registers the portal destinations in order, led by Quick Question", () => {
    expect(PORTAL_DESTINATIONS.map((destination) => destination.id)).toEqual([
      "quick-lookup",
      "mtg-assistant",
      "player-life-tracker",
      "trade-balancer"
    ]);
    expect(PORTAL_DESTINATIONS.map((destination) => destination.label)).toEqual([
      "Quick Question",
      "In-Depth Question",
      "Life Tracker",
      "Trade Balancer"
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
