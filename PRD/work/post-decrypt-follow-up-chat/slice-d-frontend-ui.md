# Slice D — Frontend Chat UI

## Status: planned

## Goal

Replace the post-decrypt terminal state in `EnrichmentStep` with a full chat UI: scrollable conversation thread, follow-up composer, frozen context summary, and start-over escape hatch.

## Dependencies

- Slice C (hook must expose `visibleMessages`, `frozenGameContext`, `isConversationActive`, `submitFollowUp`, `startOver`, `isFollowUpSubmitting`)

## Requirements

1. **`apps/frontend/src/components/EnrichmentStep.tsx`** — when `isConversationActive` is true:
   - Hide the initial decrypt form (question textarea + Decrypt Stack button).
   - Hide "Back to zones" if currently shown.
   - `AskAiWaitingPanel` is shown only when `isSubmitting` (initial decrypt) is true; never shown during follow-up submits.
   - Render a **ConversationThread**: scrollable container of message bubbles. Assistant bubbles first; user bubbles added on follow-up. Style distinguishes user vs assistant visually. Initial user question is not shown.
   - Render a **FrozenContextSummary**: compact read-only block showing zone counts + card names from `frozenGameContext`. No editing controls.
   - Render a **FollowUpComposer**: textarea (max 300 chars) + Send button. Send is disabled while `isFollowUpSubmitting` or text is empty after trim.
   - **Send button animation**: while `isFollowUpSubmitting`, replace button content with an inline CSS-only animation (spinner or animated dots); restore button text when response arrives or error occurs. No animation libraries.
   - Render a **Start Over** button: visible whenever `isConversationActive && !isSubmitting && !isFollowUpSubmitting`. Clicking calls `startOver()`.
   - **Error + retry**: on follow-up failure, show error message and retry button consistent with existing error handling pattern.

2. **`apps/frontend/src/App.tsx`** — wire `handleFollowUp(text: string)` that calls `submitFollowUp(text)` from the hook, and pass `visibleMessages`, `frozenGameContext`, `isConversationActive`, `isFollowUpSubmitting`, `startOver` to `EnrichmentStep`.

3. Optional: if `EnrichmentStep.tsx` grows too large, extract `ConversationThread.tsx` and/or `AskAiFollowUpForm.tsx` as co-located components.

4. Send button animation must be CSS-only (NFR-006 carve-out).

## Acceptance criteria

- [ ] After first decrypt success, initial decrypt form and Decrypt Stack button are hidden
- [ ] Conversation thread is visible; first bubble is the assistant's answer
- [ ] The initial user question is not shown as a bubble in the thread
- [ ] Frozen context summary is visible and read-only
- [ ] Start over button is visible and enabled (no request in flight)
- [ ] Typing a follow-up and clicking Send appends a user bubble then assistant bubble
- [ ] Send button content is replaced with an inline animation while follow-up is in flight
- [ ] `AskAiWaitingPanel` is not shown during follow-up submit
- [ ] Send button is disabled while `isFollowUpSubmitting` or input is empty after trim
- [ ] Clicking Start Over returns to pre-decrypt enrichment; game context, zones, cards, and question are intact
- [ ] Start over button is hidden while a request is in flight
- [ ] Follow-up error shows error state with retry button; retry resubmits with same frozen context + history
- [ ] `npm run quality:check` passes
- [ ] Manual golden path: decrypt → read answer → type follow-up → send → see two new bubbles → start over → enrichment restored

## Verification

```bash
npm run quality:check
```

Manual (start the dev server and exercise the golden path):
1. Decrypt Stack → first assistant bubble appears, no user bubble.
2. Type follow-up → Send → user bubble + assistant bubble appear; Send animation shown during request.
3. Check AskAiWaitingPanel is absent during follow-up.
4. Click Start Over → returns to enrichment; zone/card/question state preserved.

## Files touched

- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/App.tsx`
- (optional) `apps/frontend/src/components/ConversationThread.tsx`
- (optional) `apps/frontend/src/components/AskAiFollowUpForm.tsx`
- `apps/frontend/src/index.css` (Send button animation class if not already present)
