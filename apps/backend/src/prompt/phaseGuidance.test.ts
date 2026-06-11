import { describe, expect, it } from "vitest";
import { getPhaseGuidance } from "./phaseGuidance.js";
import type { CombatStep, TurnPhase } from "../types/index.js";

const ALL_PHASES: TurnPhase[] = ["untap", "upkeep", "draw", "main_1", "main_2", "combat", "end_step", "cleanup"];
const ALL_COMBAT_STEPS: CombatStep[] = [
  "beginning_of_combat",
  "declare_attackers",
  "declare_blockers",
  "combat_damage",
  "end_of_combat"
];

describe("getPhaseGuidance", () => {
  it("returns a non-empty string for every TurnPhase", () => {
    for (const phase of ALL_PHASES) {
      const result = getPhaseGuidance(phase);
      expect(result.length, `phase ${phase} returned empty string`).toBeGreaterThan(0);
    }
  });

  it("main_1 and main_2 share common main-phase text", () => {
    const main1 = getPhaseGuidance("main_1");
    const main2 = getPhaseGuidance("main_2");
    expect(main2.startsWith(main1)).toBe(true);
  });

  it("main_2 is longer than main_1 by appending post-combat addendum", () => {
    const main1 = getPhaseGuidance("main_1");
    const main2 = getPhaseGuidance("main_2");
    expect(main2.length).toBeGreaterThan(main1.length);
    expect(main2).toContain("Until end of turn");
    expect(main2).toContain("cleanup");
  });

  it("combat without combatStep returns generic combat guidance", () => {
    const result = getPhaseGuidance("combat");
    expect(result).toContain("combat phase");
    expect(result).toContain("declare attackers");
  });

  it("combat with each CombatStep returns step-specific text", () => {
    for (const step of ALL_COMBAT_STEPS) {
      const result = getPhaseGuidance("combat", step);
      expect(result.length, `combat step ${step} returned empty string`).toBeGreaterThan(0);
    }
  });

  it("each combat sub-step produces a distinct guidance string", () => {
    const results = ALL_COMBAT_STEPS.map((step) => getPhaseGuidance("combat", step));
    const unique = new Set(results);
    expect(unique.size).toBe(ALL_COMBAT_STEPS.length);
  });

  it("declare_blockers guidance differs from generic combat guidance", () => {
    const generic = getPhaseGuidance("combat");
    const blockers = getPhaseGuidance("combat", "declare_blockers");
    expect(blockers).not.toBe(generic);
    expect(blockers).toContain("declare blockers");
  });

  it("combat with combatStep differs from combat without combatStep", () => {
    const generic = getPhaseGuidance("combat");
    const withStep = getPhaseGuidance("combat", "declare_attackers");
    expect(withStep).not.toBe(generic);
  });
});
