# Slice A — Backend schema, types, and context normalization

## Status: planned

## Goal

Wire `gameStateNotes` through Zod validation, backend TypeScript types, and the `buildPromptContext()` normalization so the value is ready for prompt assembly in Slice B.

## Requirements

- REQ-031: `GameContext` includes optional `gameStateNotes?: string`; backend Zod schema validates when present (trimmed, control-character guardrails, 2000-character cap matching `oracleText`); blank/whitespace is accepted and omitted by normalization rather than rejected
- DEC-043: field is freeform; no structured sub-fields

## Files touched

- `apps/backend/src/validation/askAiRequest.ts`
- `apps/backend/src/types/index.ts`
- `apps/backend/src/prompt/context.ts`
- `apps/backend/src/validation/askAiRequest.test.ts`

## Changes

### `validation/askAiRequest.ts`

Add to `gameContextSchema` (inside the `.object({...})` body, after `zones`). Reuse
the existing `optionalBoundedTextWithEmptyDefault` helper (`askAiRequest.ts:49`) —
the same one `manaCost`/`imageUrl`/`typeLine` use — rather than hand-rolling a chain:

```ts
gameStateNotes: optionalBoundedTextWithEmptyDefault(2000)
```

Why this helper:
- No `.min(1)`, so blank/whitespace is **accepted** (omission semantics per DEC-043),
  then dropped in the normalization step below — not rejected with a 400.
- `2000` cap matches `oracleText` (`boundedText(2000)`), keeping `gameStateNotes`
  inside the codebase's "all text is bounded" invariant while staying generous for
  freeform notes.
- Applies the same `noControlCharacterGuardrail` refinement as other text fields.
- The helper's `.default("")` means an absent field parses to `""`; the normalization
  below omits it, so `PromptContext.gameContext.gameStateNotes` ends up absent.

### `types/index.ts`

Add `gameStateNotes?: string` to `PromptContext["gameContext"]`:

```ts
export type PromptContext = {
  finalQuestion: string;
  gameContext: {
    playerCount: number;
    players: GamePlayerContext[];
    turnPhase: TurnPhase;
    combatStep?: CombatStep;
    activePlayer?: PlayerLabel;
    selectedZones: ZoneId[];
    gameStateNotes?: string;   // ← new
  };
  ...
```

### `prompt/context.ts`

In `buildPromptContext()`, add `gameStateNotes` to `normalizedGameContext`:

```ts
const rawNotes = normalizeOptionalText(gameCtx.gameStateNotes);
const normalizedGameContext = {
  ...
  selectedZones: gameCtx.selectedZones,
  ...(rawNotes.length > 0 ? { gameStateNotes: rawNotes } : {})
};
```

`normalizeOptionalText` collapses whitespace; if the result is empty after normalization, the field is omitted.

## Acceptance criteria

- [ ] `gameContextSchema` accepts a request with `gameStateNotes: "some notes"`
- [ ] `gameContextSchema` accepts a request without `gameStateNotes` (parses to `""`)
- [ ] `gameContextSchema` accepts `gameStateNotes: ""` / whitespace-only (no `min(1)`; omission is handled in normalization, not by rejection)
- [ ] `gameContextSchema` rejects `gameStateNotes` longer than 2000 characters
- [ ] `gameContextSchema` rejects `gameStateNotes` containing control characters
- [ ] `buildPromptContext()` returns `gameContext.gameStateNotes` when non-empty after normalization
- [ ] `buildPromptContext()` omits `gameStateNotes` when input is absent, empty, or whitespace-only

## Verification

```bash
cd apps/backend && npm run quality:check
```

Confirm new test cases pass in `askAiRequest.test.ts`.
