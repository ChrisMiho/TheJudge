# Documentation refactor — consolidated gameplan

Status: **gameplanning complete.** Every question is answered. Nothing has been
implemented — this is ready to hand to an implementing agent.

This is the handoff document. Read this first; the others are evidence.

| File | What it is |
| --- | --- |
| `workflow.md` | The owner's original brain dump |
| `workflow-decomposition.md` | Full evidence, measurements, and the reasoning behind every ruling |
| `answers.md` | The question rounds, all closed |
| this file | The plan itself |

---

## The problem, in one paragraph

Product truth lives in a 167-entry decision log that sits at read-first and
precedence #1, so every task opens the index of every decision ever made. Worse,
a decision records *a change* — current truth for one feature is the sum of a
supersession chain nobody can hold in their head. The owner cannot follow their
own product documentation without an agent translating it, which makes reviewing
agent work impossible. The fix is a current-state spec per feature, written in
player terms, with the decision log retired behind it.

## Four packages

| # | Package | Outcome | Door |
| --- | --- | --- | --- |
| 0 | **Codebase health audit** | One document naming every place the same need is served twice. Doubles as the shakedown run | Graph run (read-only) |
| 1 | **Feature spec layer** | Current-state specs replace the decision log. Three phases, A/B/C | Graph runs + one manual session |
| 2 | **Overnight-run tuning** | Two-run split, async markdown gate, morning digest, merge-safe ordering | Mixed |
| 3 | **Operator manual** | How to bring an idea, a bug, or an overnight run | Manual |
| 4 | **Plain-language standard** | Every owner-facing artifact explains itself in terms the owner can act on | Manual |

Package 4 is the only one that addresses Observations 1 and 2 of the brain dump
— the problems that started this. Do not let it fall off the end.

---

## Package 1 — the three phases

### Phase A — write the specs

Seven directories under `PRD/sections/`, plus `data/` per corpus and
`system-map/` as the machinery layer.

**Written in this order**, smallest and most self-contained first:

| # | Directory | Why here |
| --- | --- | --- |
| 1 | `life-tracker` | Self-contained, frontend-only, no backend or prompt entanglement. Short enough that the first spec gate walk is a small read |
| 2 | `user-feedback` | Frontend-only, no server state, one clear external dependency |
| 3 | `trade-balancer` | Frontend-only but carries a corpus, so it exercises the corpus/behavior split |
| 4 | `scan` | Cross-cutting — first test of a feature referenced by three destinations |
| 5 | `quick-lookup` | Full backend path: prompt assembly, retrieval, provider boundary |
| 6 | shared chrome | Late on purpose — easier once the feature specs have shown which chrome they kept reaching for |
| 7 | `in-depth` | Largest and most entangled; benefits from every pattern the first six established |

**The decision log is untouched and stays precedence #1 for all of Phase A and
B.** Specs carry an explicit draft marker until Phase C flips precedence. A spec
that comes out wrong is corrected against a source that still exists.

Each run also emits a `CODE-HEALTH.md` — observation only, never acted on.

### Phase B — audit decisions against specs

One verdict per confirmed decision: `absorbed`, `partial` (naming exactly what
is missing), `not-absorbed`, or `obsolete`. Split by the 18 existing domain
files. **Deletes nothing.** Its whole job is making Phase C's deletions
evidence-backed rather than judged.

### Phase C — retire

Flip precedence, delete what the audit proved absorbed, rewrite the
decision-writing step in the 5 skills, replace the decision template, point the
gate at REQ IDs, update the 21 remaining citations.

**Must be an ordinary interactive session** — it edits `thejudge-*` skills,
which a graph run may not do.

**Gates.** B cannot start until A's specs exist. C cannot start until B has a
verdict on all 153 confirmed decisions.

---

## Binding constraints

Every one of these is a settled ruling. An implementing agent must not
relitigate them.

### Identity and IDs

1. **An ID names a place in the product, not a moment in time.** When behavior
   changes, rewrite that entry in place. Never add a second entry that supersedes
   the first. This is the rule that keeps the refactor from rebuilding the exact
   problem it exists to solve.
