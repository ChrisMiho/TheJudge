---
name: thejudge-cleanup
description: >-
  Post-ship evaluation — promote PRD truth, write durable receipt, delete
  ephemeral PRD/work/ folder. Use when a feature is done or for corpus hygiene.
disable-model-invocation: true
---

# TheJudge Cleanup

## Goal

Close out a work package: verify what's done, promote durable docs, receipt, delete `PRD/work/<slug>/`.

## Inputs

User provides work slug (or `prd-workflow-skills` for this rollout's self-closeout).

## Reads

1. `PRD/work/<slug>/README.md` + `GAMEPLAN.md` + slice docs
2. `PRD/instructions/doc-lifecycle.md`
3. `PRD/stories/DEFINITION-OF-DONE.md`
4. Relevant codebase paths from slice implementation maps

## Process

1. Compare each slice acceptance criteria vs codebase — mark done/pending.
2. Promote durable outcomes to `PRD/sections/decisions.md` and affected sections.
3. **Write receipt first** (see below).
4. Delete `PRD/work/<slug>/` entirely if fully shipped.
5. Update `PRD/README.md` only if navigation changed.

## Receipt (required before delete)

Path: `PRD/instructions/receipts/<slug>-<YYYY-MM-DD>.md`

Include:

- Date, slug, status (shipped | partial | corpus-only)
- Actions taken checklist
- Files created / updated / deleted (every path)
- Verification results

Receipts are **durable** — never delete with work folder.

## Corpus hygiene mode

When user requests terminology/sections sweep (no feature slug):

- Apply checklist from `workflow-reference.md` terminology table
- Record all edits in receipt named `skill-migration-<date>.md` or `<slug>-<date>.md`

## Do not

- Start new features or slices
- Delete `PRD/instructions/receipts/`
