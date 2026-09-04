# Idea — image-first-cards

## Problem

MTG Assistant and Quick Lookup fetch the full `cardMetadata.json`
(16.4 MB, 33,399 records) up front and `JSON.parse` it on the main thread
before either screen is usable, so first load is slow regardless of how few
cards a player ever opens. Most of that payload — oracle text (45.4%), type
line, subtypes/supertypes, mana cost/value/colors — exists only to back the
card-detail popup a player may never open. The backend `POST /api/ask-ai`
path adds to the same coupling: it reads a card's oracle text from the
client-sent request payload instead of resolving it server-side, so the
client must keep carrying that text just to answer questions.

## Outcome

Card tiles stay image-first exactly as today — no visible change to what a
card shows, only when its descriptive text arrives. The up-front list slims
to the fields tiles actually render (name, oracle id, imageUrl); opening a
card's detail popup fetches oracle text, type line, mana cost/value, colors,
and sub/supertypes on demand from a new backend endpoint keyed by oracle id.
Ask-ai's prompt assembly resolves a card's oracle text server-side by oracle
id instead of trusting the client payload, with the assembled prompt proven
byte-identical to today's via the eval harness before the client stops
sending it.

## Non-goals

- RAG/retrieval-quality changes, query-construction fixes, or Scryfall
  `keywords` enrichment — tracked separately under
  `PRD/work/probe-prompt-data-optimization/`; this reorganizes where
  existing card text lives, it does not change what gets retrieved.
- The CloudFront/S3 compression fix for large static assets — a separate,
  already-decided, zero-behavior-change deploy-layer win, out of scope here.
- Richer offline/image-fail fallback. When a card image fails to load, the
  fallback keeps showing only what stays local (name + oracle id); no detail
  fetch fires on image failure.

## Intake (evidence, not authority)

Staged from `.worktrees/.graph-intake/graph-20260903-093903/` into
`intake/GRAPH-BRIEF.md` in this package. That brief was itself handed off
from `PRD/work/probe-slow-load-vs-rag/GRAPH-BRIEF.md`, whose supporting
measurement documents (`FINDINGS-slow-load.md`, `FINDINGS-data-layer.md`,
also under `PRD/work/probe-slow-load-vs-rag/`) are cited but were not opened
by this run. Per the "intake is evidence, never authority" contract, the
brief's findings and its four "decisions already made" are recorded below as
PROPOSED/claimed items — refinement resolves them, they are not settled
truth from this gate.

### Claimed findings (to verify at refinement)

- `cardMetadata.json` field byte-mass: oracleText 45.4% (5.4 MB), imageUrl
  25.5% (3.1 MB), cardId 10.1% (1.2 MB), typeLine 6.4% (0.8 MB), name 4.9%
  (0.6 MB), subtypes/supertypes ~3.9% (0.5 MB), manaCost/manaValue/colors
  ~3.9% (0.5 MB) — cited against `MtgAssistantApp.tsx:265` and
  `QuickLookupApp.tsx:182` as the fetch call sites and
  `CardPresentation.tsx:185` as the imageUrl render site.
- `cardMetadata`'s `cardId` is claimed to equal the oracle id
  (`build-card-metadata.mjs:235` sets `cardId: card.oracle_id`; claimed
  measurement: all 19,542 ruling oracle-id keys are a subset of the `cardId`
  set, 0 match printing-id keys) — the claimed join key for a new card-detail
  table against rulings and combos.
- The 516 MB Scryfall bulk file is claimed as the canonical source every
  metadata builder already trims from, so a new backend card-detail artifact
  is claimed to be a same-pattern trim (`scripts/build-card-*.mjs`).
- Ask-ai's card-text read is claimed to live in `gameRulesRetrieval.ts`
  (`buildQueryParts`, ~line 220) and to be populated from
  `lib/contextFlow/flow.ts:149` / `lib/zoneCards.ts:28` in the client payload.

### Claimed "decisions already made" (proposed, to re-affirm or challenge at refinement)

1. Direction change: cards go image-first with descriptive detail fetched on
   demand instead of carried locally for all cards — claimed to amend
   DEC-151's local-carry stance (confirmed as a real, live-cited decision:
   `PRD/sections/decisions.md` line 192, and referenced across
   `system-map.md`, `user-flows.md`, `screen-layout.md`,
   `functional-requirements.md`, `in-depth/README.md`, `shared-chrome/README.md`).
