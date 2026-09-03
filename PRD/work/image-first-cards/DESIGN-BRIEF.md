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

One new backend capability sits under two frontend changes.

1. **Backend card-detail table + endpoint.** A new committed artifact under
   `apps/backend/data/`, keyed by oracle id, holding the descriptive block
   (oracleText, typeLine, manaCost, manaValue, colors, supertypes, subtypes),
   trimmed from the same Scryfall bulk every other builder trims from, via a new
   `scripts/build-*.mjs`. A new route `GET /api/cards/:oracleId` returns those
   fields, alongside `POST /api/ask-ai` and `GET /api/health`. It serves from
   the committed artifact with no runtime network call, so mock-default local dev
   keeps working. (REQ-175)

2. **Frontend slim + on-demand fetch.** The up-front card list drops to the
   fields a tile actually renders — name, oracle id, image URL, colors — from the
   trimmed `build-card-metadata.mjs` output. The shared card-detail popup and the
   Quick Lookup pre-submit preview fetch the descriptive block from
   `GET /api/cards/:oracleId` when opened, showing a brief loading state.
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
5. **The endpoint is a single-oracle-id GET.** Established route pattern is
   contract-focused handlers over committed artifacts; a batch endpoint is not
   introduced without authoritative scope (assumption ladder #6).

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
- Mock-default local dev (`ASK_AI_PROVIDER=mock`) keeps working; the endpoint
  serves from a committed artifact with no runtime network call.
- Provider/route boundary stays intact — route handlers stay contract-focused
  (`apps/backend/src/providers/README.md`).
- Committed-data hygiene: commit only the trimmed backend card-detail artifact,
  matching the existing `apps/backend/data/*.json` pattern; Scryfall bulk stays
  gitignored.

## Proposed product-truth changes (see GATE-QUESTIONS.md)

New stable ids: **REQ-174** (slim up-front list), **REQ-175** (card-detail
artifact + endpoint), **REQ-176** (ask-ai server-side card-text resolution),
**NFR-019** (first-load payload target), **FLOW-024** (on-demand card-detail
fetch).

Amended stable ids: **REQ-128** (popup fetches on demand), **REQ-125** (image
fallback path), **FLOW-001** (image-fail fallback = name + oracle id).

Feature-spec prose carrying the same truth is amended inside the relevant id's
diff: `integrations-and-data.md` (endpoint contract, metadata strategy, ask-ai
payload), `shared-chrome/README.md` and `system-map.md` (popup read path),
`quick-lookup/README.md` (pre-submit preview), `non-functional-requirements.md`
(payload target).

## Next step

`/thejudge-quality-check PRD/work/image-first-cards/`
