status: refined

# Design Brief — Life tracker opens in the seat-oriented (list) layout by default

## What the player gets

A new game on the Player Life Tracker opens so each player's `−` sits on their
own left and `+` on their own right, matching how that player is actually seated
at the table — including the player sitting across, who gets a mirrored split
that is correct from their point of view.

Today a new game opens in **grid** layout, where every card shows `−` on the
screen-left and `+` on the screen-right regardless of which table edge the player
faces. The change makes a new game open in **list** layout instead. List is an
already-shipped mode whose life-adjust split follows each seat's own rotation, so
it is seat-oriented by construction.

Grid stays available, unchanged, via the Layout toggle in Game Setup for anyone
who prefers the fixed screen left/right split.

## Design direction

One-line default flip, grid → list, plus its test updates and PRD-truth
amendment. No new layout engine, no change to grid's split, no change to the
seat map or the MTG Assistant seed.

The behavior the owner wants already exists and is tested in list mode. The only
reason a new game doesn't show it is that the default-layout constant points at
grid. Flip the constant; list's seat-oriented split is what a fresh game then
shows.

### Why list is already correct (verified in code, 2026-10-03)

- `apps/frontend/src/lib/lifeTracker/state.ts:17` — `DEFAULT_LAYOUT_MODE` is
  `"grid"` today. Every new game keys off this constant
  (`createInitialState`, `createDefaultGame` at lines 87/104, `startNewGame`,
  and the persistence fallback), so flipping it is the whole production change.
- `apps/frontend/src/lib/lifeTracker/seatArrangement.ts:236` —
  `listSeatArrangement` seats players only upright (0°) or upside-down (180°),
  never sideways (90°/270°). So list's split is always a clean left/right (or
  mirrored left/right) — never the sideways top/bottom split that grid's side
  seats would force.
- Grid's fixed screen left/right split is deliberate: four cards facing inward
  made a per-seat top/bottom split read as awkward (DEC-136, DEC-170). That call
  is **not** overturned — grid keeps its fixed split; we just stop opening in it.

### Production change (implementation note, applied at build — not product truth)

1. `apps/frontend/src/lib/lifeTracker/state.ts:17` —
   `DEFAULT_LAYOUT_MODE: LayoutMode = "grid"` → `"list"`. Nothing else in
   production needs editing.
2. Flip only the **default-derived** test assertions to expect list, leaving
   explicit-prop tests alone:
   - `state.test.ts:85` and `state.test.ts:177` — default-constructed
     `createInitialState(4, 40)` layoutMode `"grid"` → `"list"`.
   - `persistence.test.ts:86-91` — pre-layoutMode-snapshot fallback test,
     expected `"grid"` → `"list"` (rename to the list default).
   - `persistence.test.ts:94-98` — invalid-stored-layoutMode normalization test,
     expected `"grid"` → `"list"` (rename to the list default).
   - `state.test.ts:115` uses the constant directly and needs no change.
   - Run the full frontend suite and fix any remaining default-derived grid
     assertion (e.g. an App-level render test that opens a default game and
     asserts grid's fixed split or `data-side`). Explicit
     `layoutMode="grid"`/`"list"` prop tests (`GameSetupPanel.test.tsx`,
     `PlayerLifeCard.test.tsx:336`) are correct as-is.
3. Live sanity check: list fits one screen and orients `−`/`+` to each seat's own
   left/right at player counts 2–8 (`screen-layout.md` fit rule). List is shipped,
   so this is a confirmation, not new layout work.

## Product truth this needs (proposed in GATE-QUESTIONS.md)

The default-layout behavior is user-visible and currently unpinned by any
requirement. Proposed as a single new requirement, **REQ-217**, with the feature
spec and system map amended to enact it. See `GATE-QUESTIONS.md`.

## Material assumptions (each is evidence weighed at the define gate)

| # | Assumption | Evidence | Ladder basis |
| --- | --- | --- | --- |
| A1 | The chosen fix is flipping the default to list — not rewriting grid's split, not mirroring only grid's across-table seats. | Owner decision recorded in intake `GRAPH-BRIEF.md` (2026-10-03). Intake is evidence; the define gate confirms it. | Request as stated; smallest reversible scope (ladder 4). |
| A2 | List is already shipped and orients each seat's `−`/`+` correctly; this is a default flip, not new layout work. | Verified: `seatArrangement.ts:236` `listSeatArrangement` uses only 0°/180° seats; `PlayerLifeCard.tsx` `lifeHalvesForRotation` follows seat rotation. | Existing tested behavior (ladder 2). |
| A3 | Flipping one constant is the whole production change; all new-game paths key off it. | Verified: `state.ts:17` constant consumed by `createInitialState`/`createDefaultGame` (lines 87/104), `startNewGame`, and `persistence.ts:128-130` fallback. | Established code pattern (ladder 3). |
| A4 | Legacy saves with no `layoutMode`, or an invalid one, pick up the new default automatically. | Verified: `persistence.ts:128-130` resolves non-`grid`/`list` values to `DEFAULT_LAYOUT_MODE`. | Existing tested behavior (ladder 2); preserve-load behavior. |
| A5 | A saved in-progress game that carries its own `layoutMode` keeps it; the flip touches only brand-new games and preference-less/invalid saves. | Verified: `persistence.ts:128-130` keeps a stored `"grid"`/`"list"`. Feature spec: presentation preferences persist and may survive New Game. | Preserve user-visible behavior (ladder 5). |
| A6 | Grid is not removed and grid's fixed split is unchanged; DEC-136/DEC-170 stand. | Feature spec `life-tracker/README.md` Life table bullet (DEC-136, DEC-170); intake constraint. | Active decision in `PRD/sections/` (ladder 1). |
| A7 | The default is pinned as a new requirement (REQ-217) rather than feature-spec prose alone. | My choice. The default is a single testable guarantee (tests already assert it) and the feature spec's "Backed by" line anchors behavior to REQs. Intake preferred prose-only; owner can edit to prose-only at the gate. | No PRD rule compels either; proposed for the gate to confirm. |
| A8 | The one-way MTG Assistant seed and the Game Setup Layout toggle are unaffected. | Intake constraint; the seed carries life/counters, not layout mode (feature spec seed section). | Preserve user-visible behavior (ladder 5). |

## Non-goals

- Removing grid or changing grid's fixed screen left/right split (DEC-136,
  DEC-170).
- Redesigning either layout or the seat arrangement.
- Touching the one-way MTG Assistant seed or the Game Setup Layout toggle.
- Overriding a saved game that already carries its own layout preference.

## Citations (paths only — not opened per the intake-is-evidence rule)

- `PRD/work/probe-life-tracker-seat-oriented-default/` (PROBE.md + GRAPH-BRIEF.md)
- Prior receipts named in `IDEA.md`:
  `PRD/instructions/receipts/life-tracker-seat-map-2026-09-03.md`,
  `life-tracker-spec-2026-08-25.md`, `player-life-tracker-2026-08-03.md`,
  `player-life-tracker-refinement-2026-08-05.md`.

## Decision blockers

None. The direction is owner-decided (intake evidence) and the define gate
surfaces the proposed product truth for accept/edit/reject. The only sub-fork —
new REQ vs. feature-spec prose only (A7) — is resolved conservatively and
presented at the gate for the owner to edit if they prefer prose.
