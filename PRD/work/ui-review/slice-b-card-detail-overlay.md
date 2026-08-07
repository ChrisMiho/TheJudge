# Slice B — Portal-hosted card detail overlay

## Status: planned

## Goal

Free suite-wide card detail from the image's bounding box into the approved
bottom-sheet / side-panel overlay geometry.

## Requirements

1. Rehost `CardDetailPopup` through a portal, outside the image container, using
   slice A's shared close and outside-dismiss primitives.
2. Follow `screen-layout.md` exactly: content-sized bottom sheet below `768px`;
   right-side panel at `768px+` with View Context-family width; long detail
   region-scrolls inside the surface.
3. Keep the top-right image trigger, locally carried field list, image mounting,
   readable missing/failed-image fallback, Escape/focus behavior, and no-fetch
   rule unchanged.
4. Because `CardPresentation` is shared, the geometry must work identically on
   all six surfaces without a surface variant: Quick Question, In-Depth
   Enrichment, View Context, zone selected-card preview, zone strip, Scan review.
5. Add/adjust focused tests before implementation, including portal cleanup and
   trigger `aria-expanded` behavior.

## Acceptance criteria

- [ ] Component tests prove the dialog portals outside the card image container, uses the shared close/dismiss primitives, closes by close/Escape/outside, stays open on inside click, and restores the trigger state
- [ ] Component tests prove all detail fields still come from the passed card and missing/failed image still renders the text-first fallback with no network request
- [ ] At 390×844, open details from each of the six surfaces and record: bottom-sheet geometry below `768px`, dialog bounds independent of the image, close control fully inside bounds, long content region-scrolls, and no second document-length scroll is introduced
- [ ] At 1440×900, repeat all six surfaces and record: right-side panel geometry, width aligned with the View Context family, close inside bounds, and host layout unchanged behind the portal
- [ ] The former baseline cannot reproduce: dialog is not 92×128px, its 356px content is not squeezed to a 66px text column, and close does not overflow the dialog by 37px
- [ ] No per-screen popup copy, size variant, or new metadata fetch exists
- [ ] `npm run quality:check` is green
- [ ] Runtime evidence records browser/session handle, checkout, ports and ownership; `browser_close` called, owned servers stopped, owned ports released; captures written to `PRD/work/ui-review/.playwright-mcp/`

## Verification

```bash
npm --workspace apps/frontend run test -- CardPresentation CardSelectionPreview ZoneCardPicker ScanReviewBubble EnrichmentStep QuickLookupApp
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/CardPresentation.tsx`
- `apps/frontend/src/components/CardPresentation.test.tsx`
- `apps/frontend/src/components/OverlayCloseButton.tsx` (reuse from slice A, only if integration requires adjustment)
- Shared outside-dismiss helper/hook from slice A (reuse, only if integration requires adjustment)
- `apps/frontend/src/index.css`
- Focused consumer tests only where portal behavior needs explicit regression coverage
