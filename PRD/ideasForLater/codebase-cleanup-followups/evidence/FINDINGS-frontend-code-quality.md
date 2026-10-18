# Findings — frontend code quality (2026-10-18)

## Summary in plain words

The frontend is in decent line-level shape. TypeScript compiles clean, there is almost no `any` outside the ported ambient-scene renderer, and every swallowed error carries a reason. The real problems are leftovers. When a feature moved (Question History into the Menu, Back buttons into the header, live scan hints, the In-Depth "Answer" plate), its old wiring stayed behind as props, return values and branches that nothing reads. That dead wiring now crosses about 15 files.

The second pattern is the two question tools. Each one hand-writes the same draft-saving, history-saving and submit/retry plumbing.

There are also three things a player can hit, listed under behavior changes. The most important: In-Depth's scanner silently refuses a duplicate Stack card, which the PRD says must show a message.

## Findings — ranked

### Q-01 — The Question History "trigger" is still wired through eight files, but nothing reads it
- Evidence:
  - The type is `components/ConversationWorkspace.tsx:13-15`.
  - It is threaded through:
    - `StagedStepHeader.tsx:7,16,34,44`
    - `portal/PortalSlot.tsx:2,10,27-32,39`
    - `lib/portal/slotContext.tsx:2,7`
    - `ZoneConfirmStep.tsx:20,32,37`
    - `ZoneCollectionStep.tsx:39,68,279,313`
    - `EnrichmentStep.tsx:64,93,659,741`
  - `FeaturePortalMenu.tsx:21-24,163-170` stores `getHistoryTrigger` per slot and never calls it. Only `.node` is read (`:183,186`). Its own comment at `:279-284` says the Menu "no longer depends on … a history trigger".
  - No production caller ever passes `historyTrigger`.
- Why it is poor: about 30 lines of props, a ref and a context field exist only for tests. They also cause a `lib → components` import (`slotContext.tsx:2`).
- Behavior-preserving fix: delete the prop, the type, `getHistoryTrigger` in `SlotEntry` and `registerSlot`, and the ref in `PortalSlot`.
- Size: M
- Proof of no change: the App tests that open the Menu and Question History. Three tests that only exercise this seam need deleting: `StagedStepHeader.test.tsx:30`, `PortalSlot.test.tsx:29`, and the `historyOnOpen` variants in `FeaturePortalMenu.test.tsx:276,310,390`.
- Overlap: GRAPH-BRIEF-popups (`FeaturePortalMenu.tsx`), GRAPH-BRIEF-card-search (`ZoneCollectionStep.tsx`). Run after both.

### Q-02 — The scanner hook returns eight values no screen reads, and resets dead state on every frame
- Evidence: `hooks/useScanCapture.ts` returns these with no production reader (only tests and the mock in `ZoneCollectionStep.test.tsx:41-62`):
  - `cameraStatus`
  - `resolvedCandidates`
  - `lockedCandidate`
  - `scanPhase`
  - `scanAcquisitionDiagnostic`
  - `blockedNotice`
  - `rescan` (`:329`)
  - `acceptCandidate` (`:558`)

  Three of them are state that is only ever reset:
  - `resolvedCandidates` is only set to `[]` (`:274,367,515`).
  - `lockedCandidate` is only set to `null` (`:275`).
  - `scanPhase` is only set to `"searching"` (`:276`).

  The fresh `[]` at `:367/:515` re-renders the host on each identified frame.
- Why it is poor: about 60 lines of state whose names suggest features that are gone. The comments at `:132` and `:305` promise that `blockedNotice` surfaces a message, and nothing renders it (see behavior changes).
- Behavior-preserving fix: drop the dead state and returns. Keep `blockedNotice` only if the owner wants the message shown, which is a behavior change.
- Size: S
- Proof of no change: `hooks/useScanCapture.test.ts` and the three hosts' scan tests. The hook tests that assert the dead fields need trimming.
- Overlap: none. The scanner cluster shipped in #320.

