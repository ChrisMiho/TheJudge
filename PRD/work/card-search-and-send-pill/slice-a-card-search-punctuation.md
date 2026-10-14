# Slice A — card search ignores punctuation and accents

## Status: planned

## Goal

Every card-name search matches with case, accents and punctuation set aside, from one shared rule.

## Requirements

1. `normalize` in `lib/search.ts` lower-cases, folds accents to plain letters, turns hyphens and slashes into spaces, drops every other character that is not a letter, digit, space or underscore, and collapses runs of spaces. Underscores stay.
2. Thresholds (1 char Ask a Question, 3 elsewhere) count the typed text after the rule is applied. Ranking order, list lengths (3, 3, 8) and the real printed name shown are unchanged.
3. `oracleSearch.ts` (Trade Balancer) uses the same shared rule, no copy.
4. In-depth details' Cards step (`ZoneCollectionStep.tsx`) shows "No matching card found" when typed text reaches threshold and nothing matches.
5. `build` applies this slice's share of the accepted `PRD/sections/` amendments by intent, together with the code, in the same PR: REQ-002 (rule, searches covered, unchanged ranking and lengths, no-match message) in `functional-requirements.md`, and `system-map.md` "Card search & metadata" / "Fuzzy autocomplete" naming the punctuation rule and listing `components/trade/oracleSearch.ts`. Wording follows the finalized `GATE-QUESTIONS.md` diff.

## Acceptance criteria

- [ ] `search.test.ts` covers `urborg tomb` and `urborg t` returning Urborg, Tomb of Yawgmoth first; `jace the mind`, `atraxa praetors`, `will o the wisp`, `lim dul`, `fire ice` finding their card; `sol ring`, `lightning bolt`, `urborg`, `urborg, tomb`, `lim-dûl` unchanged; `_____` still finding the blank-named card; `,,,` reaching no search
- [ ] `oracleSearch.test.ts` covers the same queries on the Trade Balancer search with its list of eight, and imports `normalize` rather than copying it
- [ ] `ZoneCollectionStep.test.tsx` shows "No matching card found" at threshold with no match
- [ ] Corpus re-run: first-two-words recall at or above 7,052 of 7,288 and whole-name 7,324 of 7,324 (method in `evidence/measurements.md` section 1)
- [ ] Frontend test suite passes
- [ ] REQ-002 in `PRD/sections/functional-requirements.md` carries the accepted amendment and `system-map.md` names the rule and `oracleSearch.ts`
- [ ] Browser: In-depth details Cards step shows Urborg, Tomb of Yawgmoth for `urborg tomb` and "No matching card found" for a nonsense name; Ask a Question and Trade Balancer also find it
- [ ] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/card-search-and-send-pill/.playwright-mcp/`

## Verification

```bash
npm --workspace apps/frontend run test -- src/lib/search.test.ts src/components/trade/oracleSearch.test.ts src/components/ZoneCollectionStep.test.tsx
npm --workspace apps/frontend run test
```

## Files touched

- `apps/frontend/src/lib/search.ts`
- `apps/frontend/src/lib/search.test.ts`
- `apps/frontend/src/components/trade/oracleSearch.ts`
- `apps/frontend/src/components/trade/oracleSearch.test.ts`
- `apps/frontend/src/components/ZoneCollectionStep.tsx`
- `apps/frontend/src/components/ZoneCollectionStep.test.tsx`
- `PRD/sections/functional-requirements.md` (REQ-002)
- `PRD/sections/system-map.md`
