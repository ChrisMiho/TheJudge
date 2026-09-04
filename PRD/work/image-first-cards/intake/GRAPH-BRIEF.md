# Graph-run brief — Image-first cards with on-demand card detail from the backend

Self-contained intake for `graph-kickoff`. The investigate-first questions are
**resolved with data below**, so refinement can go straight to a DESIGN-BRIEF.

Scope note: this brief is the **on-demand card-detail redesign** only. The
separate, zero-risk **CloudFront compression** fix (see Evidence) is not part of
this run — it ships independently and changes no behavior.

## What the player gets

Card tiles stay image-first, exactly as today. Opening a card's detail popup
(mana, type, oracle text, colors, sub/supertypes) still shows the same fields —
but the app no longer downloads all 33,399 cards' descriptive data up front to
do it. First load of the MTG Assistant and Quick Lookup screens gets
dramatically lighter; the detail a player opens is fetched from the backend the
moment they open it. No visible change to what a card shows — only when the
text arrives.

## Why (measured — do not re-derive)

The frontend fetches `/data/cardMetadata.json` — **16.4 MB, 33,399 records** —
on entry to MTG Assistant (`MtgAssistantApp.tsx:265`) and Quick Lookup
(`QuickLookupApp.tsx:182`), then `JSON.parse`s it on the main thread. That is
the "slow first load" symptom. Byte-mass of the file:

| field | share | disposition |
| --- | --- | --- |
| oracleText | 45.4% (5.4 MB) | **move to on-demand backend fetch** |
| imageUrl | 25.5% (3.1 MB) | keep — renders the card image (`CardPresentation.tsx:185`) |
| cardId (= oracle id) | 10.1% (1.2 MB) | keep — join key + autocomplete |
| typeLine | 6.4% (0.8 MB) | move to on-demand (popup-only) |
| name | 4.9% (0.6 MB) | keep — autocomplete/selection (61 use-sites) |
| subtypes/supertypes | ~3.9% (0.5 MB) | move to on-demand (popup-only) |
| manaCost/manaValue/colors | ~3.9% (0.5 MB) | move to on-demand (popup-only) |

Up-front list shrinks to name + oracle id + imageUrl (+ any field the tile
itself renders) ≈ **~5–6 MB raw → ~1.5 MB gzipped**, from 16.4 MB.

Confirmed facts that de-risk the build:
- `cardMetadata`'s `cardId` **is the oracle id** (`build-card-metadata.mjs:235`
  sets `cardId: card.oracle_id`; measured: all 19,542 ruling oracle-id keys are
  a subset of the `cardId` set, 0 match printing-id keys). So card metadata,
  rulings, and combos already all key on oracle id — a card-detail table joins
  cleanly.
- The 516 MB Scryfall bulk (`apps/frontend/data/scryfall/default-cards.json`,
  62 fields/card) is the canonical source every builder trims from. A backend
  card-detail-by-oracle-id artifact is a new trim from the same source — the
  pipeline pattern already exists (`scripts/build-card-*.mjs`).

## Decisions already made — do not re-litigate

- **Direction change approved:** cards go image-first; descriptive detail is
  fetched on demand, not carried locally for all cards. This **amends DEC-151**,
  whose current stance is that those fields are locally carried so the popup and
  fallback issue no fetch.
- **Build the whole path:** (a) a backend card-detail artifact keyed by oracle
  id, (b) a new backend endpoint serving card detail by oracle id, (c) frontend
  slims the up-front list and fetches detail when a popup opens, (d) the ask-ai
  prompt path resolves card oracle text server-side instead of reading it from
  the frontend-sent payload.
- **Image-fail fallback, for now:** when a card image fails to load, the
  fallback box shows only what is already local — the card **name and oracle
  id** — and stops there. No detail fetch is triggered by image failure. Richer
  offline fallback is explicitly deferred.
- **Compression is a separate, already-decided win** and is out of scope for
  this run.

## Design direction (converged)

Three seams, one new backend capability underneath both frontend changes:

1. **Backend card-detail table + endpoint.** New build artifact under
   `apps/backend/data/` (e.g. card detail by oracle id: oracleText, typeLine,
   manaCost, manaValue, colors, supertypes, subtypes), trimmed from the same
   Scryfall bulk via a new `scripts/build-*.mjs`. New route
   `GET /api/cards/:oracleId` (alongside `/api/health`, `/api/ask-ai`)
   returning those fields. Keep the provider/route boundary rules
   (`apps/backend/src/providers/README.md`).
