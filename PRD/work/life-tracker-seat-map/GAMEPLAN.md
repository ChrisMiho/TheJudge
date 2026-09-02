# GAMEPLAN — life-tracker-seat-map

## Objective

Every player's on-card commander-damage preview, and the bigger matrix inside
their opened counter panel, becomes a miniature of the real seat arrangement —
"me" at your own seat, each opponent where they actually sit — instead of a
fixed roster list. At 7–8 players the on-card map and the player-name pill stay
fully inside the card. Pure frontend/presentation; no backend, provider, seed
contract, or persistence change. See `DESIGN-BRIEF.md` for the full direction
and `GATE-QUESTIONS.md` for the accepted REQ-173 diff (applied at build, not
here).

## Architecture

- **The map is a miniature of the grid `PlayerLifeTrackerApp` already lays the
  real cards out on.** `seatArrangement(count)` / `listSeatArrangement(count)`
  already return, per seat, `{ label, side, rotation, gridArea, gridRow,
  gridColumn }` plus `columns`/`rows`. `PlayerLifeTrackerApp` computes this once
  as `layout` and today only threads each card's own `placement` down — the
  fix is to also thread the **full** `layout` into `PlayerLifeCard` and
  `CounterPanel`, so each card/panel can place every seat, not just its own.
- **One shared, pure geometry function** (`buildSeatMapCells`, new in
  `lib/lifeTracker/seatMap.ts`) turns `(layout, players, viewerLabel)` into one
  cell per player, each carrying that player's own `gridRow`/`gridColumn`/
  `gridArea` and an `isSelf` flag. `PlayerLifeCard` and `CounterPanel` both call
  it; each decides what to render inside a cell (the on-card damage number vs.
  the panel's `CommanderDamageCell`), so cell content stays exactly as it is
  today — only placement changes.
- **On-card (`PlayerLifeCard`):** the existing rotated, container-query-sized
  content box already makes the card read egocentrically (the same mechanism
  that faces the life number toward the seated player, DEC-136). The preview
  grid rides that same box, so per-seat placement plus the existing rotation is
  sufficient — no new orientation mechanism. Containment is fixed by sizing the
  grid to the arrangement's real `columns`/`rows` instead of `ceil(√N)`.
- **Panel (`CounterPanel`):** the panel is a non-rotated centered dialog
  (DEC-139) and stays that way — its map is an absolute top-down replica of the
  table, opener's own seat highlighted as "me" at normal cell size (the
  oversized `min-h-36` tile is dropped). Only the matrix's internal arrangement
  changes; the overlay/tray shape is untouched.
- **Removed:** `PlayerLifeCard`'s roster-order `commanderDamagePreviewCells` +
  `ceil(√N)` `previewColumns`; `CounterPanel`'s fixed `grid-cols-2` roster
  `.map` and oversized "me" tile.
- **Preserved unchanged:** always-on commander-damage-decrements-life; the
  panel's `−`/`+` bands (~53px, REQ-112) inside `CommanderDamageCell`; the "me"
  self-cell; seat rotation as the sole life-zone orientation input (DEC-136);
  the panel's full-height overlay shape (DEC-139); `GameContext` seed contract
  (DEC-102) and persistence shape (DEC-103) — untouched, presentation only.

## Slices

| Slice | Objective | Depends on |
| --- | --- | --- |
| A | Seat-map geometry: shared `buildSeatMapCells` helper; thread the full `layout` prop from `PlayerLifeTrackerApp` into `PlayerLifeCard` and `CounterPanel` | — |
| B | `PlayerLifeCard`: on-card preview becomes the per-seat map, sized to the arrangement's real columns/rows (containment fix) | A |
| C | `CounterPanel`: commander-damage matrix becomes the top-down per-seat map; drop the fixed 2-column roster loop and the oversized "me" tile | A |
| D | Live verification: 7/8-player containment (grid + list, iPhone-portrait) and side-seat glyph orientation, with owned-server/browser cleanup; Ship gates | B, C |

B and C are parallel-ready once A lands (each touches a different component).
D is the closing slice — it needs both surfaces built to verify the map
end-to-end, and carries the runtime-process-hygiene ownership for the live
browser check plus the package's Ship gates.

## Data flow

```
PlayerLifeTrackerApp
  layout = listSeatArrangement(count) | seatArrangement(count)   (already computed)
    │
    ├─ per real card: <PlayerLifeCard player players placement layout .../>
    │     placement = this card's own seat (unchanged, drives rotation/gridArea)
    │     layout    = NEW — the full arrangement, so the preview can place
    │                  every seat, not just its own
    │        buildSeatMapCells(layout, players, player.label)
    │          → one cell per player, each at ITS OWN seat's gridRow/gridColumn
    │          → preview grid template = layout.columns × layout.rows
    │
    └─ opened panel: <CounterPanel player players layout .../>
          layout = NEW — same arrangement, panel is never rotated (DEC-139)
             buildSeatMapCells(layout, players, player.label)
               → opener's own cell renders "me" (normal size) at its own seat
               → each opponent's CommanderDamageCell at its own seat
```

## Verification checklist

- [ ] `npm run test` (frontend) green for `seatMap.test.ts`, `PlayerLifeCard.test.tsx`,
      `CounterPanel.test.tsx`, `PlayerLifeTrackerApp.test.tsx`.
- [ ] `npm run typecheck` (frontend) green.
- [ ] No roster-order `.map(players)` layout logic remains in either surface —
      `grep -n "previewColumns\|commanderDamagePreviewCells\|grid-cols-2" apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx` returns nothing.
- [ ] Live containment verified at 7 and 8 players, grid and list, iPhone-portrait
      (~430px) — slice D.
- [ ] Browser closed, owned dev server stopped, port released, capture path
      recorded — slice D.

## PRD promotion checklist (executed at cleanup)

- REQ-173 added to `PRD/sections/functional-requirements.md` (already applied
  by `build`, per the propose/apply contract — cleanup verifies presence, does
  not re-apply).
- Prose edits to `PRD/sections/life-tracker/README.md` (life-table + counter
  panel/commander-damage-matrix sections) and the Player Life Tracker row in
  `PRD/sections/screen-layout.md`, per `GATE-QUESTIONS.md` diffs 2 and 3 —
  verified present, not re-applied.
- No new `DEC-###` (decision log retired); no new `FLOW-###`.
