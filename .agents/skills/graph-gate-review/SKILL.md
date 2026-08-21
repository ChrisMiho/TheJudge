---
name: graph-gate-review
description: >-
  Use when a graph run has parked at the `define` gate with a recorded
  PRD/sections/ diff — walks that diff one stable ID at a time, takes an
  accept/edit/reject verdict per item, records the verdicts, resolves the gate,
  and hands back the exact command that resumes the run.
---

# Graph Gate Review

## Goal

Let the owner read the product truth a run wrote, one stable ID at a time, and
put the run back on the rails — without hand-editing a marker and a board row.

This is the owner-facing half of the `define` gate. The gate exists because
node 8 (`land`) was otherwise the first human touch, so code would exist against
product truth nobody had read. A park with no way through it is friction that
gets routed around, which is how a gate stops binding — so the park and this
skill ship together.

Read `PRD/instructions/graph-workflow-contract.md` before acting.

## Inputs

`PRD/work/<slug>/` path. Nothing else — no verdict may be supplied up front.
Pre-supplied verdicts would make this a second author rather than a review.

## Reads

1. `PRD/work/<slug>/GRAPH-RUN.md` — `## Open gate` and the recorded
   `PRD/sections/` diff
2. `PRD/work/<slug>/README.md` and its `STATUS.*` marker
3. The current `PRD/sections/` files the diff touches
4. `PRD/instructions/graph-workflow-contract.md`

## Refuse unless the gate is a `define` diff

Read `## Open gate` first. This skill understands exactly one gate: a `define`
node's non-empty `PRD/sections/` diff.

Refuse, naming the gate you found and why it is not yours, when the open gate is
anything else — a fourth `gate-qc` FAIL, a Critical review finding, a `PROMPTED`
denied command, a `BLOCKED` external condition. None of those is a diff to walk,
and resolving them here would mark a gate resolved that nobody addressed.

Refuse a package that is not parked at all: no `## Open gate`, or a gate already
marked resolved. Report the package's actual status and stop.

## Procedure

1. Restate the gate in one sentence: how many stable IDs are pending, and which.
2. **Walk them one at a time, in the order they appear in the diff.** For each:
   1. Restate the item **in plain product terms first** — what a player would
      experience or do — before showing any diff. An owner deciding from a
      unified diff alone is reading syntax, not product.
   2. Show that ID's complete diff. Never a summary.
   3. Take one verdict: `accept`, `edit`, or `reject`. Ask for the reason on
      `edit` and `reject`; `accept` needs none.
   4. Apply it immediately, before moving on. A batch applied at the end loses
      the correspondence between verdict and change.
3. Never show the next item before the current one has a verdict.
4. When every ID has a verdict, write `## Gate verdicts`, resolve the gate,
   restore the status, and hand back the resume command.

## Verdicts

| Verdict | What you do to `PRD/sections/` | Recorded |
| --- | --- | --- |
| `accept` | nothing — the run's text stands | ID and `accept` |
| `edit` | apply the owner's correction, inside that ID's body only | ID, `edit`, and the owner's reason quoted |
| `reject` | revert that ID out of `PRD/sections/` entirely | ID, `reject`, and the owner's reason quoted |

**A `reject` burns the number.** The ID is removed from `PRD/sections/` and is
never reissued — the next refinement allocates the following number, as it does
for any consumed ID. Renumbering would break every reference that already
pointed at it, which is the reason stable IDs are stable.

## Writes

- `GRAPH-RUN.md` `## Gate verdicts` — one row per stable ID:

  ```markdown
  ## Gate verdicts

  | Stable ID | Verdict | Reason |
  | --- | --- | --- |
  | `DEC-166` | accept | — |
  | `REQ-152` | edit | "the cap is per turn, not per game" |
  | `REQ-153` | reject | "this is the enrich pack's scope, not this package's" |
  ```

- `GRAPH-RUN.md` `## Open gate` — marked resolved, with the date and the
  verdict count. The recorded diff stays; it is the evidence of what was walked.
- `PRD/sections/` — **only** to apply an `edit` or a `reject`, and only inside
  the recorded diff.
- The package `README.md` `status:` field, the `STATUS.*` marker, and the
  `PRD/work/STATUS.md` board row — restored to the lifecycle position the node
  table expects. After a `define` gate that is `refined`, so the resumed run
  enters at `gate-qc`.

## Boundaries

- Never advance a node, never dispatch a subagent, never run a `thejudge-*`
  skill. This skill reviews; it does not drive.
- Never write `DESIGN-BRIEF.md`, `GAMEPLAN.md`, or any `slice-*.md`. Those
  belong to the phase skills, and writing them here would make the reviewer a
  second author.
- Never edit `PRD/sections/` outside the recorded diff. A change the run did not
  make is not this gate's to take.
- Never decide a verdict on the owner's behalf, and never infer one from an
  earlier answer. Every stable ID gets its own.
- Never resolve a gate with any ID still unwalked.

## Next step

Report the verdict counts and the restored status, then end with:

`/graph-run PRD/work/<slug>/` (`$graph-run PRD/work/<slug>/` in Codex) — the run
resumes at `gate-qc`.

On a refusal, report the gate you found and the skill or human action that owns
it instead, and give no resume command.
