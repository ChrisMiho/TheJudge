# Slice Q — Life Tracker menus take the look

## Status: planned

## Goal

Game Setup's steppers and pills become the mockup's joined stepper/segment
controls; Counters' tabs gain glyphs, commander-damage tiles get a joined
−/+ stepper and a "lethal at 21" note, and the counters grid moves from 2
columns of greyscale icons to 3 columns of full-colour ones. The table
itself stays pixel-untouched — this slice re-confirms that, since it is the
last slice to land on top of every shared-chrome change L through P made.

Behaviour does not change in this slice. Slice J already built Game Setup
and Counters on the shared confirm sheet; this slice restyles what J built
to match the mockup pixel values below, inside the frame slice L landed.
This is the last slice of the look-matching pass; it carries the Ship gates
block for L–Q and this pass's own PRD promotion checklist.

## Dependencies

Slice L (frame, shared sheet shell — Game Setup and Counters both sit on
`SheetShell`/`ConfirmSheet`) and slice J (Game Setup, Counters panels —
restyled here, both `done`).

## Mockup source

`docs/design/ui-reimagining/direction-1/life-tracker-menus.html`.

## LOOK-GAPS.md section closed

`## Life Tracker menus` (`PRD/work/ui-reimagining-build/LOOK-GAPS.md:238-285`).

## Requirements

No new `GATE-QUESTIONS.md` id beyond what slice J already applied
(REQ-202) — presentation only, except where the owner question below says
otherwise.

1. Game setup: group Reset and New game under a "THIS GAME" eyebrow. Replace
   the separate −/+ circles and bare player count with one stepper pill
   "− N PLAYERS +" (`life-tracker-menus.html:70-75` `.stepper`, 46×44px
   buttons, value 6.5rem wide with a small uppercase caption), with "Edit
   names ▾" beside it (today's name fields stay visible, per the owner
   question below). Starting-life's selected pill becomes an outline glow
   (border accent-soft, fill accent 24%, text accent-soft) instead of a
   solid fill. Layout and Card style become joined segmented controls
   (`:90-95` `.seg`, full width, glyphs) instead of separate pills.
2. Counters (commander damage): title becomes "Counters · Player N" plus a
   muted "N life". Tabs become glyph tabs, "⚔ Commander damage / ◈
   Counters" (text-only today). Tiles get the mockup's `.seat` shape
   (`:116-122`): name top-left, a large value (1.9rem/800), then a joined
   −|+ stepper (`.seat` structure already cited, not a separate above/below
   pair), with "lethal at 21" beside the eyebrow and the own seat reading
   "your seat · life total".
3. Counters tab: grid moves from 2 to 3 columns. Counter icons render full
   colour (not greyscale) and labels become title case ("Monarch", not
   "MONARCH"). The ⋯ options control moves to each tile's top-right corner.
   Non-zero tiles glow in the accent. Hint text becomes "tap to add one · ⋯
   for more". A CUSTOM COUNTERS section (name field, "＋ Add") is added
   below the grid.
4. Reset confirm: no new work — slice J already matched its copy and
   buttons to the mockup. This slice only re-verifies it still matches
   after L's shared-sheet restyle (glass, blur, grab handle now apply).

## Files touched

- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx` (+
  `.test.tsx`) — "THIS GAME" grouping, stepper pill, outline-glow starting
  life, joined segmented Layout/Card-style controls.
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx` (+
  `.test.tsx`) — glyph tabs, seat-shaped commander-damage tiles, 3-column
  full-colour counters grid, top-right ⋯, custom-counters section.
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx`,
  `PlayerLifeTrackerApp.tsx` — unchanged except where they host the above
  panels; the table itself is not touched by this slice (same statement as
  slice J's).

## Tests

- `GameSetupPanel.test.tsx`, `CounterPanel.test.tsx` — updated for the new
  markup/classes; every control, option, default and range stays today's
  (same assertion slice J already made, re-verified here).
- `PlayerLifeTrackerApp.player-counters.test.tsx` — table state and
  persistence byte-for-byte unchanged (re-run, not rewritten).

## Owner questions — the build follows the accepted requirement until answered

Carried verbatim from LOOK-GAPS.md's `## Life Tracker menus`
`### Conflicts with accepted requirements`:

- "Slice J already ruled two of these by following the requirement over the
  mockup, and this record should not re-decide them. The mockup's 'Edit
  names ▾' toggle hides the name fields, but the accepted Game Setup copy
  shows them. The mockup's 'Done ›' foot bar was not built, because the
  slice's own acceptance criterion keeps the ✕-only close. Should the look
  pass leave both as slice J built them? Slice J's reading is that both are
  leftovers from an earlier mockup round." Until answered, this slice
  leaves both as slice J built them: name fields stay always visible (no
  collapse behind "Edit names ▾"), and the sheet keeps its ✕-only close
  with no "Done ›" foot bar.

