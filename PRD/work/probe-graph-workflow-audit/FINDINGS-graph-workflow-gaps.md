# Findings — graph workflow gaps (branching, sync, parallelism)

Date: 2026-09-06. Analysis only. Every claim below names the file or command it
came from.

## The shape of one package today

One idea costs three pull requests and two branch recreations:

| Step | Branch | PR | Who merges |
| --- | --- | --- | --- |
| `graph-kickoff` (nodes 1–4) | `thejudge-auto/<slug>` created **from whatever the launch checkout is on**, nodes commit in the launch checkout | docs PR base→`main` (e.g. #195, #200) | owner, after answering the gate |
| GitHub `delete_branch_on_merge: true` | base branch **deleted** on merge | — | — |
| `graph-implement` claim + publish | base branch **re-created** locally from the stale local copy and pushed again | — | — |
| `build` (node 6) | `thejudge-auto/<slug>-work` in `.worktrees/implement-<slug>` | code PR `-work`→base (e.g. #197) | owner |
| driver reconcile + `close` | local base merged with origin base (conflicts), cleanup committed on base | **second** base→`main` PR (e.g. #199) | owner, last |

Evidence: `git log --first-parent main` shows the triplets #184/#185/#186,
#187/#188/#189, #190/#191/#192, #195/#197/#199. The hybrid receipt row
"driver-bookkeeping" records "GitHub had deleted the branch after PR #195
merged; re-created".

## Findings, ranked

### 1. The launch checkout is the driver's scratch branch (why you are "not on the branch I expect")

`graph-kickoff` runs nodes 2–4 **in the launch checkout**, on the run's base
branch, and parks there. Nothing switches back to `main`. Right now the checkout
sits on `thejudge-auto/ai-answer-quality-baseline` because PR #200 was opened
from it.

Worse, `resolveBase()` in `scripts/graph-preflight.mjs:321` defaults the new
branch's start point to **the current branch**, not `origin/main`. A fresh run
started from a checkout left on a previous run's base branches off that stale
base. Today this is prevented only by the driver prompt saying "the checkout is
on main… do not pass `--base`" (ledger, `### preflight` dispatch). That is a
convention, not a guard.

### 2. Two writers to the same package files (why land conflicts every time)

The driver commits `GRAPH-RUN.md`, `README.md`, `STATUS.*` and the board row on
the base branch in the launch checkout. The builder commits the same files on
`-work` in its worktree. The `-work`→base PR therefore conflicts on those files
at `land`, and the driver "reconciles" by merging origin base into the local
base and hand-resolving. Observed in the `land` rows of trade-balancer,
quick-lookup, shared-chrome, in-depth, user-feedback (GRAPH-RUN.md conflict),
scan-spec (needed a follow-up branch), hybrid (two conflicts, a dedicated
`close-` worktree). The "base is frozen once build opens the PR" rule in
`graph-implement/reference.md` is a patch over this, not a fix.

The mirror failure is memory gotcha 4: on 2026-09-05 the builder wrote slice
statuses and `STATUS.ship-ready` to the **launch checkout** and not to `-work`,
so the PR head read all-planned while the local tree read ship-ready.

### 3. "PR ready" and local state genuinely disagree by design

At the `land` park the driver sets `STATUS.owner-action` locally while the PR
head carries `STATUS.ship-ready` (hybrid receipt, node 8 parked row: "Package on
the PR head is ship-ready; locally the driver set STATUS.owner-action"). After
you merge, local base is behind origin base until a driver resume merges it.
So the message "PR is ready" is true of GitHub and false of the checkout, and
stays false until the next resume. The digest (`npm run graph:digest`) reports
GitHub state, not checkout state, so it cannot warn you.

### 4. The base→main guard makes parallel kickoff impossible today

`classifyPendingBaseToMain()` (`graph-preflight.mjs:532`) refuses **any** fresh
run while **any** open PR has a `thejudge-auto/*` head into `main`. Since
kickoff now ends by opening exactly such a PR and parking for your answer,
idea B cannot start until you have answered and merged idea A's docs PR. Right
now PR #200 blocks every new kickoff. The guard's original reason (branching
off a `main` that lacked the prior package, PR #107) is already solved by
starting every run from `origin/main`; it was flagged for retirement in the
phase-2 design and was not retired.

### 5. The documented parallel path contradicts preflight

`graph-preflight` `## Per-idea worktree isolation` says to run
`git worktree add .worktrees/kickoff-<slug> -b thejudge-auto/<slug> origin/main`
then launch `graph-kickoff` in that worktree. But node 1 then runs
`graph-preflight --branch thejudge-auto/<slug>`, and `findBranchCollision()`
(`graph-preflight.mjs:328`) exits 2 because `refs/heads/thejudge-auto/<slug>`
already exists. The two halves were never run together: no receipt or ledger
mentions a `kickoff-` worktree, and `graph-preflight.test.mjs` tests
`kickoffWorktreeCommand` in isolation only. Also, `graph-kickoff` never tells
the driver to `cd` anywhere; the "session rooted in its own worktree" is a
manual step with no runbook line saying how to launch it.

### 6. Sharing a root with a running build is unsafe (your fear is justified)

The boundary hook counts **every** tool call in every session rooted at
`$CLAUDE_PROJECT_DIR` against the live node's cap
(`graph-boundary-hook.mjs:362-373`; no session key anywhere in the hook or
`boundary-rules.mjs`). While a build holds the lock, an interactive session in
the same root burns the build's budget, hits the graph-tier denies
(protected paths, `sed -i` style writes, background `&`), and can be refused
outright by a stale run-state file (memory: 2026-08-24 incident). Two sessions
in one root is the one shape the design forbids, and nothing warns you when you
open one.

Safe today: one graph run per git root. Unsafe today: any second session in
that root while the lock exists.

### 7. `delete_branch_on_merge` fights the two-run design

Repo setting `delete_branch_on_merge: true` (verified via `gh api`). The design
needs the base branch to outlive the docs PR so build can target it and close
can commit to it. Every package therefore re-creates the base and needs a
**second** base→main PR at the end. Either turn the setting off, or drop the
base branch from the build half (branch `-work` from `main`, PR into `main`,
cleanup in the same PR). single-source-invariants already did the latter
(#188 `-work`→`main`) and still needed a separate cleanup PR (#189) because
cleanup runs after merge.

### 8. Nothing prunes local state

Observed in the launch checkout:

| Leftover | Count | Where |
| --- | --- | --- |
| local `thejudge-auto/*` branches fully merged into `main` | 8 of 13 | `git branch --merged main` |
| worktrees outside the allowed `.worktrees/` root | 2 | `.claude/worktrees/custom-domain-mtgjude`, `.claude/worktrees/probe-prompt-data-optimization` (upstream gone) |
| stale intake staging folders | 6 | `.worktrees/.graph-intake/graph-2026083*…` back to Aug 30 |
| node-call counters for finished runs | since Aug 30 | `.worktrees/.graph-node-calls.json` |
| leftover release record | 1 | `.worktrees/.graph-run-release.json` |

None of these breaks a run, but together they make "what state am I in" hard to
answer by looking, and the two `.claude/worktrees/` entries violate the
contract's "never a worktree outside `.worktrees/`" rule (they come from the
harness's own worktree feature, not the graph).

### 9. Small correctness nits

- `npm run graph:digest` lists "Recent receipts" alphabetically, so the
  2026-09-06 hybrid receipt is absent and 2026-08-25 user-feedback is listed.
- `.graph-node-calls.json` is never reset at a terminal state, so the file only
  grows; the cap still works because keys include the run id.

## What you have not missed

The safety layer is real and it fires: lock, canaries, per-node caps, no
`gh pr merge`, no force-push, protected-path denies. The parking and resume
model works (nine packages shipped through it in two weeks). The problems above
are almost all in one place: **the launch checkout doubles as the driver's
working branch**, and every branch, sync, and parallel symptom follows from that.

## Recommended order

1. **Stop starting runs from the current branch.** Preflight always branches
   from `origin/main` (pass `--base origin/main`, or change `resolveBase`'s
   default). Removes the stale-base risk and the guard's reason to exist.
2. **Retire the base→main guard** (finding 4). Without it, a second kickoff can
   start while the first waits for your answer. Cheapest single change that
   unblocks parallel work.
3. **Run kickoff in its own worktree always, not only for parallel.** Fix the
   collision (finding 5): either the worktree command stops creating the branch
   and preflight creates it, or preflight adopts a branch that equals the
   worktree HEAD. Then the launch checkout stays on `main`, parallel is "the
   same thing twice", and a second kickoff is safe by construction (finding 6).
4. **One writer per branch** (finding 2). The driver's ledger and status commits
   go to the `-work` branch during build (or a dedicated ledger file the builder
   never touches). Land stops conflicting; the "base frozen" rule disappears.
5. **Decide the base branch's fate** (finding 7): turn off
   `delete_branch_on_merge`, or build from `main` and put cleanup in the code PR
   so a package costs two PRs, not three.
6. **Housekeeping and a runbook** (finding 8): prune merged local branches,
   remove the two `.claude/worktrees/` entries, clear staging folders, and write
   a one-page "start idea B while idea A waits" runbook with the exact commands.

Items 1, 2, and 6 are an afternoon. Items 3 and 4 are a proper package through
`graph-kickoff`.
