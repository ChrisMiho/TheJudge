# DESIGN BRIEF: Trade Balancer pricing moves to the backend

> **Reshape note.** This brief supersedes the earlier "frontend-only slim
> (Step 1)" design in the same folder. The owner decided against shipping the
> frontend slim: pricing moves to the backend and the committed ~38 MB frontend
> price file is deleted. The prior brief's Step-1/Step-2 sequencing decision is
> retired.

## What the player gets

The Trade Balancer opens fast, and nothing a player does changes. They still
scan or search a card, pick its printing, see per-printing USD prices, toggle
foil, read each side's total and the difference, and get the $0-plus-caution
state when a price is missing. What changes is invisible: the balancer no longer
downloads one giant price file up front. Instead it prices each card the moment
it is added, by asking the backend for that one card's printings and prices —
the same on-demand pattern the card-detail popup already uses.

## Why the design changed (owner's decision)

Today the first time a player opens the balancer, the browser downloads and
parses a single ~38 MB file (`cardPrintingPrices.json`, 95,895 printings) before
the screen is usable — a multi-second stall on mobile. The earlier package
proposed slimming that file frontend-side. The owner chose a different fix:
serve prices from the backend, per card, and delete the frontend file entirely.

The owner's reasons, which shape the design:

- **Prices refresh weekly; rules text is static.** Keeping prices on the backend
  next to the card-detail data lets each refresh on its own cadence.
- **The question/RAG flow must not carry price bytes it never reads.** The
  card-detail popup and ask-ai read a card's rules block; they must not also
  download printing prices. So prices are a **separate** field/sub-resource, not
  merged into the rules payload.
- **Rules are per-card, prices per-printing.** A card has one rules block but
  several printings, each with its own price.

## Scope (committed)

1. **Reverse the frontend-only, no-backend-call posture (the DEC-087
   reversal).** The balancer may now make a read-only backend call to price
   cards. This is real product truth, proposed as amendments to REQ-064,
   REQ-065, and FLOW-009 — never a new DEC (the decision log is retired).

2. **Serve prices from the backend, alongside the existing card-detail route.**
   The committed backend card-detail data (`apps/backend/data/cardDetailByOracleId.json`,
   served by `GET /api/cards/:oracleId`, REQ-175) gains a **separate** per-oracle
   printing-price companion. A card's printings and prices are fetched on demand
   and carried in a field/sub-resource distinct from the rules block, so the
   popup/ask-ai path never downloads price bytes. The exact endpoint shape is the
   one genuine fork this run raises (see Blocker questions and Material
   assumptions); the recommended default is a read-only sibling route
   `GET /api/cards/:oracleId/prices`.

3. **One source extract — no fourth build.** `cardPrintingPrices.json` and
   `cardDetailByOracleId.json` already build from the same committed
   `apps/frontend/data/scryfall/default-cards.json`. The per-printing price/
   identity projection is unified into the existing card-detail build
   (`scripts/build-card-detail-by-oracle-id.mjs`), which emits both the rules map
   and the printing-price-by-oracle map in one pass; `scripts/build-card-prices.mjs`
   is retired. No fourth extract of `default-cards.json` is added.

4. **One thin shared frontend index at the unique-card grain.** `cardMetadata.json`
   (today `{cardId, name, imageUrl, colors}` per unique card, ~6.4 MB across
   33,399 entries) becomes the single per-unique-card identity index used by
   **both** the question flow and the trade balancer's search/autocomplete and
   scan preview. Its stored full `imageUrl` string is replaced by a stored
   representative-printing id, from which the loader derives the image URL via
   the same Scryfall template — the same derive-from-id lever. The ~38 MB
   `apps/frontend/public/data/cardPrintingPrices.json` is **deleted** from the
   frontend: card identity comes from `cardMetadata`, prices from the backend.

5. **Balancer flow.** The player types a name and it resolves to a card (oracle)
   via the shared `cardMetadata` index; a scan resolves an oracle via the
   existing scan map (`cardScanMap.json`). On card-add the balancer fetches that
   card's printings and prices from the backend and caches them per session (the
   FLOW-024 per-session-cache pattern the card-detail popup uses). The printing
   picker shows every printing with per-printing `usd`/`usdFoil`.

## Preserved (unchanged player-facing behavior)

- A null price still renders the **$0-plus-caution** state (REQ-065). `usd` /
  `usdFoil` arrive from the backend now; the `pricing.ts` logic (a null unit
  price contributes $0, the caution flag surfaces separately) is untouched.
- The printing picker still disambiguates printings by **set, collector number,
  and a working image**; the image derives from the printing id via the Scryfall
  template (verified for single- and double-faced printings at build).
- **Mock-default local dev keeps working.** The backend price data is committed
  and served in-memory with no live network call, exactly like
  `cardDetailByOracleId.json`; `ASK_AI_PROVIDER=mock` is unaffected.
- The **snapshot date** still reaches the UI (`Prices as of 5 June 2026`,
  REQ-145) — the on-demand price response carries it.
- The **freshness script's target artifact changes** (its price output moves from
  the frontend file to the backend map). This is noted only; the re-point is a
  later change, not resolved in this package. No Scryfall refresh runs here.

## The backend price contract (recommended shape)

A read-only sibling route serving one card's printings and prices by oracle id,
mirroring the card-detail route's committed-file-in-memory posture (REQ-175):

```
GET /api/cards/:oracleId/prices
200 → {
  oracleId: string,
  snapshotDate: string,          // ISO; feeds the "Prices as of <date>" line (REQ-145)
  printings: [
    {
      id: string,                // Scryfall printing id (image derives from this)
      set: string,               // set code
      setName: string,           // full set name (small per-card payload, kept for display)
      collectorNumber: string,
      usd: number | null,        // non-foil; null when the source has none
      usdFoil: number | null     // foil; null when the source has none
    }
  ]
}
404 → { error: "card_not_found" }   // degrades to the existing empty state
```

- Backed by a committed backend artifact (working name
  `apps/backend/data/cardPrintingPricesByOracleId.json`) keyed by oracle id,
  loaded into memory at startup and served with no runtime network call —
  the exact pattern of `apps/backend/src/cardDetail.ts` / `loadCardDetailIndex`.
- The frontend reconstructs each printing's **image URL** from `id` via the
  Scryfall template `https://cards.scryfall.io/normal/front/<id[0]>/<id[1]>/<id>.jpg`
  and takes the card **name** from `cardMetadata` (per oracle). `name` is not
  repeated per printing on the wire.
- Prices stay a separate concern from the rules block: the card-detail popup /
  ask-ai read `GET /api/cards/:oracleId` and never touch this data.

### Frontend fetch + per-session cache

A new `fetchCardPrintings(oracleId)` module mirrors `apps/frontend/src/lib/cardDetail.ts`:
a module-level `Map` cache for the page session, an in-flight promise dedupe, a
404 cached as an empty/absent result, and a failed fetch dropped from the cache
so a retry re-fetches. On card-add the balancer shows a brief in-place loading
state; on fetch failure the entry degrades to $0-plus-caution with a retry
affordance (mirroring FLOW-024 and the existing FLOW-009 load-failure edge).

## Decisions this run owns

### The endpoint shape is a genuine fork (raised as a Blocker)

Two clean options honor the owner's "prices separate from the rules payload"
constraint:

- **A — sibling read-only route `GET /api/cards/:oracleId/prices` (recommended).**
  Cleanest separation: the popup/ask-ai path carries zero price bytes; the
  balancer path carries zero rules text. **Cost:** it is the product's *third*
  product-facing endpoint, so it amends NFR-004 (the canonical one-endpoint rule)
  and its ~11 echo homes — the same authorized path REQ-175 used to add the
  second endpoint.
