// REQ-238: the turn-step summaries are correct, pinned to the rules they summarise, and Quick Lookup
// names the steps its question (or an attached card's concept terms) points at.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  describeTurnSteps,
  getPhaseGuidance,
  namedTurnSteps,
  STEP_SUMMARIES,
  TURN_STEP_ORDER
} from "./phaseGuidance.js";

const ruleIndex = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../data/gameRulesRuleIndex.json"), "utf8")
) as Array<{ ruleId: string }>;
const ruleIds = new Set(ruleIndex.map((entry) => entry.ruleId));

describe("REQ-238 turn-step summaries", () => {
  it("pins every step to rule ids that exist in the committed rule index", () => {
    for (const key of TURN_STEP_ORDER) {
      expect(STEP_SUMMARIES[key].ruleIds.length, key).toBeGreaterThan(0);
      for (const ruleId of STEP_SUMMARIES[key].ruleIds) expect(ruleIds.has(ruleId), `${key} ${ruleId}`).toBe(true);
    }
  });

  it("cleanup: damage removal and end-of-turn effects end before priority; priority only on a state-based action or trigger, then another cleanup step (514.2, 514.3a)", () => {
    const text = STEP_SUMMARIES.cleanup.body;
    expect(text).toContain("all damage is removed");
    expect(text).toContain('"until end of turn" and "this turn" effects end');
    expect(text).toContain("before any player gets priority");
    expect(text).toContain("state-based action would be performed or a triggered ability");
    expect(text).toContain("another cleanup step begins");
    expect(text).not.toContain("unless a triggered ability fires");
  });

  it("untap: no priority, and a trigger is held until a player would next receive priority (502.4)", () => {
    const text = STEP_SUMMARIES.untap.body;
    expect(text).toContain("No player receives priority");
    expect(text).toContain("held and put on the stack the next time a player would receive priority");
    expect(text).not.toContain("resolved before moving to the upkeep step");
  });

  it("declare blockers: no damage-assignment order, which the rules no longer have", () => {
    expect(STEP_SUMMARIES.declare_blockers.body).not.toMatch(/orders? damage assignment/i);
    expect(getPhaseGuidance("combat", "declare_blockers")).not.toMatch(/orders? damage assignment/i);
  });

  it("In-Depth adds the lead line; Quick Lookup describes the step without claiming the game is in it", () => {
    expect(getPhaseGuidance("cleanup")).toBe(`You are in the cleanup step. ${STEP_SUMMARIES.cleanup.body}`);
    expect(getPhaseGuidance("main_1")).toBe(`You are in a main phase. ${STEP_SUMMARIES.main.body}`);
    const [line] = describeTurnSteps(["cleanup"]);
    expect(line).toBe(`Cleanup step: ${STEP_SUMMARIES.cleanup.body}`);
    expect(line).not.toContain("You are in");
  });

  it("names a step from the fixed table, de-duplicated, in turn order, at most three", () => {
    expect(namedTurnSteps(["What happens in the Cleanup step?"])).toEqual(["cleanup"]);
    expect(namedTurnSteps(["Cleanup step, then upkeep, and the draw step"])).toEqual(["upkeep", "draw", "cleanup"]);
    expect(namedTurnSteps(["upkeep upkeep draw step end step cleanup declare blockers"])).toEqual([
      "upkeep",
      "draw",
      "declare_blockers"
    ]);
    expect(namedTurnSteps(["At the beginning of the end step, and until end of turn"])).toEqual(["end"]);
    expect(namedTurnSteps(["the beginning of combat step", "end of combat"])).toEqual(["beginning_of_combat", "end_of_combat"]);
    expect(namedTurnSteps(["the postcombat main phase"])).toEqual(["main"]);
  });

  it("names no step when none is named; a bare 'draw', 'end of turn' or 'combat damage' is not a step", () => {
    expect(namedTurnSteps(["Can I draw a card in response?", "until end of turn", "combat damage"])).toEqual([]);
    expect(namedTurnSteps([""])).toEqual([]);
  });

  it("an attached card's concept terms can name a step", () => {
    expect(namedTurnSteps(["Does it work?", "cleanup step until end of turn effects end"])).toEqual(["cleanup"]);
  });
});
