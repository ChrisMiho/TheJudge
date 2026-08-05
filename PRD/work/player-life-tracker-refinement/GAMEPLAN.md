# GAMEPLAN — player-life-tracker-refinement

Implements the final approved addendum in `DESIGN-BRIEF.md` ("always-on
day/night + wider tap zones + Game Setup count/life defaults", 2026-08-04):
DEC-101 (amended), DEC-132, REQ-081 (amended), REQ-082 (confirm-only),
REQ-111, REQ-112. Every prior addendum in the brief is already shipped; this
package is frontend-only, no `GameContext`/seed/persistence-contract changes.

## Current state

- `apps/frontend/src/lib/lifeTracker/types.ts` — `TrackerPreferences` and
  `TrackerState` both carry `dayNightEnabled: boolean` (opt-in, default
  `false`).
- `apps/frontend/src/lib/lifeTracker/state.ts` — `DEFAULT_DAY_NIGHT_ENABLED`,
  `DEFAULT_PREFERENCES.dayNightEnabled`, `createInitialState`'s
  `dayNightEnabled` seed, and the `setDayNightEnabled` mutator. `setPlayerCount`
  only carries retained players' life forward; it has no starting-life-default
  logic. `setStartingLife` reseeds every player's life but has no concept of
  "the user chose this manually."
- `apps/frontend/src/lib/lifeTracker/persistence.ts` — `loadTrackerState`
  normalizes `dayNightEnabled` from an old/malformed snapshot back to
  `DEFAULT_DAY_NIGHT_ENABLED`.
- `apps/frontend/src/lib/lifeTracker/useLifeTracker.ts` — exposes
  `setDayNightEnabled`; `newGame()` carries `dayNightEnabled` over as a
  preference.
- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx` —
  Players section renders a `PLAYER_COUNTS` pill row (`:197-213`); Starting
  life section's `beginCustomLifeEdit` (`:104-108`) prefills the Custom input
  with `""` when starting life is currently a fixed preset; a standalone
  "Day / Night" on/off row (`:382-404`) is the last section in the panel.
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx`
  — the header's ☀/☾ control (`:139-156`) is wrapped in
  `{tracker.state.dayNightEnabled && (...)}`.
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx` —
  life +/− bands are `h-12`/`w-12` (48px), `:109-114`.
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx` — the
  local `CommanderDamageCell` component's +/− bands are `min-h-11` (44px),
  `:227-245`.

## Target mechanism

Five independent changes, split so each slice's file/line footprint doesn't
collide with another's:

1. **Day/night always-on** (slice A) — delete `dayNightEnabled` end-to-end
   (type, default, mutator, persistence normalization, `useLifeTracker`
   action + New Game carry-over, the Game Setup toggle row, the header's
   conditional wrapper). `dayNightPhase`, tap-to-flip, and
   Reset→day are untouched. Old saves that still carry a `dayNightEnabled`
   key load fine — it's simply not read into the new, smaller `TrackerState`
   shape.

2. **Life band width +40%** (slice B) — `h-12`/`w-12` (48px) →
   `h-[67px]`/`w-[67px]` (48 × 1.4 ≈ 67.2, rounded to a whole pixel) in both
   the grid/narrow-list-pair branch (top/bottom) and the wide-list-seat
   branch (left/right) of `PlayerLifeCard`'s band class strings. Pure sizing;
   interaction/handlers untouched.

3. **Commander-damage band width +20%** (slice C) — `min-h-11` (44px) →
   `min-h-[53px]` (44 × 1.2 ≈ 52.8, rounded to a whole pixel) on both bands
   of `CommanderDamageCell` in `CounterPanel.tsx`. Pure sizing; matrix layout
   and interaction untouched.

4. **Players stepper** (slice D) — replace the `PLAYER_COUNTS` pill row in
   `GameSetupPanel.tsx` with `−`/`+` buttons (range `MIN_PLAYER_COUNT`–
   `MAX_PLAYER_COUNT`, i.e. 2–8), disabled at each bound, calling the same
   `onPlayerCountChange(count)` prop with `playerCount - 1` / `playerCount +
   1`. `onPlayerCountChange`'s signature and every call site elsewhere are
   unchanged — only this section's markup changes. The "Edit names"
   disclosure directly below stays exactly as-is (do not touch
   `PlayerRosterEditor`; it is not reused here). `PlayerRosterEditor.tsx`'s
   own `−`/`+` stepper (`:70-89`) is a useful visual/interaction reference
   for styling but is a different component in a different file — do not
   import or share code with it.

5. **Starting-life Custom default + count-driven defaults** (slice E) —
   two changes that live in `state.ts`/`types.ts` plus one line in
   `GameSetupPanel.tsx`, deliberately kept out of slice D's file range:
   - `beginCustomLifeEdit`'s non-custom branch prefills `"60"` instead of
     `""`.
   - `TrackerState` gains `hasManualStartingLife: boolean` (default
     `false`). `setStartingLife` sets it to `true` whenever it runs (a
     preset click or a Custom apply are both an explicit user choice).
     `startNewGame` resets it to `false` (a fresh game has made no manual
     choice yet). `resetGame` does **not** touch it (Reset explicitly keeps
     "settings," and starting life is a setting). Old persisted saves
     without the field normalize to `false` in `persistence.ts`, matching
     the existing `cardStyle`/`dayNightPhase` normalization pattern (the
     field is deliberately **not** part of `isValidTrackerState` — same
     reasoning as those two fields).
   - `setPlayerCount` gains count-driven defaulting: define `tier(count)` as
     `"duel"` when `count === 2`, else `"multi"`, with `defaultLife("duel") =
     20` and `defaultLife("multi") = 40`. When `!state.hasManualStartingLife`
     **and** `tier(nextCount) !== tier(state.playerCount)` (a boundary
     crossing, 2→3+ or 3+→2), also set `startingLife` to that tier's default
     and reseed every player's life to it, the same way `setStartingLife`
     already does. When the tier doesn't change (e.g. 4→5, both `"multi"`)
     or `hasManualStartingLife` is already `true`, `setPlayerCount` behaves
     exactly as it does today — this avoids clobbering live life totals on
     an in-tier count bump the user didn't ask to reseed.
   This slice also carries final verification, the PRD promotion checklist,
   and the ship gates block.

## Why this shape

- Matches the coupling analysis already done during scoping: slices B and C
  are single-file CSS-class edits with zero overlap with anything else.
  Slice A's footprint (type/default/mutator/persistence/hook/New-Game-copy/
  header-conditional) is well isolated from the Players/Starting-life
  sections slices D and E touch. Slices D and E both touch
  `GameSetupPanel.tsx` but at non-overlapping line ranges (the pill-row
  block vs. `beginCustomLifeEdit` + the Starting-life section), and D
  doesn't touch `state.ts`/`types.ts` at all.
