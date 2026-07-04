import { describe, expect, it } from "vitest";
import { isValidElement } from "react";
import { PORTAL_DESTINATIONS } from "./destinationRegistry";

describe("PORTAL_DESTINATIONS", () => {
  it("registers exactly the two v1 destinations in order", () => {
    expect(PORTAL_DESTINATIONS.map((destination) => destination.id)).toEqual(["mtg-assistant", "trade-balancer"]);
    expect(PORTAL_DESTINATIONS.map((destination) => destination.label)).toEqual(["MTG Assistant", "Trade"]);
  });

  it("each destination's render() returns a node", () => {
    for (const destination of PORTAL_DESTINATIONS) {
      expect(isValidElement(destination.render())).toBe(true);
    }
  });
});
