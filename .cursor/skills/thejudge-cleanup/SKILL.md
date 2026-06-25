---
name: thejudge-cleanup
description: >-
  Post-ship evaluation — promote PRD truth, write durable receipt, delete
  ephemeral PRD/work/ folder. Use when a feature is done or for corpus hygiene.
---

# TheJudge Cleanup

## Goal

Close out a work package: verify what's done, promote durable docs, receipt, delete `PRD/work/<slug>/`.

## Shared output guidance

Read the shared response guidance at `../thejudge-output-guidance.md` (canonical path: `.cursor/skills/thejudge-output-guidance.md`) and apply it to this workflow's user-facing output. This affects response length only; preserve all reads, writes, gates, verification, and handoff requirements below.

## Inputs

User provides work slug (or `prd-workflow-skills` for this rollout's self-closeout).

## Reads

1. `PRD/work/<slug>/README.md` + `GAMEPLAN.md` + slice docs
2. `PRD/instructions/doc-lifecycle.md`
3. Relevant codebase paths from slice implementation maps

## Ship checklist

Apply during process step 1:

- Slice acceptance criteria satisfied and verified
- Tests updated; `npm run quality:check` green for touched areas
- Public contract unchanged unless a slice scoped a change
- No secrets committed
- Durable outcomes promoted; `PRD/work/<slug>/` ready to delete
- System-map promotion gate applied — shipped subsystem's `sections/system-map.md` entry flipped to `shipped` (code + receipt exist)

## Process

1. Compare each slice acceptance criteria vs codebase — mark done/pending; run ship checklist.
2. Promote durable outcomes to affected sections; for decisions, promote into the relevant `PRD/sections/decisions/<domain>.md` and add the router index line in `PRD/sections/decisions.md`.
3. **Write receipt first** (see below).
4. Apply the system-map promotion gate (`PRD/instructions/doc-lifecycle.md`): now that code exists and the receipt is written, flip the shipped subsystem's `PRD/sections/system-map.md` entry/entries from `planned`/`partial` to `shipped`. The shipped-vs-planned signal lives in the catalog only — never edit a `DEC`/`REQ` `Status:` field.
5. Delete `PRD/work/<slug>/` entirely if fully shipped.
6. Update `PRD/README.md` only if navigation changed.

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

## Handoff

Terminal skill — no **Next step** required after closeout.

Optional: if the user wants to start new work, offer **Next step** with all three platforms pointing to `thejudge-kickoff`. Templates: `PRD/instructions/workflow-reference.md` (Handoff blocks).
