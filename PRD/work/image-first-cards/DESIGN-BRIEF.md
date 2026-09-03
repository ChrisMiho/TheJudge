# Design brief — image-first cards with on-demand card detail

## What the player gets

Card tiles look and behave exactly as today: an image-first tile with a color
identity ring and a corner control that opens the card-detail popup (oracle
text, mana cost/value, type line, colors, sub/supertypes). Nothing a card shows
changes. What changes is *when* the descriptive text arrives.

Today the MTG Assistant and Quick Lookup screens download every card's full
descriptive text up front — one 16.4 MB file of 33,399 records — and parse it on
the main thread before either screen is usable, so first load is slow no matter
how few cards a player ever opens. After this change the up-front download
carries only what a tile draws (name, oracle id, image URL, colors), and the
descriptive fields for a single card are fetched from the backend the moment a
player opens that card's detail. First load gets dramatically lighter; the
detail a player opens loads on demand behind a brief loading state.

## The three seams

One new card-detail dataset sits under two frontend changes and one server-side
read.

1. **Card-detail data artifact (no new endpoint).** A new committed dataset
   keyed by oracle id, holding the descriptive block (oracleText, typeLine,
   manaCost, manaValue, colors, supertypes, subtypes), trimmed from the same
   Scryfall bulk every other builder trims from, via a new `scripts/build-*.mjs`.
   One builder emits it twice: a frontend static copy under
   `apps/frontend/public/data/` that the popup lazy-loads on first open, and a
   backend copy under `apps/backend/data/` that ask-ai reads internally. **No new
   product-facing route** — the frontend reads a static artifact (the
   `cardhashes.bin` / `cardPrintingPrices.json` lazy-data pattern, NFR-010 /
   NFR-013), which preserves the one-main-endpoint rule (DEC-010, GOAL-002,
   `technical-design-rules.md`, REQ-072). Serves with no runtime network call, so
   mock-default local dev keeps working. (REQ-175, D5)

2. **Frontend slim + on-demand load.** The up-front card list drops to the
   fields a tile actually renders — name, oracle id, image URL, colors — from the
   trimmed `build-card-metadata.mjs` output. The shared card-detail popup and the
   Quick Lookup pre-submit preview load the descriptive block from the committed
   static card-detail artifact (REQ-175) when opened — lazy-loaded on first open,
   cached for the session — showing a brief loading state.
   (REQ-174, REQ-128 amended, FLOW-024)

3. **Ask-ai reads card text server-side.** The prompt assembler resolves each
   submitted card's descriptive block by oracle id from the backend artifact
   instead of reading it from the client-sent request payload. The client stops
   sending the descriptive fields inside `gameContext.zones` cards. The assembled
   prompt/context stays byte-identical to today's, gated by an equivalence test
   against the eval fixtures before the client stops sending the text.
   (REQ-176)

## Key design decisions (each proposed at the gate)

- **Image-first direction (D1).** Cards go image-first; descriptive detail is
  fetched on demand, not carried locally for all cards. This reverses the
  local-carry stance recorded across DEC-151 and its cited requirements
  (REQ-125, REQ-128, REQ-129, REQ-130), whose current rule is that those fields
  are carried locally so the popup and the image-fail fallback issue no fetch.
- **Whole path in one run (D2).** All three seams ship together in one work
  package rather than split across runs, because seam 3 (ask-ai server-side
  read) is what lets the frontend stop carrying oracle text at all — slimming the
  list without it would break the ask-ai prompt.
- **Image-fail fallback shows name + oracle id only (D3).** When a card image
  fails to load, the fallback shows only what stays local — the card name and
  oracle id — and issues no detail fetch. This is the direct consequence of D1:
  once oracle text is no longer local, the fallback can no longer show it.
- **Compression out of scope (D4).** The CloudFront/S3 pre-compression fix for
  large static assets is a separate, already-decided, zero-behavior-change
  deploy-layer win. It is not part of this package.
