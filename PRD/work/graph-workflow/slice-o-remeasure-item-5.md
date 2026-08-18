# Slice O — Re-measure fixture item 5 against the validator

## Status: planned

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

- [ ] Fixture item 5 measured **3 of 3** against the validator; variance recorded
      alongside the pass/fail
- [ ] A violating rep fails at the **`define` node**, not later — the failure node
      is recorded for each rep
- [ ] Elapsed time per rep recorded, showing the minutes-not-hours claim holds
- [ ] Every rep ends with `git -C <real-repo> status --porcelain` empty; the
      recording commit is separate and made after that assertion
- [ ] The pre-change section-name note is present in the fixture file
- [ ] `npm run quality:check` green

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

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/graph-workflow/` ready to delete

## Files touched

- `PRD/instructions/skill-fixtures/graph-run/dirty-checkout-and-gate.md`
