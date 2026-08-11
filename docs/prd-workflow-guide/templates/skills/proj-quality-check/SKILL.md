---
name: proj-quality-check
description: >-
  Validates a DESIGN-BRIEF.md against PRD alignment and agent-readiness,
  producing a PASS/FAIL report — never a GAMEPLAN or slice docs. On FAIL sets
  STATUS.refining. Use after refinement, before map-out, to gate whether a work
  package is ready to slice.
---

# <Product> Quality Check

## Goal

Decide, in writing, whether the design brief is ready to be sliced.

## Inputs

A work package slug or path.

## Reads

- `PRD/work/<slug>/DESIGN-BRIEF.md`
- The `PRD/sections/` files the brief touches
- `PRD/sections/decisions.md` and the cited domain files
- `PRD/instructions/technical-design-rules.md`
- `PRD/instructions/workflow-reference.md`

## Writes

Almost nothing. Optionally record the verdict in the package README:

    ## Preparation gate

    - Quality-check: PASS | FAIL
    - Checked artifact: `DESIGN-BRIEF.md`
    - Findings: none | <complete issue list>

## Checklist

1. Does the brief contradict any confirmed `DEC`?
2. Does it use the project's established vocabulary and naming?
3. Does it respect every invariant in `technical-design-rules.md`?
4. Does it stay inside the stated non-goals?
5. Is it implementable as written — could an agent start without asking a
   question?
6. Are genuine ambiguities recorded as `Q-###` rather than assumed away?
7. Are the durable `PRD/sections/` updates consistent with the brief, including
   a router index row for every new decision?

## Verdict

Emit an explicit **PASS** or **FAIL**. Never leave it implied.

- PASS: the package stays at `refined`. Do not advance it to `active`.
- FAIL: set the package to `refining` and report the **complete** issue list.
  A partial list means a second failed round.

## Gates

- **Never fix anything.** A reviewer that is allowed to edit becomes an author
  and stops reviewing. Trivial corrections require explicit in-session user
  approval, or go back to refinement.
- Never write `GAMEPLAN.md`, slice documents, or product code.
- Never advance the package to `active`.

## Next step

PASS: run `/proj-map-out PRD/work/<slug>/`.

FAIL: run `/proj-refinement PRD/work/<slug>/`, with the issue list above the
handoff line.

(Codex: `$proj-*`.)