- **Card detail is a lazy static artifact, not a new endpoint (D5).** The
  on-demand detail is served as a committed static data artifact the frontend
  lazy-loads on first card-detail open — the existing lazy-data pattern (NFR-010
  `cardhashes.bin`, NFR-013 `cardPrintingPrices.json`) — not a new backend route.
  This keeps the hard, repeated one-main-endpoint rule (DEC-010, GOAL-002,
  `technical-design-rules.md` Forbidden Design Drift, REQ-072, the "multiple
  product-facing backend endpoints" non-goal) intact with no amendment. The
  endpoint alternative (`GET /api/cards/:oracleId`) is surfaced at the gate; it
  would require amending those four artifacts, so it is offered, not taken.

## Colors stays in the up-front list (material design point)

The intake groups `colors` with the popup-only fields to move on demand. It
cannot move: every complete card tile draws a restrained identity ring derived
from the card's existing colors (FLOW-001 step 3, DEC-078), with a silver-gray
fallback for colorless/missing colors. If `colors` moved to the on-demand fetch,
every tile would render silver-gray until (or unless) its detail loaded — a
visible change to what a card shows, which this work explicitly avoids.

So the up-front set is **{ oracle id (`cardId`), name, imageUrl, colors }** and
the on-demand set is **{ oracleText, typeLine, manaCost, manaValue, supertypes,
subtypes }**. This preserves the ring, the autocomplete, and the image with no
visible change, and still moves the dominant byte-mass (oracle text is 45.4% of
the file) to on demand. Recorded as a decision inside REQ-174 for the owner to
confirm; the conservative choice under the assumption ladder is to preserve the
user-visible ring behavior.

## Material assumptions (autonomous run — assumption ladder)

Resolved from current `PRD/sections/` truth and established patterns; each is
surfaced at the gate.

1. **`cardId` is the oracle id.** Current product truth already states this:
   ask-ai looks up submitted cards "by `cardId`, which corresponds to Scryfall
   `oracle_id` in the metadata pipeline" (`integrations-and-data.md`), and rulings
   + combos already key on oracle id. The new card-detail artifact joins on the
   same key. (Evidence: `PRD/sections/integrations-and-data.md` rulings/combo
   strategy; not re-derived from intake's cited FINDINGS files.)
2. **The descriptive block is card-intrinsic and rebuild-stable.** Both the
   frontend `cardMetadata` build and the new backend card-detail build trim the
   same Scryfall bulk, so the values resolved server-side equal the values the
   client used to send — the precondition for a byte-identical ask-ai prompt.
3. **`imageUrl` stays up front and is not sent to ask-ai.** It renders the card
   and is not cheaply reconstructable, so it stays in the up-front list; the
   backend already omits `imageUrl` from the LLM-facing payload, so ask-ai does
   not need it in the request.
4. **User-entered zone fields stay client-sent.** `caster`, `targets`,
   `contextNotes`, and `manaSpent` are game-state a player enters, not
   card-intrinsic data, so they remain in the `gameContext.zones` payload; only
   the card-intrinsic descriptive block moves server-side.
5. **Card detail ships as a lazy static artifact, not a new endpoint.** The
   one-main-endpoint rule is hard and pervasive (DEC-010, GOAL-002,
   `technical-design-rules.md` Forbidden Design Drift, REQ-072, the "multiple
   product-facing backend endpoints" non-goal), and the app already lazy-loads
   heavy static data on first use (NFR-010 `cardhashes.bin`, NFR-013
   `cardPrintingPrices.json`). Under assumption ladder #6 (no new endpoint
   without authoritative scope), card detail reuses that lazy-data pattern rather
   than minting the product's second product-facing route. Surfaced as D5, with
   the endpoint alternative and its four required amendments offered there.
   (Evidence: DEC-010 / goals-and-non-goals.md / technical-design-rules.md /
   REQ-072 one-endpoint rule; NFR-010 / NFR-013 lazy-data pattern.)

## Non-goals

- RAG / retrieval-quality changes, query-construction fixes, Scryfall `keywords`
  enrichment — tracked separately under
  `PRD/work/probe-prompt-data-optimization/`. This relocates existing card text;
  it does not change what gets retrieved.
- The CloudFront/S3 compression fix (D4) — separate deploy-layer work.
- Richer offline/image-fail fallback beyond name + oracle id (D3).
- Card-image caching, connectivity detection, or runtime metadata refresh.

## Constraints

- Ask-ai output must not change: the assembled prompt/context stays
  byte-identical, proven by the eval harness (`npm run test:eval`) before the
  client stops sending oracle text.
- Mock-default local dev (`ASK_AI_PROVIDER=mock`) keeps working; the frontend
  reads a committed static artifact and the backend reads its committed copy,
  both with no runtime network call and no new route.
- One product-facing endpoint only (DEC-010, REQ-072): no new backend route is
  added; the provider/route boundary stays intact
  (`apps/backend/src/providers/README.md`).
- Committed-data hygiene: commit only the trimmed card-detail artifacts — the
  frontend static copy under `apps/frontend/public/data/` and the backend copy
  under `apps/backend/data/` — matching the existing `*.json` patterns; Scryfall
  bulk stays gitignored.

## Proposed product-truth changes (see GATE-QUESTIONS.md)

New stable ids: **REQ-174** (slim up-front list), **REQ-175** (card-detail data
artifacts, no new endpoint), **REQ-176** (ask-ai server-side card-text
resolution), **NFR-019** (first-load payload target), **FLOW-024** (on-demand
card-detail load).

Amended stable ids: **REQ-128** (popup loads on demand), **REQ-125** (image
fallback path), **FLOW-001** (image-fail fallback = name + oracle id).

Direction decision surfaced at the gate with no id of its own: **D5** (lazy
static artifact vs. a new `GET /api/cards/:oracleId` endpoint).

Feature-spec prose carrying the same truth is amended inside the relevant id's
diff: `integrations-and-data.md` (card-detail data strategy, metadata strategy,
ask-ai payload), `shared-chrome/README.md` and `system-map.md` (popup read
path), `quick-lookup/README.md` (lookup-mode card request shape under REQ-176,
and the pre-submit preview), `non-functional-requirements.md` (payload target).

## Next step

`/thejudge-quality-check PRD/work/image-first-cards/`
