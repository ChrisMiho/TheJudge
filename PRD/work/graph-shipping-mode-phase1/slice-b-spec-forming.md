# Slice B — Spec-forming side (refinement proposes; gate reads the proposal)

## Status: done

## Goal
Make refinement write proposals to the work folder only, and make the gate decide
from the proposal instead of a live `PRD/sections/` diff.

## Requirements
1. `thejudge-refinement` (canonical `.claude/skills/`): its `## Writes` and gates
   stop instructing durable `PRD/sections/` edits during define. Instead it records
   the proposed product-truth changes as the exact diff in `GATE-QUESTIONS.md`
   (per stable id) and the intent in `DESIGN-BRIEF.md`. New stable ids are still
   *named/reserved* in the proposal but not written into live section files.
2. `graph-run`'s post-`define` step: replace "diff `PRD/sections/`" with "is there
   a proposed product-truth change in `GATE-QUESTIONS.md`?" as the gate trigger.
3. `graph-gate-review`: apply accept/edit/reject verdicts to the proposed diff
   inside `GATE-QUESTIONS.md` (finalize the proposal), not to live `PRD/sections/`.
4. Update the refinement and gate skill fixtures to the new behaviour.
5. Mirror to `.agents/skills/` via `skills:ai-sync` (verified in slice D).

## Acceptance criteria
- [x] B1 `thejudge-refinement` no longer instructs writing durable `PRD/sections/`
  during define; it records the proposed diff in `GATE-QUESTIONS.md`.
- [x] B2 `graph-run`'s gate trigger reads `GATE-QUESTIONS.md` presence/contents,
  not a live `PRD/sections/` diff. (Done by the prior graph-profile session; verified.)
- [x] B3 `graph-gate-review` finalizes verdicts inside the work-folder proposal,
  not `PRD/sections/`.
- [x] B4 Refinement fixture grading key updated to propose/apply; new
  `graph-gate-review` fixture authored. Measured re-runs owed (marked pending in
  each file) — `skill-testing.md` fixture runs are a deliberate pre-merge check,
  not part of `test:scripts`. `npm run test:scripts` green (432/432).

## Verification
```bash
grep -n "GATE-QUESTIONS\|PRD/sections" .claude/skills/thejudge-refinement/SKILL.md
grep -n "GATE-QUESTIONS\|diff .*PRD/sections" .claude/skills/graph-run/SKILL.md
npm run test:scripts
```

## Files touched
- `.claude/skills/thejudge-refinement/SKILL.md`
- `.claude/skills/graph-run/SKILL.md`
- `.claude/skills/graph-gate-review/SKILL.md`
- `PRD/instructions/skill-fixtures/` (refinement, gate-review scenarios)
