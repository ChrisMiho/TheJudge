# ask-ai-wait-animation

## Status

`active` — GAMEPLAN and slices written; ready to implement.

## Slug

`ask-ai-wait-animation`

## Summary

Frontend-only decrypt wait UX: replace the submit form with an animated waiting panel, elapsed timer, and escalating MTG/tech humor messages at configured second thresholds. Motion stays CSS-only per NFR-006.

## Decisions captured

- **Layout:** Replace the decrypt form while waiting (card list / wizard above stays visible).
- **Tone:** Mix of MTG-themed and generic tech humor.
- **Motion:** Lightweight CSS keyframes only—no animation dependencies.

## Work package files

| File | Purpose |
|------|---------|
| [IDEA.md](./IDEA.md) | Problem, outcome, non-goals |
| [DESIGN-BRIEF.md](./DESIGN-BRIEF.md) | Scope, decisions, threshold copy, PRD references |
| [GAMEPLAN.md](./GAMEPLAN.md) | Architecture, data flow, verification checklist |

## Slices

| Slice | File | Status | Depends on |
|-------|------|--------|------------|
| A | [slice-a-wait-stages-lib.md](./slice-a-wait-stages-lib.md) | done | — |
| B | [slice-b-css-keyframes.md](./slice-b-css-keyframes.md) | done | — |
| C | [slice-c-elapsed-timer-hook.md](./slice-c-elapsed-timer-hook.md) | done | A |
| D | [slice-d-waiting-panel-component.md](./slice-d-waiting-panel-component.md) | done | A, B, C |
| E | [slice-e-enrichment-integration.md](./slice-e-enrichment-integration.md) | done | D |

A and B can be implemented in parallel. Ship gates are in Slice E.

## Threshold stages (draft copy)

| Threshold | Message |
|-----------|---------|
| 0s | Consulting the stack… |
| 3s | Priority is passing to the LLM. |
| 8s | The judge is reading every layer. Twice. |
| 15s | Still waiting? The servers are scrying 1. |
| 25s | At this point we're basically in a MUD subgame. |
| 40s | If this were F6, we'd have resolved by now. |

## Related constraints

- [NFR-006](../../sections/non-functional-requirements.md) — minimal animation complexity (CSS-only carve-out may be needed on ship)
- [NFR-002](../../sections/non-functional-requirements.md) — normal AI latency target under 3 seconds

## On ship

Promote a short functional requirement for decrypt-wait UX, then delete this folder per [doc-lifecycle.md](../../instructions/doc-lifecycle.md).
