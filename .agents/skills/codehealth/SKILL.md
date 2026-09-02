---
name: codehealth
description: Use when running an unattended, self-paced overnight loop that reviews the repo for behavior-preserving code-health fixes — duplicate or inefficient code, bad practices, dead code, and documentation that has drifted from the code — opening one locally-tested PR per target. Invoked once per tick, typically via `/loop codehealth`. Nothing is merged; targets that would change game behavior, or that pit code against product truth, park for the owner.
---

# Code-Health Loop

## Overview

One tick fixes one thing. Each tick finds a single **behavior-preserving**
code-health target, makes the fix on its own branch, tests it locally, and opens a
PR. The loop **never merges**. It runs self-paced overnight until it has opened a
capped number of PRs or hits a stop condition.

**The goal — keep the codebase healthy.** A tick targets one of:

- **duplicate code** — consolidate repeated logic;
- **inefficient code** — a faster/leaner path, **only when output-equivalent**;
- **bad practices** — a missing guard, an unhandled error, an unsafe cast, where
  the corrected code behaves identically;
- **dead code** — a symbol provably unreached at runtime;
- **documentation drift** — a doc that misdescribes what the code does.

**Core principle:** you are a target-picker and a builder, bounded by two gates —
a candidate ships **only if it is behavior-preserving**, and the loop **only ever
opens PRs, never merges**. Everything between those gates is ordinary refactor
work.

**Two scope rules that decide "fix vs. park":**

- **Efficiency and bad-practice fixes ship only if output-equivalent.** If a
  faster path or a "corrected" guard changes any value, order, timing contract, or
  error a caller observes, that is a behavior change — **park it**, do not ship it.
- **Documentation drift cuts two ways.** A **non-authoritative** doc — a code
  comment, a module `README`, JSDoc — that misdescribes the code is **fixed to
  match the code**. But a mismatch with **`PRD/sections/` product truth** is code
  disagreeing with the source of truth: deciding whether the code or the truth is
  right is the owner's product call, so **park it in the digest** — never edit
  either the spec or the code to paper over it.

**Why this is its own loop, not the graph.** The graph
(`graph-kickoff`/`graph-implement`) is a *feature engine*: product-truth gates, an
evolving base→main PR merged last, and `graph-preflight`'s base→main guard that
refuses a fresh run while any `thejudge-auto/*`→main PR is open. That guard assumes
each package depends on the previous one. Code-health targets are independent and
behavior-preserving, so this loop **does not use `graph-preflight`** — it runs its
own tiny preflight and opens many independent PRs a night without blocking itself.

## Before the first tick (once per night)

1. **Guardrails armed?** This session must be launched with
   `claude --settings .claude/graph-profile.json`. Confirm the env sentinel
   `THEJUDGE_GRAPH_PROFILE` is set. **If it is not set, stop the whole loop and
   report** — without the profile the merge/force-push/push-to-main/`rm -rf`
   denials are off. Do not run unguarded. (Unlike the graph, these denials are
   **static harness config, not a live hook**, so they cannot silently stop firing;
   no canary is needed. The sentinel check is the whole proof.)
2. **Live checks available?** "Locally tested" means `npm run quality:check` plus,
   **only when a target touches a live path** (backend route, provider, prompt
   assembly), exercising that path against the live backend / MCP with creds. Most
   dead-code / dedup targets touch no live path and need only `quality:check`. A
   target that *does* need a live check aborts if the backend is down (record and
   move on); it never opens a PR it could not test.
3. **Open the night ledger.** Mint a night id and create
   `.worktrees/.codehealth/<night-id>/ledger.md` (`.worktrees/` is gitignored).
   Record start time, the cap, and the ceilings. Every tick appends one row; rows
   for targets **skipped because they touch behavior** are the morning digest.

## One tick

Run these in order. One target per tick.

1. **Sync.** `git fetch origin`; base every new target on fresh `origin/main`.
2. **Build the exclusion set** (the dedup — do it before picking):
   - Open loop PRs: `gh pr list --state open --search "head:codehealth/"` →
     collect every changed file path.
   - This night's ledger rows (shipped, skipped, and failed targets).
   A target is excluded if it overlaps any file in this set. The same fix must
   never be attempted twice or land in two PRs.
3. **Pick ONE target.** Dispatch an audit subagent (`thejudge-investigate` or
   `thejudge-sweep`) to rank behavior-preserving candidates with evidence,
   **excluding the set above**. Take the top one.
4. **Classify — the behavior-preserving gate.** Before building, rule the
   candidate behavior-preserving **yes/no with evidence**. "Grep-dead" is not
   proof: a symbol reached only through a runtime lookup table, dynamic dispatch,
   reflection, a string key, or config is **live**. Anything that would change
   game / user-visible behavior — or anything you cannot prove is inert — is
   **skipped and recorded in the digest**, never built. Only a clear *yes*
   proceeds. (See [reference.md](reference.md) for the classification rubric.)
