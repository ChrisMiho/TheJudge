# thejudge-cleanup — durable truth is confirmed, not re-written, at close

Skill under test: `thejudge-cleanup` (confirms the durable `PRD/sections/` truth
implementation applied at `build` is present, promotes only what `build` left
unapplied, and never assumes refinement pre-wrote `PRD/sections/` or writes a
second copy of what is already there).
Format and rules: `PRD/instructions/skill-testing.md`.
Rep setup: `scripts/fixture-rig.mjs` — never hand-build reps.
Gate path exercised: the **merged path** (the implementation PR merged into the
recorded base; the pre-merge PR-ready path is graded in
`close-inside-the-code-pr.md`).

## Why this scenario exists

Before `graph-shipping-mode-phase1`, refinement wrote `PRD/sections/` up front and
cleanup promoted the durable docs at close — two writers, and a window where the
spec led the code. The rework makes implementation (`build`) the single writer,
applied together with the code. Cleanup's job flips from *promote* to *confirm*.
Two failures this guards against:

- **Double-promotion.** Cleanup re-writing truth `build` already applied produces
  a duplicate `REQ`/`FLOW` entry or a conflicting edit. The trap: the durable
  truth is already in `PRD/sections/` when cleanup runs.
- **Assuming refinement pre-wrote it.** A cleanup that looks for refinement's
  `PRD/sections/` edit and, not finding an *unapplied* one, concludes nothing
  shipped — or re-derives from the proposal and writes a second copy.

## Preconditions

A repository built by the rig with a `ship-ready` package whose implementation
merged:

- The approved `GATE-QUESTIONS.md` proposal in the work folder, and its durable
  `PRD/sections/` edit **already present** in the feature spec (applied at `build`,
  on the merged branch the cleanup checkout contains).
- `## Autonomous metadata` recording the base; the implementation PR merged into
  it (satisfying the merge-proof gate).
- No `GRAPH-RUN.md`-vs-receipt mismatch beyond what this scenario tests.

## Scenario

Give the agent repo access and this prompt verbatim. Do not name
`thejudge-cleanup` — discovery is part of what is under test.

> You are working in the TheJudge repo. Read `CLAUDE.md` and `AGENT-SKILLS.md`
> first.
>
> The `<slug>` work shipped and merged. Close it out — make sure the durable
> product docs are where they belong, write the receipt, and get the work folder
> out of `PRD/work/`.
>
> When you're done tell me: which `PRD/sections/` files you changed during
> cleanup, and whether the durable truth for this package was already present
> before you started.

## Grading key

**Never shown to the agent.**

| # | Expected | Anchor | Why |
| --- | --- | --- | --- |
| 1 | Discovers and runs `thejudge-cleanup` against the `ship-ready` package | `thejudge-cleanup/SKILL.md` `## Gates` (status gate) | Cleanup behavior only fires once it runs |
| 2 | **Confirms the durable `PRD/sections/` truth is already present** (applied at `build`) rather than treating its absence-as-unapplied as a promotion to do | `thejudge-cleanup/SKILL.md` `## Goal` / `## Writes` ("confirmed present … applied at build") | The single-writer model — build wrote it |
| 3 | **Writes no `PRD/sections/` edit during cleanup** — no duplicate entry, no second copy of truth already there | `thejudge-cleanup/SKILL.md` `## Writes` ("re-writes nothing that build already applied") | **Trap.** Double-promotion is the failure this removes |
| 4 | Does not assume refinement pre-wrote `PRD/sections/`; reasons from what `build` applied | `thejudge-cleanup/SKILL.md` `## Goal` ("never assumes refinement pre-wrote") | The old assumption is retired |
| 5 | Writes the receipt before delete; flips `system-map.md` to `shipped`; deletes with `git rm -r PRD/work/<slug>/` | `thejudge-cleanup/SKILL.md` `## Writes` / `### Delete mechanism` | Ordinary close-time duties still hold |

Outcome space: items 1, 2, 4, 5 must succeed; item 3 is the refusal (no cleanup
`PRD/sections/` write). Include a control variant where `build` genuinely left one
outcome unapplied — there cleanup must promote that one, exactly once — so the
fixture also proves cleanup still promotes a real gap rather than never writing.

## Measured runs

> **Not yet measured.** Authored 2026-09-01 with the `graph-shipping-mode-phase1`
> propose/apply rework (slice C). A three-rep run per `skill-testing.md` — plus
> the unapplied-gap control variant for the promote-a-real-gap half — is owed
> before this fixture counts as measured. Until then the grading key is the
> specification of expected behavior, not a measured result.

| Date | Skill version | Reps | Result | Variance notes |
| --- | --- | --- | --- | --- |
| — | — | — | pending | — |
