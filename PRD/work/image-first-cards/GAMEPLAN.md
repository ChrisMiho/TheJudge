# GAMEPLAN — image-first-cards

## What the player gets

Card tiles stay image-first exactly as today. Opening a card's detail popup —
on any of the six card surfaces, plus the Quick Lookup pre-submit preview —
loads its oracle text, type line, mana cost/value, colors, and sub/supertypes
from the backend the moment it opens, behind a brief quiet loading state,
instead of that text already sitting on the device. The up-front download for
MTG Assistant and Quick Lookup shrinks to just what a tile draws. Asking the
AI a question about a card still gets the same assembled prompt it gets today
— the backend now resolves the card's text itself instead of trusting what the
browser sent.

## Architecture

One new backend-only data artifact, one new read-only route, and two read
paths into it:

```
Scryfall bulk (gitignored)
        │
        ├─ scripts/build-card-metadata.mjs ──► apps/frontend/public/data/cardMetadata.json
        │                                       (cardId, name, imageUrl, colors — REQ-174)
        │
        └─ scripts/build-card-detail-by-oracle-id.mjs (new)
                        │
                        ▼
        apps/backend/data/cardDetailByOracleId.json (new, backend-only — REQ-175)
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
  GET /api/cards/:oracleId    POST /api/ask-ai internal read
  (new route — REQ-175)       (server-side resolve — REQ-176)
          │                           │
          ▼                           ▼
  CardPresentation.tsx        prompt/context.ts assembles the
  fetches on open, caches     same prompt it assembles today,
  per card for the session    now resolved by cardId instead of
  (FLOW-024)                  from the request payload
```

`GET /api/cards/:oracleId` is the product's second product-facing endpoint
(D5) — the one-endpoint rule is amended, not held intact, everywhere it is a
hard constraint (REQ-012, REQ-072, NFR-004, `goals-and-non-goals.md`,
`technical-design-rules.md`). `POST /api/ask-ai` stays the only answer
endpoint; the new route is read-only.

`CardPresentation.tsx` (`apps/frontend/src/components/CardPresentation.tsx`)
is the single shared component behind all six card surfaces (`ZoneCardPicker`,
`ScanReviewBubble`, `EnrichmentStep`, plus `CardSelectionPreview` for Quick
Lookup) — REQ-058 governs it as the one authoritative presentation. Today its
`CardDetailPopup` and image-fail fallback both read descriptive fields
straight off the `card` prop (`ZoneCardItem` / `CardMetadataItem`), commented
explicitly as "no new network request." This work changes exactly that read
path: the popup fetches by oracle id on open and caches per card for the
session (FLOW-024); the image-fail fallback stops reading descriptive fields
at all and shows the card name only, with no fetch on image failure (D3,
preserving DEC-078's offline guarantee for scan review).

`apps/frontend/src/lib/zoneCards.ts` and
`apps/frontend/src/lib/contextFlow/flow.ts` (`buildLookupAskAiRequest`) are
where the frontend currently copies a card's descriptive fields onto the
`ZoneCardItem` / lookup-card wire shape it sends to `POST /api/ask-ai`. Once
the backend resolves those fields itself by `cardId` (REQ-176), these stop
copying them and `apps/backend/src/validation/askAiRequest.ts` stops
accepting them on the wire.

## Why this order (sequential, single-agent)

The three seams the brief names — (1) slim the up-front list, (2) the new
endpoint + on-demand popup, (3) server-side ask-ai resolution — cannot ship in
that numbering without an intermediate broken state, because of one shared
dependency: `CardPresentation.tsx` reads descriptive fields off the card
object it is passed. Slimming the up-front list first would leave the popup
with nothing to show. Making ask-ai stop accepting client-sent card text
before the backend can resolve it itself would break the AI prompt (D2's own
rationale). So the slices are ordered by what each one safely enables next,
not by the brief's expository numbering:

- **Slice A** ships the new endpoint/artifact and switches every popup
  surface to fetch on demand — the popup no longer depends on what the card
  object carries locally. Nothing upstream of it needs to change yet.
- **Slice B** teaches ask-ai to resolve card text server-side from the same
  artifact Slice A built, proves the assembled prompt byte-identical against
  the eval fixtures, and only then stops the client from sending the
  descriptive block. This can only be safe once Slice A's artifact exists.
- **Slice C** slims the up-front `cardMetadata.json` and the `CardMetadataItem`
  type. This is only safe once nothing left depends on those fields being
  present locally — the popup already fetches on demand (Slice A) and the
  ask-ai wire payload no longer needs them (Slice B).

Each slice is `sequential`, not `parallel-ready`: B needs A's artifact to
exist to resolve against; C needs both A (popup independence) and B (wire
independence) done first, or the app breaks mid-slice.

## Durable truth applied alongside code

Per slice, the build step ALSO applies that slice's share of the approved
`PRD/sections/` diffs from `GATE-QUESTIONS.md` — re-derived against current
truth at build time, not copy-pasted from the (possibly stale) gate proposal
— together with the code change it documents. This is not a separate
post-hoc documentation pass; the builder edits `PRD/sections/*.md` in the same
slice, same commit range, as the code it describes. Each slice doc below lists
its exact `PRD/sections/` share.

## Slices

| Slice | Title | Depends on |
| --- | --- | --- |
| A | Card-detail endpoint, backend artifact, on-demand popup (all surfaces) | none |
| B | Ask-ai resolves card text server-side; client stops sending it | A |
| C | Slim the up-front card list | A, B |

## Verification checklist (whole package)

```bash
npm run typecheck
npm run lint
npm run test
npm run test:eval
npm run quality:check
```

Slice-specific commands are listed in each slice doc and its
`slice-<letter>.criteria.json`.

## Next step

`/thejudge-implement PRD/work/image-first-cards/ slice A`
