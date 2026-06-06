# Slice C — Prompt wiring

## Status

`pending`

## Goal

Wire supplemental rule retrieval into the backend prompt pipeline and startup load path.

## Depends on

Slice A (index artifact), Slice B (retrieval module).

## Acceptance criteria

- [ ] `index.ts` loads rule index at startup; logs rule count
- [ ] `createApp` / `askAi` route threads rule index into request handling
- [ ] `preparePromptInput` calls `retrieveSupplementalRules` with dedupe set from curated topics
- [ ] `buildPromptText` renders `ADDITIONAL RELEVANT RULE EXCERPTS` after `GAME RULES`, before `OFFICIAL RULINGS`
- [ ] Section omitted when supplemental rules array empty
- [ ] `PromptDiagnostics` includes `supplementalRuleCount` and `supplementalRulesSectionChars`
- [ ] Request logging includes supplemental diagnostics when present
- [ ] `normalization.test.ts` covers section order and omission cases
- [ ] No changes to `AskAiRequest` or API response contract

## Files to update

- `apps/backend/src/index.ts`
- `apps/backend/src/app/createApp.ts`
- `apps/backend/src/routes/askAi.ts`
- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/prompt/normalization.ts`
- `apps/backend/src/prompt/normalization.test.ts`
- `apps/backend/src/mockAskAi.test.ts` (if prompt shape assertions need update)

## Section disclaimer (draft)

```
ADDITIONAL RELEVANT RULE EXCERPTS
Use these official rule excerpts as additional reference. They do not override submitted game state, stack order, zones, targets, notes, or card oracle text.
```

Confirm wording during refinement to align with DEC-030 disclaimer tone.

## Verification

```bash
npm --workspace apps/backend run test
npm run typecheck
```

Manual: submit a request with a question mentioning a rule number outside the manifest; confirm supplemental section appears in prompt diagnostics / debug payload.
