# Slice E — Strict grading revision

## Status: done

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

- [x] Level 2 text matches the accepted REQ-187 wording
- [x] `RUBRIC_REVISION` is a new value and a test pins it
- [x] The judge prompt contains the new level-2 text (test)
- [x] Artifact comparison across the old and new revisions is refused (test updated)
- [x] `npm --workspace apps/backend run test -- src/eval/answer-quality` passes
- [x] The REQ-187 block is applied

## Notes (evidence, re-runnable)

- E1: `rubric.ts` level 2 reads "Reaches the same outcome as the case's approved reference answer, with no material error a player could act on (an invented card or ability, a wrong timing or stack order, or a wrong intermediate rule step)." (the accepted wording).
- E2: `RUBRIC_REVISION` is `2026-10-10.1`; pinned in `rubric.test.ts`.
- E3, E5: `npm --workspace apps/backend run test -- src/eval/answer-quality` -> 4 files, 76 tests passed (the judge prompt test is in `judge.test.ts`); `npm --workspace apps/backend run typecheck` -> clean. No `judge.ts` edit was needed.
- E4: `artifact.test.ts` refuses a per-case comparison across both earlier revisions (`2026-10-06.1`, `2026-10-07.1`) and the current one.
- E6: REQ-187 Correctness line and the new Notes line in `PRD/sections/functional-requirements.md`.

## Verification

```bash
npm --workspace apps/backend run test -- src/eval/answer-quality
npm --workspace apps/backend run typecheck
```

## Files touched

- `apps/backend/src/eval/answer-quality/rubric.ts`, `rubric.test.ts`, `artifact.test.ts`
- `PRD/sections/functional-requirements.md` (REQ-187)
