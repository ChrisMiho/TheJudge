import { describe, expect, it } from "vitest";
import { turnStepSearchName } from "./gameRulesRetrieval.js";
import { combatStepSchema, turnPhaseSchema } from "./validation/askAiRequest.js";

// The rule-book name of the current turn step, as the In-Depth retrieval query spells it (REQ-178).
// The expected strings below are the ones the function returned before it was derived from the step
// tables in prompt/phaseGuidance.ts.
const NON_COMBAT_PHASE_NAMES: Record<string, string> = {
  untap: "untap step",
  upkeep: "upkeep step",
  draw: "draw step",
  main_1: "precombat main phase",
  main_2: "postcombat main phase",
  end_step: "end step",
  cleanup: "cleanup step"
};

const COMBAT_STEP_NAMES: Record<string, string> = {
  beginning_of_combat: "beginning of combat step",
  declare_attackers: "declare attackers step",
  declare_blockers: "declare blockers step",
  combat_damage: "combat damage step",
  end_of_combat: "end of combat step"
};

describe("Backend - Game Rules", () => {
  describe("turnStepSearchName", () => {
    it("names every non-combat phase the way the query always has, whatever combat step comes along", () => {
      const phases = turnPhaseSchema.options.filter((phase) => phase !== "combat");
      expect(phases.sort()).toEqual(Object.keys(NON_COMBAT_PHASE_NAMES).sort());
      for (const phase of phases) {
        expect(turnStepSearchName(phase), phase).toBe(NON_COMBAT_PHASE_NAMES[phase]);
        for (const combatStep of combatStepSchema.options) {
          expect(turnStepSearchName(phase, combatStep), `${phase} + ${combatStep}`).toBe(NON_COMBAT_PHASE_NAMES[phase]);
        }
      }
    });

    it("names every combat step, and the combat phase when no step is set", () => {
      expect([...combatStepSchema.options].sort()).toEqual(Object.keys(COMBAT_STEP_NAMES).sort());
      for (const combatStep of combatStepSchema.options) {
        expect(turnStepSearchName("combat", combatStep), combatStep).toBe(COMBAT_STEP_NAMES[combatStep]);
      }
      expect(turnStepSearchName("combat")).toBe("combat phase");
      expect(turnStepSearchName("combat", "not_a_step")).toBe("combat phase");
    });

    it("returns an empty name for a phase outside the schema", () => {
      expect(turnStepSearchName("not_a_phase")).toBe("");
      expect(turnStepSearchName("")).toBe("");
    });
  });
});
