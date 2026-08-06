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

## Mode

Direct invocation keeps batched questions and explicit approval below.

When the controlling agent explicitly states `thejudge-prepare is controlling`,
read `PRD/instructions/preparation-contract.md`. Replace the approval pause with
its conservative assumption ladder, record every material assumption and its
evidence in `DESIGN-BRIEF.md`, and continue autonomously. If uncertainty meets
the contract's genuine decision blocker test, preserve the furthest valid
artifacts and return the unresolved decision to `thejudge-prepare` instead of
guessing.

## Reads

1. `PRD/work/<slug>/IDEA.md` (or the user's description)
2. `PRD/sections/decisions.md` router, then relevant `PRD/sections/decisions/<domain>.md` files
3. Relevant `PRD/sections/*.md` for the feature
4. `PRD/sections/screen-layout.md` when the idea adds or changes user-visible screens, overlays, or layout/containment
5. `PRD/instructions/requirement-format.md`
6. `PRD/instructions/technical-design-rules.md`
7. `PRD/instructions/workflow-reference.md` — package status / STATUS.* duties

## Writes

- `PRD/work/<slug>/DESIGN-BRIEF.md` — scope, decisions, non-goals, REQ/FLOW references
- Updates to `PRD/sections/` (new `REQ-###`, `FLOW-###`; promote new `DEC-###` bodies into the relevant `PRD/sections/decisions/<domain>.md` file and add the router index line in `PRD/sections/decisions.md`)
- When the feature introduces a user-visible screen or major overlay: a new row in `PRD/sections/screen-layout.md` using that file’s new-screen template (DEC-149 / REQ-126)
- `PRD/sections/open-questions.md` only for genuine ambiguity (`Q-###`)
- Package status signals (see Status transitions)

## Status transitions

- On start/resume while questions or the brief are in flux: `status: refining`, replace marker with `STATUS.refining`, move board row under `## refining`
- On **explicit user approval** of the design brief / PRD updates: `status: refined`, replace marker with `STATUS.refined`, move board row under `## refined`
- Never leave two `STATUS.*` markers in the package folder

## Gates

- In direct mode, batch clarifying questions, up to 3 per round — never one at a
  time.
- In direct mode, present a design summary and **wait for user approval** before
  writing any PRD artifact.
- No scope enters from an open question without explicit user confirmation.
- No code, no slice docs.
- Preserve stable IDs — add new `REQ-###` / `FLOW-###` / `DEC-###` / `Q-###`; never renumber.
- `PRD/sections/decisions.md` is the read-first override router; DEC bodies live in `decisions/<domain>.md`.

## Next step

Orchestrated mode: return the refined artifacts or genuine decision blocker to
`thejudge-prepare`.

Direct mode: `/thejudge-quality-check PRD/work/<slug>/` (Cursor / Claude Code)
or `$thejudge-quality-check PRD/work/<slug>/` (Codex).
