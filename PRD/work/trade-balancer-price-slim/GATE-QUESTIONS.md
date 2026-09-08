# Gate questions — trade-balancer-price-slim (reshaped: pricing moves to the backend)

**Your ask: Decide.** Set `- Verdict:` on each block to `accept`, `edit`, or
`reject`, and fill `- Reason:` (required for edit and reject). These are proposed
edits to product truth in `PRD/sections/`; nothing is written there until the
build step applies your verdicts. There is also one **Blocker question** at the
end — the one genuine fork this run raises (the exact backend endpoint shape).

> **This supersedes the earlier frontend-only-slim gate.** The decision now is:
> do not ship the frontend slim. Move pricing to the backend and delete the
> committed ~38 MB frontend price file. Nine requirements/flows are amended (one
> new flow, `FLOW-025`, is minted); no new `DEC` is minted (the decision log is
> retired). One amendment (`NFR-004`) applies only if you pick the recommended
> endpoint option in the Blocker question.

---

## REQ-064 — the Trade Balancer may now ask the backend for prices

**What this decides:** whether the Trade Balancer is allowed to make a read-only
backend call to price cards, instead of being frozen as a strictly
frontend-only, no-backend feature.

**In plain terms:** REQ-064 today says the balancer is "frontend-only" and makes
"no backend, endpoint, or contract change." That was the original posture
(recorded as the retired DEC-087). This change lifts that specific ban so the
balancer can fetch a card's prices from the backend when the card is added —
while keeping the AI answer path completely frozen (no change to the question
request, the game context, how the prompt is built, the model provider, or the
`POST /api/ask-ai` answer endpoint). Everything a player does in the balancer is
unchanged; only where the price numbers come from changes.

**What happens if you say no:** the balancer stays frozen as frontend-only, the
~38 MB price file cannot move to the backend, and the whole reshape cannot
proceed — the multi-second first-open stall on mobile stays.

### Proposed diff — `PRD/sections/functional-requirements.md`, REQ-064

```diff
 ### REQ-064
 - Title: Two-sided trade balancer screen
 - Priority: high
-- Description: The app must provide a standalone Trade Balancer view where two traders each build a list of cards and the app shows each side's total USD value and the live difference between the two sides, so players can see whether a trade is balanced and by how much. Frontend-only and ephemeral; no backend, endpoint, or contract change (DEC-087).
+- Description: The app must provide a standalone Trade Balancer view where two traders each build a list of cards and the app shows each side's total USD value and the live difference between the two sides, so players can see whether a trade is balanced and by how much. Ephemeral; it prices cards through a read-only backend price fetch (REQ-066, REQ-175) and makes no change to the AI answer/prompt contract (reverses the frontend-only posture of the retired DEC-087).
 - Acceptance Criteria:
   - the view presents two sides (**Side A** and **Side B**), each an ordered list of card entries
   ...
 - Constraints:
-  - frontend-only; no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, `POST /api/ask-ai`, or any product-facing endpoint
+  - the AI answer path stays frozen: no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, or `POST /api/ask-ai`. The balancer prices cards only through a read-only backend price fetch (REQ-175); printing identity is never pushed into any prompt, rulings, or answer payload
   - USD only (Scryfall `usd` / `usd_foil`); EUR, tix, etched-foil, and grading/condition are out of scope for v1
   - mobile-first, touch-friendly layout (NFR-001)
 - Dependencies:
-  - DEC-087
   - REQ-065
   - REQ-066
   - REQ-067
   - NFR-013
   - FLOW-009
+  - REQ-175
```

*(The acceptance-criteria list is unchanged and elided above for brevity.)*

- Verdict:
- Reason:

---

## REQ-065 — a card is priced by fetching its printings from the backend when added

**What this decides:** whether the price and printing list for a card come from
one big file loaded up front, or are fetched from the backend for that one card
the moment it is added to a side and remembered for the rest of the session.

**In plain terms:** REQ-065 today says the printing shown and priced "uses the
price artifact" and that "no runtime network call is made to price or list
printings." This change replaces that: when a player adds a card (by scan or
search), the balancer asks the backend for just that card's printings and prices,
shows a brief loading state, and caches the result for the session so re-opening
the same card is instant. The card's name and image come from the shared local
`cardMetadata` index (REQ-174), not the network. Everything else about an entry
— the chosen printing, the foil toggle, the quantity, and the **$0-plus-caution**
state when a price is missing — is unchanged.

