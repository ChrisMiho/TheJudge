---
name: thejudge-investigate
description: >-
  Use when you need to investigate, validate, or understand an open-ended
  question in this repo before it becomes a feature — figuring out what a change
  would take, measuring options, probing code or the PRD, or deciding whether an
  idea is worth building — and you may want to fan out subagents but not run a
  rigid audit. The freeform, orchestrating counterpart to the structured
  thejudge-sweep audit, and the front door that hands finished work to graph-kickoff.
---

# TheJudge Investigate

## What this is

The freeform investigator, and the orchestrator for "help me understand this."
You point it at an open-ended question — *what would it take to…*, *is X worth
doing*, *why is Y slow*, *which approach wins* — and it orients in the repo,
digs (reading code and the PRD, measuring, probing), dispatches subagents when
that helps, and lands on one of two things: a plain answer, or a self-contained
brief that `graph-kickoff` can pick up and build.

It is off-lifecycle, like `thejudge-sweep` — no `STATUS.*` machinery, no gate per
step. But unlike sweep it has **no fixed corpus, no fixed verdict set, and no
mandatory fleet**. Sweep applies one question across many comparable places;
this skill investigates whatever shape the question actually has, and *calls*
sweep when the question turns out to be sweep-shaped.

## When to use / not use

Use it when:
- The question is open-ended and you want to **understand or validate** before
  committing to build.
- You're figuring out **what a change needs** — the decision, the numbers, the
  constraints — so a later build starts from evidence, not a guess.
- You might want **subagents for parallel probes**, on demand, not a rigid audit.

Do not use it when:
- The job is to apply the **same question across many comparable places** (score
  every file in a set the same way) → that's `thejudge-sweep`; this skill will
  invoke it for you.
- The finding is **already build-ready and shaped** → hand it straight to
  `/graph-kickoff "<request>" <paths>`.
- You're **shipping a feature** → that's the graph lifecycle (`graph-kickoff`).

## How a run lands

A run ends one of three ways. Read the owner's intent; when it's genuinely
unclear, ask before writing anything durable.

- **Answer mode** — it was a question. Deliver the recommendation in chat, leave
  the evidence in the probe folder. No handoff, no brief.
- **Brief mode** — the finding is headed for build. Write a **self-contained**
  `GRAPH-BRIEF.md` (template in [reference.md](reference.md)) and hand back the
  exact `/graph-kickoff` command. Self-contained is not optional: `graph-kickoff`
  branches from `main` and cannot see your scratch, so every decision and number
  refinement needs must be **inlined in the brief**, not linked to your branch.
- **Delegated** — the whole job is sweep-shaped (see below). You invoke
  `thejudge-sweep`, which owns its own rollup and one PR; that is the outcome.
  Leave a one-line `PROBE.md` noting you routed to sweep, and stop — there is no
  answer/brief landing to add on top.

**A conditional ask** — "figure out X, and get it ready to build *if* it's worth
it" — is not the ambiguous case and needs no re-ask: the owner has
pre-authorized brief mode, gated on the finding. Investigate, deliver the answer,
and **if the finding clears the owner's stated bar, also write the brief**. That
is not the auto-upgrade the boundary forbids — the ban is only on turning an
*unconditional* question into a build handoff the owner never asked for.

## The flow

1. **Orient** — minimal reads, like `thejudge-kickoff`: root `README.md` +
   `PRD/README.md`. For a product-specific question, use `PRD/README.md`'s
   navigation to pull the right `PRD/sections/<feature>/README.md` on demand.
   Do **not** pre-load the whole PRD.
2. **Shape the question** — say back what you're actually trying to learn or
   decide, and confirm it. This is the "help me understand what I need" step;
   the wrong question wastes the whole probe.
3. **Investigate** — read, measure, probe. Dispatch subagents when the work is
   genuinely independent or parallel (see below). Call `thejudge-sweep` when the
   question reduces to one-question-across-many-places (see below).
4. **Land** in a mode — answer, or brief + `/graph-kickoff` handoff.

## Leveraging specialized skills

You are the front door; these are tools you deploy. **Delegate, never
reimplement** — invoke the specialized skill and let it own its artifact, the
way `graph-kickoff` delegates without rebuilding a phase.

- **`thejudge-sweep`** — when the investigation reduces to **applying one
  question, with one verdict set, across many comparable places**: a corpus that
  splits into sections, one score per item, one skimmable rollup. Recognize that
  shape and invoke sweep; it owns its cost question and its one PR. Do **not**
  rebuild sweep's fan-out inline, and do **not** force heterogeneous probes
  through it — independent, differently-shaped probes stay on this skill's own
  subagents.
- **`graph-kickoff`** — when the finding is build-bound. Brief mode produces its
  intake; the handoff command is the boundary.

If the owner invoked *you* but the job is actually a sweep, say so and offer to
run sweep — rather than grinding the wrong tool, the way sweep did to them.

## Subagents — optional, on demand

Use them when the work is genuinely parallel or independent, or when the owner
asks. This is not sweep's mandatory fleet; a probe can be entirely inline.

Every dispatched prompt **must** carry an absolute `Working directory:` line and
absolute paths for what it reads and writes. A child resolves a relative path
against wherever it happens to start, not this checkout — the `graph-kickoff`
lesson. Dispatch shape and the parallel-probe skeleton are in
[reference.md](reference.md).

If a probe warrants a **large** fan-out — **four or more agents** — give the
owner the same cost-vs-thoroughness framing sweep uses before spending it. Three
or fewer you may just launch.

## Where it writes

`PRD/work/probe-<slug>/`. The `probe-` prefix keeps the folder inert to the
`thejudge-*` lifecycle skills — sweep's off-lifecycle rationale, so no skill
mistakes a probe for a feature package. `graph-kickoff` later mints its **own**
`PRD/work/<slug>/`, so there is no collision. Write only inside the probe folder.

Contents: a thin `PROBE.md` ledger (question, what ran), `FINDINGS-*.md` for the
evidence, and — brief mode only — `GRAPH-BRIEF.md`. Schemas in reference.md.

## Boundaries

- **Read-mostly, and writes only into `PRD/work/probe-<slug>/`.** Never edit
  product code, and never promote or amend PRD truth — `thejudge-refinement` and
  `graph-kickoff` own that. This skill measures; it does not change the product.
  (Brief mode *names* the `PRD/sections/` files to amend — naming a file in the
  brief is not editing it.)
- **Never push, and open a PR only if the owner asks.** The graph-kickoff brief is
  the handoff, not a PR. (A probe you want durable, you commit; the handoff works
  from the working tree either way.)
- **Delegate, never reimplement.** Invoke `thejudge-sweep` / `graph-kickoff`; never
  edit a `thejudge-*` or `graph-*` skill to route around a rough edge — report it.
- **Owner-facing output follows `PRD/instructions/plain-language-standard.md`** —
  lead with the answer, product terms first, evidence in the artifact.

## Next step

- **Answer mode:** the recommendation, with the evidence path
  (`PRD/work/probe-<slug>/`). No command.
- **Brief mode:** the handoff, verbatim —
  `/graph-kickoff "<one-line request>" PRD/work/probe-<slug>/GRAPH-BRIEF.md`
  (`$graph-kickoff …` in Codex).
