# GATE QUESTIONS — trade-balancer-first-card-ux

**Decide.** Ten product-truth changes, all edits to text that already exists —
no new REQ, FLOW, or DEC numbers. Answer each block's `- Verdict:` with
`accept`, `edit`, or `reject` (a reason is required for edit and reject), then
merge the pull request. That merge is the signal to build.

All ten describe the same four player-facing changes to the Trade Balancer:
pick the printing before the card is added, start the foil toggle in whichever
mode actually has a price, keep a long printing list inside a scrollable box,
and wake the backend when the screen opens so the first card prices fast.

---

## REQ-064 — Wake the backend when the Trade Balancer opens

**What this decides:** whether the Trade Balancer is allowed to send one
throwaway "are you awake?" request to the backend the moment the screen opens.

**In plain terms:** today the first card a player adds takes about four seconds
to show a price, because that add is the first thing that wakes the server up.
Nothing is slow after that — the next cards price in about a fifth of a second.
This change has the balancer knock on the door as soon as the screen opens, so
the server wakes while the card list is still downloading and the player is
still typing. It reuses the plain health check the site already has
(`GET /api/health`, the endpoint used for deployment and uptime checks), sends
and reads no card data, shows nothing, and is ignored if it fails — so local
development with no backend running is unaffected. REQ-064 is the requirement
that defines the two-sided Trade Balancer screen and today says the balancer's
only backend traffic is the price lookup; that sentence has to widen for this.
A scheduled ping that keeps the server permanently warm is a separate
infrastructure decision and stays out.

**What happens if you say no:** the first card of every session keeps taking
about four seconds to price, and the other nine blocks still stand on their own.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ REQ-064 — Acceptance Criteria / Constraints
   - the view is reachable from the top-level navigation menu (REQ-067) and the MTG Assistant flow is unaffected
   - the trade state is **ephemeral**: no history, no persistence across reload, no marketplace/transaction handling, and no automated balancing suggestions
+  - when the view opens it issues **one fire-and-forget warm-up request** to the backend's existing health check (`GET /api/health`) alongside its `cardMetadata` load, so a cold backend wakes while the card list downloads and the player types instead of that wait landing on the first card's price fetch. It sends and reads no product data, renders no UI, and never blocks, disables, or surfaces an error on search when it fails or when no backend is running (mock-default local dev unaffected)
 - Constraints:
-  - the AI answer path stays frozen: no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, or `POST /api/ask-ai`. The balancer prices cards only through a read-only backend price fetch (REQ-175); printing identity is never pushed into any prompt, rulings, or answer payload
+  - the AI answer path stays frozen: no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, or `POST /api/ask-ai`. The balancer prices cards only through a read-only backend price fetch (REQ-175), and its only other backend traffic is the warm-up ping to the existing `GET /api/health`, which carries no product data in either direction; printing identity is never pushed into any prompt, rulings, or answer payload
+  - the warm-up adds **no endpoint and no schedule**: it reuses the health check that already exists for local, deployment, and uptime checks, and a scheduled keep-warm ping stays out of scope
   - USD only (Scryfall `usd` / `usd_foil`); EUR, tix, etched-foil, and grading/condition are out of scope for v1
   - mobile-first, touch-friendly layout (NFR-001)
