# Gate questions — life-tracker-seat-oriented-default

Decide: one proposed product-truth change, below. Accept it, edit it, or reject
it. One stable ID is reserved here (**REQ-217**, redefined on 2026-10-04 from the
earlier "open in list by default" proposal); it is not written into the live
section files — build applies the approved diff.

> **Owner verdict recorded 2026-10-04:** accept. The owner approved this
> orientation rule and the grid reversal across the 2026-10-04 conversation
> (grid stays the default; `−` must sit nearest each player in both layouts).
> Merging docs PR #247 is the final ratification and the build signal.

---

## REQ-217 — the life-adjust `−` button sits on the edge nearest each player

**What this decides:** where the `−` (lose life) and `+` (gain life) halves of
each life card sit, in both the grid and list layouts, for every seat at every
player count 2–8.

**In plain terms:** each life card is split into a `−` half and a `+` half. Today
the `−` half sits on the screen-left for every card in **grid** layout, and in
**list** layout it follows the seat's rotation (`−` on the seated player's own
left). The result is that most players reach *across* their card — or across the
table — to subtract life. This change puts `−` on the edge **nearest each
player** (the table edge they sit at) and `+` on the far edge, so every player
taps *toward themselves* to drop life. In **list**, the head and foot seats
already read correctly and are untouched; only the two players in a middle row
are mirrored so each one's `−` lands on their own outer side. In **grid**, the
fixed screen-left split is replaced by a per-seat near-edge split: bottom/top for
the upright and upside-down seats (2–3 players), outer left/right for the
side-column seats (4–8 players). The default layout stays **grid** and no layout
is removed. This reverses DEC-170's earlier call that made grid a fixed
screen-left/right split because a per-seat split read as awkward for four
inward-facing cards — reversed by owner decision on 2026-10-04 so "tap toward
yourself to lose life" holds everywhere; DEC-170 is amended in place to match.

**What happens if you say no:** list's middle-row right-side players and nearly
every grid player keep reaching across their own card (or the table) to subtract
life, because `−` stays on a fixed or far side rather than the one nearest them.

### Proposed diff

Four files enact this one decision: the redefined requirement, the amended
decision it reverses, the feature spec, and the system map.

#### 1. `PRD/sections/functional-requirements.md` — redefined REQ-217 (append after REQ-216)

```diff
@@ end of file, after REQ-216 @@
+
+### REQ-217
+- Title: The life-adjust `−` button sits on the edge nearest each player
+- Priority: medium
+- Description: In the Player Life Tracker, each life card's two-zone life-adjust split places `−` (lose life) on the edge of the card nearest the seated player — the table edge they sit at — and `+` (gain life) on the far edge, so every player taps toward themselves to drop life and no card forces a reach across itself or the table. This holds in both grid and list layouts, for every seat, at every player count 2–8, and is keyed to each seat's table edge rather than to a fixed screen side. In list layout the head and foot seats keep `−` on the seated player's own left (already correct) and only the two players in a middle pair row are mirrored so each one's `−` sits on their own outer side. In grid layout the former fixed on-screen left/right split (`−` always screen-left) is replaced by this per-seat near-edge split: bottom/top for the 2–3-player upright and upside-down seats, outer left/right for the 4–8-player side-column seats. This reverses DEC-170 (fixed grid split) by owner decision 2026-10-04; DEC-136's per-seat principle stands and is now expressed as the near-edge rule for both layouts. The default layout is unchanged (grid, `DEFAULT_LAYOUT_MODE`), no layout is removed, and this is a deliberate standalone change to the life table, separate from the UI redesign that holds the table otherwise unchanged (REQ-202).
+- Acceptance Criteria:
+  - in grid layout at 2–3 players, each seat's `−` sits on the edge nearest that seat (bottom seat → bottom edge, top/upside-down seat → top edge) and `+` on the far edge
+  - in grid layout at 4–8 players, each side-column seat's `−` sits on its outer edge (left-column → left, right-column → right) and `+` on the inner edge; no card keeps the old fixed screen-left `−`
+  - in list layout the head and foot seats are unchanged, and in every middle pair row the left-of-pair player's `−` is on the left and the right-of-pair player's `−` is on the right, each on their own near side
+  - across both layouts at every player count 2–8, no seat places `−` on the edge farthest from its player
+  - the three interactive inner controls (life total, commander-damage preview, inline life input) still take their own taps, and the life table still fits one screen at every player count 2–8 (DEC-136; `screen-layout.md`)
+  - the default layout, the seat arrangements, the Game Setup Layout toggle, the one-way MTG Assistant seed, and layout persistence are all unchanged
+- Constraints:
+  - pure frontend/presentation: no backend, no `GameContext` seed contract (DEC-102), no persistence shape change (DEC-103), no change to the seat arrangements themselves
+  - do not change which layout is the default (grid stays) or remove any layout
+  - a deliberate change to the life table outside the UI redesign that otherwise holds it unchanged (REQ-202); the `−`/`+` position is the only table change here
+- Dependencies:
+  - REQ-081
+  - REQ-173
+  - REQ-202
+  - DEC-136
+  - DEC-170
+- Notes:
+  - the production change is in `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx` (the `halves` split) keyed to each seat's table edge from `apps/frontend/src/lib/lifeTracker/seatArrangement.ts`; left/right pair seats share rotation 0° so the split cannot be derived from rotation alone
+  - reserved and proposed by the `life-tracker-seat-oriented-default` package; redefined 2026-10-04 from the earlier "open in list by default" proposal, which the owner dropped (default stays grid)
```