**What happens if you say no:** the balancer cannot fetch prices per card, so the
backend move cannot happen and the up-front bulk file stays.

### Proposed diff — `PRD/sections/functional-requirements.md`, REQ-065

```diff
 ### REQ-065
 - Title: Trade card entry — printing selection, foil toggle, quantity
 ...
 - Acceptance Criteria:
   ...
   - each entry can be **removed** from its side
-  - the printing shown and priced uses the price artifact (REQ-066); no runtime network call is made to price or list printings
+  - a card's printings and prices are fetched from the backend when the card is added and cached per session (REQ-066, REQ-175, FLOW-025); the entry shows a brief in-place loading state while it resolves. The card's name and image come from the shared local `cardMetadata` index (REQ-174). If the price fetch fails, the entry degrades to the $0-plus-caution treatment with a retry affordance rather than a broken row
 - Constraints:
   - printing selection is a pricing/display layer only; it is never pushed into prompt context, rulings lookup, or the Decrypt-Stack request payload, and does not change the DEC-053 oracle-level scan-identity model
   - USD only; foil handling is non-foil vs `usd_foil` (etched-foil out of scope for v1)
 - Dependencies:
-  - DEC-087
-  - DEC-088
   - REQ-066
   - REQ-036
   - REQ-064
   - FLOW-009
+  - REQ-174
+  - REQ-175
+  - FLOW-025
```

- Verdict:
- Reason:

---

## REQ-066 — the price data moves to the backend and the 38 MB frontend file is deleted

**What this decides:** whether the committed price data lives as a ~38 MB file
the browser downloads up front, or as a backend file the server holds in memory
and hands out one card at a time — and whether the price build is folded into the
existing card-detail build instead of being a separate script.

**In plain terms:** today one build script (`build-card-prices.mjs`) writes a
~38 MB file under the frontend (`cardPrintingPrices.json`, 95,895 printings) that
the browser downloads whole on first open. This change moves that data to the
backend, keyed by card (oracle id), so the server can return just one card's
printings and prices on request — exactly how the card-detail data already works.
The price projection is folded into the existing card-detail build (both read the
same Scryfall bulk file), so the data is trimmed once, not by a second script,
and no fourth build over that source is added. The old frontend file is
**deleted**. Prices are still a static committed snapshot with no live lookup —
only their home changes.

**What happens if you say no:** the price data stays a giant frontend download,
and the balancer keeps its multi-second first-open stall on mobile.

### Proposed diff — `PRD/sections/functional-requirements.md`, REQ-066

