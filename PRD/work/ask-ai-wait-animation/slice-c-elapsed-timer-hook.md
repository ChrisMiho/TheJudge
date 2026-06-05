# Slice C — Elapsed wait timer hook

## Status: done

## Dependencies

- Slice A (`lib/askAiWaitStages.ts` must exist)

## Goal

Create a React hook that tracks elapsed seconds from the moment `isSubmitting` becomes true, and derives the current wait stage.

## Requirements

1. `useElapsedWaitTimer(isSubmitting: boolean): { elapsed: number; stage: WaitStage }`.
2. When `isSubmitting` transitions `false → true`: reset elapsed to 0 and start a 1-second `setInterval`.
3. When `isSubmitting` becomes false: clear the interval and reset elapsed to 0.
4. Each tick increments elapsed by 1.
5. `stage` is derived from `selectStage(elapsed, WAIT_STAGES)` on every render.
6. Interval is cleared on unmount regardless of `isSubmitting` state.
7. Lives at `apps/frontend/src/hooks/useElapsedWaitTimer.ts`.

## Files touched

- `apps/frontend/src/hooks/useElapsedWaitTimer.ts` (create)
- `apps/frontend/src/hooks/useElapsedWaitTimer.test.ts` (create)

## Tests

Use `vitest` with `@testing-library/react` (`renderHook`) and fake timers (`vi.useFakeTimers()`).

- Hook returns `elapsed: 0` and stage at threshold 0 when `isSubmitting` starts false
- After `isSubmitting` becomes true and 3s advance: `elapsed === 3`, stage threshold === 3
- After `isSubmitting` becomes false: `elapsed` resets to 0
- Interval is cleared when hook unmounts while submitting (no `act()` warning)
- Timer does not tick when `isSubmitting` is false throughout

## Acceptance criteria

- [ ] `elapsed` resets to 0 each time `isSubmitting` goes false
- [ ] `elapsed` increments every second while `isSubmitting` is true
- [ ] `stage` tracks `WAIT_STAGES` correctly at 0s, 3s, 8s, 15s, 25s, 40s
- [ ] No interval leak on unmount
- [ ] All unit tests pass: `npm --workspace apps/frontend run test -- useElapsedWaitTimer`

## Verification

```bash
npm --workspace apps/frontend run test -- useElapsedWaitTimer
npm --workspace apps/frontend run typecheck
```
