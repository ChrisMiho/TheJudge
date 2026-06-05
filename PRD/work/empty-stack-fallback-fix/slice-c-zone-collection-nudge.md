# Slice C — Zone collection nudge

## Status: planned

## Goal

Set expectations **before enrichment** when stack is selected but empty, reducing confusion that later surfaces as “the AI said the stack was empty.”

## Depends on

- None (may ship in parallel with slice A)

## Requirements

### [`ZoneCollectionStep.tsx`](../../../apps/frontend/src/components/ZoneCollectionStep.tsx)

On **Continue** (`onContinue` handler in parent or step-local guard before calling it):

When **all** of:

- `"stack"` is in `selectedZones`
- `(zones.stack?.length ?? 0) === 0`
- `canContinue` is true (at least one card exists in some selected zone)

Call `onFlashStatus` with:

> Stack zone is selected but empty — fine for board-state questions; add stack cards if you want stack resolution.

**Non-blocking:** still call `onContinue()` immediately after flash (same pattern as other status flashes in the flow).

### [`App.tsx`](../../../apps/frontend/src/App.tsx)

`finishZoneCollection` already receives flash via `ZoneCollectionStep` props — wire nudge in the step component only if `onFlashStatus` is available there (it is per current props).

## Tests

**[`App.test.tsx`](../../../apps/frontend/src/App.test.tsx)** or zone flow test file:

1. Select stack + battlefield (or use `main_1` defaults)
2. Add card only to battlefield
3. Click Continue
4. Assert status message contains “Stack zone is selected but empty” (or substring)
5. Assert flow advances to enrichment

**Edge case:**

- Stack selected, zero cards anywhere → Continue disabled; nudge must **not** fire

## Acceptance criteria

- [ ] Nudge appears once on continue when stack selected-but-empty and another zone has cards
- [ ] Nudge does not block navigation
- [ ] No nudge when stack has cards or continue is disabled
- [ ] `npm run quality:check` passes

## Files

| Action | Path |
| --- | --- |
| Edit | `apps/frontend/src/components/ZoneCollectionStep.tsx` |
| Edit | `apps/frontend/src/App.test.tsx` or `App.zoneFlow.test.tsx` |

## Non-goals

- Changing phase zone defaults
- Requiring stack cards when stack is checked