### Q-03 — Draft saving and history mailboxes are hand-written twice, once per question tool
- Evidence: the same four effects appear in both tools.
  - In-Depth (`MtgAssistantApp.tsx`):
    - mount hydrate: `:285-288`
    - Menu-leave edge: `:398-405`
    - first-pass-skip sync: `:407-433`
    - history mailbox: `:807-839`
  - Quick Question (`QuickLookupApp.tsx`):
    - mount hydrate: `:165-168`
    - Menu-leave edge: `:228-235`
    - first-pass-skip sync: `:237-252`
    - history mailbox: `:176-200`
  - The same `eslint-disable` sentences are copied word for word: `:838` matches `:199`, and `:404` matches `:234`.
  - The `onConversationUpdated` history save is also copied (`MtgAssistantApp.tsx:333-350`, `QuickLookupApp.tsx:136-153`). It re-reads, parses and sorts the whole history just to find `createdAt`.
  - In-Depth also keeps two separate refs for the same `isActive` edge (`:255-261`, `:263/398-405`).
- Why it is poor: the comment at `:353-357` warns that copies drift, and this is the same drift one level up.
- Behavior-preserving fix:
  - Write one `useMidFlightDraft(mode, { hasStaging, snapshot, hydrate, isActive, isConversationActive })` hook, plus `useHistoryMailbox(mode, handlers)`.
  - Write one `saveConversationSnapshot(mode, flowLabel, snapshot)` in `persistence.ts` that keeps `createdAt` itself.
  - Merge In-Depth's two edge effects into one.
- Size: M
- Proof of no change: `App.mid-flight-draft.test.tsx`, `App.interaction-flows.test.tsx`, `ConversationHistoryDrawer.test.tsx`, `lib/conversationHistory/persistence.test.ts`.
- Overlap: GRAPH-BRIEF-card-search edits both files (the card-list hook and index lift). Run after it.

### Q-04 — In-Depth's "Answer" plate can never show
- Evidence:
  - `EnrichmentStep.tsx:875-879` renders `answer` only on the non-conversation branch.
  - But `answer` is set in the same update as a non-empty `visibleMessages` (`useAskAiSubmitOrchestration.ts:162,178`). That makes `isConversationActive` true, so the early return at `EnrichmentStep.tsx:652` always wins.
  - So `hasAnswer` (`:625`) is always false there, and `!hasAnswer` in `:629` is always true.
  - The hook's `answer` state (`:90,162,360,372,376`) feeds only this plate. Quick Question never reads it.
  - Same shape: in both pre-submit composers, `ComposerPill` sits in the `isSubmitting ? <Waiting/> : …` else-branch, so `isSubmitting`/`pendingLabel` are always false or unused there (`EnrichmentStep.tsx:922-924`, `QuickLookupApp.tsx:692-693`).
- Why it is poor: a reader thinks there are two answer views.
- Behavior-preserving fix: delete the plate, the `answer` prop and the hook state. Drop the always-false props at the two call sites.
- Size: S
- Proof of no change: `App.answered-state.test.tsx`. No test renders the plate (grep finds none).
- Overlap: GRAPH-BRIEF-card-search touches `QuickLookupApp.tsx` (search pop, not the composer).

### Q-05 — Card lookups scan all 34,639 cards while a cached lookup already exists
- Evidence:
  - `QuickLookupApp.tsx:495`: `cardMetadata.find(...)` once per chat-card thumbnail, on every render of the answered screen.
  - `TradeBalancer.tsx:295`: once per add, and a scan commit adds several cards in one tick.
  - The WeakMap-cached `metadataLookupFor` (`lib/scan/resolveScanCandidates.ts:26-37`, from the D-04 fix) is labelled "@internal exported for tests".
- Why it is poor: an avoidable full-list scan in render, when the general helper sits hidden in `lib/scan`.
- Behavior-preserving fix: move it to `lib/cardMetadataStore.ts` (e.g. `cardLookupFor(cards)`) and use it at all three sites.
- Size: S
- Proof of no change: `QuickLookupApp.test.tsx`, `TradeBalancer.test.tsx`, `TradeBalancer.scan.test.tsx`, `resolveScanCandidates.test.ts`.
- Overlap: GRAPH-BRIEF-card-search (both files; it adds `useCardMetadata` next to `cardMetadataStore.ts`). Fold it into that run.

### Q-06 — In-Depth builds the "Decrypt" request twice; Quick Question already has one path
- Evidence:
  - `MtgAssistantApp.tsx:715-740` and `:742-761` repeat the guard, the payload build, `stackSize` and the `submitAttempt` call.
  - `QuickLookupApp.tsx:382-392` `submitLookup(source)` is the one-path model.
  - `handleFollowUp` (`:763-765`) is a pure pass-through.
