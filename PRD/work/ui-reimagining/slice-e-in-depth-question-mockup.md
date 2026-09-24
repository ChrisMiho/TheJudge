# Slice E — in-depth-question-mockup

## Status: planned

## Goal

One clickable HTML mockup covering every In-Depth Question step (game
context, zone collection, zone confirmation, answered), fixing the
owner-reported zone-strip density (`REQ-130`: at least 3 tiles visible at
390x844 without scrolling, was ~1.8) and the measured touch-floor gaps
(`REQ-205`), and demonstrating the `REQ-203` cross-screen Easter-egg entry
point. Step order and step count stay exactly as today; controls may be
regrouped within a step only. Real card names, real prices, real answer copy.
Paired with a "before" screenshot of today's screen.

## Requirements

1. `mockups/in-depth-question.html` imports `tokens.css`, `shell.css`, and
   `motifs/`. Clickable step navigation moves between game context, zone
   collection, zone confirmation, and the answered workspace — the same
   steps, same order, as today.
2. Zone collection at 390x844: at least 3 card tiles visible in the
   horizontal strip without scrolling it (today: ~1.8, measured 146x203
   images in a 265px visible / 326px scroll-width strip). Tile images still
   fill their tile interior per `DEC-160`; each tile keeps its Remove
   control, truncated name, stack-position label where applicable, and the
   corner detail popup as its read path.
3. At 390x844, the following each measure >=44px in the smaller dimension:
   brand mark (today 108x29), turn-phase select (307x37), active-player
   select (307x37), Confirm game-context (333x40), zone confirmation Back and
   Continue (160x42 each), and the zone checkbox row's hit area (input today
   16x16 — the row label may carry the real hit area).
4. The brand mark is present and tappable on every step shown, demonstrating
   the `REQ-203` entry point — a static click-count demo is acceptable; the
   full session-wide count across the whole app is app-code logic, out of
   scope here.
5. The answered workspace shows real card names, real prices, and real AI
   answer copy.
6. Desktop (1440x900) composition keeps today's side-by-side panels where
   today's layout uses them; no step added, removed, merged, or reordered.
7. Visual language is consistent with slice C's token/motif system.
8. The page embeds or links the slice-B "before" screenshots
   (`mockups/before/in-depth-*.png`).

## Acceptance criteria

- [ ] E1 — clickable step navigation covers game context, zone collection,
      zone confirmation, and the answered workspace, in that order, with no
      step added, removed, merged, or reordered from today.
- [ ] E2 — at 390x844, zone collection's strip shows at least 3 tiles
      visible without scrolling, each keeping its Remove control, truncated
      name, stack-position label where applicable, and detail popup.
- [ ] E3 — at 390x844, the brand mark, turn-phase select, active-player
      select, Confirm game-context, Back, Continue, and the zone checkbox
      row's hit area each measure >=44px in the smaller dimension.
- [ ] E4 (manual) — the brand mark is present and tappable on every step
      shown, demonstrating the Easter-egg entry point.
- [ ] E5 — the answered workspace shows real card names, real prices, and
      real AI answer copy.
- [ ] E6 (manual) — desktop composition keeps today's side-by-side panel
      layout where it exists today.
- [ ] E7 (manual) — the page's theme is visually consistent with slice C's
      token/motif system.
- [ ] E8 — the page embeds or links the slice-B "before" screenshot(s) for
      In-Depth Question.
- [ ] E9 (manual) — no official Wizards of the Coast mana glyph, icon font,
      logo, or card art appears anywhere on the page.
- [ ] E10 — cleanup evidence: `browser_close` called; the dev server this
      slice attached to (or started, if none was already running) is
      stopped/released if owned by this slice; capture path recorded.

## Verification

```bash
ls PRD/work/ui-reimagining/mockups/in-depth-question.html
```

## Files touched

- `PRD/work/ui-reimagining/mockups/in-depth-question.html` (new)
