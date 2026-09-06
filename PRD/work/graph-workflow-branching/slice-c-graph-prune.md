# Slice C — `npm run graph:prune`

## Status: done

Verified 2026-09-06: `npm run test:scripts` 464/464 (21 new in `scripts/graph-prune.test.mjs`, covering every `classifyLeftovers` branch, the codehealth exclusion, the outside-root report, the live-lock intake keep, `-work`/`-cleanup` slug derivation, the control-file removal guard, and a source scan for `push`/`--force`/`-D`); `npm run graph:prune` from this linked worktree exited 0 with `git worktree list` and `git branch --list 'thejudge-auto/*'` byte-identical before and after; it printed `keep branch thejudge-auto/ai-answer-quality-baseline — package still on main: the build half's base` and the summary `graph-prune: 9 to delete, 5 kept, 2 reported (dry run: nothing changed; pass --apply to delete)` (the two reports are the `.claude/worktrees/*` trees); C4 grep empty; prettier and eslint clean on both new files. Intake folders and the lock are read cwd-relative like preflight, so from this linked worktree the main checkout's six stale `.worktrees/.graph-intake/*` folders are listed only when the command runs from the main root.

## Goal

A new `scripts/graph-prune.mjs` lists local graph-run leftovers and deletes
the safe subset only with `--apply` (REQ-192).

## Requirements

1. Pure `classifyLeftovers({ branches, worktrees, intakeDirs, lock, packagesOnMain })`
   returns, per item, `{ kind, name, action: "delete" | "keep" | "report", reason }`:
   - branch `thejudge-auto/*`: `delete` when merged into `origin/main` and its
     package (`<slug>` = name after the prefix minus a trailing `-work` or
     `-cleanup`) is not in `packagesOnMain`; `keep` "package still on main:
     the build half's base" when it is; `keep` "not merged" otherwise.
   - worktree under `.worktrees/` (excluding `.worktrees/.codehealth/`):
     `delete` when its branch is merged and its tree is clean; `keep`
     otherwise with the reason. A worktree outside `.worktrees/`: `report`
     "outside the .worktrees root; not removed".
   - intake dir `.worktrees/.graph-intake/<run-id>/`: `delete` unless
     `<run-id>` equals the live lock's `runId`.
2. `main()`: `git fetch origin` first; gathers inputs with `git branch`,
   `git worktree list --porcelain`, `git ls-tree origin/main PRD/work/`,
   `readdirSync`, and the lock file; prints one line per item; with `--apply`
   runs `git branch -d` (never `-D`), `git worktree remove` (never `--force`),
   and `fs.rmSync` on intake dirs, reporting each failure and continuing.
3. Never runs `git push`, never deletes a remote ref, never removes any
   `.worktrees/.graph-*` file.
4. `package.json` gains `"graph:prune": "node scripts/graph-prune.mjs"`.

## Acceptance criteria

- [ ] C1 `scripts/graph-prune.test.mjs` covers every `classifyLeftovers` branch above, including the "package still on main" keep, the codehealth exclusion, the outside-root report, and the live-lock intake keep
- [ ] C2 `npm run test:scripts` passes
- [ ] C3 `npm run graph:prune` (no `--apply`) on this checkout exits 0, changes nothing (`git worktree list` and `git branch` identical before and after), and lists `thejudge-auto/ai-answer-quality-baseline` as kept for "package still on main"
- [ ] C4 `grep -n "push\|--force\|-D\b" scripts/graph-prune.mjs` shows no deletion or push path

## Verification

```bash
npm run test:scripts
npm run graph:prune
grep -n "push\|--force\|-D\b" scripts/graph-prune.mjs
```

## Files touched

- `scripts/graph-prune.mjs`
- `scripts/graph-prune.test.mjs`
- `package.json`
