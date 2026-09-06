# Slice A — preflight branches from origin/main into a kickoff worktree

## Status: done

Verified 2026-09-06: `npm run test:scripts` 428/428; dry run from this linked worktree printed the in-place plan and refused the dirty tree (exit 1); dry run spawned with the main checkout as cwd printed the three-command worktree plan, `base: origin/main (default)`, and `worktree: …/.worktrees/kickoff-slice-a-probe`, exit 0, no `gh` call; A4 grep empty; profile `git stash` allows removed by the owner (the file is denied to the agent), denies at 146–148 kept.

## Goal

`scripts/graph-preflight.mjs` never mutates the launch checkout: from a root
checkout it creates `.worktrees/kickoff-<slug>` on `thejudge-auto/<slug>` off
`origin/main` and pushes; from a linked-worktree root it works in place on a
clean tree. Auto-commit, stash, thresholds, the secret gate, and the base→main
guard are removed.

## Requirements

1. `resolveBase()` defaults to `origin/main`; `--base <ref>` overrides and the
   `base:` line says which (D1, REQ-191).
2. `planActions()` for a root checkout returns exactly: `git fetch origin`,
   `git worktree add .worktrees/kickoff-<slug> -b <branch> <base>`,
   `git -C .worktrees/kickoff-<slug> push -u origin <branch>`. The collision
   check runs after the fetch as today; an existing
   `.worktrees/kickoff-<slug>` directory exits 2 naming it.
3. `planActions()` for a linked-worktree root (`git rev-parse --git-dir` ≠
   `--git-common-dir`) returns: `git fetch origin`, `git switch -c <branch>
   <base>`, `git push -u origin <branch>`; a non-empty `git status --porcelain`
   exits 1 listing the dirty paths (pure `classifyInPlaceTree()`).
4. `--slug` is required on the fresh path (exit 2 with a message); it is
   already required with `--take-lock`.
5. Removed: `classifyWorkingTree`, `collectEntries`, `mergeByPath`,
   `normalizeRenamePath`, `SECRET_PATTERNS`, `DEFAULT_THRESHOLDS`,
   `parseThresholdValue`, `--max-files`/`--max-lines`, the auto-commit message,
   `classifyPendingBaseToMain`, the `gh` call in `main()`, and the stash lines
   in `formatFailureReport`. `kickoffWorktreeCommand(slug, base)` becomes the
   source of the worktree-add command string; `kickoffWorktreePath` unchanged.
6. `OPEN_BASE_TO_MAIN_PRS_COMMAND` moves to `scripts/graph-digest.mjs`;
   `GRAPH_BRANCH_PREFIX` stays exported from preflight. Digest output unchanged.
7. The script prints `worktree: <absolute path>` after a successful fresh run
   and in the dry run's plan.
8. `.claude/graph-profile.json` drops its two `git stash` allow rules.

## Acceptance criteria

- [ ] A1 `npm run test:scripts` passes with the rewritten `scripts/graph-preflight.test.mjs` covering: `origin/main` default and `--base` override; root plan (three commands, in order); in-place plan; dirty in-place refusal listing paths; existing-worktree refusal; `--slug` required; no `classifyPendingBaseToMain` or threshold exports remain (assert `typeof === "undefined"` on the import namespace)
- [ ] A2 `scripts/graph-digest.test.mjs` passes with the constant owned by the digest
- [ ] A3 Dry run from this checkout's root (`npm run graph:preflight -- --branch thejudge-auto/slice-a-probe --slug slice-a-probe --run-id graph-slice-a --dry-run`) prints the three-command worktree plan, `base: origin/main`, and no `gh` output; exit 0
- [ ] A4 `grep -n "stash\|auto-commit\|classifyPendingBaseToMain\|max-files" scripts/graph-preflight.mjs` returns nothing
- [ ] A5 `.claude/graph-profile.json` contains no `git stash` allow rule

## Verification

```bash
npm run test:scripts
npm run graph:preflight -- --branch thejudge-auto/slice-a-probe --slug slice-a-probe --run-id graph-slice-a --dry-run
grep -n "stash\|auto-commit\|classifyPendingBaseToMain\|max-files" scripts/graph-preflight.mjs; grep -n "git stash" .claude/graph-profile.json
```

## Files touched

- `scripts/graph-preflight.mjs`
- `scripts/graph-preflight.test.mjs`
- `scripts/graph-digest.mjs`
- `scripts/graph-digest.test.mjs`
- `.claude/graph-profile.json`
