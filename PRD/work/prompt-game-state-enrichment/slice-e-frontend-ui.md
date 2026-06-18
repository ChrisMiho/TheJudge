# Slice E — Frontend UI: collapsible dropdown and contextNotes placeholder

## Status: planned

## Goal

Surface `gameStateNotes` as a collapsible dropdown in the enrichment step's question form area. Update `contextNotes` placeholder copy for stack items to name transient card-level annotations. This is the final slice.

## Dependencies

- Slice D must be complete (state and prop wiring in App.tsx)

## Requirements

- REQ-031: UI surface is a collapsible dropdown within the context collection step; collapsed by default; expanding reveals an optional textarea with placeholder copy naming example use cases
- REQ-017 (amended): stack item `contextNotes` UI uses placeholder copy that names transient card-level annotations: kicker or buyback paid, X value used, counters added this turn, tapped status, gained abilities this turn

## Files touched

- `apps/frontend/src/components/EnrichmentStep.tsx`

## Changes

### `EnrichmentStep.tsx`

#### New props

```ts
type EnrichmentStepProps = {
  ...
  gameStateNotes: string;
  onGameStateNotesChange: (value: string) => void;
};
```

#### Collapsible `ADDITIONAL GAME STATE` dropdown

Add local state for expanded toggle:

```ts
const [gameStateNotesExpanded, setGameStateNotesExpanded] = useState(false);
```

In the question form area (the `showQuestionForm` block, after the populated zone summaries panel and before the optional question textarea), insert the collapsible:

```tsx
<div className="rounded-2xl border border-slate-700/70 bg-slate-900/55">
  <button
    type="button"
    onClick={() => setGameStateNotesExpanded((v) => !v)}
    className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-300"
  >
    <span>Additional game state (optional)</span>
    <span>{gameStateNotesExpanded ? "▲" : "▼"}</span>
  </button>
  {gameStateNotesExpanded && (
    <div className="border-t border-slate-700/50 px-4 pb-4 pt-3">
      <textarea
        aria-label="Additional game state notes"
        value={gameStateNotes}
        onChange={(e) => onGameStateNotesChange(e.target.value)}
        rows={4}
        placeholder="Active replacement or continuous effects, who has priority, pending delayed triggers, casting restrictions…"
        className="w-full resize-none rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
      />
    </div>
  )}
</div>
```

The dropdown collapses again if the user navigates away and returns (local state resets), which is fine — it is collapsed by default per REQ-031.

Do not show the dropdown while a conversation is active (in the `isConversationActive` branch, `gameStateNotes` is part of the frozen context and editing is disabled per DEC-040).

#### `contextNotes` placeholder update for stack items

In `renderCardRow`, the `contextNotes` textarea currently has:

```tsx
placeholder="Optional notes about this card's context"
```

Update it so stack cards get a distinct placeholder:

```tsx
placeholder={
  isStackZone
    ? "Kicker or buyback paid, X value used, counters added this turn, tapped status, gained abilities this turn…"
    : "Optional notes about this card's context"
}
```

## Acceptance criteria

- [ ] Enrichment step question form shows "Additional game state (optional)" toggle button, collapsed by default
- [ ] Clicking the toggle expands the textarea with the correct placeholder copy
- [ ] Typing in the textarea updates `gameStateNotes` state (visible in prop)
- [ ] Closing and reopening the dropdown re-collapses (local state)
- [ ] The `gameStateNotes` dropdown is not shown in the `isConversationActive` (conversation thread) view
- [ ] Stack card `contextNotes` textarea shows the transient-annotation placeholder
- [ ] Non-stack card `contextNotes` textarea shows the generic placeholder (unchanged)
- [ ] `npm run quality:check` passes in `apps/frontend`
- [ ] Manual browser test: fill game state notes → Decrypt Stack → mock response includes `ADDITIONAL GAME STATE` in the embedded prompt

## Verification

```bash
cd apps/frontend && npm run quality:check
```

Manual check:
1. Start app (`npm run dev`)
2. Complete game setup → zone confirmation → zone collection
3. On enrichment step: confirm the "Additional game state (optional)" toggle is visible and collapsed
4. Expand it → verify placeholder copy
5. Type notes → Decrypt Stack (mock provider) → inspect mock `answer` field for `ADDITIONAL GAME STATE` section before `PHASE GUIDANCE`
6. Also confirm a stack card's context notes shows the transient-annotation placeholder

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged — `POST /api/ask-ai` request shape gains `gameContext.gameStateNotes` as optional per DEC-043; success and error response shapes unchanged
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/prompt-game-state-enrichment/` ready to delete

## PRD promotion checklist

- [ ] `sections/decisions.md` — DEC-043 already added (by refinement skill)
- [ ] `sections/functional-requirements.md` — REQ-031 added; REQ-017 amended (by refinement skill)
- [ ] `sections/integrations-and-data.md` — `GameContext` model updated with `gameStateNotes`; prompt assembly rules updated (by refinement skill)
- [ ] Verify that all three sections still match the implemented behavior after Slice E