2. **Frontend slim + on-demand fetch.** Trim `build-card-metadata.mjs` output to
   the up-front set (name, oracle id, imageUrl, plus any field the tile renders
   directly). The detail popup (`CardPresentation.tsx` `CardDetailFieldsList`)
   fetches from `GET /api/cards/:oracleId` when opened; show a brief loading
   state. Image-fail fallback shows name + oracle id only (per decision).
3. **Ask-ai reads card text server-side.** Today `gameRulesRetrieval.ts`
   (`buildQueryParts`, ~line 220) and the prompt context consume `oracleText`
   supplied in the request payload (`lib/contextFlow/flow.ts:149`,
   `lib/zoneCards.ts:28`). Move that to a server-side lookup by oracle id so the
   frontend need not send it. **The assembled ask-ai context/prompt must be
   byte-identical to today's** — gate with an equivalence test against the eval
   fixtures (`apps/backend/src/eval/`, `npm run test:eval`).

## Current-state PRD truth to amend

Name the files; do not edit them here (refinement/graph-kickoff own that write).

- `PRD/sections/in-depth/README.md` and `PRD/sections/quick-lookup/README.md` —
  card metadata loading + the card-detail presentation path.
- `PRD/sections/shared-chrome/README.md` — the suite-wide card-detail popup
  (DEC-151 surface).
- `PRD/sections/user-flows.md` — the DEC-151/DEC-160 card-density flow text
  (lines ~53, ~61, ~135 reference "locally carried descriptive fields").
- `PRD/sections/screen-layout.md` — DEC-151 notes on the corner detail popup.
- `PRD/sections/integrations-and-data.md` — add the new `GET /api/cards/:oracleId`
  contract; note ask-ai no longer requires client-sent oracle text.
- `PRD/sections/non-functional-requirements.md` — first-load payload target.
- New REQ/FLOW for on-demand card detail; amend the REQs DEC-151 cites
  (REQ-125, REQ-128–130). The decision log is retired — no new DEC; record the
  reversal by editing the feature specs and cited REQs in place.

## Constraints (don't rediscover)

- **Ask-ai output must not change.** The prompt/context the provider receives
  stays byte-identical; prove it with the eval harness before the client stops
  sending oracle text.
- **Mock-default local dev must still work** (`ASK_AI_PROVIDER=mock`); the new
  endpoint serves from a committed artifact, no network at runtime.
- **Provider/route boundary stays intact** — route handlers stay
  contract-focused (`apps/backend/src/providers/README.md`).
- **imageUrl stays in the up-front list** — it is not cheaply reconstructable
  (embeds a printing image id + cache-buster) and it renders the card.
- **Do not conflate with RAG / retrieval-quality work.** The query-construction
  fix and Scryfall `keywords` enrichment are a separate, later effort
  (`PRD/work/probe-prompt-data-optimization/`); this run only relocates existing
  card text, it does not change retrieval.
- **Committed-data hygiene:** the new backend card-detail artifact is built from
  Scryfall bulk (gitignored); commit only the trimmed artifact, like the other
  `apps/backend/data/*.json`.

## Evidence + reusable tooling

Full findings and the live measurements are in
`PRD/work/probe-slow-load-vs-rag/`:
- `FINDINGS-slow-load.md` — the CloudFront/compression finding (separate fix).
- `FINDINGS-data-layer.md` — field byte-mass, the oracle-id join proof, the
  Scryfall-field inventory, and the frontend field-usage table.

The compression fix (out of scope here) is a deploy-layer change: pre-compress
the large data assets in the `s3 sync` step with `Content-Encoding` set, since
CloudFront's auto-compression caps at 10 MB and these files exceed it.

## What the graph run should produce

A DESIGN-BRIEF for image-first cards with on-demand card detail; the REQ/FLOW
amendments listed above (reversing DEC-151's local-carry stance, adding the
`GET /api/cards/:oracleId` contract, and setting a first-load payload target);
and slices that build the backend card-detail artifact + endpoint, slim the
frontend up-front list with an on-demand popup fetch and the name+oracle-id
image-fail fallback, and move ask-ai's card-text read server-side behind an
equivalence test. The four decisions above are settled — do not reopen them.

## How to hand this off

/graph-kickoff "Image-first cards: slim the up-front card list and fetch card detail on demand from a new backend card endpoint, moving ask-ai's card-text read server-side" PRD/work/probe-slow-load-vs-rag/GRAPH-BRIEF.md
