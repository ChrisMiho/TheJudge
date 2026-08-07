# Slice C — Six-surface card sizing and composition

## Status: planned

## Goal

Make card images container-relative across all six surfaces while consolidating
staged-card chrome and preserving each host's first-viewport/scroll contract.

## Requirements

1. Replace `CardPresentation`'s fixed `max-h-32` with one width/container-relative,
   uncropped, aspect-preserving rule. Do not add a size variant, per-screen prop,
   fork, or call-site height re-cap.
2. On Quick Question and In-Depth Enrichment, remove duplicated name/oracle/mana/
   type/color presentation beside the image. Put only a smaller Remove action
   below it; detail remains reachable through slice B's popup.
3. Keep View Context on the same shared rule; do not shrink its card to satisfy
   the overlay cap.
4. Recompose zone selected-card/add preview to the approved mockup direction:
   large shell-column image, selected canonical name in search, no duplicate
   title below art, Add directly below, owner/add/fallback behavior unchanged.
5. Search and labeled Scan share one non-wrapping row at both viewports; search
   flexes and Scan retains a 44px touch floor.
6. Keep added-card tiles `w-40` in one horizontal region-scrolling row; images
   grow inside them and no document horizontal scroll appears.
7. Let Scan-review images grow to their list-row width inside the existing
   scrolling review list without displacing/overlapping camera chrome. If live
   390×844 verification proves a bound is needed, record it on the Scan camera
   `screen-layout.md` row; never fork/add a component size prop.
8. Add focused tests first for shared sizing classes, staged consolidation, zone
   selected-name/search composition, Search/Scan row, strip width/order, and
   unchanged missing-image/action behavior.

## Acceptance criteria

- [ ] Tests prove exactly one shared sizing rule, no `max-h-32`, no new size prop/variant, no call-site height cap, and unchanged aspect-preserving/missing-image behavior
- [ ] Tests prove Quick Question and Enrichment show only the smaller Remove action below the image with duplicated detail absent and popup detail still reachable
- [ ] Tests prove zone selected-card search displays the exact canonical name, no duplicate title renders, owner/Add/fallback semantics remain, Search+Scan are one row, and added tiles stay `w-40` in add order
- [ ] At 390×844 and 1440×900, inspect all six surfaces and record image width/height. The four shell-column images occupy a clear majority of content width at phone; at desktop each is larger than its phone render; all images remain uncropped
- [ ] At 390×844, zone Add has measured `top <= 844px`; Search and Scan do not wrap; Scan measures at least 44px high; selected name is exact; no duplicate title is present
- [ ] At both viewports, the zone strip remains a single fixed-160px-tile row with region scroll and `document.documentElement.scrollWidth === document.documentElement.clientWidth`
- [ ] At 390×844, expanded Scan review keeps its list region-scroll and does not displace or overlap the camera frame; at 1440×900 the same shared rule remains bounded by the existing review container
- [ ] Quick Question and In-Depth Enrichment do not gain document scroll solely from image growth; their primary submit/step chrome remains reachable per the catalog Fit rows
- [ ] Any necessary host-specific bound is written to the owning `screen-layout.md` row with measurement evidence, never to `CardPresentation` as a variant or fixed shared cap
- [ ] `npm run quality:check` is green
- [ ] Runtime evidence records browser/session handle, checkout, ports and ownership; `browser_close` called, owned servers stopped, owned ports released; captures written to `PRD/work/ui-review/.playwright-mcp/`

## Verification

```bash
npm --workspace apps/frontend run test -- CardPresentation CardSelectionPreview ZoneCardPicker ScanReviewBubble EnrichmentStep QuickLookupApp responsiveSurfaceHooks
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/CardPresentation.tsx`
- `apps/frontend/src/components/CardSelectionPreview.tsx`
- `apps/frontend/src/components/ZoneCardPicker.tsx`
- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/ScanReviewBubble.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- Focused tests beside those components
- `apps/frontend/src/index.css`
- `PRD/sections/screen-layout.md` only if live measurement requires a catalog-row bound already authorized by DEC-160/REQ-129
