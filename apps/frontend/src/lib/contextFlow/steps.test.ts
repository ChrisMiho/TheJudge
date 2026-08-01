import { describe, expect, it } from "vitest";
import { FLOW_STEPS, FLOW_STEP_LABELS, getNextStep, getPreviousStep } from "./steps";

describe("Frontend - MTG Assistant", () => {
describe("contextFlow steps", () => {
  it("FLOW_STEPS lists the zone-based flow in order", () => {
    expect(FLOW_STEPS).toEqual(["game-context", "zone-confirm", "zone-collection", "enrichment"]);
  });

  it("FLOW_STEP_LABELS provides human-readable labels", () => {
    expect(FLOW_STEP_LABELS["game-context"]).toBe("Game Context");
    expect(FLOW_STEP_LABELS.enrichment).toBe("Enrich & Submit");
  });

  it("getNextStep advances through the flow", () => {
    expect(getNextStep("game-context")).toBe("zone-confirm");
    expect(getNextStep("zone-confirm")).toBe("zone-collection");
    expect(getNextStep("zone-collection")).toBe("enrichment");
    expect(getNextStep("enrichment")).toBeNull();
  });

  it("getPreviousStep walks back through the flow", () => {
    expect(getPreviousStep("enrichment")).toBe("zone-collection");
    expect(getPreviousStep("zone-collection")).toBe("zone-confirm");
    expect(getPreviousStep("zone-confirm")).toBe("game-context");
    expect(getPreviousStep("game-context")).toBeNull();
  });
});
});