#### 2. `PRD/sections/decisions.md` — amend DEC-170 in place (grid reverts to a per-seat near-edge split)

```diff
@@ DEC-170 row @@
-| DEC-170 | retired | In the life tracker's grid mode, life adjustment splits on a fixed on-screen left/right — `−` on the left half, `+` on the right — for every card, with the `±` reflowed to the card's outer edges and read screen-upright, replacing the per-seat top/bottom split that four inward-facing cards made awkward. List mode keeps DEC-136's per-seat rotation split (`−` on the seated player's own left). Amends DEC-136's "orientation from the seat's rotation alone" for grid mode only; list mode and every other DEC-136 behavior are unchanged. |
+| DEC-170 | retired | Superseded by REQ-217 (2026-10-04). Originally: grid mode split life adjustment on a fixed on-screen left/right (`−` left for every card), replacing a per-seat split that four inward-facing cards made awkward. REQ-217 reverses this: grid returns to a per-seat split with `−` on the edge nearest each player (`+` far), so "tap toward yourself to lose life" holds in both layouts. DEC-136's per-seat principle stands, now expressed as the near-edge rule; list mode's head/foot seats are unchanged and only its middle pair rows are mirrored to each player's near side. |
```

#### 3. `PRD/sections/life-tracker/README.md` — amend the Life table split bullet and `Backed by`

```diff
@@ Backed by @@
 - Backed by: DEC-101, DEC-102, DEC-103, DEC-132, DEC-136, DEC-139, DEC-170,
   REQ-081, REQ-082, REQ-083, REQ-084, REQ-085, REQ-111, REQ-112, REQ-173,
-  FLOW-013, NFR-001, NFR-006
+  REQ-217, FLOW-013, NFR-001, NFR-006
```

```diff
@@ ### Life table — split bullet @@
-- Built: life adjustment splits each card into two half-card zones covering the
-  whole card except its three interactive controls (life total, commander-damage
-  preview, inline life input). In **list mode** the split follows the seat's own
-  rotation — `−` always on the player's left, `+` always on their right from that
-  player's point of view. In **grid mode** it is a fixed on-screen left/right —
-  `−` on the left half, `+` on the right — the same for every card, because four
-  cards facing in from all sides made a per-seat top/bottom split awkward; the
-  `−`/`+` glyphs reflow to the card's outer edges and read screen-upright.
-  (DEC-136, DEC-170)
+- Built: life adjustment splits each card into two half-card zones covering the
+  whole card except its three interactive controls (life total, commander-damage
+  preview, inline life input). `−` sits on the edge nearest each player (the
+  table edge they sit at) and `+` on the far edge, so every player taps toward
+  themselves to lose life and no one reaches across their card. In **list mode**
+  the head and foot seats keep `−` on the seated player's own left, and the two
+  players in a middle row are mirrored so each one's `−` is on their own outer
+  side. In **grid mode** the split is per-seat too — `−` on the near edge
+  (bottom/top for the 2–3-player upright/upside-down seats, outer left/right for
+  the 4–8-player side-column seats), replacing the earlier fixed on-screen
+  left/right split (reversed by owner decision 2026-10-04). The default layout is
+  unchanged (grid). (REQ-217, DEC-136, DEC-170)
```

#### 4. `PRD/sections/system-map.md` — update the Player Life Tracker summary (line ~543)

```diff
@@ ## Player Life Tracker — Summary @@
-rotated per-seat life cards with grid/list seat arrangements (list uses the row-based "turned ends" pattern), half-card life-adjustment zones oriented by seat rotation (DEC-136; superseding earlier edge bands),
+rotated per-seat life cards with grid/list seat arrangements (list uses the row-based "turned ends" pattern), half-card life-adjustment zones with `−` on the edge nearest each player and `+` on the far edge in both layouts so a player taps toward themselves to lose life (REQ-217, DEC-136; grid's earlier fixed screen left/right split reversed 2026-10-04),
```

- Verdict: accept (owner, 2026-10-04 — approved across conversation; ratified by merging docs PR #247)
- Reason: The owner specified this directly — `−` nearest each player in both
  layouts, grid stays the default, list ends unchanged and only its middle pairs
  fixed. The grid reversal of DEC-170 is the owner's explicit 2026-10-04 call;
  the "awkward for four inward-facing cards" concern is noted and the owner will
  judge the built grid live.
