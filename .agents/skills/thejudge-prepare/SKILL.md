---
name: thejudge-prepare
description: >-
  Use when an arbitrary TheJudge feature, bug, refactor, or code-health audit
  needs one implementation-ready work package before an unattended
  implementation loop.
---

# TheJudge Prepare

## Goal and inputs

Turn one request into one reviewed, implementation-ready `PRD/work/<slug>/`
package and preparation PR without editing product code. Accept a feature, bug,
refactor, audit, resumable work-folder path, or compatible preparation branch/PR.

Read `PRD/instructions/preparation-contract.md` and [reference.md](reference.md)
in full before acting. Their artifact, authorization, and publication contracts
are required.

## One-package loop

1. Run the Git/worktree preflight from `reference.md`. State
   `thejudge-prepare is controlling` before each phase handoff.
2. Use `thejudge-kickoff` in orchestrated mode to investigate, rank, and capture
   exactly one evidence-backed candidate. If none qualifies, return
   `NO ACTIONABLE PACKAGE` without a work folder, commit, or PR.
3. Use `thejudge-refinement` in orchestrated mode. Apply the assumption ladder
   and record material assumptions. If the genuine-blocker test passes, preserve
   valid artifacts and follow the BLOCKED edge.
4. Use `thejudge-quality-check`. Record its latest PASS/FAIL in the package
   README. On FAIL, return the complete findings to refinement, correct them,
   and repeat. Only a recorded PASS permits map-out.
5. Use `thejudge-map-out`; never use `superpowers:writing-plans`. Dispatch an
   independent reviewer with the original request, authoritative artifacts,
   repository evidence, and prepared diff. Return every Critical or Important
   finding to the relevant phase and re-review the correction.
6. Use `superpowers:verification-before-completion` with fresh package,
   repository, staged-diff, and synchronized-skill evidence before any commit,
   push, PR creation or update, or terminal claim. Use
   `superpowers:systematic-debugging` for unexpected command failures.

## Boundaries

Preparation may write PRD and skill documentation only. Never edit product code
or tests, merge or close a PR, force-push, stash, destructively clean up, or
touch unrelated launch-checkout changes. Treat publication failures as external
blockers; do not claim a PR exists when it does not.

## Terminal states

| State | Required result | Exact next step |
| --- | --- | --- |
| `READY` | Active package, recorded PASS, complete GAMEPLAN/slices, independent review, fresh verification, non-draft PR | After human merge: `$thejudge-implement-all PRD/work/<slug>/` |
| `BLOCKED` | Furthest valid status, stable question ID, evidence and divergent outcomes, omitted invalid artifacts, fresh verification, draft PR | Use the exact restart prompt from `reference.md` |
| External blocker | Safe local branch/commit plus exact failure and recovery report | Resolve the external condition, then retry publication |

## Common mistake observed in RED

Baseline judgment was compliant, but Git publication mechanics were improvised.
Use the exact branch, marker, title, body, and race rules in `reference.md`; do
not substitute a plausible convention.
