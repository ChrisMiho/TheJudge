# Slice J — Theme orb single row

## Status: planned

## Goal

Keep all six Theme palette orbs on one row in the Menu tray's Theme section, and
center the Colorless custom-color controls under that row when Colorless is
selected (REQ-131, DEC-152).

## Requirements

1. In `ThemeSection.tsx`, the current two-row split (`grid grid-cols-5` palette
   row at line ~55, plus a second `grid grid-cols-5` row at line ~72 for
   Colorless alone) becomes one row holding all six orbs.
2. When Colorless is selected, its custom-color input and Reset control render
   centered under the full orb row (not under a specific column).
3. Selecting any other profile does not show the Colorless-only controls.
4. DEC-119's palette catalog and persistence behavior are unchanged — this is
   layout only.
5. Destination-menu row geometry (DEC-135) is unaffected — this slice touches
   only the Theme section inside the drawer.

## Acceptance criteria

- [ ] At 390×844 and 1440×900 with the Menu tray open, all six Theme orbs render
      in one row — the last orb is not alone on a second row (baseline defect:
      5+1 split across two `grid-cols-5` rows)
- [ ] When Colorless is selected, the custom color input and Reset control appear
      centered under the orb row
- [ ] Selecting a non-Colorless profile does not render the Colorless-only
      controls
- [ ] Orb touch targets remain at or above the existing 40×40px / 44px
      NFR-001 floor
- [ ] Palette selection persistence and DEC-119 catalog behavior are unchanged —
      existing `ThemeSection` tests pass

## Verification

```bash
npm --workspace apps/frontend run test -- ThemeSection
npm run quality:check
```

Playwright MCP at 390×844 and 1440×900: open the Menu tray → `browser_evaluate`
for orb row layout (single row, six children) and, after selecting Colorless,
the custom-controls' horizontal centering relative to the orb row; screenshots.
Call `browser_close` when finished.

## Files touched

- `apps/frontend/src/components/portal/ThemeSection.tsx`
- `apps/frontend/src/components/portal/ThemeSection.test.tsx`
