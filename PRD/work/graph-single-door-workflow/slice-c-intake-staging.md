# Slice C — Intake is staged, copied, and committed

## Status: done

## Goal

The owner hands the door a context document — a file path or markdown pasted in
the same message — and it survives into the package as a committed file, rather
than as a pointer to untracked material that later disappears.

## Requirements

REQ-162 (the mechanics half), FLOW-022.

1. `graph-run` accepts zero or more file paths alongside the request, and
   accepts markdown pasted in the same message:
   `/graph-run "<request>" [paths...]`.
2. The door writes each item **verbatim** into
   `.worktrees/.graph-intake/<run-id>/` before node 1 is dispatched, using the
   run id slice B mints. The staging path is derived from that id.
3. **Why outside the working tree**, stated in the skill so a later editor does
   not move it back: node 1 resolves the working tree before the branch exists.
   `classifyWorkingTree` in `scripts/graph-preflight.mjs:99-113` stashes a tree
   over 10 files or 200 changed lines, the untracked scan at line 213 feeds it,
   and line 246 stashes with `git stash push -u`. Written into the package up
   front, a large handoff is stashed off before the branch exists and node 2
   reads an empty folder; under the threshold it lands only as a side effect of
   `chore(graph): auto-commit working tree before graph run`. `.worktrees/` is
   gitignored and `git stash push -u` spares ignored paths.
4. The same sweep takes the untracked **source** file, so the copy the door
   stages at launch is the only one the run is guaranteed to read. The skill
   says so.
5. Node 2 reads the staged intake. Once `thejudge-kickoff` has created
   `PRD/work/<slug>/`, node 2 copies each item into `PRD/work/<slug>/intake/`,
   commits it on the branch, and deletes the staging copy.
6. The staging path is recorded in the ledger at **node 2's first ledger
   write**, never before node 1. The ledger is `PRD/work/<slug>/GRAPH-RUN.md`
   (contract `## Ledger`) and the package folder is born at node 2, so there is
   nothing to write to earlier.
7. A supplied path that does not exist or cannot be read is reported **before
   node 1**, and the run does not start on partial material.
8. Intake is copied, never referenced in place. No size gate is added: a gate
   would refuse exactly the thorough handoff this accepts, and staging outside
   the working tree is what keeps node 1's thresholds off the intake path.
9. `docs/whatIsGraph/` is not committed by this slice. Sweeping untracked
   working material into the repository stays the owner's call.

## Files touched

- `.claude/skills/graph-run/SKILL.md` — intake acceptance, staging, the
  ordering argument, the unreadable-path stop
- `.claude/skills/thejudge-kickoff/SKILL.md` — reads staged intake, copies into
  `intake/`, commits, deletes the staged copy
- `PRD/instructions/graph-workflow-contract.md` — intake rules; the ledger's
  node-2 staging line
- `.agents/skills/**` via `npm run skills:ai-sync`

## Acceptance criteria

- [x] C1 — `graph-run/SKILL.md` documents `/graph-run "<request>" [paths...]`
      and markdown pasted in the same message as accepted intake.
- [x] C2 — `graph-run/SKILL.md` names `.worktrees/.graph-intake/<run-id>/` as
      the staging path, written before node 1.
- [x] C3 — `graph-run/SKILL.md` states why staging sits outside the working
      tree, citing node 1's stash/auto-commit behavior, and states that the
      untracked source file is swept too.
- [x] C4 — `thejudge-kickoff/SKILL.md` states the copy into
      `PRD/work/<slug>/intake/`, the commit on the branch, and the deletion of
      the staged copy, in that order and after the package folder exists.
- [x] C5 — `graph-workflow-contract.md`'s `## Ledger` section states the
      staging path is recorded at node 2's first ledger write, with the reason.
- [x] C6 — `graph-run/SKILL.md` states that an unreadable or missing supplied
      path is reported before node 1 and the run does not start.
- [x] C7 — `graph-workflow-contract.md` states intake is copied and never
      referenced in place, and that no size gate is applied.
- [x] C8 — `git status --porcelain docs/whatIsGraph/` still shows the folder
      untracked; nothing in it is staged or committed by this slice.
- [x] C9 — `npm run skills:ai-sync` run and
      `diff -rq .claude/skills .agents/skills` prints nothing.
- [x] C10 — dry-run the staging path by hand: create
      `.worktrees/.graph-intake/<a test run id>/`, drop a file in it, run
      `git status --porcelain` and confirm the path does not appear, then remove
      it. Record the observed output.

## Verification

```bash
grep -n "graph-intake" .claude/skills/graph-run/SKILL.md
grep -n "intake/" .claude/skills/thejudge-kickoff/SKILL.md
grep -n "graph-intake\|intake" PRD/instructions/graph-workflow-contract.md
git status --porcelain docs/whatIsGraph/
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
```

## C8 note

This slice's isolated worktree (`.worktrees/implement-graph-single-door-workflow/`)
never had `docs/whatIsGraph/` — it was created fresh from
`origin/feature/graph-workflow-hardening`, and that folder was never committed
to that branch (it stays untracked in the separate launch checkout by owner
choice). `git status --porcelain docs/whatIsGraph/` here reports "No such
file or directory," which trivially satisfies the criterion: nothing in it is
staged or committed by this slice, because this slice never touches it.

## C10 dry-run

```
$ mkdir -p .worktrees/.graph-intake/graph-20260820-160000-test
$ echo "test intake content" > .worktrees/.graph-intake/graph-20260820-160000-test/note.md
$ git status --porcelain
 M .agents/skills/graph-run/SKILL.md
 M .agents/skills/thejudge-kickoff/SKILL.md
 M .claude/skills/graph-run/SKILL.md
 M .claude/skills/thejudge-kickoff/SKILL.md
 M PRD/instructions/graph-workflow-contract.md
$ rm -r .worktrees/.graph-intake
```

The staged test file never appears in `git status --porcelain` — `.worktrees/`
is gitignored, confirming the staging path sits outside anything a working-tree
sweep can see or stash.
