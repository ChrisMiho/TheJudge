# Slice A — Backend schema, types, and context normalization

## Status: planned

## Goal

Wire `gameStateNotes` through Zod validation, backend TypeScript types, and the `buildPromptContext()` normalization so the value is ready for prompt assembly in Slice B.

## Requirements

- REQ-031: `GameContext` includes optional `gameStateNotes?: string`; backend Zod schema validates when present (non-empty string after trim, control-character guardrails, no character length cap)
- DEC-043: field is freeform; no structured sub-fields

## Files touched

- `apps/backend/src/validation/askAiRequest.ts`
- `apps/backend/src/types/index.ts`
- `apps/backend/src/prompt/context.ts`
- `apps/backend/src/validation/askAiRequest.test.ts`

## Changes

### `validation/askAiRequest.ts`

Add to `gameContextSchema` (inside the `.object({...})` body, after `zones`):

```ts
gameStateNotes: z
  .string()
  .trim()
  .min(1)
  .refine(noControlCharacterGuardrail, "contains unsupported control characters")
  .optional()
```

No `.max()` — per DEC-043 there is no character length cap.

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
- [ ] `gameContextSchema` accepts a request without `gameStateNotes`
- [ ] `gameContextSchema` rejects `gameStateNotes: ""` (empty string fails `min(1)` after trim)
- [ ] `gameContextSchema` rejects `gameStateNotes` containing control characters
- [ ] `buildPromptContext()` returns `gameContext.gameStateNotes` when non-empty after normalization
- [ ] `buildPromptContext()` omits `gameStateNotes` when input is absent or whitespace-only

## Verification

```bash
cd apps/backend && npm run quality:check
```

Confirm new test cases pass in `askAiRequest.test.ts`.
