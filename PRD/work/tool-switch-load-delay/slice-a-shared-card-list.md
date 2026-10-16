# Slice A — Shared card list

## Status: planned

## Goal

The card list (`/data/cardMetadata.json`) is downloaded and parsed once per page and shared by Quick Question, In-Depth and the Trade Balancer, with each screen keeping its own loading state, failure copy and search index.

## Requirements

1. New module under `apps/frontend/src/lib/` (name chosen here): a load call returning a promise of the parsed `CardMetadataItem[]`, reusing an in-flight or finished load, plus a synchronous read returning the array if already arrived (else nothing). Brief design item 7.
2. Failure (network error or non-2xx) rejects every waiting caller and clears the shared load so the next caller fetches fresh. No retry by itself.
3. A test-only reset, called from `apps/frontend/src/test/setup.ts` `afterEach`.
4. Replace the fetch-and-parse inside the three effects: `components/portal/quick-lookup/QuickLookupApp.tsx`, `components/portal/MtgAssistantApp.tsx`, `components/trade/TradeBalancer.tsx`. Each screen seeds its state from the synchronous read on first render (no one-frame "Loading card list…"), and uses an "is still mounted" guard instead of `AbortController`; unmount never cancels the shared download.
5. Each screen keeps its copy: Quick Question "Card search is unavailable. You can still ask without a card."; In-Depth logs the error and shows nothing; Trade Balancer "Loading card list…", `METADATA_LOAD_ERROR_COPY` plus reason, own `buildOracleSearchIndex`.
6. Product truth: Diff 4 of `GATE-QUESTIONS.md` (seven hunks, five files: `trade-balancer/README.md` at :59, :185, :196; `functional-requirements.md` REQ-064; `user-flows.md`; `system-map.md`; `integrations-and-data.md`), applied to `PRD/sections/` by intent together with the code. The Trade Balancer health ping stays in its mount effect.

## Acceptance criteria

- [ ] The shared load fetches once, is reused by concurrent and later callers, and hands back the finished list synchronously (unit test)
- [ ] After a failed download every waiting caller is rejected and the next call fetches again (unit test)
- [ ] The test-only reset runs after each test in `apps/frontend/src/test/setup.ts`, so no list leaks between tests
- [ ] Quick Question: card search works once the list arrives; a failed list shows "Card search is unavailable. You can still ask without a card." and asking still works (component tests)
- [ ] In-Depth: zone-step card search works; a failed list shows no message and logs the error (component tests)
- [ ] Trade Balancer: "Loading card list…" while waiting, search disabled until arrival, search finds cards after, failed list shows existing error copy with the reason (component tests)
- [ ] A screen that unmounts while the list downloads does not cancel it for another screen still waiting (test)
- [ ] A screen opened after the list has arrived renders with the list in hand and its loading flag false on first render (test)
- [ ] Diff 4 is applied to the five `PRD/sections/` files as finalized
- [ ] `npm --workspace apps/frontend run test` and `npm run quality:check` pass with no coverage threshold lowered (NFR-012)

## Verification

```bash
npm --workspace apps/frontend run test
npm run typecheck
npm run quality:check
```

## Files touched

- `apps/frontend/src/lib/<shared card-list module>.ts` and its test (new)
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/components/trade/TradeBalancer.tsx`
- `apps/frontend/src/test/setup.ts`
- Existing card-list tests of the three consumers
- `PRD/sections/trade-balancer/README.md`, `functional-requirements.md`, `user-flows.md`, `system-map.md`, `integrations-and-data.md` (Diff 4)
