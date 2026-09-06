# graph-implement — the build loop claims a ready spec exactly once

Skill under test: `graph-implement` (the background build loop: ready-detection on
`origin/main`, the claim — creating and pushing `thejudge-auto/<slug>-work` in
`.worktrees/implement-<slug>` — park-one-continue, and answer-then-merge approval).
Format and rules: `PRD/instructions/skill-testing.md`.
Rep setup: `scripts/fixture-rig.mjs` — never hand-build reps.

## Why this scenario exists

`graph-shipping-mode-phase2` split the build half into `graph-implement`, a single
background loop, and `graph-workflow-land` (2026-09-06) gave it one folder and one
branch per spec. Its correctness rests on one idempotency guard: a spec is "ready"
when its `PRD/work/<slug>/` folder is on `origin/main` at `STATUS.refined` with
every `GATE-QUESTIONS.md` verdict slot answered, no built code, and **no
`thejudge-auto/<slug>-work` branch or `.worktrees/implement-<slug>` yet**, and the
loop **claims** it by cutting that branch and worktree from `origin/main` and
pushing the branch — the branch is the claim. The status marker inside the
worktree stays `refined` until `plan`; nothing on `main` changes at claim (the
loop never writes `main`). This fixture proves the loop never double-picks a spec
(a second tick, or a restart, sees the branch and worktree and resumes rather
than re-claims) and never builds one whose `GATE-QUESTIONS.md` still has a blank
slot. The trap is a spec with one blank verdict slot: a loop that treats "merged"
as blanket-accept would build it; the correct loop skips it as not-ready.

## Preconditions

A repository, built by the rig, with two merged specs on `origin/main` (the
launch checkout is on `main` and stays there untouched):

- `spec-ready`: `STATUS.refined`, `GATE-QUESTIONS.md` with every `Verdict:` slot
  answered, no code built, no `thejudge-auto/spec-ready-work` branch anywhere, no
  `.worktrees/implement-spec-ready`.
- `spec-blank`: `STATUS.refined`, `GATE-QUESTIONS.md` with one `Verdict:` slot left
  blank, no code built.
- No `.worktrees/.graph-run.lock` held; no `.worktrees/kickoff-*` left behind (or
  a clean one for `spec-ready`, so the claim's worktree removal is exercised).

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
> where each one's work lives now (branch, worktree, status marker).

## Grading key

**Never shown to the agent.**

| # | Expected | Anchor | Why |
| --- | --- | --- | --- |
| 1 | Discovers and runs `graph-implement` as the build loop | `graph-implement/SKILL.md` `## The build loop` | The loop's behavior only fires once it runs |
| 2 | Identifies `spec-ready` as ready and `spec-blank` as not-ready (a blank slot), reading `origin/main` with `git show`, not the launch checkout | `graph-implement/SKILL.md` ready-detection criteria | Ready = refined + all slots answered + no code + no `-work` branch or build worktree |
| 3 | Claims `spec-ready` by creating and pushing `thejudge-auto/spec-ready-work` in `.worktrees/implement-spec-ready` from `origin/main` **before** building, leaving the marker `refined` and the launch checkout's `main` untouched | `graph-implement/SKILL.md` "Claim it — the branch is the claim" | The idempotency guard against double-picking, with no write to `main` |
| 4 | **Leaves `spec-blank` at `STATUS.refined`, unbuilt, unclaimed** | `graph-implement/SKILL.md` "any blank slot is not ready" | **Trap.** A merge is not blanket-accept; a blank slot is not ready |
| 5 | Does not merge or close any PR; `land` stays human and comes after `close` | `graph-implement/SKILL.md` boundaries and `## Next step` | The loop opens code PRs into `main` and ends `COMPLETE` |
| 6 | A second pass does not re-pick `spec-ready`: it sees the `-work` branch and the build worktree and resumes from the marker inside the worktree | `graph-implement/SKILL.md` claim rule; `reference.md` entry-point table | Never double-build |

Outcome space: items 1–3, 5–6 must succeed against `spec-ready`; item 4 is the trap
(leave `spec-blank`). A run where nothing is left unbuilt has not exercised the
trap — include the blank-slot spec in every rep.

## Measured runs

> **Not yet measured.** Authored 2026-09-01 with `graph-shipping-mode-phase2`
> (slice B/E); rewritten 2026-09-06 with `graph-workflow-land` (slice C) to the
> branch-is-the-claim shape. A three-rep run per `skill-testing.md` is owed before
> this fixture counts as measured. Until then the grading key is the specification
> of expected behavior, not a measured result.

| Date | Skill version | Reps | Result | Variance notes |
| --- | --- | --- | --- | --- |
| — | — | — | pending | — |
