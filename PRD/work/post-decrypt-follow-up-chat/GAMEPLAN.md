# GAMEPLAN — Post-Decrypt Follow-Up Chat

## Architecture

### Data flow

```
[EnrichmentStep / App.tsx]
  └─ useAskAiSubmitOrchestration (hook)
       ├─ decrypt path  →  POST /api/ask-ai  { question, gameContext }
       │                    ← answer
       │                    → snapshot frozenGameContext + hiddenInitialQuestion
       │                    → seed visibleMessages = [{ role:"assistant", content:answer }]
       │
       └─ followup path →  POST /api/ask-ai  { question, gameContext:frozen, conversationHistory }
                            ← answer
                            → append user bubble + assistant bubble to visibleMessages

[POST /api/ask-ai]
  validation (askAiRequest.ts)
    └─ conversationHistory: optional; when present: non-empty, ≤20 turns,
       ≤2000 chars/msg, alternating user/assistant, starts user, ends assistant
  preparePromptInput (preparation.ts)
    └─ passes conversationHistory through to PreparedPromptInput
  buildPromptText (normalization.ts)
    └─ when history present: emit CONVERSATION HISTORY section before QUESTION
       budget cap: MAX_CONVERSATION_HISTORY_CHARS = 6000; truncate oldest turns first
       INSTRUCTIONS tweak added when history present
  getPromptDiagnostics
    └─ includes conversationHistoryChars
```

### UI state machine (EnrichmentStep after first decrypt)

```
idle (pre-decrypt)
  → submit → [AskAiWaitingPanel shown]
  → success → conversation active
      ├─ ConversationThread (scrollable; opens with assistant bubble)
      ├─ FollowUpComposer (textarea + Send button)
      ├─ FrozenContextSummary (read-only zone counts + card names)
      └─ StartOver button
  → follow-up submit → [Send button shows inline animation]
  → follow-up success → append bubbles
  → start over → return to pre-decrypt idle (all context preserved)
```

### Key constraints

- `AskAiWaitingPanel` renders only during the initial decrypt (`isSubmitting` on decrypt path), never for follow-ups (DEC-041).
- `frozenGameContext` is captured on first decrypt success and never mutated during the conversation (DEC-040).
- `hiddenInitialQuestion` (including zone-aware fallback) is included in `conversationHistory[0]` on follow-ups but never shown in the UI thread.
- History budget 6,000 chars total; oldest turns truncated before prompt assembly.
- Start over resets conversation state only; game context, zones, cards, enrichment, and question are preserved (DEC-040).
- `POST /api/ask-ai` success/error response shapes unchanged (DEC-038, DEC-020).

## File map

### Backend

| File | Change |
| --- | --- |
| `apps/backend/src/validation/askAiRequest.ts` | Add optional `conversationHistory` Zod field with full validation rules |
| `apps/backend/src/types/index.ts` | Add `ConversationTurn`; extend `AskAiRequest` and `PreparedPromptInput` |
| `apps/backend/src/prompt/preparation.ts` | Pass `conversationHistory` into `PreparedPromptInput` |
| `apps/backend/src/prompt/normalization.ts` | Emit `CONVERSATION HISTORY` section; budget cap; INSTRUCTIONS tweak; diagnostics |
| `apps/backend/src/validation/askAiRequest.test.ts` | Contract tests: valid/invalid history shapes |
| `apps/backend/src/prompt/normalization.test.ts` | Prompt section tests with and without history |

### Frontend

| File | Change |
| --- | --- |
| `apps/frontend/src/types.ts` | Add `ConversationMessage`; extend relevant payload types |
| `apps/frontend/src/lib/contextFlow/flow.ts` | Extend `ZoneAskAiPayload` with `conversationHistory` |
| `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts` | Add conversation state; frozen context; history assembly; followup/retry paths |
| `apps/frontend/src/hooks/useAskAiSubmitOrchestration.test.ts` | Multi-turn hook tests |
| `apps/frontend/src/components/EnrichmentStep.tsx` | Chat UI: thread, composer, frozen summary, start over; conditional AskAiWaitingPanel |
| `apps/frontend/src/App.tsx` | Wire `handleFollowUp`; pass messages + frozen context to EnrichmentStep |
| `apps/frontend/src/App.test.tsx` | Update "hides submit controls" expectation for post-decrypt conversation state |

### Optional extractions (if EnrichmentStep grows unwieldy)

- `apps/frontend/src/components/ConversationThread.tsx`
- `apps/frontend/src/components/AskAiFollowUpForm.tsx`

## Verification checklist

- [ ] `npm run quality:check` green
- [ ] `askAiRequest` validation tests cover: valid history, empty array rejected, >20 turns rejected, >2000 chars/msg rejected, non-alternating roles rejected, first role not user rejected, last role not assistant rejected
- [ ] Prompt normalization tests: no history → no CONVERSATION HISTORY section; history present → section before QUESTION; long history → oldest turns truncated to budget
- [ ] Hook tests: first decrypt success seeds visibleMessages; follow-up success appends user + assistant; start over clears thread; retry resubmits with same frozen context + history
- [ ] Manual: first decrypt shows assistant bubble, not user bubble
- [ ] Manual: Send button shows animation; AskAiWaitingPanel absent for follow-ups
- [ ] Manual: start over returns to enrichment with all context preserved
- [ ] Manual: mock provider with `conversationHistory` → CONVERSATION HISTORY section visible in mock answer
- [ ] `npm run prompt:preview` succeeds with follow-up fixture (Slice E)