```diff
 ### REQ-066
 - Title: Printing-level price data artifact
 - Priority: high
-- Description: Add a build step that emits a committed, printing-level USD price artifact from the existing Scryfall bulk source, covering every paper printing with its non-foil and foil price plus the fields needed to identify, display, and list printings, so the trade balancer can price scanned and manually chosen printings with no runtime network calls (DEC-088).
+- Description: Emit a committed, **backend** printing-level USD price artifact from the existing Scryfall bulk source, keyed by oracle id, so the trade balancer can price scanned and manually chosen printings by fetching one card's printings on demand from the backend (REQ-175, FLOW-025). The projection is unified into the existing card-detail build, and the former ~38 MB frontend price file is removed (reverses the frontend-only posture of the retired DEC-087/DEC-088).
 - Acceptance Criteria:
-  - a build script (alongside `data:build` / `data:refresh`) emits a committed printing-level price artifact under `apps/frontend/public/data/` from the local Scryfall bulk source
-  - per printing the artifact carries at least: printing id, oracle id, card name, set code, set name, collector number, image url, `usd` (non-foil), and `usd_foil`
-  - entries are **indexable by oracle id** (to list a card's printings for the manual picker) and resolvable **by printing id** (so a scanned printing prices directly)
-  - missing prices are stored as null/absent (consumed as $0 + caution per REQ-065); the artifact records a **snapshot date**
-  - the artifact is **lazy-loaded only when the Trade Balancer is first opened**; app startup and the MTG Assistant flow are unaffected for users who never open it
-  - `npm run data:build` regenerates the artifact from local inputs; `npm run data:refresh` refreshes the Scryfall bulk source (download is human-approved before it runs) then rebuilds
+  - the price/printing projection is emitted by the **existing card-detail build** (`scripts/build-card-detail-by-oracle-id.mjs`), which trims `default-cards.json` once and emits both the card-detail map and the price map; the separate `scripts/build-card-prices.mjs` is retired and no fourth extract of `default-cards.json` is added
+  - the committed price artifact is **backend-only** (working name `apps/backend/data/cardPrintingPricesByOracleId.json`), keyed by **oracle id**; per oracle it carries the card's list of printings, each with printing id, set code, set name, collector number, `usd` (non-foil), and `usd_foil`; it records a **snapshot date**. Card name and image url are **not** stored per printing — name comes from the shared `cardMetadata` index (REQ-174) and image url is derived from the printing id (Scryfall template)
+  - the backend loads the committed price map into memory at startup and serves one card's printings on demand (REQ-175) with **no runtime network call**, exactly like `cardDetailByOracleId.json`; the former `apps/frontend/public/data/cardPrintingPrices.json` is deleted and is no longer downloaded up front
+  - a scanned printing prices directly (its oracle resolves via the scan map, then the card's fetched printing list is matched by printing id); the manual picker lists every printing of a card from the fetched list
+  - missing prices are stored as null/absent (consumed as $0 + caution per REQ-065)
+  - `npm run data:build` regenerates the artifact from local inputs; `npm run data:refresh` refreshes the Scryfall bulk source (download is human-approved before it runs) then rebuilds
   - the build degrades gracefully: a missing/failed source keeps the prior committed artifact and does not break other artifact builds
 - Constraints:
-  - static committed snapshot; no runtime price fetch and no runtime metadata/library sync (DEC-012 posture)
+  - static committed snapshot: no live/real-time price sync and no scheduled refresh; the on-demand backend read serves the committed snapshot in memory and makes no external call (DEC-012 posture)
   - raw downloaded bulk data remains gitignored and is not committed; only the trimmed price artifact is committed
-  - no change to `cardMetadata.json`, `cardScanMap.json`, `cardhashes.bin`, the scan recipe/identify/lock boundary, `AskAiRequest`, prompt assembly, the provider boundary, or any endpoint
+  - no change to `cardScanMap.json`, `cardhashes.bin`, the scan recipe/identify/lock boundary, `AskAiRequest`, prompt assembly, or the provider boundary; `cardMetadata.json` is slimmed and reused as the shared identity index per REQ-174; the backend gains the read-only price route per REQ-175
 - Dependencies:
-  - DEC-088
   - DEC-012
   - REQ-065
   - NFR-013
+  - REQ-174
+  - REQ-175
   - data pipeline (`scripts/`)
 - Notes:
   - source-bulk choice and the exact filter/field set are build-time details validated by outcome (every priced gameplay printing present, prices display correctly); `all-cards` (every language) is unnecessary because prices are per printing
+  - the freshness script's price **target artifact** changes from the deleted frontend file to the backend map; re-pointing it is a later change tracked by the freshness track, not resolved here
```

- Verdict:
- Reason:

---

## REQ-174 — the local card index becomes the one shared identity list, with image rebuilt from an id

**What this decides:** whether the small local card list the app already loads
(`cardMetadata.json`) becomes the single identity index used by both the question
flow **and** the trade balancer, and whether each card stores a full image web
address or just the id the address is rebuilt from.

**In plain terms:** `cardMetadata.json` today carries one row per unique card —
card id, name, a full image URL, and colors — and only the question/lookup flow
reads it. With the ~38 MB price file deleted, the balancer needs a local source
for a card's name and image (today it takes those from the price file). This
change points the balancer's search, autocomplete, and scan preview at
`cardMetadata` too, making it the one shared per-card identity index. It also
slims each row by storing the card's representative **printing id** instead of
the full image web address, and rebuilding the address from that id at display
time (the same rebuild-from-id trick used everywhere) — verified to produce a
working image for normal and double-faced cards. The firm first-load size gate
(NFR-019, at least 40% smaller than the old combined file) is unaffected and only
improves.

**What happens if you say no:** the balancer has no shared local source for card
names and images once the price file is deleted, so the price file cannot be
removed.

### Proposed diff — `PRD/sections/functional-requirements.md`, REQ-174

