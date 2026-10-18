# Slice H evidence

## Baseline (tip after slice G, 2026-10-18)

- Frontend: 154 files, 1666 tests pass. `npm --workspace apps/frontend run typecheck` exits 0.

## Confirmed before editing (Q-04)

`answer` is set only in `doDecryptRequest`, in the same async block that sets `visibleMessages` to a two-message thread (a batched update), and cleared only by `startOver` and `restoreConversation`, which also reset the thread. So `EnrichmentStep`'s `hasAnswer` (`Boolean(answer)`) can only be true when `isConversationActive` is true, and the early return for the conversation view always wins. In the composer branch `isSubmitting` is always false too (the `isSubmitting ? <AskAiWaitingPanel/>` branch comes first). Re-read in the code, not taken from the brief.

## Changes

- Q-04: the "Answer" plate, the `answer` prop and `hasAnswer` are gone from `EnrichmentStep.tsx`; the hook's `answer` state, its two resets and its return are gone; `MtgAssistantApp` no longer reads or passes `answer`. The composer in `EnrichmentStep` no longer passes `isSubmitting` or `pendingLabel` and its `disabled` is `!canDecrypt`; for that, `pendingLabel` on the shared `ComposerPill` became optional (it is only read while `isSubmitting`). `QuickLookupApp` is untouched and still passes both.
- Q-06: `MtgAssistantApp.tsx` has one `submitCurrentQuestion(source, gameContext)` tail (payload build, stack size, fallback flag, `submitAttempt`). `handleDecryptStack` keeps its guard order and both messages ("Add at least one card by searching or scanning before decrypting." then "Confirm game context before decrypting."); `handleRetry` keeps `if (!canRetry || !gameContext) return;` first, silently, then the cards message. `submitFollowUp` is passed straight to `onFollowUp`; the `handleFollowUp` wrapper is gone.
- Q-08: `onDecryptStack` is `() => Promise<void>`; `handleDecryptStack` takes no event and no `preventDefault`; `EnrichmentStep` calls `void onDecryptStack()`; the `FormEvent` imports are gone from both files.
- Q-12 (hook part): the hook no longer returns `hiddenInitialQuestion` (it keeps the state internally); nothing outside tests read it.
- Q-13: the `App.tsx` comment now says Question History resume reaches that branch (REQ-213, `FeaturePortalMenu.handleResumeHistoryEntry` routes an In-depth entry through `onSelect`), and `handleCarryToInDepth` is the other live way in.
- Q-19 (id part): `lib/randomId.ts` has `randomId(prefix)`; `createCorrelationId` (`corr`), `createInstanceId` (`inst`) and the hook's conversation id (`conv`) use it. New `lib/randomId.test.ts` (3 tests) pins the UUID path and each prefix's fallback form.
- Q-17 (these files only): the work-package tags ("Look-matching pass (slice N ...)", "slice C", "REQ-174/Slice C") are dropped from the comments in `EnrichmentStep.tsx`, `App.tsx` and `lib/zoneCards.ts`, keeping each comment's explanation. `MtgAssistantApp.tsx` comments were left alone (card-search brief owns the file outside the submit handlers).

## Tests that referenced the removed pieces

- Removed: `useAskAiSubmitOrchestration > conversation history persistence hooks > returns hiddenInitialQuestion after a successful decrypt` (it only asserted the removed return; the next test, "fires onConversationUpdated once ...", already asserts `hiddenInitialQuestion` in the snapshot the hook sends).
- Changed to assert the same behaviour through what the player sees: two `expect(result.current.answer)` lines now assert `visibleMessages` holds the question and that answer; one `answer` expectation after `startOver` is dropped (`visibleMessages` is already asserted empty there); one `expect(...hiddenInitialQuestion)` after `restoreConversation` is dropped and that test's title no longer names it; `answer` is no longer passed in `EnrichmentStep.test.tsx`, `EnrichmentStep.ambient-accent.test.tsx` and the two harness files.

## After

- Frontend: 155 files, 1668 tests pass (1666 minus 1 removed test of a dead return, plus 3 new `randomId` tests). `npm --workspace apps/frontend run typecheck` exits 0; `npm run lint` exits 0.
- `git diff --name-only origin/main` lists none of `QuickLookupApp`, `ZoneCollectionStep`, `ZoneCardPicker`, `cardMetadataStore`.
- The criterion H2 evidence path in `slice-h.criteria.json` names `apps/frontend/src/MtgAssistantApp.tsx`; the file is at `apps/frontend/src/components/portal/MtgAssistantApp.tsx`.

## Reverted findings

None.
