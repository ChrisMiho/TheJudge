# Slice D — Use the keyword list Scryfall already gives us

## Status: planned

## Goal

Carry each card's real Scryfall `keywords` array into the backend card
corpus and feed it as the keyword signal Slice B's compact query is built
from, replacing the hand-curated 20-word tokenization for per-card
inference. Answer open question Q-001.

## Requirements

1. In `scripts/build-card-detail-by-oracle-id.mjs` (`buildDetailEntry`), add
   each card's Scryfall `keywords` array to the committed
   `apps/backend/data/cardDetailByOracleId.json` artifact, alongside the
   fields already resolved server-side (REQ-176).
2. In `apps/backend/src/gameRulesRetrieval.ts`, System 3's keyword signal
   for a request becomes the union of the submitted/attached cards'
   `keywords`, resolved server-side by `cardId` via the `cardDetailIndex`,
   plus any keyword the question text itself names. Retain the
   hand-curated static vocabulary (`gameRulesKeywordVocabulary.json`) only
   for detecting a keyword named in the question text — it is no longer the
   per-card inference path.
3. The up-front `cardMetadata.json` the frontend downloads gains no field
   and its gzipped size is unchanged (`scripts/build-card-metadata.mjs`
   stays untouched) — keywords land only in the backend-only
   `cardDetailByOracleId.json` artifact.
4. The keyword-heavy labelled fixtures (`quick-lookup-card`,
   `quick-lookup-multi-card`, expected rule `702.2b` deathtouch) retrieve
   their expected rule.
5. Apply this step's `PRD/sections/` amendments by intent against current
   live text: the new `REQ-180` entry; `open-questions.md` Q-001 answered
   (append the "Answered" line, do not remove the existing recommended-next-
   step line); `integrations-and-data.md`'s Card Data Strategy bullet on the
   committed card-detail map, adding the keywords-carried-server-side-only
   sentence. Exact accepted wording is in `GATE-QUESTIONS.md` under
   `## REQ-180`, `## Q-001`, and the Card Data Strategy portion of
   `## integrations-and-data.md`.

## Acceptance criteria

- [ ] D1 — the card-data build writes each card's Scryfall `keywords` array
      into `cardDetailByOracleId.json`
- [ ] D2 — System 3's keyword signal is the union of the request's cards'
      keywords (resolved server-side by `cardId`) plus any keyword named in
      the question text; the static vocabulary is retained only for
      question-text detection
- [ ] D3 — the up-front `cardMetadata.json` gains no field and its gzipped
      size is unchanged (NFR-019's first-load gate untouched)
- [ ] D4 — `quick-lookup-card` and `quick-lookup-multi-card` retrieve
      expected rule `702.2b`
- [ ] D5 — measured on the Slice A benchmark, clean and multi-card recall@5
      do not regress below the values recorded after Slice C
- [ ] D6 — `open-questions.md` records Q-001 as answered, citing REQ-180
- [ ] D7 — `functional-requirements.md` carries the new `REQ-180` entry and
      `integrations-and-data.md` carries the Card Data Strategy addition,
      matching `GATE-QUESTIONS.md`
- [ ] D8 — `npm --workspace apps/backend run test:eval` and
      `npm run quality:check` are green

## Verification

```bash
node scripts/build-card-detail-by-oracle-id.mjs
npm --workspace apps/backend run test:eval
gzip -c apps/frontend/public/data/cardMetadata.json | wc -c
npm run quality:check
```

## Files touched

- `scripts/build-card-detail-by-oracle-id.mjs`
- `apps/backend/data/cardDetailByOracleId.json` (rebuilt artifact)
- `apps/backend/src/gameRulesRetrieval.ts` (keyword signal)
- `apps/backend/src/gameRulesRetrieval.test.ts`
- `PRD/sections/functional-requirements.md` (REQ-180 new)
- `PRD/sections/open-questions.md` (Q-001 answered)
- `PRD/sections/integrations-and-data.md` (Card Data Strategy bullet)
