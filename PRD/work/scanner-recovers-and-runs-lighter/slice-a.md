# Slice A — Recovery fix

## Status: done

## Goal

A failed scan-data download no longer sticks: closing the scanner and opening
it again retries, and the player reads one plain sentence instead of the raw
error.

## Requirements

1. `lib/scan/loadHashDb.ts` and `lib/scan/loadScanMap.ts` clear their cached
   promise when it rejects, only if it is still the current attempt (the
   `lib/cardMetadataStore.ts` lines 26-29 pattern). A download in flight is
   shared; one that arrived is reused.
2. `hooks/useScanCapture.ts` `ensureResources` (from line 239) resets
   `resourcesPromiseRef` on rejection so the next `openScan` retries.
3. One shared constant holds the player sentence "Card scanning is unavailable
   right now — check your connection, then close the scanner and open it again.
   You can still add cards with search." `openScan` and `identify` set it
   instead of `caught.message`; the raw error goes to `console` only.
4. The error line is announced (`role="alert"`) in all three tools; Quick
   Question lacks this today.
5. No automatic retry loop, no new "Try again" button, no change to when scan
   data downloads (NFR-014).
6. Apply the REQ-249 diff from the accepted `GATE-QUESTIONS.md`, by intent:
   new `### REQ-249` entry after REQ-247 in
   `PRD/sections/functional-requirements.md`, and the new "Built" bullet in
   `PRD/sections/scan/README.md` (### The camera surface). Do not use REQ-248.

## Tests added or changed

- `apps/frontend/src/lib/scan/persistence/loadHashDb.test.ts`: fail then
  succeed (second call re-requests; a newer in-flight attempt survives an older
  failure).
- `apps/frontend/src/lib/scan/persistence/loadScanMap.test.ts`: same.
- `apps/frontend/src/hooks/useScanCapture.test.ts`: first open fails, second
  open succeeds and the identifier is built; the player-facing line is the
  sentence, never the raw text (no status code or file name).
- Quick Question / host tests: the error line has `role="alert"` in all three
  hosts (`QuickLookupApp.test.tsx`, `ZoneCardPicker.test.tsx`,
  `TradeBalancer.scan.test.tsx`).

## Acceptance criteria

- [ ] Each loader clears a rejected cached promise and re-requests on the next call (tests pass)
- [ ] A newer in-flight attempt is not discarded by an older failure (test passes)
- [ ] `useScanCapture` first open fails, second open succeeds, identifier built (test passes)
- [ ] The player sees exactly the REQ-249 sentence and never the raw error text; raw error reaches the console only (test passes)
- [ ] The error line carries `role="alert"` in In-Depth, Quick Question and Trade Balancer (tests pass)
- [ ] REQ-249 added to `functional-requirements.md` and the scan README bullet added, matching the accepted diff
- [ ] Frontend tests, typecheck, lint and format check pass
- [ ] Live: with the scan-data request blocked then restored, the plain-words message shows, and close-and-reopen scans without reload (manual, dated observation)
- [ ] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/scanner-recovers-and-runs-lighter/.playwright-mcp/`

## Verification

```bash
npm --workspace apps/frontend run test -- loadHashDb loadScanMap useScanCapture
npm run typecheck && npm run lint && npm run format:check
```

## Files touched

- `apps/frontend/src/lib/scan/loadHashDb.ts`
- `apps/frontend/src/lib/scan/loadScanMap.ts`
- `apps/frontend/src/hooks/useScanCapture.ts`
- `apps/frontend/src/components/ZoneCardPicker.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/components/trade/TradeSide.tsx`
- the tests listed above
- `PRD/sections/functional-requirements.md`, `PRD/sections/scan/README.md` (REQ-249)
