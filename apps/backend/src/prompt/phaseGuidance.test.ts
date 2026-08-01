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

describe("Backend - Ask AI", () => {
  describe("getPhaseGuidance", () => {
    it("returns a non-empty string for every TurnPhase", () => {
      for (const phase of ALL_PHASES) {
        const result = getPhaseGuidance(phase);
        expect(result.length, `phase ${phase} returned empty string`).toBeGreaterThan(0);
      }
    });

    it("shares common main-phase text between main_1 and main_2", () => {
      const main1 = getPhaseGuidance("main_1");
      const main2 = getPhaseGuidance("main_2");
      expect(main2.startsWith(main1)).toBe(true);
    });

    it("extends main_2 guidance with a post-combat addendum longer than main_1", () => {
      const main1 = getPhaseGuidance("main_1");
      const main2 = getPhaseGuidance("main_2");
      expect(main2.length).toBeGreaterThan(main1.length);
      expect(main2).toContain("Until end of turn");
      expect(main2).toContain("cleanup");
    });

    it("returns generic combat guidance when combatStep is omitted", () => {
      const result = getPhaseGuidance("combat");
      expect(result).toContain("combat phase");
      expect(result).toContain("declare attackers");
    });

    it("returns step-specific text for each CombatStep", () => {
      for (const step of ALL_COMBAT_STEPS) {
        const result = getPhaseGuidance("combat", step);
        expect(result.length, `combat step ${step} returned empty string`).toBeGreaterThan(0);
      }
    });

    it("produces a distinct guidance string for each combat sub-step", () => {
      const results = ALL_COMBAT_STEPS.map((step) => getPhaseGuidance("combat", step));
      const unique = new Set(results);
      expect(unique.size).toBe(ALL_COMBAT_STEPS.length);
    });

    it("distinguishes declare_blockers guidance from generic combat guidance", () => {
      const generic = getPhaseGuidance("combat");
      const blockers = getPhaseGuidance("combat", "declare_blockers");
      expect(blockers).not.toBe(generic);
      expect(blockers).toContain("declare blockers");
    });

    it("distinguishes combat guidance with a combatStep from combat without one", () => {
      const generic = getPhaseGuidance("combat");
      const withStep = getPhaseGuidance("combat", "declare_attackers");
      expect(withStep).not.toBe(generic);
    });
  });
});
