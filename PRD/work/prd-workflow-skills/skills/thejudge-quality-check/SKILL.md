---
name: thejudge-quality-check
description: >-
  Validates PRD alignment and agent-readiness before slicing work. Use after
  refinement, before map-out.
disable-model-invocation: true
---

# TheJudge Quality Check

## Goal

Gate before `thejudge-map-out`. Report pass/fail; fix only trivial issues with user approval.

## Inputs

User provides work slug.

## Reads

1. `PRD/work/<slug>/DESIGN-BRIEF.md`
2. Affected `PRD/sections/*.md`
3. `PRD/sections/decisions.md`
4. `PRD/instructions/workflow-reference.md` (checklist section)

## Checklist

- [ ] No contradictions with active `DEC-###` entries
- [ ] No retired terminology (MVP1/2, Phase A/B, Bedrock) in new/edited content
- [ ] Stack ordering consistent if feature touches stack/API/prompt
- [ ] `technical-design-rules.md` constraints respected (one endpoint, no rules engine, etc.)
- [ ] Scope is implementable without hidden assumptions
- [ ] Open questions only for real ambiguity

## Output

Short report:

- **PASS** or **FAIL**
- Issues list (file + line or section reference)
- Optional: trivial fixes applied (only if user approved in session)

## Do not

- Write GAMEPLAN or slice docs
- Write code
- Guess answers into committed scope

## Handoff

On PASS, user runs `thejudge-map-out` with same slug.
