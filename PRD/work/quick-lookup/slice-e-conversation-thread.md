# Slice E — Quick Lookup conversation thread and submit orchestration

## Status: done

## Goal

Wire Quick Lookup's submit path into a generalized `useAskAiSubmitOrchestration`
and the shipped conversation chrome, with the attached card (if any) frozen as
context, under the same conversation limits as the main flow (REQ-075 /
FLOW-011). Ship slice: includes the PRD promotion checklist and Ship gates.

## Requirements

1. Generalize `useAskAiSubmitOrchestration`
   (`apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`) rather than
   forking a parallel lookup hook (DEC-107's no-duplicated-implementations
   principle applies to this hook too — it is the single authoritative submit
   orchestrator):
   - Broaden the payload type it accepts to `ZoneAskAiPayload | LookupAskAiPayload`.
   - Replace the single `frozenGameContext: GameContext | null` state with a
     small discriminated frozen-context shape, e.g. `{ kind: "game"; gameContext:
     GameContext } | { kind: "lookup"; card: CardMetadataItem | null } | null`,
     so `isConversationActive` covers three cases: game mode (frozen
     `GameContext`), lookup with a card (frozen `card`), and lookup with no card
     (activation keyed on "has answered once," not a non-null frozen object).
   - `submitFollowUp` builds `conversationHistory` and the follow-up payload
     generically off the frozen-context discriminant instead of assuming
     `GameContext`.
   - `startOver` resets to `null` frozen context in all cases.
   - Existing game-mode call sites (`MtgAssistantApp.tsx`) continue to work
     unchanged — this is a type/shape generalization, not a behavior change for
     game mode.
2. Add `buildLookupAskAiRequest(question, card?, conversationHistory?)` next to
   `buildAskAiRequest` in `apps/frontend/src/lib/contextFlow/flow.ts` (or a
   `apps/frontend/src/lib/lookupFlow.ts` sibling if colocating in
   `contextFlow` — a game-context-specific module — reads oddly) and a
   `LookupAskAiPayload = { mode: "lookup"; question: string; card?: CardMetadataItem;
   conversationHistory?: ConversationMessage[] }` type. Card fields sent on the
   wire match Slice A's `lookupCardReferenceSchema` (strip any frontend-only
   fields like `instanceId`, mirroring `buildAskAiRequest`'s existing strip
   pattern).
3. Wire `QuickLookupApp` (Slice D's shell): on first submit, freeze the resolved
   card (if any) into the orchestrator's frozen-context state and call
   `submitAttempt` with a `LookupAskAiPayload`. On success, show the first
   assistant answer as the first visible thread bubble; the initial user
   question is included in `conversationHistory` sent to the API but never
   rendered as a visible bubble (REQ-075), exactly as game mode does.
4. Follow-ups reuse `ConversationThread`, the follow-up composer, and inline
   Send-button processing (REQ-028) unchanged; each follow-up sends `{ mode:
   "lookup", question, card: frozen (if any), conversationHistory }` under the
   same message-count and per-message/character limits as the main flow — no new
   limit constants.
5. Frozen-context summary: when a card was attached, render it via
   `CardSelectionPreview` (reused, not `FrozenContextSummary`, which is
   `GameContext`-specific); when no card, render no summary at all.
6. Start over (REQ-029) clears the thread and returns to the pre-ask state — the
   looked-up card preserved if one was attached, or the core-topics fallback
   (Slice D) visible if not.
7. Mock-provider follow-ups append to the same thread exactly as live responses
   do (existing `ConversationThread` behavior; no lookup-specific handling
   needed there).
8. PRD promotion (final slice — see workflow-reference.md's Work Folder
   Lifecycle): promote durable outcomes into `sections/decisions/lookup-suite.md`
   and `sections/decisions/providers-and-contract.md` (flip DEC-106/DEC-107/
   DEC-108 impact bullets from planned language to shipped reality where
   phrasing implied future tense), update the `system-map.md` entries for
   feature-portal's destination list and add/flip a Quick Lookup entry from
   `planned` to `shipped` per the system-map promotion gate (both product code
   wired in **and** a cleanup receipt written), and update
   `PRD/work/suite-build-order/README.md` if it still points at the old
   `card-lookup-qa` / `rules-lookup` slugs.

## Acceptance criteria

- [ ] Existing game-mode conversation flow (`MtgAssistantApp` end to end) is
      unaffected by the hook generalization — all existing
      `useAskAiSubmitOrchestration` tests pass unchanged.
- [ ] Submitting a question with no card attached: assistant-first bubble,
      hidden initial question in `conversationHistory`, no frozen-context
      summary shown.
- [ ] Submitting a question with a card attached: assistant-first bubble, the
      card shown as frozen context via `CardSelectionPreview`, follow-ups keep
      sending the same frozen `card` field.
- [ ] A follow-up sends `{ mode: "lookup", question, card?, conversationHistory }`
      with the full alternating history (existing message + the new user
      message), matching DEC-038 shape.
- [ ] Start over clears the thread; the card (if one was attached) is preserved
      and re-shown; with no card, the core-topics empty state (Slice D) is
      visible again.
- [ ] AI failure reuses the main flow's failure handling (FLOW-003): "Miho is
      working on it," preserved card/question, retry with cooldown.
- [ ] With `ASK_AI_PROVIDER=mock`, the assistant bubble's answer contains the
      exact assembled lookup-mode prompt for that submitted message (manual or
      fixture-driven check).
- [ ] Conversation message-count and character limits are identical to the main
      flow (shared constants, not a new lookup-specific cap).

## Verification

```bash
npm --workspace apps/frontend run test -- useAskAiSubmitOrchestration
npm --workspace apps/frontend run test -- QuickLookupApp
npm --workspace apps/frontend run typecheck
npm run quality:check
```

## Files touched

- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.test.ts`
- `apps/frontend/src/lib/contextFlow/flow.ts` (or new `apps/frontend/src/lib/lookupFlow.ts`)
- `apps/frontend/src/lib/contextFlow/flow.test.ts` (or the new sibling's test file)
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.test.tsx`
- `PRD/sections/decisions/lookup-suite.md`
- `PRD/sections/decisions/providers-and-contract.md`
- `PRD/sections/system-map.md`
- `PRD/work/suite-build-order/README.md` (if still pointing at old slugs)
- `PRD/instructions/receipts/quick-lookup-<YYYY-MM-DD>.md` (cleanup receipt,
  written by `thejudge-cleanup`, not this slice directly — noted here since the
  system-map shipped-flip depends on it existing)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change (lookup mode is an
      additive amendment per Slice A; existing `{ question, gameContext }`
      requests must still validate and behave unchanged)
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/quick-lookup/` ready to delete

## Notes

- Depends on Slice A (request/payload shape), Slice B (full mock-provider E2E
  needs the real lookup-mode prompt), and Slice D (the shell this wires into).
- This slice does not implement Q-003 (optional lightweight game context on the
  card branch) or Q-004 (answer-seeded second-pass retrieval) — both stay
  explicitly out of v1.
- The feature-portal destination list is promoted in `system-map.md`; the
  dedicated Quick Lookup `shipped` entry remains for `thejudge-cleanup`, because
  that promotion gate requires the cleanup receipt this implementation skill is
  explicitly prohibited from writing.
