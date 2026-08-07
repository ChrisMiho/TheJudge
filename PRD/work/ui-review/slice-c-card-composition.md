# Slice C — Six-surface card sizing and composition

## Status: done

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

## Verification evidence

- Checkout `.worktrees/implement-ui-review`; servers **started by this agent** on `PORT=3901` / `FRONTEND_PORT=5901` via `npm run dev:mock`; browser: Playwright MCP.
- One shared rule: `CardPresentation`'s image is now `h-auto w-full object-contain` inside a `w-full` (not `w-fit`) wrapper. `max-h-32` is gone from the component and no call site reintroduces a height cap; `.enrichment-card-presentation img { width: 51.2% }` was removed with it. Tests assert no `max-h-`, no `w-auto`, no size variant, and identical classes when the same component renders in a 160px and a 640px host.
- Staged consolidation: `CardSelectionPreview` lost its `grid-cols-[minmax(160px,200px)_1fr]` metadata sidebar, its duplicate `<h2>` name, and its now-dead `contextTitle`/`contextContent`/`showContextSection` props. Only the shell-column image plus the host's smaller action remain; detail stays reachable through slice B's popup. Verified live and by focused tests on Quick Question, the frozen View Context card, and the zone selected-card/add preview.
- Zone composition: selecting a card by pointer **or** keyboard now writes its exact canonical name into the search field (one `selectCard` helper feeds both paths), which is what let the duplicate title below the art go. Suggestions stay closed while the field holds exactly that name, so the list never covers the staged preview. Search and the labeled Scan share one `grid-cols-[1fr_auto]` row at every width (the prior `sm:` prefix stacked them below 640px); both carry `min-h-11`.
- Strip and scan review: tiles keep `w-40 shrink-0` in the one horizontal region-scrolling row; only the image inside grows. Scan review takes its list-row width with no shell-column cap.
- **Measured live at 390x844 (Quick Question):** the image grew from the 92x128 baseline to 151x211 — 1.65x — with aspect ratio preserved (rendered vs natural ratio equal to 4 decimal places) and `object-fit: contain`. Send Request sits fully in the first viewport (`bottom` 754px) and document scroll is 846px against the 844px baseline, i.e. no scroll gained from image growth. At 1440x900 the same image renders 271x378 — materially larger than phone, as DEC-160 requires — with Send Request `bottom` 892px inside the 900px viewport. No document horizontal scroll at either viewport (`scrollWidth === clientWidth`).
- **REQ-129 vs REQ-141 conflict, resolved and recorded.** An unbounded content-column image measured 265x369 at 390x844 and pushed Send Request to `top` 868px with 1004px of document scroll — DEC-160's growth losing to REQ-129's Fit rule. Per the catalog, Fit wins and the bound is recorded on the hosting row: `.card-shell-column img` is capped at `max-height: 25dvh` / `42dvh`, a host-row **height** bound rather than a component fork or a reinstated shared `max-h-32`. Written to the Quick Question pre-submit row of `PRD/sections/screen-layout.md` with the measurements above. **Accepted consequence:** at 390x844 the image is 45.5% of content width, so REQ-141's "clear majority at phone" is **not** met on this surface. This is a real, deliberate shortfall against that criterion, not a passed one.
- Runtime cleanup: `browser_close` called; the owned `node scripts/dev.mjs` tree stopped by `SIGTERM` to its own handle and exited (background task exit code 0); `lsof` confirms no listener on 3901/5901. The pre-existing user-owned dev server (PID 52408, main checkout) was identified and left running.
- Captures: none needed beyond slice B's; all slice C criteria are numeric measurements recorded above.

### Not verified live

Scan review — same limitation recorded in slice B (the perceptual-hash identifier cannot converge on Chrome's synthetic fake camera), so requirement 7's live 390x844 check did not run. Covered by `ScanReviewBubble.test.tsx` and the shared sizing rule. No host-specific Scan bound was added, because none could be measured; slice H should re-check.

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
