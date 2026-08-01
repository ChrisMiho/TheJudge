# Slice A — Lookup-mode request contract

## Status: done

## Goal

Add a `mode`-discriminated `AskAiRequest` union (`"game" | "lookup"`) to
`POST /api/ask-ai`, with `mode: "lookup"` carrying an optional single-card
reference and no `gameContext` (REQ-072 / DEC-106).

## Requirements

1. `askAiRequestSchema` (`apps/backend/src/validation/askAiRequest.ts`) becomes a
   `mode`-discriminated union. `mode` is optional; when absent it normalizes to
   `"game"` before discrimination (use `z.preprocess` to stamp the default, then
   `z.discriminatedUnion("mode", [...])`) so existing `{ question, gameContext,
   conversationHistory? }` payloads validate and behave byte-for-byte unchanged.
2. `game` branch: `{ mode?: "game", question, gameContext, conversationHistory? }`
   — today's `gameContextSchema` and validation rules (REQ-019) unchanged; `card`
   is rejected (the object is `.strict()`).
3. `lookup` branch: `{ mode: "lookup", question, card?: lookupCardReferenceSchema,
   conversationHistory? }` — `gameContext` is rejected (`.strict()`).
4. New `lookupCardReferenceSchema`: `{ cardId, name, oracleText, imageUrl?,
   manaCost?, manaValue?, typeLine?, colors?, supertypes?, subtypes? }`. Reuse the
   exact field-level validators `zoneCardItemSchema` already uses (`boundedText`
   sizes, `optionalBoundedTextWithEmptyDefault`, array bounds) so limits stay
   consistent, but the schema is `.strict()` with **no** `targets`, `caster`,
   `owner`, `contextNotes`, or `manaSpent` fields — a lookup card carries no
   game-state annotations.
5. `question` character cap (300) and the shared control-character guardrail
   (`boundedText`) are identical across both branches.
6. `conversationHistory` stays optional in both modes and validates via the
   existing `conversationHistorySchema` (DEC-038 rules: non-empty array,
   alternating roles starting `user`, ending `assistant`, per-message/count caps)
   unchanged.
7. `AskAiRequest` (`apps/backend/src/types/index.ts`) is re-derived
   (`z.infer<typeof askAiRequestSchema>`) so it becomes the union type
   automatically; no hand-written duplicate type.
8. `askAiResponseSchema` and `askAiErrorSchema` are unchanged — success `{ answer
   }` / error shapes stay identical for both modes and both providers.
9. `POST /api/ask-ai` route path and provider boundary are unchanged; this slice
   touches validation/types only, not `routes/askAi.ts` behavior (the route
   already calls `askAiRequestSchema.safeParse` generically).

## Acceptance criteria

- [ ] A `{ question, gameContext }` payload with no `mode` field validates
      identically to today (existing `askAiRequest.test.ts` cases pass unchanged).
- [ ] `{ mode: "game", question, gameContext }` validates the same as the
      mode-absent form.
- [ ] `{ mode: "lookup", question }` (no `card`) validates.
- [ ] `{ mode: "lookup", question, card: { cardId, name, oracleText, ... } }`
      validates and normalizes optional card fields with the same defaults
      `zoneCardItemSchema` uses.
- [ ] `{ mode: "lookup", question, gameContext }` is rejected (cross-field
      rejection).
- [ ] `{ mode: "game", question, gameContext, card }` is rejected.
- [ ] `{ mode: "lookup", question, card: { ...extraField: "x" } }` is rejected
      (`.strict()` catches `targets`/`caster`/`owner`/`contextNotes`/`manaSpent`
      leaking onto a lookup card).
- [ ] `question` over 300 chars or containing a control character is rejected in
      both branches identically.
- [ ] `conversationHistory` validation (alternation, first/last role, caps) is
      identical in both branches — reuse the existing test cases parametrized
      over `mode`.
- [ ] `npm --workspace apps/frontend run typecheck` and `npm --workspace
      apps/backend run typecheck` stay clean (no frontend type consumes
      `AskAiRequest` directly yet, so this should be a no-op check).

## Verification

```bash
npm --workspace apps/backend run test -- src/validation
npm run typecheck
```

## Files touched

- `apps/backend/src/validation/askAiRequest.ts`
- `apps/backend/src/validation/askAiRequest.test.ts`
- `apps/backend/src/types/index.ts`

## Notes

- This is genuinely new work, not an extension of shipped code — `mode` does not
  exist in the current schema at all (verified in GAMEPLAN.md's external
  prerequisites section). Do not look for a `mode: "card"` or `mode: "rules"`
  branch to migrate; go straight to the unified `"game" | "lookup"` shape.
- `Q-003` (optional lightweight game context on the `card` field) is explicitly
  out of scope — do not add a `gameContext`-shaped field to
  `lookupCardReferenceSchema`.
- Land this first; Slices B, D, and E all depend on the request/type shape here.
