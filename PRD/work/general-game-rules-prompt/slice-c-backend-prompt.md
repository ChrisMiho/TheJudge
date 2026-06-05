# Slice C — Backend prompt integration and 35k cap

## Status: planned

## Goal

Load the committed game-rules artifact at startup and render the full **GAME RULES (reference)** section in every assembled prompt, between zone sections and OFFICIAL RULINGS, with `MAX_PROMPT_CHAR_BUDGET` raised to 35,000.

## Requirements

1. [REQ-022](../../sections/functional-requirements.md) — artifact loads at startup; every prompt includes all topics in stable `id` order when artifact present.
2. [REQ-022](../../sections/functional-requirements.md) — section omitted only when artifact missing/empty (warning logged).
3. [REQ-012](../../sections/functional-requirements.md), [REQ-019](../../sections/functional-requirements.md) — no `AskAiRequest`, Zod schema, or frontend changes.
4. [DEC-030](../../sections/decisions.md) — disclaimer text; section before OFFICIAL RULINGS; diagnostics include `gameRulesSectionChars` and `gameRulesTopicCount`.
5. [DEC-025](../../sections/decisions.md) — static MTG REFERENCE block unchanged.
6. [DEC-029](../../sections/decisions.md) — OFFICIAL RULINGS behavior unchanged; game rules inserted before it.

## Acceptance criteria

- [ ] `apps/backend/src/gameRules.ts` exports `loadGameRulesTopics()`, `formatGameRulesSection()`, types for topic entries.
- [ ] `index.ts` loads artifact at startup; logs topic count (mirror `cardRulingsCardCount` pattern).
- [ ] `createApp.ts` / `askAi.ts` / `preparation.ts` thread loaded topics into `preparePromptInput` → `buildPromptText`.
- [ ] Prompt section order: … zone sections → **GAME RULES (reference)** → OFFICIAL RULINGS → SCOPE → QUESTION.
- [ ] Disclaimer present:

  ```text
  Use these general Magic rules as shared vocabulary. They do not override the user's submitted game state, stack order, zones, targets, notes, or card oracle text.
  ```

- [ ] `MAX_PROMPT_CHAR_BUDGET = 35000` in `normalization.ts`.
- [ ] `getPromptDiagnostics` includes `gameRulesSectionChars` and `gameRulesTopicCount` when game rules are rendered.
- [ ] Missing/empty artifact → no section, one startup warning (test with temp path).
- [ ] Unit tests: load, format order, disclaimer, omission on empty, diagnostics fields.
- [ ] `normalization.test.ts` updated for new section placement and 35k budget.
- [ ] `app.behavior.test.ts` / provider tests still pass with game rules in prompt.

## Verification

```bash
npm --workspace apps/backend run test -- src/gameRules.test.ts
npm --workspace apps/backend run test -- src/prompt/normalization.test.ts
npm --workspace apps/backend run test -- src/providers/createAskAiProvider.test.ts
npm --workspace apps/backend run test -- src/app.behavior.test.ts
npm run typecheck
```

Manual: start backend (`npm run dev:mock`), submit a fixture via mock provider logs or existing test — confirm prompt contains `GAME RULES (reference)` before `OFFICIAL RULINGS`.

## Files touched

- `apps/backend/src/gameRules.ts` (new)
- `apps/backend/src/gameRules.test.ts` (new)
- `apps/backend/src/index.ts`
- `apps/backend/src/app/createApp.ts`
- `apps/backend/src/routes/askAi.ts`
- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/prompt/normalization.ts`
- `apps/backend/src/prompt/normalization.test.ts`
- `apps/backend/src/app.behavior.test.ts` (if prompt assertions need game rules)
- `apps/backend/src/mockAskAi.test.ts` (if diagnostics assertions needed)

## Tests

- `gameRules.test.ts`: load from fixture file, stable sort by `id`, format includes all topic titles, empty file → empty array + warning path.
- `normalization.test.ts`: section order index check (GAME RULES before OFFICIAL RULINGS before SCOPE); near-cap stack still under 35k with real artifact.
- Thread game rules through `preparePromptInput` in preparation tests if present, or extend provider test.

## Notes

- Do not cap or trim game-rules section in v1 — full library always included when artifact present.
- Eval golden updates deferred to Slice D intentionally.