## Acceptance criteria

- [ ] Q1. `npm run quality:check` passes.
- [ ] Q2. `npm --workspace apps/frontend run test` passes.
- [ ] Q3. Game Setup shows a "THIS GAME" eyebrow over Reset/New game, a
      stepper-pill player count, an outline-glow selected starting-life
      pill, and joined segmented Layout/Card-style controls, in
      `GameSetupPanel.tsx`.
- [ ] Q4. Name fields remain always visible in Game Setup (no "Edit names
      ▾" collapse), per the owner question above, in `GameSetupPanel.tsx`.
- [ ] Q5. Counters shows glyph tabs ("⚔ Commander damage / ◈ Counters"),
      seat-shaped commander-damage tiles with "lethal at 21", and a
      3-column full-colour counters grid with top-right ⋯, in
      `CounterPanel.tsx`.
- [ ] Q6. Every control, option, default and range in Game Setup and
      Counters matches today's values (presentation only), in
      `GameSetupPanel.tsx` and `CounterPanel.tsx`.
- [ ] Q7. The life-total table itself (seats, life, layout, day/night, seat
      map, state, persistence) is byte-for-byte unchanged in behaviour and
      test coverage, in `PlayerLifeTrackerApp.player-counters.test.tsx`.
- [ ] Q8 (manual). Side-by-side pairs saved under
      `docs/design/ui-reimagining/build-screenshots/q/`, build next to
      mockup, Blue, at 390×844 and 1440×900, one pair per state: Game
      setup, Reset confirm, Counters (commander damage), Counters tab
      (`life-tracker-{setup,reset,counters,counters-tab}-{build,mockup}-{390x844,1440x900}.png`,
      16 files), plus the table re-check pair
      (`life-tracker-table-build-390x844.png`,
      `life-tracker-table-build-1440x900.png`, 2 files, compared against
      the existing `docs/design/ui-reimagining/direction-1/life-tracker-table-{390x844,1440x900}.png`)
      — 18 files total, matching LOOK-GAPS.md's Life Tracker menus pairs
      list.
- [ ] Q9 (manual). Each pair in Q8 was compared side by side against the
      build at the matching state; every `### Differences` bullet under
      LOOK-GAPS.md's `## Life Tracker menus` is closed, or is the owner
      question above (never resolved past the stated interim reading); the
      table re-check pair confirms the table rendered identically to
      slice J's own before/after pair, unaffected by L through P's shared-
      chrome changes.
- [ ] Q10 (manual). Browser scenario at 390×844 and 1440×900: open Game
      Setup, confirm the stepper pill and segmented controls work; open a
      player's Counters, switch tabs, confirm the seat tile and the
      3-column grid render; confirm the table underneath is visually
      identical to before this pass.
- [ ] Q11 (manual). Cleanup evidence recorded: browser closed, owned dev
      server(s) stopped, ports released, disposable captures under
      `PRD/work/ui-reimagining-build/.playwright-mcp/` named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified, for every slice
      L through Q.
- [ ] Tests updated; `npm run quality:check` green for touched areas.
- [ ] Public contract unchanged — this pass is look-only; no `AskAiRequest`,
      prompt, backend route, card data, or data-pipeline change (unlike
      slices K's REQ-211/REQ-210/REQ-167, this pass adds none of its own).
- [ ] No secrets committed.
- [ ] Durable outcomes promoted; `PRD/work/ui-reimagining-build/` ready to
      delete.

### PRD promotion checklist (execution happens in `thejudge-cleanup`)

- [ ] No new `GATE-QUESTIONS.md` ids were raised by this pass — nothing new
      to apply to `PRD/sections/`. `REQ-202`'s "no automated pixel gate"
      constraint stands: the L–Q screenshot pairs are owner-reviewed
      evidence, not a CI check.
- [ ] `system-map.md` lines naming the old `section.page-card` frame, the
      old Menu geometry, or any component file this pass restyled are
      updated by whichever slice changed that code (same rule as `A23`),
      not left for cleanup to invent.
- [ ] Mock mode works on every screen (final pass, after slice Q), using
      the exact launch form slice L's L13 names.
- [ ] The receipt names every slice's reviewable screenshot location
      (`docs/design/ui-reimagining/build-screenshots/<letter>/`, L through
      Q) so the owner can find them after this package folder is deleted.
- [ ] The receipt lists every carried-forward owner question (from slices
      M, N, O, P and Q above) as still open, naming the slice and the
      interim reading each slice shipped, so the owner can answer them in
      one place after this pass closes.