```diff
 ### REQ-174
 - Title: Image-first up-front card list
 - Priority: high
-- Description: The shared card metadata the frontend loads on entry to MTG Assistant and Quick Lookup carries only the fields a card tile renders directly — `cardId` (oracle id), `name`, `imageUrl`, and `colors` — and no longer carries the descriptive block (`oracleText`, `typeLine`, `manaCost`, `manaValue`, `supertypes`, `subtypes`), which is fetched on demand per REQ-175 / FLOW-024. `colors` stays up front because each card tile draws its identity ring from the card's colors (FLOW-001, DEC-078).
+- Description: The shared card metadata the frontend loads carries only the fields a card tile renders directly — `cardId` (oracle id), `name`, a representative image id, and `colors` — and no longer carries the descriptive block (`oracleText`, `typeLine`, `manaCost`, `manaValue`, `supertypes`, `subtypes`), which is fetched on demand per REQ-175 / FLOW-024. It is the **single per-unique-card identity index** used by MTG Assistant, Quick Lookup, **and the Trade Balancer's search/autocomplete and scan preview** (REQ-065). `colors` stays up front because each card tile draws its identity ring from the card's colors (FLOW-001, DEC-078).
 - Acceptance Criteria:
-  - `scripts/build-card-metadata.mjs` emits `apps/frontend/public/data/cardMetadata.json` records containing only `cardId`, `name`, `imageUrl`, and `colors`
+  - `scripts/build-card-metadata.mjs` emits `apps/frontend/public/data/cardMetadata.json` records containing only `cardId`, `name`, the representative printing id, and `colors`; the full `imageUrl` string is no longer stored — the loader derives it from the id via the Scryfall template `https://cards.scryfall.io/normal/front/<id[0]>/<id[1]>/<id>.jpg`
+  - the derived image url resolves for both single-faced and **double-faced** representative printings — Scryfall composes a double-faced card's front-face image url from the printing id with the `front` path segment — verified against a real double-faced card at build
+  - the Trade Balancer reads this index for its manual-search autocomplete and scan preview (card name and image), replacing its former reads of the deleted frontend price artifact
   - autocomplete, card selection, image rendering, and the color identity ring behave identically off the slimmed list at both 390×844 and 1440×900
   - no card surface renders a descriptive field (oracle text, type line, mana cost/value, sub/supertypes) directly from the up-front list; those fields arrive only via the on-demand fetch (FLOW-024)
   - the color identity ring (including silver-gray for colorless/missing colors) renders from the up-front `colors` with no detail fetch
 - Constraints:
   - do not remove `colors` from the up-front list; the tile ring depends on it
   - representative-printing selection, image selection, and card identity are unchanged
+  - NFR-019's relative first-load gate (the trimmed `cardMetadata.json` is ≥40% smaller gzipped than the prior combined artifact) still holds and is only improved by dropping the full image string; the build re-records the measured before/after figures
 - Dependencies:
   - REQ-175
   - FLOW-024
   - DEC-078
   - DEC-160
   - FLOW-001
   - NFR-019
+  - REQ-065
 - Notes:
   - the dominant byte-mass (oracle text, 45.4% of the file) is what this removes from first load
+  - deriving the image from a stored printing id (rather than a full URL) is the same lever used for the backend price data; the gzipped saving is modest (the shared URL prefix compresses well) but it unifies image derivation and removes a redundant per-card string
```

- Verdict:
- Reason:

---

## REQ-175 — the card-detail backend gains a separate read-only route for a card's prices

**What this decides:** whether the backend serves a card's printings and prices
from a new read-only route next to the existing card-detail route, keeping prices
separate from the rules text so the question flow never downloads price data.

**In plain terms:** the backend already serves one card's rules block by id at
`GET /api/cards/:oracleId`, from a committed file it holds in memory with no
network call (REQ-175). This change adds a companion that serves one card's
printings and prices the same way — recommended as a sibling route
`GET /api/cards/:oracleId/prices`, backed by a new committed backend price file.
Keeping prices on their own route means the card-detail popup and the AI answer
path never carry price bytes they do not read (the owner's requirement), and the
balancer never carries rules text. The response carries the card's printings
(printing id, set, set name, collector number, non-foil and foil USD) plus the
snapshot date; the browser rebuilds each printing's image from its id.

> **The exact endpoint shape is the Blocker question below.** This block is
> written for the recommended option (a sibling route). If you pick the
> same-route option there, this block still applies but the response is served
> from `GET /api/cards/:oracleId` under an opt-in parameter, and the NFR-004
> block is dropped.

**What happens if you say no:** there is no backend price contract, so the
balancer cannot fetch prices and the reshape cannot proceed.

### Proposed diff — `PRD/sections/functional-requirements.md`, REQ-175

```diff
 ### REQ-175
 - Title: Card-detail retrieval endpoint and backend card-detail artifact
 ...
 - Acceptance Criteria:
   - a new `scripts/build-*.mjs` trims the committed Scryfall bulk into a card-detail map keyed by Scryfall `oracle_id`, each value carrying `oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`, `subtypes`; raw Scryfall bulk stays gitignored and only the trimmed artifact is committed
   - the map is committed once, backend-only, under `apps/backend/data/cardDetailByOracleId.json`; no card-detail copy is committed under `apps/frontend/public/data/` and none is downloaded up front (NFR-019)
   - a new route `GET /api/cards/:oracleId` returns one card's descriptive block by oracle id; an unknown id returns a not-found response and the descriptive block degrades to the existing empty-oracle marker
