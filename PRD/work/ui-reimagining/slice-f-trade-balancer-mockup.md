# Slice F — trade-balancer-mockup

## Status: planned

## Goal

A clickable HTML mockup of Trade Balancer implementing `REQ-204`: below
768px, Side A and Side B become two tabs sharing one panel instead of
stacking (today: 224px per side spent empty before a card is added); at and
above 768px, today's side-by-side composition is unchanged. Every control
meets the `REQ-205` touch floor. Real card names, real prices. Paired with a
"before" screenshot of today's screen.

## Requirements

1. `docs/design/ui-reimagining/direction-1/trade-balancer.html` imports
   `tokens.css`, `shell.css`, and `motifs/`.
2. Below 768px: exactly one side's entry list, search, scan control, and
   side total render at a time, selected by a clickable two-tab control. Both
   side totals and the difference readout stay visible in the first viewport
   regardless of which tab is active.
3. Switching tabs (a real click-through demo) preserves each side's visible
   entries/quantities and does not reload the page.
4. At and above 768px, both sides render side by side exactly as today's
   shipped layout (protected scope — the phone tab treatment must not reach
   this composition).
5. The tab control measures >=44px in its smaller dimension and shows a
   visible focus ring on keyboard focus.
6. The per-side search input and Scan button each measure >=44px in their
   smaller dimension (today: 299x38 / 299x40).
7. Real card names and real prices on both sides.
8. Visual language is consistent with slice C's token/motif system.
9. The page embeds or links the slice-B "before" screenshot
   (`../before/trade-balancer-*.png`, i.e.
   `docs/design/ui-reimagining/before/trade-balancer-*.png`), showing the
   224px-per-side empty-state baseline this replaces.

## Acceptance criteria

- [ ] F1 — below 768px, exactly one side's list/search/scan/total renders at
      a time via a clickable two-tab control, with both side totals and the
      difference readout visible in the first viewport on either tab.
- [ ] F2 (manual) — switching tabs preserves each side's visible
      entries/quantities and does not reload the page.
- [ ] F3 — at and above 768px, both sides render side by side, matching
      today's shipped composition unchanged.
- [ ] F4 — the tab control measures >=44px in its smaller dimension and
      shows a visible focus ring on keyboard focus.
- [ ] F5 — the per-side search input and Scan button each measure >=44px in
      their smaller dimension.
- [ ] F6 — both sides show real card names and real prices.
- [ ] F7 (manual) — the page's theme is visually consistent with slice C's
      token/motif system.
- [ ] F8 — the page embeds or links the slice-B "before" screenshot for
      Trade Balancer.
- [ ] F9 (manual) — no official Wizards of the Coast mana glyph, icon font,
      logo, or card art appears anywhere on the page.
- [ ] F10 — cleanup evidence: `browser_close` called; the dev server this
      slice attached to (or started, if none was already running) is
      stopped/released if owned by this slice; capture path recorded.

## Verification

```bash
ls docs/design/ui-reimagining/direction-1/trade-balancer.html
```

## Files touched

- `docs/design/ui-reimagining/direction-1/trade-balancer.html` (new)
