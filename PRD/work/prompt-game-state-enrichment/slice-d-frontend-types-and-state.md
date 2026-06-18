# Slice D — Frontend types and state wiring

## Status: planned

## Goal

Add `gameStateNotes?: string` to the frontend `GameContext` type and wire state through `App.tsx` so the value flows into the API request payload.

## Dependencies

None — can run in parallel with Slice A.

## Requirements

- REQ-031: `GameContext` includes optional `gameStateNotes?: string`
- DEC-043: field is included in the request payload when non-empty; omitted when absent or blank

## Files touched

- `apps/frontend/src/types.ts`
- `apps/frontend/src/App.tsx`

## Changes

### `types.ts`

Add to `GameContext`:

```ts
export type GameContext = {
  ...
  gameStateNotes?: string;   // ← new
};
```

### `App.tsx`

Add `gameStateNotes` state:

```ts
const [gameStateNotes, setGameStateNotes] = useState<string>("");
```

Pass to `EnrichmentStep` (prop additions for Slice E):

```ts
<EnrichmentStep
  ...
  gameStateNotes={gameStateNotes}
  onGameStateNotesChange={setGameStateNotes}
/>
```

There are **two** identical `updatedContext` build sites, both of which must include
`gameStateNotes`:
- `handleDecryptStack` (`App.tsx:286`)
- `handleRetry` (`App.tsx:307`)

Each currently reads `const updatedContext: GameContext = { ...gameContext, zones: zoneCardsByZone };`
Add the conditional spread to both:

```ts
const updatedContext: GameContext = {
  ...gameContext,
  zones: zoneCardsByZone,
  ...(gameStateNotes.trim().length > 0 ? { gameStateNotes: gameStateNotes.trim() } : {})
};
```

The frozen-context snapshot used for follow-ups is captured automatically by
`useAskAiSubmitOrchestration` (`App.tsx:17`, exposed as `frozenGameContext` at `App.tsx:128`)
from the first decrypt's `payload.gameContext` — since `gameStateNotes` is now part of
`updatedContext`, it is frozen alongside zones with no extra wiring.

`buildAskAiRequest` in `lib/contextFlow/flow.ts:102` takes the full `GameContext` and
spreads `...gameContext` into the payload, so `gameStateNotes` passes through automatically
when present. No change needed to `buildAskAiRequest` or its `ZoneAskAiPayload` type. (Note:
the `Pick<Partial<GameContext>, ...>` at `flow.ts:7` is `FlowNavigationState` for `canAdvance`
only — it does not gate the request payload and does not need `gameStateNotes`.)

### `start over` behavior

`gameStateNotes` state does NOT reset on start over (consistent with other enrichment fields: zones, question, and cards are preserved per REQ-029 / DEC-040). The textarea value is preserved.

## Acceptance criteria

- [ ] `GameContext` type compiles with `gameStateNotes?: string` added
- [ ] `gameStateNotes` state is initialized as `""`
- [ ] When `gameStateNotes.trim()` is non-empty at submit time, `updatedContext.gameStateNotes` is set to the trimmed value
- [ ] When `gameStateNotes.trim()` is empty, `updatedContext.gameStateNotes` is omitted (not `""`; field absent)
- [ ] `buildAskAiRequest` passes `gameStateNotes` through from `GameContext` without code change
- [ ] `npm run quality:check` passes in `apps/frontend`

## Verification

```bash
cd apps/frontend && npm run quality:check
```

Inspect the browser network tab after a Decrypt Stack submission to confirm `gameContext.gameStateNotes` appears in the request body when the textarea is filled.
