status: active

# prompt-context-retrieval-tuning

Draw a clear boundary between the card-agnostic curated rule baseline (System 2) and the card/question-driven adaptive retrieval (System 3), make each pull the right rules, and prove it with the eval harness.

## Artifacts

- `IDEA.md` — original problem statement and locked boundary decision
- `DESIGN-BRIEF.md` — approved scope, decisions, REQ references, non-goals
- `GAMEPLAN.md` — architecture, data flow, verification checklist

## Boundary decision (locked 2026-06-18)

Boundary is **by signal source** (see `IDEA.md` for detail):

- **System 2** = card-agnostic game state only (`turnPhase`, `combatStep`, populated zone presence). Curated, deterministic.
- **System 3** = all card/question-driven retrieval, including oracle-text keywords (strong scoring weight). Adaptive catch-all.

## Slice table

| Slice | Name | Status | Dependencies |
|-------|------|--------|--------------|
| A | System 2 conditional topic selection | planned | — |
| B | System 3 IDF scoring, boosts, keyword vocabulary | planned | A |
| C | Eval harness relevance checks + labeled fixtures | planned | A, B |
| D | Retrieval relevance report script | planned | C |
| E | Ship gates | planned | A, B, C, D |

## Implementation map

- **A → B → C → D → E** sequential. System 3's exclusion pool depends on System 2 selection; labeled fixtures depend on both scorers.
- No parallel slices — coupling is intentional (DEC-045 / DEC-046).
- Eval golden regeneration is intentional in Slice C after A+B land.
- `sections/system-map.md` catalog updates deferred to cleanup (promotion gate).

## The three retrieval systems

- **System 1 — official card rulings.** `apps/backend/src/cardRulings.ts` + `apps/backend/data/cardRulingsByOracleId.json`. Out of scope.
- **System 2 — curated general rules.** `apps/backend/src/gameRules.ts` + manifest. **Slice A:** always-on core + conditional expansion per DEC-045.
- **System 3 — supplemental retrieval.** `apps/backend/src/gameRulesRetrieval.ts`. **Slice B:** relevance-aware scoring per DEC-046.

Orchestration: `apps/backend/src/prompt/preparation.ts`. Prompt assembly: `apps/backend/src/prompt/normalization.ts`.

## PRD sections updated (by refinement)

- `sections/decisions.md` — DEC-045, DEC-046, DEC-047
- `sections/functional-requirements.md` — REQ-022 (amended), REQ-032 (new)
- `sections/integrations-and-data.md` — game-rules assembly
- `sections/open-questions.md` — Q-001

## Related

- `prd-doc-traceability` — PRD/documentation hygiene (split out)
- `prompt-game-state-enrichment` — deferred; complementary after this work

## Next

Implement Slice A (`thejudge-implement`).
