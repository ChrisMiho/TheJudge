# Slice I — Horizontal In-Depth zone-card strip

## Status: done

## Goal

Replace the two-column added-card grid in In-Depth zone collection with a
horizontal left-to-right strip in add order, with region scroll instead of
document scroll (REQ-130, DEC-151 part 3).

## Requirements

1. In `ZoneCardPicker.tsx`, change `.zone-card-grid` (currently
   `grid grid-cols-2 gap-2 overflow-y-auto` at line ~246) to a horizontal flex
   row (`overflow-x-auto`) so added cards lay out left-to-right in the order they
   were added, scrolling horizontally within the strip's own region.
2. Card tiles inside the strip render through `CardPresentation` and inherit
   Slice F's compact-image + corner-popup behavior — no separate detail affordance
   for the strip.
3. Stack zone's bottom-to-top ordering semantics and each tile's Remove control
   are unchanged in behavior; only the container's layout axis changes.
4. Horizontal overflow is contained to the strip region — the page/document does
   not gain horizontal scroll from this change.

## Acceptance criteria

- [ ] Added cards in zone collection lay out in a single horizontal row in add
      order (baseline: `grid grid-cols-2` two-column vertical layout)
- [ ] Overflow beyond the strip's width scrolls horizontally inside the strip
      (`scrollWidth > clientWidth` on the strip container is expected;
      `documentElement.scrollWidth <= clientWidth` at the page level is not)
- [ ] Stack zone's existing bottom-to-top add-order semantics are unchanged for
      unchanged inputs
- [ ] Removing a card from the strip still works and updates the underlying zone
      state the same as before
- [ ] Strip tiles show the corner detail control from Slice F when an image is
      available
- [ ] `ZoneCardPicker` existing tests pass with updated layout assertions

## Verification

```bash
npm --workspace apps/frontend run test -- ZoneCardPicker ZoneCollectionStep
npm run quality:check
```

Playwright MCP at 390×844 and 1440×900: In-Depth → zone collection → add three or
more cards to one zone → `browser_evaluate` for strip container `scrollWidth` vs
`clientWidth`, tile order (left-to-right = add order), and
`document.documentElement.scrollWidth` vs `clientWidth`; screenshot showing the
horizontal strip. Call `browser_close` when finished.

## Files touched

- `apps/frontend/src/components/ZoneCardPicker.tsx`
- `apps/frontend/src/components/ZoneCardPicker.test.tsx`
- `apps/frontend/src/index.css` (`.zone-card-grid` → strip styling, if class stays
  shared)

## Dependencies

- Slice F — strip tiles render through the compact-image + corner-popup
  `CardPresentation` this slice builds on; sequence after F so tile markup is not
  built twice.
