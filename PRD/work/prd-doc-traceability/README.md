status: active

# prd-doc-traceability

Lightweight guardrails so PRD truth-layer docs reflect shipped reality, plus a consolidated feature/subsystem catalog so questions are answerable in one read without re-deriving behavior from code. Split out of `prompt-context-retrieval-tuning`.

## Source

- `IDEA.md` — original problem, desired outcome, non-goals, open questions
- `DESIGN-BRIEF.md` — refined scope, core decision, sequencing (authoritative)

## Refined decision (2026-06-18)

The "implementation-state signal" and the "system map" are two halves of one need — *answerability without code-diving*. They are consolidated into a single durable catalog at `sections/system-map.md` (`DEC-044`):

- two levels — subsystems, with features grouped under each
- each entry: `Status` (`shipped`/`planned`/`partial`), one-line summary, coarse file location, backing `DEC`/`REQ` IDs
- the shipped-vs-planned signal lives in the catalog only; existing `Status: confirmed/superseded` semantics are unchanged
- **additive-first**: build and validate the catalog before changing status conventions or reconciling stale navigation

## In scope

| Item | Lands in |
|------|----------|
| Feature/subsystem catalog | `sections/system-map.md` (new) |
| Lightweight promotion gate (flip to `shipped` only when code + receipt exist) | `instructions/doc-lifecycle.md` + `thejudge-cleanup` |
| Commit convention (conventional-commits-lite: `docs(prd):` vs `feat:`/`fix:`) | `instructions/agent-working-rules.md` |
| Drift reconciliation (`PRD/README.md` work table, inventory pointer, `planned` catalog entry for `DEC-043`/`REQ-031` — *not* a `Status:` field edit) — non-destructive, last | `PRD/README.md`, `sections/system-map.md` |

## Out of scope / deferred

- Deep per-subsystem behavior prose → split to `PRD/work/system-map-detail/` (do after `prompt-context-retrieval-tuning` lands).
- No per-decision → code-line links. No PRD folder teardown. No product/API/UI/prompt behavior change.

## Work package (mapped 2026-06-18)

See `GAMEPLAN.md` for architecture, the catalog skeleton, invariants, and the package-wide verification checklist.

### Slice table

| Slice | Objective | Status | Depends on | Doc |
|-------|-----------|--------|------------|-----|
| A | Build + validate `sections/system-map.md` catalog | planned | — | `slice-a-build-validate-catalog.md` |
| B | Promotion gate + commit convention in `instructions/` | planned | A | `slice-b-instructions-guardrails.md` |
| C | Drift reconciliation (README table, inventory pointer, `planned` entry) — final | planned | A, B | `slice-c-drift-reconciliation.md` |

Sequential by design: the additive-first directive (build and validate the catalog before changing status conventions or reconciling navigation) is the stated blocker against parallelizing.

### Implementation map

| Lands in | Slice |
|----------|-------|
| `PRD/sections/system-map.md` (new) | A (create), C (verify `planned` entry) |
| `PRD/instructions/doc-lifecycle.md` (promotion gate) | B |
| `PRD/instructions/agent-working-rules.md` (commit convention) | B |
| `.cursor/skills/thejudge-cleanup/SKILL.md` (gate reference, then `skills:ai-sync`) | B |
| `PRD/README.md` (work table + Section Inventory pointer) | C |

Documentation and process only — no product code, API, UI, or prompt change (`DEC-044`).

## Next

Implement via `thejudge-implement`, starting with slice A.
