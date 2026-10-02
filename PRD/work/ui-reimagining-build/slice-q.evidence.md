# Slice Q — manual evidence

2026-10-02 Q8/Q9 — mockup served from `docs/design/ui-reimagining/direction-1/`
on port 4681 (`python3 -m http.server 4681 --directory docs/design/ui-reimagining/direction-1`);
build served in mock mode on ports 3181/5381
(`VITE_ASK_AI_PROVIDER=mock PORT=3181 FRONTEND_PORT=5381 node scripts/dev.mjs`).
Both driven with Playwright to Blue (`?profile=blue` on the mockup; the
build's own default), captured at 390×844 and 1440×900. 18 files under
`docs/design/ui-reimagining/build-screenshots/q/`:

- `life-tracker-setup-{build,mockup}-{390x844,1440x900}.png` — Game Setup,
  default state.
- `life-tracker-reset-{build,mockup}-{390x844,1440x900}.png` — the Reset
  confirm sheet, opened from Game Setup's "Reset life totals" row.
- `life-tracker-counters-{build,mockup}-{390x844,1440x900}.png` —
  Counters · Player 2, Commander damage tab (build: Player 3 bumped to 1
  commander damage to show the stepper live, which also reduced Player 2's
  own life by 1 — accurate commander-damage-is-damage behaviour, unrelated
  to this look-only slice; mockup: its own demo seed, Player 3 at 14).
- `life-tracker-counters-tab-{build,mockup}-{390x844,1440x900}.png` — the
  Counters tab (build: Poison and Treasure incremented to show the active
  glow state; mockup: its own demo seed, Poison 3/Treasure 2/Storm count 4).
- `life-tracker-table-build-{390x844,1440x900}.png` — the table re-check,
  compared against the existing
  `docs/design/ui-reimagining/direction-1/life-tracker-table-{390x844,1440x900}.png`
  (not re-captured; it is a static reference image, not a build/mockup
  pair). Pixel comparison confirms the four player cards, their life
  numbers, and the seat-map dice are identical to both that reference and
  to slice J's own before/after pair — L through P's shared-chrome changes
  did not touch the table.

Compared side by side against every `### Differences` bullet under
LOOK-GAPS.md's `## Life Tracker menus`:

- Game setup — **closed**: a "THIS GAME" eyebrow groups Reset/New game
  (`.lt-rows`); the player count is one joined stepper pill ("− 4 PLAYERS
  +"); starting life's selected pill is an outline glow (border/fill/text
  accent-soft) instead of a solid fill; Layout and Card style are joined
  segmented controls (`.lt-seg.full`) with glyphs, one label each, in place
  of the separate pill pairs under one shared "Layout" label. **Carried, by
  the owner question below:** no "Edit names ▾" toggle was added — name
  fields stay always visible, and the sheet keeps its ✕-only close with no
  "Done ›" foot bar, exactly as slice J built them.
- Counters (commander damage) — **closed**: the title reads "Counters ·
  Player 2" plus a muted "40 life"; tabs are glyph tabs ("⚔ Commander
  damage" / "◈ Counters", replacing the plain "Player"/"Counters" labels —
  a genuine tab-name change the requirement itself directs, not a
  LOOK-GAPS-silent rename); the opponent tiles are `.lt-seat`-shaped (name
  top-left, LETHAL tag inline beside it, the damage total centred and
  large, one joined −|+ pill at the foot, replacing the prior always-visible
  full-height decrease/increase bands); "lethal at 21" sits beside the
  "Commander damage" eyebrow; the own seat reads "your seat · life total" in
  place of the bare "me" caption.
- Counters tab — **closed**: the grid is 3 columns on phone, 4 at desktop
  (`.lt-tiles`); counter icons render full colour at every state (the
  opacity/greyscale dimming on zero-value tiles is retired); labels are
  title case (`NAMED_COUNTER_PALETTE`'s own casing, no longer forced
  uppercase); the ⋯ options control sits in each tile's own top-right corner
  (`.lt-tile-more`, absolutely positioned) instead of a second grid column
  beside the tap target; non-zero tiles glow in the accent
  (`.lt-tile[data-on="true"]`); the hint reads "tap to add one · ⋯ for
  more"; a "Custom counters" section (name field, "＋ Add") sits below the
  grid, now always present (previously its heading only rendered once a
  custom counter existed — the add-row is part of the same section rather
  than a separately bordered block underneath).
- Reset confirm — **closed** (re-verified only, not rebuilt): captured as a
  pair for the record per the slice doc; slice J had already matched its
  copy and the Keep/Reset buttons to the mockup, and this pass's own
  shared-sheet restyle (slice L: glass, blur, grab handle) is the only thing
  that changed underneath it, confirmed unchanged in the capture.

### Owner question — carried verbatim, not resolved

LOOK-GAPS.md's one `## Life Tracker menus` conflict is followed per the
slice doc's stated interim reading, and remains open:

