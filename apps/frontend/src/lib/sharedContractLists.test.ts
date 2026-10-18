import { describe, expect, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import { CANONICAL_ZONE_ORDER as BACKEND_ZONE_ORDER, PLAYER_LABELS } from "../../../backend/src/constants.js";
import {
  combatStepSchema,
  playerLabelSchema,
  turnPhaseSchema,
  zoneIdSchema
} from "../../../backend/src/validation/askAiRequest.js";
import type { CombatStep, PlayerLabel, TurnPhase, ZoneId } from "../types";
import { CANONICAL_ZONE_ORDER } from "./contextFlow/phaseZoneDefaults";
import { ALL_PLAYER_LABELS } from "./lifeTracker/state";

// The frontend and backend each define these lists. The backend's copies are
// what the Ask AI request is validated against, so a drift here is a request
// the backend rejects. These checks only compare the two copies.
describe("lists both sides of the Ask AI request define", () => {
  it("player labels match, in seat order", () => {
    expect(ALL_PLAYER_LABELS).toEqual(PLAYER_LABELS);
    expect([...ALL_PLAYER_LABELS]).toEqual(playerLabelSchema.options);
  });

  it("canonical zone order matches", () => {
    expect(CANONICAL_ZONE_ORDER).toEqual(BACKEND_ZONE_ORDER);
    expect(CANONICAL_ZONE_ORDER).toEqual(zoneIdSchema.options);
  });

  it("frontend types accept exactly what the backend validates", () => {
    expectTypeOf<PlayerLabel>().toEqualTypeOf<z.infer<typeof playerLabelSchema>>();
    expectTypeOf<TurnPhase>().toEqualTypeOf<z.infer<typeof turnPhaseSchema>>();
    expectTypeOf<CombatStep>().toEqualTypeOf<z.infer<typeof combatStepSchema>>();
    expectTypeOf<ZoneId>().toEqualTypeOf<z.infer<typeof zoneIdSchema>>();
  });
});
