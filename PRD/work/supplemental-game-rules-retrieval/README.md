# supplemental-game-rules-retrieval

## Status

`draft` — work package written from planning session; ready for refinement.

## Slug

`supplemental-game-rules-retrieval`

## Summary

Backend-only feature: keep the 23 curated game-rules topics as an **always-included baseline** (DEC-030), and add up to **5 context-retrieved supplemental Comprehensive Rules excerpts** per request by searching a new rule-level index built from the same WotC CR source.

Inspired by cousin PR [#30](https://github.com/ChrisMiho/TheJudge/pull/30) retrieval scoring — adapted into the existing `data:build` pipeline, not merged wholesale.

## Mental model

| Artifact | Role |
|----------|------|
| `gameRulesByTopic.json` | **Always-included collection** — all 23 curated topics on every prompt |
| `gameRulesRuleIndex.json` | **Searchable DB** — full CR parsed into individual rules; queried per request using context clues |

## Work package files

| File | Purpose |
|------|---------|
| [IDEA.md](./IDEA.md) | Problem, outcome, non-goals |
| [DESIGN-BRIEF.md](./DESIGN-BRIEF.md) | Scope, decisions, data strategy, PRD references |
| [GAMEPLAN.md](./GAMEPLAN.md) | Architecture, data flow, verification checklist |

## Slices

| Slice | File | Status | Depends on |
|-------|------|--------|------------|
| A | [slice-a-unified-cr-parser.md](./slice-a-unified-cr-parser.md) | pending | — |
| B | [slice-b-retrieval-module.md](./slice-b-retrieval-module.md) | pending | A |
| C | [slice-c-prompt-wiring.md](./slice-c-prompt-wiring.md) | pending | A, B |
| D | [slice-d-eval-and-closeout.md](./slice-d-eval-and-closeout.md) | pending | C |

Slice A must land before B/C. B and C can overlap once the index artifact exists.

## Related decisions (existing)

- [DEC-029](../../sections/decisions.md) — per-card WotC Oracle rulings (Scryfall lookup; unchanged)
- [DEC-030](../../sections/decisions.md) — curated CR topic baseline (unchanged; this feature adds a layer on top)

## On ship

Promote DEC-031 (or amend DEC-030), update integrations-and-data and functional requirements, write receipt, close PR #30 with credit to retrieval spike, then delete this folder per [doc-lifecycle.md](../../instructions/doc-lifecycle.md).
