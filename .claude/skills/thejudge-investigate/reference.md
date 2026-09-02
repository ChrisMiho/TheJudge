# TheJudge Investigate — reference

Templates, the two decisions that shape a run, and the subagent dispatch shape.
Read [SKILL.md](SKILL.md) for the flow; this file is what you fill in.

## Decision 1 — how the run lands

Pick from what the owner asked for, not from how much you found.

| The ask sounds like | Landing | Deliverable |
| --- | --- | --- |
| "Should we…", "is it worth…", "why is…", "which is better" | **Answer** | Recommendation in chat + `FINDINGS-*.md`. No brief. |
| "Figure out what building X needs", "set this up for a graph run" | **Brief** | Self-contained `GRAPH-BRIEF.md` + the `/graph-kickoff` handoff. |
| "…, and build it / get it ready **if** it's worth it" (conditional) | **Answer, then Brief if it clears the bar** | Recommendation always; add `GRAPH-BRIEF.md` only when the finding meets the owner's stated condition. |
| One question across many comparable places (see Decision 2) | **Delegated to sweep** | Sweep's `ROLLUP.md` + PR. One-line `PROBE.md`, then stop. |

When it's genuinely ambiguous — an open question whose finding turns out
build-shaped, with **no** build intent stated or implied — ask the owner which
they want before writing `GRAPH-BRIEF.md`. A **conditional** ask is not this
case: the owner already pre-authorized the brief, gated on the finding, so
investigate and then write it only if the condition is met. The "never
auto-upgrade an answer into a build handoff" rule bans only escalating an
*unconditional* question on your own.

## Decision 2 — your own subagents vs. thejudge-sweep

Read the *shape* of the corpus, not the topic (some judgment about what counts as
"one verdict set" is unavoidable — but shape decides it):

- **Same question, one verdict set, across many comparable places** (a corpus
  that splits into sections; one score per item; a rollup that sorts the
  contentious ones to the top) → **invoke `thejudge-sweep`.** It owns the cost
  question and the one PR. Do not rebuild it here.
- **Independent, differently-shaped probes** run in parallel ("measure A, check
  B, trace C") → **your own subagents** (skeleton below). No common verdict axis
  means no sweep rollup — this is not a sweep.
- **One thing to work out** → inline, no fan-out at all.

## `PROBE.md` — the thin ledger

Written to `PRD/work/probe-<slug>/PROBE.md` at the start. A record of what you're
investigating and what ran — not a lifecycle document.

```markdown
# Probe — <slug>

- Date: <YYYY-MM-DD>
- Question: <what we're actually trying to learn or decide>
- Mode: answer | brief (may start unknown; set when decided)
- What ran: <inline reads / N subagents / invoked thejudge-sweep>
- Evidence: <FINDINGS-*.md paths>
```

## `GRAPH-BRIEF.md` — the graph-kickoff intake (brief mode only)

Self-contained intake for `graph-kickoff`. **Every decision and number refinement
needs is inlined here** — `graph-kickoff` branches from `main` and cannot read your
scratch branch, so a link to your findings is not enough. Fill only the sections
that apply; drop the rest. Modeled on the `semantic-rule-retrieval` brief that
graph-kickoff consumed cleanly.

```markdown
# Graph-run brief — <title>

Self-contained intake for `graph-kickoff`. The investigate-first questions are
**resolved with data below**, so refinement can go straight to a DESIGN-BRIEF.

## What the player gets
<Lead with the player-facing outcome, in game terms. What changes for someone
using the product.>

## Why (measured — do not re-derive)
<The evidence that settles it: the numbers, the benchmark, the comparison. Inline
the table; don't link it. If a decision was open and is now made, say so here and
say what made it.>

## Decisions already made — do not re-litigate
<Each decision the owner and you already settled, one line each, so refinement
doesn't reopen them.>

## Design direction (converged)
<The shape the build should take: seams, artifacts, where it plugs in. Direction,
not slices — map-out owns slicing.>

## Current-state PRD truth to amend
<The feature spec(s) under PRD/sections/<feature>/ to edit and the new REQ/FLOW to
add. The decision log is retired — no new DEC. Name the files; do not edit them
here (refinement/graph-kickoff own that write).>

## Constraints (don't rediscover)
<The traps: mock-default must still work, latency targets, what must not be
committed, related-but-distinct parked work not to conflate.>

## Evidence + reusable tooling
<Where the full findings and any harness live — the probe folder, a branch — for
whoever wants to re-run. This is the one place a pointer is fine; the decisions
above stand without it.>

## What the graph run should produce
<One paragraph: the DESIGN-BRIEF, the REQ/FLOW amendments, and the slices that
implement it. Note anything already decided so the run doesn't reopen it.>

## How to hand this off
/graph-kickoff "<one-line request>" PRD/work/probe-<slug>/GRAPH-BRIEF.md
```

## Subagent dispatch shape (your own probes)

For independent parallel probes only (Decision 2). Every prompt carries an
absolute `Working directory:` line and absolute paths — a child resolves a
relative path against wherever it starts, not this checkout (the `graph-kickoff`
lesson).

```
Working directory: <absolute repo root>

<the one probe this agent runs — a question, a measurement, a trace>.

Read (absolute paths):
- <abs path>
Write your finding to (absolute path):
- PRD/work/probe-<slug>/FINDINGS-<probe>.md

Edit no product code and no PRD file — read only, write only your finding doc.
Return: your finding as a short structured result (claim + evidence).
```

Dispatch these with the `Agent` tool (`subagent_type: "general-purpose"`
guarantees `Write` for the finding doc), or as one background `Workflow` when
there are several — the same `parallel(...)` shape sweep's reference uses, minus
the uniform verdict schema. Barrier only if a later step needs every probe's
result at once; otherwise let them report as they finish.

## Large fan-out — the cost check

Before spending **four or more agents**, give the owner sweep's cost-vs-
thoroughness framing first: worker model, worker effort, and how many probes per
agent. One `AskUserQuestion`, recommended default first — the shape is in
`thejudge-sweep`'s reference under "The cost question." Three or fewer you may
just launch.
