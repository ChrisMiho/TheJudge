# Slice A — card search ignores punctuation and accents

## Status: done

### Status notes (build, 2026-10-14)

Evidence per criterion (hook log does not see this worktree; self-reported after each check passed):

- A1: `npx vitest run src/lib/search.test.ts ...` green; the REQ-002 cases (`urborg tomb`, `urborg t`, `jace the mind`, `atraxa praetors`, `will o the wisp`, `lim dul`, `fire ice`, `sol ring`, `lightning bolt`, `urborg, tomb`, `lim-dûl`, `_____`) and `,,,` reaching no search.
- A2: `oracleSearch.test.ts` runs the same queries with a list of eight and a test that reads `oracleSearch.ts` and asserts it imports `normalize` from `lib/search` with no copy.
- A3: `ZoneCollectionStep.test.tsx` "shows No matching card found once the typed text reaches the threshold": absent at 2 chars, present at 5.
- A4 (re-run after review, 2026-10-14): refinement method from `evidence/measurements.md` section 1 (`npx tsx .tmp/recall2.ts`, real `cardMetadata.json`, 34,639 cards; names with a mark, 15 underscore-named cards left out, denominators 7,324 whole names and 7,288 first-two-words). Whole name 7,324 of 7,324. First two words, typed query treating long dashes as spaces (the shipped rule, owner decision 2026-10-13): 7,052 of 7,288 (floor 7,052, met). First two words, typed query dropping long dashes (refinement prototype): 7,051 of 7,288. The only card that differs is Human—Time Lord Meta-Crisis (`human time lord` finds it; `humantime lord` does not). The earlier build figures (7,339 and 7,063 of 7,301) counted underscore-named cards and are superseded.
- Review fixes (2026-10-14): `normalize` collapses any whitespace (tab, non-breaking space) to one space before other characters are dropped; long dashes U+2010 to U+2015 stay spaces like the hyphen (owner decision 2026-10-13); Trade Balancer (`TradeSide.tsx`) and Ask a Question (`QuickLookupApp.tsx`) gate the suggestion panel on `normalize(typed).length`; In-depth Escape with a no-match query closes the search again (`suggestionListOpen` in `ZoneCollectionStep.tsx`). New tests in `search.test.ts`, `TradeSide.test.tsx`, `QuickLookupApp.test.tsx`, `ZoneCollectionStep.test.tsx`.
- A5: `npm --workspace apps/frontend run test`: Test Files 148 passed, Tests 1595 passed; `npm run quality:check` exit 0. Re-run after review fixes: Test Files 148 passed, Tests 1599 passed; `npm run quality:check` re-run before the final push.
- A6: REQ-002 and `system-map.md` amended (diff in this PR).
- A7: Playwright on port 5471: Ask a Question `urborg tomb` lists Urborg, Tomb of Yawgmoth; In-depth Cards step lists it and `qzxwvk` shows "No matching card found"; Trade Balancer Side A lists it. Captures: `PRD/work/card-search-and-send-pill/.playwright-mcp/ask-question-urborg-tomb.png`, `in-depth-urborg-tomb.png`, `in-depth-no-match.png`, `trade-urborg-tomb.png`.
- A8: `browser_close` called; the vite server (pids 62706, 62681) stopped with `kill`; `lsof -i :5471` returns nothing; captures under `PRD/work/card-search-and-send-pill/.playwright-mcp/`.

## Goal

Every card-name search matches with case, accents and punctuation set aside, from one shared rule.

## Requirements

1. `normalize` in `lib/search.ts` lower-cases, folds accents to plain letters, turns hyphens, long dashes (U+2010 to U+2015) and slashes into spaces, counts any whitespace as a space, drops every other character that is not a letter, digit, space or underscore, and collapses runs of spaces. Underscores stay.
2. Thresholds (1 char Ask a Question, 3 elsewhere) count the typed text after the rule is applied. Ranking order, list lengths (3, 3, 8) and the real printed name shown are unchanged.
3. `oracleSearch.ts` (Trade Balancer) uses the same shared rule, no copy.
4. In-depth details' Cards step (`ZoneCollectionStep.tsx`) shows "No matching card found" when typed text reaches threshold and nothing matches.
5. `build` applies this slice's share of the accepted `PRD/sections/` amendments by intent, together with the code, in the same PR: REQ-002 (rule, searches covered, unchanged ranking and lengths, no-match message) in `functional-requirements.md`, and `system-map.md` "Card search & metadata" / "Fuzzy autocomplete" naming the punctuation rule and listing `components/trade/oracleSearch.ts`. Wording follows the finalized `GATE-QUESTIONS.md` diff.

## Acceptance criteria

- [x] `search.test.ts` covers `urborg tomb` and `urborg t` returning Urborg, Tomb of Yawgmoth first; `jace the mind`, `atraxa praetors`, `will o the wisp`, `lim dul`, `fire ice` finding their card; `sol ring`, `lightning bolt`, `urborg`, `urborg, tomb`, `lim-dûl` unchanged; `_____` still finding the blank-named card; `,,,` reaching no search
- [x] `oracleSearch.test.ts` covers the same queries on the Trade Balancer search with its list of eight, and imports `normalize` rather than copying it
- [x] `ZoneCollectionStep.test.tsx` shows "No matching card found" at threshold with no match
- [x] Corpus re-run: first-two-words recall at or above 7,052 of 7,288 and whole-name 7,324 of 7,324 (method in `evidence/measurements.md` section 1)
- [x] Frontend test suite passes
- [x] REQ-002 in `PRD/sections/functional-requirements.md` carries the accepted amendment and `system-map.md` names the rule and `oracleSearch.ts`
- [x] Browser: In-depth details Cards step shows Urborg, Tomb of Yawgmoth for `urborg tomb` and "No matching card found" for a nonsense name; Ask a Question and Trade Balancer also find it
- [x] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/card-search-and-send-pill/.playwright-mcp/`

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
