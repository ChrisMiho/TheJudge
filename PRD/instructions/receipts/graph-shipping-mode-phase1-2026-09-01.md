# Receipt — graph-shipping-mode-phase1 (2026-09-01)

**What happened:** The agent lifecycle now separates *proposing* product truth
from *writing* it. Refinement (`thejudge-refinement`) shapes an idea and records
the product-truth changes it wants as a proposal in the work folder
(`GATE-QUESTIONS.md`) — it no longer edits `PRD/sections/` at all. Implementation
(`thejudge-implement` / `-all`) is now the one place `PRD/sections/` truth is
written, by intent, in the same commit as the code that realizes it. Cleanup
confirms that truth once at close instead of promoting it separately.

**What it means for you:** Two ideas can be shaped at once without their spec
edits colliding, and the spec can no longer run ahead of the code that backs it.
Nothing you do at the keyboard changes: you still answer the same gate questions;
they are just recorded in the work folder now, and the run applies them when it
builds. This is the foundation the concurrent multi-idea runs (Phase 2) build on.
**Action: Review — this lands on PR #158, which you merge.**

- **Date:** 2026-09-01
- **Slug:** graph-shipping-mode-phase1
- **Status:** shipped (pending merge of PR #158 into `main`)
- **Branch:** `graph-shipping-mode-phase1`
- **Package classification:** collaborative / interactive — implemented by hand,
  not by an autonomous graph run (a run must not rewrite the skills it executes).
  The README's `## Autonomous metadata` section states this explicitly and carries
  no `Autonomous base: origin/<branch>` line, so the autonomous merge-proof gate's
  four checks are inapplicable; the local-only cleanup path was taken.

## What changed

This package produced **no `PRD/sections/` product truth** — it is an
agent-workflow change only. `git diff --stat main...HEAD -- PRD/sections/` is
empty across the whole branch. Durable outcomes are the reworked instruction docs
and skills, already in their canonical homes.

### Slice A — proposal contract + docs (committed before this session)
- `PRD/instructions/graph-workflow-contract.md`: added `## Propose / apply /
  close`; the gate signal is `GATE-QUESTIONS.md` presence, not a live
  `PRD/sections/` diff; run-one publishes the proposal, not `PRD/sections/`.
- `preparation-contract.md`, `workflow-reference.md` reconciled where they
  described the old flow.

### Slice B — spec-forming side (refinement proposes; gate reads the proposal)
- `thejudge-refinement/SKILL.md`: Goal / Writes / Gates → propose-only. Writes
  only inside `PRD/work/<slug>/`; authors `GATE-QUESTIONS.md` (plain-language
  block + complete proposed diff + accept/edit/reject slot per stable id); never
  edits `PRD/sections/`. Description and intake rule updated to match.
- `graph-run/SKILL.md`: post-`define` gate reads `GATE-QUESTIONS.md` presence
  (edited in the prior graph-profile session; mirror synced this session).
- `graph-gate-review/SKILL.md`: applies accept/edit/reject verdicts **inside**
  `GATE-QUESTIONS.md` (finalizing the proposal); never touches `PRD/sections/`; a
  `reject` removes the id's proposed block and burns the number.
- Fixtures: `thejudge-refinement/intake-is-not-authority.md` grading key updated
  to propose/apply; new `graph-gate-review/verdicts-finalize-in-the-proposal.md`.

### Slice C — apply side (implement applies truth + code; cleanup confirms once)
- `thejudge-implement/SKILL.md`, `thejudge-implement-all/SKILL.md`: the slice that
  carries the proposal writes the real `PRD/sections/` edits derived **by intent**
  from the approved `GATE-QUESTIONS.md` diff + `DESIGN-BRIEF.md` against current
  truth (never a blind replay; a rejected id stays burned), committed **together
  with the code**, exactly once across the package.
- `thejudge-cleanup/SKILL.md`: flipped from promote to **confirm** — durable truth
  is written once at build; cleanup confirms it, never assumes refinement
  pre-wrote `PRD/sections/`, and promotes only an outcome build genuinely left
  unapplied, never a second copy.
- Fixtures: new `thejudge-implement/apply-proposal-by-intent.md` and
  `thejudge-cleanup/promote-once-at-close.md`.

### Slice D — sync + verification
- `npm run skills:ai-sync`: mirrored all six reworked skills to `.agents/skills/`,
  plus `graph-run` (prior session's canonical edit was unmirrored) and
  `overnight-codehealth` (never committed). Idempotent on re-run.

## Files created / updated / deleted

**Updated (canonical skills):** `thejudge-refinement`, `graph-gate-review`,
`thejudge-implement`, `thejudge-implement-all`, `thejudge-cleanup` SKILL.md;
`graph-run` SKILL.md mirrored.
**Updated (mirror):** the matching `.agents/skills/**` files.
**Created (fixtures):** `graph-gate-review/verdicts-finalize-in-the-proposal.md`,
`thejudge-implement/apply-proposal-by-intent.md`,
`thejudge-cleanup/promote-once-at-close.md`.
**Updated (fixtures):** `thejudge-refinement/intake-is-not-authority.md`.
**Created (this file):** `PRD/instructions/receipts/graph-shipping-mode-phase1-2026-09-01.md`.
**Deleted:** `PRD/work/graph-shipping-mode-phase1/` (the whole work folder).

## Verification

- `npm run test:scripts` — green (432/432) after each of slices B, C.
- `npm run quality:check` — green (exit 0), protected-write guard and skill-sync
  checks included.
- `npm run skills:ai-sync` — idempotent; a second run left no unstaged diff.
- Dry run (contract trace + branch diff; a live graph run on itself is forbidden):
  propose writes only inside `PRD/work/<slug>/`; apply writes `PRD/sections/` +
  code together; cleanup confirms once. `git diff --stat main...HEAD --
  PRD/sections/` is empty — no product truth written by the rework, no
  spec-ahead-of-code write at any propose step.

## Owed follow-up (not blocking)

Fixture **measured re-runs** are owed against the new propose/apply skill
versions: `thejudge-refinement` item 5, and the three new fixtures
(`graph-gate-review`, `thejudge-implement`, `thejudge-cleanup`). Each file is
marked pending. Per `skill-testing.md` these multi-rep runs are a deliberate
pre-merge check, not part of `quality:check`; they were not run in this session.
