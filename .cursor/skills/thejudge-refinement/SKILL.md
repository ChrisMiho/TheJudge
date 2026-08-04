---
name: thejudge-refinement
description: >-
  Shapes a feature idea into a DESIGN-BRIEF.md plus aligned PRD/sections/
  updates, after up to 3 rounds of clarifying questions and explicit user
  approval. Sets STATUS.refining while in flux and STATUS.refined on approval.
  Use after kickoff, when an idea needs product definition before it can be
  quality-checked.
---

# TheJudge Refinement

## Goal

Turn an idea into approved product truth in `PRD/sections/` and a work-package design brief.

## Inputs

Work slug (e.g. `card-wotc-rule-enrichment`).

## Reads

1. `PRD/work/<slug>/IDEA.md` (or the user's description)
2. `PRD/sections/decisions.md` router, then relevant `PRD/sections/decisions/<domain>.md` files
3. Relevant `PRD/sections/*.md` for the feature
4. `PRD/instructions/requirement-format.md`
5. `PRD/instructions/technical-design-rules.md`
6. `PRD/instructions/workflow-reference.md` — package status / STATUS.* duties

## Writes

- `PRD/work/<slug>/DESIGN-BRIEF.md` — scope, decisions, non-goals, REQ/FLOW references
- Updates to `PRD/sections/` (new `REQ-###`, `FLOW-###`; promote new `DEC-###` bodies into the relevant `PRD/sections/decisions/<domain>.md` file and add the router index line in `PRD/sections/decisions.md`)
- `PRD/sections/open-questions.md` only for genuine ambiguity (`Q-###`)
- Package status signals (see Status transitions)

## Status transitions

- On start/resume while questions or the brief are in flux: `status: refining`, replace marker with `STATUS.refining`, move board row under `## refining`
- On **explicit user approval** of the design brief / PRD updates: `status: refined`, replace marker with `STATUS.refined`, move board row under `## refined`
- Never leave two `STATUS.*` markers in the package folder

## Gates

- Batch clarifying questions, up to 3 per round — never one at a time.
- Present a design summary and **wait for user approval** before writing any PRD artifact.
- No scope enters from an open question without explicit user confirmation.
- No code, no slice docs.
- Preserve stable IDs — add new `REQ-###` / `FLOW-###` / `DEC-###` / `Q-###`; never renumber.
- `PRD/sections/decisions.md` is the read-first override router; DEC bodies live in `decisions/<domain>.md`.

## Next step

`/thejudge-quality-check PRD/work/<slug>/` (Cursor / Claude Code) or `$thejudge-quality-check PRD/work/<slug>/` (Codex).
