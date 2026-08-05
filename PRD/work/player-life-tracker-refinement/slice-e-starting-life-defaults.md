# Slice E — Starting-life Custom default + count-driven defaults

## Status: planned

## Goal

Custom starting life defaults to 60 (DEC-101 amended / REQ-081 amended), and
changing player count applies a count-driven starting-life default (2 →20,
3+ →40, matching In-Depth) unless the user has already manually chosen a
different starting life for this game. Final slice: carries package
verification, PRD promotion, and ship gates.

## Requirements

1. `apps/frontend/src/lib/lifeTracker/types.ts` — add `hasManualStartingLife:
   boolean` to `TrackerState` (not `TrackerPreferences` — this is per-game
   state, not a presentation preference carried over New Game).
2. `apps/frontend/src/lib/lifeTracker/state.ts`:
   - `createInitialState` seeds `hasManualStartingLife: false`.
   - `setStartingLife(state, startingLife)` now also sets
     `hasManualStartingLife: true` on the returned state (any call — preset
     click or Custom apply — is an explicit user choice).
   - Add a `tier(count)` helper (or equivalent inline logic):
     `count === MIN_PLAYER_COUNT ? "duel" : "multi"`, with `defaultLife`
     `"duel"` → 20, `"multi"` → 40.
   - `setPlayerCount(state, count)`: after computing `nextCount`, if
     `!state.hasManualStartingLife` **and** `tier(nextCount) !==
     tier(state.playerCount)` (the count crossed the 2 ↔ 3+ boundary in
     either direction), also set `startingLife` to that tier's default and
     reseed **every** player's life to it (retained and newly-created
     players alike), the same way `setStartingLife` does — but do **not**
     set `hasManualStartingLife` (this is an automatic default, not a
     manual choice). When the tier is unchanged (e.g. 4→5) or
     `hasManualStartingLife` is already `true`, `setPlayerCount` behaves
     exactly as it does today (new players seeded at current
     `state.startingLife`, retained players' life untouched).
   - `startNewGame` (via `createDefaultGame`/`createInitialState`) resets
     `hasManualStartingLife` to `false` — a fresh game has made no manual
     choice yet.
   - `resetGame` does **not** touch `hasManualStartingLife` — Reset
     explicitly keeps "settings," and starting life is a setting.
3. `apps/frontend/src/lib/lifeTracker/persistence.ts` — normalize
   `hasManualStartingLife` in `loadTrackerState` the same way `cardStyle`/
   `dayNightPhase` already are: `typeof stored.hasManualStartingLife ===
   "boolean" ? stored.hasManualStartingLife : false`. Do **not** add it to
   `isValidTrackerState` — same reasoning as the other post-ship fields (an
   old snapshot without it must still load, defaulting to `false`).
4. `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx`
   (`beginCustomLifeEdit`, `:104-108`) — change the non-custom branch's
   prefill from `setStartingLifeDraft(isCustomStartingLife ?
   String(startingLife) : "")` to prefill `"60"` instead of `""` when not
   already custom. `MIN_CUSTOM_STARTING_LIFE`/`MAX_CUSTOM_STARTING_LIFE`
   validation (1–999) is unchanged; 60 is within range.
5. Do not touch the Players stepper section — that's slice D.

## Acceptance criteria

- [ ] Tapping "Custom" while starting life is one of the fixed presets
      prefills the inline input with `60`; submitting without editing it
      applies starting life 60.
- [ ] Manually picking a fixed preset or applying a Custom value sets
      `hasManualStartingLife` to `true`.
- [ ] From the default new game (4 players, `hasManualStartingLife: false`),
      reducing player count to 2 sets starting life to 20 and every
      player's current life to 20; increasing back to 3+ sets starting life
      to 40 and every player's life to 40.
- [ ] After a manual starting-life choice (preset or Custom), subsequent
      player-count changes never override `startingLife` or reseed life.
- [ ] A same-tier count change (e.g. 4→5, both "3+") never touches
      `startingLife` or any player's current life, even when
      `hasManualStartingLife` is `false`.
- [ ] New Game resets `hasManualStartingLife` to `false`; in-game Reset
      leaves it unchanged.
- [ ] A `localStorage` snapshot from the pre-slice build (no
      `hasManualStartingLife` key) loads with it defaulting to `false`.
- [ ] `state.test.ts`, `useLifeTracker.test.ts`, `persistence.test.ts`, and
      `GameSetupPanel.test.tsx` cover the above (new cases for the
      count-driven default/boundary behavior and the manual-flag guard;
      updated cases anywhere the old empty-Custom-field assumption broke a
      `user.type(...)` interaction — likely needs a `user.clear()` step
      before typing over the new "60" prefill).
- [ ] Full package verification: `npm run quality:check` green.
- [ ] Public contract unchanged: no `GameContext`/seed/persistence-key
      changes (only additive `TrackerState` fields, same storage key).

## Verification

```bash
cd apps/frontend
npx vitest run state persistence useLifeTracker GameSetupPanel
npx eslint src/lib/lifeTracker/types.ts src/lib/lifeTracker/state.ts src/lib/lifeTracker/persistence.ts src/components/portal/life-tracker/GameSetupPanel.tsx
npm --workspace apps/frontend run typecheck
cd ../..
npm run quality:check
npm run dev   # manual pass, see GAMEPLAN.md verification checklist items 1-6
```

## Files touched

- `apps/frontend/src/lib/lifeTracker/types.ts`
- `apps/frontend/src/lib/lifeTracker/state.ts`
- `apps/frontend/src/lib/lifeTracker/persistence.ts`
- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx`
- `apps/frontend/src/lib/lifeTracker/state.test.ts`
- `apps/frontend/src/lib/lifeTracker/persistence.test.ts`
- `apps/frontend/src/lib/lifeTracker/useLifeTracker.test.ts`
- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.test.tsx`

## PRD promotion checklist (executed at cleanup)

- [ ] Confirm DEC-101 (amended), DEC-132, REQ-081 (amended), REQ-082,
      REQ-111, REQ-112 (`sections/decisions/player-life-tracker.md`,
      `sections/functional-requirements.md`) match shipped behavior — all
      already exist as approved product truth; confirmation only, no edits
      expected.
- [ ] Promote `sections/system-map.md`'s Player Life Tracker summary
      (`system-map.md:535`) from "Approved but not yet built" to fully
      shipped: fold always-on day/night, +40%/+20% band widths, the
      Players stepper, and the Custom-default/count-driven starting-life
      behavior into the main summary sentence; remove the bracketed
      addendum.
- [ ] Write the cleanup receipt under `PRD/instructions/receipts/`.
- [ ] Delete `PRD/work/player-life-tracker-refinement/` after the receipt is
      written; remove the slug from `PRD/work/STATUS.md`.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/player-life-tracker-refinement/`
      ready to delete
