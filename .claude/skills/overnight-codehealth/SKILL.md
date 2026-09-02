---
name: overnight-codehealth
description: Use when running an unattended, self-paced overnight loop that reviews the repo for behavior-preserving code-health fixes (duplicate, dead, or unsafe/bad code) and opens one locally-tested PR per target by driving graph-kickoff then graph-implement. Invoked once per tick, typically via `/loop overnight-codehealth`. Nothing is merged; targets that would change game behavior park for the owner.
---

# Overnight Code-Health Loop

## Overview

One tick fixes one thing. Each tick finds a single **behavior-preserving**
code-health target (duplicate, dead, or unsafe/bad code — never a change to game
behavior), then drives the repo's `graph-kickoff` and `graph-implement` skills to
build, locally test, and open a PR for it. The loop never merges. It runs
self-paced overnight until it has shipped a capped number of PRs or hits a stop
condition.

**Core principle:** you are a scheduler and a target-picker. Everything
downstream — branch, build, verify, PR, guardrails — is the graph driver's job.
Never reimplement a phase; never edit a graph-* or `thejudge-*` skill.

**The mechanic that everything hinges on:** `graph-kickoff` (run one) ALWAYS parks
and ships only a docs-only design PR. Code ships only when *run two*
(`graph-implement`) resumes it. A tick that stops after run one ships nothing.
Every clean tick MUST bridge to run two.

## Before the first tick (once per night)

1. **Guardrails armed?** This session must be launched with
   `claude --settings .claude/graph-profile.json`. Confirm the profile is
   loaded (graph-preflight prints the `THEJUDGE_GRAPH_PROFILE` sentinel).
   If it is not loaded, **stop the whole loop and report** — without it
   the graph driver's caps, kill switch, and protected-path denials are off. Do
   not run unguarded.
2. **Live checks available?** "Locally tested" here means full suite + exercising
   affected paths against the live backend / MCP. Confirm the backend and any MCP
   the changes touch are up with creds. If they are down, a tick that needs them
   aborts (record and move on); it does not ship a PR it could not live-test.
3. **Open the night ledger.** Mint a night id and create
   `.worktrees/.overnight-codehealth/<night-id>/ledger.md` (`.worktrees/` is
   gitignored and survives graph runs). Record start time, the cap, and the
   ceilings. Every tick appends one row: target slug, outcome, PR URL, evidence.

## One tick

Run these in order. One target per tick.

1. **Sync.** `git fetch origin`; base every new target on fresh `origin/main`.
2. **Build the exclusion set** (this is the dedup — do it before picking):
   - Open loop PRs: `gh pr list --state open --json number,headRefName,files
     --search "head:thejudge-auto/"` → collect every changed file path.
   - Parked packages: any `PRD/work/*/` at `STATUS.owner-action`, and their
     target files.
   - This night's ledger rows (shipped, parked, and failed targets).
   A target is excluded if it overlaps any file in this set. The same fix must
   never be attempted twice or land in two PRs.
3. **Pick ONE target.** Dispatch a review/audit subagent (use
   `thejudge-investigate` or `thejudge-sweep`) to rank behavior-preserving
   candidates with evidence, **excluding the set above**. Take the top one. If
   you cannot state *why* refinement would leave `PRD/sections/` empty for it,
   it is not behavior-preserving — skip it.
4. **Write the intake brief.** Name the target, the evidence, the exact files,
   and assert **"no product-truth / `PRD/sections/` change."** Frame it as a
   pure refactor.
5. **Run one.** Invoke `graph-kickoff` with the brief and
   `--branch thejudge-auto/codehealth-<night-id>-<n>-<short>` (a unique slug so
   branches never collide). Let it run to its park.
6. **Bridge or leave** — read `PRD/work/<slug>/GATE-QUESTIONS.md`:
   - **File present** (non-empty `PRD/sections/` diff → graph-kickoff judged this
     changes game behavior): **LEAVE IT parked.** Do NOT answer a single slot.
     Record `parked-for-owner`. This does not count toward the cap. Go to the
     next tick.
   - **File absent** (empty diff → truly behavior-preserving): **bridge to run
     two** — invoke `graph-implement PRD/work/<slug>/`. It runs plan → build →
     local test + live checks → review, then leaves the implementation PR open
     awaiting your merge.
7. **Classify and record** (see below), append the ledger row, then **pace the
   next tick**.

## Classifying a tick outcome

| Outcome | What the graph driver's report shows | Counts toward cap? | Loop action |
|---|---|---|---|
| **shipped** | run two built + review-approved; implementation PR open, awaiting only the owner's merge | **yes** | record PR URL, continue |
| **parked-for-owner** | run one wrote `GATE-QUESTIONS.md`; left at `owner-action` | no | leave untouched, continue |
| **failed** | `BLOCKED` / `PROMPTED`, a cap-overrun park mid-build, or review could not approve | no | record evidence, continue; counts toward the failure ceiling |

## Counters and stop conditions

- **PR cap = shipped code PRs only** (default **4**). Only a *shipped* outcome
  decrements it. Parks and failures never do. Reaching the cap ends the night.
- **A park never stops the loop.** One target parked for the owner does not
  freeze the night — move to the next target.
- **Ceilings so it cannot spin** — end the night when ANY holds:
  - candidate pool exhausted (dedup excluded everything the audit found),
  - wall-clock cutoff reached (default **06:00**),
  - hard tick ceiling reached (default **15** ticks),
  - failure ceiling (default **3** consecutive `failed` outcomes — signals the
    audit or the stack is unhealthy).

## Pacing (self-paced loop)

This skill is one tick. Under `/loop overnight-codehealth` (no interval), end
each tick by scheduling the next: `ScheduleWakeup` with the same `/loop` input,
a short reason, and `noop` set by whether the tick advanced state. When any stop
condition holds, call `ScheduleWakeup` with `stop: true` instead, after writing
the night summary to the ledger.

## Hard rules (never negotiate these)

- **Never answer `GATE-QUESTIONS.md`, and never feed the graph driver a standing
  "just pick X" rule.** A gate park is the owner's product decision. Auto-answering
  it overnight is the exact failure this loop is built to avoid.
- **Never merge, close, force-push, or rebase any PR.** The trunk is reached only
  by a PR the owner merges. The loop opens PRs and stops.
- **One graph run at a time.** The graph driver holds `.worktrees/.graph-run.lock`;
  a park releases it. Never start a tick while a lock is held. Never run two loops
  driving graph concurrently. (Per-worktree-session isolation, once it lands,
  relaxes this to one run per worktree root — until then, one at a time.)
- **Never raise a cap, retry a denied command, or edit a graph-*/`thejudge-*`
  skill** to get past a stop. A stop is a signal, not an obstacle.

## Common mistakes

- **Stopping after run one.** Run one only parks with a docs-only PR. No bridge =
  nothing shipped. Bridge every clean target to run two.
- **Counting a park as a shipped PR.** A park ships no code. Only run-two success
  counts toward the cap.
- **Skipping the dedup step.** Without the exclusion set the loop re-audits and
  re-fixes the same hotspot every tick, opening duplicate PRs of the same change.
- **Halting the night on the first gate park.** Parks are the morning's review
  queue, not a stop condition. Keep hunting until cap or a ceiling.
- **Answering a gate to "keep the target moving."** That ships a game-behavior
  change with no human review — the one thing overnight autonomy must never do.
