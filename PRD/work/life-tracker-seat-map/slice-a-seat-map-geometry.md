# Slice A — Seat-map geometry + layout wiring

## Status: done

### Handoff
- Done: `apps/frontend/src/lib/lifeTracker/seatMap.ts` + `seatMap.test.ts`
  (new, `buildSeatMapCells`); `layout` prop threaded into `PlayerLifeCard`
  and `CounterPanel` (types, JSX call sites in `PlayerLifeTrackerApp.tsx`,
  and both components' test fixtures). `npm run typecheck` passes; `npx
  vitest run src/lib/lifeTracker/seatMap.test.ts
  src/components/portal/life-tracker/PlayerLifeCard.test.tsx
  src/components/portal/life-tracker/CounterPanel.test.tsx` passes (32/32).
  All six criteria (A1–A6) are `true` in `slice-a.criteria.json` with
  hook-observed evidence for run `graph-20260902-093611`. The two blockers
  from the previous attempt are both resolved upstream before this resume:
  the A3 criteria-authoring bug (unescaped `^` in the evidence regex, fixed
  in `slice-a.criteria.json`) and the `denied-command-retry` guardrail gap
  (PR #181 added `"criterion-flip-without-evidence"` to `REMEDIABLE_RULES`
  in `scripts/lib/boundary-rules.mjs`), so the six `false → true` edits this
  time were accepted cleanly with no denial.
- Next: slice B (`PlayerLifeCard` on-card seat map) and slice C
  (`CounterPanel` seat map), both depending only on this slice.
- Stopped because: not stopped — slice A is complete; continuing to B/C/D in
  this same session.

## Goal

Give both surfaces a single, shared way to place every seat, not just their
own: a pure `buildSeatMapCells` helper, and the full active `layout`
(`SeatArrangementLayout` — `columns`/`rows`/`seats`) threaded from
`PlayerLifeTrackerApp` into `PlayerLifeCard` and `CounterPanel` alongside their
existing `placement`/`players` props. No rendering changes yet — B and C
consume this.

## Requirements

1. Add `apps/frontend/src/lib/lifeTracker/seatMap.ts` exporting
   `buildSeatMapCells(layout: SeatArrangementLayout, players: TrackerPlayer[],
   viewerLabel: PlayerLabel): SeatMapCell[]`, where each `SeatMapCell` carries
   at least `{ label, isSelf, gridRow, gridColumn, gridArea }` — the values
   copied straight from that player's own entry in `layout.seats` (matched by
   `label`), not derived from array order. A player whose label has no matching
   seat in `layout.seats` is skipped (mirrors the existing `if (!player) return
   null` guard in `PlayerLifeTrackerApp`) rather than crashing.
2. `buildSeatMapCells` is a pure, framework-agnostic function like
   `seatArrangement.ts` itself: no React import, no DOM/browser global read, no
   `lib/lifeTracker/state.ts` import.
3. In `PlayerLifeTrackerApp.tsx`, pass the `layout` it already computes as a new
   `layout` prop to every `<PlayerLifeCard .../>` and to `<CounterPanel .../>`.
4. Add `layout: SeatArrangementLayout` to `PlayerLifeCardProps` and
   `CounterPanelProps`; accept it in both components (unused for rendering in
   this slice — B and C wire it into the actual grid).
5. Update `PlayerLifeCard.test.tsx` and `CounterPanel.test.tsx` call sites to
   pass a `layout` fixture so the existing suites keep compiling and passing
   with the now-required prop.

## Acceptance criteria

- [x] A1: `buildSeatMapCells` returns one cell per player in `players`, and each
      cell's `gridRow`/`gridColumn`/`gridArea` equals that same player's own
      seat entry in `layout.seats` (unit test, checked for at least a 4-player
      and an 8-player arrangement).
- [x] A2: exactly one returned cell has `isSelf: true`, and its `label` equals
      the `viewerLabel` argument (unit test).
- [x] A3: `seatMap.ts` contains no React import and no import from
      `lib/lifeTracker/state.ts` (grep evidence — same purity bar as
      `seatArrangement.ts`).
- [x] A4: `PlayerLifeTrackerApp` passes its computed `layout` to both
      `PlayerLifeCard` and `CounterPanel` as a `layout` prop (paths evidence:
      the prop appears on both JSX call sites).
- [x] A5: `npm run typecheck` passes in `apps/frontend` with the new prop wired
      through.
- [x] A6: `npm run test` passes for `seatMap.test.ts`, `PlayerLifeCard.test.tsx`,
      and `CounterPanel.test.tsx`.

## Verification

```bash
cd apps/frontend
npm run typecheck
npx vitest run src/lib/lifeTracker/seatMap.test.ts src/components/portal/life-tracker/PlayerLifeCard.test.tsx src/components/portal/life-tracker/CounterPanel.test.tsx
```

## Files touched

- `apps/frontend/src/lib/lifeTracker/seatMap.ts` (new)
- `apps/frontend/src/lib/lifeTracker/seatMap.test.ts` (new)
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.test.tsx`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.test.tsx`
