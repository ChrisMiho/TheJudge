# Slice B — Pre-submit composer composition

## Status: planned

## Goal

Give the Enrichment optional-question and Quick Question composers the shipped
`FollowUpComposer` composition — full-width field, inline counter, compact
circular submit — so the field stops being starved at phone widths
(REQ-121, DEC-146).

## Requirements

1. Both pre-submit composers present the text field as the dominant element of
   their row, with the counter inline and a compact circular submit control.
2. The submit control keeps its existing accessible name (`Ask TheJudge`,
   `Decrypt Stack`) even when rendered without a visible text label.
3. Reuse the `FollowUpComposer` treatment rather than re-implementing it —
   `technical-design-rules.md` requires reuse before creating.
4. Wider viewports may keep a labelled control provided the field keeps the
   dominant share of the row.
5. Submit gating, character caps, and the zone-aware blank-question fallback are unchanged.

## Acceptance criteria

- [ ] At 390px viewport width the field measures at least 65% of its composer row's
      width (baseline defect: 136px of 340px = 40%; `FollowUpComposer` measures 230px)
- [ ] The field's `scrollHeight` does not exceed its `clientHeight` at rest — placeholder
      and typed content are not clipped (baseline defect: 20px clipped)
- [ ] The submit control exposes its accessible name via `getByRole('button', { name: ... })`
      in tests, whether or not the label is visible
- [ ] Submit control measures at least 44×44 CSS px (NFR-001)
- [ ] Existing submit-gating, character-cap, and fallback-question tests still pass unchanged
- [ ] The answered-view `FollowUpComposer` is not modified

## Verification

```bash
npm --workspace apps/frontend run test -- EnrichmentStep QuickLookupApp FollowUpComposer
npm run quality:check
```

Playwright MCP at 390×844: `browser_evaluate` comparing composer row width to
field width on both Quick Question and the Enrichment step, plus a screenshot of
each.

## Files touched

- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/components/EnrichmentStep.test.tsx`
- tests covering the Quick Question composer

## Dependencies

- Slice A — the "no clipping at rest" criterion cannot pass while the shared hook
  pins `height: 0px`.
