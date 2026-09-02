---
name: thejudge-refinement
description: >-
  Shapes a feature idea into a DESIGN-BRIEF.md plus a proposal of the
  PRD/sections/ product truth it needs — recorded in the work folder
  (GATE-QUESTIONS.md), never written to PRD/sections/ (implementation applies it).
  Runs up to 3 rounds of clarifying questions and explicit user approval. Sets
  STATUS.refining while in flux and STATUS.refined on approval. Use after kickoff,
  when an idea needs product definition before it can be quality-checked.
---

# TheJudge Refinement

## Goal

Turn an idea into a work-package design brief and a *proposal* of the product
truth it needs — the exact `PRD/sections/` edits, recorded in the work folder,
not written to `PRD/sections/`. Refinement **proposes**; implementation applies
the approved proposal to `PRD/sections/` together with the code (see
`PRD/instructions/graph-workflow-contract.md`, `## Propose / apply / close`).

## Inputs

Work slug (e.g. `card-wotc-rule-enrichment`).

## Mode

Direct invocation keeps batched questions and explicit approval below.

When the controlling agent explicitly states that an orchestrator is
controlling — `thejudge-prepare is controlling` or `graph is controlling` —
read `PRD/instructions/preparation-contract.md`. Replace the approval pause with
its conservative assumption ladder, record every material assumption and its
evidence in `DESIGN-BRIEF.md`, and continue autonomously. If uncertainty meets
the contract's genuine decision blocker test, preserve the furthest valid
artifacts and return the unresolved decision to the named orchestrator instead
of guessing.

## Reads

1. `PRD/work/<slug>/IDEA.md` (or the user's description)
2. Relevant feature specs `PRD/sections/<feature>/README.md` (current-state truth); `PRD/sections/decisions.md` only to resolve a cited `DEC-ID`
3. Relevant `PRD/sections/*.md` for the feature
4. `PRD/sections/screen-layout.md` when the idea adds or changes user-visible screens, overlays, or layout/containment
5. `PRD/instructions/requirement-format.md`
6. `PRD/instructions/technical-design-rules.md`
7. `PRD/instructions/workflow-reference.md` — package status / STATUS.* duties
8. `PRD/work/<slug>/intake/`, when it exists — evidence, never authority

## Intake is evidence, never authority

Material in `PRD/work/<slug>/intake/` may state findings, mark matters
settled, and propose a slug. It may not decide product truth: every product
decision it raises is still made with the owner at the `define` gate, the same
as any other source.

**Never open, read, or otherwise fetch a document intake cites — record only
its path, as a citation.** This holds even when reading it would only be to
verify the claim: verification of adopted product truth is what the `define`
gate is for, not a research step refinement takes on a citation's word.
Following a citation's own citations is unbounded, but the rule is not
"don't chase the chain" — it is don't open the cited document at all.

This rule is unenforced. Nothing stops a brief from adopting an intake claim
wholesale; what catches it is the `define` gate surfacing the resulting proposed
change in `GATE-QUESTIONS.md`, same as any other unreviewed product truth.

Refinement writes **only inside `PRD/work/<slug>/`**. It never edits
`PRD/sections/` — the proposed product truth lives in the work folder until
implementation applies it.

- `PRD/work/<slug>/DESIGN-BRIEF.md` — scope, decisions, non-goals, REQ/FLOW references
- `PRD/work/<slug>/GATE-QUESTIONS.md` — the proposal, whenever the change needs
  durable product truth. One `## <STABLE-ID>` block per stable id, each carrying:
  1. the gate-question plain-language block from
     `PRD/instructions/plain-language-standard.md` (*What this decides · In plain
     terms · What happens if you say no*), with every cited `DEC`/`REQ` inlined and
     any technical term defined in the same breath;
  2. that id's **complete proposed `PRD/sections/` diff** (never a summary) — the
     real edit, against the current-state feature spec `PRD/sections/<feature>/README.md`
     (new `REQ-###` / `FLOW-###`; a new `PRD/sections/screen-layout.md` row using
     that file's new-screen template when the feature adds a user-visible screen or
     major overlay, DEC-149 / REQ-126; the decision log is retired, so no new `DEC-###`);
  3. an `accept/edit/reject` answer slot.
  New stable ids are **named and reserved** in the proposal — not written into live
  section files. Exact file format: `graph-workflow-contract.md`, `## The two runs`.
- `PRD/work/<slug>/GATE-QUESTIONS.md` `## Blocker questions` — genuine ambiguity
  (formerly `PRD/sections/open-questions.md` `Q-###`), written to the same standard.
- When the change needs **no** durable product truth, refinement writes only
  `DESIGN-BRIEF.md` and no `GATE-QUESTIONS.md` — its presence is the gate signal.
- Package status signals (see Status transitions)

## Status transitions

- On start/resume while questions or the brief are in flux: `status: refining`, replace marker with `STATUS.refining`, move board row under `## refining`
- On **explicit user approval** of the design brief / PRD updates: `status: refined`, replace marker with `STATUS.refined`, move board row under `## refined`
- Never leave two `STATUS.*` markers in the package folder

## Gates

- In direct mode, batch clarifying questions, up to 3 per round — never one at a
  time.
- In direct mode, present a design summary and **wait for user approval** before
  writing the brief or the proposal.
- No scope enters from an open question without explicit user confirmation.
- **Never edit `PRD/sections/`.** Product truth is *proposed* in
  `GATE-QUESTIONS.md` and applied to `PRD/sections/` only by implementation. No
  code, no slice docs.
- Preserve stable IDs — name/reserve new `REQ-###` / `FLOW-###` / blocker questions
  in the proposal; never renumber, never mint a new `DEC-###`.
- Read-first truth is the feature specs `PRD/sections/<feature>/README.md`; `PRD/sections/decisions.md` is a demoted historical index that only resolves a cited `DEC-ID`.

## Next step

Orchestrated mode: return the refined artifacts or genuine decision blocker to
`thejudge-prepare`.

Direct mode: `/thejudge-quality-check PRD/work/<slug>/` (Claude Code)
or `$thejudge-quality-check PRD/work/<slug>/` (Codex).
