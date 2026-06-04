# Slice A — Turn phase required and default stack resolving

## Status: planned

## Goal

Eliminate `gameContext.turnPhase Required` API errors and ensure every submit includes a valid phase. Default UI to stack resolving; remove unknown/None.

## Requirements

- Initialize `turnPhase` state to `stack_resolving` (enum value for UI label “Stack Resolving”; there is no separate `"stack"` phase in `apps/backend/src/validation.ts` `turnPhaseSchema`).
- Remove `<option value="">None</option>` from turn phase select.
- Select uses `value={turnPhase}` (not `turnPhase ?? ""`).
- On **Confirm game context**, block if `turnPhase` is missing (defensive after default).
- `canAdvance("game-setup", …)` requires `turnPhase` in navigation state.
- `GameContext.turnPhase` required in `apps/frontend/src/types.ts` (remove `?`).
- Optional: `buildAskAiRequest` asserts or defaults `turnPhase` before send.

## Files

- `apps/frontend/src/App.tsx`
- `apps/frontend/src/types.ts`
- `apps/frontend/src/lib/contextFlow/flow.ts`
- `apps/frontend/src/lib/contextFlow/flow.test.ts`
- `apps/frontend/src/App.test.tsx`

## Tests

- Remove/replace test `"clears turn phase when None is selected"`.
- Assert default selected option is Stack Resolving.
- `canAdvance` game-setup false without `turnPhase`.
- Happy-path submit payload includes `turnPhase: "stack_resolving"`.

## Out of scope

- Changing `phaseZoneDefaults.ts` (slice 03 checkpoint in user-flow-refinements).

## Acceptance

- [ ] Cannot confirm game context without a phase (None not offered).
- [ ] Decrypt no longer fails with missing `turnPhase` on normal paths.
