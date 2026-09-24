# Slice C — shared-chrome-and-menu-mockup

## Status: planned

## Goal

A clickable HTML mockup of shared chrome and the Menu — menu rail/tray, brand
mark, Theme section, mock-mode banner, feedback modal, history drawer, View
Context overlay, card-detail popup — at phone and desktop widths, using
slice B's token/motif system, paired with a "before" screenshot of today's
screen. This slice also produces the `REQ-202` proof: a Life Tracker
before/after screenshot pair showing shared-chrome inheritance causes no
drift to Life Tracker's own screen.

## Requirements

1. `docs/design/ui-reimagining/direction-1/shared-chrome-menu.html` imports
   `tokens.css`, `shell.css`, and
   `motifs/`; it renders the menu rail/tray, brand mark, a Theme section
   listing all six profiles in White/Blue/Black/Red/Green/Colorless order
   with Blue marked default, the mock-mode banner, and click-to-open demos of
   the feedback modal, history drawer, View Context overlay, and card-detail
   popup (each opens/closes with vanilla CSS/JS, no framework).
2. Clicking a Theme swatch live-updates the wash, panel fills/edges, focus
   ring, and card-detail popup styling on the same page, without a reload
   (demonstrating `REQ-200`/`FLOW-007` step 4's "applies immediately").
3. The brand mark is a real element sized to the `REQ-205` 44px floor and
   uses a `REQ-201` motif, not an official Wizards of the Coast asset.
4. The page embeds or links the matching "before" screenshot(s) from slice B
   (`../before/menu-*.png`, i.e.
   `docs/design/ui-reimagining/before/menu-*.png`) so the pairing is visible
   without leaving the page.
5. Compose a Life Tracker "after" view: the real Life Tracker screen content
   (captured or faithfully reproduced from
   `docs/design/ui-reimagining/before/life-tracker-*.png`) wrapped in the new
   shared chrome (menu rail, brand mark, theme styling). Render it at
   390x844 and 1440x900 and capture each as
   `docs/design/ui-reimagining/after/life-tracker-<viewport>.png`.
6. Life Tracker's own screen content (counters, layout) in the "after"
   capture must read as visually unchanged from the "before" capture — this
   slice changes only the chrome around it.

## Acceptance criteria

- [ ] C1 — `shared-chrome-menu.html` renders at 390x844 and 1440x900,
      showing the menu rail/tray, brand mark, a six-swatch Theme section in
      the correct order with Blue marked default, the mock-mode banner, and
      working click-to-open demos of the feedback modal, history drawer,
      View Context overlay, and card-detail popup.
- [ ] C2 (manual) — clicking a Theme swatch visibly re-themes the wash, at
      least one panel edge, the focus ring, and the card-detail popup on the
      same page load, with no reload.
- [ ] C3 — the brand mark element measures >=44px in its smaller dimension
      and renders a `REQ-201` motif, not an official Wizards of the Coast
      glyph/logo/card art.
- [ ] C4 — the page visibly embeds or links the slice-B "before" screenshot(s)
      for the Menu/shared-chrome destination.
- [ ] C5 (manual) — the Life Tracker "after" render at both viewports keeps
      Life Tracker's own counters and layout visually unchanged from the
      "before" capture; only the surrounding chrome differs.
- [ ] C6 — `docs/design/ui-reimagining/after/life-tracker-390x844.png` and
      `docs/design/ui-reimagining/after/life-tracker-1440x900.png` exist and
      are referenced together with their `before/` counterparts (in the page
      or a short `docs/design/ui-reimagining/life-tracker-pair.md`/section)
      for the owner's review.
- [ ] C7 (manual) — no official Wizards of the Coast mana glyph, icon font,
      logo, or card art appears anywhere on the page or in the Life Tracker
      composite.
- [ ] C8 — cleanup evidence: `browser_close` called; the dev server this
      slice attached to (or started, if none was already running) is
      stopped/released if owned by this slice; capture path recorded.

## Verification

```bash
ls docs/design/ui-reimagining/direction-1/shared-chrome-menu.html
ls docs/design/ui-reimagining/after/
```

## Files touched

- `docs/design/ui-reimagining/direction-1/shared-chrome-menu.html` (new)
- `docs/design/ui-reimagining/after/life-tracker-390x844.png` (new)
- `docs/design/ui-reimagining/after/life-tracker-1440x900.png` (new)