+  - a **read-only price companion** serves one card's printings and prices by oracle id, kept **separate from the descriptive block** so the card-detail/ask-ai path carries no price bytes (REQ-066). Recommended shape: a sibling route `GET /api/cards/:oracleId/prices` returning `{ oracleId, snapshotDate, printings: [{ id, set, setName, collectorNumber, usd, usdFoil }] }`; an unknown id returns a not-found response. The frontend derives each printing's image url from `id` and takes the card name from the shared `cardMetadata` index (REQ-174)
+  - the price companion is backed by the committed backend price map (REQ-066), loaded into memory at startup and served with **no runtime network call**, exactly like the card-detail map; the balancer fetches one card's prices on add and caches per session (FLOW-025)
   - the frontend loads a card's detail from `GET /api/cards/:oracleId` on first open and caches it per card for the session (FLOW-024); it never bulk-downloads the map
   - ask-ai resolves card text by reading the same backend map internally inside `POST /api/ask-ai` (REQ-176), not by calling the new route; the route and the ask-ai read share the one artifact so they cannot drift
   - `npm run data:build` includes the card-detail build; `npm run data:refresh` requires explicit human approval before any download (existing policy)
-  - the product-facing routes are exactly `POST /api/ask-ai` and `GET /api/cards/:oracleId` (`GET /api/health` remains the non-product health check); `ASK_AI_PROVIDER=mock` local dev works unchanged with no runtime network call
+  - the product-facing routes are `POST /api/ask-ai`, `GET /api/cards/:oracleId`, and the read-only price companion `GET /api/cards/:oracleId/prices` (`GET /api/health` remains the non-product health check); `ASK_AI_PROVIDER=mock` local dev works unchanged with no runtime network call. The added route amends the one-endpoint rule (NFR-004)
 - Constraints:
   - commit only the trimmed artifact, matching the existing `apps/backend/data/*.json` pattern
-  - the new route is a read-only `GET` keyed by oracle id; it is the product's second product-facing endpoint (D5), authorized by the one-endpoint rule (canonical: NFR-004)
+  - the card-detail route and the price companion are read-only `GET`s keyed by oracle id; the price companion is the product's third product-facing endpoint, authorized by amending the one-endpoint rule (canonical: NFR-004)
 - Dependencies:
   - REQ-174
   - REQ-176
   - FLOW-024
   - REQ-072
   - NFR-004
+  - REQ-066
+  - FLOW-025
 - Notes:
   - `oracle_id` is the shared join key already used by card metadata, rulings, and combos
   - D5 chose the endpoint over a lazy static frontend artifact for per-card fetch granularity (download only the card opened)
+  - prices ride a companion separate from the descriptive block because prices refresh weekly while rules text is static, and the question/RAG flow must not carry price bytes it never reads
```

- Verdict:
- Reason:

---

## FLOW-009 — the trade flow prices each card by fetching it, not by loading one big file

**What this decides:** whether the description of building a trade says the
balancer loads one big price file on open, or fetches each card's prices from the
backend as the card is added.

**In plain terms:** FLOW-009 is the step-by-step of building a two-sided trade.
Today it says the price file loads on first open and the feature "makes no backend
call." This change updates the flow to match the backend move: the balancer opens
with the shared local card index available, and when a card is added it fetches
that card's printings and prices from the backend (cached per session), showing a
brief loading state. Every visible step — the two sides, the totals, the
difference, the foil toggle, the quantity, the $0-plus-caution state — is
unchanged.

**What happens if you say no:** the flow narrative contradicts the amended
requirements above.

### Proposed diff — `PRD/sections/user-flows.md`, FLOW-009

```diff
 ### FLOW-009
 - Name: Build a two-sided trade and read the balance
 - Trigger: User opens the Trade Balancer from the top-level navigation menu (FLOW-010) to compare the value of two lists of cards
 - Preconditions:
   - app is loaded
