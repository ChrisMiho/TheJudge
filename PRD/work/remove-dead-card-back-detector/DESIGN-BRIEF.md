# Design brief — remove-dead-card-back-detector

## What a player experiences

Nothing changes. The scanner identifies cards exactly as it does today. The
removed code (`isCardBack()`) is never called at runtime, so no scan, lock,
add, or no-match path shifts. This brief is about the engine's internals and
the durable product record, not about anything a player sees or does.

## The one judgment call, up front

The requested deletion is **not** a pure behavior-preserving refactor. It is a
product decision, and the graph `define` gate should surface it to the owner.

Reason: `isCardBack()` was **deliberately** kept dormant under DEC-055 as the
cheap re-enable path for card-back detection, and `PRD/sections/` records that
retention as current-state truth in five places. Deleting the method makes
those statements false and raises the documented cost of re-enabling card-back
detection — previously "supply a `_card_back` reference asset," now "supply the
asset **and** reimplement the detector." That is a real edit to product truth,
so it is written into `PRD/sections/` (below) rather than suppressed to keep the
diff empty. The non-empty diff is the correct, intended trigger for owner review
at the gate.

Player-visible behavior is unchanged; the durable posture on a deferred future
feature is what moves. Both facts are true at once, and the owner — not this
refinement pass — makes the final call at the gate.

## Scope

Delete, in `apps/frontend/src/lib/scan/identify.ts`:

- `isCardBack(cardImg)` method (lines 231–241) — zero callers in source or
  tests project-wide.
- `export const CARD_BACK_THRESHOLD = 100;` (line 27) — read only inside
  `isCardBack`.
- The private `cardBack` field (line 213) and its constructor write (line 220)
  — read only inside `isCardBack`.

## Must stay live (explicitly out of the deletion)

- `const CARD_BACK_ID = "_card_back";` (line 30).
- The constructor branch `if (database.ids[i] === CARD_BACK_ID)` that **excludes**
  the card back from the searchable DB (`this.db` / `this.ids`). After the
  `cardBack` write is removed, this branch becomes a plain skip — the `_card_back`
  entry is still kept out of the searchable set. `identify()`'s matching path is
  unchanged.
- `_card_back` / `<id>__back` distinct-entry handling in the bin and the
  `__back` suffix canonicalization.

## Non-goals

- No change to `identify()` matching, distances, thresholds used at runtime,
  API responses, prompts, rules content, or any player-facing output.
- Not a re-enable of card-back detection (still deferred under DEC-055).
- No edit to `apps/frontend/dist/` — generated output regenerates on build.

## Material assumptions (assumption ladder, per question)

- **Does the dormant code carry current `PRD/sections/` truth?** Yes — verified
  directly against `PRD/sections/`, not taken from intake. Five current-state
  passages assert the retained method / cheap re-enable path (listed below).
  Ladder rung 1 (active `PRD/sections/` truth) governs: the edit is required.
- **Is `_card_back` DB exclusion affected?** No. Established code pattern (rung 3)
  and the request both keep the `CARD_BACK_ID` filter. The skip-from-searchable
  behavior is preserved with the `cardBack` write removed.
- **Should DEC-055's decision-log entry be rewritten?** No. The decision log is a
  retired historical index (rung 1 boundary); it records what was decided and is
  not rewritten for a later dead-code removal. Only current-state feature specs
  are edited in place.
- **Which way to resolve delete-vs-keep?** Not decided here. No standing rule
  points either way, and the graph `define` gate is the designed owner-decision
  mechanism for a non-empty `PRD/sections/` diff. This pass records the
  post-deletion truth and hands the decision to the gate.

## PRD/sections/ changes (current-state edits, in place)

No new `REQ`/`FLOW`/`DEC` IDs minted. Prose edited in place under existing IDs;
every edit keeps the live `_card_back` DB-exclusion truth intact and only
retires the "dormant method retained / re-enable needs only an asset" claim.

- `PRD/sections/integrations-and-data.md` (~line 303) — engine has no card-back
  detector; `isCardBack()` removed as dead code; constructor still excludes
  `_card_back`; re-enable now needs a reimplemented detector plus an asset.
- `PRD/sections/system-map.md` (~line 284, "Identification core", REQ-034) —
  card-back rejection not implemented; dormant method removed; `_card_back` still
  excluded.
- `PRD/sections/scan/data/cardhashes.md` (~lines 88–89) — no reference asset and
  no detector; `_card_back` remains a distinct, DB-excluded id.
- `PRD/sections/scan/README.md` (~lines 306–309 and ~326–329) — "closed door"
  and "deferred, not cut" notes updated: re-enable now requires reimplementing
  the detector as well as supplying the asset.
- `PRD/sections/functional-requirements.md` (~line 622, REQ-034 acceptance
  criteria) — drop "card-back rejection threshold 100" from the list of what the
  module implements; note it shipped with the port and was later removed as dead
  code.

Unchanged on purpose: `integrations-and-data.md:295` (bin still ships no
`_card_back` reference — still true); the UX-descoping lines in
`functional-requirements.md` (682, 700, 849) and `scan/README.md` (75–78) — the
"Flip the card over" prompt stays descoped and player behavior is unchanged;
`PRD/sections/decisions.md` DEC-055 (historical record).

## Evidence

- `apps/frontend/src/lib/scan/identify.ts:27,213,220,231–241` — deleted symbols.
- `apps/frontend/src/lib/scan/identify.ts:30,219–224` — the `CARD_BACK_ID`
  filter that stays.
- Zero callers of `isCardBack` / `CARD_BACK_THRESHOLD` in `apps/frontend/src`,
  `apps/backend/src`, `scripts`, or tests; only generated `dist/` bundles hit,
  which regenerate on build.
- Prior receipt (cited, not opened): `PRD/instructions/receipts/card-scan-lockin-fix-2026-06-22.md`
  — descoped card-back detection and deliberately left `isCardBack()` dormant
  for possible re-enable under DEC-055.

## Slice hint (for map-out)

Single slice: the identify.ts deletion plus the `PRD/sections/` edits above.
Verify with `npm test` (Vitest) under `apps/frontend` — the golden-vector
parity suite must still pass byte-for-byte, and typecheck/lint must be clean
with the removed exports gone.
