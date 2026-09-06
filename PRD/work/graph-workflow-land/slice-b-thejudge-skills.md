# Slice B — `thejudge-*` skills: in-place build, pre-merge cleanup

## Status: blocked

### Handoff
- Done: every edit is written and prettier-clean, but in **staged copies** —
  `PRD/work/graph-workflow-land/staged/thejudge-implement-all/{SKILL,reference}.md`
  and `staged/thejudge-cleanup/SKILL.md` — because this session's permission
  settings deny the Edit, Write, and `cp` tools inside `.claude/skills/thejudge-*/`
  (reads work). The four fixture edits and the new
  `close-inside-the-code-pr.md` fixture are applied directly (they live under
  `PRD/instructions/`). Diff size staged vs canonical: cleanup 107 lines,
  implement-all SKILL 32, reference 10.
- Next: the owner runs these four commands from this session (they run in the
  worktree), then the agent verifies B1–B5 and marks the slice `done`:

  ```
  !cp PRD/work/graph-workflow-land/staged/thejudge-implement-all/SKILL.md .claude/skills/thejudge-implement-all/SKILL.md
  !cp PRD/work/graph-workflow-land/staged/thejudge-implement-all/reference.md .claude/skills/thejudge-implement-all/reference.md
  !cp PRD/work/graph-workflow-land/staged/thejudge-cleanup/SKILL.md .claude/skills/thejudge-cleanup/SKILL.md
  !npm run skills:ai-sync
  ```

  Absolute form of the first, if the session's cwd differs:
  `cp /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/graph-workflow-land/PRD/work/graph-workflow-land/staged/thejudge-cleanup/SKILL.md /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/graph-workflow-land/.claude/skills/thejudge-cleanup/SKILL.md`
  (and likewise for the other two).
- Stopped because: the target directories are denied to the agent's tools;
  routing around a permission deny with a different tool is not done here.

## Goal

`thejudge-implement-all` works in place in the driver's build worktree under
graph control, and `thejudge-cleanup` runs before the merge on an open PR while
keeping today's post-merge gate for direct packages.

## Requirements

1. `thejudge-implement-all/SKILL.md` (D1, REQ-193): `## Mode` — under
   `graph is controlling`, when `Working directory:` names
   `.worktrees/implement-<slug>` already checked out on the shared branch, work
   in place (no new worktree, no contributor branch); the dispatch must name the
   shared branch and it must equal the checked-out branch, else block; write
   scope is the worktree alone. `## Inputs` default-branch note. `## Workflow
   contract` item 1 and `## Common mistakes` "Sharing one local branch" gain the
   graph-mode exception. `## Completion gate`: worktree removal is the owner's
   `graph:prune` after merge on the graph path.
2. `thejudge-implement-all/reference.md` `### Preflight` 3–7: the guard's
   rationale sentence (base is `main` under the graph now; the guard stays for
   direct use), in-place worktree adoption, baseline at the shared tip, the
   launch-checkout sentence reworded for the in-place case.
3. `thejudge-cleanup/SKILL.md` (D3, D4, REQ-194): `## Mode` (graph: runs in the
   build worktree before `land`; only the open-PR path is valid); `## Reads` 6;
   `## Writes` (`- PR:` line; the `Terminal state: COMPLETE — land: …` summary
   line on the open-PR path); `### Delete mechanism` (no worktree/branch removal
   on the open-PR path; unchanged on the merged path); `## Gates` bullet; the
   gate section renamed `### Autonomous gate: merged path and PR-ready path`
   with the path chosen by PR state, the merged path verbatim as today, the
   four PR-ready checks, and the unknown-state rule; "node 9's delete" → node 8.
4. Fixtures: one path-note line each in `deleted-base-branch.md`,
   `gh-outage-during-merge-proof.md`, `promote-once-at-close.md`; reword the two
   pointer lines in `intake-in-the-receipt.md`; author
   `close-inside-the-code-pr.md` (open PR in a build worktree; grades the
   PR-ready path; unmeasured, three-rep run owed).
5. `npm run skills:ai-sync`; both trees identical.

## Acceptance criteria

- [ ] B1 `.claude/skills/thejudge-implement-all/SKILL.md` names the in-place rule and the explicit-shared-branch block under `graph is controlling`
- [ ] B2 `.claude/skills/thejudge-cleanup/SKILL.md` carries both gate paths (merged: the four existing checks unchanged; open: the four PR-ready checks) and the unknown-state rule
- [ ] B3 `PRD/instructions/skill-fixtures/thejudge-cleanup/close-inside-the-code-pr.md` exists with a grading key and a "not yet measured" runs table
- [ ] B4 `diff -rq .claude/skills .agents/skills` prints nothing after `npm run skills:ai-sync`
- [ ] B5 `grep -rn "merge-proof" .claude/skills/thejudge-cleanup/SKILL.md` finds only the merged-path wording, none stated as the sole gate

## Verification

```bash
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
npm run quality:check
```

## Files touched

- `.claude/skills/thejudge-implement-all/SKILL.md`, `.claude/skills/thejudge-implement-all/reference.md`
- `.claude/skills/thejudge-cleanup/SKILL.md`
- `PRD/instructions/skill-fixtures/thejudge-cleanup/{deleted-base-branch,gh-outage-during-merge-proof,promote-once-at-close,intake-in-the-receipt}.md`
- `PRD/instructions/skill-fixtures/thejudge-cleanup/close-inside-the-code-pr.md` (new)
- `.agents/skills/` mirror of the above
