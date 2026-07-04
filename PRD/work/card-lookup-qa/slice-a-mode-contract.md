# Slice A — Ask AI `mode` discriminator contract

## Status: planned

## Goal

Turn `AskAiRequest` into a `mode`-discriminated union on the existing `POST /api/ask-ai` endpoint: `mode: "game"` (default, unchanged) and `mode: "card"` (single-card, no `gameContext`), without breaking existing clients. Contract/validation only — no prompt-behavior change yet.

## Requirements

1. `AskAiRequest` accepts an optional `mode`; absent → defaults to `"game"`, so existing `{ question, gameContext, conversationHistory? }` payloads validate and behave unchanged (REQ-072, DEC-096).
2. `mode: "game"` branch keeps today's rules (REQ-019): `{ mode?: "game", question, gameContext, conversationHistory? }`; a `card` field is rejected.
3. `mode: "card"` branch is `{ mode: "card", question, card, conversationHistory? }` where `card` is a single oracle-level reference resolvable to a committed `CardMetadataItem` (id, name, oracle text, full metadata — no stack/zone/enrichment fields); `gameContext` is rejected.
4. `question` cap (300) and control-character guardrails are identical across branches; `conversationHistory` is optional in both modes and validated by the existing `conversationHistorySchema` unchanged (DEC-038: non-empty, ≤20 turns, alternating user/assistant starting with user, ending assistant).
5. Success `{ answer }` and error response shapes are unchanged for both modes and both `ASK_AI_PROVIDER` providers; route path and provider boundary unchanged.
6. `AskAiRequest` / any exported request types are re-derived from the union; `mode: "rules"` is **not** introduced (reserved for `rules-lookup`).

## Acceptance criteria

- [ ] A request with no `mode` and a valid `gameContext` validates and is treated as `mode: "game"` (back-compat).
- [ ] `mode: "card"` with `{ question, card }` and no `gameContext` validates; the `card` reference resolves to the fields the prompt needs.
- [ ] `mode: "card"` carrying `gameContext` is rejected; `mode: "game"` (or absent) carrying `card` is rejected.
- [ ] `conversationHistory` validation is identical in both modes (reuses `conversationHistorySchema`); a game-mode request with history still behaves as today.
- [ ] `question` >300 chars or with control characters is rejected identically in both modes.
- [ ] No change to the success/error response schemas or the route path; game-mode requests produce byte-identical prompts to `main` (guarded by existing prompt/contract tests).

## Verification

```bash
npm --workspace apps/backend run test -- askAiRequest
npm --workspace apps/backend run test -- app.contract
npm run test:eval
npm --workspace apps/backend run typecheck
```

## Files touched

- `apps/backend/src/validation/askAiRequest.ts` — discriminated union; `card` reference schema; default-`mode` normalization (preprocess) so absent `mode` discriminates as `"game"`
- `apps/backend/src/validation/askAiRequest.test.ts` — branch validation, cross-field rejection, default back-compat, shared question/history rules
- `apps/backend/src/types/index.ts` — `AskAiRequest` (+ card-reference type) re-derived from the union
- `apps/backend/src/test-utils/requestBuilders.ts` — add a card-mode request builder; keep game-mode builders unchanged
- `apps/backend/src/app.contract.test.ts` — assert response contract + route unchanged across modes

## Notes

- Prefer `z.preprocess`/normalization to stamp `mode: "game"` when absent, then `z.discriminatedUnion("mode", [...])`, so the discriminator is always present at discrimination time while the wire field stays optional.
- Do not add prompt or provider behavior here; card-mode prompt assembly is Slice B. A card-mode request should validate even before Slice B exists (route may 501/no-op card mode until B lands, or B lands first behind the branch — coordinate at implement time).
