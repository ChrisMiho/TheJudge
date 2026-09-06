# Slice E — Product truth applied by intent; sweeps; rehearsal; ship gates

## Status: planned

## Goal

`PRD/sections/` says what the package decided, the whole tree passes the
brief's grep sweeps, and the claim mechanics have been rehearsed locally once.

## Requirements

1. Apply `GATE-QUESTIONS.md` **by intent** against current truth (the verdict
   slots are answered at PR review; see `DESIGN-BRIEF.md` `## Deviation`):
   append REQ-193 and REQ-194 after REQ-192 in
   `PRD/sections/functional-requirements.md`; amend REQ-171 (five bullets),
   REQ-191 (two bullets), REQ-192 (two bullets), REQ-164 (one bullet); amend
   FLOW-021 (steps 7–8, one edge case) and FLOW-022 (step 8) in
   `PRD/sections/user-flows.md`. Re-verify every `Current:` excerpt
   byte-for-byte immediately before editing.
2. Run the grep sweeps in `DESIGN-BRIEF.md` `## Verification` with the named
   survivors; fix any live hit in a slice A–D file.
3. Local rehearsal, no push: from the launch root,
   `git worktree add .worktrees/implement-smoke -b thejudge-auto/smoke-land-work origin/main`;
   `cd .worktrees/implement-smoke && git commit --allow-empty -m "smoke"`;
   `git show origin/main:PRD/work/` and
   `git show origin/main:PRD/work/ai-answer-quality-baseline/`;
   `git worktree remove .worktrees/implement-smoke`; the never-pushed branch is
   removed with `git branch -D thejudge-auto/smoke-land-work` (owner-run form;
   hand it over if denied). Record the transcript in this slice doc.
4. `PRD/sections/system-map.md`: confirm no graph-workflow entry to flip.
5. Ship gates below. Cleanup (receipt, folder deletion, board strip) runs after
   this slice on this branch, before the PR, per the manual path.

## Acceptance criteria

- [ ] E1 `scratchpad/verify-current.mjs` reports 13 excerpts, 0 missing, immediately before the `PRD/sections/` edits
- [ ] E2 `grep -n "^### REQ-193$\|^### REQ-194$" PRD/sections/functional-requirements.md` finds both, after REQ-192
- [ ] E3 The brief's sweeps pass with only the named survivors (`base→main`, `frozen once`, `node 8 (\`land\`)`, `graph:prune --apply`, `git -C`, `ls-tree`, `PRD/work/<slug>/` as a write prefix)
- [ ] E4 Rehearsal transcript recorded in this doc: worktree created from `origin/main` with the `-b` form, `cd && git commit` succeeded, `git show origin/main:PRD/work/` listed the packages, worktree removed
- [ ] E5 `npm run quality:check` exit 0

## Verification

```bash
node <scratchpad>/verify-current.mjs <worktree root>
grep -n "^### REQ-19[34]$" PRD/sections/functional-requirements.md
npm run quality:check
```

## Files touched

- `PRD/sections/functional-requirements.md`
- `PRD/sections/user-flows.md`
- this slice doc (rehearsal transcript)

## PRD promotion checklist (executed by cleanup)

- Receipt `PRD/instructions/receipts/graph-workflow-land-2026-09-06.md`
  written before the folder is deleted, opening with *What happened · What it
  means for you*, with the owner follow-ups (smoke branch on GitHub;
  `graph:prune -- --apply`; codehealth line if denied; `/loop graph-implement`
  for the answer-quality baseline once this PR merges).
- `PRD/sections/system-map.md`: no entry to flip (confirmed in requirement 4).
- `PRD/work/STATUS.md`: row removed; `PRD/work/graph-workflow-land/` deleted.
- `PRD/README.md`: navigation unchanged beyond slice D's line 130.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete
