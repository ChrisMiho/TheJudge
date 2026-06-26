# Slice B — Positive in-zone "hold steady" cue

## Status: done

## Goal

Add the affirmative half of the searching-state feedback (DEC-074 / REQ-054): once a frame's quality clears the accept threshold but the card has not yet locked, tell the user they have found the lockable zone ("Good — hold steady"). The negative cause-aware hints (`conditionHint`) already ship; this is the positive counterpart. Non-blocking, no new control, reuses the existing convergence view-model and indicator.

## Requirements

1. Add an additive, pure field to `ScanConvergence` in `useScanCapture.ts` (e.g. `inZone: boolean`) signalling "frame acceptable, not yet locked."
2. Set it `true` in the `identify` path on the **non-abstain** branch (`selection.abstain === false`, i.e. `selection.quality.acceptable`) while the stabilizer phase is still `searching`/`locking` (not locked). Set it `false` on the abstain branch and in `INITIAL_CONVERGENCE`.
3. In `ScanCameraSurface.tsx`, render an affirmative cue from this field while `isSearching` (mirroring the existing `conditionHint` placement in the indicator), distinct in tone from the amber negative hints. Never render it during locking, camera-error, or when a negative `searchingNudge` is already showing (positive vs. negative are mutually exclusive — negative wins if both are somehow set).
4. Mutually exclusive with `conditionHint`/`detectorNudge`: an acceptable frame has no condition reason, so the two cannot legitimately co-occur; the component still guards the precedence.
5. Additive only — no change to gating, the stabilizer, frame selection, or the lock gate.

## Acceptance criteria

- [ ] `ScanConvergence` exposes the new boolean; `INITIAL_CONVERGENCE` sets it `false`.
- [ ] On an acceptable, not-yet-locked frame the hook sets the field `true`; on an abstaining frame it sets it `false` (covered in the `useScanCapture` test suite or `ScanCameraSurface.test.tsx` via the convergence prop).
- [ ] The surface renders the positive cue while searching and does **not** render it during locking or camera-error.
- [ ] When a negative `conditionHint`/`detectorNudge` is present, the negative copy is shown and the positive cue is suppressed.
- [ ] No edit to `stabilizer.ts`, `frameSelection.ts`, `frameQuality.ts`, `tuning.ts`, or any frozen-boundary file.

## Verification

```bash
npm --workspace apps/frontend run test -- ScanCameraSurface
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/hooks/useScanCapture.ts` — additive `ScanConvergence` field + set in both `identify` branches and `INITIAL_CONVERGENCE`
- `apps/frontend/src/components/ScanCameraSurface.tsx` — render positive cue in the searching indicator (`CONDITION_HINT_COPY` neighborhood)
- `apps/frontend/src/components/ScanCameraSurface.test.tsx` — cover positive-cue render + precedence
