# Slice D — Per-worktree kickoff isolation

## Status: done

**Note (D5):** The lock references in `non-functional-requirements.md` and `user-flows.md` needed no edit — the lock filename and its graph-tier-arming role are unchanged under the reframe (isolation is per-root, not re-keying), so they stay accurate. REQ-170 states the per-worktree-session model explicitly.


## Goal

Make `graph-kickoff` runnable many-at-once by running each idea as its own session
rooted in its own worktree, so control files isolate per `$CLAUDE_PROJECT_DIR`
with **no boundary-hook change**. Applies REQ-170.

## Requirements

1. `graph-preflight` branches **into a per-idea worktree** for an isolated run
   rather than mutating the launch checkout: it creates the worktree under the
   repo-local `.worktrees/` root, off the shared base, and leaves the launch
   checkout's working tree untouched (no per-idea auto-commit/stash of `main`).
   Preserve the existing single-run behavior when not isolated.
2. The lock, its filename, `classifyLock()` stale/corrupt/held semantics, and the
   record shape are **unchanged** — isolation comes from separate roots, not
   re-keying. A per-root lock still prevents two runs in the same checkout.
3. Document the launch model: a parallel idea is started as its own `claude`
   session inside its worktree (a thin launcher or `graph-preflight` creates the
   worktree and the session roots there). Fanning out N ideas inside one root is
   explicitly not the model.
4. Tests: two ideas, each rooted in its own worktree, each hold their own lock and
   do not refuse on each other (a pure-function or path-resolution test proving
   per-root lock resolution; no true multi-process needed — assert the resolution
   logic and preflight worktree creation).
5. The boundary hook stays byte-unchanged in decision logic.
6. Apply **REQ-170** truth to `PRD/sections/functional-requirements.md` by intent,
   and reconcile the single-lock references in `non-functional-requirements.md`
   and `user-flows.md` to the per-root framing (no re-keying).
7. `npm run skills:ai-sync`.

## Acceptance criteria

- [ ] D1: `graph-preflight` creates and branches into a per-idea worktree for an
      isolated run and does not auto-commit/stash the launch checkout on its
      behalf; a test asserts this.
- [ ] D2: The lock filename, `classifyLock()`, and record shape are unchanged
      (`git diff main` shows no re-keying), and a test asserts per-root lock
      resolution isolates two roots.
- [ ] D3: The boundary hook decision logic is byte-unchanged
      (`git diff main -- scripts/graph-boundary-hook.mjs scripts/lib/boundary-rules.mjs`
      empty of run-identity change).
- [ ] D4: `graph-kickoff`/`graph-preflight` docs describe the per-worktree-session
      launch model and rule out N-in-one-root.
- [ ] D5: REQ-170 present in `functional-requirements.md`; single-lock references
      reconciled in `non-functional-requirements.md` and `user-flows.md`.
- [ ] D6: `.agents/skills/` mirrors `.claude/skills/`; `npm run test:scripts`
      passes.

## Verification

```bash
git diff main -- scripts/graph-boundary-hook.mjs scripts/lib/boundary-rules.mjs
grep -n "worktree\|CLAUDE_PROJECT_DIR" .claude/skills/graph-preflight/SKILL.md scripts/graph-preflight.mjs
grep -n "REQ-170" PRD/sections/functional-requirements.md
npm run test:scripts
```

## Files touched

- `scripts/graph-preflight.mjs`, `scripts/graph-preflight.test.mjs`
- `.claude/skills/graph-preflight/SKILL.md`, `.claude/skills/graph-kickoff/SKILL.md`
- `.agents/skills/**` (sync)
- `PRD/sections/functional-requirements.md` (REQ-170 by intent),
  `non-functional-requirements.md`, `user-flows.md` (lock references)
