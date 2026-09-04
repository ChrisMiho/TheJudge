status: active

# image-first-cards

Image-first cards with on-demand card detail from a new
`GET /api/cards/:oracleId` endpoint.

**What the player gets.** Card tiles stay image-first exactly as today. The
app stops downloading all 33,399 cards' descriptive text up front; the up-front
list slims to what tiles render (name, oracle id, imageUrl, colors). Opening a
card's detail popup loads oracle text, type line, mana cost/value, colors, and
sub/supertypes on demand from a new backend endpoint, `GET
/api/cards/:oracleId`, keyed by oracle id — fetched per card on first open and
cached for the session (D5). Ask-ai resolves a card's oracle text server-side
by reading the same backend artifact internally, instead of reading it from the
client-sent payload, with the assembled prompt proven byte-identical to today's.

See `IDEA.md` for the captured idea, `intake/GRAPH-BRIEF.md` for staged
evidence, `GATE-QUESTIONS.md` for the 15 owner decisions, and `GRAPH-RUN.md`
for the autonomous run ledger. Docs-only PR:
https://github.com/ChrisMiho/TheJudge/pull/184

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/image-first-cards

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/image-first-cards/DESIGN-BRIEF.md`
- Findings: none — gate-qc attempt 7 (commit `87af556`) verified the completed
  amendment set. The on-demand-popup (D1) / name-only-fallback (D3) rule is
  amended in lockstep across REQ-058, FLOW-002, FLOW-006, the two prior-missed
  REQ-128 spots, and the derived `scan/README.md` + `shared-chrome/README.md`.
  DEC-078's offline scanning guarantee is reconciled, not reversed — the
  image-fail fallback stays name-only with no forced fetch and offline-usable,
  with two `- Owner note:` veto flags on REQ-058/FLOW-006. All 38 diff blocks'
  Current text verified verbatim, 26 cross-refs resolve, screen-layout coverage
  complete.

## Gate answers

All 15 owner decisions in `GATE-QUESTIONS.md` are answered `accept` or
resolved `edit` (D3 name-only fallback, D5 endpoint alternative, NFR-019
firm 80%-gzipped gate) with no rejections and no blockers. See
`GATE-QUESTIONS.md` for the complete proposal and resolutions.

## Slices

See `GAMEPLAN.md` for the architecture, data flow, and why this dependency
order — not the brief's expository seam numbering — is what makes each
slice safe to ship on its own.

| Slice | Title | Depends on | Status |
| --- | --- | --- | --- |
| [A](slice-a-card-detail-endpoint-and-on-demand-popup.md) | Card-detail endpoint, backend artifact, on-demand popup (all surfaces) | none | done |
| [B](slice-b-ask-ai-server-side-card-text.md) | Ask-ai resolves card text server-side; client stops sending it | A | done |
| [C](slice-c-slim-up-front-card-list.md) | Slim the up-front card list | A, B | planned |

## Implementation map

- New backend artifact: `apps/backend/data/cardDetailByOracleId.json`
  (Slice A), built by new `scripts/build-card-detail-by-oracle-id.mjs`
- New route: `GET /api/cards/:oracleId` (Slice A,
  `apps/backend/src/routes/cardDetail.ts`)
- On-demand popup fetch across all six card surfaces via the shared
  `apps/frontend/src/components/CardPresentation.tsx` (Slice A)
- Server-side ask-ai card-text resolution:
  `apps/backend/src/prompt/context.ts` (Slice B), gated by
  `npm run test:eval` byte-identical proof
- Slimmed up-front list: `scripts/build-card-metadata.mjs` →
  `apps/frontend/public/data/cardMetadata.json`, `CardMetadataItem` in
  `apps/frontend/src/types.ts` (Slice C), gated by an 80%-gzipped-reduction
  assertion (NFR-019)

## Next step

`/thejudge-implement PRD/work/image-first-cards/ slice A`