- The count-driven-default logic is pushed into `state.ts` (pure, unit
  -testable) rather than intercepted in `GameSetupPanel`'s
  `onPlayerCountChange` handler, so the stepper markup change (slice D) and
  the defaulting behavior (slice E) don't need to touch the same lines or
  even land in a particular order.
- Boundary-crossing-only reseeding (rather than reseeding on every count
  change while unmanual) avoids a footgun: a user who bumps 4→5 players
  mid-game without ever touching Starting Life should not see every
  player's live life total silently reset to 40.

## Verification checklist (package-level, mirrors DESIGN-BRIEF)

Automated (`apps/frontend`):
- `npm run typecheck` clean.
- `npx eslint <touched files>` clean per slice; `npm run quality:check`
  green on the final slice.
- `npx vitest run state persistence useLifeTracker GameSetupPanel
  PlayerLifeCard PlayerLifeTrackerApp CounterPanel` — full pass, including
  new/updated cases per slice.

Manual (dev server, `npm run dev`, 2/3/4/8-player games, per standard
UI-change verification):
1. Day/night control is visible in the header on every game, with no Game
   Setup toggle to hide it; flips on tap; Reset returns it to Day.
2. Life +/− bands are visibly wider (grid mode top/bottom, list-mode wide
   head/foot seats left/right); still land the correct increment/decrement.
3. Commander-damage +/− bands in the Counters tab are visibly wider; still
   land the correct increment/decrement and still reduce life on increase.
4. Game Setup Players row is a `−`/`+` stepper, disabled at 2 and 8; Edit
   names still works unchanged.
5. Starting life: fixed presets unchanged (20/25/30/40); tapping Custom when
   a preset is active prefills `60`; applying it sets that value.
6. New 2-player game (from the default 4-player game) with no manual
   starting-life choice applies 20 and resets everyone's life to 20; going
   back up to 3+ applies 40. Manually picking a preset or Custom first, then
   changing player count, leaves starting life alone. A same-tier bump (e.g.
   4→5) never touches life totals.

## Slices

| Slice | Goal | Depends on |
| --- | --- | --- |
| [A](./slice-a-always-on-day-night.md) | Remove `dayNightEnabled` end-to-end; header ☀/☾ control always visible | — |
| [B](./slice-b-life-band-width.md) | Widen `PlayerLifeCard` life +/− bands by 40% (48px → 67px) | — |
| [C](./slice-c-commander-damage-band-width.md) | Widen `CommanderDamageCell` +/− bands by 20% (44px → 53px) | — |
| [D](./slice-d-player-count-stepper.md) | Replace Game Setup Players pill row with a −/+ stepper | — |
| [E](./slice-e-starting-life-defaults.md) | Custom starting-life default 60 + count-driven starting-life defaults; final ship gates and PRD promotion | — |

All five slices are parallel-ready: no slice's acceptance criteria depend on
another slice landing first. Slices A and E both touch `state.ts`/
`types.ts`/`GameSetupPanel.tsx`, but at non-overlapping fields/sections
(documented above) — implement sequentially or in parallel worktrees, either
is safe.

## Implementation map

- `apps/frontend/src/lib/lifeTracker/types.ts`
- `apps/frontend/src/lib/lifeTracker/state.ts`
- `apps/frontend/src/lib/lifeTracker/persistence.ts`
- `apps/frontend/src/lib/lifeTracker/useLifeTracker.ts`
- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx`
- `apps/frontend/src/lib/lifeTracker/state.test.ts`
- `apps/frontend/src/lib/lifeTracker/persistence.test.ts`
- `apps/frontend/src/lib/lifeTracker/useLifeTracker.test.ts`
- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.test.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.test.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.test.tsx`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.test.tsx`

## PRD promotion (executed at cleanup, per doc-lifecycle.md)

- Confirm DEC-101 (amended), DEC-132, REQ-081 (amended), REQ-082, REQ-111,
  REQ-112 (`sections/decisions/player-life-tracker.md`,
  `sections/functional-requirements.md`) match shipped behavior — all
  already exist as approved product truth from refinement; no new IDs
  expected, confirmation only.
- Promote `sections/system-map.md`'s Player Life Tracker summary
  (`system-map.md:535`) from its "Approved but not yet built" bracketed
  addendum to fully shipped, folding the always-on day/night, wider bands,
  stepper, and count/life-default behavior into the main summary sentence.
- Write the cleanup receipt under `PRD/instructions/receipts/`; delete
  `PRD/work/player-life-tracker-refinement/`.
