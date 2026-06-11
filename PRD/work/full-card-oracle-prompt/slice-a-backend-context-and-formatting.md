# Slice A — Backend Context + Prompt Formatting

## Status: pending

## Goal

Ensure every card in every populated zone carries full metadata through `PromptContext` and appears in the LLM prompt with an `oracleText:` line and aligned card fields matching the stack section style.

This slice delivers the **functional fix**. Limit bumps and golden regen happen in slice B.

## Dependencies

- None

## Background

Today `normalizeZoneItem()` in `context.ts` returns only:

```typescript
{
  cardId, name, owner?, details?, targets
}
```

Stack mapping in the same file returns 15+ fields including `oracleText`. `formatNonStackZoneSections()` never renders oracle.

## Implementation steps

### Step 1 — Extend `PromptContextZoneItem` type

File: `apps/backend/src/types/index.ts`

Add fields to match stack item (minus stack-only):

- `oracleText: string`
- `imageUrl: string`
- `manaCost: string`
- `manaValue: number`
- `typeLine: string`
- `colors: string[]`
- `supertypes: string[]`
- `subtypes: string[]`
- `contextNotes?: string`

Remove `details?: string` — use `contextNotes` consistently. Do **not** add `caster` — non-stack cards are not cast; the field has no semantic meaning in non-stack zones.

### Step 2 — Rewrite `normalizeZoneItem()`

File: `apps/backend/src/prompt/context.ts`

Mirror the stack card mapping in `buildPromptContext` (lines ~148–168):

```typescript
function normalizeZoneItem(card: ZoneCardItem): PromptContextZoneItem | null {
  const name = normalizeWhitespace(card.name);
  if (name.length === 0) return null;

  const owner = card.owner;
  return {
    cardId: normalizeWhitespace(card.cardId),
    name,
    oracleText: normalizeCardText(card.oracleText),
    imageUrl: normalizeOptionalText(card.imageUrl),
    manaCost: normalizeOptionalText(card.manaCost),
    manaValue: normalizeOptionalNumber(card.manaValue),
    typeLine: normalizeOptionalText(card.typeLine),
    colors: normalizeOptionalList(card.colors),
    supertypes: normalizeOptionalList(card.supertypes),
    subtypes: normalizeOptionalList(card.subtypes),
    owner: owner && normalizeWhitespace(owner).length > 0 ? owner : undefined,
    targets: normalizeTargets(card.targets),
    contextNotes: normalizeOptionalText(card.contextNotes) || undefined
  };
}
```

Reuse existing private helpers — do not duplicate normalization logic in a new module.

### Step 3 — Extract shared card line formatter

File: `apps/backend/src/prompt/normalization.ts`

Add internal helper, e.g. `formatZoneCardMetadataLines()`, producing:

```
manaCost: ...
manaValue: ...
typeLine: ...
colors: ...
supertypes: ...
subtypes: ...
targets: ...
contextNotes: ...
oracleText: ...
```

Use existing `formatList`, `formatTargets`, `formatPlayerRef`, `truncatePromptLabel` for notes/targets (limits raised in slice B; behavior unchanged in slice A).

### Step 4 — Refactor `formatStackSection()`

- Keep `ZONE: STACK (BOTTOM TO TOP)` header
- Keep per-item header: `Stack item N (role)`
- Keep `card:`, `caster:`, `manaSpent:`
- Delegate shared metadata lines to helper

**Regression guard:** stack golden structure should match except shared refactor — slice B regens goldens.

### Step 5 — Refactor `formatNonStackZoneSections()`

- Keep zone headers (`ZONE: HAND`, etc.)
- Keep item labels (`Hand 1`, `Battlefield 1`, …)
- Emit `name:` (not `card:`)
- Emit `owner:` via `formatPlayerRef`
- Do **not** emit `caster:` — non-stack cards are not cast
- Delegate shared metadata lines to helper
- **Remove `details:`** — use `contextNotes:`

### Step 6 — Tests

File: `apps/backend/src/prompt/context.test.ts`

Add case with populated `hand` and `battlefield` zones:

- Assert `context.populatedZones[0].items[0].oracleText` equals normalized payload oracle
- Assert `manaCost`, `typeLine`, `colors` preserved

File: `apps/backend/src/prompt/normalization.test.ts`

Add case building prompt from context with hand + stack:

- Assert `ZONE: HAND` section contains `oracleText:` with expected substring
- Assert `contextNotes:` present (not `details:`)
- Assert stack section still contains `oracleText:`

Use fixture-like data from `multi-zone.fixture.json` for realism.

## Edge cases

| Case | Expected behavior |
| --- | --- |
| `oracleText: ""` | `oracleText: (none) — no oracle text recorded for this card` |
| Missing optional metadata | `(none)` sentinels matching stack style |
| Card with only name + cardId | Still renders block; oracle line present |
| `owner` unset | `owner: (none)` |
| `caster` on non-stack card | Omit entirely — not a valid field for non-stack zones |

## Acceptance criteria

- [ ] `PromptContextZoneItem` includes full card metadata fields; `details` removed
- [ ] `buildPromptContext` populates non-stack items with `oracleText` from request (whitespace-normalized)
- [ ] Prompt text for hand/battlefield/graveyard/exile/library/command includes `oracleText:` per card
- [ ] Non-stack cards include metadata lines matching stack sentinels
- [ ] Non-stack uses `contextNotes:` not `details:`
- [ ] Stack section structure preserved (role, caster, manaSpent)
- [ ] `context.test.ts` and `normalization.test.ts` cover non-stack oracle
- [ ] No frontend, API, or Zod schema changes
- [ ] `npm run test` passes for touched test files (goldens may fail until slice B — expected)

## Verification

```bash
npx vitest run apps/backend/src/prompt/context.test.ts
npx vitest run apps/backend/src/prompt/normalization.test.ts
npx tsc --noEmit -p apps/backend
```

Manual (after slice A, before golden regen):

```bash
# Temporarily log prompt in a unit test or use node REPL with buildPromptText
# Confirm multi-zone-shaped context shows hand oracle
```

## Files touched

- `apps/backend/src/types/index.ts`
- `apps/backend/src/prompt/context.ts`
- `apps/backend/src/prompt/normalization.ts`
- `apps/backend/src/prompt/context.test.ts`
- `apps/backend/src/prompt/normalization.test.ts`

## Out of scope for this slice

- Raising `MAX_*` constants (slice B)
- Regenerating eval goldens (slice B)
- `buildQueryText` update (slice B — depends on `contextNotes` on zone items)
- PRD promotion (slice C)
