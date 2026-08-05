# Slice F — Card detail height reduction

## Status: blocked

## Goal

Bring the zone-collection card-detail add action back into the first viewport on
narrow screens by capping preview-image height and removing the duplicated oracle
text (REQ-125, DEC-148).

## Requirements

1. Cap the preview image's height on narrow viewports instead of rendering it at
   full intrinsic size (measured 272×375).
2. Do not render the oracle-text paragraph below the image when it merely repeats
   text already legible on the displayed card art.
3. The metadata list (mana cost, mana value, type line, colors, supertypes,
   subtypes), owner selection, and add behavior are unchanged in content.
4. When the card image is unavailable, the existing readable metadata fallback path
   (FLOW-001) is unaffected and its descriptive text still renders.
5. No sticky or floating chrome over the preview.

## Acceptance criteria

- [ ] At 390×844 the add action's measured `top` is at most 844px — within the first
      viewport (baseline defect: y=1088, 244px below fold)
- [ ] At 390×844 the detail view's document `scrollHeight` is at most 900px
      (baseline defect: 1286px)
- [ ] The oracle-text paragraph duplicated from the card art is not rendered beneath
      the image when the image is present
- [ ] With the image unavailable, the metadata fallback still renders its descriptive
      text — existing `CardPresentation` fallback tests pass unchanged
- [ ] Metadata list contents, owner selection, and add behavior are unchanged
- [ ] Wider viewports keep a legible preview presentation
- [ ] No sticky/fixed positioning added to the add action

## Verification

```bash
npm --workspace apps/frontend run test -- CardPresentation ZoneCollectionStep CardSelectionPreview
npm run quality:check
```

Playwright MCP at 390×844: In-Depth → zone collection → search "lightning bolt" →
select the result → `browser_evaluate` for add-action `top` and document
`scrollHeight`, plus a screenshot. Spot-check 1440×900.

## Files touched

- `apps/frontend/src/components/CardPresentation.tsx`
- `apps/frontend/src/components/CardSelectionPreview.tsx`
- `apps/frontend/src/components/CardPresentation.test.tsx`

## Dependencies

- Slice E — the page-height budget this slice measures against depends on the
  shell's rebalanced vertical composition.

## Verified (2026-08-05) — DEC-148 implemented in full; REQ-125's numeric target not reached

Both changes DEC-148 specifies are in place:

- Preview image height-capped below `sm` (`max-h-[17rem]`), measured 198×272 (was 272×375).
  The cap is deliberately generous: the card's own printed text stays readable, which is
  the premise for dropping the duplicate.
- The oracle-text paragraph no longer renders below the image at narrow widths
  (`duplicateOracleRendered: false`). It still renders at `sm+`, where the image sits in a
  narrow column and its text is not legible, and whenever there is no image at all — the
  `CardPresentation` fallback path is untouched.

| Measure | Before | After | REQ-125 target |
| --- | --- | --- | --- |
| Document `scrollHeight` | 1286px | **1153px** | ≤ 900px |
| "Add card" `top` | 1088px | **956px** | ≤ 844px |
| Below the fold by | 244px | **112px** | 0px |

**Not met.** The two levers DEC-148 authorises recover 133px; the target needs ~245px. The
rest of the height is the step's other chrome above the preview — zone tabs, search field,
Scan button, Card owner select — plus the six-row metadata list. Reaching the target means
restructuring the step (for example a two-column preview at phone widths, which would make
the card art too small to read and so invalidate the dedupe rationale), which is beyond
what DEC-148 decided. Card metadata content, owner selection, and add behaviour are
unchanged; `CardPresentation` / `CardSelectionPreview` tests 12/12 pass.
