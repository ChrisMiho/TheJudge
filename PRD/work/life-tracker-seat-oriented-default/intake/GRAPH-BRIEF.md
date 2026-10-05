# Graph-run brief — Life tracker opens in seat-oriented (list) layout by default

Self-contained intake for `graph-kickoff`. The investigate-first questions are
**resolved with data below**, so refinement can go straight to a DESIGN-BRIEF.

## What the player gets

A new game on the Player Life Tracker opens so that each player's `−` and `+`
sit the way that player is actually seated — `−` on their own left, `+` on their
own right — instead of every card showing `−` on the screen-left and `+` on the
screen-right regardless of which edge of the table the player faces.

Concretely: the tracker starts in **list** layout instead of **grid** layout.
List is an already-shipped mode whose life-adjust split follows each seat's
rotation; the player sitting across the table gets a mirrored (correct-for-them)
split, and list never seats anyone sideways, so there are no awkward cases. Grid
stays available via the Layout toggle in Game Setup for anyone who prefers the
fixed screen left/right split.

## Why (measured — do not re-derive)

Read from the code, 2026-10-03:

- `apps/frontend/src/lib/lifeTracker/state.ts:17` — `DEFAULT_LAYOUT_MODE = "grid"`.
  So out of the box every new game opens in grid.
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx:168-175` —
  in **grid** mode the halves are hard-coded `{ decrease: "left", increase:
  "right" }` for every card, and the glyph is forced screen-upright
  (`glyphTransform = "none"`, line 137). That is exactly the owner's observation:
  identical on every card, ignoring seating.
- Same file, `lifeHalvesForRotation` (lines 90-101) — in **list** mode the split
  follows `placement.rotation`: 0° → `−` left/`+` right, 180° → mirrored, 90/270°
  → top/bottom. So each player gets `−` on their own left.
- `apps/frontend/src/lib/lifeTracker/seatArrangement.ts:236-290`
  (`listSeatArrangement`) — list mode uses **only** 0° and 180° seats, never
  90/270°. So list's per-seat split is always a clean left/right (or mirrored
  left/right), never the sideways top/bottom split that grid's side seats force.

Net: the behavior the owner wants already exists and is tested in list mode; the
only reason it isn't what they see is that the default constant points at grid.

## Decisions already made — do not re-litigate

- **Fix = flip the default layout to list**, not rewrite grid's split. (Owner
  chose "Make list the default" over "make grid follow each seat" and over "only
  mirror grid's across-table seats", 2026-10-03.)
- **Grid stays available**, unchanged, as the fixed screen left/right option via
  the Layout toggle. We are not removing grid or changing grid's split.
- **Legacy/invalid saves follow the new default.** A persisted game with no
  `layoutMode` (pre-layout snapshot) or an invalid one normalizes to the default,
  which is now list. This falls out automatically because
  `persistence.ts:128-130` uses `DEFAULT_LAYOUT_MODE` for the fallback. An
  in-progress saved game that *does* carry a layoutMode keeps its own choice —
  the flip only affects brand-new games and preference-less legacy saves.
- Grid's fixed split was itself a deliberate call (DEC-136/DEC-170: four cards
  facing inward made a per-seat top/bottom split read as awkward). That decision
  is **not** being overturned — grid keeps its fixed split; we just stop opening
  in grid by default.

## Design direction (converged)

One-line production change plus its test and PRD-truth updates:

1. `apps/frontend/src/lib/lifeTracker/state.ts:17` —
   `export const DEFAULT_LAYOUT_MODE: LayoutMode = "grid";` → `"list"`.
   Everything else keys off this constant (`createInitialState`,
   `createDefaultGame`, `startNewGame`, persistence fallback), so no other
   production edit is needed.
2. Update tests that assert the *default* is grid (explicit-prop tests stay as
   they are — only default-derived assertions flip):
   - `apps/frontend/src/lib/lifeTracker/state.test.ts:85` — default-constructed
     `createInitialState(4, 40)` expects `layoutMode` `"grid"` → `"list"`.
   - `apps/frontend/src/lib/lifeTracker/state.test.ts:177` — the untouched-input
     assertion in the `setLayoutMode` test (`createInitialState(4, 40)`),
     `"grid"` → `"list"`.
   - `apps/frontend/src/lib/lifeTracker/persistence.test.ts:86-91` — test
     "loads a valid pre-layoutMode snapshot with the grid default": rename to the
     list default and flip the expected `layoutMode: "grid"` → `"list"`.
   - `apps/frontend/src/lib/lifeTracker/persistence.test.ts:94-98` — test
     "normalizes an invalid stored layoutMode to grid": rename to list and flip
     the expected `layoutMode: "grid"` → `"list"`.
   - `state.test.ts:115` uses `DEFAULT_LAYOUT_MODE` directly and needs no change;
     keep it as the one assertion that tracks the constant.
   - The build should run the full frontend suite and fix any remaining
     default-derived grid assertion the list above missed (e.g. an App-level
     render test that opens a default game and asserts grid's fixed split or
     `data-side`). Explicit `layoutMode="grid"`/`"list"` prop tests
     (`GameSetupPanel.test.tsx`, `PlayerLifeCard.test.tsx:336`) are correct as-is.
3. Sanity-check list layout live at player counts 2–8: it must still fit one
   screen (screen-layout.md fit rule) and each seat's `−`/`+` must land on that
   player's own left/right. List is already shipped, so this is a confirmation,
   not new layout work.

## Current-state PRD truth to amend

Name the files; refinement/graph-kickoff own the actual edit.

- `PRD/sections/life-tracker/README.md` — the `### Life table` section. State that
  **new games open in list layout by default**, because list orients each
  player's `−`/`+` to their own seat (list uses only upright/upside-down seats,
  so `−` always lands on the seated player's left); grid remains available as the
  fixed screen left/right option. Keep the existing grid-vs-list split
  explanation and the DEC-136/DEC-170 grid rationale — only add the default.
