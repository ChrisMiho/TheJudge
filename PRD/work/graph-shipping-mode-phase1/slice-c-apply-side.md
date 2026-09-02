# Slice C — Apply side (implement applies truth + code; cleanup promotes once)

## Status: done

## Goal
Make implementation write the durable `PRD/sections/` truth (by intent) alongside
the code in one PR, and reconcile cleanup so promotion happens exactly once.

## Requirements
1. `thejudge-implement-all` and `thejudge-implement`: the apply step reads the
   approved `GATE-QUESTIONS.md` diff + `DESIGN-BRIEF.md` intent and writes the real
   `PRD/sections/` edits **by intent against current truth** (re-derive; do not
   blind-replay a frozen patch), together with the code, in the slice's PR.
2. `thejudge-cleanup`: promotion of durable truth now happens at apply/close only —
   remove any assumption that refinement already wrote `PRD/sections/`; ensure no
   double-promotion and no missed promotion.
3. Update the implement and cleanup skill fixtures to the new behaviour.
4. Mirror to `.agents/skills/` via `skills:ai-sync` (verified in slice D).

## Acceptance criteria
- [x] C1 `thejudge-implement-all`/`thejudge-implement` apply durable `PRD/sections/`
  truth by intent + code together, sourced from the approved proposal.
- [x] C2 `thejudge-cleanup` promotes durable truth exactly once (at apply/close),
  with no step assuming refinement pre-wrote `PRD/sections/`.
- [x] C3 New `thejudge-implement` (apply-by-intent) and `thejudge-cleanup`
  (promote-once) fixtures authored per `PRD/instructions/skill-testing.md`;
  measured re-runs owed (marked pending in each file — fixture runs are a
  deliberate pre-merge check, not part of `test:scripts`).
- [x] C4 `npm run test:scripts` green (432/432).

## Verification
```bash
grep -n "PRD/sections\|by intent\|GATE-QUESTIONS" .claude/skills/thejudge-implement-all/SKILL.md
grep -n "PRD/sections\|promote" .claude/skills/thejudge-cleanup/SKILL.md
npm run test:scripts
```

## Files touched
- `.claude/skills/thejudge-implement-all/SKILL.md`
- `.claude/skills/thejudge-implement/SKILL.md`
- `.claude/skills/thejudge-cleanup/SKILL.md`
- `PRD/instructions/skill-fixtures/` (implement, cleanup scenarios)
