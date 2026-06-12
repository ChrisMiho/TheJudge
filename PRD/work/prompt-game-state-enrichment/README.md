status: active

# prompt-game-state-enrichment

Add `gameStateNotes` freeform field to `GameContext` for cross-card, transient game-state context the LLM cannot infer from submitted card oracle text. Surface it as a collapsible dropdown in the enrichment step and emit an `ADDITIONAL GAME STATE` prompt section. Also improve `contextNotes` placeholder copy for stack items.

## Slice table

| Slice | Name | Status | Dependencies |
|-------|------|--------|--------------|
| A | Backend schema, types, context normalization | planned | — |
| B | Backend prompt assembly (`ADDITIONAL GAME STATE`) | planned | A |
| C | Eval harness checks and game-state-notes fixture | planned | B |
| D | Frontend types and state wiring | planned | — (parallel with A) |
| E | Frontend UI: collapsible dropdown + contextNotes placeholder | planned | D |

## Implementation map

- Slices A and D are independent and can run in parallel.
- B follows A; C follows B.
- E follows D.
- All backend slices (A→B→C) can ship independently of frontend slices (D→E).

## PRD sections updated (by refinement)

- `sections/decisions.md` — DEC-043
- `sections/functional-requirements.md` — REQ-031 (new); REQ-017 (amended)
- `sections/integrations-and-data.md` — `GameContext` model; prompt assembly rules

## Source

- `IDEA.md` — original idea capture
- `feedback.md` — AI-generated feedback identifying 6 categories of missing prompt context
- `DESIGN-BRIEF.md` — scoped design decisions
- `GAMEPLAN.md` — architecture and verification checklist
