---
name: proj-refinement
description: >-
  Shapes a feature idea into a DESIGN-BRIEF.md plus aligned PRD/sections/
  updates, after clarifying questions and explicit user approval. Sets
  STATUS.refining while in flux and STATUS.refined on approval. Use after
  kickoff, when an idea needs product definition before it can be
  quality-checked.
---

# <Product> Refinement

## Goal

Turn an idea into an approved product definition, and write the durable truth it
implies into `PRD/sections/` at the same time.

## Inputs

A work package slug or path.

## Reads

- `PRD/work/<slug>/IDEA.md` and `README.md`
- `PRD/sections/decisions.md` plus the relevant `decisions/<domain>.md` files
- The section files the idea touches
- `PRD/instructions/requirement-format.md`
- `PRD/instructions/technical-design-rules.md`
- `PRD/instructions/workflow-reference.md`

## Writes

- `PRD/work/<slug>/DESIGN-BRIEF.md`
- `PRD/sections/` updates — new or amended `REQ`/`FLOW`/`DEC` entries, plus the
  router index row for every new decision
- `PRD/sections/open-questions.md` — only for genuine ambiguity
- The three status signals

## Procedure

1. Set the package to `refining` before doing anything else.
2. Read the inputs. Identify what is already decided — an idea that conflicts
   with a confirmed `DEC` is a conversation, not a brief.
3. Ask clarifying questions in batches of at most three, for at most three
   rounds. Batching matters: one question at a time turns refinement into an
   interrogation.
4. Present a design summary and **wait for explicit user approval.** Do not
   write PRD updates before approval.
5. On approval, write the brief and the durable section updates together.
   Every new decision gets a body in its domain file *and* a router index row.
6. Set the package to `refined`.

## Status transitions

- Start or resume → `refining`
- Explicit user approval of the brief → `refined`

## Gates

- Never write `GAMEPLAN.md` or slice documents. That is map-out's job.
- Never write product code.
- Never write durable `PRD/sections/` changes before approval.
- Record genuine ambiguity as a `Q-###`; never resolve it by assumption in a
  brief that claims to be approved.

## Next step

Run `/proj-quality-check PRD/work/<slug>/` to gate the brief before slicing.
(Codex: `$proj-quality-check PRD/work/<slug>/`.)
