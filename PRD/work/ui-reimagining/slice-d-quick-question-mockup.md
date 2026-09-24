# Slice D — quick-question-mockup

## Status: planned

## Goal

A clickable HTML mockup of Quick Question (pre-submit and answered), fixing
the owner-reported friction: attaching several cards no longer pushes **Send
Request** off the bottom of the phone screen (`REQ-129`), and every control
meets the 44px touch floor (`REQ-205`). Real card names, real prices, real
answer copy. Paired with a "before" screenshot of today's screen.

## Requirements

1. `docs/design/ui-reimagining/direction-1/quick-question.html` imports
   `tokens.css`, `shell.css`, and `motifs/`.
2. Pre-submit state at 390x844 with the full `REQ-167` cap of 5 attached
   cards: the composer and **Send Request** stay inside the first viewport
   (bottom <= 844px). This reverses the measured baseline in
   `DESIGN-BRIEF.md` (2 cards attached, document 1159px tall, Send Request
   `bottom` 1067, 179px below the fold).
3. The attached-card list is a bounded region (a horizontal strip and/or a
   region-scrolled list) whose total height does not grow with card count —
   not a vertical stack of full-size images.
4. The card search input and the Scan button each measure >=44px in their
   smaller dimension (today: 299x38 for both).
5. Answered/conversation state shows real card names, real prices, and real
   AI answer copy — no lorem ipsum or placeholder text.
6. Desktop (1440x900) composition respects the existing `min(48rem, 92vw)`
   shell width cap (`REQ-124`, unchanged by this package).
7. Visual language (wash, panel edges, focus rings, motifs) is consistent
   with slice C's token/motif system — no locally redefined palette values.
8. The page embeds or links the slice-B "before" screenshot
   (`../before/quick-question-*.png`, i.e.
   `docs/design/ui-reimagining/before/quick-question-*.png`).

## Acceptance criteria

- [ ] D1 — at 390x844 with 5 cards attached, the composer and Send Request
      render fully within the first viewport (measured `bottom` <= 844px).
- [ ] D2 — the attached-card list renders as a bounded strip and/or
      region-scrolled list, not a vertical stack whose height grows with card
      count.
- [ ] D3 — the card search input and Scan button each measure >=44px in their
      smaller dimension.
- [ ] D4 — the answered/conversation state shows real card names, real
      prices, and real AI answer copy.
- [ ] D5 (manual) — the desktop (1440x900) composition's content column
      respects the `min(48rem, 92vw)` width cap.
- [ ] D6 (manual) — the page's theme (wash/edges/rings/motifs) is visually
      consistent with slice C's token/motif system.
- [ ] D7 — the page embeds or links the slice-B "before" screenshot for
      Quick Question.
- [ ] D8 (manual) — no official Wizards of the Coast mana glyph, icon font,
      logo, or card art appears anywhere on the page.
- [ ] D9 — cleanup evidence: `browser_close` called; the dev server this
      slice attached to (or started, if none was already running) is
      stopped/released if owned by this slice; capture path recorded.

## Verification

```bash
ls docs/design/ui-reimagining/direction-1/quick-question.html
```

## Files touched

- `docs/design/ui-reimagining/direction-1/quick-question.html` (new)
