# Slice B — Backend prompt assembly (`ADDITIONAL GAME STATE`)

## Status: planned

## Goal

Emit an `ADDITIONAL GAME STATE` section in `buildPromptText()` when `gameStateNotes` is present and non-empty. Section is positioned after `GENERAL GAME CONTEXT` and before `PHASE GUIDANCE`. Omit entirely when absent or blank.

## Dependencies

- Slice A must be complete (`PromptContext.gameContext.gameStateNotes` available)

## Requirements

- REQ-031: backend prompt emits `ADDITIONAL GAME STATE` section positioned after `GENERAL GAME CONTEXT` and before `PHASE GUIDANCE`; section omitted entirely when `gameStateNotes` is absent or blank after trim
- DEC-043: section label is `ADDITIONAL GAME STATE`; content is the raw `gameStateNotes` string

## Files touched

- `apps/backend/src/prompt/normalization.ts`
- `apps/backend/src/prompt/normalization.test.ts`

## Changes

### `prompt/normalization.ts`

Add `formatGameStateNotesSection()`:

```ts
export function formatGameStateNotesSection(gameStateNotes: string | undefined): string {
  if (!gameStateNotes || gameStateNotes.trim().length === 0) return "";
  return ["ADDITIONAL GAME STATE", gameStateNotes.trim()].join("\n");
}
```

Integrate into `buildPromptText()`. NOTE: these sections are built as a single
array literal (`normalization.ts:450-458`), **not** separate `sections.push(...)`
calls. The relevant slice of the literal:

```ts
const sections = [
  ...
  "MTG REFERENCE",
  MTG_PROMPT_REFERENCE,
  "",
  "GENERAL GAME CONTEXT",
  formatGameContext(context),
  "",
  "PHASE GUIDANCE",
  phaseGuidance
];
```

Hoist the formatted section to a `const` before the array, then insert it as a
conditional spread between `formatGameContext(context)` and `PHASE GUIDANCE` —
mirroring the existing `conversationHistory` spread idiom (`normalization.ts:446`):

```ts
const gameStateNotesSection = formatGameStateNotesSection(context.gameContext.gameStateNotes);

const sections = [
  ...
  "GENERAL GAME CONTEXT",
  formatGameContext(context),
  ...(gameStateNotesSection ? ["", gameStateNotesSection] : []),
  "",
  "PHASE GUIDANCE",
  phaseGuidance
];
```

(The trailing `sections.push("", zoneSections)` etc. calls below the literal are
unchanged.)

### `prompt/normalization.test.ts`

Add tests:

1. `formatGameStateNotesSection` returns empty string when `undefined`
2. `formatGameStateNotesSection` returns empty string when blank/whitespace-only
3. `formatGameStateNotesSection` returns `"ADDITIONAL GAME STATE\n<content>"` for a non-empty value
4. `buildPromptText` includes `ADDITIONAL GAME STATE` before `PHASE GUIDANCE` when `gameStateNotes` is set
5. `buildPromptText` excludes `ADDITIONAL GAME STATE` when `gameStateNotes` is absent

## Acceptance criteria

- [ ] `formatGameStateNotesSection(undefined)` returns `""`
- [ ] `formatGameStateNotesSection("   ")` returns `""`
- [ ] `formatGameStateNotesSection("Priority: Player 2")` returns `"ADDITIONAL GAME STATE\nPriority: Player 2"`
- [ ] `buildPromptText` with `gameStateNotes` set contains `ADDITIONAL GAME STATE` between `GENERAL GAME CONTEXT` and `PHASE GUIDANCE`
- [ ] `buildPromptText` without `gameStateNotes` does not contain `ADDITIONAL GAME STATE`
- [ ] Existing prompt golden diffs only change for the new section (position check harness unaffected since section is absent in existing fixtures)

## Verification

```bash
cd apps/backend && npm run quality:check
```

Manually verify prompt section order in test output or via `npm run prompt:preview` after adding `gameStateNotes` to a fixture.
