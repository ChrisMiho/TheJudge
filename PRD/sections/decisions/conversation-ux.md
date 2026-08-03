# Conversation UX decisions

Decrypt wait UX and follow-up conversation history behavior.

### DEC-031
- Decision: Decrypt wait UX uses a pure frontend animated panel with CSS-only motion, a live elapsed timer, and threshold-based escalating messages.
- Status: confirmed
- Context: AI responses during decrypt can take several seconds; the submit button going inactive with no feedback creates a perceived hang. A dedicated waiting panel was added to replace the submit form while `isSubmitting` is true.
- Impact:
  - `lib/askAiWaitStages.ts` — threshold config and stage selector (pure TS, no React)
  - `hooks/useElapsedWaitTimer.ts` — setInterval hook returning elapsed seconds and current stage
  - `components/AskAiWaitingPanel.tsx` — timer display with `aria-live` message region and CSS variant classes
  - `index.css` — `.wait-stage-calm`, `.wait-stage-curious`, `.wait-stage-absurd` keyframe classes
  - `components/EnrichmentStep.tsx` — conditionally renders `AskAiWaitingPanel` in place of submit form
  - CSS carve-out under NFR-006 explicitly permits these keyframe animations for functional wait states
- Related requirements:
  - REQ-023
  - NFR-006
- Notes:
  - no animation libraries added; CSS-only constraint satisfied
  - card list and wizard context above the form remain visible during the wait

### DEC-038
- Decision: `POST /api/ask-ai` may accept an optional `conversationHistory` field on follow-up turns; success and error response shapes remain unchanged.
- Status: confirmed
- Context: The post-decrypt follow-up chat feature requires prior exchange turns to be sent with each follow-up so the model can reason in context. Adding one optional field is the smallest additive change to the existing contract.
- Impact:
  - `AskAiRequest` gains optional `conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>`
  - first decrypt omits `conversationHistory`; follow-up N sends frozen `gameContext` plus full prior exchange
  - backend Zod validation accepts the field when present: non-empty array, max 20 turns, max 2000 chars/message, same control-character guardrails as `question`, must start `role: "user"`, must alternate user/assistant, last entry must be `assistant`
  - success response shape `{ answer }` and error response shape are unchanged for both mock and OpenAI providers
  - mock-provider follow-up answers include the exact assembled LLM-facing prompt for the submitted user message, allowing the visible chat flow and provider-bound prompt to be validated without live model access
  - DEC-020 frozen contract is preserved; this is an additive optional extension only
- Related requirements:
  - REQ-019
  - REQ-027
- Notes:
  - amends DEC-020 contract freeze for this one optional additive field

### DEC-039
- Decision: Follow-up conversation history is client-side ephemeral only; no server-side session store, no persistence across page reloads.
- Status: confirmed
- Context: The PRD non-goal explicitly excludes saved sessions. Ephemeral client state is sufficient for the in-session follow-up use case and avoids any server-side session complexity.
- Impact:
  - `conversationHistory` is assembled in the frontend hook from in-memory state and discarded on page reload
  - no session IDs, no new backend endpoints, no storage layer
- Related requirements:
  - REQ-027
- Notes:

### DEC-040
- Decision: Game context is frozen after the first successful decrypt for the duration of the in-session conversation; follow-up turns are text-only in v1.
- Status: confirmed
- Context: Allowing zone or card edits mid-conversation would require re-deriving the full context for every history turn, adding complexity without a clear v1 use case. Freezing context keeps the history coherent and the implementation tractable.
- Impact:
  - `frozenGameContext` snapshot is taken on first decrypt success and used unchanged for all follow-up requests
  - enrichment zone/card editing is disabled while a conversation is active
  - `hiddenInitialQuestion` (including zone-aware fallback) is captured at first decrypt and included in `conversationHistory` on follow-up turns but not shown in the UI thread
  - start over clears the thread and unfreezes editing; all previously entered context, zones, cards, and enrichment are preserved for re-use
  - start over button is visible whenever the first decrypt has succeeded and no request is in flight
- Related requirements:
  - REQ-025
  - REQ-029
- Notes:

