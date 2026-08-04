# Slice D — Scan input for trade entries + ship

## Status: done

## Dependencies

Depends on **Slice C** (Trade Balancer view + entry-add path + `PrintingPicker`). Wave 3. Final slice — carries PRD promotion and ship gates.

## Goal

Add scan input to the Trade Balancer so the scanned printing becomes an entry's default printing (changeable), reusing the existing scan engine; then promote durable PRD truth and satisfy ship gates. (REQ-065 scan path, FLOW-009, DEC-070, DEC-087)

## Requirements

1. Add a **Scan** entry point on a trade side that opens the existing scan surface (`ScanCameraSurface.tsx`) and lazy-loads the scan artifacts as today. On a confident lock, resolve the candidate via `resolveScanCandidatesRanked` and use the **scanned printing** (`Candidate.card_id`, DEC-070) as the new entry's default printing, priced via `getPrintingPrice(id)` from Slice A's loader.
2. If the scanned printing id is absent from the price artifact, fall back to another printing of that oracle id (via `listPrintingsForOracle`) or surface the $0 + caution treatment; the entry is still added and the user can change the printing (reuse Slice C's change-printing control).
3. A scanned entry supports the same foil/quantity/remove/change-printing controls as a manual entry and counts toward the side total identically. Duplicates allowed; stack duplicate-block and 10-card cap do not apply.
4. If scanning is unavailable (no camera/permission), manual search remains the full input path (DEC-050 fallback); surface the reason.
5. Contract-frozen: scan identity stays oracle-level (DEC-053); the chosen printing is pricing/display only and is never pushed into prompt context, rulings, or any request payload. No backend/API/prompt change.

## Acceptance criteria

- [x] Opening Scan on a side and locking a card adds an entry whose default printing is the scanned printing, priced from the artifact (component test with a mocked scan resolve).
- [x] The scanned entry's printing can be changed via the shared picker, re-pricing it (component test).
- [x] A scanned printing id missing from the artifact falls back (other printing or $0 + caution) without breaking the add (component test).
- [x] Scan-unavailable path leaves manual search fully functional and surfaces the reason (component test).
- [x] No diff to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider boundary, or any endpoint (grep/manual check; backend tests unchanged and green).

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/trade/TradeBalancer.scan.test.tsx
npm run quality:check
```

## PRD promotion checklist (executed in thejudge-cleanup)

- [ ] Flip the `sections/system-map.md` Trade Balancer / nav-menu / price-artifact entries from `planned` to `shipped` (both gate conditions met per `doc-lifecycle.md`).
- [ ] Confirm DEC-087/088/089 and REQ-064–067 / NFR-013 / FLOW-009/010 need no wording change (already refined); update only if implementation diverged.
- [ ] Write the cleanup receipt at `PRD/instructions/receipts/card-trade-balancer-<YYYY-MM-DD>.md`.
- [ ] Delete `PRD/work/card-trade-balancer/` after promotion.

## Ship gates

- [x] Slice acceptance criteria (A–D) satisfied and verified
- [x] Tests updated; typecheck + frontend/backend tests + scoped eslint green for touched areas
- [x] Public contract unchanged (no `AskAiRequest` / schema / prompt / endpoint diff)
- [x] No secrets committed; raw Scryfall bulk stays gitignored, only the trimmed artifact committed
- [ ] Durable outcomes promoted; `PRD/work/card-trade-balancer/` ready to delete (deferred to `thejudge-cleanup`)

## Files touched

- `apps/frontend/src/components/trade/TradeSide.tsx` (add Scan entry point)
- `apps/frontend/src/components/trade/TradeBalancer.tsx` (scan-add wiring)
- `apps/frontend/src/components/trade/useTradeScan.ts` (new — scan wiring: oracle metadata synthesized from the price artifact, scanned-printing resolution, camera-unavailable fallback)
- `apps/frontend/src/components/trade/TradeBalancer.scan.test.tsx` (new)
- `apps/frontend/src/components/portal/TradeBalancerPlaceholder.tsx` (deleted — unreferenced once the registry pointed at the real view)
- (reuse, no change) `apps/frontend/src/components/ScanCameraSurface.tsx`, `apps/frontend/src/hooks/useScanCapture.ts`, `apps/frontend/src/lib/scan/loadScanMap.ts`, `apps/frontend/src/lib/scan/resolveScanCandidates.ts`
</content>
