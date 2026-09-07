---
name: graph-preflight
description: >-
  Use before an autonomous graph run to ready the checkout without touching
  the owner's work — creating the run's branch off origin/main in its own
  kickoff worktree (or in place when the session is already rooted in a
  worktree), pushing it, and taking the concurrency lock.
---

# Graph Preflight

## Goal

Leave the repository in exactly one state: a freshly created branch cut from
`origin/main`, pushed to `origin`, checked out in a worktree the run owns —
and the owner's launch checkout untouched. Nothing here commits, stashes, or
switches the owner's tree (REQ-191).

Read `PRD/instructions/graph-workflow-contract.md` before acting.

## Inputs

- `--branch <name>` (required). Never infer it, never reuse the current branch,
  never default to `main`.
- `--slug <slug>` (required). Names the kickoff worktree
  (`.worktrees/kickoff-<slug>`) and the package the lock records.
- `--base <ref>` (optional; defaults to `origin/main`). The new branch becomes
  the autonomous base every later PR targets, so report the `base:` line the
  script prints. The current branch is never consulted.
- `--run-id <id>` (optional; defaults to `graph-<YYYYMMDD>-<HHMMSS>` in UTC).
  Choose one id and pass that same `--run-id` to both the dry run and the real
  run.
- `--pid <pid>` — the driver session's own long-lived pid, so the lock does
  not read stale to the next run.

## The two checkout shapes

The script decides which shape it is in from
`git rev-parse --git-dir` versus `--git-common-dir`
(`classifyCheckoutShape()`), and prints `shape:`.

**Root checkout** (the normal case — the owner's session is rooted in the
repository): preflight creates `.worktrees/kickoff-<slug>` as a git worktree
on the new branch, cut from the base, and pushes from inside it. Every later
spec-forming node works in that worktree; the launch checkout stays on
whatever it was on, with whatever it had uncommitted. The planned commands are
exactly:

```
git fetch origin
git worktree add .worktrees/kickoff-<slug> -b thejudge-auto/<slug> origin/main
git -C .worktrees/kickoff-<slug> push -u origin thejudge-auto/<slug>
```

The script prints `worktree: <absolute path>`. That path is what the driver
writes into the ledger's `- Worktree:` line and into every node's
`Working directory:` line. An existing `.worktrees/kickoff-<slug>` is refused
(exit 2) — a prior run's leftover; `npm run graph:prune` lists it.

**Linked worktree** (the session is already rooted in a worktree — the
two-sessions shape below): preflight works in place. It requires a clean tree
(`git status --porcelain` empty) and otherwise exits 1 naming every dirty
path (`classifyInPlaceTree()`); it never resolves them for the owner. Then:

```
git fetch origin
git switch -c thejudge-auto/<slug> origin/main
git push -u origin thejudge-auto/<slug>
```

`git switch -c` works from a branch or from a detached HEAD, so a throwaway
session worktree created with `--detach` needs no branch of its own.

## The liveness canary

The script prints the canary command and leaves it `pending`. It cannot issue it
itself — a canary is a *tool call*, and only the agent running through the
harness can make one.

So: issue `CANARY_COMMAND` as a real `Bash` tool call and require the hook to
**deny** it. The reason text the hook returns is the proof. Then classify the
result with `classifyCanary()` and report its `ledgerLine`.

### Two canaries, because one of them cannot see the tier that matters

`CANARY_COMMAND` lives in the **universal** tier, which fires in every session.
It is denied whether or not a run holds the lock, so it proves the hook is
loaded and proves nothing about whether the graph tier is armed. On the first
attempt of run `graph-20260823-170119` that gap was live: the lock was never
written, the whole graph tier was inert, and this canary still reported green.

`GRAPH_CANARY_COMMAND` is denied **only** while the lock is held. Issue it after
the lock is taken and classify with `classifyGraphCanary()`:

| runActive | `CANARY_COMMAND` | `GRAPH_CANARY_COMMAND` |
| --- | --- | --- |
| `false` | deny (universal) | allow |
| `true` | deny (universal) | deny (graph) |

Only the second column discriminates. Both are inert — `nohup true` does
nothing if it ever executes — so a failed proof costs nothing but the proof.

An allowed graph canary is `BLOCKED`, exactly like an allowed universal one. It
means the hook is live while the tier is disarmed, which is what a missing or
unparseable lock looks like from the inside.

The canary targets a non-existent path under `.worktrees/`. If it ever executes
it removes nothing, prints nothing, and exits 0.

An allowed canary is **not** a warning to note and continue past. Report the
`BLOCKED` message verbatim and stop: the run has no enforcer and node 2 must not
be dispatched. If the workspace was never trusted, pass
`workspaceTrusted: false` so the message names that condition and its own fix.

Never downgrade to `.claude/graph-profile.json` as a fallback. A failed proof is
refused.

## The owner's stop sentinel

Before the lock, before the dry run, and before any mutation:
`scripts/graph-preflight.mjs` refuses to start while `.worktrees/.graph-stop`
exists, exiting 2 with a message naming both the sentinel and the `rm` command
that clears it. Relay that message and stop.

The refusal is the point. Without it, throwing the kill switch stops one run and
the next invocation quietly starts another. Never remove the sentinel yourself
to get past this — a halted run is the owner's to resume.

## Concurrency lock

Take the lock **first**, before the dry run and before any mutation. The lock
is `.worktrees/.graph-run.lock` under the **session root** — the directory the
session is rooted in, which the boundary hook reads as `$CLAUDE_PROJECT_DIR`.
It stays at the root while the nodes work in the kickoff worktree, exactly as
the build half's `implement-<slug>` worktree already works. It lives under
`.worktrees/`, which `.gitignore` already covers, so it never travels with a
branch.

