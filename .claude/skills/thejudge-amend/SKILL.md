---
name: thejudge-amend
description: >-
  Use when new bug reports, issues, or scope requests arrive for a
  PRD/work/<slug>/ package that is already `active` — mapped out, with slice
  docs, and often with shipped slices. Also use when tempted to re-run
  thejudge-refinement solely to fold a few new items into work that is already
  sliced.
---

# TheJudge Amend

## Goal

Route a batch of new items against a mid-flight package: fold in what genuinely
belongs, and refuse what does not. Most batches are mixed. Refusing the wrong
half is the job, not a failure to do the job.

## Inputs

Work slug plus a list of items. If no list was supplied in the same message, ask
for it once rather than inventing one.

## Reads

1. `PRD/work/<slug>/README.md` — status, slice table, resume point
2. `PRD/work/<slug>/DESIGN-BRIEF.md` — **read `## Non-goals` before triaging anything**
3. `PRD/work/<slug>/GAMEPLAN.md` and every slice doc's status line + requirements
4. `PRD/instructions/workflow-reference.md` — status vocabulary

**Refuse the invocation unless status is `active`.** Name the right skill and
stop:

| Status | Send it to |
| --- | --- |
| `ideation`, `refining` | `thejudge-refinement` — the brief is not settled yet |
| `refined` | `thejudge-refinement` — nothing is sliced, so `FOLD` has no target, and writing to the brief would stale a passed quality-check |
| `ship-ready` | `thejudge-cleanup`, then `thejudge-kickoff` for the new items |
| `deferred` | `thejudge-defer` to restore first |
| no package / already cleaned up | `thejudge-kickoff` |

Amendment is only cheaper than refinement once slices exist. Before map-out,
refinement is the cheap path — there is no GAMEPLAN to redo and no shipped slice
to destabilize.

## The non-goals list is load-bearing

**An item that a `## Non-goals` entry or a settled slice requirement excludes is
refused. Editing that entry so the item fits is prohibited.**

The non-goals list is the record of what the owner already decided not to build.
Amending it converts an owner decision into an agent decision. If a non-goal is
genuinely wrong, that is a `thejudge-refinement` round with the owner present —
never a side effect of intake.

The same holds for a slice requirement that already settled the question the new
item reopens. Report the conflict; do not resolve it.

A non-goal item stays refused when the package's own shipped work is what
provoked the report. "Our change caused it, so it is ours to fix" reaches the
same excluded surface by a longer route. If a `planned` slice already owns
verification of that surface, its existing criteria cover the check — say so and
write nothing.

## Triage

Produce one verdict table before writing anything. One row per item, in this
order — item, verdict, anchor, evidence:

Assign verdicts by asking the two questions in this order. The first one that
answers decides; do not skip to the second.

1. **Is this surface excluded from the package?** Excluded by a `## Non-goals`
   entry, or belongs to a screen/subsystem no slice in this package owns →
   `REFUSE`.
2. **Does an existing `planned` slice's stated objective already cover it?**
   Yes → `FOLD`. No → `RECORD`.

| Verdict | Means | Anchor |
| --- | --- | --- |
| `FOLD` | On a surface this package owns, inside a `planned` slice's objective | That slice + the REQ it already cites |
| `RECORD` | On a surface this package owns, but blocked on product truth that does not exist | Held entry naming the truth it needs |
| `REFUSE` | Off-surface: a non-goal excludes it, or no slice here owns that screen | The quoted non-goal, or the surface that owns it |

An item that would amend a settled requirement is `RECORD`, not `REFUSE` — the
owner may well want the amendment. Report the conflict and let refinement
settle it. Needing new product truth never makes an item `REFUSE`; being
off-surface does.

When a `planned` slice's existing criteria already cover the report, record it
as already-covered under that slice and write no new requirement.

Evidence is a file and line, or a quoted non-goal. "Seems related" is not
evidence.

Verify each item's premise against the current code before assigning a verdict —
mid-flight packages routinely receive reports about behavior a `planned` slice
has not built yet. Record the correction and route it as a forward constraint.

## Writes

`FOLD` — append a requirement and its acceptance criteria to that slice doc
only. Cite the REQ the slice already carries.

`RECORD` — one dated entry in `DESIGN-BRIEF.md` under `## Amendments`, stating
the item, why it is held, and what product truth it would need.

`REFUSE` — the verdict table row and nothing else. Do not create a package for
it; name `thejudge-kickoff` and a suggested slug in the next step and let the
owner decide. Opening a package is itself a scope decision.

Then update the `README.md` slice table if any slice's requirement count
changed, and stop.

## Gates

- **Never write to `PRD/sections/`.** No new `REQ-`, no new `DEC-`, no
  `screen-layout.md` row, no `decisions.md` router line, no `open-questions.md`
  entry. Durable truth is `thejudge-refinement`'s to write, with the owner
  present. An amendment that needs a new REQ is a `RECORD`, not a `FOLD`.
- **Never edit a slice whose status line is `done`.** Shipped slices are
  evidence, not workspace.
- **Never add a slice.** A batch that needs new slices exceeds this skill —
  return the verdict table and name `thejudge-refinement`.
- **Never change status, the `STATUS.*` marker, or the board row.**
- Never edit `braindump.md` or `IDEA.md`. They are spent intake records.
- Never treat the batch itself as owner approval. A list of requests is a list
  of requests.

## Rationalizations

Every excuse below is quoted or paraphrased from an agent that did the wrong
thing on this exact task.

| Excuse | Reality |
| --- | --- |
| "The non-goal predates this report, so amending it is just keeping the brief current" | The non-goal is the decision. Reports do not overturn it; the owner does. |
| "Your directive stood in for approval" | It did not. Requests are not approvals, and the skill that needs approval is not this one. |
| "I treated the message as owner approval of intent" | Intent to *consider* items. Never intent to write durable truth. |
| "The approval pause could not run here, so I recorded assumptions instead" | Unavailable gate means stop, not proceed-and-annotate. |
| "Quality-check can validate the new REQs afterward" | Writing them first is the violation. A later gate does not retroactively authorize it. |
| "Slicing it now leaves the work pickup-ready" | Pickup-ready wrong scope is worse than a held item with evidence. |
| "It's the same screen, so it's the same slice" | Same screen, different objective, is a different slice's job or a new package. |
| "Refusing most of the batch looks unhelpful" | A mixed batch with three refusals is a correct result. |
| "Our own shipped change caused this, so the non-goal doesn't apply" | The non-goal names a surface, not a cause. Still refused. |
| "It needs a new REQ, so it must be a REFUSE" | Needing new truth is `RECORD`. Only being off-surface is `REFUSE`. |
| "I'll open the follow-up package to be helpful" | Opening a package decides scope. Name it; let the owner open it. |

## Red flags — stop and return the verdict table

- About to edit `## Non-goals`, or a `done` slice, or anything in `PRD/sections/`
- About to create `slice-i-*.md` or later
- Reaching for `thejudge-refinement` or `thejudge-map-out` mid-amendment
- Every item in the batch came back `FOLD`
- Writing "assumption", "default chosen", or "stood in for approval" anywhere
- Inventing a verdict outside `FOLD` / `RECORD` / `REFUSE`, or splitting one
  item across two

## Next step

`FOLD`s written → `/thejudge-implement PRD/work/<slug>/ slice <letter>`.
Any `RECORD` or scope-exceeding batch → `/thejudge-refinement PRD/work/<slug>/`,
naming the held items.

(`$thejudge-*` in Codex.)