### DEC-041
- Decision: Follow-up submit UX is inline within the chat composer; `AskAiWaitingPanel` is not shown for follow-up turns.
- Status: confirmed
- Context: The full waiting panel is appropriate for the initial decrypt which can take several seconds under a cold start. Follow-up turns share frozen context and shorter prompts; replacing the entire form for each follow-up would break the chat flow. An inline button animation is sufficient feedback.
- Impact:
  - Send button replaces its content with a processing animation (e.g. spinner or animated dots) while a follow-up request is in flight
  - `AskAiWaitingPanel` continues to render for the initial decrypt only (REQ-023 unchanged)
  - Send button is disabled and shows the animation until the response is received or an error occurs
- Related requirements:
  - REQ-023
  - REQ-028
- Notes:

### DEC-118
- Decision: In-Depth Question and Quick Question share one chat-first conversation workspace after the first answer. The scrollable message log is the dominant surface; follow-up composer, retry/error feedback, and Start Over occupy stable workspace rows; and the composer is docked within the workspace rather than fixed to the viewport. Frozen flow-specific context moves behind a compact trigger: an accessible bottom sheet below `768px` and an accessible right-side drawer at `768px+`. In-Depth Question always exposes frozen game context; Quick Question exposes an attached frozen card and omits the trigger when no card was submitted. Appended messages auto-scroll only when the reader is within 64px of the bottom; otherwise reading position is preserved and a New response control scrolls to and places keyboard focus on the newest assistant message. Focused first-answer/message/drawer/control transitions reuse existing CSS motion tokens and honor reduced motion.
- Status: confirmed
- Context: The two shipped answer flows already reuse `ConversationThread` and `FollowUpComposer`, but each assembles its own surrounding answered-state layout. The result is a narrow bubble list with duplicated chrome, inline context consuming the top of the chat, no reader-safe auto-scroll policy, and desktop space used little differently from mobile. The product owner chose a chat-first context-drawer direction over a permanent desktop context rail and over keeping one stacked column at every width. Conversation semantics and contracts are already sound and are intentionally frozen; this decision changes presentation and interaction only.
- Impact:
  - one shared workspace owns thread, composer, error/retry placement, Start Over placement, context trigger, adaptive context container, and new-response affordance; both flows consume it rather than maintaining separate answered-state assemblies
  - preserves existing destination/header chrome, hidden initial user question, first visible assistant answer, frozen-context rules, follow-up text limits, retry cooldown, Start Over data preservation, and request/history contracts
  - context remains read-only; the bottom sheet/right drawer closes by explicit control and Escape, contains keyboard focus while open, and returns focus to its trigger
  - the In-Depth trigger provides a terse cue (phase and populated-zone count); its drawer reuses the existing full frozen-context formatting; Quick Question uses the attached card name and existing card presentation, and renders no empty context trigger without a card
  - the thread is an accessible polite live log that announces additions without re-announcing the full history
  - remaining scroll distance `<= 64px` counts as near-bottom; appended messages then move to the latest message (immediate under reduced motion); farther-up readers keep their position and receive a New response control until they activate it or otherwise return to the bottom; activation scrolls to and places keyboard focus on the newest assistant message, dismisses the control, and preserves any composer draft
  - first-answer handoff, newly appended messages, drawer/sheet open-close, and New response appearance use existing transform/opacity CSS motion tokens; existing bubbles do not replay entrance motion on unrelated renders
  - DEC-031 waiting-panel behavior and DEC-041 inline Send spinner are preserved; no new palette/Menu signature animation or broad app-wide motion audit is introduced
  - presentation only — no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, providers, response shapes, conversation-history assembly/limits, retry timing, backend routes, or scanning behavior
- Related requirements:
  - REQ-025
  - REQ-026
  - REQ-028
  - REQ-075
  - REQ-097
  - REQ-098
  - DEC-040
  - DEC-041
  - DEC-079
  - DEC-117
  - NFR-006
- Notes:
  - approved layout: chat-first with adaptive overlay context, chosen over a permanent desktop context rail and a centered stacked column
  - non-goals: visible initial-question bubble, context mutation, viewport-fixed composer, new conversation limits, persistence, backend changes, animation library, palette pulse, or scanner re-animation
