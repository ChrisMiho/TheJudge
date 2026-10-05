# Slice B — Downstream tests and live one-screen check

## Status: planned

## Goal

Fix every test that still asserts the old split, run the whole frontend suite, and verify in the browser that the new split is right and the table still fits one screen at 2-8 players in both layouts.

## Requirements

1. Update `PlayerLifeTrackerApp.test.tsx` (~lines 198-200 assert Player 3 `−` right-0 and Players 1/2 left-0) and `App.player-life-tracker-flow.test.tsx` to the new per-seat expectations; run `grep -rn "left-0\|right-0\|top-0\|bottom-0\|Decrease life" apps/frontend/src` and record one disposition per hit in the slice evidence log.
2. Run the full frontend suite and fix any default-derived assertion it surfaces.
3. Live check (verify-UI-live rule): start the owned dev server, open the Life Tracker, and for grid and list at 2, 3, 4, 6 and 8 players capture a screenshot and confirm each seat's `−` is on its near edge and the table fits one screen (no scroll) at a phone viewport (390x844) and a desktop viewport (1280x800). Captures go under `PRD/work/life-tracker-seat-oriented-default/.playwright-mcp/`. Judge grid's four inward-facing cards (DEC-170's old worry) and note the observation for the owner.
4. Cleanup: `browser_close`, stop the owned dev server, confirm the port is released, record the capture path.

## Acceptance criteria

- [ ] B1: Every grep hit for the old split assertions has a disposition row in `slice-b.evidence.md` and no test asserts the old fixed grid split or un-mirrored pair split
- [ ] B2: The full frontend vitest suite passes
- [ ] B3: `npm run quality:check` is green for the touched frontend areas
- [ ] B4: Live, grid layout at 2, 3, 4, 6, 8 players on 390x844 and 1280x800: each seat's `−` is on its near edge (bottom/top for 2-3p, outer left/right for 4-8p) and the table fits one screen with no scroll
- [ ] B5: Live, list layout at 2, 3, 4, 6, 8 players on 390x844 and 1280x800: head/foot unchanged, each middle-pair player's `−` is on their own outer side, and the table fits one screen with no scroll
- [ ] B6: Live: tapping `−` on a seat lowers that player's life by 1 and the life total, commander-damage preview and inline life input still take their own taps
- [ ] B7: Cleanup evidence recorded: browser closed, owned dev server stopped, port released, captures under `PRD/work/life-tracker-seat-oriented-default/.playwright-mcp/`

## Verification

```bash
npm --prefix apps/frontend test
npm run quality:check
```

Tests:

- Full `npm --prefix apps/frontend test` (vitest run) green.

## Files touched

- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.test.tsx`
- `apps/frontend/src/App.player-life-tracker-flow.test.tsx`
- `PRD/work/life-tracker-seat-oriented-default/slice-b.evidence.md (disposition rows and observations)`
