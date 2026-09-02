# Design Brief: standalone code-health workflow

## What a user experiences

The owner launches one guarded overnight session and, in the morning, finds a
handful of **independent, locally-tested PRs** — each a single behavior-preserving
code-health fix (dead code removed, duplication consolidated, an inefficient path
made leaner, an unsafe pattern guarded, or a drifted code comment / module README
corrected to match the code) — plus a short digest of anything the loop found that
*would* change game behavior, or that pits code against `PRD/sections/` product
truth, and therefore parked for a human. The goal is codebase health: reduce
duplicate, inefficient, dead, and bad-practice code, and doc drift — always
behavior-preserving. Two guardrails: efficiency and bad-practice fixes ship only if
output-equivalent, and documentation is corrected only **to** the code (never the
code to a doc), with any `PRD/sections/` mismatch parked, never edited. Nothing is merged; the owner reviews and
merges each PR. The night is productive: multiple PRs, not one, because the targets
are independent and never block each other.

## Problem

`overnight-codehealth` drives the graph skills (`graph-kickoff` + `graph-implement`),
but the graph is a **feature engine**: product-truth gates, an evolving base→main PR
the owner merges last, and `graph-preflight`'s base→main guard that refuses any fresh
run while any `thejudge-auto/*`→main PR is open. That guard assumes each package
*depends* on the previous one (the wrong-base bug it prevents, `user-feedback-spec`
PR #107, was a dependent spec). Code-health targets are the opposite — independent,
non-overlapping, behavior-preserving — so the guard is structurally wrong for them:
the first target of a night leaves an open PR and blocks every later target. Both of
2026-09-01's overnight runs died this way (0 and 1 target shipped).

## Decision: a standalone workflow, zero graph changes

Build a new `codehealth` skill that owns its own self-paced loop and **does not use
`graph-preflight`** — the single place the conflict lived. It runs its own tiny
preflight (clean working tree → branch off fresh `origin/main`) and therefore needs
no change to any graph or `thejudge-*` skill.

**Leverage, do not modify:**

- `thejudge-investigate` / `thejudge-sweep` — rank behavior-preserving candidates
  with evidence (unchanged; already the current loop's picker).
- `npm run quality:check` — the repo's canonical guardrail (typecheck + lint +
  format + tests + coverage). Live-backend / MCP checks run **only when a target
  touches a live path**; most dead-code / dedup targets do not, which removes the
  current loop's "backend must be up or the tick aborts" fragility.
- `.claude/graph-profile.json` — reuse its workflow-agnostic rails (protected-path
  denials, kill switch, hook canary). Armed the same way: the session is launched
  with `claude --settings .claude/graph-profile.json`; without that flag the rails
  are inert and the loop must refuse to start. A code-health-specific profile that
  tunes caps to this loop's phases is possible later, not required for v1.
- Stop sentinel (`.worktrees/.graph-stop`) and the per-night ledger under the
  gitignored `.worktrees/` root — same mechanics as today.
- `verification-before-completion` / `test-driven-development` — the per-target
  build discipline.

**Do not reuse:** the full `thejudge-implement` package lifecycle (map-out → slice
docs → STATUS board → cleanup). For a one-file behavior-preserving refactor that is
heavier than the fix. The health skill owns a thin build step that calls the same
quality gate and verification skills without minting a `PRD/work/<slug>/` package per
target.

## The loop (one tick = one target)

1. **Sync + dedup.** `git fetch origin`; build the exclusion set from open
   health-loop PRs (by head-branch prefix) and their changed files, plus this
   night's ledger rows. A target is excluded if it overlaps any file in the set.
2. **Rank.** `thejudge-investigate` / `thejudge-sweep` ranks behavior-preserving
   candidates with evidence, excluding the set above. Take the top one.
3. **Classify — the safety heart.** A review subagent rules the candidate
   behavior-preserving **y/n with evidence**. Only a clear *yes* proceeds. Uncertain,
   or anything that would touch game / user-visible behavior, is **skipped and
   recorded for the morning digest** — never shipped.
4. **Build in isolation.** Branch off fresh `origin/main`
   (`codehealth/<night-id>-<n>-<short>`), apply the refactor, run `quality:check`
   plus conditional live checks, and verify.
5. **Post-build assert.** Confirm behavior held, not just that tests are green:
   tests pass **unchanged**, no behavior-covering test was deleted, and no file
   backing a `PRD/sections/` `REQ`/`FLOW` was altered in a behavior-visible way.
   A failed assertion **discards the build** (branch abandoned) and records the
   reason. This is the post-hoc twin of step 3's pre-pick judgment.
6. **PR, never merge.** `gh pr create` for the target. One PR per target. The loop
   opens PRs and stops; the owner merges.
7. **Record + pace.** Append the ledger row (target, outcome, PR URL, evidence),
   then schedule the next tick (self-paced via `ScheduleWakeup`).

## Concurrency: sequential, non-blocking

One target at a time. Each opens its own PR and the next target does **not** wait for
a merge — this alone dissolves the base-guard blocking problem, with no worktree
machinery. (Parallel worktrees are a possible later optimization; they add
live-backend test contention and locking complexity, and are out of scope for v1.)

## Counters and stop conditions (carried over from `overnight-codehealth`)

- **PR cap** = shipped code PRs only, default **4**. Only a shipped PR decrements it;
  skips and failures never do.
- **Ceilings** (end the night when any holds): candidate pool exhausted, wall-clock
  **06:00**, hard tick ceiling **15**, failure ceiling **3** consecutive failed
  builds.
- **Kill switch** halts the loop at a target boundary; the in-flight build finishes
  its step and no next target is picked.

## Hard rules (unchanged from the loop's charter)

- **Never merge, close, force-push, or rebase any PR.** The trunk is reached only by
  a PR the owner merges.
- **Never ship a behavior change.** Anything that would change game / user-visible
  behavior parks in the digest for the owner; it is never turned into a PR.
- **Never run without the guardrail profile armed.** No profile → refuse the night.
- **One build at a time; no denied backgrounding primitive** (`nohup`, untracked
  `&`, `pkill`, `killall` stay denied).

## Non-goals

- Not a change to the graph feature lifecycle — `graph-kickoff` / `graph-implement`
  stay as-is for behavior-changing product work.
- Not a modification of `graph-preflight` or its base→main guard. (That guard's
  over-breadth for the graph's *own* future phase-2 concurrency is a real but
  separate piece of work, noted here, not solved here.)
- Not a merging or gate-answering loop.
- No product-truth (`PRD/sections/`) edits, no `DESIGN-BRIEF`/docs-PR ceremony per
  target, no `PRD/work/<slug>/` package per target.
- No weakening of the behavior-preserving gate or the build rigor to move faster.

## Product truth

**None.** This is behavior-preserving tooling: it proposes no `PRD/sections/` change,
so there is no `GATE-QUESTIONS.md`. Its absence is the gate signal.

## Disposition of the old skill

`overnight-codehealth` is superseded by this workflow. Map-out decides whether it is
deleted or left as a thin pointer to `codehealth`; the two must not both drive
overnight runs.

## REQ / FLOW references

Not applicable — no product-truth requirements or flows. The behavioral contract of
this workflow lives in the `codehealth` skill file and this brief.
