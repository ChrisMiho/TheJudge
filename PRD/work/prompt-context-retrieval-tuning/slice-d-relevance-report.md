# Slice D — Retrieval relevance report

## Status: planned

## Goal

Provide a digestible before/after relevance report for tuning review: one table per scenario with System 2 topics selected, System 3 top-5 with scores, and labeled recall hit/miss — replacing manual multi-file `prompt:preview` inspection for relevance work.

## Requirements

- REQ-032: digestible report artifact for tuning review
- DEC-047: report covers labeled scenarios

## Dependencies

- Slice C (fixtures with `expected` blocks and stable harness wiring)

## Files touched

- `scripts/retrieval-relevance-report.mjs` — **new**
- `package.json` — add `retrieval:report` script at repo root (optional name)
- `apps/backend/src/eval/contextEvaluationHarness.ts` — optional shared `buildRelevanceReport()` export

## Changes

### Report output

For each `*.fixture.json` that has an `expected` block (or all fixtures with optional section):

```
=== counterspell-stack ===
System 2 topics (12): stack-and-priority, targets-basics, ...
System 3 top-5:
  608.2  score=12.4  [RECALL OK]
  609.3  score=10.1  [RECALL OK]
  100.1  score=4.2   [NOISE OK]
Expected supplemental: 608.2, 609.3 — all hit
Forbidden supplemental: 100.1 — excluded
```

ASCII table format is fine; markdown tables also acceptable if script writes `output/retrieval-relevance-report.txt`.

### Script behavior

- Load fixtures from `apps/backend/src/eval/fixtures/`
- Use same modules as harness: `buildPromptContext`, `selectGameRulesTopics`, `retrieveSupplementalRulesWithDebug`
- No HTTP server; no OpenAI calls
- Exit 0 when all labeled expectations pass; exit 1 with summary when any miss (usable as optional CI adjunct — primary gate remains `test:eval`)

### npm script

```json
"retrieval:report": "node scripts/retrieval-relevance-report.mjs"
```

## Acceptance criteria

- [ ] `npm run retrieval:report` prints or writes report for all fixtures with `expected` blocks
- [ ] Each scenario section lists System 2 topic ids, System 3 top-5 with scores, recall hit/miss per expected id, forbidden exclusion status
- [ ] Report uses Slice A selection and Slice B scoring (not legacy all-topics / flat scorer)
- [ ] Script exits 0 when all labeled expectations satisfied
- [ ] No network calls; runs in CI/local without backend server

## Verification

```bash
npm run retrieval:report
cd apps/backend && npm run quality:check
```

## Notes

- Can share report builder with harness to avoid drift — prefer exporting `buildRelevanceReport(results)` from `contextEvaluationHarness.ts` if duplication would be substantial.
