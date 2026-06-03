import { describe, expect, it } from "vitest";
import {
  CANONICAL_ZONE_ORDER,
  getPhaseZoneDefaults,
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

describe("getPhaseZoneDefaults", () => {
  it("returns the same array as PHASE_ZONE_DEFAULTS for a given phase", () => {
    expect(getPhaseZoneDefaults("draw")).toEqual(PHASE_ZONE_DEFAULTS.draw);
    expect(getPhaseZoneDefaults("combat")).toEqual(PHASE_ZONE_DEFAULTS.combat);
  });
});

describe("mergeSelectedZonesOnPhaseChange", () => {
  it("returns defaults when current selection is empty (no prevPhase)", () => {
    const result = mergeSelectedZonesOnPhaseChange([], "draw");
    expect(result).toContain("battlefield");
    expect(result).toContain("library");
    expect(result).toContain("hand");
  });

  it("retains existing user-selected zones after phase change", () => {
    const result = mergeSelectedZonesOnPhaseChange(["library", "battlefield"], "combat");
    expect(result).toContain("library");
    expect(result).toContain("battlefield");
    expect(result).toContain("stack");
  });

  it("adds assumed zones for new phase on top of current selection", () => {
    const result = mergeSelectedZonesOnPhaseChange([], "draw");
    for (const zone of PHASE_ZONE_DEFAULTS.draw) {
      expect(result).toContain(zone);
    }
  });

  it("does not duplicate zones", () => {
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

  it("phase change from draw to combat adds stack without removing library (no prevPhase)", () => {
    const afterDraw = mergeSelectedZonesOnPhaseChange([], "draw");
    const afterCombat = mergeSelectedZonesOnPhaseChange(afterDraw, "combat");
    expect(afterCombat).toContain("stack");
    expect(afterCombat).toContain("library");
  });

  it("delta merge: hand unchecked in draw stays unchecked when switching to combat with prevPhase", () => {
    const afterDrawMinusHand: ReturnType<typeof mergeSelectedZonesOnPhaseChange> = ["stack", "battlefield", "library"];
    const result = mergeSelectedZonesOnPhaseChange(afterDrawMinusHand, "combat", "draw");
    expect(result).toContain("stack");
    expect(result).toContain("battlefield");
    expect(result).toContain("library");
    expect(result).not.toContain("hand");
  });

  it("delta merge: adds no new zones when phases share identical defaults", () => {
    const current: ReturnType<typeof mergeSelectedZonesOnPhaseChange> = ["stack", "battlefield", "hand", "graveyard"];
    const result = mergeSelectedZonesOnPhaseChange(current, "main_2", "main_1");
    expect(result).toEqual(current);
  });
});
