# Slice B — Limit Constants + Retrieval + Tests + PRD

## Status: pending

## Goal

Raise all prompt-size and truncation constants to effectively unlimited test values (keeping infrastructure), improve supplemental-rules query signal for non-stack cards, refresh tests and eval goldens, and draft PRD section updates.

## Dependencies

- **Slice A must land first** — zone items need `oracleText` / `contextNotes` on `PromptContextZoneItem` before `buildQueryText` can use them.

## Part 1 — Limit constants

File: `apps/backend/src/prompt/normalization.ts`

Add a single shared constant and update all `MAX_*` to reference it:

```typescript
export const EFFECTIVELY_UNLIMITED_CHARS = 1_000_000;
```

Then update each exported constant:

| Constant | Target |
| --- | ---: |
| `MAX_PROMPT_CHAR_BUDGET` | `EFFECTIVELY_UNLIMITED_CHARS` |
| `PROMPT_BUDGET_NEAR_LIMIT_BUFFER` | `10_000` |
| `MAX_ORACLE_TEXT_CHARS` | `EFFECTIVELY_UNLIMITED_CHARS / 10` |
| `MAX_CONVERSATION_HISTORY_CHARS` | `EFFECTIVELY_UNLIMITED_CHARS` |
| `MAX_CONTEXT_DETAILS_CHARS` | `EFFECTIVELY_UNLIMITED_CHARS / 10` |
| `MAX_CONTEXT_NOTES_CHARS` | `EFFECTIVELY_UNLIMITED_CHARS / 10` |
| `MAX_TARGET_LABEL_CHARS` | `EFFECTIVELY_UNLIMITED_CHARS / 10` |
| `MAX_RULINGS_SECTION_CHARS` | `EFFECTIVELY_UNLIMITED_CHARS` |
| `MAX_RULING_COMMENT_CHARS` | `EFFECTIVELY_UNLIMITED_CHARS / 10` |
| `MAX_RULINGS_PER_CARD` | `100` |

Update inline cap in `formatConversationHistorySection`:

```typescript
truncateOracleText(t.content, EFFECTIVELY_UNLIMITED_CHARS / 10)  // was 2000
```

**Do not remove:**

- `truncateOracleText`, `truncateConversationHistory`, `truncateWithSuffix` in rulings
- `getPromptDiagnostics` fields
- `askAi.ts` `exceedsBudget` rejection block

### Test updates for limits

File: `apps/backend/src/prompt/normalization.test.ts`

| Test | Update |
| --- | --- |
| `"truncates long oracle text..."` | Pass explicit low `maxChars` to `truncateOracleText(long, 500)` to keep truncation behavior testable |
| `"normalizes and truncates card text"` | Same — test normalization separately from default cap |
| `"stays under configured prompt budget..."` | Update expected `MAX_PROMPT_CHAR_BUDGET` to `1_000_000` |
| Budget diagnostics tests | Update hardcoded offsets from 35000 to 1_000_000 |

File: `apps/backend/src/prompt/context.test.ts`

| Test | Update |
| --- | --- |
| `"truncates long oracle text"` on stack | Assert against explicit cap or new 100k default |

## Part 2 — Supplemental rules retrieval

File: `apps/backend/src/gameRulesRetrieval.ts`

Replace non-stack loop in `buildQueryText()`:

```typescript
for (const zone of context.populatedZones) {
  for (const item of zone.items) {
    const itemParts = [zone.zoneId, item.name, item.typeLine, item.oracleText];
    if (item.contextNotes) {
      itemParts.push(item.contextNotes);
    }
    parts.push(itemParts.join(" "));
  }
}
```

Remove references to `item.details`.

Add/update unit test if `gameRulesRetrieval.test.ts` exists; otherwise add minimal test in `gameRules.test.ts` or new file verifying query includes non-stack oracle substring.

## Part 3 — Contract test

File: `apps/backend/src/app.contract.test.ts`

Current test `"returns validation error when prompt exceeds max budget"` builds a huge payload and expects 400.

**Options (pick one at implementation):**

1. **Scale payload** — increase card count / oracle length until prompt exceeds 1M (heavy, slow).
2. **Remove test** — rely on unit tests for budget diagnostics (weaker).
3. **Recommended:** keep test but mock/spy `MAX_PROMPT_CHAR_BUDGET` in test only via vitest mock of normalization module.