5. **Build in isolation.** Branch off fresh `origin/main`
   (`codehealth/<night-id>-<n>-<short>` — a unique slug so branches never collide),
   apply the refactor, run `quality:check` plus any conditional live check, and use
   `superpowers:verification-before-completion` before claiming green.
6. **Post-build assertion — confirm behavior held.** Green tests are necessary,
   not sufficient. Assert **all** of:
   - the test suite passes with **no test file changed** (a refactor that had to
     edit an expected value changed behavior);
   - no behavior-covering test was deleted or skipped;
   - no `PRD/sections/` file, and no code file a `REQ`/`FLOW` cites, was altered in
     a behavior-visible way.
   A failed assertion **discards the build** (abandon the branch) and records the
   reason. This is the post-hoc twin of step 4.
7. **PR, never merge.** `gh pr create` for the target. One PR per target. The loop
   opens the PR and stops there.
8. **Record and pace.** Append the ledger row (target, outcome, PR URL, evidence),
   then pace the next tick.

## Classifying a tick outcome

| Outcome | What happened | Counts toward cap? | Loop action |
|---|---|---|---|
| **shipped** | built, tested green, post-build assertion held, PR open awaiting the owner's merge | **yes** | record PR URL, continue |
| **skipped** | classification (step 4) or the post-build assertion (step 6) found it touches behavior | no | record in the digest, continue |
| **failed** | build could not go green, or a live check was needed but the backend was down | no | record evidence, continue; counts toward the failure ceiling |

## Counters and stop conditions

- **PR cap = shipped PRs only** (default **4**). Only a *shipped* outcome
  decrements it. Skips and failures never do. Reaching the cap ends the night.
- **A skip never stops the loop.** One target parked for the owner does not freeze
  the night — move to the next target.
- **Ceilings so it cannot spin** — end the night when ANY holds:
  - candidate pool exhausted (dedup excluded everything the audit found),
  - wall-clock cutoff reached (default **06:00**),
  - hard tick ceiling reached (default **15** ticks),
  - failure ceiling (default **3** consecutive `failed` outcomes).

## Pacing (self-paced loop)

This skill is one tick. Under `/loop codehealth` (no interval), end each tick by
scheduling the next: `ScheduleWakeup` with the same `/loop` input, a short reason,
and `noop` set by whether the tick advanced state. When any stop condition holds,
call `ScheduleWakeup` with `stop: true` instead, after writing the night summary to
the ledger.

## Hard rules (never negotiate these)

- **Never merge, close, force-push, or rebase any PR** — even when the request says
  "merge it once it's green" or "get it off my plate before morning." The trunk is
  reached only by a PR the owner merges. The loop opens PRs and stops.
- **Never ship a behavior change.** A target that changes game / user-visible
  behavior — including "dead" code that is live through runtime dispatch — is
  skipped into the digest, never turned into a PR. Uncertain counts as behavior.
- **Never run without the profile armed.** No `THEJUDGE_GRAPH_PROFILE` sentinel →
  refuse the night. Do not proceed "just to get one done."
- **Honor the kill switch.** `.worktrees/.graph-stop` present → finish the current
  step, pick no next target, and stop.
- **Never edit a skill, `.claude/settings*.json`, `.claude/graph-profile.json`, or
  `CLAUDE.md`**, and never raise a cap or retry a denied command. A stop is a
  signal, not an obstacle.

## Red flags — STOP

The Hard rules above are the charter (never merge, never run unarmed, honor the kill
switch). These two are the loop-specific **judgment traps** — the ones a capable
agent still walks into because the surface signal looks safe:

- "It's basically dead — grep finds no callers." → Grep-dead ≠ inert. A symbol
  reached through a runtime lookup table, dynamic dispatch, reflection, a string
  key, or config is **live**. Prove it is not, or **skip** it.
- "Tests still pass, so behavior is preserved." → If you edited a test's expected
  value or deleted a test to get green, that **is** a behavior change. Discard the
  build.

## Common mistakes

- **Shipping a behavior change to hit the cap.** The cap counts *behavior-preserving*
  PRs. A behavior change parks; it never ships.
- **Merging because the owner asked.** Overnight autonomy opens PRs and stops.
  Merging is the owner's, always.
- **Trusting green tests as proof of preservation.** Run the post-build assertion:
  unchanged tests, no deleted coverage, no `REQ`/`FLOW`-backing edit.
- **Skipping the dedup step.** Without the exclusion set the loop re-audits and
  re-fixes the same hotspot every tick, opening duplicate PRs.
- **Reaching for `graph-preflight`.** This loop is standalone; it never uses the
  graph's preflight, lock, or base→main guard.