-  - the printing-level price artifact loads on first open (lazy-loaded, REQ-066)
+  - the shared local card index (`cardMetadata`, REQ-174) is available for search and identity; a card's prices are fetched from the backend when it is added (REQ-066, REQ-175, FLOW-025)
 - Main Flow:
   1. The Trade Balancer opens with two sides (**Side A** and **Side B**), each an empty card list, and a running total per side plus the difference between them.
   2. For a side, the user adds a card by **scanning** or by **manual search**:
      - Scan: the existing engine identifies the card and the **scanned printing** becomes the entry's default printing; the user can change the printing if it is wrong (DEC-070, REQ-065).
      - Manual search: the user finds the card by name and then **chooses the correct printing** from that card's printing list; that printing's price applies (DEC-012, REQ-065).
+     - On add, the balancer fetches that card's printings and prices from the backend, caching them for the session, and shows a brief in-place loading state while they resolve (FLOW-025).
   3. The added entry shows its printing (set/collector/image), its USD price, a **foil toggle** (non-foil ↔ `usd_foil`), and a **quantity** control; the same card may be added multiple times or carry a quantity ≥ 1.
   ...
 - Edge Cases:
   - if the chosen printing has no price for the selected foil mode, the entry contributes **$0**, its price is shown in a distinct color, and a **caution-triangle** indicator marks it so the user knows the value is unknown (REQ-065)
   ...
-  - if the price artifact fails to load, the view surfaces the reason and entries show the $0 + caution treatment rather than a broken screen
+  - if a card's price fetch fails, that entry degrades to the $0 + caution treatment with a retry affordance rather than a broken screen (mirrors the card-detail on-demand fetch, FLOW-024)
 - Notes:
-  - the trade balancer is a standalone, frontend-only, ephemeral feature outside the Decrypt-Stack core loop; it makes no backend call and no `AskAiRequest`/prompt change (DEC-087)
+  - the trade balancer is a standalone, ephemeral feature outside the Decrypt-Stack core loop; it makes a read-only backend price fetch (REQ-175) but no `AskAiRequest`/prompt change (reverses the frontend-only posture of the retired DEC-087)
   - printing selection is a pricing/display layer only and does not change scan oracle-level identity, prompt context, or rulings (DEC-053, DEC-087)
   - prices are a static build-time snapshot; the UI may show the snapshot date (DEC-088, NFR-013)
