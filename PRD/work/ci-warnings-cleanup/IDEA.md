# CI warnings cleanup

Problem: the latest Quality Check run on main shows a pile of warnings and notices. The owner saw 17. They are noise now, but two will turn into real breaks: GitHub is forcing the workflow's actions onto Node 24, and `ubuntu-latest` moves to Ubuntu 26 on 2026-10-19. The deploy job builds the arm64 Lambda bundle, so a runner change touches the path that ships to players.

Outcome: a Quality Check run with no deprecation warnings, no runner-migration notice, and a clean lint step, with the deploy job still producing a working bundle.

Non-goals: changing what any screen does or how it looks, and touching product rules. Which pins and fixes to use is for refinement and the owner, not this file.

## Evidence (investigated, no fix chosen)

- Workflow `.github/workflows/quality-check.yml`: `runs-on: ubuntu-latest` at lines 33, 64, 83, 125, 160, 227. Pins: `actions/checkout@v4`, `actions/setup-node@v4` (node 22; deploy job 24), `actions/upload-artifact@v4`, `actions/download-artifact@v4`, `aws-actions/configure-aws-credentials@v4`. All need to be checked against the Node 20 deprecation.
- Lint runs as `npm run lint` = `eslint .` (root `package.json`, config `eslint.config.mjs`). No `--max-warnings` anywhere, so warnings never fail CI. `react-hooks/exhaustive-deps` and `react-refresh/only-export-components` (allowConstantExport) are both set to `warn`.
- Local `npm run lint` on this branch: 0 errors, 19 warnings. The intake lists only 10 lint warnings, which is GitHub's per-step annotation cap, so CI very likely has the same 19. The intake's 17/18 count is a partial view.
- Extra local warnings not in the intake: `brandTapContext.tsx:34`, `leftEdgeDrawerContext.tsx:18,45`, `seedContext.tsx:73,151` (all under `apps/frontend/src/lib/portal/`), `apps/frontend/src/test/enrichmentStep.tsx:97`, and three unused `eslint-disable` directives: `apps/frontend/src/components/portal/ThemeSection.tsx:102`, `apps/frontend/src/components/trade/TradeBalancer.tsx:407`, `apps/backend/src/eval/contextEvaluationHarness.test.ts:326`.
- Fast-refresh flags are non-component exports sitting beside components: hooks `useRegisterFeedbackContributor` / `useFeedbackContextReader` in `lib/feedback/FeedbackContextProvider.tsx`; `useSheetClose` in `components/SheetShell.tsx`; `getFrozenGameContextTriggerLabel` in `components/FrozenGameContextDetails.tsx`; `shouldFallbackToStatic` in `components/AmbientScene.tsx`; four lines at `components/portal/destinationRegistry.tsx:64-67` inside the `lazyDestination` setup.
- Hook-deps flag: `components/ConversationThread.tsx:173`, the `useLayoutEffect` keyed on `[messages.length]` calls `scrollToLatest` (a plain function declared at line 98 in the component body).

## Prior run

- `PRD/instructions/receipts/ci-quality-check-runtime-2026-08-06.md`: earlier work on the same workflow file (CI runtime and sharding).
- `PRD/instructions/receipts/lambda-s3-deploy-2026-08-29.md`: reshaped the `deploy` job in `quality-check.yml`; it also records the `react-refresh/only-export-components` warnings as pre-existing and untouched (7 at the time).
- `PRD/instructions/receipts/small-fixes-cats-menu-white-2026-10-14.md`: added a new `react-refresh/only-export-components` warning at `brandTapContext.tsx:34`.
- `PRD/instructions/receipts/frontend-routing-and-code-splitting-2026-08-11.md`: touched `quality-check.yml` (kept 3 shards).
