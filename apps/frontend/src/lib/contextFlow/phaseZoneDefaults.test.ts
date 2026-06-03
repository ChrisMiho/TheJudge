import { describe, expect, it } from "vitest";
import {
  CANONICAL_ZONE_ORDER,
  mergeSelectedZonesOnPhaseChange,
  PHASE_ZONE_DEFAULTS
} from "./phaseZoneDefaults";

describe("PHASE_ZONE_DEFAULTS", () => {
  it("covers all TurnPhase values", () => {
    const expectedPhases = [
      "untap",
      "upkeep",
      "draw",
      "main_1",
      "main_2",
      "combat",
      "end_step",
      "cleanup",
      "stack_resolving"
    ] as const;
    for (const phase of expectedPhases) {
      expect(PHASE_ZONE_DEFAULTS[phase]).toBeDefined();
      expect(PHASE_ZONE_DEFAULTS[phase].length).toBeGreaterThan(0);
    }
  });

  it("draw includes battlefield, library, and hand at minimum", () => {
    const zones = PHASE_ZONE_DEFAULTS.draw;
    expect(zones).toContain("battlefield");
    expect(zones).toContain("library");
    expect(zones).toContain("hand");
  });

  it("combat includes battlefield and stack", () => {
    const zones = PHASE_ZONE_DEFAULTS.combat;
    expect(zones).toContain("battlefield");
    expect(zones).toContain("stack");
  });
});

describe("mergeSelectedZonesOnPhaseChange", () => {
  it("returns defaults when current selection is empty", () => {
    const result = mergeSelectedZonesOnPhaseChange([], "draw");
    expect(result).toContain("battlefield");
    expect(result).toContain("library");
    expect(result).toContain("hand");
  });

  it("retains existing user-selected zones after phase change", () => {
    // user had library selected from draw phase; change to combat does not remove it
    const result = mergeSelectedZonesOnPhaseChange(["library", "battlefield"], "combat");
    expect(result).toContain("library");
    expect(result).toContain("battlefield");
    expect(result).toContain("stack");
  });

  it("adds assumed zones for new phase on top of current selection", () => {
    // draw defaults: battlefield, library, hand
    // changing from nothing to draw should add those zones
    const result = mergeSelectedZonesOnPhaseChange([], "draw");
    for (const zone of PHASE_ZONE_DEFAULTS.draw) {
      expect(result).toContain(zone);
    }
  });

  it("does not duplicate zones", () => {
    // battlefield is in both current and main_1 defaults
    const result = mergeSelectedZonesOnPhaseChange(["battlefield", "hand"], "main_1");
    const battlefieldOccurrences = result.filter((z) => z === "battlefield").length;
    expect(battlefieldOccurrences).toBe(1);
  });

  it("returns result in canonical zone order", () => {
    const result = mergeSelectedZonesOnPhaseChange(["graveyard", "hand"], "combat");
    const inCanonical = result.filter((z) => CANONICAL_ZONE_ORDER.includes(z));
    for (let i = 1; i < inCanonical.length; i++) {
      const prev = CANONICAL_ZONE_ORDER.indexOf(inCanonical[i - 1]!);
      const curr = CANONICAL_ZONE_ORDER.indexOf(inCanonical[i]!);
      expect(prev).toBeLessThan(curr);
    }
  });

  it("phase change from draw to combat adds stack without removing library", () => {
    const afterDraw = mergeSelectedZonesOnPhaseChange([], "draw");
    const afterCombat = mergeSelectedZonesOnPhaseChange(afterDraw, "combat");
    expect(afterCombat).toContain("stack");
    expect(afterCombat).toContain("library");
  });
});
