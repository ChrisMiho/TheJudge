# Slice A — Frontend + Type System

## Status: planned

## Goal

Remove `stack_resolving` from `TurnPhase`, add `CombatStep` type and optional `combatStep` field to `GameContext`, set `DEFAULT_TURN_PHASE = "main_1"`, trim `PHASE_ZONE_DEFAULTS` to 2 zones per phase, and add the inline combat sub-step selector to the setup screen.

## Requirements

1. `stack_resolving` is removed from `TurnPhase` in both frontend `types.ts` and backend `turnPhaseSchema` (Zod). No other phase is removed.
2. `CombatStep` union type is added to frontend `types.ts` and as an optional Zod-validated field `combatStep` on `gameContextSchema` in `askAiRequest.ts`. Valid values: `"declare_attackers"`, `"declare_blockers"`, `"combat_damage"`, `"first_strike_damage"`, `"end_of_combat"`. Default when combat is selected but field is absent: `"declare_blockers"`.
3. `combatStep` is added as `combatStep?: CombatStep` to the `GameContext` type in `apps/frontend/src/types.ts`.
4. `DEFAULT_TURN_PHASE` in `apps/frontend/src/lib/contextFlow/flow.ts` is `"main_1"`.
5. `PHASE_ZONE_DEFAULTS` in `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.ts` is trimmed to exactly 2 zones per phase and `stack_resolving` key is removed. Target mapping:
   - `untap`: `["battlefield", "command"]`
   - `upkeep`: `["battlefield", "stack"]`
   - `draw`: `["hand", "library"]`
   - `main_1`: `["battlefield", "hand"]`
   - `main_2`: `["battlefield", "hand"]`
   - `combat`: `["battlefield", "stack"]`
   - `end_step`: `["battlefield", "hand"]`
   - `cleanup`: `["battlefield", "graveyard"]`
6. `TURN_PHASE_OPTIONS` in `App.tsx` drops the `stack_resolving` entry.
7. `App.tsx` adds an inline `<select>` for `combatStep` below the phase selector that appears only when `turnPhase === "combat"`. Default selection is `"declare_blockers"`. Options: Declare Attackers, Declare Blockers, First Strike Damage, Combat Damage, End of Combat.
8. `combatStep` state is wired into the `GameContext` object built in `App.tsx`; it is included only when `turnPhase === "combat"`, omitted otherwise.
9. The backend `gameContextSchema` accepts `combatStep` as optional; it is not required. No existing request shape breaks.

## Files touched

- `apps/frontend/src/types.ts` — remove `"stack_resolving"` from `TurnPhase`; add `CombatStep` type; add `combatStep?: CombatStep` to `GameContext`
- `apps/frontend/src/App.tsx` — remove `stack_resolving` from `TURN_PHASE_OPTIONS`; add `combatStep` state (`useState<CombatStep>("declare_blockers")`); replace the "Specify combat sub-step in your question" hint paragraph with the inline `<select>` for `combatStep`; include `combatStep` in assembled `GameContext` when phase is combat
- `apps/frontend/src/lib/contextFlow/flow.ts` — change `DEFAULT_TURN_PHASE` from `"stack_resolving"` to `"main_1"`; remove any `stack_resolving` fallback references
- `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.ts` — update `PHASE_ZONE_DEFAULTS` to the 2-zone mapping above; remove `stack_resolving` entry
- `apps/backend/src/validation/askAiRequest.ts` — remove `"stack_resolving"` from `turnPhaseSchema`; add `combatStep: combatStepSchema.optional()` to `gameContextSchema`; define `combatStepSchema` as `z.enum([...])` near `turnPhaseSchema`

## Tests

- `App.zoneFlow.test.tsx` — verify zone defaults now produce 2-zone sets per phase; confirm `stack_resolving` phase no longer appears
- `apps/frontend/src/App.test.tsx` — confirm combat sub-step selector renders when phase is `"combat"` and is absent otherwise
- Existing `normalization.test.ts` (backend) — no changes needed; schema is additive

## Acceptance criteria

- [ ] TypeScript compiles with no errors in both `apps/frontend` and `apps/backend` (`npx tsc --noEmit`)
- [ ] `stack_resolving` does not appear anywhere in `TurnPhase` union, `TURN_PHASE_OPTIONS`, `PHASE_ZONE_DEFAULTS`, or backend `turnPhaseSchema`
- [ ] `DEFAULT_TURN_PHASE` is `"main_1"` in `flow.ts`
- [ ] Each phase in `PHASE_ZONE_DEFAULTS` has exactly 2 zone entries
- [ ] When turn phase is `"combat"` in the UI, a `combatStep` `<select>` is visible; when phase is anything else, it is absent
- [ ] `combatStep` defaults to `"declare_blockers"` in the UI selector
- [ ] `combatStep` is included in the assembled `GameContext` object only when `turnPhase === "combat"`
- [ ] `npm test` passes in `apps/frontend`
- [ ] `npm run quality:check` passes in `apps/frontend` and `apps/backend`

## Verification

```bash
cd apps/frontend && npx tsc --noEmit
cd apps/backend && npx tsc --noEmit
npm test --workspace=apps/frontend
npm run quality:check --workspace=apps/frontend
npm run quality:check --workspace=apps/backend
```