```

- Verdict:
- Reason:

---

## REQ-065 — Pick the printing before the card is added, and start foil in the mode that has a price

**What this decides:** three things about adding a card by name — that the
player picks which printing (which set's version of the card) before it lands on
the side, that the foil switch starts in whichever mode actually has a price,
and that a long printing list lives in a scrollable box.

**In plain terms:** REQ-065 is the requirement covering a trade entry — its
printing, its foil switch and its quantity — and it already says a player who
searches by name "chooses the correct printing from that card's printing list
before it is added". The app stopped doing that in the price rework: today
tapping a suggestion drops the card straight onto the side with whatever
printing happens to sort first, and the player has to find "Change printing" to
correct it. This block puts the picker back in front of the add, keeps the scan
path exactly as it is, and adds two things REQ-065 does not yet cover. First,
foil: about one card in fifteen sorts onto a printing that was only ever printed
in foil, so it opens at $0.00 with a warning triangle even though the foil price
is right there — the toggle should simply start in the mode that has a price,
and stop touching it once the player has moved it themselves. Second, the box:
Sol Ring has 128 printings and the list renders all of them, making the page ten
thousand pixels tall and pushing the other side of the trade out of reach, so
the picker gets a scroll region, a count in its header, lazily loaded pictures,
and a filter by set once a card has more than eight printings.

**What happens if you say no:** cards keep landing on a random set, one card in
fifteen keeps opening at $0.00 with a warning, and the picker keeps unrolling
the page. REQ-065's existing "chooses the printing before it is added" sentence
stays contradicted by the shipped app.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ REQ-065 — Acceptance Criteria
   - **scan input:** the existing scan engine identifies the card and the **scanned printing** (its `Candidate.card_id`, DEC-070) is the entry's default printing; the user can **change the printing** to any other printing of that card
-  - **manual search input:** the user finds a card by name via the existing local search (DEC-012), then **chooses the correct printing** from that card's printing list before it is added; the chosen printing's price applies
-  - the **foil toggle** switches the entry's contribution between `usd` and `usd_foil`; default is non-foil
+  - **manual search input:** the user finds a card by name via the existing local search (DEC-012); tapping a suggestion fetches that card's printing list and shows the **printing picker in place of the suggestions**, with a brief loading state, and the entry is added carrying the printing the player taps — the choice happens **before the card is added**, and the chosen printing's price applies. Cancelling returns to the search box. If that pre-add fetch fails or the card has no printings, the card is added anyway in the $0-plus-caution state with the retry affordance, so manual search stays the permanent fallback input path
+  - the **foil toggle** switches the entry's contribution between `usd` and `usd_foil`. Whenever an entry receives a printing — picked before an add, resolved from a scan, changed, or re-fetched on retry — the mode is **auto-selected from that printing's own prices**: foil when only `usd_foil` exists, non-foil when only `usd` exists, and otherwise the entry's current mode is kept (a new entry starts non-foil). The player may still toggle into a mode with no price, which keeps the $0-plus-caution treatment below
+  - the **printing picker** — the same component used before an add and by "Change printing" — heads with the card's printing count (`N printings`, computed from the fetched list, never from a stored field), lists printings **newest release first** (REQ-066), **region-scrolls** inside a short box instead of growing the page with the card's printing count, lazy-loads its row images, offers a **set-name/set-code filter** once a card has more than eight printings, and scrolls the currently selected printing into view when it opens
   - **quantity/multiples:** the same card (or printing) may appear multiple times on a side, via repeated adds and/or a per-entry quantity control; each unit counts toward the side total; the stack duplicate-block does not apply
   - **missing price:** when the selected foil mode has no price for the chosen printing, the entry's contribution defaults to **$0**, the entry's price is rendered in a **distinct color** from priced entries, and the entry shows a **caution-triangle** indicator communicating that the value is unknown
   - each entry can be **removed** from its side
-  - a card's printings and prices are fetched from the backend when the card is added and cached per session (REQ-066, REQ-175, FLOW-025); the entry shows a brief in-place loading state while it resolves. The card's name and image come from the shared local `cardMetadata` index (REQ-174). If the price fetch fails, the entry degrades to the $0-plus-caution treatment with a retry affordance rather than a broken row
+  - a card's printings and prices are fetched from the backend once per card and cached per session (REQ-066, REQ-175, FLOW-025). On a manual search that fetch runs when the suggestion is tapped, so the picker carries the loading state and the entry appears already priced from cache; on a scan it runs on add and the entry shows a brief in-place loading state while it resolves. The card's name and image come from the shared local `cardMetadata` index (REQ-174). If the price fetch fails, the entry degrades to the $0-plus-caution treatment with a retry affordance rather than a broken row
```

- Verdict:
- Reason:

---

## REQ-066 — Newest printing first, decided when the price file is built

**What this decides:** the order a card's printings come back in — newest set
first instead of the effectively random order they are in today.

**In plain terms:** REQ-066 is the requirement for the committed price file the
backend serves — one entry per card, listing each printing with its set,
collector number and USD prices. That file currently lists a card's printings
sorted by Scryfall's internal id, which is a random-looking string, so Sol Ring
opens on "Lorwyn Eclipsed Commander #57" for no reason a player can see. This
sorts them by release date instead, newest first, when the file is built. The
release date is used only to sort — it is not written into the file, so nothing
gets bigger and no new field appears anywhere. One caveat worth knowing: the
committed file only takes the new order the next time it is rebuilt, which is
your weekly `npm run data:refresh-pr` run, because the raw Scryfall download it
is built from lives only on your machine. Until then the picker still works
fine, since the player picks the printing rather than accepting a default.

**What happens if you say no:** printings keep coming back in random order, and
the picker's first row stays meaningless.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ REQ-066 — Acceptance Criteria / Notes
   - the committed price artifact is **backend-only**, brotli-compressed (`apps/backend/data/cardPrintingPricesByOracleId.json.br`), keyed by **oracle id**; per oracle it carries the card's list of printings, each with printing id, set code, set name, collector number, `usd` (non-foil), and `usd_foil`; it records a **snapshot date**. Card name and image url are **not** stored per printing — name comes from the shared `cardMetadata` index (REQ-174) and image url is derived from the printing id (Scryfall template)
