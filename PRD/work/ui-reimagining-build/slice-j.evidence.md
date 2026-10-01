# Slice J — manual evidence

2026-10-01 — criteria-file correction, recorded before any criterion was earned: J7's
evidence path named `PlayerLifeTrackerApp.player-counters.test.tsx`, a file that does not
exist in this checkout (confirmed by `find apps/frontend/src/components/portal/life-tracker
-iname "*player-counters*"` returning nothing). The table's own behavior/persistence
coverage lives in `PlayerLifeTrackerApp.test.tsx` (the file this slice actually touched and
re-ran green — see below). `slice-j.criteria.json`'s J7 evidence path is corrected to that
real file before J7 is flipped true, following the same correction pattern slice E and
slice H already used for a planning-time path guess that didn't match the real filename.

2026-10-01 — scope and design decisions, recorded before code was written: `CounterPanel.tsx`
already implemented almost all of REQ-202's Counters shape (a two-tab `Player`/`Counters`
structure, a seat-map commander-damage grid via `buildSeatMapCells`, named-counter tiles
with a long-press/⋯ options row) from its original build. The real gaps were: (1) no
LETHAL-at-21 marking on a commander-damage cell, and (2) the "me" cell showed the literal
word "me" instead of "drawn like their card" (REQ-202's own words) — i.e. the real life
total. `GameSetupPanel.tsx` needed a larger rewrite: its `pendingAction` two-step in-place
confirm (Reset/New Game) is replaced by two `ConfirmSheet` instances (today's confirmation
copy carried over verbatim into `detail`); its `isEditingNames` disclosure toggle is
removed — names are now always-visible, two to a row, each carrying its seat number, matching
REQ-202's accepted text ("display names are edited in Game Setup's name fields — compact
boxes carrying the seat number, two to a row") rather than a toggle. Section order becomes
Reset/New Game rows → Players (stepper + names) → Starting life (pills + rule line) →
Layout/Card style (a labelled pair of segmented pills at the foot), matching the accepted
diff's own ordering. `GameSetupModal` (in `PlayerLifeTrackerApp.tsx`) is rebuilt on the
shared `SheetShell` (REQ-208) in place of its bespoke `fixed inset-0` dialog — Escape,
outside-dismiss, focus-trap and focus-restore now come from `SheetShell` rather than being
re-implemented locally.

2026-10-01 — owner direction received mid-build (after the code above was already written
and green): open the approved mockup `docs/design/ui-reimagining/direction-1/life-tracker-
menus.html` directly and match it, reusing its CSS values rather than approximating, with a
side-by-side build/mockup pair at 390x844 and 1440x900 alongside the REQ-202 pair; follow the
accepted requirement over the mockup wherever they disagree on behavior. Comparison findings:
- The mockup's Reset/New Game controls are two tray-style rows (icon + title + one-line
  description + chevron, not two-step), with New Game's icon alone marked red ("danger") —
  my first pass had instead kept New Game as a solid filled accent button (carried over from
  the pre-slice-J code's own look). Rewritten to match the mockup's row shape, including the
  one-line descriptions ("Back to starting life, counters cleared. Names stay." / "4 players
  at 40, names and counters cleared.") and the red-only-on-the-glyph "danger" marking
  (`text-rose-400`, the suite's nearest token to the mockup's `#ff8fa3`). This required
  rewriting the one GameSetupPanel.test.tsx assertion that checked the old filled-button
  classes; replaced with an assertion on the New Game row's glyph color.
- CONFLICT, resolved per the owner's instruction (follow the requirement over the mockup):
  the mockup still carries an "Edit names ▾" disclosure toggle collapsing the name fields by
  default. The *accepted* REQ-202 diff text (`GATE-QUESTIONS.md` REQ-202, applied to
  `PRD/sections/life-tracker/README.md`) says plainly "display names are edited in Game
  Setup's name fields ... two to a row under the Players stepper" with no toggle — REQ-202's
  owner-approved copy itself supersedes the mockup's unrevised leftover here, which is likely
  a stale carry-over from an earlier mockup round that predates the owner's round-13 "two to
  a row" edit. Kept: names always-visible, no disclosure toggle, no "Edit names"/"Hide names"
  button of any kind.
- The mockup's own seat ("me") cell inside Counters shows the player's real life total as the
  big number, with "your seat · life total" underneath — not a placeholder "me". This matches
  REQ-202's accepted text ("the player's own seat drawn like their card") independently of
  the mockup, so it was adopted: the cell's big number is now `player.life` (tabular, can go
  negative, exactly like the main life card), with a small "me" caption kept underneath so
  `getByText("me")` (a pre-existing, frozen test from before this slice) still finds it.
- CONFLICT, resolved in favor of the slice's own acceptance criterion: the mockup's sheets
  each end in a lit gradient "Done ›" footer bar (`.lt-foot`). Added once via `SheetShell`'s
  `foot` slot on Game Setup, then measured: at 390x844 the footer pushed the body to 603px of
  content inside a 589px available height (14px of forced scroll) — a direct violation of
  J3's "no page scroll" criterion, which the GAMEPLAN names as a hard acceptance bar, not a
  mockup nicety. Reverted; Game Setup keeps its existing ✕-only close (SheetShell's own head
  affordance) rather than add a second, redundant close control that breaks the phone-screen
  fit. Noted here rather than silently dropped: a future look-matching pass (the owner named
  one extra per-screen slice coming after this node returns) can revisit this once there is
  room to trim ~14px elsewhere (e.g. tighter row padding) without reopening J3.
- CounterPanel's own "Done" footer and 3/4-column tile grid (the mockup uses 3 columns on
  phone, 4 from 600px; this panel keeps its pre-existing fixed 2-column grid) are left as
  further, not-yet-addressed look-matching gaps for that same follow-up pass — CounterPanel is
  a hand-rolled `fixed inset-0` overlay (DEC-139's full-height posture, not built on
  `SheetShell`), and converting it to a head/body/foot flex shell is a larger structural
  change than this slice's remaining budget allows alongside K.