**The script takes the lock itself.** Until 2026-08-24 it did not: `takeLock()`
and `classifyLock()` had no callers at all, and this section asked the agent to
write the file by hand. On one run the agent forgot and still reported success,
leaving the entire graph tier inert. Do not write the lock by hand — run the
script and check what it reports.

`takeLock()` calls `classifyLock()` in `scripts/graph-preflight.mjs`, which is a
tested pure function — do not re-derive the decision by judgment:

| State | Meaning | Action |
| --- | --- | --- |
| `free` | no lock file | take it and continue |
| `held` | the recorded PID is alive | **refuse**, and relay the message — it names the holding slug, run id, and PID |
| `stale` | the recorded PID is not running | report it stale and relay the stated `rm` reclaim command. Never reclaim silently |
| `corrupt` | the lock exists but does not parse | stop. A garbled lock read as absent is how two runs end up sharing a root |

A stale lock is reported, never silently stolen: a run that reclaims without
saying so is indistinguishable from one that never contended.

### Resuming a parked run

A resume re-enters at the node its ledger records and never re-runs the branch
work, so nothing along that path takes the lock. Before 2026-08-24 no step
existed for it even in principle, and a resumed run advanced with the graph
tier switched off for its whole length.

Run `graph-preflight --take-lock --slug <slug> --run-id <id>` at re-entry. It
takes the lock, names the graph canary, and does nothing else — no fetch, no
branch. `--branch` is not required there.

Release is the graph driver's, not this skill's — see the contract's
`## Terminal states` table (`PRD/instructions/graph-workflow-contract.md`), which
is the definitive list of the states that release it. Release goes through a
declared terminal state: write `.worktrees/.graph-run-release.json` in the exact
shape that section gives — `runId` and `state`, in its own tool call — then delete
the lock. The hook denies the deletion without that record.

## Running two ideas at once

**One idea after another** needs nothing special: a parked run holds no lock
and the launch checkout was never touched, so the owner runs `/graph-kickoff`
again while the first idea's docs PR waits.

**Two ideas at the same moment** need two sessions rooted in two checkouts,
because the hook counts every session's tool calls in one root against the
live node's cap and applies the run's denies to any session in that root.
Create a throwaway session worktree and launch the second session there:

```
git worktree add --detach .worktrees/session-<name> origin/main
# launch the second session with that directory as its root, then /graph-kickoff
```

Inside it, preflight sees a linked worktree and works in place from the
detached HEAD (the in-place shape above). `--detach` is deliberate: a hand-made
`-b thejudge-auto/<slug>` would collide with the branch preflight creates.
Concurrency is structural, not re-keyed: each root holds its own
`.worktrees/.graph-run.lock`, and nothing about the lock record,
`classifyLock`, or the hook changes.

## Procedure

1. Run `npm run graph:preflight -- --branch <name> --slug <slug> --run-id <id> --pid <pid> --dry-run`
   first. Report the `shape:` line, the resolved `base:` line, the `worktree:`
   line (root shape), the planned commands, and the two `profile sentinel:` /
   `Profile:` lines the script prints — they are what the graph driver records
   in the ledger, and they are an observation, never a restatement of what the
   user said at launch.
2. If the script exits 1 (dirty in-place tree) or 2 (stop sentinel, lock held,
   branch collision, existing kickoff worktree), stop and relay its message
   verbatim. Never hand-resolve anything to get past it.
3. Otherwise re-run the identical command without `--dry-run`, passing the same
   explicit `--run-id`.
4. Confirm the end state. Root shape: `cd .worktrees/kickoff-<slug> && git branch
   --show-current` is the requested branch, `git ls-remote --heads origin
   <branch>` shows it pushed, and `git branch --show-current` at the root is
   **unchanged**. In-place shape: `git status --porcelain` empty and
   `git branch --show-current` is the requested branch.

## When the real run fails

The script does not roll back, so a non-zero exit leaves the checkout exactly
where it stopped. Do not retry it and do not improvise a repair.

- Exit code 2 with a branch-name collision comes from the check that runs after
  `git fetch origin` and before any mutation: nothing changed. Pick a different
  `--branch` and start over.
- Exit code 1 during execution prints which commands ran and which did not.
  Relay that report verbatim and stop. A half-created kickoff worktree is left
  for the owner to inspect; `npm run graph:prune` will list it.

Never `git reset`, remove a worktree, or force-push to tidy a failed run. An
interrupted run is a gate for the user, not a state to clean up.

## Profile sentinel

`.claude/graph-profile.json` carries `"env": { "THEJUDGE_GRAPH_PROFILE": "1" }`,
so the variable exists only in a session actually launched with
`claude --settings .claude/graph-profile.json`. The script reads it and prints
either `Profile: loaded (env sentinel)` or `Profile: unverified`. Report that
line verbatim.

It proves the **file was loaded**. It does not prove any individual deny rule
fired, and it cannot: `nohup` is stripped before rules match and a trailing `&`
is consumed as a separator, so neither is expressible as a rule at all. A run
cannot forge the sentinel — the profile denies edits to itself — but never
report it as proof that a boundary was enforced.

## Boundaries

The checkout-shape and clean-tree decisions live in `scripts/graph-preflight.mjs`
and are covered by `scripts/graph-preflight.test.mjs`. Do not reimplement them
in prose or override them by judgment.

Never commit, stash, or switch the launch checkout. Never force-push. Never
create a worktree outside the repo-local `.worktrees/` root.

## Next step

Report the shape, the branch, the worktree path (root shape), and the lock
record, then continue the run with the graph driver for the half in progress —
the spec-forming half continues under `graph-kickoff`, the build half under
`graph-implement`:

`/graph-implement PRD/work/<slug>/`

(`$graph-*` in Codex.)
