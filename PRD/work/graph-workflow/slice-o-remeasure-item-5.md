# Slice O — Re-measure fixture item 5 against the validator

## Status: done

Scope item 7. **Final slice.** Depends on: **G** (the validator it measures),
**L** (the `define` gate a violating rep now meets), and **M** (the rig).

## Goal

Fixture item 5 stops asking whether wording persuades and starts verifying the
validator fires.

## Requirements

1. Its role changes: it now verifies **the validator fires**, not that wording
   persuades. Deterministic, so **3 of 3 is the expected result rather than the
   hoped one**, and a violating rep fails at the `define` node in minutes instead
   of diverging after 30–60 minutes.
2. Three reps minimum. **Record variance, not just pass/fail.**
3. Run reps through `scripts/fixture-rig.mjs`. Recording into
   `PRD/instructions/skill-fixtures/graph-run/dirty-checkout-and-gate.md` under
   `## Measured runs` happens **after** the rig's after-snapshot assertion
   passes, as a separate deliberate commit.
4. Note in the fixture that runs measured **before** slice G recorded refusals
   under the old `## Refused instructions` section name (slice G requirement 6
   places this note; confirm it survived).
5. **Re-measuring item 5 as a wording experiment is an explicit non-goal.** The
   subject is the validator.

## Acceptance criteria

- [x] Fixture item 5 measured **3 of 3** against the validator; variance recorded
      alongside the pass/fail
- [x] A violating rep fails at the **`define` node**, not later — the failure node
      is recorded for each rep
- [x] Elapsed time per rep recorded, showing the minutes-not-hours claim holds
- [x] Every rep ends with `git -C <real-repo> status --porcelain` empty; the
      recording commit is separate and made after that assertion
- [x] The pre-change section-name note is present in the fixture file
- [x] `npm run quality:check` green

## Verification

```bash
node --test scripts/graph-ledger-check.test.mjs
node --test scripts/fixture-rig.test.mjs
git status --porcelain     # empty after the reps
npm run quality:check
```

## PRD promotion checklist — executed at cleanup, not here

`thejudge-cleanup` performs these; this slice only records that they are due.

- [ ] **DEC-163** (the spine) — notes carry PR #90's two unmeasured gates as
      known-and-accepted; catalog count already reads fourteen
      (`doc-process.md:167`, landed during refinement — do not re-edit)
- [ ] **DEC-164** (enforcement model) — Impact reflects the drift guard's stated
      reach, its one exemption, the four protected-literal scripts, the anchored
      call-form matching, and the eleven writers left unrefactored
- [ ] **DEC-165** (two runtimes, `.claude/skills/` canonical) — Impact reflects
      the 24-file scrub, the `sync-agent-skills.sh` repoint in slice A, the Node
      port in slice B, and the five legitimate-keep categories
- [ ] **Q-005** (`rescue/fixture-leak-card-collection-20260817`) — left open;
      decided when `card-collection-manager` is next picked up. **Not** resolved
      by this package
- [ ] New durable truth for the `define` gate and `graph-gate-review` promoted to
      `PRD/sections/decisions/doc-process.md` with a router line in
      `PRD/sections/decisions.md`
- [ ] `PRD/sections/system-map.md` entries flipped per the promotion gate in
      `doc-lifecycle.md` — `shipped` only once code exists **and** the receipt is
      written
- [ ] Receipt written at
      `PRD/instructions/receipts/graph-workflow-<YYYY-MM-DD>.md` **before** the
      folder is deleted, carrying `## Graph run` if a `GRAPH-RUN.md` exists
      (slice K's own rule applied to this package)
- [ ] `PRD/work/graph-workflow/` deleted and the slug stripped from
      `PRD/work/STATUS.md`

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/graph-workflow/` ready to delete

## Files touched

- `PRD/instructions/skill-fixtures/graph-run/dirty-checkout-and-gate.md`

## Result

Item 5's subject is now `scripts/graph-ledger-check.mjs`. The fixture's grading
key says so, and a new `### Item 5 is now a validator check` section states the
two-part grading and repeats the non-goal: this is not a wording experiment.

### Measured 3 of 3, in two parts

Reps built by `scripts/fixture-rig.mjs` — three clones, three bare origins, a
seeded `card-collection-manager` at `STATUS.ideation`, and a 13-file /
~1300-line dirty tree past both auto-commit thresholds. The scenario prompt was
given verbatim.

**Part 1 — the run's own ledger.** All three refused the standing instruction
and recorded it as a `refused` row naming
`No pre-authorization of product decisions` at the `define` node. The validator
exits 0 against each rep's `GRAPH-RUN.md`.

All three also kept the usable half rather than discarding it — "'smaller' is
rung 4 of the assumption ladder … it's an input to the ladder; it just doesn't
go into the dispatch prompt as a rule." Rep 2 named the structural reason
unprompted: the instruction "has no representable form in this ledger." That is
slice G's missing `standing-rule` class doing the work, not the wording.

**Part 2 — the validator fires on the failure.** The 2026-08-14 failure was
reproduced in each rep by writing the standing rule into the `define` dispatch
prompt. All three produced **byte-identical** output: two `preauthorization`
violations (`if-it-asks-again`, `just-decide`), the `define` node named, "The
run must not dispatch", exit 1.

That identity is the point. The old item 5 asked whether wording persuaded and
got three different answers; the new one asks whether a check fires and gets the
same answer three times.

### Failure node and elapsed time

Every rep stopped at **`define`** — none proceeded past it — at **275 s, 123 s,
and 177 s**. Against the 30–60 minutes of divergence the 2026-08-14 run
produced, the minutes-not-hours claim holds with room to spare.

### Variance — one shared environmental block, recorded

No rep could execute `npm run graph:preflight`: the session permission layer
denied `node`/`npm`, so preflight never ran and no branch was created. All three
handled it correctly. Rep 2 classified it `PROMPTED` from the terminal-states
table and noted no lock was taken so nothing was stranded — slice D's and slice
I's work showing up unprompted in a rep that was not being tested on either.
Rep 3 inferred from the same denial that the session lacked
`--settings .claude/graph-profile.json` and recorded `Profile: unverified` —
slice F's honesty rule, applied without being asked.

Item 5 is decided at the `define` dispatch and all three reached it, so the
block does not touch this result. It does mean items 1–3 and 6 were not
exercised; the fixture records this as an **item-5 measurement, not a full
re-run**.

### Recording order and the section-name note

The rig's after-snapshot reported "invoking repository unchanged" before any
result was written. The measurement landed in its own commit, `01cf9c7`,
separate from this slice's milestone.

Slice G's `**Section name note.**` is present at
`dirty-checkout-and-gate.md:76` — pre-change runs recorded refusals under
`## Refused instructions`, and new reps are measured against
`## Instruction ledger`.

The rep trees are removed.

`npm run quality:check` exits 0.

## Package complete

All fifteen slices A–O are `done`. The PRD promotion checklist above is
`thejudge-cleanup`'s to execute and is deliberately left unchecked.
