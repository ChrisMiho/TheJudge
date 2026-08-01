# Slice E — Portal wiring + integration

## Status: planned

## Goal

Wire the action entry, snapshot seam, delivery, and modal together at the app shell: register
**Send feedback** in the portal dropdown, mount `FeedbackContextProvider` + `FeedbackModal`, register
the `MtgAssistantApp` flow contributor, and restore focus to the portal trigger on close — closing
out DEC-104/DEC-105/REQ-086/087/088/FLOW-014 end to end.

## Requirements

1. `apps/frontend/src/App.tsx`:
   - wrap the shell in `FeedbackContextProvider`, passing `activeDestinationId` and the resolved
     provider mode (`isMockProvider` from `lib/env.ts` → `"mock" | "openai"`)
   - own `isFeedbackModalOpen` state and a `feedbackTriggerRef` (captures the currently-focused
     element — the "Send feedback" menu item — at the moment its handler fires, so focus can be
     restored to it on close; `FeaturePortalMenu` itself needs no change for this since the menu item
     still has focus when `onSelect` runs, before the menu unmounts it)
   - construct a `feedbackActionEntry: PortalActionEntry` (`kind: "action"`, `id: "send-feedback"`,
     `label: "Send feedback"`) whose `onSelect` captures `document.activeElement` into
     `feedbackTriggerRef` and opens the modal; pass `entries={[...PORTAL_DESTINATIONS,
     feedbackActionEntry]}` to `FeaturePortalMenu` (destination list and `DestinationOutlet` wiring
     unchanged)
   - render `<FeedbackModal isOpen={isFeedbackModalOpen} onClose={...} getFeedbackContext={...}
     formspreeId={feedbackFormspreeId} />`; `onClose` closes the modal and calls `.focus()` on
     `feedbackTriggerRef.current` when it is still attached to the document
2. `apps/frontend/src/components/portal/MtgAssistantApp.tsx` — call
   `useRegisterFeedbackContributor(...)` with a contributor returning the current
   `FeedbackFlowSnapshot` (flow step, `gameContext`, `question`, `zoneCardsByZone`,
   `visibleMessages`/conversation history) so the snapshot reflects live in-progress state at any
   step, including the answered/conversation view.
3. No change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, or
   `POST /api/ask-ai` (chrome + delivery only, per DEC-105/DEC-104 constraints).

## Acceptance criteria

- [ ] "Send feedback" appears in the portal dropdown; selecting it opens `FeedbackModal` without
      changing `activeDestinationId` and without unmounting or resetting the active destination
- [ ] With the MTG Assistant flow at each step (game context, zone confirm, zone collection,
      enrichment, answered/conversation), opening the modal's expandable summary reflects that step's
      live state — verified via an `<App />`-level integration test
- [ ] Closing the modal (submit success, Esc, or the close control) restores focus to the "Send
      feedback" menu item / portal trigger
- [ ] With `VITE_FEEDBACK_FORMSPREE_ID` unset, the modal's submit control is disabled/no-op
      end-to-end and a mocked `fetch` records zero calls
- [ ] Existing `App.*.test.tsx` files (answered-state, layout-density, interaction-flows, zoneFlow,
      game-setup-zones, theming) remain green — feedback wiring is additive
- [ ] `npm --workspace apps/frontend run test` green (full suite)
- [ ] `npm --workspace apps/frontend run typecheck` green
- [ ] `apps/frontend/.env.example` documents `VITE_FEEDBACK_FORMSPREE_ID`; no secret committed
- [ ] `npm run quality:check` green for touched areas

## Verification

```bash
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
npm run quality:check
```

## Files touched

- `apps/frontend/src/App.tsx`
- `apps/frontend/src/App.feedback.test.tsx`
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`

## PRD promotion checklist (executed by `thejudge-cleanup`, not this slice)

- [ ] Confirm DEC-104 (`sections/decisions/navigation.md`) and DEC-105
      (`sections/decisions/feedback.md`) impact blocks match shipped behavior; no further edits
      expected since both already carry full `Impact:` detail
- [ ] Flip the **Feedback & bug report** entry in `sections/system-map.md` from `planned` to
      `shipped` (gate: product code wired in `apps/frontend` **and** a cleanup receipt written)
- [ ] Write the cleanup receipt at `PRD/instructions/receipts/feedback-bug-report-<YYYY-MM-DD>.md`
- [ ] Delete `PRD/work/feedback-bug-report/` entirely

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/feedback-bug-report/` ready to delete
