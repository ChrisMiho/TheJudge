# Slice B — Autonomous base and preparation ownership

## Status: planned

## Goal

Make `thejudge-prepare` require an explicit operator-named remote base,
record it as durable package metadata, and use it (not `main`) for the
preparation worktree/branch/PR.

## Requirements

1. `.cursor/skills/thejudge-prepare/SKILL.md`:
   - "Goal and inputs": require an explicit remote base argument, e.g.
     `--base feature/example`. State plainly that `thejudge-prepare` never
     defaults to `main` and never infers the current branch as the base. If
     no base is supplied and none can be resolved from a compatible supplied
     branch/PR, stop before any worktree/branch/PR action and report the
     missing base as a blocker (do not silently choose `main`).
   - "One-package loop" step 1 (Git/worktree preflight): note that the
     preflight resolves and validates the base argument before any worktree
     creation. The preflight also refuses to create or adopt a worktree at
     any path outside the repo-local `.worktrees/` root — including a sibling
     directory such as `../<repo>-worktrees/`, a temp/scratchpad path, or an
     absolute path elsewhere on disk. If a supplied or discovered worktree
     sits outside `.worktrees/`, stop and report it as a blocker rather than
     adopting it. Evidence this is a live drift, not a hypothetical: as of
     2026-08-05 eight `thejudge-auto/*` worktrees existed under a sibling
     `TheJudge-worktrees/` directory despite the contract naming
     `.worktrees/`.
   - "Terminal states" table: extend the `READY` and `BLOCKED` rows'
     "Required result" to include "recorded autonomous base" alongside the
     existing fields, matching `preparation-contract.md`.
   - Add one line under "Boundaries": every terminal report (`READY`,
     `BLOCKED`, or external blocker) names the recorded autonomous base,
     worktree path, local branch, remote branch, PR URL, and PR base.
2. `PRD/instructions/preparation-contract.md`:
   - Add a new `## Autonomous base` section (after "Direct versus
     orchestrated mode predicate") stating: `thejudge-prepare` is an explicit
     opt-in that requires a remote base argument such as `--base
     feature/example`; it never defaults to `main` or infers the current
     branch; a missing, unavailable, or contradicted base blocks before
     worktree creation.
   - Add the durable-metadata shape this section requires, recorded in the
     package `README.md`:
     ```markdown
     ## Autonomous metadata

     - Autonomous base: origin/<branch>
     ```
     State that downstream autonomous skills (`thejudge-implement-all`,
     `thejudge-implement-fanout`, `thejudge-cleanup`) read and inherit this
     value and block if it is missing, unavailable, or contradicted by a
     supplied branch or PR (Slices C and D wire the reader side).
   - "Git/PR authorization boundary": replace "an isolated worktree from the
     latest `origin/main`" with "an isolated worktree from the latest fetched
     recorded autonomous base"; replace the implicit `main` PR-base assumption
     with "PR base: the recorded autonomous base"; state the worktree path is
     `.worktrees/prepare-<slug>` and the branch is `thejudge-prep/<slug>`
     unless a compatible preparation branch/PR is supplied.
   - Add a `## Worktree retention` section: the preparation worktree and
     local branch remain after `READY` or `BLOCKED` publication until
     implementation preflight proves the PR merged into the recorded base and
     the worktree is clean; only then are they removed (Slice C's
     implementation preflight owns the actual removal step — this section
     states the contract prepare must not violate by self-deleting early).
   - "Phase inputs, outputs, and valid status transitions" table: no phase
     row changes, but add one sentence above the table noting the recorded
     base is a precondition for every phase, not phase-specific state.
3. `.cursor/skills/thejudge-prepare/reference.md`:
   - "Isolated preflight" step 1: replace "fetch the latest `origin/main`"
     with "resolve the required `--base` argument (or a compatible supplied
     branch/PR's base), then fetch the latest `origin/<recorded base>`". If
     unresolved, stop with an external-blocker-shaped report naming the
     missing base — do not fall back to `main`.
   - Step 2 (adopting a supplied PR/branch): replace "targets this
     repository's `main`" with "targets the recorded autonomous base".
   - Step 3: replace "create an isolated worktree at the fetched `origin/main`"
     with "create an isolated worktree at `.worktrees/prepare-<slug>`, based
     on the fetched recorded autonomous base".
   - "READY publication" body's "Post-merge command" field is unchanged
     (`$thejudge-implement-all PRD/work/<slug>/`); add one field above it,
     `## Recorded base`, containing `origin/<branch>`, so the PR body always
     states the base a human reviewer is merging into.
   - "BLOCKED publication" body: add the same `## Recorded base` field.

## Acceptance criteria

- [ ] `thejudge-prepare/SKILL.md` and `preparation-contract.md` state the
      `--base` requirement and the "never defaults to `main`" rule in at
      least one place each
- [ ] `preparation-contract.md` defines the exact `## Autonomous metadata`
      README block shape with `Autonomous base: origin/<branch>`
- [ ] `reference.md`'s preflight, worktree path, and PR body templates no
      longer hardcode `origin/main` as the preparation base or PR base
- [ ] `npm run skills:ai-sync` run; all three skill trees byte-identical

## Verification

```bash
grep -n "base feature/example\|never defaults to \`main\`\|--base" .cursor/skills/thejudge-prepare/SKILL.md PRD/instructions/preparation-contract.md
grep -n "Autonomous base: origin" PRD/instructions/preparation-contract.md
grep -n "origin/main" .cursor/skills/thejudge-prepare/reference.md; test $? -eq 1
npm run skills:ai-sync
diff -rq .cursor/skills .agents/skills
diff -rq .cursor/skills .claude/skills
```

## Files touched

- `.cursor/skills/thejudge-prepare/SKILL.md`
- `.cursor/skills/thejudge-prepare/reference.md`
- `PRD/instructions/preparation-contract.md`
- `.agents/skills/thejudge-prepare/*` (synced)
- `.claude/skills/thejudge-prepare/*` (synced)
