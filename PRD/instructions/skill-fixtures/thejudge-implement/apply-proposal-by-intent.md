# thejudge-implement — applies the proposal to `PRD/sections/` by intent, with the code

Skill under test: `thejudge-implement` (and `thejudge-implement-all` by the same
apply rule). The slice that carries the proposal writes the durable
`PRD/sections/` truth **by intent** from the approved `GATE-QUESTIONS.md` diff and
`DESIGN-BRIEF.md`, against *current* truth, committed together with the code.
Format and rules: `PRD/instructions/skill-testing.md`.
Rep setup: `scripts/fixture-rig.mjs` — never hand-build reps.

## Why this scenario exists

`graph-shipping-mode-phase1` made implementation the one place durable product
truth is written. Refinement proposed a `PRD/sections/` edit in
`GATE-QUESTIONS.md` and wrote nothing to `PRD/sections/`; the slice that realizes
that behavior must apply it. Two failures this guards against:

- **Blind replay.** The proposed diff was frozen at `define`. If the current
  feature spec has moved since (a neighbouring `REQ` renumbered, a section
  rewritten), replaying the frozen patch line-for-line corrupts the file. The
  skill must re-derive the edit by intent against *current* truth.
- **Applying a `reject`ed id.** A rejected block was removed from the proposal and
  its number burned. A slice that writes it anyway reintroduces truth the owner
  refused. The trap seeds one rejected id whose diff is still legible in the
  finalized proposal's `## Gate verdicts` history.

## Preconditions

A repository built by the rig, with an `active` package whose GAMEPLAN assigns the
proposal-apply to a specific slice (say slice B):

- `GATE-QUESTIONS.md` finalized by `graph-gate-review`: two `accept`/`edit` ids
  with complete proposed `PRD/sections/` diffs, and one `reject`ed id recorded in
  `## Gate verdicts`.
- `PRD/sections/` **as it stands today** — deliberately drifted from the frozen
  diff in one accepted id (an adjacent line changed since `define`), so a blind
  replay would misapply and an intent re-derivation would not.
- `PRD/work/<slug>/DESIGN-BRIEF.md` stating the intent.
- Slice B `planned`, its dependencies `done`.

## Scenario

Give the agent repo access and this prompt verbatim. Do not name
`thejudge-implement` — discovery is part of what is under test.

> You are working in the TheJudge repo. Read `CLAUDE.md` and `AGENT-SKILLS.md`
> first.
>
> The `<slug>` package is mapped out and my answers to its questions are already
> applied. Build slice B — the code and whatever product docs it's supposed to
> land — and stop there.
>
> When you're done tell me: which `PRD/sections/` files changed and why, and
> whether the commit carries the code and those doc edits together.

## Grading key

**Never shown to the agent.**

| # | Expected | Anchor | Why |
| --- | --- | --- | --- |
| 1 | Discovers and runs `thejudge-implement` on slice B | `thejudge-implement/SKILL.md` `## Inputs` | The apply behavior only fires once it runs |
| 2 | Reads the approved `GATE-QUESTIONS.md` and `DESIGN-BRIEF.md` before writing `PRD/sections/` | `thejudge-implement/SKILL.md` `## Reads` item 8 | The proposal is the source for apply |
| 3 | Writes the accepted/edited ids into `PRD/sections/`, **re-derived by intent against current truth** — the drifted accepted id lands correctly, not as a blind replay of the frozen diff | `thejudge-implement/SKILL.md` `## Writes` ("derived by intent … never a blind replay") | **Trap 1.** Blind replay would misapply the drifted id |
| 4 | **Does not** write the `reject`ed id; its number stays burned | `thejudge-implement/SKILL.md` `## Writes` / `## Gates` (a `reject`ed id is not applied) | **Trap 2.** Applying it reintroduces refused truth |
| 5 | Commits the `PRD/sections/` edits **together with** the slice's code — one milestone, not a docs-only or code-only commit | `thejudge-implement/SKILL.md` `## Goal` / `## Writes` ("together with the code") | The spec-ahead-of-code window is what this closes |
| 6 | Applies the proposal **exactly once** — does not re-write truth an earlier slice already applied | `thejudge-implement/SKILL.md` `## Gates` ("never re-apply what an earlier slice already did") | Double-application is the missed/double-promotion hazard |

Outcome space: items 1–3, 5, 6 must succeed; item 4 must refuse (no rejected id).
A run where nothing refuses has not been tested.

## Measured runs

> **Not yet measured.** Authored 2026-09-01 with the `graph-shipping-mode-phase1`
> propose/apply rework (slice C). A three-rep run per `skill-testing.md` is owed
> before this fixture counts as measured. Until then the grading key is the
> specification of expected behavior, not a measured result.

| Date | Skill version | Reps | Result | Variance notes |
| --- | --- | --- | --- | --- |
| — | — | — | pending | — |
