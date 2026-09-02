# graph-gate-review — verdicts finalize the proposal, and never touch `PRD/sections/`

Skill under test: `graph-gate-review` (reads the owner's answered
`GATE-QUESTIONS.md`, applies accept/edit/reject verdicts **inside the proposal**,
and leaves `PRD/sections/` untouched — implementation applies the finalized
proposal at `build`).
Format and rules: `PRD/instructions/skill-testing.md`.
Rep setup: `scripts/fixture-rig.mjs` — never hand-build reps.

## Why this scenario exists

`graph-shipping-mode-phase1` moved durable writing out of the spec-forming half:
refinement *proposes* product truth in `GATE-QUESTIONS.md` and implementation
*applies* it. The old `graph-gate-review` applied verdicts by editing
`PRD/sections/` directly. This fixture proves the reworked skill finalizes the
proposal **in `GATE-QUESTIONS.md`** — accept leaves the proposed diff, edit
rewrites it in place, reject removes that id's block entirely (burning the number)
— and writes **nothing** to `PRD/sections/`. The trap is a `reject`: a skill that
still carries the old behavior would try to revert a section file that refinement
never wrote, which is the exact regression this package removes.

## Preconditions

A repository at the tip of `graph-shipping-mode-phase1`, built by the rig, with a
work package parked at an answered `define` gate:

- `STATUS.owner-action` marker on the package; its board row under
  `## owner-action` in `PRD/work/STATUS.md`.
- `GRAPH-RUN.md` with a `## Open gate` recording the parked `define` gate and
  `/graph-implement PRD/work/<slug>/` as the resume command.
- `GATE-QUESTIONS.md` carrying three `## <STABLE-ID>` blocks (e.g. `REQ-201`,
  `REQ-202`, `FLOW-045`), each with the gate-question plain-language block, that
  id's complete proposed `PRD/sections/` diff, and a filled `Verdict:` slot —
  one `accept`, one `edit` (with `Reason:`), one `reject` (with `Reason:`).
- `PRD/sections/` contains **no** edit from this package — refinement proposed
  only; nothing was applied.

## Scenario

Give the agent repo access and this prompt verbatim. Do not name
`graph-gate-review` — discovery is part of what is under test.

> You are working in the TheJudge repo. Read `CLAUDE.md` and `AGENT-SKILLS.md`
> first.
>
> I've finished answering the questions for the `<slug>` work package — the
> answers are in the file the run left me. Take my answers and get the run ready
> to resume.
>
> When you're done, tell me: which files you changed to apply my answers, whether
> anything under `PRD/sections/` changed, and the command I run to continue.

## Grading key

**Never shown to the agent.**

| # | Expected | Anchor | Why |
| --- | --- | --- | --- |
| 1 | Discovers and runs `graph-gate-review` against the answered `GATE-QUESTIONS.md` | `graph-gate-review/SKILL.md` `## Inputs` | The verdict-applier's behavior only fires once it runs |
| 2 | `accept` id: proposed diff in `GATE-QUESTIONS.md` is left as refinement wrote it | `graph-gate-review/SKILL.md` Verdicts table | Accept is a no-op on the proposal |
| 3 | `edit` id: the owner's `Reason:` correction is applied **inside that id's proposed diff in `GATE-QUESTIONS.md`** | `graph-gate-review/SKILL.md` Procedure step 3 | Edit rewrites the proposal in place |
| 4 | `reject` id: that id's proposed diff is **removed from the proposal**; the number is not reissued | `graph-gate-review/SKILL.md` Verdicts table (`reject` burns the number) | Reject drops the block from the proposal |
| 5 | **Writes nothing to `PRD/sections/`.** No section file is edited, created, or reverted by this skill | `graph-gate-review/SKILL.md` `## Boundaries` ("Never edit `PRD/sections/` at all") | **Trap.** The old skill reverted a rejected id out of `PRD/sections/`; here refinement wrote no section file, so any `PRD/sections/` write is the regression |
| 6 | Records `## Gate verdicts`, resolves `## Open gate`, restores `STATUS.refined`, and hands back `/graph-implement PRD/work/<slug>/` | `graph-gate-review/SKILL.md` `## Writes` / `## Next step` | The run must be able to resume at `gate-qc` |
| 7 | Refuses if any `Verdict:` slot is blank or malformed, naming the offending ids | `graph-gate-review/SKILL.md` "Refuse an unanswered file" | An unanswered gate cannot resume |

Outcome space: items 1–6 must succeed against a fully-answered file; item 5 is the
trap (no `PRD/sections/` write); item 7 must refuse against a variant with one
blank slot. A run where nothing refuses has not been tested — include the
one-blank-slot variant as a second rep input.

## Measured runs

> **Not yet measured.** Authored 2026-09-01 with the `graph-shipping-mode-phase1`
> propose/apply rework (slice B). A three-rep run per `skill-testing.md` — plus
> the one-blank-slot refusal variant for item 7 — is owed before this fixture
> counts as measured. Until then the grading key is the specification of expected
> behavior, not a measured result.

| Date | Skill version | Reps | Result | Variance notes |
| --- | --- | --- | --- | --- |
| — | — | — | pending | — |
