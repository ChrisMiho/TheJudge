# Receipt — graph-workflow

- Date: 2026-08-20
- Slug: `graph-workflow`
- Status: shipped

## Actions taken

- [x] Verified all fifteen slices A–O are `done` and the package carried `status: ship-ready` + `STATUS.ship-ready`.
- [x] Passed the autonomous merge-proof gate, all four checks (see **Merge proof** below).
- [x] Promoted the one piece of durable truth the package added after ship-ready — the merge/pull permission decision — into DEC-164 and its `decisions.md` router row.
- [x] Confirmed DEC-163, DEC-164, and DEC-165 already carry every other promotion-checklist item; refinement wrote them, and re-reading them against the shipped tree found no drift.
- [x] Left Q-005 open, as the checklist directs — it is decided when `card-collection-manager` is next picked up, not by this package.
- [x] Made no `system-map.md` change: DEC-163, DEC-164, and DEC-165 each record that no entry is added, since the work is agent workflow and developer tooling with no product surface.
- [x] Wrote this receipt **before** deleting the work folder.
- [x] Deleted `PRD/work/graph-workflow/` with `git rm -r` and removed the slug from `PRD/work/STATUS.md`.
- [x] Removed the `.worktrees/implement-graph-workflow` worktree and its local branch `thejudge-impl/graph-workflow-20260818-1658`. The remote branch is untouched.

No `GRAPH-RUN.md` existed in this package — the fifteen slices were implemented by
`thejudge-implement-all` in an ordinary unattended session, not by a profiled
`graph-run`. So this receipt carries no `## Graph run` section, per the skill's rule
that a package without a ledger cleans up normally.

## Merge proof

The package's `## Autonomous metadata` recorded `Autonomous base:
origin/feature/graph-workflow-hardening`. All four checks passed:

1. **Branch** — cleanup ran on `feature/graph-workflow-hardening`, the recorded base
   exactly. The base still exists on the remote, so the deleted-base fallback path
   was not used.
2. **Pull request** — PR #91 (`thejudge-auto/graph-workflow`), merged 2026-08-20 as
   `029d7b6`, base `feature/graph-workflow-hardening`. Verified through `gh pr view
   91 --json state,baseRefName,mergedAt` with the API reachable; no local fallback
   was needed.
3. **Worktree** — `.worktrees/implement-graph-workflow` at `8c37aa0`, `git status
   --porcelain` empty, and `thejudge-impl/graph-workflow-20260818-1658` is an
   ancestor of the base tip. Clean and fully merged.
4. **Runtime cleanup criteria** — none apply. The package touches skills, scripts,
   profile JSON, and docs, with no browser-observable risk, so no slice recorded
   owner/session, port, or `browser_close` evidence.

## Shipped behavior

Fifteen slices on `thejudge-auto/graph-workflow`, merged through PR #91:

- **A** — Cursor dropped. `.cursor/` deleted whole, `.claude/skills/` becomes the
  canonical skill tree with `.agents/skills/` its only mirror, and the sync script is
  repointed in the same change so `npm run skills:ai-sync` never breaks.
- **B** — the sync ported from `sync-agent-skills.sh` to `sync-agent-skills.mjs`,
  writing through `scripts/lib/protected-paths.mjs` — the helper's single declared
  protected write.
- **C** — `scripts/protected-write-guard.test.mjs`: a source scan failing any
  non-test script that holds both an `fs` write API and a protected-path literal, with
  exactly one exemption and anchored call-form matching.
- **D** — the permission profile reconciled against the nine nodes' real command
  surface, plus a fourth terminal state, `PROMPTED`, because a permission prompt in an
  autonomous session is a hang rather than a park.
- **E** — `git add -A` / `--all` / `.` denied outright; path-scoped `git add` stays
  allowed.
- **F** — an `env` sentinel in the profile, so `Profile: loaded` is observed rather
  than taken on the operator's word.
- **G** — `scripts/graph-ledger-check.mjs` blocks a dispatch carrying
  conditional-future authorization, and `## Instruction ledger` replaces
  `## Refused instructions`.
- **H** — every dispatch pins an absolute working directory and propagates it into
  nested prompts; node 6's writes are asserted in scope.
- **I** — `graph-preflight` takes a concurrency lock at `.worktrees/.graph-run.lock`,
  with stale-PID detection.
- **J** — the control predicate extended to `thejudge-implement-all` and
  `thejudge-cleanup`.
- **K** — the run ledger folded verbatim into the cleanup receipt before the work
  folder is deleted, with the delete refused when the section is missing.
- **L** — `define` parks on any `PRD/sections/` diff, and `graph-gate-review` walks
  that diff one stable ID at a time and resumes the run.
- **M** — `scripts/fixture-rig.mjs` owns rep setup: one clone and one bare origin per
  rep, with a before/after snapshot of the invoking checkout.
- **N** — a `thejudge-cleanup` fixture covering both `69eaee9` gate changes.
- **O** — fixture item 5 re-scoped to verify the validator fires rather than that
  wording persuades; ship gates re-measured.

Added after ship-ready, by owner decision on 2026-08-18 and shipped in the same PR: a
graph run may `git merge` and `git pull`, provided it is not into the trunk and not
forced — two allows against 48 denies, enforced at the push rather than at the merge.

## Durable truth promoted

1. **DEC-164** — new Impact bullet recording the merge/pull permission, its 48 denies,
   the stated limit (a permission rule cannot see the branch merged *into*, so
   enforcement lands at the push), and that node 8's pull-request merge stays the
   owner's. `graph-workflow-contract.md` already carried the rule; the decision record
   did not.
2. **`decisions.md`** — DEC-164's router row extended with the same clause, so the
   index summarizes what the entry now says.
3. **DEC-165** — the two references to `PRD/work/graph-workflow/PLAN-spine.md` as a
   legitimate-keep category for the Cursor grep updated: that file went with the work
   folder in this cleanup, leaving `PRD/instructions/receipts/*` as the only keep of
   its kind.

## Verification

- `npm run test:scripts` — 138 tests, 138 pass, 0 fail.
- `diff -rq .claude/skills .agents/skills` — no output; the mirror is in step.
- `git status --porcelain` — empty in both the launch checkout and the implementation
  worktree before deletion.
- No secrets committed.

## Files

- Updated: `PRD/sections/decisions/doc-process.md`, `PRD/sections/decisions.md`,
  `PRD/work/STATUS.md`
- Created: this receipt
- Deleted: `PRD/work/graph-workflow/` — `README.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`,
  `HANDOFF.md`, `PLAN-spine.md`, `ideaBraindump.md`, and the fifteen slice docs
  `slice-a-*.md` … `slice-o-*.md`
