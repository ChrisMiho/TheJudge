---
name: thejudge-quality-check
description: >-
  Validates a DESIGN-BRIEF.md against PRD alignment and agent-readiness,
  producing a PASS/FAIL report — never a GAMEPLAN or slice docs. Use after
  refinement, before map-out, to gate whether a work package is ready to
  slice.
---

# TheJudge Quality Check

## Goal

Gate before map-out: report PASS or FAIL against PRD alignment and agent-readiness; fix only trivial issues with in-session user approval.

## Inputs

Work slug.

## Reads

1. `PRD/work/<slug>/DESIGN-BRIEF.md`
2. Affected `PRD/sections/*.md`
3. `PRD/sections/decisions.md` router, then relevant `PRD/sections/decisions/<domain>.md` files
4. `PRD/instructions/technical-design-rules.md`

## Checklist

- [ ] No contradictions with active `DEC-###` entries in the relevant `decisions/<domain>.md` files
- [ ] Current vocabulary is used in new/edited content
- [ ] Stack ordering is preserved if the feature touches stack/API/prompt
- [ ] `technical-design-rules.md` constraints are respected (one endpoint, no rules engine, etc.)
- [ ] Scope is implementable without hidden assumptions
- [ ] Open questions are reserved for genuine ambiguity only

## Gates

- Emit **PASS** or **FAIL** — never leave the call implicit.
- Trivial fixes only with in-session user approval; never write `GAMEPLAN.md` or slice docs; never write product code.
- Never guess an answer into committed scope.

## Next step

**PASS** → `/thejudge-map-out PRD/work/<slug>/` (or `/thejudge-map-out-parallel PRD/work/<slug>/` if slices look independent).
**FAIL** → `/thejudge-refinement PRD/work/<slug>/`, with the issue list included above the handoff.

(`$thejudge-*` in Codex.)
