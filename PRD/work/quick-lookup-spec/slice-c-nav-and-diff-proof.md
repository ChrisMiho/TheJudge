# Slice C — Verify the nav row and prove the package diff stayed in scope

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: planned

## Goal

Confirm the `PRD/README.md` Section Inventory row for `sections/quick-
lookup/` (already written, not yet committed — `git status` shows
`PRD/README.md` modified) is correct, and prove the whole package's diff
since its fork point touched nothing outside the licensed set: no `apps/`
change, no edit to any existing `DEC`/`REQ`/`FLOW`/`NFR` body, no edit to
`system-map.md`, `screen-layout.md`, `open-questions.md`, or
`goals-and-non-goals.md`.

## Requirements

1. Confirm exactly one Section Inventory row exists for `sections/quick-
   lookup/`, describing it as a derived, non-authoritative current-state
   feature spec citing DEC-168, naming Quick Lookup as the short-ask Ask AI
   destination, and noting it covers the full backend path (validation,
   branching prompt assembly, retrieval, provider boundary) — matching the
   `sections/life-tracker/`, `sections/user-feedback/`,
   `sections/trade-balancer/`, and `sections/scan/` rows' pattern in the
   same table (all four already present in `PRD/README.md`).
2. Confirm no other Section Inventory or Instruction Inventory row was
   added, removed, or reordered.
3. This branch forked from `origin/main` at `d049593` (Merge PR #114, the
   scan-spec close). Scope the diff-proof against the fork point,
   `$(git merge-base HEAD origin/main)` — confirmed at map-out time to
   resolve to `d049593`. Confirm the diff from that point, including
   not-yet-committed working-tree changes, touches only:
   `PRD/sections/quick-lookup/README.md` (new file, ~321 lines plus
   slices A/B's bounded corrections if any), `PRD/README.md` (one row
   added), and `PRD/work/quick-lookup-spec/` bookkeeping (`README.md`,
   `DESIGN-BRIEF.md`, `GRAPH-RUN.md`, `IDEA.md`, `STATUS.*`, `intake/`,
   `GAMEPLAN.md`, slice docs, criteria/evidence files) plus the
   `PRD/work/STATUS.md` board row — no `apps/` change, no edit to any
   existing `DEC`/`REQ`/`FLOW`/`NFR` body (`decisions/*`,
   `functional-requirements.md`, `user-flows.md`,
   `non-functional-requirements.md`), no edit to `system-map.md`,
   `screen-layout.md`, `goals-and-non-goals.md`, or `open-questions.md`.
4. Confirm no new stable ID token (`DEC-`, `REQ-`, `FLOW-`, `NFR-`, `Q-` +
   digits) appears anywhere in the diff's added lines that did not already
   exist pre-change — except DEC-116, REQ-094, REQ-095, which are pre-
   existing IDs cited (not minted) by slice B's licensed correction, if it
   ran and applied that correction.
5. This package writes its durable deliverable directly to
   `PRD/sections/quick-lookup/README.md` and `PRD/README.md`. Confirm there
   is no further durable-truth promotion for `thejudge-cleanup` to perform
   beyond what slices A and B have already verified (and, where needed,
   bounded-corrected).

## Acceptance criteria

- [ ] C1 — `PRD/README.md` has exactly one Section Inventory row for
      `sections/quick-lookup/`.
- [ ] C2 — That row's description states the spec is a derived, non-
      authoritative current-state view citing DEC-168, names Quick Lookup as
      the short-ask Ask AI destination, and notes it covers the full backend
      path.
- [ ] C3 — No other Section Inventory or Instruction Inventory row was
      added, removed, or reordered.
- [ ] C4 — The full package diff (from `$(git merge-base HEAD origin/main)`,
      including uncommitted working-tree changes) shows no change under
      `apps/`, and no change to any existing `DEC`/`REQ`/`FLOW`/`NFR` body,
      `system-map.md`, `screen-layout.md`, `open-questions.md`, or
      `goals-and-non-goals.md`.
- [ ] C5 — A human confirmed the package needs no further durable-truth
      promotion at cleanup beyond `PRD/sections/quick-lookup/README.md` and
      the `PRD/README.md` row.

## Verification

```bash
git diff $(git merge-base HEAD origin/main) -- PRD/README.md
grep -c "sections/quick-lookup" PRD/README.md
git diff --stat $(git merge-base HEAD origin/main) -- apps/
git diff --stat $(git merge-base HEAD origin/main) -- PRD/sections/
git diff $(git merge-base HEAD origin/main) -- PRD/sections/decisions PRD/sections/functional-requirements.md PRD/sections/user-flows.md PRD/sections/non-functional-requirements.md PRD/sections/system-map.md PRD/sections/screen-layout.md PRD/sections/goals-and-non-goals.md PRD/sections/open-questions.md
git status --porcelain
```

## Files touched

- `PRD/README.md` (verify only, already written)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/quick-lookup-spec/` ready to
      delete
