# Slice A — Backend Context + Prompt Formatting

## Status: pending

## Goal

Ensure every card in every populated zone carries full metadata through `PromptContext` and appears in the LLM prompt with an `oracleText:` line (and aligned card fields).

## Dependencies

- None

## Requirements

1. In `apps/backend/src/types/index.ts`, extend `PromptContextZoneItem` with the same card fields as `PromptContextStackItem` that apply outside the stack:
   - `oracleText`, `imageUrl`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`, `contextNotes`, `targets`
   - Keep `owner`; omit stack-only fields (`stackIndex`, `stackRole`, `manaSpent`)
2. In `apps/backend/src/prompt/context.ts`, update `normalizeZoneItem()` to mirror stack card normalization:
   - `oracleText: normalizeCardText(card.oracleText)`
   - Pass through optional metadata with same helpers as stack (`normalizeOptionalText`, `normalizeOptionalList`, `normalizeOptionalNumber`, `normalizeTargets`)
   - Preserve `owner` and optional `caster` when present on payload
3. In `apps/backend/src/prompt/normalization.ts`:
   - Extract shared helper (e.g. `formatZoneCardLines()`) for core card fields
   - Use helper in `formatStackSection()` and `formatNonStackZoneSections()`
   - Non-stack sections use zone item labels (`Hand 1`, `Battlefield 1`, …) and `owner:` instead of `caster:`
   - Replace `details:` with `contextNotes:` in non-stack output
   - Every card block must include `oracleText:` line

## Acceptance criteria

- [ ] `buildPromptContext` populates non-stack `PromptContextZoneItem` entries with `oracleText` matching request payload (whitespace-normalized)
- [ ] Prompt text for hand/battlefield/graveyard/exile/library/command cards includes `oracleText:` with card text
- [ ] Non-stack cards include `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`, `targets`, `contextNotes` lines (using `(none)` sentinels where empty, matching stack style)
- [ ] Stack section output unchanged in structure except shared helper refactor
- [ ] `apps/backend/src/prompt/context.test.ts` covers non-stack oracle retention
- [ ] `apps/backend/src/prompt/normalization.test.ts` covers non-stack `oracleText:` in assembled prompt
- [ ] No frontend or API contract changes

## Verification

```bash
npx vitest run apps/backend/src/prompt/context.test.ts
npx vitest run apps/backend/src/prompt/normalization.test.ts
```

Manual spot-check:

```bash
npm run prompt:preview
# Inspect a fixture with non-stack cards (e.g. multi-zone) for oracle lines in every zone section
```

## Files touched

- `apps/backend/src/types/index.ts`
- `apps/backend/src/prompt/context.ts`
- `apps/backend/src/prompt/normalization.ts`
- `apps/backend/src/prompt/context.test.ts`
- `apps/backend/src/prompt/normalization.test.ts`
