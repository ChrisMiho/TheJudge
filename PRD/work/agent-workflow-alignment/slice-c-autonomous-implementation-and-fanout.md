# Slice C — Autonomous implementation and fanout

## Status: planned

## Goal

Make `thejudge-implement-all` inherit the package's recorded autonomous base
instead of defaulting to `main`, own preparation-worktree cleanup at
preflight, and make `thejudge-implement-fanout` require a common recorded
base across dispatched packages plus assign preflighted per-package port
pairs.

## Requirements

### `thejudge-implement-all`

1. `SKILL.md` "Inputs": replace "otherwise use `thejudge-auto/<slug>`
   targeting `main`" with "otherwise use `thejudge-auto/<slug>` targeting the
   package's recorded autonomous base (`## Autonomous metadata` in
   `README.md`, per Slice B). Block before worktree creation if the package
   has no recorded base and no compatible supplied branch/PR resolves one.
2. `SKILL.md` "Workflow contract" step 2: replace "start from latest
   `origin/main`" with "start from the latest fetched recorded autonomous
   base".
3. `SKILL.md` "Reads": add the package `README.md`'s `## Autonomous
   metadata` section as a required read.
4. `reference.md` "Preflight":
   - Step 1: replace "Confirm `origin`, `main`, GitHub authentication, and
     push access" with "Confirm `origin`, the recorded autonomous base ref,
     GitHub authentication, and push access".
   - Step 2: replace "Fetch `origin/main` and the requested shared branch"
     with "Fetch `origin/<recorded base>` and the requested shared branch".
   - Step 4: state the worktree path explicitly: `.worktrees/implement-<slug>`.
   - Step 5: replace "otherwise use `origin/main`" with "otherwise use
     `origin/<recorded base>`".
   - Add a new preflight step: if `.worktrees/prepare-<slug>` exists for this
     package, verify its preparation PR merged into the recorded base and
     that worktree is clean before removing that preparation worktree and its
     local branch (per Slice B's "Worktree retention" contract). This
     implementation's own worktree is separate and unaffected by that check.
   - The PR-adoption paragraph: replace "Require an open PR ... with base
     `main`" with "Require an open PR ... with base equal to the recorded
     autonomous base".
5. `reference.md` "Initial PR body" template: replace
   `Base commit: <origin/main-sha>` with `Base commit: <origin/<recorded
   base>-sha>`, and add one field above it, `Autonomous base:
   <origin/branch>`.
6. `reference.md`: anywhere else `origin/main` appears as a hardcoded
   fallback (race-safe loop, rebase instructions), replace with "the recorded
   autonomous base" — `main` only remains as an example value inside prose,
   never as the actual default.

### `thejudge-implement-fanout`

7. `SKILL.md` "Reads": add each selected package's `README.md` `##
   Autonomous metadata` section.
8. `SKILL.md` "Gates": add — "All selected packages must record the same
   autonomous base. If selected packages record different bases, drop the
   mismatched package(s) from this dispatch run and report them; never
   dispatch packages with different recorded bases in the same run."
9. `SKILL.md` "Gates": add — "The orchestrator assigns each dispatched
   package an explicit, unique, preflighted frontend/backend port pair
   before dispatch. Preflight means confirming both ports are free on the
   host before assignment (for example via a bind-and-release check); do not
   assign a port already claimed by another dispatched package in this run
   or already bound by an unrelated process. Pass the assigned pair to the
   dispatched agent's prompt as explicit `PORT` (backend) and frontend dev
   port values; the dispatched agent's own `thejudge-implement-all` run
   starts its isolated dev server(s) on exactly those ports, never the shared
   defaults (backend `3000`, frontend `5173`)."
10. "Quick reference" table: no dispatch-target changes needed since
    `thejudge-implement-parallel` was already removed in Slice A.

## Acceptance criteria

- [ ] `thejudge-implement-all/SKILL.md` and `reference.md` contain no
      hardcoded `origin/main` default for the shared branch, worktree base,
      or PR base
- [ ] `reference.md`'s preflight includes the preparation-worktree
      merge-and-clean check before removing `.worktrees/prepare-<slug>`
- [ ] `thejudge-implement-fanout/SKILL.md` requires a common recorded base
      across dispatched packages and explicit preflighted, unique port pairs
      per package
- [ ] `npm run skills:ai-sync` run; all three skill trees byte-identical

## Verification

```bash
grep -n "origin/main" .cursor/skills/thejudge-implement-all/SKILL.md .cursor/skills/thejudge-implement-all/reference.md; test $? -eq 1
grep -n "recorded autonomous base\|Autonomous metadata" .cursor/skills/thejudge-implement-all/SKILL.md .cursor/skills/thejudge-implement-all/reference.md
grep -n "common.*base\|preflighted.*port\|unique.*port" .cursor/skills/thejudge-implement-fanout/SKILL.md
npm run skills:ai-sync
diff -rq .cursor/skills .agents/skills
diff -rq .cursor/skills .claude/skills
```

## Files touched

- `.cursor/skills/thejudge-implement-all/SKILL.md`
- `.cursor/skills/thejudge-implement-all/reference.md`
- `.cursor/skills/thejudge-implement-fanout/SKILL.md`
- `.agents/skills/thejudge-implement-all/*`, `.agents/skills/thejudge-implement-fanout/*` (synced)
- `.claude/skills/thejudge-implement-all/*`, `.claude/skills/thejudge-implement-fanout/*` (synced)
