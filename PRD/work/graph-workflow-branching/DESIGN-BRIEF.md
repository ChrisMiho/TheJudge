# Design brief — graph-workflow-branching

Status: refined (owner approved the design and the three decisions on
2026-09-06; corrected after the first quality-check FAIL the same day)

## What the owner gets

You type `/graph-kickoff "<idea>"` and your checkout stays on `main`. The run
does its spec work in its own folder, `.worktrees/kickoff-<slug>`, always
branched from `origin/main`. While idea A's docs PR waits for your answer you
start idea B from the same terminal, and it is not refused. One session per
repository root while a run is executing stays the rule, and the runbook says
so. A `npm run graph:prune` command shows what is left over and deletes it only
when you say `--apply`.

## Scope

Part 1 of the graph-workflow fix. Evidence and ranking:
`PRD/work/probe-graph-workflow-audit/FINDINGS-graph-workflow-gaps.md`
(findings 1, 4, 5, 6, 8). Part 2 — one writer per branch for the `land`
conflicts, and the base branch's fate under GitHub's delete-on-merge — is a
separate package and a non-goal here. D3 below deliberately leaves the local
base branch in place for that reason.

## Decisions

### D1. A fresh run always branches from `origin/main`

Today `resolveBase()` (`scripts/graph-preflight.mjs:321`) defaults to the
current branch, so a run started from a checkout left on a previous run's base
branches off that stale base. Only the dispatch prompt's "the checkout is on
main" line prevents it. New default: `origin/main`, after the fetch the script
already runs first. `--base <ref>` stays as the explicit override and is
reported as such.

### D2. The base→main guard is retired

