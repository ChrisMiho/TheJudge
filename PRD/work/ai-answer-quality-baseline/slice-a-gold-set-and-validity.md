# Slice A — gold-set-and-validity

## Status: planned

## Goal

Define the answer-quality gold set as two official tiers, enforce it with a
shared four-field validity test, and seed it past six cases — without
inventing an answer key.

## Requirements

1. `apps/backend/data/gameRulesRuleIndex.json` (tier 1) and
   `apps/backend/data/cardRulingsByOracleId.json` (tier 2) are the only pools
   a gold case's reference answer may come from; no tier 3, no community
   source as an answer, no combos (they are REQ-146's scope).
2. Every case under `apps/backend/src/eval/worked-solutions/*.case.json`
   carries a `tier` of `1` or `2`, a non-empty `question`, a non-empty
   `workedSolution`, a `source` block naming publisher, licensing, and the
   citation its tier requires (rule id for tier 1; card name, oracle id, and
   ruling date for tier 2), and at least one `expectedSupplementalRuleIds`
   entry.
3. A shared loader/validator (new `scripts/lib/gold-cases.mjs`) implements the
   four-field validity test and is the single place both
   `scripts/eval-worked-solutions.mjs` and the later answer-quality run read
   gold cases from — not two divergent readers of the same files.
4. The six existing worked-solution cases are updated in place with
   `tier: 1` and keep every other field unchanged; `npm run
   eval:worked-solutions` keeps working unchanged over the same files.
5. The gold set grows to at least the six committed cases plus roughly a
   dozen hand-picked tier-1/tier-2 seeds, each hand-picked from a topic
   players commonly get wrong, each tier-2 question human-reviewed before
   commit. No case is added, edited, or removed to make a score look better.
6. The ten labelled eval fixtures (`cascade-keyword`,
   `combat-deathtouch`, `counterspell-stack`, `quick-lookup-card`,
   `quick-lookup-multi-card`, `quick-lookup-multi-keyword-card`,
   `quick-lookup-no-card`, `quick-lookup-off-domain`, `state-based-actions`,
   `upkeep-trigger`) stay out of the gold set; they carry retrieval labels
   and no answer of any kind (REQ-032's scope, unchanged).
7. Apply `GATE-QUESTIONS.md`'s **REQ-185** block to
   `PRD/sections/functional-requirements.md` by intent (re-derived against
   current truth, not a blind patch replay), together with this slice's code.

## Acceptance criteria

- [ ] A1. `scripts/lib/gold-cases.mjs` exports a validator that rejects a case
      missing any of: non-empty `question`, non-empty `workedSolution`, `tier`
      of `1` or `2`, a `source` block with the tier-appropriate citation, at
      least one `expectedSupplementalRuleIds` entry — proven by
      `scripts/lib/gold-cases.test.mjs` asserting each field's absence fails
      loudly (throws or returns an explicit invalid result), never silently
      scoring as a miss.
- [ ] A2. The same test asserts every committed `*.case.json` file under
      `apps/backend/src/eval/worked-solutions/` parses and passes the
      validator.
- [ ] A3. The same test asserts the gold set holds at least the six named
      cases: `delayed-trigger-created-too-late`,
      `illegal-target-partial-resolution`,
      `last-known-information-simultaneous-sba`, `layers-timestamp-order`,
      `replacement-effect-single-application`,
      `state-based-actions-mid-resolution` — each carrying `tier: 1`.
- [ ] A4. The gold set holds at least 18 cases total (the six named plus at
      least a dozen new tier-1/tier-2 seeds), each with a non-empty
      `whyHard` noting the common-mistake topic it targets; asserted by the
      same test file.
- [ ] A5. `npm run eval:worked-solutions` still exits 0 and reports every
      case's expected rule id retrieved (or, for a new case where retrieval
      genuinely misses, the miss is visible in its report — this criterion
      only proves the command runs over the grown set without erroring).
- [ ] A6. `npm run test:scripts` passes, including `gold-cases.test.mjs`.
- [ ] A7. `PRD/sections/functional-requirements.md` carries a `### REQ-185`
      entry matching the finalized `GATE-QUESTIONS.md` REQ-185 block's
      decision (title, description, acceptance criteria, constraints,
      dependencies, notes), re-derived against current truth.

## Verification

```bash
npm run test:scripts
npm run eval:worked-solutions
```

## Files touched

- `scripts/lib/gold-cases.mjs` (new)
- `scripts/lib/gold-cases.test.mjs` (new)
- `scripts/eval-worked-solutions.mjs` (read gold cases through the shared loader)
- `apps/backend/src/eval/worked-solutions/*.case.json` (add `tier: 1` to the
  six existing cases; add ~12 new tier-1/tier-2 seed cases)
- `PRD/sections/functional-requirements.md` (REQ-185, new entry)
