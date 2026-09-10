# Slice A — Deploy the ten-excerpt cap

## Status: planned

## Goal

A player's Ask AI rules question gets ten official rule excerpts attached
instead of five, at unchanged latency, with the five excerpts already shown
staying identical and in the same order. The production code and the
non-eval-instrument slice of durable product truth move together, so the PR
never states two different caps.

## Requirements

1. In `apps/backend/src/prompt/preparation.ts`, move
   `DEFAULT_SUPPLEMENTAL_RULE_CAP` from `5` to `10`. This is the single
   constant read at all four production call sites (REQ-190); no call site
   changes.
2. In `apps/backend/src/prompt/preparation.test.ts`, move the cap assertions
   to the new default:
   - the test asserting `DEFAULT_SUPPLEMENTAL_RULE_CAP` equals the production
     cap now asserts `10`, not `5`;
   - the "no cap override" byte-identity test now compares the default
     against an explicit cap of `10` (not `5`);
   - the "larger cap reuses the identical ranking" test still proves a larger
     cap's leading excerpts equal the smaller cap's, and the added slots come
     from `runnerUp` — reword it to compare the new default (10) against a
     larger cap (e.g. 15) so the mechanism is still demonstrated once 10 is
     the baseline, not the "larger" value.
3. Apply these 12 finalized `GATE-QUESTIONS.md` blocks to `PRD/sections/` by
   intent against current truth (every before-text line was verified
   byte-identical when the gate resolved; a mismatch is reported, not
   forced): **REQ-022, REQ-178, REQ-181, REQ-182, REQ-185, REQ-188, NFR-018,
   `system-map.md`, `integrations-and-data.md`, `in-depth/README.md`,
   `quick-lookup/README.md`, `system-map/game-rules-retrieval.md`**. Do not
   touch the REQ-032 or REQ-190 blocks — slice B carries those.
4. Do not edit `DESIGN-BRIEF.md` or `GATE-QUESTIONS.md` themselves; both are
   read-only inputs here.

## Acceptance criteria

- [ ] A1. `DEFAULT_SUPPLEMENTAL_RULE_CAP` is `10` in `preparation.ts`.
- [ ] A2. `preparation.test.ts`'s cap assertions reflect `10` as the
      production default, and still prove directly (not by assumption) that a
      larger cap's leading excerpts equal the smaller cap's and the added
      slots are drawn from `runnerUp`.
- [ ] A3. The 12 non-eval-instrument `GATE-QUESTIONS.md` blocks (REQ-022,
      REQ-178, REQ-181, REQ-182, REQ-185, REQ-188, NFR-018, `system-map.md`,
      `integrations-and-data.md`, `in-depth/README.md`,
      `quick-lookup/README.md`, `system-map/game-rules-retrieval.md`) are
      applied to `PRD/sections/`, each before-text byte-verified against
      current truth before editing.
- [ ] A4. `npm run quality:check` passes (typecheck, lint, format:check,
      coverage:check including the updated `preparation.test.ts`,
      test:scripts).

## Verification

```bash
cd apps/backend && npx vitest run src/prompt/preparation.test.ts
npm run quality:check
```

## Files touched

- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/prompt/preparation.test.ts`
- `PRD/sections/functional-requirements.md` (REQ-022, REQ-178, REQ-181,
  REQ-182, REQ-185, REQ-188)
- `PRD/sections/non-functional-requirements.md` (NFR-018)
- `PRD/sections/system-map.md`
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/in-depth/README.md`
- `PRD/sections/quick-lookup/README.md`
- `PRD/sections/system-map/game-rules-retrieval.md`
