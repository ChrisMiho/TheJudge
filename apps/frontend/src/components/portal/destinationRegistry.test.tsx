import { describe, expect, it } from "vitest";
import { isValidElement } from "react";
import { PORTAL_DESTINATIONS } from "./destinationRegistry";

describe("Frontend - Portal", () => {
describe("PORTAL_DESTINATIONS", () => {
  it("registers the portal destinations in order", () => {
    expect(PORTAL_DESTINATIONS.map((destination) => destination.id)).toEqual([
      "mtg-assistant",
      "quick-lookup"
    ]);
    expect(PORTAL_DESTINATIONS.map((destination) => destination.label)).toEqual([
      "In-Depth Question",
      "Quick Question"
    ]);
  });

  it("each destination's render() returns a node", () => {
    for (const destination of PORTAL_DESTINATIONS) {
      expect(isValidElement(destination.render())).toBe(true);
    }
  });
});
});
