# Receipt — post-decrypt-follow-up-chat

- **Date:** 2026-06-07
- **Slug:** post-decrypt-follow-up-chat
- **Status:** shipped

## Actions taken

- [x] Verified all five slices (A–E) marked `done`
- [x] Confirmed all durable outcomes already promoted to `PRD/sections/` (no new promotions needed)
- [x] Confirmed `npm run quality:check` green: 192 frontend tests + 173 backend tests, all pass
- [x] Confirmed `npm run prompt:preview` succeeds for `follow-up-chat` fixture; `CONVERSATION HISTORY` section appears before `QUESTION` in production artifact
- [x] Ship checklist passed (see below)
- [x] Wrote this receipt
- [x] Deleted `PRD/work/post-decrypt-follow-up-chat/`

## Ship checklist

- [x] Slice acceptance criteria satisfied and verified for A–E
- [x] Tests updated; `npm run quality:check` green for all touched areas
- [x] Public contract unchanged except additive optional `conversationHistory` field (DEC-038)
- [x] No secrets committed
- [x] Durable outcomes already in `sections/` — no new promotions required

## Durable outcomes (already in sections/)

| Artefact | Location |
| --- | --- |
| DEC-038 — additive `conversationHistory` field | `sections/decisions.md:550` |
| DEC-039 — frozen game context on follow-ups | `sections/decisions.md:567` |
| DEC-040 — start-over resets thread, not game context | `sections/decisions.md:578` |
| DEC-041 — AskAiWaitingPanel only on initial decrypt | `sections/decisions.md:593` |
| REQ-025 through REQ-029 | `sections/functional-requirements.md` |
| FLOW-005 — follow-up chat user flow | `sections/user-flows.md:81` |
| `ConversationTurn` type + `conversationHistory` API shape | `sections/integrations-and-data.md` |
| `CONVERSATION HISTORY` prompt section rules + budget cap | `sections/integrations-and-data.md` |

## Files created / updated / deleted

### Created
- `apps/backend/src/eval/fixtures/follow-up-chat.fixture.json` — two-turn follow-up eval fixture
- `apps/backend/src/eval/fixtures/follow-up-chat.context.golden.json` — generated golden context snapshot
- `apps/backend/src/eval/fixtures/follow-up-chat.prompt.golden.txt` — generated golden prompt snapshot
- `PRD/instructions/receipts/post-decrypt-follow-up-chat-2026-06-07.md` — this receipt

### Updated
- `apps/backend/src/types/index.ts` — `ConversationTurn`; `AskAiRequest` + `PreparedPromptInput` extended with `conversationHistory`
- `apps/backend/src/validation/askAiRequest.ts` — `conversationTurnSchema` + `conversationHistorySchema` + `askAiRequestSchema`
- `apps/backend/src/validation/askAiRequest.test.ts` — contract tests for valid/invalid history shapes
- `apps/backend/src/prompt/preparation.ts` — passes `conversationHistory` through to `PreparedPromptInput`
- `apps/backend/src/prompt/normalization.ts` — `CONVERSATION HISTORY` section, budget cap (`MAX_CONVERSATION_HISTORY_CHARS = 6000`), INSTRUCTIONS tweak, diagnostics field
- `apps/backend/src/prompt/normalization.test.ts` — prompt section tests with and without history
- `apps/frontend/src/types.ts` — `ConversationMessage` type
- `apps/frontend/src/lib/contextFlow/flow.ts` — `ZoneAskAiPayload` extended with `conversationHistory`
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts` — conversation state, frozen context, history assembly, follow-up/retry paths, `startOver`
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.test.ts` — multi-turn hook tests
- `apps/frontend/src/components/EnrichmentStep.tsx` — chat thread, follow-up composer, frozen context summary, start over, conditional AskAiWaitingPanel
- `apps/frontend/src/App.tsx` — wired `handleFollowUp`, pass conversation props to `EnrichmentStep`
- `apps/frontend/src/App.test.tsx` — updated "hides submit controls" assertion to check conversation thread + Start Over button
- `scripts/prompt-preview.mjs` — added `follow-up-chat` to `DEFAULT_FIXTURES`
- `apps/backend/src/eval/fixtures/checklist-report.golden.txt` — regenerated to include follow-up-chat scenario
- `apps/frontend/src/components/ConversationThread.tsx` — new component (if extracted from EnrichmentStep)
- `apps/frontend/src/components/AskAiFollowUpForm.tsx` — new component (if extracted from EnrichmentStep)
- `apps/frontend/src/index.css` — Send button animation class

### Deleted
- `PRD/work/post-decrypt-follow-up-chat/README.md`
- `PRD/work/post-decrypt-follow-up-chat/IDEA.md`
- `PRD/work/post-decrypt-follow-up-chat/DESIGN-BRIEF.md`
- `PRD/work/post-decrypt-follow-up-chat/GAMEPLAN.md`
- `PRD/work/post-decrypt-follow-up-chat/slice-a-api-contract.md`
- `PRD/work/post-decrypt-follow-up-chat/slice-b-backend-prompt.md`
- `PRD/work/post-decrypt-follow-up-chat/slice-c-frontend-hook.md`
- `PRD/work/post-decrypt-follow-up-chat/slice-d-frontend-ui.md`
- `PRD/work/post-decrypt-follow-up-chat/slice-e-tests-closeout.md`

## Verification results

- `npm run quality:check`: **192 frontend + 173 backend tests, all pass**
- `npm run prompt:preview`: `follow-up-chat` fixture → `ok`; `CONVERSATION HISTORY` at line 215, `QUESTION` at line 219 in `output/prompt-preview/follow-up-chat/production.prompt.txt`
