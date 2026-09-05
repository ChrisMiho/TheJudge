# Slice C — Lambda vector budget

## Status: planned

## Goal

Relieve the Lambda deploy package's 1.9 MB-of-120 MB data-budget squeeze by
re-encoding the committed rule-embedding vectors in a compact number format
(int8) — the lever the brief's measurement recommends, decided by measurement,
not reopened here.

## Requirements

1. **Decision, already made — do not reopen it.** `DESIGN-BRIEF.md`'s
   `## Measurement plan`, Item 3, measured three levers: int8 vectors
   (5.650 MB → 1.442 MB, headroom 1.905 → 6.113 MB, no new dependency), the
   model to S3 (frees the *reserve*, not the *data budget*, and adds a runtime
   external dependency the assumption ladder forbids without owner scope), and
   trimming the combo corpus (an emergency valve that removes combos players
   see, NFR-017). The owner accepted REQ-183 naming int8 as the lever. This
   slice implements int8; it does not re-run the lever comparison.
2. **REQ-183 — compact vector encoding.** In `scripts/build-rule-embeddings.mjs`,
   encode the vectors as int8 instead of `float32-base64`: quantise each
   component (measured range -0.2719 to 0.2584 today) and record the shipped
   format in the artifact's `encoding` field, replacing `"float32-base64"`
   with the new value. In `apps/backend/src/gameRulesRetrieval.ts`'s
   `loadGameRulesRuleEmbeddings`/`isValidEmbeddingsArtifactOnDisk`, read the
   `encoding` field rather than assuming a format — a mismatched or
   unrecognised encoding degrades to `null` (System 3 falls back to lexical
   retrieval with the existing one-diagnostic-warning pattern), exactly as a
   missing or malformed artifact does today.
3. Rebuild the committed artifact (`npm run data:build-rule-embeddings`) and
   re-measure `apps/backend/data` against `scripts/lambda-package-budget.test.mjs`,
   updating that test's recorded figures in the same change.
4. Re-measure retrieval quality after the format change: it must not regress
   against the values Slice A's REQ-182 recorded (benchmark clean/polluted
   recall@5, all 12 labelled fixture checks).
5. Apply the REQ-183 (new) and NFR-017 (amendment, including the owner's
   2026-09-05 CI/CUDA edit already finalized in `GATE-QUESTIONS.md`) documentation
   blocks to `PRD/sections/functional-requirements.md` and
   `PRD/sections/non-functional-requirements.md`, by intent, together with the
   code above.

## Acceptance criteria

- [ ] C1 — the artifact's `encoding` field names the shipped format, and the
      loader reads that field rather than assuming one
- [ ] C2 — the committed artifact is measurably smaller: from 5.650 MB
      (`float32-base64`) to about 1.442 MB (int8)
- [ ] C3 — tracked `apps/backend/data` total drops from the 2026-09-05
      measurement of 118.095 MB; the new figure and headroom are recorded in
      NFR-017
- [ ] C4 — retrieval quality does not regress after the format change:
      benchmark clean recall@5 at or above the value REQ-182 records, polluted
      recall@5 likewise, and all 12 labelled fixture checks still pass
- [ ] C5 — the vector-loading path degrades exactly as REQ-181 requires: a
      missing, malformed, or unrecognised-encoding artifact disables the
      semantic path with one diagnostic warning and System 3 falls back to
      lexical retrieval
- [ ] C6 — `node --test scripts/lambda-package-budget.test.mjs` passes with the
      new artifact, and the test's recorded figures are updated in the same
      change
- [ ] C7 — `MIN_VARIANT_POPULARITY` stays at 0 (the combo corpus is not
      trimmed) and no new dependency or external service is introduced
- [ ] C8 — the REQ-183 and NFR-017 documentation blocks are applied by intent,
      matching the finalized `GATE-QUESTIONS.md` diff (including the owner's
      CI/CUDA edit), in `PRD/sections/functional-requirements.md` and
      `PRD/sections/non-functional-requirements.md`

## Verification

```bash
npm run data:build-rule-embeddings
node --test scripts/lambda-package-budget.test.mjs
npm --workspace apps/backend run test:eval
npm run benchmark:rag-retrieval -- --semantic
```

## Files touched

- `scripts/build-rule-embeddings.mjs`
- `apps/backend/src/gameRulesRetrieval.ts`
- `apps/backend/src/gameRulesRetrieval.test.ts`
- `apps/backend/data/gameRulesRuleEmbeddings.json`
- `scripts/lambda-package-budget.test.mjs`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/non-functional-requirements.md`
