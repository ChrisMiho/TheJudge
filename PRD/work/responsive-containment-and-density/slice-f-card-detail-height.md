# Slice F — Card detail height reduction

## Status: planned

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
