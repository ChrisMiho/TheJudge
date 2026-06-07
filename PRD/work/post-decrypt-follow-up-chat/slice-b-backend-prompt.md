# Slice B — Backend Prompt Assembly

## Status: done

## Goal

Thread `conversationHistory` through the prompt pipeline and emit a `CONVERSATION HISTORY` section before `QUESTION` in `buildPromptText` when history is present, including budget capping and diagnostics.

## Dependencies

- Slice A (types and Zod schema must be in place)

## Requirements

1. In `apps/backend/src/prompt/preparation.ts`, read `conversationHistory` from the validated `AskAiRequest` and include it in the returned `PreparedPromptInput`.
2. In `apps/backend/src/prompt/normalization.ts`:
   - Define `MAX_CONVERSATION_HISTORY_CHARS = 6000`.
   - When `conversationHistory` is present, truncate oldest turns first until total chars ≤ `MAX_CONVERSATION_HISTORY_CHARS`. Truncate individual messages via the existing `truncateOracleText` pattern.
   - Emit a `CONVERSATION HISTORY` section immediately before `QUESTION`. Format each turn as `User: <content>` / `Assistant: <content>` on its own line.
   - Add one `INSTRUCTIONS` line when history is present: treat follow-ups as refinements or clarifications against the frozen game state and prior answers.
3. In `getPromptDiagnostics`, include `conversationHistoryChars: number` (0 when no history).
4. Add unit tests in `apps/backend/src/prompt/normalization.test.ts` covering the cases in the acceptance criteria.

## Acceptance criteria

- [ ] When `conversationHistory` is absent, no `CONVERSATION HISTORY` section appears in prompt text
- [ ] When `conversationHistory` is present, `CONVERSATION HISTORY` section appears immediately before `QUESTION`
- [ ] Each turn formats as `User: <content>` / `Assistant: <content>` in array order
- [ ] History totalling ≤ 6000 chars is included in full
- [ ] History totalling > 6000 chars has oldest turns truncated until within budget
- [ ] INSTRUCTIONS tweak line is included when history is present, absent when history is absent
- [ ] `getPromptDiagnostics` includes `conversationHistoryChars` (0 when no history, positive when history present)
- [ ] Mock provider response includes CONVERSATION HISTORY section when history is sent — manual: send a follow-up and inspect the mock `answer` blob
- [ ] `npm run quality:check` passes

## Verification

```bash
npm run quality:check
npx vitest run apps/backend/src/prompt/normalization.test.ts
```

Manual (mock provider):
```bash
# Start backend with ASK_AI_PROVIDER=mock, send a follow-up request with conversationHistory,
# confirm CONVERSATION HISTORY section appears in the mock answer blob.
npm run prompt:preview  # after Slice E adds follow-up fixture
```

## Files touched

- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/prompt/normalization.ts`
- `apps/backend/src/prompt/normalization.test.ts`
