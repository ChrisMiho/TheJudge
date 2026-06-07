# Slice B — Limit Constants + Retrieval + Tests + PRD

## Status: pending

## Goal

Raise all prompt-size and truncation constants to effectively unlimited test values (keeping infrastructure), improve supplemental-rules query signal for non-stack cards, refresh tests/goldens, and align PRD docs.

## Dependencies

- Slice A (non-stack items must carry oracle in `PromptContext` before retrieval query update)

## Requirements

### Limit constants

In `apps/backend/src/prompt/normalization.ts`, raise:

| Constant | Target |
| --- | ---: |
| `MAX_PROMPT_CHAR_BUDGET` | 1,000,000 |
| `MAX_ORACLE_TEXT_CHARS` | 100,000 |
| `MAX_CONVERSATION_HISTORY_CHARS` | 1,000,000 |
| `MAX_CONTEXT_DETAILS_CHARS` | 100,000 |
| `MAX_CONTEXT_NOTES_CHARS` | 100,000 |
| `MAX_TARGET_LABEL_CHARS` | 100,000 |
| Per-turn cap in `formatConversationHistorySection` | 100,000 |

In `normalization.ts` exports used by `preparation.ts`:

| Constant | Target |
| --- | ---: |
| `MAX_RULINGS_SECTION_CHARS` | 1,000,000 |
| `MAX_RULING_COMMENT_CHARS` | 100,000 |
| `MAX_RULINGS_PER_CARD` | 100 |

Keep budget rejection in `apps/backend/src/routes/askAi.ts` and `getPromptDiagnostics` behavior unchanged.

### Supplemental rules retrieval

In `apps/backend/src/gameRulesRetrieval.ts`, update `buildQueryText()` so non-stack zone items contribute `oracleText` and `typeLine` to the query string (not just `name` and `details`).

### Tests

- Update `normalization.test.ts` truncation/budget tests for new cap values (or pass explicit low overrides when testing truncation behavior)
- Update `app.contract.test.ts` — budget-exceed test must not assume 35k cap; adjust payload or test approach
- Regenerate eval goldens: `*.prompt.golden.txt`, `*.context.golden.json`, `checklist-report.golden.txt`

Fixtures expected to gain non-stack oracle lines: `multi-zone`, `full-context`, `follow-up-chat`, and any fixture with populated non-stack zones.

### PRD alignment

- Update `PRD/sections/integrations-and-data.md` — full card metadata block in all zone sections
- Update `PRD/sections/functional-requirements.md` REQ-022 budget references if they cite 35000
- Optional: add decision note in `PRD/sections/decisions.md` for all-zone card metadata policy

## Acceptance criteria

- [ ] All `MAX_*` constants raised per table above; truncation helpers and diagnostics remain
- [ ] Normal test payloads do not hit oracle truncation suffix `...(truncated)` for typical cards
- [ ] `app.contract.test.ts` passes with updated budget expectations
- [ ] Eval harness `prompt-under-budget` check passes with 1M cap
- [ ] Golden fixtures regenerated; non-stack sections include `oracleText:` lines
- [ ] `buildQueryText` includes non-stack oracle text when zone items have it
- [ ] `npm run test` passes at repo root
- [ ] PRD sections updated to document all-zone oracle requirement and temporary high limit values

## Verification

```bash
npm run test
UPDATE_CONTEXT_EVAL_FIXTURES=1 npm run test -- apps/backend/src/eval
npx vitest run apps/backend/src/app.contract.test.ts
```

## Files touched

- `apps/backend/src/prompt/normalization.ts`
- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/gameRulesRetrieval.ts`
- `apps/backend/src/prompt/normalization.test.ts`
- `apps/backend/src/app.contract.test.ts`
- `apps/backend/src/eval/fixtures/*`
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/decisions.md` (optional)
