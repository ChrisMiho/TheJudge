# Slice E — Strict grading revision

## Status: planned

## Goal

The grader no longer gives top marks to an answer that reaches the right
outcome but carries a real side error a player could act on, so arm A and arm R
are judged by the same stricter rule.

## Requirements

1. Correctness level 2 in `apps/backend/src/eval/answer-quality/rubric.ts` excludes a material error a player could act on (wording as in the accepted REQ-187 block, G5).
2. `RUBRIC_REVISION` moves to a new date-stamped revision; the comment at brief row 61 names it.
3. Rubric and artifact tests follow (rows 79, 100): a new test beside the existing revision test.
4. Apply the accepted REQ-187 block in `PRD/sections/functional-requirements.md`.
5. The judge reads the rubric text, so no `judge.ts` edit is expected; confirm by test.

## Acceptance criteria

- [ ] Level 2 text matches the accepted REQ-187 wording
- [ ] `RUBRIC_REVISION` is a new value and a test pins it
- [ ] The judge prompt contains the new level-2 text (test)
- [ ] Artifact comparison across the old and new revisions is refused (test updated)
- [ ] `npm --workspace apps/backend run test -- src/eval/answer-quality` passes
- [ ] The REQ-187 block is applied

## Verification

```bash
npm --workspace apps/backend run test -- src/eval/answer-quality
npm --workspace apps/backend run typecheck
```

## Files touched

- `apps/backend/src/eval/answer-quality/rubric.ts`, `rubric.test.ts`, `artifact.test.ts`
- `PRD/sections/functional-requirements.md` (REQ-187)
