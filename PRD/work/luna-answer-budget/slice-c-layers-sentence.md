# Slice C — Layers sentence correction and prompt goldens

## Status: planned

## Goal

Every prompt tells the AI the true layers/state-based-actions rule, and the 31 prompt goldens change by that sentence only.

## Requirements

1. `apps/backend/src/prompt/mtgReference.ts:20`: replace 'Continuous effects and state-based actions use a layer system.' with exactly: 'Continuous effects use a layer system (rule 613); state-based actions are not part of it and are checked separately whenever a player would receive priority (rule 704).' (owner-approved 2026-10-08, source `apps/backend/src/eval/answer-quality/arm-p-correction.json`).
2. Regenerate the prompt goldens under `apps/backend/src/eval/fixtures/*.prompt.golden.txt` (31 files, brief rows 174-191, 236-243, 316-322) with `UPDATE_CONTEXT_EVAL_FIXTURES=1` on the context evaluation harness test, then run it again without the flag. Inspect `git diff` of the goldens: every changed line must be the layers sentence line (line 30 or 32 of each file); any other diff is a defect to fix, not accept.
3. Apply by intent the REQ-230 note in `PRD/work/luna-answer-budget/GATE-QUESTIONS.md` (appended after the last note in `### REQ-230`): the correction became production text, how it is judged, and that arm P now refuses to run because its sentence no longer appears. Arm P itself is left as is.
4. Mock behaviour and mock goldens do not change; no live call.

## Acceptance criteria

- [ ] C1: mtgReference.ts carries the owner-approved corrected sentence verbatim and the old sentence appears nowhere under apps/
- [ ] C2: The 31 prompt goldens are regenerated and the context evaluation harness passes without the update flag
- [ ] C3: git diff of the prompt goldens shows exactly 31 files, each changed only on the layers sentence line (counts of added and removed lines equal per file, no other hunk)
- [ ] C4: Backend typecheck and test pass; mock goldens are unchanged
- [ ] C5: PRD/sections REQ-230 carries the accepted appended note and nothing else in that requirement changed
- [ ] C6 (manual): A reader confirms one golden diff end to end shows only the single-sentence change

Every deliverable lives outside `PRD/work/` (node 8 deletes the package). No criterion needs a paid run, live provider call or aws command.

## Verification

```bash
UPDATE_CONTEXT_EVAL_FIXTURES=1 npm --workspace apps/backend run test:eval
npm --workspace apps/backend run test:eval
git diff --stat -- apps/backend/src/eval/fixtures
git diff --numstat -- apps/backend/src/eval/fixtures
```

## Files touched

- `apps/backend/src/prompt/mtgReference.ts`
- `apps/backend/src/eval/fixtures/*.prompt.golden.txt (31 files)`
- `PRD/sections/functional-requirements.md`
