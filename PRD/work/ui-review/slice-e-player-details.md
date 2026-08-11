# Slice E — In-Depth player-detail controls

## Status: done

## Goal

Make In-Depth player disclosures and counter inputs compact, legible, and
visually grouped while preserving their data contracts.

## Requirements

1. Replace both small-triangle glyphs/boxed disclosure treatments with a
   full-size triangle or inline SVG whose painted mass reads as a triangle.
   Preserve ≥44px hit areas, synchronized state, accessible names,
   `aria-expanded`, and collapsed/reset behavior. Fix the hint copy/glyph.
2. Define one reusable grouped label-and-input row pattern and apply it to
   commander-damage and named-counter rows. It must tolerate long editable
   player names and keep inputs' accessible names/input modes.
3. Keep commander damage as an uncapped free-typed numeric input and preserve
   `GamePlayerContext.commanderDamage` shape.
4. Replace poison/energy/experience inputs with vertically stacked,
   content-sized selects at all viewport widths: explicit unset; poison 0–11;
   energy 0–100; experience 0–100. Preserve optional omission/wire semantics.
5. Do not reuse Life Tracker's stepper or change Life Tracker seat/panel geometry.
6. Add focused tests before implementation for options/bounds/unset, grouping,
   disclosure semantics, and unchanged submit normalization.

## Acceptance criteria

- [x] Tests prove both disclosure controls use the same legible triangle treatment, preserve synchronized `aria-expanded` behavior and ≥44px hit classes, and no small U+25B8/U+25BE glyph remains in controls or hint
- [x] Tests prove scalar selects expose exactly unset + 0–11 / 0–100 / 0–100, reject out-of-range selection, stack at every band, and preserve omitted-when-unset plus existing seeded values
- [x] Tests prove commander damage remains free-typed/unbounded and commander/named-counter rows consume the same grouping pattern without data-shape changes
- [x] At 390×844 and 1440×900, record both disclosure controls' 44px-or-greater hit rectangles and confirm the painted control reads as a triangle without wide rectangular chrome
- [x] At both viewports, record commander-label-end → input-start distance; it must equal the declared row gap rather than flexible leftover width and be materially below the 457px desktop baseline, including with a long display name
- [x] At both viewports, all three scalar controls are vertically stacked and content-sized; widths are below the 281px phone / 214px desktop baselines without sacrificing legibility
- [x] At 390×844 with three expanded players, record the secondary-details region below the 1165px baseline; at 1440×900 record and accept the expected extra stacked-row height rather than restoring a horizontal grid
- [x] No document horizontal scroll appears and no control expands into a full-screen overlay
- [x] `npm run quality:check` is green
- [x] Runtime evidence records browser/session handle, checkout, ports and ownership; `browser_close` called, owned servers stopped, owned ports released; captures written to `PRD/work/ui-review/.playwright-mcp/`

## Verification evidence

- Checkout: `.worktrees/implement-ui-review` (branch `thejudge-impl/ui-review-root-20260811-1`), autonomous base `origin/main` @ `467cd42`.
- Servers started by this agent (not attached): backend `PORT=3111`, frontend
  `FRONTEND_PORT=5183`, via `npm run dev:mock`. Playwright MCP
  (`plugin-playwright-playwright`) drove the browser.

### What changed

- `PlayerRosterEditor` gains one internal `DisclosureTriangle` (inline SVG
  `viewBox="0 0 16 16"`, `polygon 4,1 14,8 4,15`) plus one shared
  `DISCLOSURE_CONTROL_CLASS`. Both arrows render the same triangle and rotate it
  90° when expanded instead of swapping `▸`/`▾`; the border/fill box is gone, so
  the triangle itself is the painted mass. Hit-area floors, accessible names,
  `aria-expanded`, `aria-controls`, and the shared collapse/reset behavior are
  untouched.
- `MtgAssistantApp` gains `COUNTER_ROW_CLASS` (`flex min-w-0 items-center gap-2`)
  and `COUNTER_AMOUNT_INPUT_CLASS`, consumed by the scalar rows, the
  commander-damage rows, and the named-counter rows. The former
  `grid-cols-[1fr_auto]` rows are gone.
- Poison/energy/experience are now stacked selects with an explicit `Unset`
  option and fixed ranges (0–11 / 0–100 / 0–100). `scalarCounterOptions` appends
  an out-of-range seeded value so a select can never silently drop existing state.
- Hint copy is now "Tap the arrow to set names and life totals — …" (no glyph).
- Commander damage remains a free-typed `inputMode="numeric"` input with no
  `max`. `buildPlayers` normalization, `parsePositiveInteger`, and the
  `GamePlayerContext` shapes are unchanged — the existing
  "submits edited populated counters while omitting zero and empty values"
  regression still asserts the same payload.
- Life Tracker's stepper and seat/panel geometry were not touched.

### Live measurements

| Measurement | 390×844 | 1440×900 | Baseline |
| --- | --- | --- | --- |
| Roster disclosure hit rect | 56×44 | 56×44 | ≥44×44 |
| Secondary disclosure hit rect | 44×44 | 44×44 | ≥44×44 |
| Painted triangle | 20×20 | 20×20 | legible triangle, no box |
| Commander label-end → input-start | 8px | 8px | was up to 457px on desktop |
| Scalar control width | 78px | 78px | 281px phone / 214px desktop |
| Scalar controls stacked | yes | yes | stacked at every band |
| Scalar select left edges aligned | yes (143px) | yes (479px) | — |
| Secondary regions, 3 expanded players | 720px total | 720px total | 1165px |
| Document horizontal scroll | none | none | none |
| Full-screen overlay opened | none | none | none |

Option counts measured live and in tests: poison 13 (`Unset` + 0–11), energy and
experience 102 (`Unset` + 0–100). A long display name
("Alexandrina Victoria Wilhelmina") was set on Player 1 for both viewport passes;
rows tolerated it with no horizontal scroll and no change to the 8px row gap.

The desktop secondary region is taller than the old `sm:grid-cols-3` row, as the
slice anticipated; that extra height is accepted rather than restoring a
horizontal grid.

Captures: `PRD/work/ui-review/.playwright-mcp/slice-e-390x844-player-details.png`,
`PRD/work/ui-review/.playwright-mcp/slice-e-1440x900-player-details.png`.

### Runtime cleanup

`browser_close` called after the last interaction. Owned servers stopped by
signalling the exact owning `node scripts/dev.mjs` manager PID (which stops both
child trees); `lsof` then reported no listener on `5183` or `3111` and no
surviving manager/child process.

## Verification

```bash
npm --workspace apps/frontend run test -- PlayerRosterEditor MtgAssistantApp.player-counters App.excess-player-ui App.player-life-tracker-seed
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/PlayerRosterEditor.tsx`
- `apps/frontend/src/components/PlayerRosterEditor.test.tsx`
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/components/portal/MtgAssistantApp.player-counters.test.tsx`
- `apps/frontend/src/App.excess-player-ui.test.tsx`
- `apps/frontend/src/App.player-life-tracker-seed.test.tsx`
- `apps/frontend/src/App.player-life-tracker-flow.test.tsx`
- `apps/frontend/src/App.interaction-flows.test.tsx`
- `apps/frontend/src/App.game-setup-zones.test.tsx`
