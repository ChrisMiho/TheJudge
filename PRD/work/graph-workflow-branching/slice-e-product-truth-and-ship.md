# Slice E — apply product truth, rewrite the fixtures, smoke, ship

## Status: in-progress

## Goal

The seven `GATE-QUESTIONS.md` blocks are applied to `PRD/sections/` by
intent, the two `graph-kickoff` skill fixtures describe the new behavior, a
live preflight smoke proves the launch checkout stays on `main`, and the
package is ship-ready.

## Requirements

1. Apply, in `PRD/sections/functional-requirements.md`: new REQ-191 and
   REQ-192 after REQ-190's reserved position (append after REQ-184 if the
   answer-quality package has not yet applied REQ-185–190; the numbers are
   reserved either way); amend REQ-170, REQ-162, REQ-164, REQ-161 with the
   `Proposed:` text. Apply FLOW-022's two edits in
   `PRD/sections/user-flows.md`. Re-derive each edit against the live text
   rather than pasting blindly; the `Current:` excerpts must no longer appear
   and the `Proposed:` text must.
2. Rewrite `PRD/instructions/skill-fixtures/graph-kickoff/dirty-checkout-and-gate.md`
   as "untouched launch checkout and gate": precondition is a dirty root
   checkout; the graded outcome is that the run leaves it byte-unchanged
   (`git status --porcelain` before equals after) and works in
   `.worktrees/kickoff-<slug>`. Update item 7 of
   `single-door-and-thin-request.md` to name the worktree instead of
   commit/stash. Re-run both per `PRD/instructions/skill-testing.md` and
   record the measured runs.
3. Live smoke, recorded in the package README under `## Smoke`:
   from this worktree's root (a linked worktree, so the in-place path) and
   from a throwaway clone or the main checkout on `main` (the root path):
   `npm run graph:preflight -- --branch thejudge-auto/smoke-<date> --slug smoke-<date> --run-id graph-smoke-<date> --dry-run`
   then the real run; assert `git branch --show-current` at the root is
   unchanged, the worktree exists on the branch, and the branch is pushed
   (`git ls-remote --heads origin`). Then release the lock via the documented
   release record, delete the remote smoke branch by hand (owner command,
   outside the run), and confirm `npm run graph:prune --apply` removes the
   local branch and worktree.
4. `npm run quality:check` green.
5. Promotion checklist for cleanup: durable truth is applied here (REQ-191,
   REQ-192, amendments); no `system-map.md` entry (no subsystem changes);
   `PRD/README.md` navigation line updated in slice D; receipt written by
   `thejudge-cleanup` with the smoke evidence.

## Acceptance criteria

- [ ] E1 A node script asserts that none of the eight `Current:` excerpts in `GATE-QUESTIONS.md` still appears in its live file and that every `Proposed:` block does; it prints `8/8 applied`
- [ ] E2 `grep -n "^### REQ-191\|^### REQ-192" PRD/sections/functional-requirements.md` finds both, once each
- [ ] E3 Both fixtures rewritten and re-run; `PRD/instructions/skill-fixtures/graph-kickoff/*.md` carry a dated measured-run entry for 2026-09 or later
- [ ] E4 `## Smoke` in the package README records both preflight shapes with the commands, the unchanged root branch, the pushed branch, and the prune `--apply` result
- [ ] E5 `npm run quality:check` passes

## Verification

```bash
node -e '<the E1 check script, kept beside the criteria as scripts/../PRD/work/graph-workflow-branching/check-applied.mjs>'
grep -n "^### REQ-191\|^### REQ-192" PRD/sections/functional-requirements.md
npm run quality:check
```

## Files touched

- `PRD/sections/functional-requirements.md`
- `PRD/sections/user-flows.md`
- `PRD/instructions/skill-fixtures/graph-kickoff/dirty-checkout-and-gate.md` (renamed to `untouched-checkout-and-gate.md`)
- `PRD/instructions/skill-fixtures/graph-kickoff/single-door-and-thin-request.md`
- `PRD/work/graph-workflow-branching/README.md` (`## Smoke`)
- `PRD/work/graph-workflow-branching/check-applied.mjs`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete
