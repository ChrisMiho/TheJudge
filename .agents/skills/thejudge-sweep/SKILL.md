---
name: thejudge-sweep
description: >-
  Use when the job is to audit a corpus that splits cleanly into sections —
  scoring every item against a question and reporting a verdict per item —
  rather than to ship a feature, and the owner wants a single review at the end
  instead of a gate per section. The off-graph, investigate-and-report
  counterpart to the graph lifecycle.
---

# TheJudge Sweep

## What a sweep is

An audit, run by a fleet. You point it at a corpus that splits by section — the
18 files under `PRD/sections/decisions/`, a folder of specs, any set that
divides cleanly — plus one audit question. It fans a subagent across the
sections, each subagent scores its section's items and writes a finding doc, a
synthesis pass rolls every verdict into one skimmable list, and the whole thing
lands as **one PR** — a single review gate at the very end.

It is the off-graph counterpart to the graph lifecycle (`graph-kickoff` →
`graph-implement`). Same idea — encoded judgment
plus dispatched agents — but a sweep has **no implementation leg**. The
investigation *is* the job. So there is no per-section gate and no lifecycle
`STATUS.*` machinery; there is one touch point, the PR.

**A sweep never edits the corpus it audits.** The verdicts are the deliverable.
Deleting or rewriting what the audit found is a separate, later step the owner
runs against these verdicts — not part of the sweep.

## When to use / not use

Use it when all of these hold:
- The corpus splits into sections that can be scored independently.
- The task is to **investigate and report**, not to change the product.
- The owner wants **one review at the end**, not a decision per section.

Do not use it to ship a feature (that is the graph lifecycle), and do not
run the full graph per section — that is the opposite of one-review-at-the-end.

## Inputs

Take these from the invocation, or as skill args:

- **Corpus** — a directory or glob whose files are the sections.
- **Audit question** — what each item is scored for.
- **Verdict set** — the fixed labels a worker may assign (e.g.
  `absorbed` / `partial` / `not-absorbed` / `obsolete`), and the rule for depth:
  one line per item, and for any non-clean verdict, name exactly what is missing.
- **Scored-against reference** — the source the items are measured against (for
  the decision audit, the 7 current-state specs under
  `PRD/sections/<feature>/README.md`).
- **Sweep slug** — the work folder is `PRD/work/sweep-<slug>/`. Prefix with
  `sweep-` so it reads as off-lifecycle at a glance and no `thejudge-*` skill
  mistakes it for a feature package.

## The flow

Follow these in order. Read [reference.md](reference.md) first — it holds the
finding-doc schema, the rollup template, and the exact Workflow script skeleton
you will run.

### 1. Scout the work list inline

Before spending a fleet, resolve the corpus in the main session: list the
section files and count the items each holds (the rows a worker will score).
Print `N sections, ~M items`. This is cheap, keeps the fleet's shape honest, and
is the number the cost question below is framed against.

### 2. Ask the cost question — once, before launching

The fleet is the spend. Before calling `Workflow`, ask the owner **one** upfront
question (this is configuration, not a mid-run gate — an allowed touch point).
Frame it as **cost vs. thoroughness**, and translate the pick into the levers —
never make the owner reason about raw agent counts.

The levers behind the choice:

| Lever | Cheap end | Thorough end |
| --- | --- | --- |
| Worker **model** | faster/cheaper tier — the section reads are mechanical | stronger tier |
| Worker **effort** | `low` | `high` |
| **Sections per agent** (batch) | several per agent → fewer, cheaper spins | one per agent → most parallel |
| Synthesis **model** | same as workers | one tier up for the rollup |

Offer it as a small set of named profiles, each mapping to a concrete
`(model, effort, batch)` triple, with a **recommended default** so an unattended
run can proceed. Sections per agent is the main usage lever when N is large:
batch of 3 turns 18 sections into 6 agent spins instead of 18. Use the
`AskUserQuestion` shape in reference.md.

**Skip the question entirely** when the profile — or all three levers — arrive as
skill args. A later run should be able to run headless.

### 3. Print the plan back, then launch

Before the fleet starts, print the resolved shape so the owner sees the spend:
worker model, effort, **agent count**, sections per agent, synthesis model. Then
write the on-disk record (step 4) and launch the single background `Workflow`
(step 5).

Agent count is `ceil(N / batch)`. The repo's workflow-size guideline is medium
(~15 agents); a corpus of 18 at batch 1 is a slight, acceptable overage.
Batching is the lever if the owner wants fewer spins.

### 4. Write the on-disk record

Create `PRD/work/sweep-<slug>/` and write `SWEEP.md` — a thin ledger of what
ran: corpus, audit question, verdict set, scored-against reference, the resolved
cost plan, the section→batch assignment, and the timestamp. Add the Workflow
`runId` once you have it. This is the small durable record, mirroring
the graph driver's ledger without its lifecycle. Use the `SWEEP.md` shape in
reference.md.

### 5. Fan out — one background Workflow

This skill is the explicit opt-in to call the `Workflow` tool. Launch **one**
background workflow (script skeleton in reference.md):

- **Audit phase** — one subagent per batch. Each reads its section file(s) and
  the scored-against reference, writes a finding doc per section to
  `PRD/work/sweep-<slug>/sections/<section>.md` (fixed schema), and returns its
  findings as structured data (one `{id, verdict, reason}` per item).
- **Synthesize phase** — one agent takes the combined findings, sorts every item
  that is **not** a clean pass to the top (the contentious ones the end-review
  wants first), and writes `PRD/work/sweep-<slug>/ROLLUP.md`.

Every dispatched subagent prompt carries an absolute `Working directory:` line
and absolute paths for what it reads and writes — borrowed from the graph driver: a
relative path resolves against wherever the child starts, which is not
guaranteed to be this checkout.

### 6. Land — one PR, the single gate

When the workflow completes, verify the section docs and `ROLLUP.md` exist, then
commit `PRD/work/sweep-<slug>/` on a branch and open **one PR to `main`**. That
PR is the only review touch point. **Never push to `main`** — the owner merges
(per `CLAUDE.md`). Report the branch, the PR URL, and the rollup path; keep the
per-item evidence in the artifact, not the reply.

## Boundaries

- **Deletes nothing, edits no source.** Workers read the corpus and the
  reference; they write only into `PRD/work/sweep-<slug>/`.
- **One touch point.** The cost question is configuration; the PR is the review.
  No mid-run gates, no polling.
- **Off-lifecycle.** No `STATUS.*` marker and no `PRD/work/STATUS.md` board row —
  those belong to the feature graph. A sweep folder is inert to the `thejudge-*`
  skills by design.
- **Thin on purpose.** This is a first cut to be shaken out on a real run, then
  hardened. Do not add guardrails ahead of evidence they are needed.

## First run — the Phase B decision audit

The first real sweep is the docs-refactor **Phase B decision audit**. Invoke it
roughly as:

```
/thejudge-sweep audit PRD/sections/decisions/ (18 domain files, ~158
Status: confirmed decisions) against the 7 current-state specs on main under
PRD/sections/<feature>/README.md. Verdict per decision:
absorbed / partial / not-absorbed / obsolete; for partial / not-absorbed /
obsolete, name exactly what is missing. One line per decision. Delete nothing.
Slug: decision-audit.
```

That run produces `PRD/work/sweep-decision-audit/sections/<domain>.md` per file
plus `ROLLUP.md`, and one PR. It gates the later cleanup that acts on the
verdicts — the sweep itself changes no decision and no spec.