- Why it is poor: a change to the request shape must be made twice.
- Behavior-preserving fix: one `submitDecrypt(source)`. Keep today's difference: Retry returns silently when there is no `gameContext`, while Decrypt flashes "Confirm game context before decrypting." Pass `submitFollowUp` directly.
- Size: S
- Proof of no change: `App.interaction-flows.submission.test.tsx`, `App.answered-state.test.tsx`.
- Overlap: GRAPH-BRIEF-card-search edits `MtgAssistantApp.tsx` in a different region.

### Q-07 — Three In-Depth steps take an `onBack` they never call
- Evidence:
  - The props are declared as "Kept in the prop contract so the caller's wiring is unchanged" (`ZoneConfirmStep.tsx:13-17`, `ZoneCollectionStep.tsx:31-34`, `EnrichmentStep.tsx:43-46`).
  - None of the three destructures it.
  - `MtgAssistantApp.tsx` builds three closures for them (`:1079-1084, 1105-1110, 1133-1138`).
- Why it is poor: dead props with a comment defending them.
- Behavior-preserving fix: delete the prop and the three closures.
- Size: S
- Proof of no change: step tests. The test props in `ZoneConfirmStep.test.tsx`, `ZoneCollectionStep.test.tsx`, `test/enrichmentStep.tsx:31` and `test/StatefulEnrichmentHarness.tsx` need dropping.
- Overlap: GRAPH-BRIEF-card-search (`ZoneCollectionStep.tsx`).

### Q-08 — The Context step fakes a form event with a double cast
- Evidence:
  - `EnrichmentStep.tsx:643`: `onDecryptStack({ preventDefault: () => undefined } as unknown as FormEvent)`.
  - The prop is typed `(event: FormEvent)` (`:42`), but the only caller is the composer's submit.
  - `MtgAssistantApp.tsx:715-716` only calls `event.preventDefault()`.
- Why it is poor: a type lie that hides a no-op.
- Behavior-preserving fix: type the prop `() => Promise<void>` and drop `preventDefault`.
- Size: S
- Proof of no change: `App.interaction-flows.submission.test.tsx`.
- Overlap: none.

### Q-09 — Card-limit messages and the zone owner rule are written more than once
- Evidence:
  - `QuickLookupApp.tsx:280-292` and `:338-354` repeat both rules and both strings ("…is already attached to this question." at `:282/343`; the 5-card cap sentence at `:287/348`).
  - "Build the zone card, set owner unless Stack" appears three times: `ZoneCollectionStep.tsx:134-139` and `:169-173`, and `MtgAssistantApp.tsx:662-665`.
- Why it is poor: the player-facing copy and the rule can drift between the scan path and the search path.
- Behavior-preserving fix:
  - `checkLookupCardAdd(card, staged, held)` returning `{ok} | {message}`.
  - `buildZoneCardFromMetadata(card, { scanImageUrl, owner, zone })` in `lib/zoneCards.ts`.
- Size: S
- Proof of no change: `QuickLookupApp.test.tsx`, `MtgAssistantApp.carry-placement.test.tsx`, `lib/zoneCards.test.ts`.
- Overlap: GRAPH-BRIEF-card-search (`QuickLookupApp.tsx`, `ZoneCollectionStep.tsx`).

### Q-10 — Imports point the wrong way, and one import cycle
- Evidence:
  - `lib/conversationHistory/persistence.ts:12` imports `FrozenAskAiContext` from a hook.
  - `hooks/useScanCapture.ts:24` imports `ScanCameraStatus` from a component. madge confirms the cycle `ScanCameraSurface → ScanDebugOverlay → useScanCapture`.
  - `components/trade/oracleSearch.ts` (pure ranking) and `components/trade/useTradeScan.ts` (a hook) live in `components/`, although `lib/trade/` and `hooks/` exist.
  - `lib/lifeTracker/useLifeTracker.ts` is a hook living in `lib/`.
- Why it is poor: lib should not depend on UI, and type-only cycles turn real on the next value import.
- Behavior-preserving fix:
  - Move `ScanCameraStatus` to `lib/scan/types.ts`.
  - Move `FrozenAskAiContext` to `types.ts` or `lib/contextFlow`.
  - Move `oracleSearch.ts` to `lib/trade/` and the two hooks to `hooks/`.
