# Slice B — Enrichment pre-decrypt summary

## Status: planned

## Goal

Before **Decrypt Stack**, show users what will be sent (zone card counts + dynamic fallback question hint) so battlefield-only walkthroughs do not feel like a silent failure when targets were skipped.

## Depends on

- [slice-a-context-aware-fallback.md](slice-a-context-aware-fallback.md) — `resolveFallbackQuestion` exported from `flow.ts`

## Requirements

### [`EnrichmentStep.tsx`](../../../apps/frontend/src/components/EnrichmentStep.tsx)

Add a **Sending to TheJudge** summary visible when the question form is shown (`showQuestionForm`):

1. **Populated zones** — for each zone in `CANONICAL_ZONE_ORDER` with `(zones[zone]?.length ?? 0) > 0`, show `{ZONE_LABELS[zone]}: N card(s)`.
2. **Selected-but-empty stack** (optional line) — when `gameContext.selectedZones` includes `"stack"` and stack has zero cards, show muted text: `Stack: selected, no cards added`.
3. **Dynamic fallback hint** — replace hardcoded `DEFAULT_QUESTION_FALLBACK = "Resolve the stack"` display with `resolveFallbackQuestion(zones)` when question is blank.

Example layout (copy may vary; keep mobile-first):

```text
Sending to TheJudge
  Battlefield: 2 cards
  Stack: selected, no cards added

No question? Uses fallback: "Explain the interaction with the provided game state"
```

### Behavior constraints (locked)

- **Do not** disable Decrypt Stack when stack is empty but other zones have cards
- **Do not** require targets or stack cards in this slice
- Summary is informational only

### [`App.tsx`](../../../apps/frontend/src/App.tsx)

No logic changes required unless props need `selectedZones` passed explicitly — `gameContext` already available on `EnrichmentStep`.

## Tests

**[`App.test.tsx`](../../../apps/frontend/src/App.test.tsx)** — new or extended case:

1. `main_1` flow, battlefield cards only, finish enrichment wizard, skip targets
2. Assert summary shows battlefield count before decrypt
3. Assert fallback hint text is **not** `"Resolve the stack"`
4. Submit (mock) and assert payload `question` matches board fallback

**Component-level** (optional if App tests cover it):

- EnrichmentStep renders summary lines for mixed populated/empty selected zones

## Acceptance criteria

- [ ] User sees zone counts before Decrypt Stack
- [ ] Blank-question hint reflects slice A fallback (not always `"Resolve the stack"`)
- [ ] Skipping targets does not affect summary content
- [ ] `npm run quality:check` passes

## Files

| Action | Path |
| --- | --- |
| Edit | `apps/frontend/src/components/EnrichmentStep.tsx` |
| Edit | `apps/frontend/src/App.test.tsx` |

## Non-goals

- Submit blocking for empty stack
- Changing wizard target UX
