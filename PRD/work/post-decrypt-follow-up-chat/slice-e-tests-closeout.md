# Slice E — Tests + Closeout

## Status: planned

## Goal

Close out the feature: update existing tests that break from the new post-decrypt state, add a prompt-preview fixture with follow-up history, and prepare the work folder for deletion.

## Dependencies

- Slices A, B, C, D (all implementation complete)

## Requirements

1. **`apps/frontend/src/App.test.tsx`** — find and update any test that asserts "submit form / Decrypt Stack button hidden after answer" to instead assert the new conversation thread is shown and the start-over button is present. Expectation now reflects `isConversationActive` UI state rather than a simple hide.
2. **Prompt-preview fixture** — add a follow-up fixture to the eval fixtures directory (e.g. `apps/backend/src/eval/fixtures/follow-up-chat/`). The fixture should represent a two-turn exchange. Run `npm run prompt:preview` to verify the `CONVERSATION HISTORY` section is present in the output artifact.
3. Confirm `npm run quality:check` is fully green across frontend and backend.
4. Work folder ready for `thejudge-cleanup`: all acceptance criteria from Slices A–D satisfied and verified.

## Acceptance criteria

- [ ] `App.test.tsx` passes — any previous "hides submit controls" assertion is updated to reflect the conversation-active UI state
- [ ] Prompt-preview follow-up fixture exists and `npm run prompt:preview` writes an artifact showing `CONVERSATION HISTORY` before `QUESTION`
- [ ] All hook tests from Slice C pass
- [ ] All validation contract tests from Slice A pass
- [ ] All prompt normalization tests from Slice B pass
- [ ] `npm run quality:check` green (no type errors, no lint errors, all tests pass)

## Verification

```bash
npm run quality:check
npm run prompt:preview
```

Inspect `output/prompt-preview/<follow-up-fixture>/production.prompt.txt` for `CONVERSATION HISTORY` section.

## Files touched

- `apps/frontend/src/App.test.tsx`
- `apps/backend/src/eval/fixtures/follow-up-chat/` (new fixture directory + fixture file)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified for Slices A–E
- [ ] Tests updated; `npm run quality:check` green for all touched areas
- [ ] Public contract unchanged except additive optional `conversationHistory` field (DEC-038)
- [ ] No secrets committed
- [ ] Durable outcomes promoted to `sections/`; `PRD/work/post-decrypt-follow-up-chat/` ready to delete

## PRD promotion checklist (for thejudge-cleanup)

- DEC-038 through DEC-041 — already in `sections/decisions.md` ✓
- REQ-025 through REQ-029 — already in `sections/functional-requirements.md` ✓
- FLOW-005 — already in `sections/user-flows.md` ✓
- `ConversationTurn`, `AskAiRequest.conversationHistory` — already in `sections/integrations-and-data.md` ✓
- Conversation history prompt rules — already in `sections/integrations-and-data.md` under "Conversation history prompt section" ✓
- No new durable doc updates needed; cleanup can proceed directly to receipt + folder deletion.