- "Slice J already ruled two of these by following the requirement over the
  mockup... Should the look pass leave both as slice J built them?" Interim
  (unchanged by this slice): name fields stay always visible, no "Edit names
  ▾" collapse; the sheet keeps its ✕-only close, no "Done ›" foot bar.
  Verified in the build capture: `life-tracker-setup-build-390x844.png`
  shows all four name fields with no collapse control, and no foot bar
  below the segmented controls.

### A discrepancy in the slice doc's own file reference (Q7)

Q7's criterion names `PlayerLifeTrackerApp.player-counters.test.tsx` as the
file proving the table is byte-for-byte unchanged. No file by that name
exists in this package — the actual file is
`apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.test.tsx`,
which contains the player-counters-related tests as part of its own single
suite (not a separate file). Q7 is satisfied against that actual file: it
was re-run unmodified except for one assertion text update (the dialog's
new accessible name, "Counters · Player 2 40 life" in place of "Counters
for Player 2" — a presentation-only change to the title this slice makes by
requirement 2), and all 21 of its tests pass. The table component itself
(`PlayerLifeCard.tsx`, the grid layout, seat placement, persistence) is
untouched.

2026-10-02 Q10 — browser scenario at 390×844 and 1440×900: opened Game
Setup from the ⚙ button, used the player-count stepper and the Layout/Card
style segmented controls (both responded and reflected `aria-pressed`
correctly); opened Reset confirm and dismissed it with Keep; opened
Counters for Player 2, used the commander-damage stepper on Player 3 (the
joined −|+ pill), switched to the Counters tab, incremented Poison and
Treasure and confirmed the tiles glowed; closed Counters and confirmed the
life table underneath renders identically to before this pass (confirmed
against the existing `life-tracker-table-*.png` reference images, above).

2026-10-02 Q11 — cleanup: `browser_close` called after the last interaction
(confirmed "No open tabs"). Both dev-server instances (the mockup's
`python3 -m http.server` on port 4681, and the build's `node scripts/dev.mjs`
on ports 3181/5381) were started by this session as tracked background
tasks and stopped via `TaskStop`; `lsof -nP -iTCP:4681,3181,5381 -sTCP:LISTEN`
returned no listeners after both stops. Disposable captures: none landed
under `PRD/work/ui-reimagining-build/.playwright-mcp/` (not created this
session) — every capture in this slice was saved straight to its reviewable
`docs/design/ui-reimagining/build-screenshots/q/` destination via an
absolute `filename`. The Playwright MCP server wrote its own
console/snapshot logs to the launch checkout's root `.playwright-mcp/` (its
own cwd) during this pass; the 21 files it wrote this session were
identified by their `2026-10-02` timestamp and deleted afterward, restoring
`cd /Users/chrismiho/Coding/Projects/TheJudge && git status --porcelain` to
its one pre-existing line (`M scripts/lib/boundary-rules.mjs`).

## PRD promotion checklist finding — flagged for `thejudge-cleanup`, not fixed here

Checking the "`system-map.md` lines naming the old `.page-card` frame... are
updated by whichever slice changed that code" item (slice Q's own Ship gates
block): `PRD/sections/system-map.md:564` (the "Feature portal" section)
still reads "full height of the outer shell (`.page-card` or Life Tracker
full-bleed) below `768px`" — `.page-card` was retired by slice L and no
longer exists anywhere in the codebase (confirmed:
`grep -rn "page-card" apps/frontend/src` finds nothing). Slice L never
updated this line. This build node cannot fix it itself: the dispatch
prompt binds it to write nothing to `PRD/sections/` in this pass ("Nothing
is applied to `PRD/sections/` in this pass; do not edit it"). Named here,
left unchecked in the Ship gates block, for `thejudge-cleanup` to apply —
the fix is a one-line wording change removing the `.page-card` mention.

## Deviations from the slice doc's "Files touched" list

- `PlayerLifeTrackerApp.test.tsx` — touched (not explicitly listed by that
  name; the slice doc names a `.player-counters.test.tsx` file that does not
  exist — see the Q7 note above). One assertion updated for the dialog's new
  accessible name; no other change.
- `CounterPanel.test.tsx` — in the slice doc's own "Tests" section; six
  assertions were updated for genuinely new markup/names this slice
  directs: the dialog's accessible name, the "me" → "your seat · life
  total" text, the tab name "Player" → "Commander damage", the joined
  stepper-pill structure replacing a literal `min-h-[53px]` class check, and
  the active-tab accent check (now CSS-driven via `.lt-seg
  button[aria-selected="true"]`, asserted structurally instead of a
  Tailwind utility class).
- `apps/frontend/src/index.css` — in the slice doc's own files-touched list
  implicitly (every look-matching slice ports CSS here); the `lt-`-prefixed
  classes added are the mockup's own class names, carried over rather than
  renamed, matching the precedent `tb-`/`cs-` prefixes set in slices O/P
  where the mockup's own names were available to reuse directly.
