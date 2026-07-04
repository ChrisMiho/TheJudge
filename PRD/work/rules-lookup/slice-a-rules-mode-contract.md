# Slice A — Rules-mode request contract

## Status: planned

## Goal

Add the `mode: "rules"` branch (`{ mode: "rules", question, conversationHistory? }`) to
the `mode`-discriminated `AskAiRequest` on `POST /api/ask-ai` (DEC-098 / REQ-076),
additively and without breaking existing clients.

## Requirements

1. `askAiRequestSchema` accepts a `rules` branch: `{ mode: "rules", question,
   conversationHistory? }` with no `gameContext` and no `card`.
2. Backend Zod rejects a `gameContext` field and a `card` field on rules mode.
3. `question` character cap (300) and control-character guardrails are identical to
   the other modes (shared `boundedText`); `conversationHistory` is optional and
   validated by the existing `conversationHistorySchema` (DEC-038) unchanged.
4. `mode: "game"` (default when absent) and existing `{ question, gameContext,
   conversationHistory? }` payloads validate and behave unchanged; `AskAiRequest`
   (`apps/backend/src/types/index.ts`) re-derives from the union.
5. Success `{ answer }` and error response shapes are unchanged for rules mode and both
   `ASK_AI_PROVIDER` providers; the route path and provider boundary are unchanged.

## Acceptance criteria

- [ ] A `{ mode: "rules", question }` body parses; a `{ mode: "rules", question,
      conversationHistory }` body parses with the existing history rules.
- [ ] A rules body carrying `gameContext` or `card` is rejected with a validation error.
- [ ] A `{ question, gameContext }` body (no `mode`) still parses as game mode and
      behaves unchanged (back-compat).
- [ ] `AskAiRequest` type narrows on `mode`; `mode: "rules"` has no `gameContext`/`card`
      members.
- [ ] `npm --workspace apps/backend run test` green including new rules-branch cases in
      `askAiRequest.test.ts`.

## Verification

```bash
npm --workspace apps/backend run test -- askAiRequest
npm --workspace apps/backend run test
npm --workspace apps/backend run typecheck
```

## Files touched

- `apps/backend/src/validation/askAiRequest.ts` — extend the `mode`-discriminated
  union with the `rules` branch (`gameContext`/`card` rejected); reuse `boundedText`
  and `conversationHistorySchema`
- `apps/backend/src/validation/askAiRequest.test.ts` — rules-branch accept/reject cases
  + game back-compat regression
- `apps/backend/src/types/index.ts` — `AskAiRequest` re-derives from the union (rules
  variant)

## Notes

- **External prereq: DEC-096 union (card-lookup-qa Slice A).** If the `mode`
  discriminator has not landed, this slice introduces the discriminated union
  (`game` default + `rules`) so rules work is unblocked; card-lookup-qa's `card`
  branch coexists. Coordinate to avoid a merge collision on `askAiRequest.ts`.
- Additive amendment to the DEC-020 frozen contract; no existing field changes meaning
  (same pattern as DEC-038's optional `conversationHistory`).