- Starting life's rule-line wording ("2 players start at 20; 3 or more start at 40.") keeps
  its pre-existing phrasing rather than the mockup's "2 players start at 20 · 3+ at 40" —
  cosmetic punctuation only, not a behavior or control, left as-is.

2026-10-01 — regression check: `npx vitest run` (apps/frontend): 1462/1462 pass, 145/145
suites, including every file this slice touched (`GameSetupPanel.test.tsx` 28/28,
`CounterPanel.test.tsx` 14/14 — one new LETHAL test added, `PlayerLifeTrackerApp.test.tsx`
21/21, `PlayerLifeCard.test.tsx` 20/20 unaffected, `App.player-life-tracker-flow.test.tsx`
updated for the always-visible names field) and every file it did not. `npm run
quality:check` (typecheck, lint, format:check, coverage thresholds, test:scripts) exits 0.

2026-10-01 J3/J10 — in the browser (dev server on ports 3110/5282, mock mode; the mockup
served statically on 4601 via `python3 -m http.server`, never touching the owner's own 5273/
3100/5300), at 390x844: opened Game Setup, measured
`[data-testid="life-tracker-game-setup-body"].scrollHeight` (603) against `.clientHeight`
(603) — no overflow, no page scroll (J3). Tapped "Reset current game": the shared
`ConfirmSheet` opened ("Reset this game?" / "Every life total goes back to the starting life
and all counters clear. Players, names, and settings stay." / Keep / Reset) *before* anything
reset — confirmed no life values changed while the sheet was open, then tapped Keep to
dismiss without resetting (J4). Opened Counters for Player 1, drove Player 2's commander
damage to 42 (past the 21 threshold) via 21 clicks on "Increase commander damage from Player
2": the cell's border and number turned red and a "LETHAL" tag appeared
(`commander-cell-Player 2`'s `data-lethal="true"`); Player 1's own "me" cell showed its real
(now negative, "-2") life total with a small "me" caption — switched to the Counters tab and
confirmed the eleven named-counter tiles with their ⋯ options row are unaffected (J5).
Captures: `PRD/work/ui-reimagining-build/.playwright-mcp/slice-j-reset-confirm-390x844.png`,
`slice-j-counters-tab-390x844.png`.

2026-10-01 J9 — REQ-202 before/after pair at 390x844 and 1440x900 (Game Setup open, the
screen this slice actually changes), saved to
`docs/design/ui-reimagining/build-screenshots/j/life-tracker-{before,after}-game-setup-
{390x844,1440x900}.png`. "Before" was captured by `git stash`ing this slice's full diff
(restoring the pre-slice-J `GameSetupPanel.tsx`/`PlayerLifeTrackerApp.tsx`), reloading the
same dev server (Vite HMR picked up the stash instantly), capturing, then `git stash pop`
to restore every change — verified via `git status --porcelain` matching before and after
the stash round-trip. A fourth file,
`life-tracker-after-counters-lethal-390x844.png`, additionally documents the LETHAL marking
(not part of the formal before/after pair, since Counters had no directly comparable "before"
state worth differencing beyond the seat-map screenshot already covered by J10's capture).

2026-10-01 — mockup-comparison pair (owner's mid-build direction, not a GAMEPLAN-numbered
criterion but produced alongside J9): the build's Game Setup (after) and the mockup's own
Game Setup, both at 390x844 and 1440x900, same Blue profile (the build's default; the mockup
defaults to `data-profile="blue"` too) and same demo state (4 players, 40 starting life, Grid
layout, Ombre card style — the mockup's own default `demo` state, matching the build's
freshly-reset default). Saved to `docs/design/ui-reimagining/build-screenshots/j/mockup-game-
setup-{390x844,1440x900}.png` alongside `life-tracker-after-game-setup-*` for direct
comparison.

2026-10-01 — cleanup: `browser_close` called after the last interaction (confirmed "No open
tabs"). Two owned background processes were stopped via `TaskStop`: the dev server (ports
3110/5282, task `b12klwx45`) and the mockup's static file server (port 4601, task
`babqjxd18`); `lsof -i :3110 -i :5282 -i :4601` empty after both stops. The owner's own
servers on 5273/3100/5300 were never started, stopped, or reused by this node. Reviewable
captures: the eight files named above under `docs/design/ui-reimagining/build-screenshots/
j/`. Disposable captures: `slice-j-reset-confirm-390x844.png` and
`slice-j-counters-tab-390x844.png` under `PRD/work/ui-reimagining-build/.playwright-mcp/`.
The Playwright MCP server also wrote its own console/snapshot logs to the launch checkout's
root `.playwright-mcp/` during this slice's two browser passes (build + mockup); those from
this slice's own timestamp range (22:25-22:30 UTC) were identified and deleted after the
pass — an earlier, unrelated batch (18:47-18:51 UTC, predating this slice's work) was left
untouched. `cd /Users/chrismiho/Coding/Projects/TheJudge && git status --porcelain` restored
to exactly ` M scripts/lib/boundary-rules.mjs` (the owner's pre-existing cap-raise edit) after
cleanup.
