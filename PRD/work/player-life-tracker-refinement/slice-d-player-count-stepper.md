# Slice D — Player count stepper

## Status: planned

## Goal

Replace Game Setup's Players pill row with `−`/`+` stepper controls (DEC-101
amended / REQ-081 amended), range 2–8. The "Edit names" disclosure stays
exactly as-is; `PlayerRosterEditor` is not reused here.

## Requirements

1. `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx`
   (`:197-213`) — replace the `PLAYER_COUNTS.map(...)` pill row with a
   `−`/`+` stepper: a numeric display of `playerCount` between two buttons.
   `−` calls `onPlayerCountChange(playerCount - 1)` and is `disabled` when
   `playerCount === MIN_PLAYER_COUNT` (2); `+` calls
   `onPlayerCountChange(playerCount + 1)` and is `disabled` when
   `playerCount === MAX_PLAYER_COUNT` (8). `onPlayerCountChange`'s prop
   signature (`(count: number) => void`) is unchanged — every other call
   site (`PlayerLifeTrackerApp.tsx`, `useLifeTracker.setPlayerCount`) needs
   no changes.
2. Give the `−`/`+` buttons `aria-label="Decrease player count"` /
   `aria-label="Increase player count"` (there is no longer a per-count
   button, so the old `Set player count to N` labels no longer apply). Keep
   the `aria-label="Player count"` wrapper (or move it to whatever container
   now wraps the stepper) so the section remains landmark-discoverable.
   `PlayerRosterEditor.tsx:70-89`'s existing `−`/`+` stepper is a useful
   visual/interaction reference (button sizing, disabled-at-bound styling,
   `Remove last player`/`Add player` label phrasing) — match that established
   look rather than inventing a new one, but this is new markup in this
   file, not a shared import.
3. `PLAYER_COUNTS` (the array of 2..8) is no longer used by the stepper;
   delete it if nothing else in the file references it, or keep it only if
   still needed elsewhere (check before deleting).
4. Do not touch the "Edit names" disclosure block that follows (`:215-245`)
   — same toggle button, same per-player name inputs, unchanged.
5. Do not touch the Starting-life section or `beginCustomLifeEdit` — that's
   slice E.

## Acceptance criteria

- [ ] Game Setup's Players section renders a `−`/`+` stepper with the
      current count displayed between them, disabled at 2 and 8
      respectively.
- [ ] Clicking `+`/`−` calls `onPlayerCountChange` with the correct
      incremented/decremented value; the existing `useLifeTracker.setPlayerCount`
      → `state.ts#setPlayerCount` path is exercised unchanged.
- [ ] "Edit names" disclosure opens/closes and edits names exactly as
      before.
- [ ] `GameSetupPanel.test.tsx`'s player-count test(s) are rewritten from
      "clicks the pill labeled N" to "clicks + / − N times and asserts the
      resulting call(s)/displayed count," including the disabled-at-bounds
      cases.
- [ ] `PlayerLifeTrackerApp.test.tsx`'s `"Set player count to N"` button
      -label assertions (the loop over 3–8 and any standalone ones) are
      updated to the new stepper interaction/labels.
- [ ] `npm --workspace apps/frontend run typecheck` clean.

## Verification

```bash
cd apps/frontend
npx vitest run GameSetupPanel PlayerLifeTrackerApp
npx eslint src/components/portal/life-tracker/GameSetupPanel.tsx
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx`
- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.test.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.test.tsx`