2. **No ID is ever renumbered.** 101 source files cite decision IDs, 60 cite
   requirement IDs, 11 cite flow IDs, and 74 receipts cite decisions.
3. **Requirement IDs survive even though decision IDs do not.** They are the
   gate's unit of review once decisions retire. Retiring both silently breaks
   the define gate.
4. A requirement's `Status: confirmed / superseded` field is dropped and replaced
   by a `Built:` marker. Behavior status is tracked **per behavior**, not per
   feature.

### Buckets

5. **`data/` membership test — all four must hold:** external upstream source, a
   build or refresh command, a committed artifact, and **it describes Magic, not
   TheJudge**. Clause four is what stops the catch-all.
6. Anything explaining how the *product* behaves is a feature spec if a player
   sees it, machinery if they do not. Never data.
7. `screen-layout.md` splits: per-screen rows to their feature, shared chrome and
   the shared layout language to the chrome bucket.
8. **Every measured bound travels with the row it belongs to.** A row arriving in
   a feature spec stripped of its measurement is the failure this refactor exists
   to prevent. A measurement survives if the surface it constrains still exists
   in code; ambiguous cases stay and are flagged.

### Content that must not be lost

9. Every spec carries a **rejected alternatives and measured bounds** field. The
   supersession narrative is worthless, but a measured dead end is a
   current-state constraint telling an agent which door is already closed.
10. `open-questions.md` retires: Q-001 moves to the rules-retrieval machinery
    spec as a live item, Q-002/003/004 fold into their feature specs as deferred
    alternatives, Q-005 is dropped.

### Run mechanics

11. **Two runs, two PRs.** Run one stops at quality-check PASS with the package
    `refined`, a docs-only PR, and a questions file. Run two is
    `/graph-run PRD/work/<slug>/`. The only contract change is the stop
    condition — the node table and every boundary are unchanged.
12. **Gates are answered in a markdown file with answer slots**, not walked live
    in the terminal. The run parks and ends; the owner answers on their own
    schedule.
13. The overnight queue **continues past a park**, never past a failure.
    Sequential only — the run lock is a single path holding one slug.
14. Phase A is calendar-bound, not compute-bound: seven specs means roughly
    seven gate sittings.

---

## Sequencing

1. **Package 0** — codebase health audit. Read-only, so a first-run guardrail
   problem is harmless. Informs Phase A's bucket assignments.
2. **Phase A** — seven spec runs, one per directory, overnight, sequential, in
   the order above.
3. **Package 2** — tune against what runs 1–8 actually did. Not before; there is
   no failure evidence yet.
4. **Phase B** — audit, split by domain file.
5. **Phase C** — retire. Manual session.
6. **Package 4** — plain-language standard.
7. **Package 3** — operator manual, last, because it documents what the others
   settled.

Package 4 may move earlier if the owner finds run output hard to follow — it is
the package that fixes exactly that.

## Kicking off

One command. `graph-run` is the single intake door (DEC-167).

```
/graph-run "<request>" PRD/work/adhoc/refactor-gameplan.md
```

**Do not invoke `/graph-preflight` yourself on a fresh run.** `graph-run`
dispatches it as node 1: the driver proposes the slug from the request, derives
the branch as `thejudge-auto/<slug>`, mints the run id, and passes them in.
`graph-preflight` requires `--branch` and never infers it, so calling it by hand
means naming the branch manually — which is exactly what DEC-167 removed.

Preflight is only invoked separately in one narrow case: entering an *existing*
package mid-lifecycle whose README has no `## Autonomous metadata` base
recorded.

Intake is copied verbatim and is evidence, never authority. Every product
decision it raises is still made with the owner at the define gate.

### Doc bug for Package 3 to fix

`PRD/README.md` currently reads: *"`/graph-preflight` then `/graph-run
PRD/work/<slug>/`"*. That describes the narrow mid-lifecycle resume case as
though it were the general one, and it is what made the kickoff command
ambiguous. The operator manual should state the fresh-run path — one command —
as the default, with the separate-preflight case as the exception.
