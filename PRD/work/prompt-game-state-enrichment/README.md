status: deferred

# prompt-game-state-enrichment

Add `gameStateNotes` freeform field to `GameContext` for cross-card, transient game-state context the LLM cannot infer from submitted card oracle text. Surface it as a collapsible dropdown in the enrichment step and emit an `ADDITIONAL GAME STATE` prompt section. Also improve `contextNotes` placeholder copy for stack items.

> **Deprioritized 2026-06-18 — revisit later, after the other cleanup is done.** Sequencing: after `prompt-context-retrieval-tuning` and `consolidate-shared-logic`. This remains a valid gap — it captures *facts about the specific game* (priority holder, active replacement effects, pending delayed triggers, casting restrictions) that the retrieval work does **not** address; the two are complementary, not overlapping. Caveats to resolve on revisit: (1) usage value is uncertain — per-card transient state is already coverable via existing `contextNotes`, so the only genuinely new capability is the rarer cross-card/global case via a freeform field with live-entry friction; (2) `DEC-043` and `REQ-031` currently sit in the `sections/` truth layer marked confirmed with **no code behind them** — reconciling that truth-layer drift is tracked under `prd-doc-traceability`. If built later, also feed `gameStateNotes` into the System 3 retrieval query.

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
