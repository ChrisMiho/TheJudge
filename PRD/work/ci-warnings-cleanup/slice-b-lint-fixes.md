# Slice B — Lint fixes

## Status: planned

## Goal

Clear all 19 lint warnings (0 errors, 0 warnings from `npm run lint`) with no change a player can see.

## Requirements

All paths are under `apps/frontend/src/` unless noted. Each move relocates declarations without changing their bodies; only `import`/`export` lines and file locations change. One commit per file group so a review can follow each move. New file names follow the local convention (PascalCase for a component file, camelCase otherwise); a name may be adjusted, the split may not. Each `createContext` call stays a single call in one module.

1. Fast-refresh splits (15 warnings in 9 files):
   - `lib/feedback/FeedbackContextProvider.tsx`: move `FeedbackSeamContext`, its default seam and type, `useRegisterFeedbackContributor`, `useFeedbackContextReader` to `lib/feedback/feedbackSeam.ts`; update `MtgAssistantApp.tsx`, `App.tsx`, `FeedbackContextProvider.test.tsx`; the provider imports the context.
   - `components/SheetShell.tsx`: move `SheetCloseContext`, `useSheetClose` to `components/sheetCloseContext.ts`; update `life-tracker/GameSetupPanel.tsx`; `SheetShell.tsx` imports the context.
   - `components/FrozenGameContextDetails.tsx`: move `getFrozenGameContextTriggerLabel` and its private helpers to `components/frozenGameContextTriggerLabel.ts`; update `EnrichmentStep.tsx`, `FrozenGameContextDetails.test.tsx`.
   - `components/AmbientScene.tsx`: move `shouldFallbackToStatic` and its `PROBE_*` constants to `components/ambientSceneFallback.ts`; update `AmbientScene.test.tsx`; `AmbientScene.tsx` imports it.
   - `lib/portal/brandTapContext.tsx`: move `BrandTapProvider` to `lib/portal/BrandTapProvider.tsx` (the context gets exported); update `App.tsx`.
   - `lib/portal/leftEdgeDrawerContext.tsx`: move `LeftEdgeDrawerProvider` to `lib/portal/LeftEdgeDrawerProvider.tsx`; update `App.tsx`, `portal/FeaturePortalMenu.test.tsx`.
   - `lib/portal/seedContext.tsx`: move `AssistantSeedProvider` to `lib/portal/AssistantSeedProvider.tsx`; update `App.tsx`, `lib/portal/seedContext.test.tsx`.
   - `components/portal/destinationRegistry.tsx`: nothing moves; delete the four local aliases (lines 64-67) and use `<quickLookup.Component .../>` etc. directly in the `render` entries.
   - `test/enrichmentStep.tsx` (test helper): move `StatefulEnrichmentHarness` to `test/StatefulEnrichmentHarness.tsx`; move shared fixtures (`card`, `card1`, `card2`, `singlePlayerGameContext`, `twoPlayerGameContext`) to `test/enrichmentFixtures.ts`, re-exported from `enrichmentStep.tsx` so the three `EnrichmentStep*.test.tsx` files keep their imports.
2. Scroll-to-latest warning in `components/ConversationThread.tsx` (line 173): keep the effect's dependency list exactly `[messages.length]`; add `const scrollToLatestRef = useRef(scrollToLatest); scrollToLatestRef.current = scrollToLatest;` right after the declaration; call `scrollToLatestRef.current(container)` at the effect's three call sites. `handleNewResponse` keeps calling `scrollToLatest` directly. Do not use a dependency-list addition, `useCallback`, `useEffectEvent`, or a disable comment.
3. Delete the three unused `eslint-disable` comments (comment-only edits): `components/portal/ThemeSection.tsx:102`, `components/trade/TradeBalancer.tsx:407` (both `react-hooks/exhaustive-deps`), and `apps/backend/src/eval/contextEvaluationHarness.test.ts:326` (`no-console`).
4. No test assertion is edited; only import paths in test files change. No change to `eslint.config.mjs`.
5. Dependencies: none. Parallel-ready with slice A.

## Acceptance criteria

- [ ] B1. `npm run lint` on the work branch prints no problems (0 errors, 0 warnings).
- [ ] B2. Each of the nine fast-refresh files is split as listed in Requirement 1 and the new files exist.
- [ ] B3. Each `createContext` call appears exactly once in the codebase for the moved contexts (feedback seam, sheet close, brand tap, left-edge drawer, assistant seed); provider and hook share that one object.
- [ ] B4. `ConversationThread.tsx` keeps the layout effect's dependency list exactly `[messages.length]` and calls `scrollToLatestRef.current(...)` at all three former call sites.
- [ ] B5. The three unused `eslint-disable` comments are gone.
- [ ] B6. `npm run typecheck` passes.
- [ ] B7. `ConversationThread.test.tsx` and the provider-plus-hook tests (`seedContext.test.tsx`, `FeaturePortalMenu.test.tsx`, `FeedbackContextProvider.test.tsx`, `SheetShell.test.tsx`, `GameSetupPanel.test.tsx`) pass.
- [ ] B8. `npm run quality:check` passes locally.
- [ ] B9. No test assertion is edited: the diff of test files shows only import-path changes (reviewer reads the diff).
- [ ] B10. `eslint.config.mjs` is unchanged.

## Verification

```bash
npm run lint
npm run typecheck
npm run test --workspace apps/frontend -- ConversationThread seedContext FeaturePortalMenu FeedbackContextProvider SheetShell GameSetupPanel
npm run quality:check
git diff origin/main --stat -- eslint.config.mjs
git diff origin/main -- '*.test.ts' '*.test.tsx'
```

## Files touched

- `apps/frontend/src/lib/feedback/FeedbackContextProvider.tsx`, new `lib/feedback/feedbackSeam.ts`
- `apps/frontend/src/components/SheetShell.tsx`, new `components/sheetCloseContext.ts`
- `apps/frontend/src/components/FrozenGameContextDetails.tsx`, new `components/frozenGameContextTriggerLabel.ts`
- `apps/frontend/src/components/AmbientScene.tsx`, new `components/ambientSceneFallback.ts`
- `apps/frontend/src/lib/portal/brandTapContext.tsx`, `leftEdgeDrawerContext.tsx`, `seedContext.tsx`, new `BrandTapProvider.tsx`, `LeftEdgeDrawerProvider.tsx`, `AssistantSeedProvider.tsx`
- `apps/frontend/src/components/portal/destinationRegistry.tsx`
- `apps/frontend/src/test/enrichmentStep.tsx`, new `test/StatefulEnrichmentHarness.tsx`, `test/enrichmentFixtures.ts`
- Importers: `MtgAssistantApp.tsx`, `App.tsx`, `life-tracker/GameSetupPanel.tsx`, `EnrichmentStep.tsx`, and the test files named above
- `apps/frontend/src/components/ConversationThread.tsx`
- `apps/frontend/src/components/portal/ThemeSection.tsx`, `components/trade/TradeBalancer.tsx`
- `apps/backend/src/eval/contextEvaluationHarness.test.ts`

## PRD promotion checklist

No `PRD/sections/` truth changes. Nothing to promote; cleanup confirms this and deletes the folder.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/ci-warnings-cleanup/` ready to delete
