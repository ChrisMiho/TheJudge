# Slice A — remove dead card-back detector

## Status: done

## Goal

Delete the dormant, zero-caller card-back detector from
`apps/frontend/src/lib/scan/identify.ts` — `isCardBack()`,
`CARD_BACK_THRESHOLD`, the `cardBack` field, and its constructor write —
while leaving the live `_card_back` DB-exclusion filter untouched, so no
scan, lock, add, or no-match path changes for a player.

## Requirements

1. Delete `export const CARD_BACK_THRESHOLD = 100;` (currently line 27).
2. Delete the private field `private readonly cardBack: Uint8Array | null =
   null;` (currently line 213).
3. Delete the constructor's write to that field, `this.cardBack =
   Uint8Array.from(slice);` (currently line 220), leaving the surrounding
   `if (database.ids[i] === CARD_BACK_ID) { ... } else { ... }` branch intact
   as a plain skip — the `_card_back` entry stays excluded from `this.ids` /
   `this.db`, it just no longer gets stashed anywhere.
4. Delete the `isCardBack(cardImg: RgbImage): { isBack: boolean; distance:
   number }` method (currently lines 231–241) in full, including its doc
   comment.
5. Do not touch `CARD_BACK_ID`, `MATCH_THRESHOLD`, `identify()`, the
   `__back` suffix handling, or any other symbol in the file.
6. Confirm (do not assume) zero remaining references to `isCardBack`,
   `CARD_BACK_THRESHOLD`, or the `cardBack` field anywhere in
   `apps/frontend/src`, `apps/backend/src`, `scripts`, or test files, before
   and after the edit — repo-wide grep, excluding `dist/`.
7. No test file requires edits: `identify.test.ts` was verified during
   map-out to hold zero references to the three deleted symbols. If a fresh
   grep at implementation time finds one, update the test to match — but do
   not add, remove, or restructure test cases beyond what a real reference
   requires.
8. No `PRD/sections/` edits — the 5 accepted edits already landed in commit
   `7a36b25` and are out of scope for this slice.

## Acceptance criteria

- [x] A1 — `apps/frontend/src/lib/scan/identify.ts` no longer contains
      `isCardBack`, `CARD_BACK_THRESHOLD`, or a `cardBack` field/write
      (repo-wide grep for all three, excluding `dist/`, returns zero hits in
      source).
- [x] A2 — The constructor's `CARD_BACK_ID` skip branch (the
      `if (database.ids[i] === CARD_BACK_ID)` check) still compiles, still
      excludes `_card_back` from `this.ids` / `this.db`, and is otherwise
      unmodified.
- [x] A3 — `cd apps/frontend && npm test` passes, including the
      `CardIdentifier.identify` golden-vector test in `identify.test.ts`
      with byte-for-byte identical expected output to before the change.
- [x] A4 — `cd apps/frontend && npm run typecheck` passes clean (no stale
      references to removed exports).
- [x] A5 — `npm run quality:check` (repo root) is green.
- [x] A6 — `git diff` for this slice touches only
      `apps/frontend/src/lib/scan/identify.ts` (plus a test file only if
      requirement 7's fresh grep found a real reference) — no
      `PRD/sections/` file is touched.

## Verification

```bash
cd apps/frontend && npm test
cd apps/frontend && npm run typecheck
npm run quality:check
grep -rn "isCardBack\|CARD_BACK_THRESHOLD\|cardBack" --include="*.ts" --include="*.tsx" apps/frontend apps/backend scripts | grep -v /dist/
git diff --stat
```

## Files touched

- `apps/frontend/src/lib/scan/identify.ts`
- `apps/frontend/src/lib/scan/identification/identify.test.ts` (only if a
  fresh grep finds a real reference — none expected)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/remove-dead-card-back-detector/`
      ready to delete
