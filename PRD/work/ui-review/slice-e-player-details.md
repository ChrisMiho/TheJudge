# Slice E — In-Depth player-detail controls

## Status: planned

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

- [ ] Tests prove both disclosure controls use the same legible triangle treatment, preserve synchronized `aria-expanded` behavior and ≥44px hit classes, and no small U+25B8/U+25BE glyph remains in controls or hint
- [ ] Tests prove scalar selects expose exactly unset + 0–11 / 0–100 / 0–100, reject out-of-range selection, stack at every band, and preserve omitted-when-unset plus existing seeded values
- [ ] Tests prove commander damage remains free-typed/unbounded and commander/named-counter rows consume the same grouping pattern without data-shape changes
- [ ] At 390×844 and 1440×900, record both disclosure controls' 44px-or-greater hit rectangles and confirm the painted control reads as a triangle without wide rectangular chrome
- [ ] At both viewports, record commander-label-end → input-start distance; it must equal the declared row gap rather than flexible leftover width and be materially below the 457px desktop baseline, including with a long display name
- [ ] At both viewports, all three scalar controls are vertically stacked and content-sized; widths are below the 281px phone / 214px desktop baselines without sacrificing legibility
- [ ] At 390×844 with three expanded players, record the secondary-details region below the 1165px baseline; at 1440×900 record and accept the expected extra stacked-row height rather than restoring a horizontal grid
- [ ] No document horizontal scroll appears and no control expands into a full-screen overlay
- [ ] `npm run quality:check` is green
- [ ] Runtime evidence records browser/session handle, checkout, ports and ownership; `browser_close` called, owned servers stopped, owned ports released; captures written to `PRD/work/ui-review/.playwright-mcp/`

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
- Relevant `apps/frontend/src/App.*.test.tsx` player-context regressions
- `apps/frontend/src/index.css` only if the shared row/triangle pattern belongs in CSS