- **B — same route `GET /api/cards/:oracleId` with an opt-in prices form**
  (a query param such as `?include=prices` populating a separate `printings`
  key). **Benefit:** adds no new endpoint, so NFR-004 is untouched. **Cost:** a
  query-param variant is a slightly less clean contract than a sub-resource.

The owner named the sibling route as their own example and their reasons map to
it most directly, so the proposal is authored against Option A. If the owner
prefers to avoid the NFR-004 blast radius, Option B is a one-verdict switch (drop
the NFR-004 block; REQ-175's response contract carries the query-param form).

### `setName` rides in the price response, not a new frontend map

The picker may show the full set name. Rather than add a committed set→name map,
the per-oracle price response carries `setName` per printing — a card's ~3
printings per fetch is negligible bytes, and it keeps the frontend free of a new
artifact. (Ladder rung 6: no new data contract without need.)

### Build unification, not a fourth extract

The price/printing projection folds into `build-card-detail-by-oracle-id.mjs`
(one pass over `default-cards.json` emits both maps); `build-card-prices.mjs` is
retired. The exact script boundary is a build-time detail validated by outcome
(every priced gameplay printing present, prices display correctly), consistent
with how REQ-066 and REQ-175 treat build-time details.

## Non-goals

- **Not a change to what the player can do.** Scan/search add, picker,
  per-printing prices, foil toggle, $0-plus-caution, ephemeral trade, USD-only —
  all unchanged (REQ-064, REQ-065, FLOW-009, REQ-145).
- **Not the weekly freshness refresh.** Independent track; this run only notes
  that the freshness script's price target artifact moves. No Scryfall refresh
  runs here.
- **No live/real-time price sync.** Prices remain a static committed snapshot,
  now served from the backend in-memory rather than a frontend file. No runtime
  Scryfall fetch, no scheduled refresh (NFR-013 posture, reframed not weakened).
- **No change to scan-identity, prompt context, or the ask-ai/rules payload.**
  Printing identity stays a pricing/display concern (DEC-053, retired-index).

## Material assumptions (assumption ladder)

1. **Endpoint shape = sibling read-only route `GET /api/cards/:oracleId/prices`.**
   Evidence: the owner authorized the backend move and offered this exact route
   as an example; it best honors "the RAG flow must not carry price bytes."
   Raised as a Blocker fork because it adds a third product-facing endpoint
   (touches NFR-004). Ladder rungs 1 (owner scope) and 6 (endpoint only with
   authoritative scope, which the owner's decision supplies).
2. **Backend price artifact keyed by oracle id, per-printing `{id, set, setName,
   collectorNumber, usd, usdFoil}` + `snapshotDate`, committed under
   `apps/backend/data/`, served in-memory with no runtime network.** Evidence:
   this is exactly `cardDetailByOracleId.json` / `loadCardDetailIndex` (REQ-175).
   Ladder rung 3 (established local pattern).
3. **The price build folds into `build-card-detail-by-oracle-id.mjs`; no fourth
   extract of `default-cards.json`.** Evidence: both current builds already
   stream that same source; the owner asked not to write the projection twice.
   Ladder rungs 3 and 4.
4. **`cardMetadata` is the single shared unique-card index; its stored full
   `imageUrl` string is replaced by a representative-printing id from which the
   loader derives the URL.** Evidence: `cardMetadata` is already `{cardId, name,
   imageUrl, colors}` keyed by oracle; the balancer's name/image today come from
   the price artifact (`oracleSearch.ts`, `useTradeScan.ts`) — deleting that file
   requires a shared identity source, and `cardMetadata` is it. The derive-from-id
   lever matches the same Scryfall template used everywhere. NFR-019's relative
   ≥40% gzipped gate is unaffected (only improved). To verify at build: the
   derived URL resolves for a single-faced **and** a double-faced representative
   printing. Ladder rungs 1, 3, 5.
5. **Per-card fetch-on-add + per-session cache mirrors `cardDetail.ts`.** The
   mechanism changes (a network round-trip per newly added card instead of one
   bulk load; a new card cannot be priced fully offline). Player-facing UX mirrors
   the established card-detail on-demand fetch: a brief loading state, retry on
   failure, and the existing $0-plus-caution degrade. Ladder rungs 3 and 5.

## Product truth to amend (proposed — see GATE-QUESTIONS.md)

Nine stable-id blocks, plus one Blocker question:

- **REQ-064** — drop the absolute "frontend-only; no backend/endpoint" constraint
  (the DEC-087 reversal).
- **REQ-065** — the "no runtime network call is made to price or list printings"
  criterion becomes "printings and prices are fetched on card-add from the
  backend and cached per session"; the $0-plus-caution behavior is unchanged.
- **REQ-066** — the price artifact moves to the backend, keyed by oracle id, the
  build folds into the card-detail build, and the ~38 MB frontend file is deleted.
- **REQ-174** — `cardMetadata` becomes the shared unique-card index for both
  flows; its `imageUrl` is derived at load from a stored representative-printing
  id.
- **REQ-175** — the backend card-detail route gains a separate read-only
  per-oracle price companion (the recommended sibling route) and its committed
  artifact.
- **FLOW-009** — the trade flow's preconditions/notes reflect backend pricing on
  card-add rather than one lazy bulk load and "no backend call."
- **FLOW-025 (new)** — fetch a card's printings and prices on card-add and cache
  per session.
- **NFR-004** — a third product-facing endpoint (contingent on Option A; dropped
  if the owner picks Option B).
- **NFR-013** — the footprint/freshness framing is reframed: prices are served
  from a committed backend snapshot on demand, the frontend price file is gone,
  and the frontend up-front index is the slim shared `cardMetadata`.

The derived, non-authoritative docs brought into step by implementation (not
gated separately, per each doc's "on conflict the cited REQ/NFR wins" rule): the
`CardPrintingPrice` shape and the API/endpoint section in `integrations-and-data.md`,
the corpus doc `trade-balancer/data/cardPrintingPrices.md`, the "Prices and
freshness" / "Contract posture" bullets in `trade-balancer/README.md`, the
`### Printing-price artifact build` entry and the trade-balancer file list in
`system-map.md`, NFR-019's recorded measured figure, and the NFR-004 echo homes
(updated together by grep-before-amend per NFR-004's own rule).

## Where it lives (code touched by implementation)

- `scripts/build-card-detail-by-oracle-id.mjs` — also emit the per-oracle
  printing-price map; `scripts/build-card-prices.mjs` retired.
- `apps/backend/src/cardDetail.ts` / `apps/backend/src/routes/cardDetail.ts` (or a
  sibling price module/route) — load and serve the committed price map.
- `apps/backend/data/cardPrintingPricesByOracleId.json` — new committed artifact;
  `apps/frontend/public/data/cardPrintingPrices.json` — deleted.
- `scripts/build-card-metadata.mjs` — store a representative-printing id and drop
  the full `imageUrl` string; the loader derives the URL.
- `apps/frontend/src/lib/trade/loadCardPrices.ts` → replaced/retired by a new
  `fetchCardPrintings(oracleId)` per-session-cache module (mirrors
  `apps/frontend/src/lib/cardDetail.ts`); `pricing.ts` unchanged.
- `apps/frontend/src/components/trade/oracleSearch.ts` and `useTradeScan.ts` —
  source name/image/colors from `cardMetadata` (the shared index) instead of the
  deleted price artifact; fetch prices on add.
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` and
  `MtgAssistantApp.tsx` — continue reading `cardMetadata`, now with the derived
  image URL.
- Tests: trade loader/selector/search/scan and the two metadata consumers updated
  to the shared-index + backend-fetch shape, with the derived image URL and the
  $0-plus-caution degrade asserted.
