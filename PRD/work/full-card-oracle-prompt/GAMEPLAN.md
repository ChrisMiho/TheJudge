# GAMEPLAN — Full Card Oracle in Every Zone

## Architecture

### Data flow (target)

```
[Frontend buildAskAiRequest]
  └─ gameContext.zones[*] as ZoneCardItem[] (oracleText + metadata already present)

[buildPromptContext]
  ├─ orderedStack → normalize full card fields (unchanged path, richer oracle after limit bump)
  └─ populatedZones → normalizeZoneItem mirrors stack card normalization + owner

[buildPromptText]
  ├─ formatStackSection → shared formatZoneCardLines + stack-specific lines
  └─ formatNonStackZoneSections → shared formatZoneCardLines + zone item label + owner

[preparePromptInput / askAi route]
  └─ diagnostics track promptChars vs MAX_PROMPT_CHAR_BUDGET (now 1M)
  └─ exceedsBudget rejection retained but should not fire in normal use

[gameRulesRetrieval.buildQueryText]
  └─ includes non-stack oracleText + typeLine for supplemental rule scoring
```

### Key constraints

- Public API unchanged — no new request fields.
- Stack ordering semantics unchanged — `stack[0]` bottom, last entry top.
- `cardId` still omitted from prompt text (existing eval harness check).
- Limit constants remain exported and tested; only values change.

## File map

### Slice A — Context + formatting

| File | Change |
| --- | --- |
| `apps/backend/src/types/index.ts` | Extend `PromptContextZoneItem` with oracle + metadata fields |
| `apps/backend/src/prompt/context.ts` | `normalizeZoneItem()` mirrors stack normalization |
| `apps/backend/src/prompt/normalization.ts` | Shared `formatZoneCardLines()`; update stack + non-stack formatters; replace `details:` with `contextNotes:` |
| `apps/backend/src/prompt/context.test.ts` | Assert non-stack items retain oracle + metadata |
| `apps/backend/src/prompt/normalization.test.ts` | Assert non-stack prompt blocks include `oracleText:` |

### Slice B — Limits + retrieval + closeout

| File | Change |
| --- | --- |
| `apps/backend/src/prompt/normalization.ts` | Raise all `MAX_*` constants |
| `apps/backend/src/prompt/preparation.ts` | Rulings limit imports use new values |
| `apps/backend/src/gameRulesRetrieval.ts` | `buildQueryText()` includes non-stack oracle + typeLine |
| `apps/backend/src/prompt/normalization.test.ts` | Update truncation/budget tests for new caps |
| `apps/backend/src/app.contract.test.ts` | Adjust budget-exceed test |
| `apps/backend/src/eval/fixtures/*` | Regenerate goldens |
| `PRD/sections/integrations-and-data.md` | Document all-zone card metadata requirement |
| `PRD/sections/functional-requirements.md` | Update REQ-022 budget value references (if present) |

## Verification checklist

- [ ] `npm run test` passes (backend + frontend)
- [ ] `multi-zone` golden prompt includes `oracleText:` for hand and graveyard cards
- [ ] `full-context` golden prompt includes battlefield card oracle text
- [ ] Mock provider answer blob shows `oracleText:` under every zone section with cards
- [ ] `getPromptDiagnostics` still returns `promptChars`, `promptBudgetChars`, `exceedsBudget`
- [ ] Normal payloads do not return 400 for prompt budget exceed
- [ ] `scripts/prompt-preview.mjs` spot-check: non-stack-heavy phase (e.g. `main_1`) shows full oracle per card

## Regenerate goldens

```bash
UPDATE_CONTEXT_EVAL_FIXTURES=1 npm run test -- apps/backend/src/eval
```

Review diff for expected oracle additions in non-stack sections before committing.
