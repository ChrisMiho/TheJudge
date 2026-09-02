---
name: graph-preflight
description: >-
  Use before an autonomous graph run to guarantee a clean, freshly branched
  local checkout — resolving uncommitted work by auto-commit or stash and
  publishing the branch that worktrees and pull requests will target.
---

# Graph Preflight

## Goal

Leave the repository in exactly one state: a freshly created local branch,
pushed to `origin`, with no uncommitted work — and a recorded account of what
happened to anything that was uncommitted.

Read `PRD/instructions/graph-workflow-contract.md` before acting.

## Inputs

- `--branch <name>` (required). Never infer it, never reuse the current branch,
  never default to `main`.
- `--base <ref>` (optional; defaults to the current branch). The new branch
  becomes the autonomous base every later PR targets, so report the resolved
  `base:` line the script prints, not the flag you passed.
- `--run-id <id>` (optional; defaults to `graph-<YYYYMMDD>-<HHMMSS>` in UTC,
  which is unique per run so two same-day runs cannot share a stash message).
  Choose one id and pass that same `--run-id` to both the dry run and the real
  run — the default is timestamped to the second, so omitting it gives the two
  invocations different ids.

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
it removes nothing, prints nothing, and exits 0 — a failed proof costs nothing
beyond the failed proof.

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

Take the lock **first**, before the dry run and before any mutation. Two graph
runs against one launch checkout both commit to it, both rewrite `GRAPH-RUN.md`,
and both publish before `build` — the same shared-working-directory hazard that
produced the 2026-08-17 leak, with no isolation between them at all.

The lock is `.worktrees/.graph-run.lock`, a JSON record holding the slug, run
id, PID, and start time. It lives under `.worktrees/`, which `.gitignore`
already covers, so it never travels with a branch.

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
| `corrupt` | the lock exists but does not parse | stop. A garbled lock read as absent is how two runs end up sharing a checkout |

A stale lock is reported, never silently stolen: a run that reclaims without
saying so is indistinguishable from one that never contended.

### Resuming a parked run

A resume re-enters at the node its ledger records and never re-runs the branch
and stash work, so nothing along that path takes the lock. Before 2026-08-24 no
step existed for it even in principle, and a resumed run advanced with the graph
tier switched off for its whole length.

Run `graph-preflight --take-lock --slug <slug> --run-id <id>` at re-entry. It
takes the lock, names the graph canary, and does nothing else — no fetch, no
branch, no stash. `--branch` is not required there.

Release is the graph driver's, not this skill's — see the contract's
`## Terminal states` table (`PRD/instructions/graph-workflow-contract.md`), which
is the definitive list of the states that release it. Release goes through a
declared terminal state: write `.worktrees/.graph-run-release.json` in the exact
shape that section gives — `runId` and `state`, in its own tool call — then delete
the lock. The hook denies the deletion without that record.

## base→main guard (fresh runs only)

A fresh run refuses to start while a prior package's base→main PR is still open,
so the overnight queue never branches off a `main` that a prior package has not
reached — the failure that parked `user-feedback-spec` (PR #107) at the wrong
base.

The script runs the read-only query `gh pr list --base main --state open --json
headRefName,url` and passes the parsed list to `classifyPendingBaseToMain()` in
`scripts/graph-preflight.mjs` — the tested pure function is the authority; do not
re-derive the decision in prose. It **blocks** when any open PR's head is a
`thejudge-auto/*` branch other than the one this run is creating, and **fails
closed** (blocks) when the list cannot be obtained or parsed. On a block, the
script exits 2 naming the PR to merge first; relay that and stop.

This runs on the fresh-run path only, in the dry run and the real run alike. The
resume path (`--take-lock`, no `--branch`) skips it: run two's own base→main PR
is legitimately open. It is the enforcement half of run one (`graph-kickoff`)
opening that PR — see `graph-workflow-contract.md`, `## The two runs`.

## Procedure

1. Run `npm run graph:preflight -- --branch <name> --run-id <id> --dry-run`
   first. Report the classification, the resolved base, the planned commands,
   and the two `profile sentinel:` / `Profile:` lines the script prints first —
   they are what the graph driver records in the ledger, and they are an
   observation, never a restatement of what the user said at launch.
2. If the action is `blocked`, stop. Report the offending paths. Never
   hand-resolve a secret-bearing path to get past this.
3. Otherwise re-run the identical command without `--dry-run`, passing the same
   explicit `--run-id`. With `--run-id` omitted the two invocations generate
   different timestamped ids, so the stash name previewed in step 1 is not the
   one that lands — and the handoff record would name a stash that does not
   exist.
4. Confirm the end state with `git status --porcelain` (empty) and
   `git branch --show-current` (the requested branch).
5. When the action was `stash`, record the stash reference and the exact
   restore commands from the contract's "Stashed work handoff" section.

## When the real run fails

The script does not roll back, so a non-zero exit leaves the checkout exactly
where it stopped. Do not retry it and do not improvise a repair.

- Exit code 2 with a branch-name collision comes from the check that runs after
  `git fetch origin` and before any mutation: nothing changed. Pick a different
  `--branch` and start over.
- Exit code 1 during execution prints which commands ran, which did not, and —
  when a stash was taken — the `git stash list | grep graph-preflight/<run-id>`
  and `git stash apply <ref>` recovery lines. Relay that report verbatim,
  including those recovery lines, and stop.

Never drop, pop, re-stash, `git reset`, or force-push to tidy a failed run. An
interrupted resolution is a gate for the user, not a state to clean up.

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

The classification thresholds live in `scripts/graph-preflight.mjs` and are
covered by `scripts/graph-preflight.test.mjs`. Do not reimplement the
commit-versus-stash decision in prose, override it by judgment, or pass
`--max-files`/`--max-lines` to force a different branch of the logic.

Never drop, pop, or clear a stash. Never force-push.

## Next step

Report the branch, the classification, and the stash reference if one exists,
then continue the run with the graph driver for the half in progress — the
spec-forming half continues under `graph-kickoff`, the build half under
`graph-implement`:

`/graph-implement PRD/work/<slug>/`

(`$graph-*` in Codex.)