```

*(Elided steps/edge cases are unchanged.)*

- Verdict:
- Reason:

---

## FLOW-025 (new) — fetch a card's printings and prices on demand and cache them

**What this decides:** whether to record a named flow for how the balancer
fetches one card's prices from the backend and remembers them for the session.

**In plain terms:** this is the price-side twin of the existing card-detail fetch
flow (FLOW-024). When the balancer needs a card's prices — because the player
added it — it asks the backend for just that card, shows a brief loading state,
and caches the answer so the same card never refetches that session. If the fetch
fails, the entry degrades to the $0-plus-caution state with a retry, and a
not-found card resolves cleanly to no printings. Nothing here is downloaded up
front.

**What happens if you say no:** the per-card fetch-and-cache behavior has no named
flow to back REQ-065/REQ-175, leaving the mechanism undocumented.

### Proposed addition — `PRD/sections/user-flows.md`, new FLOW-025

```diff
+### FLOW-025
+- Name: Fetch a card's printings and prices on demand
+- Trigger: a player adds a card to a trade side (by scan or manual search) and the balancer needs that card's printings and prices
+- Preconditions:
+  - the card's oracle id is resolved (via the shared `cardMetadata` index for search, or the scan map for a scan)
+  - the read-only price route is available (REQ-175)
+- Main Flow:
+  1. The balancer requests that one card's printings and prices from the backend by oracle id (recommended: `GET /api/cards/:oracleId/prices`), showing a brief in-place loading state on the entry.
+  2. The response carries the card's printings (printing id, set, set name, collector number, non-foil and foil USD) and the snapshot date; the balancer derives each printing's image url from its id and takes the card name from the shared `cardMetadata` index.
+  3. On success the entry shows its chosen printing, its price, the foil toggle, and quantity; the printing picker lists every printing. The result is cached for the session, so re-adding or re-opening the same card resolves from cache with no repeat request.
+- Edge Cases:
+  - if the fetch fails, the entry degrades to the $0-plus-caution treatment with a retry affordance; the failed result is not cached, so a retry re-fetches (mirrors FLOW-024)
+  - an unknown/not-found oracle id resolves to no printings and the entry shows the scan-unpriced/$0-plus-caution treatment; no prices are invented
+  - a printing with a null `usd`/`usdFoil` for the selected foil mode is kept and priced at $0 with the caution flag (REQ-065)
+- Notes:
+  - this mirrors the card-detail on-demand fetch (FLOW-024) and its per-session cache; prices ride a companion separate from the descriptive block so the question/RAG flow carries no price bytes (REQ-175)
+  - prices are a static committed snapshot served in memory; the on-demand read makes no external network call (NFR-013)
```

- Verdict:
- Reason:

---

## NFR-004 — the one-endpoint rule allows a third read-only route for prices

> **Applies only if you pick the recommended sibling route in the Blocker
> question.** If you pick the same-route option, reject this block — no new
> endpoint is added and NFR-004 is untouched.

**What this decides:** whether the product's rule that it exposes essentially one
backend endpoint is amended to also allow a third read-only route that serves
card prices.

**In plain terms:** NFR-004 is the "keep the architecture small" rule; it says
the product exposes one main endpoint (the AI answer route) plus one read-only
card-detail route, and that adding any further endpoint requires amending this
rule on purpose. Moving prices to a sibling route adds a third read-only route,
so this amendment records it — the same deliberate step taken when the
card-detail route was added as the second. It stays tiny and read-only; there are
still no microservices and no runtime sync.

**What happens if you say no:** if you still want the sibling route, it would be
an unrecorded endpoint that violates the canonical rule; if you prefer no new
endpoint, pick the same-route option in the Blocker (and this block does not
apply).

### Proposed diff — `PRD/sections/non-functional-requirements.md`, NFR-004

```diff
 ### NFR-004
 - Title: Lightweight architecture
 - Description: The core product should use the smallest reasonable architecture.
 - Constraints:
   - **Canonical rule — one main product-facing endpoint.** The core product
     exposes exactly one main product-facing backend endpoint (the answer
-    endpoint `POST /api/ask-ai`), plus the single read-only card-detail
-    retrieval route (`GET /api/cards/:oracleId`, REQ-175). Adding any further
+    endpoint `POST /api/ask-ai`), plus two read-only retrieval routes: the
+    card-detail route (`GET /api/cards/:oracleId`, REQ-175) and the Trade
+    Balancer price route (`GET /api/cards/:oracleId/prices`, REQ-066/REQ-175).
+    Adding any further
     product-facing endpoint requires amending this constraint. This is the
     single authoritative statement of the one-endpoint rule; the homes below
     echo it and must be updated together (enumerate by grep before amending —
     see `instructions/writing-rules.md`, grep-before-amend):
     REQ-012, REQ-072, REQ-094, REQ-175, `goals-and-non-goals.md`, `overview.md`,
     `instructions/technical-design-rules.md`, `quick-lookup/README.md`,
     `in-depth/README.md`, `integrations-and-data.md`, `PRD/README.md`.
     Retired index row: DEC-010.
   - no microservices
   - no runtime metadata sync tooling
```

- Verdict:
- Reason:

---

## NFR-013 — the price footprint rule is reframed for backend-served, on-demand prices

**What this decides:** whether the requirement that governs the price data's size
and freshness is rewritten to describe backend-served, fetched-per-card prices
(with the giant frontend file gone) instead of a lazy up-front frontend download.

**In plain terms:** NFR-013 today frames the price data as a frontend file that
loads lazily on first open and must stay within a mobile-friendly budget. After
the backend move there is no frontend price file at all: prices come from the
backend one card at a time, and the only up-front frontend cost is the slim
shared `cardMetadata` index. This change rewrites NFR-013 to say exactly that —
the balancer costs nothing at app startup, prices are fetched on demand and
cached per session, and the data is still a static committed snapshot with no
live sync (now served from the backend in memory). The honesty guarantees (a
shown snapshot date, no live-quote impression) are kept.

**What happens if you say no:** NFR-013 keeps describing a frontend file that no
longer exists, contradicting the amended REQ-066.

### Proposed diff — `PRD/sections/non-functional-requirements.md`, NFR-013

```diff
 ### NFR-013
 - Title: Trade-price data footprint and freshness