+  - each card's printings are emitted **newest release first** — Scryfall `released_at` descending, then collector number (numeric-aware, ascending), then printing id as a deterministic final tiebreak; a printing with a missing or unparseable release date sorts last. This order is part of the artifact and wire contract, so the picker and any default printing read newest-first with no client-side sort. `released_at` is a **build-time sort key only** and is not emitted: the per-printing field set, the artifact's size, and the route's wire response are unchanged
   - the backend brotli-decodes the committed price map into memory once at startup and serves one card's printings on demand (REQ-175) with **no runtime network call**, exactly like `cardDetailByOracleId.json.br`; the former `apps/frontend/public/data/cardPrintingPrices.json` is deleted and is no longer downloaded up front
   - the committed backend price map keeps the Lambda deployment inside AWS's **250 MB unzipped quota**: `scripts/lambda-package-budget.test.mjs` passes with the price map bundled (the whole `apps/backend/data/` folder ships in the Lambda zip), and the build records the measured price-map size so the budget headroom stays visible
-  - a scanned printing prices directly (its oracle resolves via the scan map, then the card's fetched printing list is matched by printing id); the manual picker lists every printing of a card from the fetched list
+  - a scanned printing prices directly (its oracle resolves via the scan map, then the card's fetched printing list is matched by printing id); the manual picker lists every printing of a card from the fetched list, in that emitted newest-first order
@@ REQ-066 — Notes
   - source-bulk choice and the exact filter/field set are build-time details validated by outcome (every priced gameplay printing present, prices display correctly); `all-cards` (every language) is unnecessary because prices are per printing
   - the freshness script's price **target artifact** changes from the deleted frontend file to the backend map; re-pointing it is a later change tracked by the freshness track, not resolved here
+  - the committed artifact takes the newest-first order at its next rebuild (`npm run data:build`, or the weekly `npm run data:refresh-pr`, REQ-195), since the raw Scryfall bulk source is gitignored and lives only in the owner's checkout. Until that rebuild the served order is the previous one; the picker is unaffected because the player chooses the printing rather than accepting a default
```

- Verdict:
- Reason:

---

## FLOW-009 — The trade flow: choose the printing, then the card lands

**What this decides:** the step-by-step description of building a trade — the
document a future agent reads to know what the screen is supposed to do.

**In plain terms:** FLOW-009 walks through opening the Trade Balancer, adding
cards to two sides by scan or by name, and reading the difference. Its
manual-search step already says the player "chooses the correct printing from
that card's printing list", so this mostly makes the surrounding steps match:
the printing list is fetched when the suggestion is tapped rather than after the
add, the screen sends its wake-up ping on open, and two new edge cases are
written down — a printing that only has a foil price opens foil, and a failed
pre-add lookup still lets the card onto the side.

**What happens if you say no:** the flow keeps describing an add-then-fix
sequence that the other blocks change, and future work reads a stale flow.

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ FLOW-009
 - Preconditions:
   - app is loaded
-  - the shared local card index (`cardMetadata`, REQ-174) is available for search and identity; a card's prices are fetched from the backend when it is added (REQ-066, REQ-175, FLOW-025)
+  - the shared local card index (`cardMetadata`, REQ-174) is available for search and identity; a card's prices are fetched from the backend when its search suggestion is tapped, or when a scanned card is added (REQ-066, REQ-175, FLOW-025)
 - Main Flow:
-  1. The Trade Balancer opens with two sides (**Side A** and **Side B**), each an empty card list, and a running total per side plus the difference between them.
+  1. The Trade Balancer opens with two sides (**Side A** and **Side B**), each an empty card list, and a running total per side plus the difference between them. On open the balancer also sends one fire-and-forget warm-up request to the backend's health check, so a cold backend wakes while the card list downloads and the player types; it shows nothing and is ignored if it fails (REQ-064).
   2. For a side, the user adds a card by **scanning** or by **manual search**:
      - Scan: the existing engine identifies the card and the **scanned printing** becomes the entry's default printing; the user can change the printing if it is wrong (DEC-070, REQ-065).
-     - Manual search: the user finds the card by name and then **chooses the correct printing** from that card's printing list; that printing's price applies (DEC-012, REQ-065).
-     - On add, the balancer fetches that card's printings and prices from the backend, caching them for the session, and shows a brief in-place loading state while they resolve (FLOW-025).
+     - Manual search: the user finds the card by name, taps the suggestion, and **chooses the printing from that card's printing list before the card is added** — newest release first, each row showing set, collector number, both prices and a thumbnail; that printing's price applies (DEC-012, REQ-065).
+     - The balancer fetches that card's printings and prices from the backend once and caches them for the session: on a manual search when the suggestion is tapped (the picker carries the loading state, and the entry then appears already priced), on a scan when the card is added (the entry shows a brief in-place loading state) (FLOW-025).
   3. The added entry shows its printing (set/collector/image), its USD price, a **foil toggle** (non-foil ↔ `usd_foil`), and a **quantity** control; the same card may be added multiple times or carry a quantity ≥ 1.
@@ FLOW-009 — Edge Cases
   - if the chosen printing has no price for the selected foil mode, the entry contributes **$0**, its price is shown in a distinct color, and a **caution-triangle** indicator marks it so the user knows the value is unknown (REQ-065)
+  - a printing priced in only one mode opens in that mode — a foil-only printing opens foil, a non-foil-only printing opens non-foil — so a priced card never opens at $0; the player can still toggle into the unpriced mode and get the $0 + caution treatment (REQ-065)
+  - if the pre-add printings fetch fails on a manual search, the card is added anyway in the $0 + caution state with the retry affordance, rather than blocking the add — manual search stays the permanent fallback input path (REQ-065, FLOW-025)
   - the same card may appear more than once on a side; the stack duplicate-block (FLOW-004) and 10-card cap do not apply to trade sides (DEC-087)
   - toggling foil on an entry with no `usd_foil` (or off with no `usd`) applies the $0 + caution treatment for that mode
```

- Verdict:
- Reason:

---

## FLOW-025 — The printing lookup now runs when the suggestion is tapped

**What this decides:** when the app asks the backend for a card's printings and
prices — on the suggestion tap instead of after the card is added.

**In plain terms:** FLOW-025 describes the one small request the balancer makes
per card: give me this card's printings and their USD prices, cached so the same
card is never asked for twice in a session. Nothing about the request or the
response changes. What changes is the moment it fires on the search path — when
the player taps a suggestion, so the printing list is in hand before the card is
added — and what the player sees while it runs: the loading state moves from the
row on the side to the picker. The failure behavior is written down too: if the
lookup fails before an add, the card is added anyway in the $0-plus-warning
state with the retry button, so search never becomes a dead end.

**What happens if you say no:** the lookup stays tied to the add, which is
incompatible with picking a printing before the add.

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ FLOW-025
-- Trigger: a player adds a card to a trade side (by scan or manual search) and the balancer needs that card's printings and prices
+- Trigger: a player taps a card's search suggestion in the Trade Balancer, or adds a scanned card to a trade side, and the balancer needs that card's printings and prices
 - Preconditions:
   - the card's oracle id is resolved (via the shared `cardMetadata` index for search, or the scan map for a scan)
   - the read-only price route is available (REQ-175)
 - Main Flow:
-  1. The balancer requests that one card's printings and prices from the backend by oracle id (recommended: `GET /api/cards/:oracleId/prices`), showing a brief in-place loading state on the entry.
+  1. The balancer requests that one card's printings and prices from the backend by oracle id (recommended: `GET /api/cards/:oracleId/prices`), showing a brief loading state — in the printing picker on the manual-search path, where the request runs on the suggestion tap, and in place on the entry on the scan path, where it runs on add.
   2. The response carries the card's printings (printing id, set, set name, collector number, non-foil and foil USD) and the snapshot date; the balancer derives each printing's image url from its id and takes the card name from the shared `cardMetadata` index.
-  3. On success the entry shows its chosen printing, its price, the foil toggle, and quantity; the printing picker lists every printing. The result is cached for the session, so re-adding or re-opening the same card resolves from cache with no repeat request.
+  3. On success the entry shows its chosen printing, its price, the foil toggle in the mode that printing has a price for (REQ-065), and quantity; the printing picker lists every printing, newest release first (REQ-066), headed with the card's printing count and scrolling inside its own box. The result is cached for the session, so re-adding or re-opening the same card resolves from cache with no repeat request — an entry added from the picker is priced from that cache with no second request.
 - Edge Cases:
   - if the fetch fails, the entry degrades to the $0-plus-caution treatment with a retry affordance; the failed result is not cached, so a retry re-fetches (mirrors FLOW-024)
+  - if the fetch fails **before** an add on the manual-search path, the picker does not trap the player: the card is added immediately in the same $0-plus-caution state with its retry affordance (REQ-065)
   - an unknown/not-found oracle id resolves to no printings and the entry shows the scan-unpriced/$0-plus-caution treatment; no prices are invented
   - a printing with a null `usd`/`usdFoil` for the selected foil mode is kept and priced at $0 with the caution flag (REQ-065)
 - Notes:
   - this mirrors the card-detail on-demand fetch (FLOW-024) and its per-session cache; prices ride a companion separate from the descriptive block so the question/RAG flow carries no price bytes (REQ-175)
   - prices are a static committed snapshot served in memory; the on-demand read makes no external network call (NFR-013)
+  - the balancer's warm-up ping on open (REQ-064) is unrelated traffic to the existing health check and carries no card data; it exists so this fetch does not absorb the backend's cold start
```

- Verdict:
- Reason:

---

## PRD/sections/trade-balancer/README.md — the feature's current-state description

**What this decides:** the plain description of how the Trade Balancer works
today, which is the first document anyone reads about this feature.

**In plain terms:** this file is the current-state spec — it says what the
feature does now, in prose, and it must match the requirements. Its
"Adding a card to a side" section currently says a searched card is added
"defaulting to whichever printing the on-add fetch returns first" and that the
foil default is non-foil; both stop being true under the blocks above. It also
says the balancer's only backend traffic is the price lookup, which the wake-up
ping changes. The edits rewrite those bullets, add one describing the picker,
and record the picker's size limit and the wake-up call under "Measured bounds".

**What happens if you say no:** the feature's own description contradicts its
requirements, which is the drift this run exists to fix.

```diff
--- a/PRD/sections/trade-balancer/README.md
+++ b/PRD/sections/trade-balancer/README.md
@@ What it is
 toggle and a quantity. The screen opens with only the shared local card index
-in hand; the moment a card is added, it fetches that one card's printings and
-prices from the backend, prices from a committed snapshot (not a live quote),
+in hand; it wakes the backend with one throwaway health-check ping as it opens,
+then fetches a card's printings and prices the moment the player taps that
+card's search suggestion (or adds a scanned card), pricing from a committed
+snapshot (not a live quote),
 and keeps no history — close it and the trade is gone. It sits outside the MTG
 Assistant core loop and changes nothing about it or the AI answer path.
@@ The two-sided screen
 - Built: reached as the `trade-balancer` feature-portal destination; the MTG
   Assistant start screen and flow are unaffected. The portal chrome and routing
   are owned at the feature-portal level (DEC-095 / REQ-067 / DEC-157), not by
   this feature. (REQ-064)
+- Built: on open the balancer fires **one fire-and-forget warm-up request** to
+  the backend's existing health check (`GET /api/health`) beside its
+  `cardMetadata` load, so a cold backend wakes while the card list downloads
+  and the player types instead of that wait landing on the first card's price.
+  It carries no product data, renders no UI, and never blocks or errors search
+  when it fails or when no backend is running. (REQ-064)
@@ Adding a card to a side
-- Built: **manual search input** — the player finds a card by name via the
-  shared `cardMetadata` index (REQ-174) and adds it; the entry appears
-  immediately, defaulting to whichever printing the on-add fetch returns first,
-  with a brief loading state while it resolves. The player then **chooses the
-  correct printing** via the same "Change printing" affordance a scanned entry
-  uses, if the default isn't the one they want. Manual search is the permanent
-  fallback and stays fully functional when the camera is unavailable — the
-  surface closes and the reason is surfaced rather than breaking the screen.
-  (REQ-065, FLOW-009, FLOW-025)
-- Built: the **foil toggle** switches an entry's contribution between `usd` and
-  `usd_foil`; the default is non-foil. (REQ-065)
+- Built: **manual search input** — the player finds a card by name via the
+  shared `cardMetadata` index (REQ-174); tapping the suggestion fetches that
+  card's printings and shows the **printing picker in place of the
+  suggestions**, with a brief loading state, and the card is added carrying the
+  printing the player taps — the printing is chosen **before** the card lands
+  on the side. Cancelling returns to the search box. If that pre-add fetch
+  fails, the card is added anyway in the $0-plus-caution state with its retry
+  affordance. Manual search is the permanent fallback and stays fully
+  functional when the camera is unavailable — the surface closes and the reason
+  is surfaced rather than breaking the screen. (REQ-065, FLOW-009, FLOW-025)
+- Built: the **printing picker** — the same component before an add and behind
+  "Change printing" — heads with the card's printing count (`N printings`,
+  counted from the fetched list), lists printings **newest release first**
+  (REQ-066), **region-scrolls** in a short box instead of growing the page,
+  lazy-loads its row images, filters by set name or code once a card has more
+  than eight printings, and scrolls the selected printing into view on open.
+  (REQ-065, `screen-layout.md`)
+- Built: the **foil toggle** switches an entry's contribution between `usd` and
+  `usd_foil`. Whenever an entry receives a printing — picked before an add,
+  resolved from a scan, changed, or re-fetched on retry — the mode is
+  **auto-selected from that printing's prices**: foil when only the foil price
+  exists, non-foil when only the non-foil price exists, otherwise the entry's
+  current mode is kept (a new entry starts non-foil). The player can still
+  toggle into a mode with no price, which keeps the $0-plus-caution treatment.
+  (REQ-065)
@@ Contract posture
 - Built: **contract-frozen on the AI answer path, with one read-only backend
   fetch of its own** — no change to `AskAiRequest`, Zod schemas, `GameContext`,
   prompt assembly, the provider boundary, or `POST /api/ask-ai`. The balancer's
-  only backend traffic is the read-only price route
-  `GET /api/cards/:oracleId/prices` (REQ-175), which the question/RAG flow
-  never touches and which carries no rules text. (REQ-064, REQ-175)
+  only product backend traffic is the read-only price route
+  `GET /api/cards/:oracleId/prices` (REQ-175), which the question/RAG flow
+  never touches and which carries no rules text; its only other call is the
+  warm-up ping to the existing `GET /api/health`, which carries no product data
+  in either direction and adds no endpoint. (REQ-064, REQ-175)
@@ Measured bounds
 - Price freshness line: date-level copy only, e.g. `Prices as of 5 June 2026`;
   stays on one line at 390×844 (`scrollWidth` 299 = `clientWidth`); an
   unparseable `snapshotDate` omits the line entirely. (REQ-145, `screen-layout.md`)
+- Printing picker: **region-scrolls** at about five to six rows, capped near
+  `40vh`, so the page never grows with a card's printing count — the corpus
+  maximum is 771 printings (a basic land) and Sol Ring has 128, which
+  previously rendered a 10,748 px picker on an 844 px viewport and pushed Side
+  B out of reach. Row images are lazy-loaded rather than all requested on open,
+  and a set filter appears above eight printings. (REQ-065, `screen-layout.md`)
+- First-card wait: the balancer's warm-up ping on open overlaps the backend's
+  cold start (measured ~4.2 s cold against ~0.2 s warm on the live price route)
+  with the `cardMetadata` download and the player's typing, so the wait is
+  hidden rather than removed. A scheduled keep-warm ping is deliberately out of
+  scope. (REQ-064)
```

- Verdict:
- Reason:

---

## PRD/sections/screen-layout.md — the printing picker must stay inside the screen

**What this decides:** the layout rule that a card's printing list scrolls
inside its own box instead of stretching the page.

**In plain terms:** this file holds one row per screen saying how it must fit on
a phone. The Trade Balancer's row already says the card lists scroll inside
their region and that totals stay visible without page-scrolling; the printing
list was never covered, and it is the one thing that breaks the rule — 128
printings make the page ten thousand pixels tall. This adds the picker to the
same rule and records the numbers.

**What happens if you say no:** there is no written layout rule stopping the
picker from unrolling the page again.

```diff
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ #### Trade Balancer
 | Purpose | Two-sided USD trade comparison |
 | Phone | Shell/full destination width; sides stack; lists region-scroll; primary totals visible without hunting |
 | Desktop/tablet | Shell 92%/48rem (or destination equivalent); paired sides use shell width, not unused ultra-wide bands; content-sized vertically (DEC-145) |
-| Fit | No page scroll for totals/primary actions; entry lists region-scroll |
+| Fit | No page scroll for totals/primary actions; entry lists **and the printing picker** region-scroll |
+| Printing picker | Region-scrolls inside the side at about 5-6 rows, capped near `40vh`; the page never grows with a card's printing count (Sol Ring 128, corpus maximum 771). Row images lazy-load instead of all loading on open, a set-name/code filter appears above 8 printings, and the selected printing is scrolled into view on open (REQ-065, live observation 2026-09-09: 128 rows previously rendered 10,748 px tall on an 844 px viewport and pushed Side B to y≈11,500) |
 | Price freshness | Date-level copy only — `Prices as of 5 June 2026`, formatted from the artifact's ISO `snapshotDate` with no raw `T`, milliseconds, or zone suffix, so it never reads as a live quote. One line at 390x844 (`scrollWidth` 299 = `clientWidth`). An unparseable artifact value omits the line entirely rather than printing raw data (ui-review, 2026-08-11, REQ-145) |
-| Notes | DEC-087, DEC-145, REQ-145 |
+| Notes | DEC-087, DEC-145, REQ-145, REQ-065 |
```

- Verdict:
- Reason:

---

## PRD/sections/system-map.md — the map's Trade Balancer and price-build entries

**What this decides:** the one-paragraph summaries in the repository map that
describe the Trade Balancer and the price-file build.

**In plain terms:** the system map is the index a new agent reads to find where
things live and what they do. Its Trade Balancer paragraph currently says cards
are "added immediately" and default to "the fetch's first result" — the exact
behavior these changes replace — and its price-build paragraph says nothing
about the order printings come out in. Both get corrected. No behavior is
decided here that the blocks above have not already decided; this keeps the map
honest.

**What happens if you say no:** the map keeps describing the old add-then-fix
behavior and future agents plan against it.

```diff
--- a/PRD/sections/system-map.md
+++ b/PRD/sections/system-map.md
@@ ### Printing-price artifact build
-- Summary: The printing-price projection is unified into the existing card-detail build — one pass over the Scryfall bulk source emits both the card-detail map and a backend printing-price map for the Trade Balancer (per oracle id, every qualifying printing's `usd`/`usd_foil` plus set/collector, with a top-level snapshot date; card name and image are not repeated per printing). The separate `build-card-prices.mjs` script is retired. Committed brotli-compressed to keep the Lambda package inside its 250 MB unzipped quota (`scripts/lambda-package-budget.test.mjs`), brotli-decoded once at backend startup, mirroring the brotli Commander Spellbook artifacts in the same directory. Static snapshot, human-approved refresh, served on demand by the backend with no runtime network call. Its standing refresh cadence is a weekly one-command local script the owner runs (`npm run data:refresh-pr`), which runs the `data:refresh` → `data:build` pipeline and, when a committed artifact changed, opens a pull request to `main` the owner merges (REQ-195).
+- Summary: The printing-price projection is unified into the existing card-detail build — one pass over the Scryfall bulk source emits both the card-detail map and a backend printing-price map for the Trade Balancer (per oracle id, every qualifying printing's `usd`/`usd_foil` plus set/collector, with a top-level snapshot date; card name and image are not repeated per printing). Each card's printings are emitted **newest release first** — `released_at` descending, then collector number, then printing id — and that order is the artifact and wire contract; the release date is a build-time sort key only and is never emitted, so the field set and artifact size are unchanged (REQ-066). The separate `build-card-prices.mjs` script is retired. Committed brotli-compressed to keep the Lambda package inside its 250 MB unzipped quota (`scripts/lambda-package-budget.test.mjs`), brotli-decoded once at backend startup, mirroring the brotli Commander Spellbook artifacts in the same directory. Static snapshot, human-approved refresh, served on demand by the backend with no runtime network call. Its standing refresh cadence is a weekly one-command local script the owner runs (`npm run data:refresh-pr`), which runs the `data:refresh` → `data:build` pipeline and, when a committed artifact changed, opens a pull request to `main` the owner merges (REQ-195).
@@ ## Trade balancer
-- Summary: Ephemeral two-sided card-value comparison. The screen opens with only the shared `cardMetadata` index in hand; each side is a list of card entries built via scan or manual search, added immediately and priced by a read-only backend fetch on add (`GET /api/cards/:oracleId/prices`, cached per session). Each entry resolves to a specific printing (defaulting to the scanned printing or the fetch's first result, changeable via the same picker either way), with a foil toggle (non-foil ↔ `usd_foil`), a quantity/multiples, and one-tap removal. Side total = `Σ qty × (foil ? usdFoil : usd)`; the view shows each side's total and the live difference. Missing prices, and a failed price fetch, both default to $0 with a distinct color + caution-triangle indicator; a failed fetch also carries a retry affordance. Scanning is per-side and one camera at a time; when the camera is unavailable the surface closes, manual search stays fully functional, and the reason is surfaced (DEC-050). Printing choice is a pricing/display concern only — it never reaches prompt context, rulings, or any request payload, and the AI answer path (`POST /api/ask-ai`) is untouched. The snapshot is surfaced as date-level copy (`Prices as of 5 June 2026`) formatted from the response's ISO `snapshotDate`, never the raw timestamp, so it cannot read as a live quote; an unparseable value omits the line rather than printing raw artifact data (REQ-145).
+- Summary: Ephemeral two-sided card-value comparison. The screen opens with only the shared `cardMetadata` index in hand and fires one fire-and-forget warm-up ping at the existing `GET /api/health` so a cold backend wakes while the card list downloads (REQ-064). Each side is a list of card entries built via scan or manual search, priced by a read-only backend fetch (`GET /api/cards/:oracleId/prices`, cached per session): a scanned card is added immediately and priced on add, while a manual search fetches that card's printings when the suggestion is tapped and adds the card with the printing the player picks. Each entry resolves to a specific printing (the picked printing on search, the scanned printing on scan, changeable via the same picker either way; the picker heads with the card's printing count, lists newest release first, region-scrolls, lazy-loads row images, and filters by set above 8 printings), with a foil toggle (non-foil ↔ `usd_foil`) whose mode auto-selects from the printing's available prices, a quantity/multiples, and one-tap removal. Side total = `Σ qty × (foil ? usdFoil : usd)`; the view shows each side's total and the live difference. Missing prices, and a failed price fetch, both default to $0 with a distinct color + caution-triangle indicator; a failed fetch also carries a retry affordance, and a pre-add fetch failure adds the card in that same state rather than blocking the add. Scanning is per-side and one camera at a time; when the camera is unavailable the surface closes, manual search stays fully functional, and the reason is surfaced (DEC-050). Printing choice is a pricing/display concern only — it never reaches prompt context, rulings, or any request payload, and the AI answer path (`POST /api/ask-ai`) is untouched. The snapshot is surfaced as date-level copy (`Prices as of 5 June 2026`) formatted from the response's ISO `snapshotDate`, never the raw timestamp, so it cannot read as a live quote; an unparseable value omits the line rather than printing raw artifact data (REQ-145).
```

- Verdict:
- Reason:

---

## PRD/sections/integrations-and-data.md — the balancer's backend traffic and the wire order

**What this decides:** the integration document's statement of what the Trade
Balancer sends to the backend, and its record that printings come back
newest-first.

**In plain terms:** this file lists the app's endpoints and what each feature
sends. It says flatly that the Trade Balancer's "only backend traffic is the
read-only price route", which the wake-up ping makes untrue, and it describes
the price response without saying anything about the order printings arrive in.
The edits widen the traffic sentence, note the balancer as a caller of the
existing health check, and record the newest-first order as part of the
response. No new endpoint is created — the health check has existed all along
for deployment and uptime checks.

**What happens if you say no:** the integration record contradicts the shipped
app, and the printing order is left undocumented on the wire.

```diff
--- a/PRD/sections/integrations-and-data.md
+++ b/PRD/sections/integrations-and-data.md
@@ ### Endpoint: `GET /api/cards/:oracleId/prices`
 - each `CardPrintingPrice` carries `id` (Scryfall printing id — the frontend derives the image url from it), `set`, `setName`, `collectorNumber`, `usd` (non-foil, `number | null`), `usdFoil` (`number | null`); card name is not repeated per printing — the frontend takes it from the shared `cardMetadata` index (REQ-174)
+- `printings` arrives **newest release first** — the order the committed artifact was built in (`released_at` descending, then collector number, then printing id; REQ-066). The order is part of the contract and the client does not re-sort; no release-date field is carried on the wire
 - the product's third product-facing endpoint, permitted alongside `POST /api/ask-ai` and `GET /api/cards/:oracleId` by the one-endpoint rule (canonical: NFR-004, BLOCK-01 = A)
@@ ### Optional Endpoint: `GET /api/health`
 Purpose:
 - local development checks
 - deployment health checks
 - uptime verification
+- the Trade Balancer's fire-and-forget warm-up ping when the screen opens, so the backend's cold start overlaps the card-list download instead of the first card's price fetch (REQ-064). No product data travels in either direction, the response is discarded, and a failure is ignored
@@ ## Trade Balancer Data Strategy
-The Trade Balancer is an optional, standalone, ephemeral feature outside the Decrypt-Stack core loop. It makes no change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, or `POST /api/ask-ai` — its only backend traffic is the read-only price route `GET /api/cards/:oracleId/prices` (REQ-066, REQ-175), which the question/RAG flow never touches.
+The Trade Balancer is an optional, standalone, ephemeral feature outside the Decrypt-Stack core loop. It makes no change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, or `POST /api/ask-ai` — its only product backend traffic is the read-only price route `GET /api/cards/:oracleId/prices` (REQ-066, REQ-175), which the question/RAG flow never touches, plus one fire-and-forget warm-up ping to the existing `GET /api/health` when the screen opens, which carries no product data and adds no endpoint (REQ-064).
@@ ## Trade Balancer Data Strategy — bullets
-- per printing the artifact carries: printing id, set code, set name, collector number, `usd` (non-foil), and `usd_foil` — no card name or image url per printing (name comes from the shared `cardMetadata` index, REQ-174; image derives from the printing id); entries are indexable by oracle id (list a card's printings for the manual picker) and matched by printing id (a scanned printing prices directly)
+- per printing the artifact carries: printing id, set code, set name, collector number, `usd` (non-foil), and `usd_foil` — no card name or image url per printing (name comes from the shared `cardMetadata` index, REQ-174; image derives from the printing id); entries are indexable by oracle id (list a card's printings for the manual picker, newest release first per REQ-066) and matched by printing id (a scanned printing prices directly)
-- there is no up-front frontend download: a card's printings and prices are fetched from the backend only when that card is added to a trade side, cached per session (FLOW-025); users who never open the balancer pay no startup cost, and the balancer's only up-front frontend cost is the shared `cardMetadata` index (NFR-013)
+- there is no up-front frontend download: a card's printings and prices are fetched from the backend once per card — when its search suggestion is tapped, or when a scanned card is added — and cached per session (FLOW-025); users who never open the balancer pay no startup cost, and the balancer's only up-front frontend cost is the shared `cardMetadata` index (NFR-013)
```

- Verdict:
- Reason:

---

## PRD/sections/trade-balancer/data/cardPrintingPrices.md — the price file's ordering rule

**What this decides:** whether the price file's own documentation records that a
card's printings are stored newest-first.

**In plain terms:** this file documents the shape of the committed price file —
what each field means and how big it is. It describes the per-card printing list
without saying anything about its order, which is fine while the order is
meaningless and wrong once the order becomes a promise the picker depends on.
One sentence records it.

**What happens if you say no:** the file's own documentation omits the one
contract the picker relies on, and a future rebuild could reorder it without
anyone noticing.

```diff
--- a/PRD/sections/trade-balancer/data/cardPrintingPrices.md
+++ b/PRD/sections/trade-balancer/data/cardPrintingPrices.md
@@ Artifact shape
-- `byOracleId: Record<oracleId, { printings: CardPrintingPrice[] }>` — every
-  qualifying printing of a card, keyed by Scryfall `oracle_id`. Lets the
-  backend serve one card's whole printing list per request (`GET
-  /api/cards/:oracleId/prices`, REQ-175).
+- `byOracleId: Record<oracleId, { printings: CardPrintingPrice[] }>` — every
+  qualifying printing of a card, keyed by Scryfall `oracle_id`. Lets the
+  backend serve one card's whole printing list per request (`GET
+  /api/cards/:oracleId/prices`, REQ-175). Each card's `printings` array is
+  ordered **newest release first** — Scryfall `released_at` descending, then
+  collector number (numeric-aware, ascending), then printing id as a
+  deterministic tiebreak, with an unparseable release date sorting last. The
+  order is part of the artifact contract and is echoed verbatim on the wire;
+  `released_at` is a build-time sort key only and is **not** stored per
+  printing, so the field set and the artifact's size are unchanged (REQ-066).
```

- Verdict:
- Reason:
