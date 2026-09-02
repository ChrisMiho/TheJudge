# Gate questions — life-tracker-seat-map (`define` gate)

**Nothing is written to `PRD/sections/` here.** Each block below proposes a
durable product-truth change as a complete diff; the owner records a verdict per
block, and `build` applies the accepted diffs.

One new stable id gates: **REQ-173**. No new FLOW, no new DEC (the decision log
is retired). The prose edits to `life-tracker/README.md` and the row edit to
`screen-layout.md` are driven by REQ-173 and ride its block.

---

## REQ-173 — the commander-damage grid becomes a seat map on both surfaces

**What this decides:** whether every player's little commander-damage grid — and
the bigger one inside a player's opened counter panel — is laid out as a *map of
the table* (you at your own seat, each opponent in the direction they actually
sit) instead of a fixed roster list, and whether that map plus the player-name
pill are guaranteed to fit inside the card at 7 and 8 players without clipping.

**In plain terms:** today the grid just lists the players in signup order
(Player 1, 2, 3…) and only moves your own "me" box to your slot; the card's
rotation then spins that same list. So no two cards agree on where anyone sits,
and the "me" boxes cluster toward the middle of the table. After this, each
card's grid is a **compact horizontal block** that reads as the table from that
seat — "me" in your own seat corner, opponents around it by their real direction
as far as the block allows — at most two rows tall and growing wider as players
are added, the same in grid and list layout. The counter panel's bigger matrix
becomes a top-down seat map of the table (opener as "me" at their seat, each
opponent at their seat), replacing its two-column roster matrix and oversized
"me" tile. Separately, at 7 and 8 players the current on-card grid is a
near-square blob that spills past the narrow card edge and gets cut off, crushing
the name pill into the gap between cards; this requirement makes the on-card map
a compact horizontal block that grows sideways and guarantees the map and name
pill stay inside the card at every count from 2 to 8. Nothing about the
commander-damage *numbers*, the always-on "opponent damage lowers your life"
behavior, the `−`/`+` buttons in the panel, or the panel's overlay shape changes
— only where the cells sit.

**What happens if you say no:** the grid stays a roster list that no two cards
agree on, the "me" boxes keep clustering toward the middle, the panel keeps its
oversized "me" tile, and the 7–8-player clipping and crushed name pill stay.

### Proposed diff 1 of 3 — `PRD/sections/functional-requirements.md` (new REQ-173, appended after REQ-172)

```diff
@@ end of file, after REQ-172 @@
+
+### REQ-173
+- Title: Commander-damage cells are a per-seat map on both surfaces, contained at every count
+- Priority: medium
+- Description: The opened counter panel's commander-damage matrix is laid out as a miniature of the active seat arrangement — each player's cell at that player's own seat, the opener highlighted as "me", unused slots empty — instead of a fixed roster order with only the "me" mark moved; it derives from whichever arrangement is active (`seatArrangement` in grid mode, `listSeatArrangement` in list mode), a true top-down replica of the table. The on-card commander-damage preview reads as the same table but is rendered as a compact horizontal block — at most 2 rows tall, growing wider as players are added — the same in grid and list layout, never inheriting the tall arrangement shape or a near-square `ceil(√N)` blob. Within that block "me" sits in the current player's own seat corner and each opponent is placed by real table direction as a best-effort outcome; where a table's true geometry cannot fit 2 rows (7–8 players, extrapolated sideways) containment and the reference look win over exact directional fidelity, and the whole card is never rotated. The on-card block plus the player-name pill are contained within the card at every player count so nothing is clipped or spilled into the inter-card gutter.
+- Acceptance Criteria:
+  - the on-card commander-damage preview is a compact horizontal block — at most 2 rows tall, growing wider as players are added (e.g. a 2×4 block at 8 players) — with the current player's "me" cell in their own seat corner and each opponent placed around it by real table direction as a best-effort outcome within the block; it does not use the tall arrangement shape or a near-square `ceil(√N)` blob, and the whole card is never rotated
+  - no two cards place "me" in the same block cell — each card marks its own seat corner
+  - the opened counter panel's commander-damage matrix is the same seat map: the opener highlighted as "me" at their seat, each opponent's `−`/`+` cell at their seat, unused slots empty; the fixed two-column roster loop and the oversized "me" tile are removed. The panel is a non-rotated centered dialog, so its map is an absolute top-down replica of the table (not rotated to the opener's viewpoint)
+  - the panel matrix derives its layout from the active arrangement, so switching between grid and list mode keeps it a correct top-down replica of the rendered table; the on-card block keeps the same compact horizontal look in both grid and list layout
+  - the on-card map is the compact horizontal block (at most 2 rows, growing wider), not the tall `columns`/`rows` arrangement shape and not `ceil(√N)`
+  - the on-card map and the player-name pill are fully contained within the card at every player count 2–8, in both grid and list layout, at iPhone-portrait width (~430px): no cell clipped by the card's `overflow-hidden`, and the name pill neither crushed nor spilled into the inter-card gutter — verified live at 7 and 8 players
+- Constraints:
+  - pure frontend/presentation: no backend, no provider path, no `GameContext` seed contract (DEC-102), no persistence shape (DEC-103); mock-default keeps working
+  - preserve always-on commander-damage-decrements-life, the panel opponent cells' `−`/`+` bands (~53px, REQ-112), the "me" self-cell, and seat rotation as the sole life-zone orientation input (DEC-136)
+  - do not reopen the counter-panel overlay/tray shape (DEC-139) — change only the matrix arrangement inside the panel, never its height or overlay treatment
+  - the on-card map is the compact horizontal block and the whole card is never rotated (DEC-136 rotates only the life-number content); if the block's glyphs read sideways relative to a 90°/270° side-column seat, counter-rotate the glyphs only (matching the life-number treatment), never the block or the card
+- Dependencies:
+  - REQ-081
+  - REQ-112
+  - DEC-136
+  - DEC-139
+- Notes:
+  - the panel matrix is a miniature of the same `columns × rows` grid `PlayerLifeTrackerApp` already lays the real cards out on, reusing the arrangement's per-seat `gridRow`/`gridColumn`/`gridArea` rather than deriving a new layout; the on-card block does not — it is the compact horizontal block (at most 2 rows, growing wider), decoupled from the arrangement's shape and from `listSeatArrangement`'s stacking
+  - the reference's 1–5 relative-index labels are not adopted: position tells you who, the damage number tells you how much
```

### Proposed diff 2 of 3 — `PRD/sections/life-tracker/README.md` (life-table + counter-panel sections)

```diff
@@ ## How it works → ### Life table @@
   large life total rotated to face that player's own seat, in a default seat
   arrangement per player count with a grid mode and a list mode.
+- Built: each card carries a small commander-damage preview laid out as a
+  compact horizontal block — at most 2 rows tall, growing wider as players are
+  added — that reads as the table from that seat: the current player's "me" cell
+  in their own seat corner and each opponent placed around it by real table
+  direction as a best-effort outcome within the block, the same in grid and list
+  mode. Because each card marks its own seat corner, no two cards place "me" in
+  the same block cell, and the "me" cells no longer cluster toward the middle.
+  The whole card is never rotated. (REQ-173)
+- Built: the preview map and the player-name pill stay fully inside the card at
+  every player count (2–8) in both layouts — the map is a compact horizontal
+  block that grows sideways rather than a near-square blob or a tall strip, so
+  nothing is clipped or spilled into the gutter between cards, including at 7 and
+  8 players. (REQ-173)
@@ ### Counter panel and commander-damage matrix @@
 - Built: tapping a player's counter area opens that player's counter panel.
-  It tracks a per-opponent commander-damage matrix (a "me" cell marks the
-  player's own seat plus one cell per opponent), the named-counter palette —
+  It tracks a per-opponent commander-damage matrix laid out as a seat map — the
+  opener highlighted as "me" at their own seat and each opponent's cell at the
+  seat that player occupies, a top-down replica of the table (the panel is a
+  non-rotated centered dialog). Unused seat slots are empty; there is no fixed
+  roster order and no oversized "me" tile. Alongside it: the named-counter
+  palette —
   Monarch, Treasure, Initiative, Poison, Ascend, Rad, Day/night, C.Tax, K.O.,
   Energy, Exp — and user-added generic named counters. (REQ-173)
```

### Proposed diff 3 of 3 — `PRD/sections/screen-layout.md` (Player Life Tracker row)

```diff
@@ #### Player Life Tracker @@
 | Purpose | Live table life/counters |
 | Phone / Desktop | **One-screen fit** for the life table at every player count (DEC-136); full-bleed destination chrome |
 | Fit | No page scroll for the life table; counter panel is full-height overlay (DEC-139) |
+| Containment | On-card commander-damage map + player-name pill fit inside the card at every player count 2–8, both grid and list layout — map is a compact horizontal block that grows sideways (at most 2 rows, not a near-square `ceil(√N)` blob and not a tall strip), no cell clipped by the card's `overflow-hidden`, name pill not crushed or spilled into the inter-card gutter. Verified live at 7 and 8 players, iPhone-portrait (REQ-173) |
-| Notes | DEC-101, DEC-136, DEC-139 |
+| Notes | DEC-101, DEC-136, DEC-139, REQ-173 |
```

- Verdict: accept
- Reason: 2026-09-02 reconciliation. The owner accepted the feature and clarified
  that the on-card map is a compact horizontal block (at most 2 rows, grows wider,
  extrapolated sideways for 7–8 players, whole card never rotated), superseding the
  literal-arrangement / real-columns-and-rows on-card mechanism this block first
  proposed. Reconciled the on-card parts of the Description, Acceptance Criteria,
  Constraints, and Notes to that block; softened on-card seat-consistency to a
  best-effort outcome within the block. Left unchanged: the counter panel's
  top-down seat-map matrix, the containment guarantee (on-card map + name pill
  inside the card at 2–8, verified live at 7 and 8), and the preserved behaviors
  (always-on decrements-life, REQ-112 `−`/`+` bands, DEC-136, DEC-139). No new gate
  question and no new stable id.
