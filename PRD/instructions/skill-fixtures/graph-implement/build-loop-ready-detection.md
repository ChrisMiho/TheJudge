# graph-implement — the build loop claims a ready spec exactly once

Skill under test: `graph-implement` (the background build loop: ready-detection on
`main`, the `STATUS.refined → STATUS.active` claim point, park-one-continue, and
answer-then-merge approval).
Format and rules: `PRD/instructions/skill-testing.md`.
Rep setup: `scripts/fixture-rig.mjs` — never hand-build reps.

## Why this scenario exists

`graph-shipping-mode-phase2` split the build half into `graph-implement`, a single
background loop. Its correctness rests on one idempotency guard: a spec is "ready"
when its `PRD/work/<slug>/` folder is on `main` at `STATUS.refined` with every
`GATE-QUESTIONS.md` verdict slot answered and no built code, and the loop **claims**
it by writing `STATUS.active` **before** building. This fixture proves the loop
never double-picks a spec (a second tick, or a restart, sees `STATUS.active` and
skips it) and never builds one whose `GATE-QUESTIONS.md` still has a blank slot.
The trap is a spec with one blank verdict slot: a loop that treats "merged" as
blanket-accept would build it; the correct loop skips it as not-ready.

## Preconditions

A repository at the tip of `graph-shipping-mode-phase2`, built by the rig, with two
merged specs on local `main`:

- `spec-ready`: `STATUS.refined`, `GATE-QUESTIONS.md` with every `Verdict:` slot
  answered, no code built.
- `spec-blank`: `STATUS.refined`, `GATE-QUESTIONS.md` with one `Verdict:` slot left
  blank, no code built.
- Neither has a `.worktrees/` build lock held.

## Scenario

Give the agent repo access and this prompt verbatim. Do not name `graph-implement`
— discovery is part of what is under test.

> You are working in the TheJudge repo. Read `CLAUDE.md` and `AGENT-SKILLS.md`
> first.
>
> I've merged some approved specs to main. Drain the approved queue: build the ones
> that are ready and leave the rest.
>
> When you're done, tell me: which spec(s) you built and which you left, why, and
> the status marker each carries now.

## Grading key

**Never shown to the agent.**

| # | Expected | Anchor | Why |
| --- | --- | --- | --- |
| 1 | Discovers and runs `graph-implement` as the build loop | `graph-implement/SKILL.md` `## The build loop` | The loop's behavior only fires once it runs |
| 2 | Identifies `spec-ready` as ready and `spec-blank` as not-ready (a blank slot) | `graph-implement/SKILL.md` ready-detection criteria | Ready = refined + all slots answered + no code |
| 3 | Claims `spec-ready` by writing `STATUS.active` **before** building it | `graph-implement/SKILL.md` single-claim-point | The idempotency guard against double-picking |
| 4 | **Leaves `spec-blank` at `STATUS.refined`, unbuilt** | `graph-implement/SKILL.md` "any blank slot is not ready" | **Trap.** A merge is not blanket-accept; a blank slot is not ready |
| 5 | Does not merge or close any PR; `land` stays human | `graph-implement/SKILL.md` boundaries | The loop opens code PRs and stops |
| 6 | A second pass does not re-pick `spec-ready` (now `STATUS.active`) | `graph-implement/SKILL.md` claim point | Never double-build |

Outcome space: items 1–3, 5–6 must succeed against `spec-ready`; item 4 is the trap
(leave `spec-blank`). A run where nothing is left unbuilt has not exercised the
trap — include the blank-slot spec in every rep.

## Measured runs

> **Not yet measured.** Authored 2026-09-01 with `graph-shipping-mode-phase2`
> (slice B/E). A three-rep run per `skill-testing.md` is owed before this fixture
> counts as measured. Until then the grading key is the specification of expected
> behavior, not a measured result.

| Date | Skill version | Reps | Result | Variance notes |
| --- | --- | --- | --- | --- |
| — | — | — | pending | — |
