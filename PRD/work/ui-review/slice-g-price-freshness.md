# Slice G — Human-readable price freshness

## Status: planned

## Goal

Render Trade Balancer's build-time snapshot date as concise human-facing copy.

## Requirements

1. Format `prices.snapshotDate` for display without changing the stored artifact,
   loader, pricing math, USD labels, or difference copy.
2. Use date-level precision appropriate to a build-time snapshot; do not expose
   raw `T`, milliseconds, or `Z`, and do not imply a live quote.
3. Preserve a safe fallback for an invalid/unparseable value rather than
   throwing or hiding the entire Trade view.
4. Add focused tests before implementation for ISO input, already date-only
   input, invalid input, and unchanged price behavior.

## Acceptance criteria

- [ ] Tests render `2026-06-05T22:21:13.248Z` as human-readable date-level copy with no raw `T22:21:13.248Z`
- [ ] Tests prove invalid snapshot data degrades safely and pricing totals/difference remain unchanged
- [ ] At 390×844 with the price artifact loaded, record that freshness copy has `scrollWidth <= clientWidth`, stays one line, and contains no raw ISO time/millisecond/zone suffix
- [ ] At 1440×900, confirm the same date-level copy and unchanged Difference/side totals
- [ ] `npm run quality:check` is green
- [ ] Runtime evidence records browser/session handle, checkout, ports and ownership; `browser_close` called, owned servers stopped, owned ports released; captures written to `PRD/work/ui-review/.playwright-mcp/` (or `none` recorded when no capture is needed)

## Verification

```bash
npm --workspace apps/frontend run test -- TradeBalancer
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/trade/TradeBalancer.tsx`
- `apps/frontend/src/components/trade/TradeBalancer.test.tsx`
- A shared date formatter only if an existing reusable formatter is found or a second adopter is demonstrated; otherwise keep the helper local
