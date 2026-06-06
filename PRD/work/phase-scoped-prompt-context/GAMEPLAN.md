# GAMEPLAN — Phase-Scoped Prompt Context

## Architecture Overview

Two independent slices: type/frontend changes first, then backend prompt changes. No runtime coupling between slices—each ships and passes tests independently.

### Slice A — Frontend + Type System

Removes `stack_resolving` from the `TurnPhase` enum across both packages, adds `CombatStep` type and the `combatStep` optional field to `GameContext`, shifts the default turn phase to `main_1`, trims `PHASE_ZONE_DEFAULTS` to 2 zones per phase, and adds an inline combat sub-step selector to the UI.

**Data flow:**
- `TurnPhase` union → remove `"stack_resolving"` from frontend `types.ts` and backend Zod `turnPhaseSchema`
- `CombatStep` union type → add to frontend `types.ts` and backend Zod as optional validated field on `gameContextSchema`
- `DEFAULT_TURN_PHASE` in `flow.ts` → change from `"stack_resolving"` to `"main_1"`
- `PHASE_ZONE_DEFAULTS` in `phaseZoneDefaults.ts` → trim to 2 zones per phase, remove `stack_resolving` key
- `App.tsx` → remove `stack_resolving` option from `TURN_PHASE_OPTIONS`, add `<select>` for `combatStep` inline below the phase selector when `turnPhase === "combat"`, wire `combatStep` state into `GameContext`

**Touch surface:**
- `apps/frontend/src/types.ts`
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/lib/contextFlow/flow.ts`
- `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.ts`
- `apps/backend/src/validation/askAiRequest.ts`
- `apps/backend/src/types/index.ts` (type alias file; only if it needs a direct export change)

### Slice B — Backend Prompt

Creates a new `phaseGuidance.ts` module that maps `TurnPhase` + optional `CombatStep` to a guidance string. Inserts a `PHASE GUIDANCE` block into `buildPromptText` between `GENERAL GAME CONTEXT` and the zone sections. Threads `combatStep` through `PromptContext`. Cleans up `mtgReference.ts`.

**Data flow:**
- `phaseGuidance.ts` → pure mapping function; `main_1` and `main_2` share a base builder; `main_2` appends post-combat addendum
- `context.ts` (`buildPromptContext`) → extract `combatStep` from `gameContext` and include on `PromptContext`
- `types/index.ts` (`PromptContext`) → add optional `combatStep?: CombatStep` to `gameContext` sub-shape
- `normalization.ts` (`buildPromptText`) → call `getPhaseGuidance` and splice section into prompt array after `GENERAL GAME CONTEXT` block
- `mtgReference.ts` → remove `stack_resolving` from phase list, remove combat sub-step instruction to put it in the question

**Prompt structure after change:**
```
SYSTEM ROLE PREAMBLE
...
MTG REFERENCE
...
GENERAL GAME CONTEXT
...
PHASE GUIDANCE        ← new, always present
...
ZONE: STACK (if populated)
ZONE: BATTLEFIELD (etc.)
...
```

## Verification Commands

```bash
# Type check both packages
cd apps/frontend && npx tsc --noEmit
cd apps/backend && npx tsc --noEmit

# Run quality check suite
npm run quality:check --workspace=apps/frontend
npm run quality:check --workspace=apps/backend

# Run unit tests
npm test --workspace=apps/frontend
npm test --workspace=apps/backend
```

## Dependency Map

| Slice | Depends on |
|-------|-----------|
| A | nothing |
| B | Slice A (needs `CombatStep` type in backend Zod; `stack_resolving` removal in `turnPhaseSchema`) |

Slices must ship sequentially: A → B.
