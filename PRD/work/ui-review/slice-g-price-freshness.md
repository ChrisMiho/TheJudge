# Slice G — Human-readable price freshness

## Status: done

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

- [x] Tests render `2026-06-05T22:21:13.248Z` as human-readable date-level copy with no raw `T22:21:13.248Z`
- [x] Tests prove invalid snapshot data degrades safely and pricing totals/difference remain unchanged
- [x] At 390×844 with the price artifact loaded, record that freshness copy has `scrollWidth <= clientWidth`, stays one line, and contains no raw ISO time/millisecond/zone suffix
- [x] At 1440×900, confirm the same date-level copy and unchanged Difference/side totals
- [x] `npm run quality:check` is green
- [x] Runtime evidence records browser/session handle, checkout, ports and ownership; `browser_close` called, owned servers stopped, owned ports released; captures written to `PRD/work/ui-review/.playwright-mcp/` (or `none` recorded when no capture is needed)

## Verification evidence

- Checkout: `.worktrees/implement-ui-review` (branch `thejudge-impl/ui-review-root-20260811-1`), autonomous base `origin/main` @ `467cd42`.
- Servers started by this agent (not attached): backend `PORT=3111`, frontend
  `FRONTEND_PORT=5183`, via `npm run dev:mock`. Playwright MCP
  (`plugin-playwright-playwright`) drove the browser.

### What changed

`TradeBalancer` gains a local `formatSnapshotDate` plus one module-level
`Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric",
timeZone: "UTC" })`. It takes the leading `YYYY-MM-DD` of the artifact value,
rejects anything that does not match, and formats the parsed UTC date — so
`2026-06-05T22:21:13.248Z` and a bare `2026-06-05` both render `5 June 2026`.
An unparseable value returns `null` and the freshness line is omitted; nothing
else in the view is conditional on it. The artifact, `loadCardPrices`, pricing
math, USD labels, and difference copy are untouched. The formatter is fixed to
one locale rather than the ambient one so the copy is deterministic across
environments, matching `formatUsd`'s fixed USD convention. No shared date module
was introduced — there is exactly one adopter.

### Live measurements — real build artifact (`snapshotDate: 2026-06-05T22:21:13.248Z`)

| Measurement | 390×844 | 1440×900 |
| --- | --- | --- |
| Copy | `Prices as of 5 June 2026` | `Prices as of 5 June 2026` |
| Raw `T`/ms/`Z` present | no | no |
| `scrollWidth` vs `clientWidth` | 299 vs 299 (no overflow) | no overflow |
| Rendered height vs line-height | 16px vs 16px (one line) | one line |
| Difference | `Even trade` | `Even trade` |
| Side totals | `Side A $0.00 · Side B $0.00 · USD only` | unchanged |

Capture: `PRD/work/ui-review/.playwright-mcp/slice-g-390x844-price-freshness.png`.

Test coverage added: ISO-timestamp input renders date-level copy and asserts the
absence of `T22:21:13.248Z`; the pre-existing date-only fixture still renders
`5 June 2026`; an unparseable `not-a-date` omits the line, never prints the raw
value, and leaves search enabled with a added card totalling `$4.00` and
`Side A is ahead by $4.00`.

### Runtime cleanup

`browser_close` called after the last interaction. Owned servers stopped by
signalling the exact owning `node scripts/dev.mjs` manager PID; `lsof` then
reported no listener on `5183` or `3111` and no surviving manager process.

## Verification

```bash
npm --workspace apps/frontend run test -- TradeBalancer
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/trade/TradeBalancer.tsx`
- `apps/frontend/src/components/trade/TradeBalancer.test.tsx`
