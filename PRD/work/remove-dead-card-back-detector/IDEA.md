# Idea: remove-dead-card-back-detector

## Problem
`apps/frontend/src/lib/scan/identify.ts` still carries the `isCardBack`
method (lines 231–241) and its export-only constant `CARD_BACK_THRESHOLD`
(line 27), left dormant since card-back detection was descoped from the
shipped scan UX. Source-wide grep (`apps/frontend/src`, `apps/backend/src`,
`scripts`) confirms `isCardBack` and `CARD_BACK_THRESHOLD` have zero
callers; the only other hits are generated `apps/frontend/dist/` bundles,
which regenerate on build. This is unreachable code sitting in a scan-path
file that agents and reviewers still have to read past.

## Outcome
Delete `isCardBack` (lines 231–241), `CARD_BACK_THRESHOLD` (line 27), and
the private `cardBack` field's write (constructor assignment at line 220)
since nothing reads it once `isCardBack` is gone. Keep the constructor's
`CARD_BACK_ID` filter — the `if (database.ids[i] === CARD_BACK_ID)` branch
that excludes the card back from the searchable hash DB — untouched; that
path is live inside `identify()` and gates match results today.

## Non-goals
- No product-truth change. `PRD/sections/` describes no card-back-detection
  feature to alter; this is a pure behavior-preserving refactor.
- No change to `identify()`'s matching behavior, the `CARD_BACK_ID` DB
  filter, API responses, prompts, rules content, or any player-facing
  output.
- Not a re-enable of card-back detection (that would need a canonical
  reference asset and UI rewire per `DEC-055`, out of scope here).

## Evidence
- `apps/frontend/src/lib/scan/identify.ts:27` — `export const
  CARD_BACK_THRESHOLD = 100;`, referenced only inside `isCardBack` (line
  240).
- `apps/frontend/src/lib/scan/identify.ts:231-241` — `isCardBack()` method,
  zero callers in source or tests project-wide.
- `apps/frontend/src/lib/scan/identify.ts:213,220` — private `cardBack`
  field, written only in the constructor, read only inside `isCardBack()`.
- `apps/frontend/src/lib/scan/identify.ts:218-221` — the `CARD_BACK_ID`
  filter branch that must stay: it keeps the card back out of `this.db` /
  `this.ids`, which `identify()` searches.

## Prior run
- `PRD/instructions/receipts/card-scan-lockin-fix-2026-06-22.md` — this is
  the run that descoped card-back detection from the shipped UX and
  deliberately left `isCardBack()` (engine) dormant for a possible future
  re-enable under `DEC-055`; explains why this dead code exists.
- `PRD/instructions/receipts/codebase-duplication-audit-2026-08-23.md` —
  a prior dead-code/duplication audit that also touched `identify.ts`
  (finding F-09, `CARD_WIDTH`/`CARD_HEIGHT` duplication with
  `detector.ts`); different finding, same target file, offered as context
  only.
