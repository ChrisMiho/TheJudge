---
name: graph-gate-review
description: >-
  Use when a graph run has parked at the `define` gate with an answered
  GATE-QUESTIONS.md — reads the owner's accept/edit/reject verdict for each
  stable ID, applies them to the proposed diff inside GATE-QUESTIONS.md
  (finalizing the proposal in the work folder; never editing PRD/sections/),
  records the verdicts, resolves the gate, and hands back the exact command that
  resumes the run.
---

# Graph Gate Review

## Goal

Apply the product-truth review the owner recorded in `GATE-QUESTIONS.md`, and put
the run back on the rails — without the owner hand-editing a marker and a board
row. The review is applied **inside `GATE-QUESTIONS.md`**, finalizing the
proposal; it never touches `PRD/sections/`, which implementation applies later
from the finalized proposal (see `PRD/instructions/graph-workflow-contract.md`,
`## Propose / apply / close`).

This is the owner-facing half of the `define` gate. The gate exists because
node 8 (`land`) was otherwise the first human touch, so code would exist against
product truth nobody had read. The owner does the reading and deciding **in the
questions file, on their own schedule**; this skill reads that answered file and
applies it. It runs either when the owner invokes it directly or when run two
dispatches it on resume.

Read `PRD/instructions/graph-workflow-contract.md` before acting.

## Inputs

`PRD/work/<slug>/` path. Nothing else — every verdict comes from the answered
`GATE-QUESTIONS.md` in the package, never from the command line. A verdict
supplied any other way would make this a second author rather than the owner's
review.

## Reads

1. `PRD/work/<slug>/GATE-QUESTIONS.md` — the owner's answer slots. Each
   `## <STABLE-ID>` block opens with the gate-question plain-language block from
   `PRD/instructions/plain-language-standard.md` (*What this decides · In plain
   terms · What happens if you say no*); that block is what the owner answered
   against, and your own reporting back to the owner follows the same standard —
   lead with the ask, inline the substance of any ID you name
2. `PRD/work/<slug>/GRAPH-RUN.md` — `## Open gate`. The proposed diff lives in
   `GATE-QUESTIONS.md` (item 1), authored by refinement, not in the ledger
3. `PRD/work/<slug>/README.md` and its `STATUS.*` marker
4. `PRD/instructions/graph-workflow-contract.md`

## Refuse unless the gate is an answered `define` proposal

Read `## Open gate` first. This skill understands exactly one gate: a `define`
node's proposed product-truth change, recorded as `GATE-QUESTIONS.md`.

Refuse, naming the gate you found and why it is not yours, when the open gate is
anything else — a fourth `gate-qc` FAIL, a Critical review finding, a `PROMPTED`
denied command, a `BLOCKED` external condition. None of those is a questions file
to apply.

Refuse a package that is not parked at all: no `## Open gate`, or a gate already
marked resolved. Report the package's actual status and stop.

**Refuse an unanswered file.** If any `## <STABLE-ID>` block's `Verdict:` slot is
blank or holds anything other than `accept` / `edit` / `reject`, stop and name
every unanswered or malformed ID. An unanswered gate cannot resume — this is what
keeps run two a single owner command with nothing to guess.

## Procedure

1. Restate the gate in one sentence: how many stable IDs the file carries, and
   their verdict split.
2. Parse every `## <STABLE-ID>` block. Confirm each has a filled `Verdict:` slot,
   and that `edit` / `reject` blocks carry a `Reason:` — refuse otherwise, naming
   the offending IDs (see above).
3. Apply each verdict, in the order the IDs appear, **inside that ID's proposed
   diff in `GATE-QUESTIONS.md`** only — never in `PRD/sections/`:
   - `accept` — nothing; the proposed diff stands as refinement wrote it.
   - `edit` — apply the owner's `Reason:` as the correction to that ID's proposed
     diff.
   - `reject` — remove that ID's proposed diff from the proposal entirely, so it is
     never applied to `PRD/sections/`; the number is burned and never reissued.
4. Answer any `## Blocker questions` the same way the owner recorded them, within
   the scope each names.
5. When every block is applied, write `## Gate verdicts`, resolve the gate,
   restore the status, and hand back the resume command.

## Verdicts

| Verdict | What you do to the proposal (`GATE-QUESTIONS.md`) | Recorded |
| --- | --- | --- |
| `accept` | nothing — the proposed diff stands as written | ID and `accept` |
| `edit` | apply the owner's `Reason:` correction, inside that ID's proposed diff only | ID, `edit`, and the owner's reason quoted |
| `reject` | remove that ID's proposed diff from the proposal entirely | ID, `reject`, and the owner's reason quoted |

**A `reject` burns the number.** The ID is removed from the proposal and is never
reissued — it is never applied to `PRD/sections/`, and the next refinement
allocates the following number, as it does for any consumed ID. Renumbering would
break every reference that already pointed at it, which is the reason stable IDs
are stable.

## Writes

- `GRAPH-RUN.md` `## Gate verdicts` — one row per stable ID:

  ```markdown
  ## Gate verdicts

  | Stable ID | Verdict | Reason |
  | --- | --- | --- |
  | `REQ-151` | accept | — |
  | `REQ-152` | edit | "the cap is per turn, not per game" |
  | `REQ-153` | reject | "this is the enrich pack's scope, not this package's" |
  ```

- `GRAPH-RUN.md` `## Open gate` — marked resolved, with the date and the verdict
  count. The answered `GATE-QUESTIONS.md` (now finalized) stays; it is the evidence
  of what was reviewed and the source implementation applies at `build`.
- `GATE-QUESTIONS.md` — **only** to apply an `edit` or a `reject`, and only inside
  that ID's proposed diff. **Never `PRD/sections/`** — the finalized proposal is
  applied to `PRD/sections/` by implementation (`build`), not here.
- The package `README.md` `status:` field, the `STATUS.*` marker, and the
  `PRD/work/STATUS.md` board row — restored to the lifecycle position the node
  table expects. After a `define` gate that is `refined`, so the resumed run
  enters at `gate-qc`.

## Boundaries

- Never advance a node, never dispatch a subagent, never run a `thejudge-*`
  skill. This skill applies the owner's review; it does not drive.
- Never write `DESIGN-BRIEF.md`, `GAMEPLAN.md`, or any `slice-*.md`. Those belong
  to the phase skills, and writing them here would make the reviewer a second
  author.
- Never edit `PRD/sections/` at all. Verdicts are applied inside the proposal
  (`GATE-QUESTIONS.md`); implementation applies the finalized proposal to
  `PRD/sections/` later. A change the run did not propose is not this gate's to take.
- Never invent, infer, or override a verdict. Every verdict is the owner's, read
  from the file; a blank or malformed slot refuses rather than resolves.
- Never resolve a gate with any block unanswered.

## Next step

Report the verdict counts and the restored status, then end with:

`/graph-run PRD/work/<slug>/` (`$graph-run PRD/work/<slug>/` in Codex) — the run
resumes at `gate-qc`.

On a refusal, report the gate you found and the skill or human action that owns
it instead, and give no resume command.