2. Build the whole path in one run: backend card-detail artifact + endpoint,
   frontend slim + on-demand popup fetch, and server-side ask-ai oracle-text
   resolution — proposed as one package rather than split across runs.
3. Image-fail fallback (for now): shows only name + oracle id, no detail
   fetch triggered by image failure; richer offline fallback deferred.
4. Compression is claimed as a separate, already-decided, out-of-scope win.

### Claimed design direction (proposed, for refinement to accept/adjust)

- New backend build artifact under `apps/backend/data/` (card detail by
  oracle id: oracleText, typeLine, manaCost, manaValue, colors, supertypes,
  subtypes) via a new `scripts/build-*.mjs`, and a new route
  `GET /api/cards/:oracleId` alongside the existing `/api/health` and
  `/api/ask-ai` (`apps/backend/src/routes/`), keeping the provider/route
  boundary in `apps/backend/src/providers/README.md` intact.
- Trim `build-card-metadata.mjs` output to the up-front set (name, oracle id,
  imageUrl, plus any tile-rendered field); the detail popup
  (`CardPresentation.tsx` `CardDetailFieldsList`) fetches
  `GET /api/cards/:oracleId` on open with a brief loading state.
- Move the ask-ai server-side oracle-text lookup behind an equivalence test
  against the eval fixtures (`apps/backend/src/eval/`, `npm run test:eval`)
  so the assembled prompt/context stays byte-identical before the client
  stops sending oracle text.

### Claimed PRD truth to amend (files only, not content — refinement/graph-kickoff own the write)

- `PRD/sections/in-depth/README.md` and `PRD/sections/quick-lookup/README.md`
  — card metadata loading + card-detail presentation path.
- `PRD/sections/shared-chrome/README.md` — the suite-wide card-detail popup
  (DEC-151 surface).
- `PRD/sections/user-flows.md` — DEC-151/DEC-160 card-density flow text
  referencing "locally carried descriptive fields" (claimed lines ~53, ~61,
  ~135).
- `PRD/sections/screen-layout.md` — DEC-151 notes on the corner detail popup.
- `PRD/sections/integrations-and-data.md` — add the new
  `GET /api/cards/:oracleId` contract; note ask-ai no longer requires
  client-sent oracle text.
- `PRD/sections/non-functional-requirements.md` — first-load payload target.
- New REQ/FLOW for on-demand card detail; amend the REQs DEC-151 cites
  (REQ-125, REQ-128–130). No new `DEC-###` — the decision log is retired;
  the reversal is recorded by editing the feature specs and cited REQs in
  place.

### Constraints named by intake (to verify, not assume)

- Ask-ai output must not change: prove prompt/context stays byte-identical
  via the eval harness before the client stops sending oracle text.
- Mock-default local dev (`ASK_AI_PROVIDER=mock`) must keep working; the new
  endpoint serves from a committed artifact, no runtime network call.
- Provider/route boundary stays intact — route handlers stay
  contract-focused.
- `imageUrl` stays in the up-front list (not cheaply reconstructable, and it
  renders the card).
- Do not conflate with RAG/retrieval-quality work (separate,
  `PRD/work/probe-prompt-data-optimization/`).
- Committed-data hygiene: commit only the trimmed backend card-detail
  artifact, matching the existing `apps/backend/data/*.json` pattern.

## Prior run

- `PRD/instructions/receipts/card-image-size-standardization-2026-06-26.md`
  — prior shipped work standardizing card image sizing; adjacent surface to
  the image-first tile this request slims further.
- `PRD/instructions/receipts/commander-spellbook-combos-2026-08-22.md` —
  prior shipped combo enrichment keyed on oracle id against the same card
  metadata/rulings join this request's backend card-detail table extends.
- `PRD/instructions/receipts/general-game-rules-prompt-2026-06-05.md` —
  prior shipped work on the general game-rules prompt path; adjacent to the
  ask-ai server-side oracle-text resolution this request proposes.
- `PRD/instructions/receipts/scan-printing-fidelity-2026-06-25.md` — prior
  shipped scan-review card-detail/printing fidelity work; touches the same
  card-detail presentation surface.
- `PRD/instructions/receipts/shared-chrome-spec-2026-08-27.md` — wrote the
  current-state `PRD/sections/shared-chrome/README.md` feature spec,
  including the suite-wide card-detail popup (DEC-151 surface) this request
  amends.
- `PRD/instructions/receipts/ui-review-2026-08-11.md` — prior UI review pass
  touching the DEC-151 corner detail popup content and close-control
  geometry; adjacent context for the popup's on-demand loading state.
