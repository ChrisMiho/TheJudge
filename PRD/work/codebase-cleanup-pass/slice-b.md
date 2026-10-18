# Slice B — Frontend tests: lighter setup, shared helpers

## Status: planned

Depends on: none. Findings: T-03, T-04.

## Goal

Frontend tests that never draw a screen stop loading the whole app, and tests import the shared helpers instead of carrying copies. Same test files, same test names, same test count.

## Requirements

1. Before editing, record the base: file count, test count, test names (`npm --workspace apps/frontend run test -- --reporter=json --outputFile=<scratch>/before.json` or the equivalent; keep the list of names in the scratchpad or evidence log), and wall time. Write the numbers to `slice-b.evidence.md`. Intake said 154 files / 1,666 tests; the base number rules.
2. **T-03.** `apps/frontend/src/test/setup.ts` statically imports `destinationRegistry` and runs `beforeAll(preloadPortalDestinations)` for every file (about `:4-7`), including the 51 DOM-free files. Guard the DOM-only work (preload, `cleanup`, jest-dom, the `scrollIntoView` shim, `resetBackgroundDownloadForTests`) behind `typeof document !== "undefined"`, loading the registry by dynamic import inside the guard.
3. **T-04.** Replace copied helpers with imports of the existing ones: `createMemoryStorage` and `jsonResponse` from `src/test/appTestHelpers.tsx`; `queueAskAiResponses` from `src/test/interactionFlowsHarness.ts`; `appCss` / `flowCss` / `shellCss`. Add `cssBlock`, `selectDestination` and `openHistory` to `appTestHelpers.tsx`. Script tests share `codeOnly()`. Each file keeps its own fixture data.
4. **Confinement.** Skip every test file whose subject a pending brief owns: tests of `QuickLookupApp`, `ZoneCollectionStep`, `ZoneCardPicker`, `TradeSide`, `TradeBalancer`, `cardMetadataStore` / `cardMetadataSharing`, `FeaturePortalMenu`, `SheetShell`, `AdaptiveContextDialog`, `useOutsideDismiss`, `ConversationHistoryDrawer`, `CardPresentation`, `PrintingPicker`.
5. The stylesheet-reading guard tests (motion, ambient accent, reduced motion, menu tray) keep every assertion; only their copied `cssBlock` parser is replaced, and the replacement must parse identically. Prove it: for each such test, run the old and new parser over the same stylesheet text and compare outputs, or confirm the shared `cssBlock` is the same function body.
6. Do not edit `apps/frontend/src/lib/**/*.css` or `index.css`.

## Acceptance criteria

- [ ] B1. `src/test/setup.ts` guards all DOM-only work behind `typeof document !== "undefined"` and loads `destinationRegistry` by dynamic import inside the guard.
- [ ] B2. `appTestHelpers.tsx` exports `cssBlock`, `selectDestination` and `openHistory`; no copied definition of `createMemoryStorage`, `jsonResponse` or `queueAskAiResponses` remains in a non-confined test file.
- [ ] B3. The stylesheet-reading guard tests keep every assertion and use the shared `cssBlock`; its output equals the old copies' output on the same input (recorded in the evidence log).
- [ ] B4. No confined test file (the pending-brief list above) is edited: `git diff --name-only origin/main` lists none of them.
- [ ] B5. Full frontend suite is green with the same file count, test count and test names as the base (recorded in the evidence log).
- [ ] B6. The 51 DOM-free (node-environment) test files run green; their time before and after is recorded and after is lower.
- [ ] B7. `npm --workspace apps/frontend run typecheck` exits 0.
- [ ] B8. `npm run test:scripts` is green (script tests share `codeOnly()`).
- [ ] B9. `npm run lint` exits 0.

## Verification

```bash
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
npm run test:scripts
npm run lint
git diff --name-only origin/main
```

## Reverted findings

None yet.

## Files touched

- `apps/frontend/src/test/setup.ts`
- `apps/frontend/src/test/appTestHelpers.tsx`
- frontend test files with copied helpers (not in the confinement list)
- script test files that copy `codeOnly()`
