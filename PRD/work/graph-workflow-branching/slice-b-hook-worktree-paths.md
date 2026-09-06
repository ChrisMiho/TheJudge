# Slice B — the protected-path rule reaches inside worktrees

## Status: planned

## Goal

The hook's `protected-path-write` rule denies a protected path written by any
form — relative, absolute, `.worktrees/kickoff-<slug>/…`,
`.worktrees/implement-<slug>/…` — while a run holds the lock, and allows all
four without it. Nothing else in the hook changes.

## Requirements

1. New pure function `repoRelativeWritePath(candidate, root)` in
   `scripts/lib/boundary-rules.mjs`: normalizes the path, makes it relative to
   `root` when it is absolute and under `root`, then strips one leading
   `.worktrees/<dir>/` segment. A path outside `root` is returned unchanged.
2. `protected-path-write` calls it before `isProtectedPath()`. The rule's
   deny message names the normalized path and, when a worktree prefix was
   stripped, the worktree.
3. `scripts/graph-boundary-hook.mjs` passes `root` (the value `projectRoot()`
   already computes) into `classifyToolCall` so the rule can see it. No new
   protected-path literal appears in the hook file
   (`protected-write-guard.test.mjs` must stay green).
4. Tiers, the lock record, `run-record-write`, `run-lock-removal`,
   `stop-sentinel-removal`, and every other rule are byte-unchanged in
   behavior; existing tests pass unmodified.

## Acceptance criteria

- [ ] B1 `scripts/lib/boundary-rules.test.mjs` covers `repoRelativeWritePath` for: relative, `./`-prefixed, absolute-under-root, absolute-outside-root, `.worktrees/kickoff-x/`, `.worktrees/implement-x/`, and a nested `.worktrees/a/.worktrees/b/` (only one segment stripped)
- [ ] B2 `scripts/graph-boundary-hook.test.mjs` drives the hook with `runActive: true` and asserts deny for `Edit` and for Bash redirection on all four forms of `.claude/skills/thejudge-map-out/SKILL.md`, and allow for all four with no lock
- [ ] B3 `npm run test:scripts` passes, including `scripts/protected-write-guard.test.mjs`
- [ ] B4 `git diff --stat scripts/lib/boundary-rules.mjs scripts/graph-boundary-hook.mjs` touches only the rule, the new function, and the root plumbing (reviewer check of the diff)

## Verification

```bash
npm run test:scripts
git diff --stat -- scripts/lib/boundary-rules.mjs scripts/graph-boundary-hook.mjs
```

## Files touched

- `scripts/lib/boundary-rules.mjs`
- `scripts/lib/boundary-rules.test.mjs`
- `scripts/graph-boundary-hook.mjs`
- `scripts/graph-boundary-hook.test.mjs`
