---
name: graph-gate-review
description: >-
  Use when a graph run has parked at the `define` gate with an answered
  GATE-QUESTIONS.md — reads the owner's accept/edit/reject verdict for each
  stable ID, applies them to the proposed diff inside GATE-QUESTIONS.md
  (finalizing the proposal in the work folder; never editing PRD/sections/),
  reconciles DESIGN-BRIEF.md and the README's intake pointer to every edit or
  reject so the re-grade sees one consistent package, records the verdicts,
  resolves the gate, and hands back the exact command that resumes the run.
---

# Graph Gate Review

## Goal

Apply the product-truth review the owner recorded in `GATE-QUESTIONS.md`, and put
the run back on the rails — without the owner hand-editing a marker and a board
row. The review is applied **inside `GATE-QUESTIONS.md`**, finalizing the
proposal; it never touches `PRD/sections/`, which implementation applies later
from the finalized proposal (see `PRD/instructions/graph-workflow-contract.md`,
`## Propose / apply / close`).

An `edit` or `reject` also changes what the package says the product does, so
the same pass carries the verdict into `DESIGN-BRIEF.md` and, where a verbatim
intake file still states the superseded behaviour, into the README's pointer to
it. The brief is what `gate-qc` re-grades next and what `thejudge-map-out`
slices; a brief left on the pre-verdict rule fails the re-grade and spends a
loop the run cannot get back (2026-09-09: two parks past the loop limit on
findings that were pure consequences of the owner's own edit).

This is the owner-facing half of the `define` gate. The gate exists because
`land` (node 9, the owner's merge of the code PR) was otherwise the first human
touch, so code would exist against product truth nobody had read. The owner does
the reading and deciding **in the questions file, on their own schedule**; this
skill reads that answered file and applies it. It runs either when the owner
invokes it directly or when `graph-implement` dispatches it after claiming the
spec — in that case in the build worktree the dispatch's `Working directory:`
names (`.worktrees/implement-<slug>`, on `thejudge-auto/<slug>-work`), where the
finalized proposal is committed alongside the rest of the build (REQ-193).

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
4. Reconcile the design record to every `edit` and `reject`, in the same pass —
   the verdict changes what the package says the product does, and the brief is
   what `gate-qc` re-grades and `thejudge-map-out` slices:
   - Enumerate, by a grep you quote in the `### Brief reconciliation` list (never
     from memory), every `DESIGN-BRIEF.md` passage that still states the
     superseded behaviour — design sections, `## Assumptions` rows, the slice
     sketch, the product-truth-changes list — and rewrite each to the owner's
     rule, in the owner's words where they gave them, citing the verdict as the
     evidence (an assumption row's evidence becomes the verdict itself). For a
     `reject`, rewrite the passage to say the change is not proceeding and the
     current truth stands, and drop it from the slice sketch.
   - `intake/` is verbatim evidence and is never edited. When an intake file
     still states the superseded behaviour, extend the package README's pointer
     sentence with one supersession note naming the intake passage and the
     verdict that supersedes it.
   - Re-run the grep across the package (excluding `intake/` and `GRAPH-RUN.md`)
     and require zero hits before resolving the gate. Rewrite only what
     contradicts a verdict: an `accept` touches nothing, and no new design is
     added.
5. Answer any `## Blocker questions` the same way the owner recorded them, within
   the scope each names.
6. When every block is applied and the brief is reconciled, write
   `## Gate verdicts` (with its `### Brief reconciliation` list), resolve the
   gate, restore the status, and hand back the resume command.

## Verdicts

| Verdict | What you do to the proposal (`GATE-QUESTIONS.md`) | What you do to the brief (`DESIGN-BRIEF.md`, README intake pointer) | Recorded |
| --- | --- | --- | --- |
| `accept` | nothing — the proposed diff stands as written | nothing | ID and `accept` |
| `edit` | apply the owner's `Reason:` correction, inside that ID's proposed diff only | rewrite every passage that still states the superseded behaviour to the owner's rule, verdict cited as evidence; README supersession note if a verbatim intake file states it too | ID, `edit`, the owner's reason quoted, and the passages rewritten |
| `reject` | remove that ID's proposed diff from the proposal entirely | rewrite every passage that describes the rejected change to say it is not proceeding; drop it from the slice sketch; README supersession note if intake states it | ID, `reject`, the owner's reason quoted, and the passages rewritten |

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

  ### Brief reconciliation

  - grep: `grep -nE '<the phrases the superseded behaviour used>' DESIGN-BRIEF.md README.md`
  - `DESIGN-BRIEF.md:106` — said the entry's current toggle is kept → now says the mode is re-derived from the printing's prices every time (REQ-152 edit)
  - `DESIGN-BRIEF.md:153` (A6) — assumption rewritten; evidence is now the owner's verdict (REQ-152 edit)
  - `README.md` pointer — supersession note: `intake/GRAPH-BRIEF.md` decision 4 is superseded by the REQ-152 verdict
  ```

  The list quotes the grep and names every rewritten passage (what it said →
  what it says now, and the verdict it follows), or reads `none` when every
  verdict was `accept`.

- `DESIGN-BRIEF.md` — **only** to carry an `edit` or `reject` into passages that
  still state the superseded behaviour (design sections, assumption rows, the
  slice sketch, the product-truth-changes list). Never to add design, never for
  an `accept`.
- The package `README.md` pointer to `intake/` — one supersession sentence when
  a verbatim intake file still states the superseded behaviour. `intake/` itself
  is never edited.
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
- Never write `GAMEPLAN.md` or any `slice-*.md`; they belong to
  `thejudge-map-out`. `DESIGN-BRIEF.md` is written only to reconcile a passage
  to an `edit` or `reject` verdict the owner recorded — the owner authored that
  change, this skill only carries it — never to add, extend, or re-decide
  design. An `accept` leaves the brief untouched.
- Never edit anything under `intake/`. It is verbatim evidence of what was
  handed in; a superseded intake claim gets a supersession note in the README
  pointer, not an edit.
- Never edit `PRD/sections/` at all. Verdicts are applied inside the proposal
  (`GATE-QUESTIONS.md`); implementation applies the finalized proposal to
  `PRD/sections/` later. A change the run did not propose is not this gate's to take.
- Never invent, infer, or override a verdict. Every verdict is the owner's, read
  from the file; a blank or malformed slot refuses rather than resolves.
- Never resolve a gate with any block unanswered.

## Next step

Report the verdict counts, the brief reconciliation (passages rewritten and the
README note, or `none`), and the restored status, then end with:

`/graph-implement PRD/work/<slug>/` (`$graph-implement PRD/work/<slug>/` in Codex)
— the run resumes at `gate-qc`.

On a refusal, report the gate you found and the skill or human action that owns
it instead, and give no resume command.
