# Gate questions — life-tracker-seat-oriented-default

Decide: one proposed product-truth change, below. Accept it, edit it, or reject
it. One new stable ID is reserved here (**REQ-217**); it is not written into the
live section files — build applies the approved diff.

---

## REQ-217 — a new game opens in the seat-oriented (list) layout by default

**What this decides:** whether a brand-new Player Life Tracker game opens in the
**list** layout (each player's `−`/`+` oriented to their own seat) or keeps
opening in the **grid** layout (every card's `−` on the screen-left, `+` on the
screen-right, the same for everyone).

**In plain terms:** the life tracker has two layouts a player can switch between
in Game Setup. In **list** layout each player's minus-one button sits on their
own left and plus-one on their own right — correct for where they sit, including
the player across the table, who gets a mirrored split. In **grid** layout every
card puts `−` on the screen-left and `+` on the screen-right no matter which
table edge the player faces, so three of four players reach across their card to
subtract. List is already built and tested; it never seats anyone sideways. This
change makes a new game open in list by default. Grid stays available, unchanged,
through the Layout toggle in Game Setup, so anyone who prefers the fixed screen
left/right split keeps it. A saved game already in progress keeps whatever layout
it was using; only brand-new games and old saves with no saved layout preference
pick up the new default. Grid's fixed split was a deliberate call — four cards
facing inward made a per-seat top/bottom split read as awkward (DEC-136, DEC-170)
— and that is not being overturned; we only stop opening in grid by default.

**What happens if you say no:** new games keep opening in grid, where every
card's `−`/`+` ignore seating and most players reach across their own card to
subtract life.

### Proposed diff

Three files enact this one decision: the new requirement, the feature spec that
points at it, and the system map's one-line summary.

#### 1. `PRD/sections/functional-requirements.md` — new REQ-217 (append after REQ-216)

```diff
@@ end of file, after REQ-216 @@
+
+### REQ-217
+- Title: A new game opens in the seat-oriented (list) layout by default
+- Priority: medium
+- Description: A brand-new Player Life Tracker game opens in list layout, not grid. List orients each seat's life-adjust split to that seat's own rotation — `−` on the seated player's left, `+` on their right, mirrored for the across-table seat — because list seats players only upright or upside-down, never sideways (`listSeatArrangement`). Grid remains available unchanged through the Game Setup Layout toggle, keeping its fixed screen left/right split (`−` left, `+` right for every card), which is a deliberate call for four inward-facing cards (DEC-136, DEC-170) and is not overturned here. The default is the single value `DEFAULT_LAYOUT_MODE`, which every new-game path and the persistence fallback already read; flipping it from `"grid"` to `"list"` is the whole behavior change. A persisted in-progress game that carries its own `layoutMode` keeps it; only brand-new games and saves with a missing or invalid stored layout pick up the new default (DEC-103 persistence fallback).
+- Acceptance Criteria:
+  - a default-constructed new game (no explicit layout prop, no stored preference) opens in list layout
+  - in that new game each seat's `−`/`+` lands on the seated player's own left/right, with the across-table seat mirrored, at every supported player count 2–8
+  - the Game Setup Layout toggle still switches to grid, and grid's fixed screen left/right split is unchanged
+  - loading a saved game that stored `layoutMode: "grid"` keeps grid; loading a save with a missing or invalid stored layout opens in list (the new default)
+  - the life table still fits one screen at every player count 2–8 in the now-default list layout (DEC-136; `screen-layout.md`)
+- Constraints:
+  - pure frontend/presentation: no backend, no `GameContext` seed contract (DEC-102), no persistence shape change (DEC-103)
+  - do not change grid's fixed split or remove grid; seat rotation stays the sole life-zone orientation input (DEC-136, DEC-170)
+  - do not touch the one-way MTG Assistant seed or the Game Setup Layout toggle
+- Dependencies:
+  - REQ-081
+  - REQ-173
+  - DEC-136
+  - DEC-170
+  - DEC-103
+- Notes:
+  - the production change is one constant: `apps/frontend/src/lib/lifeTracker/state.ts` `DEFAULT_LAYOUT_MODE` `"grid"` → `"list"`; all new-game paths and the persistence fallback read it
+  - reserved and proposed by the `life-tracker-seat-oriented-default` package (2026-10-03); list was already shipped and tested, so this pins the default rather than adding a layout engine
```

#### 2. `PRD/sections/life-tracker/README.md` — point the feature spec at the new default

```diff
@@ Backed by @@
 - Backed by: DEC-101, DEC-102, DEC-103, DEC-132, DEC-136, DEC-139, DEC-170,
   REQ-081, REQ-082, REQ-083, REQ-084, REQ-085, REQ-111, REQ-112, REQ-173,
-  FLOW-013, NFR-001, NFR-006
+  REQ-217, FLOW-013, NFR-001, NFR-006
```

```diff
@@ ### Life table @@
 - Built: the main screen renders one card per player (2–8), each showing a
   large life total rotated to face that player's own seat, in a default seat
   arrangement per player count with a grid mode and a list mode.
+- Built: a new game opens in **list** layout by default, because list orients
+  each player's `−`/`+` to their own seat — list seats players only upright or
+  upside-down, so `−` always lands on the seated player's left and `+` on their
+  right (the across-table seat mirrored). Grid remains available through the
+  Game Setup Layout toggle as the fixed screen left/right option. A saved game
+  that carries its own layout keeps it; only brand-new games and saves with a
+  missing or invalid stored layout pick up the default. (REQ-217, DEC-103)
```

#### 3. `PRD/sections/system-map.md` — note the default in the Player Life Tracker summary (≈line 543)

```diff
@@ ## Player Life Tracker — Summary @@
-rotated per-seat life cards with grid/list seat arrangements (list uses the row-based "turned ends" pattern),
+rotated per-seat life cards with grid/list seat arrangements (list uses the row-based "turned ends" pattern; a new game opens in list by default so each seat's `−`/`+` faces the seated player, REQ-217),
```

- Verdict:
- Reason: Recommend **accept**. The direction is the owner's own call of
  2026-10-03 and list is already shipped and tested, so this only pins and
  flips the default. The intake leaned toward feature-spec prose alone instead
  of a new requirement; if you would rather not add REQ-217, **edit** this to
  keep only the file-2 and file-3 prose amendments (drop file 1) and I will
  anchor the default in the feature spec text only.
