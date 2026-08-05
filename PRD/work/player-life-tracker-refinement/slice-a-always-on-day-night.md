# Slice A — Always-on day/night

## Status: done

## Goal

Remove the opt-in `dayNightEnabled` setting entirely (DEC-132 / REQ-111): the
header ☀/☾ flip control is always visible on every game, with no Game Setup
toggle to hide it.

## Requirements

1. `apps/frontend/src/lib/lifeTracker/types.ts` — delete `dayNightEnabled`
   from `TrackerPreferences` and from `TrackerState`. Keep `dayNightPhase`
   (`DayNightPhase`) on `TrackerState` unchanged.
2. `apps/frontend/src/lib/lifeTracker/state.ts` — delete
   `DEFAULT_DAY_NIGHT_ENABLED`, the `dayNightEnabled` entry in
   `DEFAULT_PREFERENCES`, the `dayNightEnabled` seed in `createInitialState`
   (its `preferences.dayNightEnabled ?? DEFAULT_DAY_NIGHT_ENABLED` line), and
   the `setDayNightEnabled` mutator function. `createInitialState`'s
   `dayNightPhase` line (always seeded to `DEFAULT_DAY_NIGHT_PHASE`) is
   unchanged. `resetGame`'s `dayNightPhase` reset and `setDayNightPhase`/
   `toggleDayNightPhase` are unchanged.
3. `apps/frontend/src/lib/lifeTracker/persistence.ts` — delete the
   `dayNightEnabled` import and its normalization line in `loadTrackerState`
   (`dayNightEnabled: typeof stored.dayNightEnabled === "boolean" ? ... :
   DEFAULT_DAY_NIGHT_ENABLED`). A snapshot that still has a `dayNightEnabled`
   key in storage must still load successfully (the key is simply not read
   into the smaller `TrackerState` shape) — do not add any rejection logic
   for its presence. `dayNightPhase` normalization is unchanged.
4. `apps/frontend/src/lib/lifeTracker/useLifeTracker.ts` — delete
   `setDayNightEnabled` from the `UseLifeTrackerResult` type, its import, and
   its implementation. In `newGame()`, drop `dayNightEnabled` from the
   destructured preferences carried into `startNewGame` (keep `layoutMode`,
   `cardStyle`). `toggleDayNightPhase` is unchanged.
5. `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx` —
   delete the `dayNightEnabled` prop and `onDayNightEnabledChange` prop from
   `GameSetupPanelProps` and the component's destructuring, and delete the
   entire "Day / Night" section (`<div className="pt-4">...role="switch"...
   </div>`, the last section in the panel). The section above it (Starting
   life, `py-4`) becomes the last section — give it `pb-4` in place of `py-4`
   only if needed to avoid a trailing double border from the
   `divide-y`; verify visually rather than guessing.
6. `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx` —
   update `PENDING_MESSAGES["new-game"]` to drop "...day/night tracking
   stay" (day/night is no longer an optional preference to mention there;
   phase still resets to Day via `startNewGame`/`createDefaultGame`
   regardless). Keep mentioning layout and card style, which do still carry
   over.
7. `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx`
   — remove the `dayNightEnabled={tracker.state.dayNightEnabled}` and
   `onDayNightEnabledChange={tracker.setDayNightEnabled}` props passed to
   `GameSetupPanel`. Remove the `{tracker.state.dayNightEnabled && (...)}`
   conditional around the header ☀/☾ button so it always renders
   unconditionally (keep `data-testid="day-night-toggle"` and the existing
   `aria-label`/click handler as-is).

## Acceptance criteria

- [ ] `dayNightEnabled` does not appear anywhere in
      `apps/frontend/src/lib/lifeTracker/{types,state,persistence,useLifeTracker}.ts`
      or in `GameSetupPanel.tsx`/`PlayerLifeTrackerApp.tsx`.
- [ ] The header's day/night control renders on every game with no way to
      hide it (no Game Setup row controls it).
- [ ] Tapping the header control still flips `dayNightPhase` and updates the
      `aria-label`/glyph/text; Reset still returns the phase to Day.
- [ ] A `localStorage` snapshot written by the pre-slice build (with a
      `dayNightEnabled: true` or `false` key present) still loads
      successfully via `loadTrackerState`.
- [ ] `npx vitest run` passes for `state`, `persistence`, `useLifeTracker`,
      `GameSetupPanel`, `PlayerLifeTrackerApp` with every `dayNightEnabled`
      -specific case either removed or rewritten to assert the new
      always-visible/no-toggle behavior (do not leave a case asserting the
      control is hidden by default).
- [ ] `npm --workspace apps/frontend run typecheck` clean.

## Verification

```bash
cd apps/frontend
npx vitest run state persistence useLifeTracker GameSetupPanel PlayerLifeTrackerApp
npx eslint src/lib/lifeTracker/types.ts src/lib/lifeTracker/state.ts src/lib/lifeTracker/persistence.ts src/lib/lifeTracker/useLifeTracker.ts src/components/portal/life-tracker/GameSetupPanel.tsx src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/lib/lifeTracker/types.ts`
- `apps/frontend/src/lib/lifeTracker/state.ts`
- `apps/frontend/src/lib/lifeTracker/persistence.ts`
- `apps/frontend/src/lib/lifeTracker/useLifeTracker.ts`
- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx`
- `apps/frontend/src/lib/lifeTracker/state.test.ts`
- `apps/frontend/src/lib/lifeTracker/persistence.test.ts`
- `apps/frontend/src/lib/lifeTracker/useLifeTracker.test.ts`
- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.test.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.test.tsx`
