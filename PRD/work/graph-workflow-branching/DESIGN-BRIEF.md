# Design brief — graph-workflow-branching

Status: refined (owner approved the design and the three decisions on 2026-09-06)

## What the owner gets

You type `/graph-kickoff "<idea>"` and your checkout stays on `main`. The run
does its spec work in its own folder, `.worktrees/kickoff-<slug>`, always
branched from `origin/main`. While idea A's docs PR waits for your answer you
start idea B from the same terminal, and it is not refused. One session per
repository root while a build is running stays the rule, and the runbook says
so. A `npm run graph:prune` command shows what is left over and deletes it only
when you say `--apply`.

## Scope

Part 1 of the graph-workflow fix. Evidence and ranking:
`PRD/work/probe-graph-workflow-audit/FINDINGS-graph-workflow-gaps.md`
(findings 1, 4, 5, 6, 8). Part 2 — one writer per branch for the `land`
conflicts, and the base branch's fate under GitHub's delete-on-merge — is a
separate package and a non-goal here.

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
`scripts/graph-digest.mjs`, which keeps listing pending base→main PRs.

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

From a session already rooted in a linked worktree (REQ-170's parallel model),
preflight works in place: it requires `git status --porcelain` empty, else
exits 1 naming the dirty paths; then `git switch -c <branch> origin/main` and
push, as today minus the commit/stash.

The launch checkout is never committed to, stashed, or switched. Removed with
it: `classifyWorkingTree`, `collectEntries`, `SECRET_PATTERNS`, the
`--max-files` / `--max-lines` flags, the auto-commit message, the stash lines
in `formatFailureReport`, the contract's `## Stashed work handoff` section, and
the "one `git add -A` survives" paragraph in `## Boundaries`.

`--slug` becomes required on the fresh-run path (it names the worktree); it
already is on `--take-lock`.

The lock stays at the root. This is the shape the build half already uses:
node 6 works in `.worktrees/implement-<slug>` while the lock sits at the root,
and the hook's protected-path match is a suffix match
(`boundary-rules.mjs:848`, `:977`), so `.worktrees/kickoff-x/.claude/skills/thejudge-*`
is still denied. Verified by reading, and asserted by a new hook test.

`graph-kickoff` passes `Working directory: <root>/.worktrees/kickoff-<slug>`
to nodes 2–4 and runs its own ledger commits with `git -C <that path>`. Intake
staging stays at the root (`<root>/.worktrees/.graph-intake/<run-id>/`) and is
passed as an absolute path. The docs PR is opened from the worktree branch. At
the `owner-action` park the worktree stays and its path is reported.

Owner decision (2026-09-06): the kickoff worktree is removed at build claim.
`graph-implement`, when it claims a merged spec, removes
`.worktrees/kickoff-<slug>` with `git worktree remove` (never `--force`) and
`git branch -d` (never `-D`) when the tree is clean and the branch is merged
into `origin/main`; otherwise it parks naming the worktree. `thejudge-cleanup`
already refuses stray worktrees at close, so a missed removal is caught.

### D4. The documented parallel path is made true

`kickoffWorktreeCommand()` and `graph-preflight`'s `## Per-idea worktree
isolation` section told the owner to create the branch by hand, then node 1
refused it as a collision. With D3 the command is preflight's own planned
step, and the section is rewritten: parallel = a second session rooted in a
second checkout, which then runs in place. No receipt ever exercised the old
path (`grep kickoff- PRD/instructions/receipts/` is empty).

### D5. `npm run graph:prune`

Owner decision (2026-09-06): include, dry-run by default.

`scripts/graph-prune.mjs` lists, and with `--apply` deletes:

- local `thejudge-auto/*` branches fully merged into `origin/main`
  (`git branch -d` only);
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

`OPERATOR.md`: new recipe "Start a second idea while the first waits" (create
nothing; just run `/graph-kickoff` again — the guard is gone and the checkout
is untouched; for two runs *at the same time*, open a second session rooted in a
second checkout); recipe 5 loses the "the system now refuses to start a new
run" sentence; recipe 3 states the one-session-per-root rule while a build
holds the lock (finding 6: the hook counts every session's tool calls against
the live node's cap). `PRD/README.md` line 130 and `AGENT-SKILLS.md` rows for
`graph-preflight` and the codehealth paragraph are updated to match.

## Assumptions

| # | Assumption | Evidence | Rung |
| --- | --- | --- | --- |
| A1 | The hook's protected-path denial reaches files inside a kickoff worktree | `boundary-rules.mjs:848` and `:977` match `endsWith('/' + target)`; the build half already relies on this in `.worktrees/implement-<slug>` | verified by reading; a test is added |
| A2 | `gh pr create` works from inside a worktree | `gh` resolves the repo from any checkout; the codehealth loop already opens PRs from `.worktrees/.codehealth/*` | observed in prior runs |
| A3 | `git worktree add` inside a run is not a denied command | The universal tier denies `rm -rf`, force-push, `main` pushes, etc.; the contract forbids worktrees *outside* `.worktrees/`, not inside | contract `## Boundaries` |
| A4 | Removing auto-commit/stash loses no owner protection | Nodes never touch the launch checkout after D3, so there is nothing to protect; a dirty in-place worktree refuses | owner decision |
| A5 | The parked answer-quality package is unaffected | It is at `STATUS.refined` on `main`; `graph-implement` claims from `main` and builds in `implement-<slug>`; no kickoff worktree exists for it, so the claim-time removal is a no-op | `PRD/work/STATUS.md` |

## Measurement plan

- `npm run test:scripts` green: rewritten `graph-preflight.test.mjs` (worktree
  plan, in-place plan, dirty in-place refusal, no guard, `origin/main` default,
  `--base` override), new `graph-prune.test.mjs`, one new boundary-hook test
  for the worktree-prefixed protected path.
- Live smoke from a clean `main` checkout after merge, recorded in the receipt:
  `npm run graph:preflight -- --branch thejudge-auto/smoke --slug smoke --run-id graph-smoke --dry-run`
  prints the worktree plan and `base: origin/main`; the real run creates the
  worktree and pushes; `git branch --show-current` at the root is still
  `main`; `npm run graph:prune` lists the smoke branch as not-merged (kept);
  after deleting the remote branch by hand, `--apply` removes it.
- `npm run graph:prune` on the owner's checkout lists the 8 merged
  `thejudge-auto/*` branches and 6 stale intake folders found by the audit.

## Non-goals

- One writer per branch for the `land` conflicts (part 2).
- The base branch's fate under `delete_branch_on_merge` (part 2).
- Any change to the boundary hook's rules, the lock record, the node table,
  caps, or terminal states.
- Concurrent *builds*; `graph-implement` stays single and sequential.

## Files touched at build

Scripts: `scripts/graph-preflight.mjs` (+test), `scripts/graph-digest.mjs`
(+test), new `scripts/graph-prune.mjs` (+test), `scripts/graph-boundary-hook.test.mjs`
(one test), `package.json` (`graph:prune`).
Skills (both trees via `npm run skills:ai-sync`): `graph-preflight`,
`graph-kickoff`, `graph-implement` (+reference), `codehealth` (two sentences).
Docs: `PRD/instructions/graph-workflow-contract.md`, `OPERATOR.md`,
`AGENT-SKILLS.md`, `PRD/README.md`.
Product truth (applied by build from `GATE-QUESTIONS.md`): new REQ-191,
REQ-192; amended REQ-170, REQ-162, REQ-164.

## References

REQ-152, REQ-153 (hook tiers, lock unchanged), REQ-159 (canary at run start),
REQ-160, REQ-161 (door and branch naming), REQ-162, REQ-164, REQ-170,
REQ-171 (build loop claims from `main`).
