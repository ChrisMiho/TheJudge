# Slice B — Verify the nav row and prove the package diff stayed in scope

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: planned

## Goal

Confirm the already-committed `PRD/README.md` Section Inventory row for
`sections/trade-balancer/` is correct, and prove the whole package's diff
since its fork point touched nothing outside the licensed set: no `apps/`
change, no edit to any existing `DEC`/`REQ`/`FLOW`/`NFR` body, no edit to
`system-map.md`, `screen-layout.md`, or `integrations-and-data.md`.

## Requirements

1. Confirm exactly one Section Inventory row exists for
   `sections/trade-balancer/`, describing it as a derived, non-authoritative
   current-state feature spec citing DEC-168, and noting its price corpus is
   documented in the directory's `data/cardPrintingPrices.md` — matching the
   `sections/life-tracker/` and `sections/user-feedback/` rows' pattern in
   the same table (both already present in `PRD/README.md`).
2. Confirm no other Section Inventory or Instruction Inventory row was
   added, removed, or reordered.
3. This branch (`thejudge-auto/trade-balancer-spec`) forked from
   `origin/main` at `f97881b` (Merge PR #109, the user-feedback-spec close).
   Scope the diff-proof against the fork point,
   `$(git merge-base HEAD origin/main)` — confirmed at map-out time to
   resolve to `f97881b`. Confirm the diff from that point touches only:
   `PRD/sections/trade-balancer/README.md` (new file),
   `PRD/sections/trade-balancer/data/cardPrintingPrices.md` (new file),
   `PRD/README.md` (one row added), and `PRD/work/trade-balancer-spec/`
   bookkeeping (`README.md`, `DESIGN-BRIEF.md`, `GRAPH-RUN.md`, `IDEA.md`,
   `STATUS.*`, `intake/`, `GAMEPLAN.md`, slice docs, criteria/evidence
   files) plus the `PRD/work/STATUS.md` board row — no `apps/` change, no
   edit to any existing `DEC`/`REQ`/`FLOW`/`NFR` body (`decisions/*`,
   `functional-requirements.md`, `user-flows.md`,
   `non-functional-requirements.md`), no edit to `system-map.md`,
   `screen-layout.md`, `integrations-and-data.md`, or `open-questions.md`.
4. Confirm no new stable ID token (`DEC-`, `REQ-`, `FLOW-`, `NFR-`, `Q-` +
   digits) appears anywhere in the diff's added lines that did not already
   exist pre-change.
5. This package writes its durable deliverable directly to `PRD/sections/`
   and `PRD/README.md`. Confirm there is no further durable-truth promotion
   for `thejudge-cleanup` to perform beyond what is already committed and
   slice A's possible bounded correction.

## Acceptance criteria

- [ ] B1 — `PRD/README.md` has exactly one Section Inventory row for
      `sections/trade-balancer/`.
- [ ] B2 — That row's description states the spec is a derived,
      non-authoritative current-state view citing DEC-168 and notes the
      price corpus lives in `data/cardPrintingPrices.md`.
- [ ] B3 — No other Section Inventory or Instruction Inventory row was
      added, removed, or reordered.
- [ ] B4 — The full package diff (from `$(git merge-base HEAD origin/main)`)
      shows no change under `apps/`, and no change to any existing
      `DEC`/`REQ`/`FLOW`/`NFR` body, `system-map.md`, `screen-layout.md`,
      `integrations-and-data.md`, or `open-questions.md`.
- [ ] B5 — A human confirmed the package needs no further durable-truth
      promotion at cleanup beyond
      `PRD/sections/trade-balancer/README.md`,
      `PRD/sections/trade-balancer/data/cardPrintingPrices.md`, and the
      `PRD/README.md` row.

## Verification

```bash
git diff $(git merge-base HEAD origin/main)..HEAD -- PRD/README.md
grep -c "sections/trade-balancer" PRD/README.md
git diff --stat $(git merge-base HEAD origin/main)..HEAD -- apps/
git diff --stat $(git merge-base HEAD origin/main)..HEAD -- PRD/sections/
git diff $(git merge-base HEAD origin/main)..HEAD -- PRD/sections/decisions PRD/sections/functional-requirements.md PRD/sections/user-flows.md PRD/sections/non-functional-requirements.md PRD/sections/system-map.md PRD/sections/screen-layout.md PRD/sections/integrations-and-data.md PRD/sections/open-questions.md
```

## Files touched

- `PRD/README.md` (verify only, already committed)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/trade-balancer-spec/` ready to
      delete