Document chosen approach in slice C receipt.

## Part 4 — Eval harness (optional but recommended)

File: `apps/backend/src/eval/contextEvaluationHarness.ts`

Add check:

```typescript
function checkOracleTextInAllZones(context: PromptContext, promptText: string): EvaluationCheckResult
```

Logic:

- For each stack item: prompt in STACK section contains `oracleText:` after card name
- For each non-stack item: prompt in that zone section contains `oracleText:` after item name
- Fail if oracle line missing or if `...(truncated)` appears for fixture cards with short oracle (optional sub-check)

Add to `evaluateScenario` checks array.

Update `checklist-report.golden.txt` via fixture regen.

## Part 5 — Golden fixture regeneration

```bash
UPDATE_CONTEXT_EVAL_FIXTURES=1 npm run test -- apps/backend/src/eval
```

### Expected prompt golden changes

| Fixture | Expected diff |
| --- | --- |
| `multi-zone.prompt.golden.txt` | `oracleText:` under HAND and GRAVEYARD sections |
| `full-context.prompt.golden.txt` | Battlefield Rhystic Study oracle block |
| `follow-up-chat.prompt.golden.txt` | Non-stack oracle if any |
| `battlefield-skip.prompt.golden.txt` | Battlefield card oracle |
| `cascade-keyword.prompt.golden.txt` | Battlefield creature oracle |
| `ambiguous-wording.prompt.golden.txt` | Battlefield card oracle |
| All other fixtures with non-stack cards | Same pattern |

### Expected context golden changes

`*.context.golden.json` — `populatedZones[].items[]` gain full metadata fields matching stack shape.

Review diffs carefully:

- Oracle text must be **verbatim** from fixture JSON (not paraphrased)
- No accidental reorder of prompt sections
- `PHASE GUIDANCE` blocks unchanged except where fixture phase differs

## Part 6 — PRD draft edits (promote in slice C)

### `sections/integrations-and-data.md`

Under “The backend should include”, replace implicit stack-only oracle with:

- populated zone sections include the same per-card metadata block as stack (oracle text, mana cost/value, type line, colors, supertypes/subtypes, targets, context notes)
- stack section additionally includes caster, mana spent, and stack role
- non-stack sections use owner and zone item labels

Add note: truncation/budget constants temporarily set to high test values; diagnostics unchanged.

### `sections/functional-requirements.md`

Add REQ-030 (from DESIGN-BRIEF draft).

Update REQ-022 bullet: `MAX_PROMPT_CHAR_BUDGET` is 1_000_000 (temporary testing value).

### `sections/decisions.md`

Add DEC-042 (from DESIGN-BRIEF draft).

Add note under DEC-030: caps raised for testing; revisit after latency sampling.

## Acceptance criteria

- [ ] All `MAX_*` constants raised per table; helpers and diagnostics remain
- [ ] Typical fixture cards show no `...(truncated)` on oracle lines
- [ ] `buildQueryText` uses `oracleText` and `contextNotes` for non-stack items
- [ ] `app.contract.test.ts` passes with chosen budget test strategy
- [ ] Eval goldens regenerated; non-stack sections include `oracleText:`
- [ ] Optional `oracle-text-all-zones` harness check passes
- [ ] `npm run test` passes at repo root
- [ ] PRD draft edits ready for slice C promotion (may land in slice B or C)

## Verification

```bash
npm run test
UPDATE_CONTEXT_EVAL_FIXTURES=1 npm run test -- apps/backend/src/eval
npx vitest run apps/backend/src/app.contract.test.ts
npm run prompt:preview
npx tsc --noEmit -p apps/backend
npx tsc --noEmit -p apps/frontend
```

## Files touched

- `apps/backend/src/prompt/normalization.ts`
- `apps/backend/src/prompt/preparation.ts` (imports only if needed)
- `apps/backend/src/gameRulesRetrieval.ts`
- `apps/backend/src/prompt/normalization.test.ts`
- `apps/backend/src/prompt/context.test.ts`
- `apps/backend/src/app.contract.test.ts`
- `apps/backend/src/eval/contextEvaluationHarness.ts` (optional)
- `apps/backend/src/eval/fixtures/*`
- `PRD/sections/integrations-and-data.md` (draft)
- `PRD/sections/functional-requirements.md` (draft)
- `PRD/sections/decisions.md` (draft)
