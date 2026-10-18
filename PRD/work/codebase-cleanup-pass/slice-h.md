# Slice H — In-Depth's question flow loses dead wiring

## Status: planned

Depends on: none. Findings: Q-04, Q-06, Q-08, Q-12 (hook part), Q-13, Q-19 (id part), Q-17 (these files only).

## Goal

In-Depth's question flow loses the Answer plate that never shows, a double Decrypt path and a faked form event. Every screen, message and request is the same.

## Requirements

1. Record the base: frontend test count and `npm --workspace apps/frontend run typecheck` exit 0.
2. **Q-04.** The In-Depth "Answer" plate can never show: `answer` is set in the same update as a non-empty conversation (`useAskAiSubmitOrchestration.ts` about `:162, 178`), so the early return on `isConversationActive` always wins (`EnrichmentStep.tsx` about `:625-652`, plate about `:875-879`). Re-read to confirm. Delete the plate, the `answer` prop and the hook's `answer` state. In `EnrichmentStep`'s composer drop the always-false `isSubmitting` / `pendingLabel` (about `:922-924`). `QuickLookupApp`'s same props stay (card-search owns that file).
3. **Q-06.** `handleDecryptStack` and `handleRetry` repeat the payload build and `submitAttempt` call (`MtgAssistantApp.tsx` about `:715-761`). Share only that tail. Each handler keeps its own guards, in today's order, with today's messages: Decrypt flashes "Confirm game context before decrypting." while Retry returns silently with no game context. Pass `submitFollowUp` straight through in place of the `handleFollowUp` wrapper.
4. **Q-08.** `EnrichmentStep.tsx` about `:643` fakes a form event with a double cast. Type `onDecryptStack` as `() => Promise<void>` and drop `preventDefault`.
5. **Q-12 (hook part).** Stop returning `hiddenInitialQuestion` from the submit hook; the hook still uses it internally.
6. **Q-13.** Correct the comment at `App.tsx` about `:57-59` that calls the Life Tracker to In-Depth seed branch unreachable (Question History resume reaches it). Comment only.
7. **Q-19 (id part).** One `randomId(prefix)` for the three identical random-id-with-fallback functions (`lib/debugLogger.ts`, `lib/zoneCards.ts`, the submit hook), keeping the `corr-`, `inst-` and `conv-` prefixes exactly.
8. **Q-17 (these files only).** Rewrite comments that cite deleted work-package docs to their REQ, in files this slice edits that no pending brief owns.
9. **Confinement.** In `MtgAssistantApp.tsx` edit only the submit handlers (about `:713-766`), the props passed to `EnrichmentStep`, and an import made unused. Do not touch its card-list effect or search index. Do not edit `QuickLookupApp`, `ZoneCollectionStep`, `cardMetadataStore`.
10. Update tests only where they reference a removed prop or return; no assertion about visible behavior is weakened.

## Acceptance criteria

- [ ] H1. The Answer plate, the `answer` prop, the hook's `answer` state, and `EnrichmentStep`'s `isSubmitting` / `pendingLabel` are gone; `QuickLookupApp` is unchanged.
- [ ] H2. `handleDecryptStack` and `handleRetry` share only the payload-and-submit tail; each keeps its own guards, order and messages; `submitFollowUp` is passed straight through.
- [ ] H3. `onDecryptStack` is typed `() => Promise<void>` and no fake form event or double cast remains in `EnrichmentStep.tsx`.
- [ ] H4. The submit hook no longer returns `hiddenInitialQuestion`.
- [ ] H5. The `App.tsx` comment states that Question History resume reaches the seed branch.
- [ ] H6. One `randomId(prefix)` serves `lib/debugLogger.ts`, `lib/zoneCards.ts` and the submit hook with the same three prefixes.
- [ ] H7. `App.answered-state`, `App.interaction-flows.submission`, `App.interaction-flows`, the `EnrichmentStep` and submit-hook tests, `lib/zoneCards.test.ts` and the debug-logger tests pass (full frontend suite green, test count not lower than base except tests of removed dead props, each listed in the evidence log).
- [ ] H8. `npm --workspace apps/frontend run typecheck` exits 0.
- [ ] H9. `npm run lint` exits 0.
- [ ] H10. `git diff --name-only origin/main` lists none of `QuickLookupApp`, `ZoneCollectionStep`, `ZoneCardPicker`, `cardMetadataStore`.

## Verification

```bash
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
npm run lint
git diff --name-only origin/main
```

## Reverted findings

None yet.

## Files touched

- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts` (re-read the path)
- `apps/frontend/src/components/EnrichmentStep.tsx` (re-read the path)
- `apps/frontend/src/MtgAssistantApp.tsx` (submit handlers and props only)
- `apps/frontend/src/App.tsx` (comment only)
- `apps/frontend/src/lib/debugLogger.ts`, `apps/frontend/src/lib/zoneCards.ts`, one shared `randomId` module
- the tests that reference the removed props