-- Description: The printing-level price artifact (REQ-066) must not cost users who never open the Trade Balancer, and its static-snapshot nature must be honest and clearly bounded.
+- Description: The printing-level price data (REQ-066) must not cost users who never open the Trade Balancer, and its static-snapshot nature must be honest and clearly bounded. Prices are served from a committed backend artifact on demand (REQ-175), not downloaded up front.
 - Constraints:
-  - the price artifact is lazy-loaded only when the Trade Balancer is first opened; app startup and the MTG Assistant flow are unaffected for users who never open it (mirrors the NFR-010 scan-artifact posture)
+  - there is no up-front price download: the ~38 MB frontend price file is removed, and a card's prices are fetched from the backend only when that card is added, cached per session (FLOW-025). App startup and the MTG Assistant flow are unaffected, and the balancer's only up-front frontend cost is the slim shared `cardMetadata` index (REQ-174)
   - prices are a static build-time snapshot: no runtime price fetch, no runtime sync, and no automated/scheduled refresh; the committed snapshot is refreshed only through the human-approved data pipeline (`data:refresh` then `data:build`)
+  - "no runtime price fetch" means no live/external price lookup; the on-demand backend read serves the committed snapshot from memory with no external network call, exactly like the card-detail route (REQ-175)
   - the artifact records a snapshot date, and the UI may surface it so users understand prices are point-in-time, not live
-  - artifact size, lazy-load time, and lookup latency should stay within a mobile-friendly budget; loading and pricing must not block or jank the trade UI
+  - per-card fetch and pricing must stay within a mobile-friendly budget and must not block or jank the trade UI; the on-demand fetch shows a brief in-place loading state and degrades to $0-plus-caution with retry on failure (FLOW-025)
   - USD-only price fields (`usd`, `usd_foil`); no live market integration
 - Dependencies:
-  - DEC-087
-  - DEC-088
   - REQ-066
   - NFR-001
   - NFR-004
   - NFR-010
+  - REQ-175
+  - FLOW-025
 - Notes:
   - the trade balancer is an optional top-level feature; like scanning, its data budget is scoped to users who actually use it
+  - moving pricing to the backend (this reframing) reverses the frontend-only posture of the retired DEC-087; the freshness script's price target artifact moves to the backend map, re-pointed later by the freshness track
```

- Verdict:
- Reason:

---

## Blocker questions

### BLOCK-01 — the exact backend endpoint shape for prices

**What this decides:** whether a card's prices are served from a new read-only
route of their own, or added to the existing card-detail route behind an opt-in
switch.

**In plain terms:** the owner set that prices must be a **separate** field/
sub-resource, not merged into the rules payload, so the question/RAG flow never
downloads price bytes. Two clean shapes satisfy that:

- **Option A — a sibling read-only route `GET /api/cards/:oracleId/prices`
  (recommended).** Cleanest split: the card-detail popup and the AI answer path
  carry zero price bytes, and the balancer carries zero rules text. It is the
  owner's own example, and its reasons (weekly-refreshing prices vs static rules;
  per-printing prices vs one rules block) map to it directly. **Cost:** it is the
  product's *third* product-facing endpoint, so it amends the one-endpoint rule
  (NFR-004) and its ~11 echo homes — the same deliberate path used to add the
  second endpoint.

- **Option B — the same route `GET /api/cards/:oracleId` with an opt-in prices
  form** (a query parameter such as `?include=prices` that adds a separate
  `printings` key to the response, omitted by the popup/ask-ai path). **Benefit:**
  adds no new endpoint, so NFR-004 and its echoes are untouched. **Cost:** a
  query-param variant is a slightly less clean contract than a dedicated
  sub-resource.

**Recommendation:** Option A (the sibling route). The proposal above is authored
for it. If you prefer to avoid the NFR-004 change, pick Option B — then reject
the NFR-004 block and read REQ-175's price companion as served from the existing
route under the opt-in parameter (a one-line change to that block).

- Verdict (A / B):
- Reason:
