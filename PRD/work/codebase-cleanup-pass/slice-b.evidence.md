# Slice B evidence

Node v26.0.0 local. Names compared as sorted `file :: full test name :: status` lines from the vitest JSON report.

## Baseline (tip after slice A, before editing, 2026-10-18)

- Frontend: 154 files, 1666 tests, all passed. Wall time about 15.5 s.
- The 51 node-environment files (the `node` entries of `environmentMatchGlobs`): 617 tests passed; wall time 4.5, 4.7, 4.7 s over three runs (vitest "setup" 6.1-6.3 s summed across files).

## After

- Frontend: 154 files, 1666 tests, 0 failed. The sorted name list is identical to the baseline (`diff` of the two lists printed nothing). Full-suite wall time about 15.2 s (the saving sits in the node files).
- The same 51 node-environment files: 617 tests passed; wall time 3.37, 3.39, 3.41 s over three runs (vitest "setup" 0.74-0.91 s summed). After is lower (about 4.6 s to 3.4 s).
- `npm --workspace apps/frontend run typecheck`, `npm run lint`, `npm run format:check` exit 0. `npm run test:scripts`: 1061 passed (same as the base).
- `git diff --name-only origin/main` lists no confined test file (grep for QuickLookupApp, ZoneCollectionStep, ZoneCardPicker, TradeSide, TradeBalancer, cardMetadataStore, cardMetadataSharing, FeaturePortalMenu, SheetShell, AdaptiveContextDialog, useOutsideDismiss, ConversationHistoryDrawer, CardPresentation, PrintingPicker printed nothing).

## What changed

- T-03: `src/test/setup.ts` skips the DOM-only work (jest-dom, `cleanup`, portal preload, the `scrollIntoView` shim, `resetBackgroundDownloadForTests`) when there is no `document`, and loads `destinationRegistry` by dynamic import inside that guard.
- T-04: ten copies of `createMemoryStorage` are gone (one shared copy in `src/test/memoryStorage.ts`, re-exported from `appTestHelpers.tsx`; it is a separate dependency-free file so node-environment tests do not load Testing Library). Two copies of `jsonResponse`, four of `selectDestination`, two of `openHistory`, three of `cssBlock`, and the repeated `appCss` / `flowCss` / `shellCss` reads now import from `appTestHelpers.tsx`, which gained `cssBlock`, `selectDestination` and `openHistory`. `codeOnly()` for the two script tests lives in `scripts/lib/shell-source.mjs`.

## Dated observations (manual criteria)

2026-10-18 B3 — the shared `cssBlock` in `appTestHelpers.tsx` has the same body, character for character, as the copies it replaced in `reduced-motion.test.ts`, `motion-foundation.test.ts` and `ambient-accent-foundation.test.ts` (all three read `src/index.css` and used the same brace-depth loop); every assertion in those files is untouched and the three files pass with unchanged test names.

2026-10-18 B6 — the 51 node-environment files: 617 tests green; wall time 4.5-4.7 s before, 3.37-3.41 s after. After is lower.

## Findings not applied (recorded in the slice doc under Reverted findings)

- `queueAskAiResponses` in `App.answered-state.test.tsx` and `App.theming.test.tsx`: the local function only sets a queue variable that belongs to that file's own fetch mock. The harness version sets the harness's private queue, so importing it would mean moving both files onto the whole harness, which changes what they test. Left as is.
- `selectDestination` in `App.mtg-color-themes.test.tsx` opens the Menu through its own `openPortalMenu` (which skips the click when the menu is already open), so it is not the shared helper. Left as is.
- `jsonResponse` in `lib/trade/fetchCardPrintings.test.ts` returns a plain object, not a `Response`. Left as is.
- Confined files (QuickLookupApp, TradeBalancer, TradeSide, CardPresentation, SheetShell, AdaptiveContextDialog tests) keep their copies.
