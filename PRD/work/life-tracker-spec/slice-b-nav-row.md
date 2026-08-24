# Slice B — Add the Section Inventory row and close out

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: planned

## Goal

Add the one `PRD/README.md` Section Inventory row for `sections/life-tracker/`
and prove the whole package's diff stayed inside DEC-168's authorized scope.

## Requirements

1. Add exactly one row to the `## Section Inventory` table in `PRD/README.md`
   for `sections/life-tracker/`, describing it as a derived, non-authoritative
   current-state feature spec (matching DEC-168's Impact block
   characterization) — navigation only, per DEC-168 and
   `PRD/instructions/doc-lifecycle.md`.
2. Do not touch the `## Instruction Inventory` table or any other row in
   `PRD/README.md`.
3. Confirm the full package diff (slice A + slice B) touches only
   `PRD/sections/life-tracker/README.md` (new) and `PRD/README.md` (one row
   added) — no `apps/` change, no edit to any existing `DEC`, `REQ`, `FLOW`,
   or `NFR` body, no edit to `open-questions.md`.
4. This package writes its durable deliverable directly to `PRD/sections/`
   and `PRD/README.md` — there is no further durable-truth promotion for
   `thejudge-cleanup` to perform beyond what slices A and B already wrote.

## Acceptance criteria

- [ ] B1 — `PRD/README.md` has exactly one new Section Inventory row, for
      `sections/life-tracker/`.
- [ ] B2 — The new row's description states the spec is a derived,
      non-authoritative current-state view.
- [ ] B3 — No other Section Inventory or Instruction Inventory row is added,
      removed, or reordered.
- [ ] B4 — The full package diff (`git diff` against the autonomous base)
      shows no change under `apps/`, and no change to any existing `DEC`,
      `REQ`, `FLOW`, or `NFR` body, or to `open-questions.md`.
- [ ] B5 — A human confirmed the package needs no further durable-truth
      promotion at cleanup beyond the two files this package wrote.

## Verification

```bash
git diff PRD/README.md
grep -c "sections/life-tracker" PRD/README.md
git diff --stat origin/thejudge-auto/life-tracker-spec... -- apps/ PRD/sections/decisions PRD/sections/functional-requirements.md PRD/sections/user-flows.md PRD/sections/system-map.md PRD/sections/screen-layout.md PRD/sections/non-functional-requirements.md PRD/sections/open-questions.md
```

## Files touched

- `PRD/README.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/life-tracker-spec/` ready to delete
