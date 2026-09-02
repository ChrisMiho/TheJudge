# GAMEPLAN — remove-dead-card-back-detector

## What a player experiences

Nothing changes. The scanner identifies cards exactly as it does today —
same matches, same distances, same lock/add/no-match paths. This work removes
engine-internal dead code that no runtime path calls; it does not touch
`identify()`'s matching behavior or any player-facing output.

## Architecture / data flow

`apps/frontend/src/lib/scan/identify.ts` currently carries a second,
never-invoked detection path alongside the live identify path:

- Live path (unchanged): `CardIdentifier.identify()` matches a query hash
  against `this.db` / `this.ids`, which the constructor already builds with
  the `_card_back` (`CARD_BACK_ID`) entry excluded via the
  `if (database.ids[i] === CARD_BACK_ID)` branch (line 219).
- Dead path (deleted by this slice): the constructor additionally stashes the
  excluded hash into a private `cardBack` field (line 213 declaration, line
  220 write), and an `isCardBack()` method (lines 231–241) reads that field
  plus `CARD_BACK_THRESHOLD` (line 27) to score whether a query image is a
  card back. `isCardBack()` has zero callers anywhere in `apps/frontend/src`,
  `apps/backend/src`, `scripts`, or tests — confirmed by repo-wide grep and
  recorded in `DESIGN-BRIEF.md`.

The deletion removes the four dead-path symbols and leaves the constructor's
`CARD_BACK_ID` skip branch in place, now a plain "don't add this id to the
searchable set" skip with no side write. `identify()` never reads `cardBack`
or calls `isCardBack()`, so its matching logic, thresholds, and outputs are
byte-for-byte unchanged — proven by the existing golden-vector test in
`identify.test.ts`, which exercises `CardIdentifier.identify()` against a
fixed DB/query/expected-output vector and takes no path through the deleted
code.

No new file, module, dependency, or interface is introduced. This is a
subtraction inside one existing file.

## Durable PRD truth (already applied, not slice work)

The five `PRD/sections/` edits recording this deletion as current-state truth
already landed in commit `7a36b25` (`define(remove-dead-card-back-detector):
design + owner gate for dormant isCardBack removal`) and were re-verified
live during `gate-qc` (run two). Verified directly against the working tree
before this GAMEPLAN was written:

- `PRD/sections/integrations-and-data.md:303` — "the engine has no card-back
  detector — the previously-dormant `isCardBack()` method was removed as dead
  code."
- `PRD/sections/system-map.md` (REQ-034, "Identification core") — dormant
  method removed; `_card_back` still excluded.
- `PRD/sections/scan/data/cardhashes.md` — no reference asset, no detector.
- `PRD/sections/scan/README.md` — re-enable cost note updated.
- `PRD/sections/functional-requirements.md` (REQ-034 acceptance criteria) —
  threshold-100 rejection dropped from the implemented list.

No `PRD/sections/` edit is in scope for the implementation slice below — it
would re-do already-accepted, already-committed work.

## Slices

| Slice | Objective | Depends on |
| --- | --- | --- |
| A | Delete the dead card-back detector code from `identify.ts`; keep the live `_card_back` DB-exclusion filter; verify with the existing test/typecheck/lint suite | none |

Single slice: the design brief's own slice hint calls this a single-slice
deletion, and there is no seam to split it across — one file, four symbols
removed together, one verification pass.

## Verification checklist (whole package)

- [ ] `apps/frontend/src/lib/scan/identify.ts` no longer defines
      `CARD_BACK_THRESHOLD`, the `cardBack` field, the constructor write to
      it, or `isCardBack()`.
- [ ] `CARD_BACK_ID` / `_card_back` exclusion branch in the constructor still
      compiles and still keeps that id out of `this.ids` / `this.db`.
- [ ] `cd apps/frontend && npm test` — golden-vector parity suite passes
      byte-for-byte (unchanged expected output).
- [ ] `cd apps/frontend && npm run typecheck` — clean with the removed
      exports gone (no stale import anywhere references them; grep confirms
      zero callers pre-existing).
- [ ] `npm run quality:check` (repo root) — green for touched areas
      (typecheck, lint, format:check, coverage:check, test:scripts).
- [ ] No `PRD/sections/` edits made by this slice (already-accepted edits are
      untouched, not re-applied or re-worded).

## Not in scope

- No `PRD/sections/` edits (already done, already accepted at the gate).
- No change to `identify()`, `CARD_BACK_ID`, the `_card_back` DB-exclusion
  branch, `__back` suffix canonicalization, or any matching threshold.
- No UX change — the "flip the card over" prompt stays descoped, unrelated to
  this deletion.
- No edit to `apps/frontend/dist/` — regenerates on build.
- No browser verification — this is a non-UI, non-runtime-behavior deletion
  proved by unit test parity; no `runtime-process-hygiene.md` browser-risk
  criteria apply.

## Next step

`/thejudge-implement PRD/work/remove-dead-card-back-detector/ slice A`
(Claude Code) or `$thejudge-implement PRD/work/remove-dead-card-back-detector/
slice A` (Codex).

For one unattended agent completing every remaining slice (here, just A):
`/thejudge-implement-all PRD/work/remove-dead-card-back-detector/`.
