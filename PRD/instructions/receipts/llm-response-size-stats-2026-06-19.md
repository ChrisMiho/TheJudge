# LLM Response Size Stats Receipt

- Date: 2026-06-19
- Slug: `llm-response-size-stats`
- Status: shipped

## Actions taken

- [x] Implemented backend lifecycle-log answer-size diagnostics for successful live/OpenAI provider invocations.
- [x] Shared the 4-characters-per-token estimate with mock prompt stats.
- [x] Passed provider mode through app composition so response-size fields are emitted only for live/OpenAI mode.
- [x] Added route behavior coverage for `answerChars`, `estimatedAnswerTokens`, and `charsPerTokenEstimate`.
- [x] Added route behavior coverage proving default/mock mode omits response-size fields.
- [x] Added live/OpenAI success contract coverage proving the response body remains exactly `{ answer }`.
- [x] Confirmed DEC-049, REQ-033, and integrations/data text already describe the shipped behavior.
- [x] Wrote this receipt before flipping the system-map entry to shipped.
- [x] Flipped `PRD/sections/system-map.md` after receipt creation.
- [x] Deleted `PRD/work/llm-response-size-stats/` after durable promotion.

## Files created / updated / deleted

- Created: `apps/backend/src/responseSizeDiagnostics.ts`
- Created: `PRD/instructions/receipts/llm-response-size-stats-2026-06-19.md`
- Updated: `apps/backend/src/routes/askAi.ts`
- Updated: `apps/backend/src/app/createApp.ts`
- Updated: `apps/backend/src/index.ts`
- Updated: `apps/backend/src/mockAskAi.ts`
- Updated: `apps/backend/src/app.behavior.test.ts`
- Updated: `apps/backend/src/app.contract.test.ts`
- Updated: `PRD/sections/system-map.md`
- Updated then deleted: `PRD/work/llm-response-size-stats/README.md`
- Updated then deleted: `PRD/work/llm-response-size-stats/slice-a-response-size-logging.md`
- Updated then deleted: `PRD/work/llm-response-size-stats/slice-b-contract-and-ship-gates.md`
- Deleted: `PRD/work/llm-response-size-stats/DESIGN-BRIEF.md`
- Deleted: `PRD/work/llm-response-size-stats/GAMEPLAN.md`
- Deleted: `PRD/work/llm-response-size-stats/IDEA.md`

## Verification results

- `npm --workspace apps/backend run test -- src/app.behavior.test.ts`: passed
- `npm --workspace apps/backend run test -- src/mockAskAi.test.ts`: passed
- `npm --workspace apps/backend run typecheck`: passed
- `npm --workspace apps/backend run test -- src/app.contract.test.ts`: passed
- `npm --workspace apps/backend run test -- src/app.behavior.test.ts src/app.contract.test.ts`: passed
- `npm run quality:check`: passed

## Durable PRD promotion

- `PRD/sections/decisions.md`: DEC-049 already accurately described log-only response-size diagnostics.
- `PRD/sections/functional-requirements.md`: REQ-033 already matched the verified log and response-contract behavior.
- `PRD/sections/integrations-and-data.md`: already described OpenAI/live provider response-size logging and non-leakage boundaries.
- `PRD/sections/system-map.md`: promoted `Live response-size diagnostics` from `planned` to `shipped` after this receipt was written.
