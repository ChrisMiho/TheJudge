# Slice A — Scope scanner width override, frame Ask a Question

## Status: done

## Goal

Ask a Question's pre-submit screen becomes a `100dvh` frame: header and title take natural height, the card stage flexes and region-scrolls, the question box is pinned at the bottom and grows upward in place. The Ask column keeps 36rem / 92vw.

## Requirements

1. REQ-218 (frame, width unchanged), REQ-110, REQ-129, REQ-206 behavior on Ask a Question.
2. Re-scope the scanner's 31.5rem desktop override (`apps/frontend/src/index.css` ~line 4268) to the scanner host so it no longer matches the shared `.page-content-narrow-fit` for the Ask column.
3. `QuickLookupApp.tsx` pre-submit `PageShell` uses `narrow-fit` always; scanner open keeps its 31.5rem column.
4. `.qq` card stage `flex:1; min-height:0` region-scrolling; composer natural height as the foot; textarea caps then scrolls internally.
5. Do not add `overflow: hidden` on the inner column. `ComposerPill` structure unchanged.

## Acceptance criteria

- [x] The scanner's 31.5rem desktop width rule no longer targets the bare shared `.page-content-narrow-fit` class; it is scoped to the scanner host
- [x] Ask a Question pre-submit renders in the `narrow-fit` variant whether or not the scanner is open; test asserts it
- [x] Frontend unit tests for the Ask screen pass, including a new test for the variant and the pinned-composer structure
- [x] At 1440x716 on Ask a Question with a 300-character question typed, document scroll height is no greater than the viewport and the send pill `bottom` is inside the viewport (measured in browser)
- [x] At 390x740 on Ask a Question with a 300-character question typed, document scroll height is no greater than the viewport and the send pill `bottom` is inside the viewport (measured in browser)
- [x] At 1440px the Ask column measures 576px (36rem), and the scanner column, opened, measures 504px (31.5rem) (measured in browser)
- [x] The phone search-fold, the card-detail popup and the answered follow-up composer still work (browser walk)
- [x] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/anchor-ask-composer/.playwright-mcp/`

## Verification

```bash
npm --workspace apps/frontend run test -- QuickLookupApp PageShell
npm run typecheck
```

## Files touched

- `apps/frontend/src/index.css`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.test.tsx`
- `apps/frontend/src/components/PageShell.test.tsx`
