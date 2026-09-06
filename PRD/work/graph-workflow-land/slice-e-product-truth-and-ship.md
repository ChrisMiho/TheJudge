# Slice E — Product truth applied by intent; sweeps; rehearsal; ship gates

## Status: done

Verified 2026-09-06: `verify-current.mjs` 13/13 immediately before the edits;
REQ-193 at line 4347 and REQ-194 at line 4376 of
`PRD/sections/functional-requirements.md`, after REQ-192; `npm run quality:check`
exit 0; `PRD/sections/system-map.md` has no graph entry to flip.

### Sweep results

| Sweep | Result |
| --- | --- |
| `frozen once` | none outside receipts and the probe folder (REQ-193's text reworded to avoid the literal) |
| `base→main` | survivors only: receipts, `PRD/ideasForLater/`, `docs/`, the probe folder, other packages' `GRAPH-RUN.md`, `graph-digest.mjs` history comment (line 22) and its `doesNotMatch` test (line 80), REQ-171 Notes, REQ-191's "guard is removed" criterion, REQ-194's two "no third base→main PR / no separate base→main hop" statements (the hop's absence), and `codehealth/SKILL.md` line 43 (edit denied — staged for the owner) |
| `node 8 (\`land\`)` / `node 9 (\`close\`)` | none |
| `graph:prune --apply` / "add `--apply`" without `--` | none outside this package's own docs |
| `git -C` in `.claude/skills/graph-*/SKILL.md` | only `graph-preflight/SKILL.md:52` (a command the script runs via `execFileSync`) |
| `ls-tree` in any skill file | none |
| `PRD/work/<slug>/` as an allowed write prefix | none |

### Rehearsal transcript (2026-09-06, from `.worktrees/graph-workflow-land`, nothing pushed)

```
$ git fetch origin
$ git worktree add .worktrees/implement-smoke -b thejudge-auto/smoke-land-work origin/main
branch 'thejudge-auto/smoke-land-work' set up to track 'origin/main'.
HEAD is now at 8d29ce4 Merge pull request #201 from ChrisMiho/fix/graph-workflow-branching
$ git show origin/main:PRD/work/
tree origin/main:PRD/work/

STATUS.md
ai-answer-quality-baseline/
probe-graph-workflow-audit/
$ git show origin/main:PRD/work/ai-answer-quality-baseline/
tree origin/main:PRD/work/ai-answer-quality-baseline/

DESIGN-BRIEF.md
GATE-QUESTIONS.md
GRAPH-RUN.md
IDEA.md
README.md
STATUS.refined
intake/
$ cd .worktrees/implement-smoke && git commit --allow-empty -m "smoke: claim rehearsal (never pushed)"
8497f33 smoke: claim rehearsal (never pushed)   # branch thejudge-auto/smoke-land-work, porcelain empty
$ git worktree remove .worktrees/implement-smoke   # run from the worktree root
$ git branch -D thejudge-auto/smoke-land-work
→ denied to the agent (unmerged-branch delete is the owner's form); the owner runs it
```

Every form the design names ran under the session's permissions except the
owner-only `git branch -D`. The `cd <worktree> && git commit` form committed
on the intended branch; `git show origin/main:…` listed the queue without
touching the launch checkout.

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

- [x] E1 `scratchpad/verify-current.mjs` reports 13 excerpts, 0 missing, immediately before the `PRD/sections/` edits
- [x] E2 `grep -n "^### REQ-193$\|^### REQ-194$" PRD/sections/functional-requirements.md` finds both, after REQ-192
- [x] E3 The brief's sweeps pass with only the named survivors (`base→main`, `frozen once`, `node 8 (\`land\`)`, `graph:prune --apply`, `git -C`, `ls-tree`, `PRD/work/<slug>/` as a write prefix)
- [x] E4 Rehearsal transcript recorded in this doc: worktree created from `origin/main` with the `-b` form, `cd && git commit` succeeded, `git show origin/main:PRD/work/` listed the packages, worktree removed
- [x] E5 `npm run quality:check` exit 0

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