- Size: S
- Proof of no change: `npx tsc --noEmit -p apps/frontend` plus the existing suites.
- Overlap: GRAPH-BRIEF-card-search reads `oracleSearch.ts` through `TradeSide.tsx`. Move it after that run.

### Q-11 — Trade's scanner keeps its own copy of the scan map, and the scan hook caches twice
- Evidence:
  - `useTradeScan.ts:74,121-129` calls `loadScanMap()` again into a ref, only to resolve the scanned printing (`:83-84`). The shared `loadScanResources()` already returns `scanMap` (`loadScanResources.ts:6-9`).
  - `useScanCapture.ts:239-268` caches a per-hook promise on top of the module cache (`loadScanResources.ts:11-31`).
  - The second dependency branch (`:115-121`) exists only for tests.
- Why it is poor: two caches and a side channel for one file. These are leftovers of #320.
- Behavior-preserving fix: have `useScanCapture` resolve `scannedPrintingId` (it holds `scanMap` and the candidates) into `HeldScanEntry`. Drop the side channel and the per-hook promise.
- Size: M
- Proof of no change: `TradeBalancer.scan.test.tsx`, `useScanCapture.test.ts`, `loadScanResources.test.ts`. The tests that use the split loaders need adjusting.
- Overlap: none.

### Q-12 — Dead exports and leftover knobs (new instances; U-12/U-11/D-13 already cover others)
- Evidence:
  - `lib/scan/tuning.ts:32-35`: `SURFACE_DISTANCE` and `MAX_SURFACED_CANDIDATES` have zero references anywhere in the repo. They describe live "possible match" hints that no longer exist.
  - `lib/lifeTracker/index.ts` is a barrel that nothing imports; every import goes deep.
  - `useAskAiSubmitOrchestration.ts:77,385` returns `hiddenInitialQuestion`, which nobody reads.
  - New instance of U-11: `useThemePalette.ts:59` returns `palette`; `App.tsx` never reads it.
  - New instance of D-13: `QuickLookupApp.tsx:89,398-401` has an `onSubmit` prop and branch used only by tests (`cardMetadataSharing.test.tsx:59`, `QuickLookupApp.test.tsx:429,488`).
- Why it is poor: dead surface misleads readers.
- Behavior-preserving fix: delete them. For `onSubmit`, assert on the fetch instead.
- Size: S
- Proof of no change: `tsc` plus the full suite. The `onSubmit` tests need rewriting.
- Overlap: GRAPH-BRIEF-card-search (`QuickLookupApp.tsx`) for the last item only.

### Q-13 — A comment in App.tsx says a code path is unreachable, but Question History reaches it
- Evidence:
  - `App.tsx:51-56` says the "Life Tracker → `mtg-assistant`" seed branch "is not reachable from the Menu today".
  - But `FeaturePortalMenu.tsx:103-106` (resume an In-Depth history entry) and `:134-138` (resume the In-Depth draft) both call `onSelect("mtg-assistant")`, which runs that branch (`App.tsx:57-62`).
- Why it is poor: the comment steers the next person to delete live code.
- Behavior-preserving fix: correct the comment. Whether the seed should fire here is listed under behavior changes.
- Size: S
- Proof of no change: comment only.
- Overlap: none.

### Q-14 — The "remember the download, forget it on failure" loader is written five times
- Evidence:
  - `lib/scan/loadScanMap.ts:7-25`
  - `lib/scan/loadHashDb.ts:8-28`
  - `lib/scan/loadScanResources.ts:11-31`
  - `lib/cardMetadataStore.ts:12-34`
  - `portal/destinationRegistry.tsx:19-32` (without the `=== attempt` guard)
  - plus `useScanCapture.ts:239-268`
- Why it is poor: the REQ-249 retry rule lives in five hand copies. D-07 covers the per-card caches, not these.
- Behavior-preserving fix: one `memoizeRetryable(load)` in `lib/`.
- Size: S
- Proof of no change: `loadScanMap.test.ts`, `loadHashDb.test.ts`, `loadScanResources.test.ts`, `cardMetadataSharing.test.tsx`, the destinationRegistry tests.
- Overlap: GRAPH-BRIEF-card-search adds a hook next to `cardMetadataStore.ts`. Order them.

### Q-15 — "Latest value" and "previous value" refs are hand-rolled about 25 times
- Evidence:
  - Latest-ref written during render:
    - `ScanCameraSurface.tsx:173,175,180,186,203,205`
    - `useScanCapture.ts:186,196,198`
    - `TradeBalancer.tsx:137,139`
    - `useTradeScan.ts:76`
    - `PortalSlot.tsx:30`
    - `ConversationThread.tsx:138`
    - `useOutsideDismiss.ts:37`
    - `useDictation.ts:84`
    - `feedbackSeam.ts:38`
    - `FeedbackContextProvider.tsx:33-34`
    - `QuickLookupApp.tsx:368`
  - Previous-value:
    - `CardHero.tsx:31`
    - `CardPresentation.tsx:299`
    - `AskAiWaitingPanel.tsx:32`
    - `CardStage.tsx:34`
    - `MtgAssistantApp.tsx:260,400`
    - `QuickLookupApp.tsx:230`
  - The react-hooks v7 `refs` rule flags 19 of them.
- Why it is poor: repeated idiom, with no single place to document or lint-exempt it.
- Behavior-preserving fix: add `useLatestRef(value)` and `usePrevious(value)` in `hooks/`.
- Size: M
- Proof of no change: the existing suites. These refs are read only in callbacks and effects.
- Overlap: GRAPH-BRIEF-card-rings (`CardPresentation.tsx`), GRAPH-BRIEF-card-search (`QuickLookupApp.tsx`, `TradeBalancer.tsx`). Do it last.

### Q-16 — Node-only build tools live in the browser source tree
- Evidence:
  - `lib/scan/hashLibBuild.ts` (412 lines, `node:fs`/`node:path`) is used only by `scripts/build-card-hashes.mjs:29`, `scripts/build-card-scan-map.mjs:5` and tests.
  - `lib/scan/detectorFixtures.ts` (`node:fs`, `pngjs`) is used by tests only.
  - `encodeRawImageFixture` (`lib/scan/rawImageFixture.ts:11`) is used only by `scripts/build-scan-vectors.mjs:21`.
  - Tests for flat `lib/scan/*.ts` sit in sub-folders (`acquisition/`, `detection/`, `identification/`, `persistence/`) importing `../X`. Everywhere else in `src/` tests sit beside their source file.
- Why it is poor: Node code sits beside browser code (tree-shaking hides it). The test layout differs from the rest of the repo.
- Behavior-preserving fix: move the Node modules to `src/lib/scan/build/` (or `scripts/lib/`) and update the three script imports. Optionally put tests beside their sources.
- Size: M
- Proof of no change: `npm run build -w apps/frontend` output identical; the scan tests and `test:scripts` pass.
- Overlap: none.

### Q-17 — About 45 code comments cite work-package docs that have been deleted
- Evidence: comments like "Look-matching pass (slice N, review 1 fix — finding 3)" and "see slice-p.evidence.md". Counts by file:
  - `QuickLookupApp.tsx`: 12
  - `EnrichmentStep.tsx`: 5
  - `ConfirmSheet.tsx`: 4
  - `TradeBalancer.tsx`: 3
  - `ZoneCollectionStep.tsx`: 3
  - `CardPresentation.tsx`: 3
  - about 12 more files with 1–2 each

  `PRD/work/` now holds only `STATUS.md` and this probe.
- Why it is poor: the pointers lead nowhere. The REQ ids beside them are the durable reference.
- Behavior-preserving fix: rewrite each comment to its REQ/DEC or drop the slice tag.
- Size: M
- Proof of no change: comments only.
- Overlap: card-search (QuickLookupApp, ZoneCollectionStep, TradeBalancer), card-rings (CardPresentation), popups (AdaptiveContextDialog). Do after those runs.

### Q-18 — No formatter covers TypeScript, and the config disagrees with the code
- Evidence:
  - `format`/`format:check` (`package.json:24-25`) only touch json/yml.
  - `.prettierrc.json` sets `"semi": false`, but 155 of 163 frontend source files use semicolons.
  - Eight files follow the config: `ScanCameraSurface.tsx`, `ScanCardOutline.tsx`, `ScanDebugOverlay.tsx`, `SheetShell.tsx`, `lib/contextFlow/flow.ts`, `lib/scan/detector.ts`, `lib/scan/detectorFixtures.ts`, `test/detectorImageHelpers.ts`.
- Why it is poor: style drifts by author, and the config misleads.
- Behavior-preserving fix: set `semi: true` and add ts/tsx to prettier in one mechanical PR, or at least fix the config.
- Size: M (large but mechanical diff)
- Proof of no change: `tsc`, lint and tests; formatting only.
- Overlap: touches every brief's files. Land when no run is open.

### Q-19 — Small helpers re-written inline
- Evidence:
  - The same random-id-with-fallback function exists three times: `lib/debugLogger.ts:5-11`, `lib/zoneCards.ts:9-15`, `useAskAiSubmitOrchestration.ts:53-59`.
  - Plural wording is hand-built about 12 times, e.g. `EnrichmentStep.tsx:791,845,895`, `TradeBalancer.tsx:373,571`, `MtgAssistantApp.tsx:877`, `PlayerRosterEditor.tsx:87`.
  - `apiBaseUrl` is passed into `useAskAiSubmitOrchestration` by both callers (`MtgAssistantApp.tsx:331`, `QuickLookupApp.tsx:134`) from the same import. This is a new instance of D-08.
- Why it is poor: minor repetition.
- Behavior-preserving fix: `randomId(prefix)` (same prefixes, so the output is unchanged) and `countLabel(n, singular, plural)`. The hook imports `apiBaseUrl` itself.
- Size: S
- Proof of no change: the existing suites assert this copy text.
- Overlap: none material.

## Behavior changes (out of scope)

- **In-Depth scanner refuses a duplicate Stack card with no message.**
  - `ZoneCollectionStep.tsx:130-141` returns the message.
  - `useScanCapture.ts:499` stores it in `blockedNotice`, and nothing renders it. No thumbs-up or ding plays either.
  - PRD `scan/README.md:140-143` says a blocked re-scan "surfaces its message immediately rather than silently failing".
  - Quick Question shows its own message, so only In-Depth is affected. This is from code reading; check it in the browser.
- **Feedback sent from any tool includes the hidden In-Depth flow** once In-Depth has been visited. `MtgAssistantApp.tsx:441` is the only contributor, it stays mounted, and `feedbackSeam.ts:30-33` says "last registration wins".
- **Resuming an In-Depth history entry or draft while on Life Tracker queues a roster seed from the tracker** (`App.tsx:57-62` through `FeaturePortalMenu.tsx:105,137`). Decide whether that is wanted.
- Unifying Retry and Decrypt messages in Q-06 (Retry is silent today when no game context exists) would be visible.

## Healthy — don't fix

- **TypeScript compiles clean** (`npx tsc --noEmit -p apps/frontend`). Outside AmbientScene there is one `any`: the documented `React.ComponentType<any>` in `destinationRegistry.tsx:7`.
- **AmbientScene's 44 `any`** sit behind a file-level disable. It is a ported mockup canvas (a REQ-216 exemption); typing it buys nothing.
- **The ~20 non-null `!` marks** are all on bounds-checked index reads. Without `noUncheckedIndexedAccess` they do nothing. Turning that flag on gives 362 production errors, which is not worth it.
- **`as` casts** are the normal kinds: select values, JSON boundaries, and the documented lazy-module trick in `destinationRegistry.tsx`.
- **Every swallowed `catch`** states why: price chip, warm-up ping, storage, camera focus mode. This is a consistent "never block the player" rule.
- **The `exhaustive-deps` disables** in the two question tools and `useOutsideDismiss` are deliberate edge-trigger effects with written reasons.
- **Trade's `entriesRef` written during render** is required for multi-add in one tick (REQ-215), and the code says so.
- **`AssistantSeedProvider`'s ref mailboxes**, consumed every render, are deliberate and documented.
- **Scanner fixes from #320 are in place:**
  - Loaders retry after a failure with an attempt guard (`loadScanMap.ts`, `loadHashDb.ts`, `loadScanResources.ts`).
  - One identifier is shared by every scanner.
  - Top-N uses `selectSmallest` (`identify.ts:214,275`).
  - The card lookup is cached (`resolveScanCandidates.ts:26-37`).
  - All three hosts use one `ScanPanel`.
  - D-01, D-03, D-04 and U-02 are no longer open.

Note on tools: I ran `npx --yes madge` once to check for import cycles, which may have fetched the package from npm. Nothing else touched the network, and nothing in the repo was changed.