- `PRD/sections/system-map.md` — the `## Player Life Tracker` summary (≈line 543)
  mentions "grid/list seat arrangements" neutrally; add that the default is list.
  Optional/minor.
- No new `DEC-###` (decision log retired). No REQ currently pins the default, so
  this is a spec-prose amendment, not a REQ rewrite — add/adjust a short line in
  the feature spec rather than minting layout-mechanics REQs.

## Constraints (don't rediscover)

- Do **not** change grid's split or remove grid. Grid's fixed left/right is
  intentional (DEC-136/DEC-170) and some users may prefer it.
- Persistence is frontend-only, single-device, localStorage. The default flip
  must not break loading an existing save: a save with its own `layoutMode` keeps
  it; only preference-less/invalid saves pick up the new default (already the
  behavior via `DEFAULT_LAYOUT_MODE`).
- List layout already exists and is covered by tests — this is a default flip,
  not a new layout engine. Resist scope creep into redesigning either layout.
- The one-way MTG Assistant seed and the grid/list toggle in Game Setup are
  unaffected; don't touch them.

## Evidence + reusable tooling

Full findings and the exact line references are in this probe folder:
`PRD/work/probe-life-tracker-seat-oriented-default/` (PROBE.md + this brief). The
relevant source is `apps/frontend/src/components/portal/life-tracker/` and
`apps/frontend/src/lib/lifeTracker/`.

## What the graph run should produce

A DESIGN-BRIEF that records the default-layout flip (grid → list) and its
rationale (seat-oriented `−`/`+`), the life-tracker feature-spec amendment naming
list as the default with its reason, and a small implementation: change
`DEFAULT_LAYOUT_MODE` to `"list"`, update the default-derived layout tests to
expect list (including the two persistence legacy-fallback tests), and a live
sanity check that list fits one screen and orients correctly at 2–8 players. The
grid layout and its fixed split stay untouched. Everything above is decided —
the run should not reopen the direction.

## How to hand this off

/graph-kickoff "Make the life tracker open in the seat-oriented (list) layout by default so each player's −/+ matches how they sit" PRD/work/probe-life-tracker-seat-oriented-default/GRAPH-BRIEF.md
