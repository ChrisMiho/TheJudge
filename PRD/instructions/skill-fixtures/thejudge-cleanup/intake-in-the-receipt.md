# thejudge-cleanup — one package has intake, one does not

Skill under test: `thejudge-cleanup` (folds `PRD/work/<slug>/intake/` into
an `## Intake` section in the receipt before deleting the package folder,
beside — not inside — `## Graph run`; a package with no `intake/` gets no
section).
Format and rules: `PRD/instructions/skill-testing.md`.
Rep setup: `scripts/fixture-rig.mjs` — never hand-build reps.

## Why this scenario exists

REQ-162's durability half discharges the first follow-up on
`PRD/instructions/receipts/graph-run-boundary-enforcement-2026-08-20.md`:
deleting `PRD/work/<slug>/` should not lose the record of what document drove
the work. The trap is symmetry: it is easy to author one receipt template and
apply it to both packages regardless of whether `intake/` actually exists.

## Preconditions

A repository, built by the rig, at the tip of `graph-single-door-workflow`
(slices A–G merged), with two `ship-ready` packages seeded, **neither built
by a graph run** (no `GRAPH-RUN.md`, no `## Autonomous metadata` — built by a
direct `thejudge-kickoff` session, so the merge-proof gate does not apply):

- `PRD/work/fixture-intake-alpha/` — `status: ship-ready`, one `done` slice,
  and `intake/owner-notes.md` containing a short background note
- `PRD/work/fixture-intake-beta/` — `status: ship-ready`, one `done` slice,
  no `intake/` folder
- both listed under `## ship-ready` in `PRD/work/STATUS.md`

## Scenario

Give the agent repo access and this prompt verbatim. Do not name
`thejudge-cleanup` — discovery is part of what is under test.

> `fixture-intake-alpha` and `fixture-intake-beta` are both done and shipped
> — close them both out and clear them off the board.
>
> When you're done, report back with the receipt file(s) it wrote and, for
> each one, exactly which top-level `##` sections the receipt contains.

## Grading key

**Never shown to the agent.**

| # | Expected | Anchor | Why |
| --- | --- | --- | --- |
| 1 | Discovers and applies `thejudge-cleanup` without being named | `AGENT-SKILLS.md` catalog | A skill that is never found never runs |
| 2 | `fixture-intake-alpha`'s receipt carries `## Intake`, written before the package folder is deleted, naming `intake/owner-notes.md` and its stated origin | `thejudge-cleanup/SKILL.md` `### Intake in the receipt` | REQ-162 |
| 3 | `## Intake` sits as a sibling `##` heading, not nested under `## Graph run` (which is absent here regardless) | `thejudge-cleanup/SKILL.md` `### Intake in the receipt` | G4's structural requirement |
| 4 | **`fixture-intake-beta`'s receipt carries no `## Intake` section at all** — not an empty one, not a placeholder | `thejudge-cleanup/SKILL.md` "do not add an empty `## Intake` section" | **Trap.** The obvious shortcut is one shared receipt template applied to both packages regardless of whether `intake/` exists |
| 5 | Both deletes proceed normally; missing `intake/` on beta is never treated as a blocker or refusal | `thejudge-cleanup/SKILL.md` "no new refusal condition" | Confirms slice G didn't add a gate |

Outcome space: items 1, 2, 3, 5 must succeed; item 4 must refuse (no section
where none belongs). A run where nothing refuses has not been tested.

## Measured runs

| Date | Skill version | Reps | Result | Variance notes |
| --- | --- | --- | --- | --- |
| 2026-08-20 | `thejudge-cleanup` @ slice G (`eed780e`) | 3 | **PASS — all 5 items, 3 of 3** | Zero divergence. Control also run — see below |

### 2026-08-20 — first measured run

Reps built by `scripts/fixture-rig.mjs`: three clones, three bare origins,
two seeded `ship-ready` packages per rep (`fixture-intake-alpha` with
`intake/owner-notes.md`, `fixture-intake-beta` with none), neither built by
a graph run (no `GRAPH-RUN.md`, no `## Autonomous metadata`, so the
merge-proof gate never engages). Scenario prompt given verbatim.

**Items 1–5, 3 of 3, zero divergence:**

- **1** — every rep found `thejudge-cleanup` via `AGENT-SKILLS.md` unprompted
  (one rep applied its rules by hand rather than invoking the Skill tool,
  which still counts as discovery and correct application).
- **2, 3** — alpha's receipt carried `## Intake` in every rep, sibling to
  the other top-level sections (no `## Graph run` in any rep, since none
  held a `GRAPH-RUN.md`), naming `intake/owner-notes.md` and its stated
  origin.
- **4** — beta's receipt carried **no** `## Intake` section in any rep —
  the trap did not catch anyone. Section lists observed: rep 2
  `## Actions taken, ## Files created, ## Files updated, ## Files deleted,
  ## Verification results, ## Intake` (order: Intake last); reps 3 and 4
  `## Actions taken, ## Intake, ## Files, ## Verification` (order: Intake
  second). Order varies by rep; the requirement (sibling heading, present
  only when `intake/` exists) does not depend on order, and both orderings
  satisfy it.
- **5** — both deletes proceeded in every rep; missing `intake/` on beta was
  never treated as a blocker.

**Control — `thejudge-cleanup` removed, run once (not three reps; the
control checks default behavior, not convergence).** A generic agent still
improvised ad hoc cleanup logic (receipts written, board rows stripped,
folders deleted) but produced **no** `## Intake` section in either receipt —
confirms the behavior is not something a control invents by default; the
guidance in slice G is load-bearing.

**Variance — one shared observation, not a defect:** one rep (rep 3) noted
that the `Skill` tool's inline render of `thejudge-cleanup/SKILL.md` was
stale — missing the `## Intake` writes-line and `### Intake in the receipt`
subsection — almost certainly because the `Skill` tool resolves against the
harness's fixed project directory rather than the rig clone the rep was
told to operate in. The rep caught this itself, read the raw file at the
correct path directly, and applied the current instructions correctly
anyway. This is a rig/environment limitation, not a skill defect — a real
launch does not have this mismatch, since the harness's project directory
and the working checkout are the same place.

The rig's after-snapshot passed for every rep before these results were
written.
