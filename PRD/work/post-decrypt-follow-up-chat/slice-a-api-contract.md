# Slice A — API Contract (Backend types + Zod + validation tests)

## Status: planned

## Goal

Extend the backend type system and Zod validation schema to accept the optional `conversationHistory` field on `POST /api/ask-ai`, with full structural validation, and add contract tests proving valid and invalid shapes.

## Requirements

1. Add `ConversationTurn = { role: "user" | "assistant"; content: string }` to `apps/backend/src/types/index.ts`.
2. Extend `AskAiRequest` in `types/index.ts` with `conversationHistory?: ConversationTurn[]`.
3. Extend `PreparedPromptInput` in `types/index.ts` with `conversationHistory?: ConversationTurn[]`.
4. In `apps/backend/src/validation/askAiRequest.ts`, add optional `conversationHistory` Zod field with these rules when present:
   - non-empty array
   - max 20 items
   - each item: `role` in `["user", "assistant"]`, `content` string ≤ 2000 chars, same control-character guardrails as `question`
   - first item must have `role: "user"`
   - roles must alternate user/assistant
   - last item must have `role: "assistant"`
5. Add contract tests in `apps/backend/src/validation/askAiRequest.test.ts` covering the cases in the acceptance criteria.

## Acceptance criteria

- [ ] `AskAiRequest` type has optional `conversationHistory?: ConversationTurn[]` in `types/index.ts`
- [ ] `PreparedPromptInput` type has optional `conversationHistory?: ConversationTurn[]` in `types/index.ts`
- [ ] Validation accepts a request with `conversationHistory` omitted (first decrypt shape)
- [ ] Validation accepts a request with a valid 2-turn history `[user, assistant]`
- [ ] Validation accepts a request with a valid 4-turn history `[user, assistant, user, assistant]`
- [ ] Validation rejects `conversationHistory: []` (empty array)
- [ ] Validation rejects a history with > 20 turns
- [ ] Validation rejects any message with `content` > 2000 characters
- [ ] Validation rejects a history that starts with `role: "assistant"`
- [ ] Validation rejects a history with non-alternating roles (e.g. `[user, user]`)
- [ ] Validation rejects a history whose last entry is `role: "user"`
- [ ] `npm run quality:check` passes

## Verification

```bash
npm run quality:check
```

Run validation tests directly:
```bash
npx vitest run apps/backend/src/validation/askAiRequest.test.ts
```

## Files touched

- `apps/backend/src/types/index.ts`
- `apps/backend/src/validation/askAiRequest.ts`
- `apps/backend/src/validation/askAiRequest.test.ts`