`classifyPendingBaseToMain()` refuses any fresh run while any open PR has a
`thejudge-auto/*` head into `main`. Since kickoff now *ends* by opening exactly
such a PR and parking for the owner, the guard blocks every second idea. Its
original purpose (a run branching off a `main` that lacked the prior package,
PR #107) is met by D1. The function, its `main()` block, its tests, and every
prose mention are removed. `OPEN_BASE_TO_MAIN_PRS_COMMAND` moves into
`scripts/graph-digest.mjs`, which keeps listing pending base→main PRs;
`GRAPH_BRANCH_PREFIX` stays exported from the preflight script because the
digest imports it too.

### D3. Preflight creates the kickoff worktree; nodes 2–4 work there

Owner decision (2026-09-06): retire auto-commit/stash entirely.

From a root checkout (`git rev-parse --git-dir` equals `--git-common-dir`),
preflight:

1. checks the stop sentinel and takes the lock at the root, as today;
2. `git fetch origin`; branch-collision check, as today; refuses if
   `.worktrees/kickoff-<slug>` already exists;
3. `git worktree add .worktrees/kickoff-<slug> -b thejudge-auto/<slug> origin/main`
   (or `--base`);
4. `git -C .worktrees/kickoff-<slug> push -u origin thejudge-auto/<slug>`;
5. prints `worktree: <absolute path>` and `base: origin/main`.

From a session already rooted in a linked worktree (the true-parallel shape,
below), preflight works in place: it requires `git status --porcelain` empty,
else exits 1 naming the dirty paths; then `git switch -c <branch> origin/main`
(from a branch or a detached HEAD) and push, as today minus the commit/stash.

The launch checkout is never committed to, stashed, or switched. Removed with
it: `classifyWorkingTree`, `collectEntries`, `SECRET_PATTERNS`, the
`--max-files` / `--max-lines` flags, the auto-commit message, the stash lines
in `formatFailureReport`, the contract's `## Stashed work handoff` section, the
"one `git add -A` survives" paragraph in `## Boundaries`, and the two dead
`git stash` allow rules in `.claude/graph-profile.json`.

`--slug` becomes required on the fresh-run path (it names the worktree); it
already is on `--take-lock`.

**The lock and every control file stay at the root**, the shape the build
half already uses for `.worktrees/implement-<slug>`.

**Hook fix (closes a pre-existing gap).** The first quality check found that
the hook's `protected-path-write` rule (`scripts/lib/boundary-rules.mjs:1064`)
tests `isProtectedPath()` from `scripts/lib/protected-paths.mjs`, whose
patterns are anchored `^…$`. A write to
`.worktrees/kickoff-x/.claude/skills/thejudge-map-out/SKILL.md`, or to the
same file by absolute path, is **allowed** today; so is the same write under
`.worktrees/implement-x/`, which means the build half has never actually been
protected by this rule inside its worktree. This package makes the rule
worktree-aware: before matching, a written path is made relative to the
project root (`$CLAUDE_PROJECT_DIR` or the payload `cwd`) and any leading
`.worktrees/<dir>/` segment is stripped. Pure function
`repoRelativeWritePath(candidate, root)` in `boundary-rules.mjs`, tested for
the relative, absolute, kickoff-, and implement-prefixed forms. The tiers, the
lock record, the node table, and every other rule are unchanged.

**Where the ledger lives, and how a resume finds it.** The ledger is
`.worktrees/kickoff-<slug>/PRD/work/<slug>/GRAPH-RUN.md` — the package exists
only on the run branch. The ledger header gains one line,
`- Worktree: <absolute path>`, and `graph-kickoff` resumes a slug by reading
that deterministic path (`kickoffWorktreePath(slug)` under the root), passing
the same path to `scripts/graph-ledger-check.mjs`. If the worktree is missing
on resume, the run ends `BLOCKED` naming it — never silently re-created.

`graph-kickoff` passes `Working directory: <root>/.worktrees/kickoff-<slug>`
to nodes 2–4 and runs its own ledger commits with `git -C <that path>`. Intake
staging stays at the root (`<root>/.worktrees/.graph-intake/<run-id>/`) and is
passed as an absolute path. The docs PR is opened from the worktree branch
(`gh` resolves the repository from any checkout; the codehealth loop already
opens PRs from `.worktrees/.codehealth/*`). At the `owner-action` park the
worktree stays and its path is reported.

**Removal at build claim — the worktree only.** Owner decision (2026-09-06):
the kickoff worktree is removed when `graph-implement` claims the merged spec.
It runs `git worktree remove .worktrees/kickoff-<slug>` (never `--force`) when
the tree is clean, and parks naming the worktree otherwise. **It does not
delete the local `thejudge-auto/<slug>` branch**: the build half still records
that branch as its autonomous base, publishes to it before `build`, and opens
the `-work`→base PR against it; with GitHub's delete-on-merge the local copy is
the only one left, and re-creating it is part 2's decision. `thejudge-cleanup`
already refuses stray worktrees at close, so a missed removal is caught.

**True parallelism: two sessions, two checkouts.** Running two ideas at the
same moment needs two roots, because the hook counts every session's tool
calls in one root against the live node's cap and denies the second session on
the first run's rules. The recipe is: `git worktree add --detach
.worktrees/session-<name> origin/main`, launch the session there, run
`/graph-kickoff` — preflight sees a linked worktree and works in place from the
detached HEAD. `--detach` is what avoids the D4 collision; a hand-made
`-b thejudge-auto/<slug>` would recreate it.

### D4. The documented parallel path is made true

`kickoffWorktreeCommand()` and `graph-preflight`'s `## Per-idea worktree
isolation` section told the owner to create the branch by hand, then node 1
refused it as a collision. With D3 the command is preflight's own planned
step, and the section is rewritten around the two shapes above. No receipt
ever exercised the old path (`grep kickoff- PRD/instructions/receipts/` is
empty).

### D5. `npm run graph:prune`

Owner decision (2026-09-06): include, dry-run by default.

`scripts/graph-prune.mjs` lists, and with `--apply` deletes:

- local `thejudge-auto/*` branches fully merged into `origin/main` **whose
  package folder `PRD/work/<slug>/` no longer exists on `origin/main`** — a
  merged docs branch whose package is still queued is the build half's base
  and is kept, reported as "kept: package still on main" (`git branch -d`
  only);
- worktrees under `.worktrees/` whose branch is merged and whose tree is clean
  (`git worktree remove`, no `--force`);
- `.worktrees/.graph-intake/<run-id>/` folders whose run id is not in a live
  lock.

It never touches a remote ref, never deletes `.worktrees/.graph-*` control
files, and only *reports* worktrees outside `.worktrees/` (today:
`.claude/worktrees/*`, from the harness's own worktree feature). Pure
classification in a tested function, I/O in `main()`, matching the preflight
script's shape.

### D6. Runbook

`OPERATOR.md`: new recipe "Start a second idea while the first waits" (just
run `/graph-kickoff` again — the guard is gone and the checkout is untouched);
inside it, the two-sessions recipe from D3 for running two ideas *at the same
time*; recipe 5 loses the "the system now refuses to start a new run"
sentence; recipe 3 states the one-session-per-root rule while a run holds the
lock. `PRD/README.md` line 130, `AGENT-SKILLS.md` (the `graph-preflight` row
and the codehealth paragraph), and the two codehealth skill sentences are
updated to match.

## Assumptions

| # | Assumption | Evidence | Rung |
| --- | --- | --- | --- |
| A1 | The hook can be made to deny protected paths inside a worktree with a path-normalization change to one rule | `boundary-rules.mjs:1064-1075` calls `isProtectedPath(normalizePathText(candidate))`; `protected-paths.mjs:83-86` anchors `^…$`; a relativize-and-strip step before the call is local to that rule | verified by the first quality check's direct drive of the rule (worktree-prefixed and absolute forms both `allow` today) |
| A2 | `gh pr create` works from inside a worktree | `gh` resolves the repo from any checkout; the codehealth loop already opens PRs from `.worktrees/.codehealth/*` | observed in prior runs |
| A3 | `git worktree add` inside a run is not a denied command | `.claude/graph-profile.json` already allows `git worktree add .worktrees/*`, `git worktree remove *`, `git branch -d *` and denies `-D`; the contract forbids worktrees *outside* `.worktrees/` | profile lines 22, 33–34, 162 (first quality check) |
| A4 | Removing auto-commit/stash loses no owner protection | Nodes never touch the launch checkout after D3; a dirty in-place worktree refuses | owner decision |
| A5 | The parked answer-quality package is unaffected | It is at `STATUS.refined` on `main`; `graph-implement` claims from `main` and builds in `implement-<slug>`; no kickoff worktree exists for it, so the claim-time removal is a no-op | `PRD/work/STATUS.md` |
| A6 | Keeping the local base branch at claim keeps the build half working exactly as today | `graph-implement/reference.md:73-101` publishes to and PRs against `origin/<autonomous base>`; today it re-creates the remote from the local branch | hybrid receipt, "driver-bookkeeping" row |

## Measurement plan

- `npm run test:scripts` green: rewritten `graph-preflight.test.mjs` (worktree
  plan, in-place plan from a branch and from a detached HEAD, dirty in-place
  refusal, existing-worktree refusal, no guard, `origin/main` default, `--base`
  override, `--slug` required); new `graph-prune.test.mjs` (including the
  "package still on main" keep rule); `boundary-rules.test.mjs` /
  `graph-boundary-hook.test.mjs` gain the four protected-path forms (relative,
  absolute, `.worktrees/kickoff-x/…`, `.worktrees/implement-x/…`), each denied
  while the lock is held and allowed without it.
- Live smoke from a clean `main` checkout after merge, recorded in the receipt:
  `npm run graph:preflight -- --branch thejudge-auto/smoke --slug smoke --run-id graph-smoke --dry-run`
  prints the worktree plan and `base: origin/main`; the real run creates the
  worktree and pushes; `git branch --show-current` at the root is still
  `main`; `npm run graph:prune` lists the smoke branch as not-merged (kept);
  after deleting the remote branch by hand, `--apply` removes it.
- `npm run graph:prune` on the owner's checkout lists the 8 merged
  `thejudge-auto/*` branches and 6 stale intake folders found by the audit,
  and keeps `thejudge-auto/ai-answer-quality-baseline` (package still on
  `main`).
- The two skill fixtures under `PRD/instructions/skill-fixtures/graph-kickoff/`
  are re-run per `PRD/instructions/skill-testing.md` after their rewrite.

## Non-goals

- One writer per branch for the `land` conflicts (part 2).
- The base branch's fate under `delete_branch_on_merge`, including who
  re-creates it and from what (part 2). D3 keeps the local branch so nothing
  here pre-empts that decision.
- Any change to the hook's tiers, the lock record, the node table, caps, or
  terminal states. The one hook change is the path normalization in D3.
- Concurrent *builds*; `graph-implement` stays single and sequential.

## Files touched at build

Scripts: `scripts/graph-preflight.mjs` (+test), `scripts/graph-digest.mjs`
(+test), new `scripts/graph-prune.mjs` (+test), `scripts/lib/boundary-rules.mjs`
(+test) and `scripts/graph-boundary-hook.mjs` (pass the root to the rule) with
`graph-boundary-hook.test.mjs`, `package.json` (`graph:prune`),
`.claude/graph-profile.json` (drop the two `git stash` allows).
Skills (both trees via `npm run skills:ai-sync`): `graph-preflight`,
`graph-kickoff`, `graph-implement` (+reference), `codehealth` (two sentences).
Docs: `PRD/instructions/graph-workflow-contract.md` — `## Overall flow` step 2
(line 48), `## The two runs` guard sentence (139–140), the ledger header and
example row (474–489, add `Worktree:`, drop `stash`), `## Stashed work
handoff` (577–588, removed), `## Human gates` trigger "any `blocked` preflight
classification" (603–605, becomes "a dirty in-place checkout"), `## One run at
a time` rationale (870–882), the `git add -A` paragraph (751–764);
`OPERATOR.md`, `AGENT-SKILLS.md`, `PRD/README.md`;
`PRD/instructions/skill-fixtures/graph-kickoff/dirty-checkout-and-gate.md`
(rewritten as "untouched launch checkout and gate": the precondition becomes a
dirty root checkout that the run must leave byte-unchanged) and
`single-door-and-thin-request.md` (item 7: the report names the worktree, not
a commit/stash).
Product truth (applied by build from `GATE-QUESTIONS.md`): new REQ-191,
REQ-192; amended REQ-170, REQ-162, REQ-164, REQ-161; amended FLOW-022.

## References

REQ-152, REQ-153 (hook tiers, lock unchanged), REQ-159 (canary at run start),
REQ-160, REQ-161 (door and branch naming), REQ-162, REQ-164, REQ-170,
REQ-171 (build loop claims from `main`), FLOW-022 (intake flow).
