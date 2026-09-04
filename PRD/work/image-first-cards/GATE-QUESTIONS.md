# Gate questions — image-first-cards

**Decide:** answer each block below with `accept`, `edit`, or `reject` (add a
reason for edit/reject). Five direction decisions (D1–D5) come first; then one
block per new or amended stable id, each carrying its complete proposed diff
against current `PRD/sections/` truth. Reject D1 and the id blocks that implement
it fall with it. D5 is a fork with a recommendation — `edit` it to pick the
endpoint alternative instead.

Nothing here has been written to `PRD/sections/`. Refinement proposes; the build
applies your accepted answers together with the code.

---

## D1 — Cards go image-first; card detail is fetched on demand, not carried locally

**What this decides:** whether the app stops downloading every card's
descriptive text up front and instead fetches one card's detail from the backend
when a player opens it — reversing today's rule that all that text is carried
locally.

**In plain terms:** today, opening the MTG Assistant or Quick Lookup screen
downloads a single 16.4 MB file holding the full descriptive text of all 33,399
cards (oracle text alone is 45.4% of it) and parses it before the screen is
usable, so first load is slow even for a player who opens one card. Current
product truth (DEC-151 and the requirements it cites) says those fields are
carried locally *so the corner detail popup and the image-fail fallback never
need to fetch*. This flips that: the up-front download shrinks to what a tile
draws (name, oracle id, image URL, colors), and the descriptive fields for one
card are loaded on demand from a committed card-detail data artifact the moment
its detail opens (delivery mechanism decided in D5). A card looks and behaves
exactly as today — only the moment its text arrives changes.

**What happens if you say no:** the app keeps downloading and parsing all
33,399 cards' descriptive text on every first load, and the slow-first-load
symptom stays. Blocks REQ-174, REQ-175, REQ-176, NFR-019, FLOW-024, and the
amendments to REQ-128, REQ-125, and FLOW-001.

- Verdict: <accept | edit | reject>
- Reason:

---

## D2 — Build all three seams in one work package

**What this decides:** whether the backend endpoint, the frontend slim + popup
fetch, and the server-side ask-ai card-text read all ship in this one package,
or get split across separate runs.

**In plain terms:** the AI-answer path (`POST /api/ask-ai`) currently reads a
card's oracle text out of the request the browser sends it. If the browser stops
carrying oracle text (the whole point of D1) without the backend first learning
to look that text up itself, the AI prompt loses card text and answers change.
So the three pieces are one change, not three: the endpoint and artifact, the
frontend slim, and the server-side read must land together for the app to keep
working end to end.

**What happens if you say no:** the work is split, and any ordering that slims
the frontend before the backend resolves card text server-side breaks the AI
prompt in between. No PRD diff of its own — this is a scope/sequencing decision
recorded in `DESIGN-BRIEF.md`.

- Verdict: <accept | edit | reject>
- Reason:

---

## D3 — When a card image fails, the fallback shows only name + oracle id

**What this decides:** what a card tile shows when its image cannot load, once
descriptive text is no longer carried locally.

**In plain terms:** today, if a card image is missing or fails, the tile falls
back to showing the card's locally carried text/metadata (including oracle text)
with no broken-image icon. Once D1 moves that text to an on-demand fetch, the
fallback no longer has it on hand. This decision says the image-fail fallback
shows only what stays local — the card name and oracle id — and does **not** fire
a detail fetch on image failure. Richer offline fallback is deferred.

**What happens if you say no:** the image-fail fallback would have to fetch
detail (adding a network call exactly when the network may be the problem) or
keep carrying text locally (defeating D1). Amends FLOW-001 and REQ-125 (see those
blocks).

- Verdict: <accept | edit | reject>
- Reason:

---

## D4 — The CloudFront/S3 compression fix is out of scope here

**What this decides:** whether the separate deploy-layer compression win is part
of this package.

**In plain terms:** large static data assets are not pre-compressed at the CDN
today (CloudFront auto-compression caps out below their size), which is a
separate, already-decided, zero-behavior-change deploy fix. It is not part of
this work, which relocates card text rather than changing how assets are served.

**What happens if you say no:** if you want compression folded in here instead,
it would widen this package into deploy-layer work. No PRD diff — recorded as a
non-goal in `DESIGN-BRIEF.md`.

- Verdict: <accept | edit | reject>
- Reason:

---

## D5 — Serve card detail as a lazy static artifact, not a new backend endpoint

**What this decides:** how one card's descriptive detail reaches the app on
demand — as a committed static data artifact the frontend lazy-loads on first
card-detail open, or as a new backend route `GET /api/cards/:oracleId`.

**In plain terms:** the app has exactly one product-facing backend route today
(`POST /api/ask-ai`; `GET /api/health` is a non-product dev/health check).
"One main backend endpoint" is a hard, repeated product rule — DEC-010 ("the
core product uses one main product-facing backend endpoint"), GOAL-002 ("keep
the core product fast and lightweight ... simple implementation"),
`technical-design-rules.md` (a second product-facing endpoint is Forbidden
Design Drift), REQ-072 ("one product-facing endpoint only (DEC-010); no new
route"), and an Explicit Non-Goal ("multiple product-facing backend
endpoints"). This work needs card detail on demand, and the app already has a
blessed pattern for heavy data loaded on first use: `cardhashes.bin` on first
scan (NFR-010) and `cardPrintingPrices.json` on first Trade Balancer open
(NFR-013) are static artifacts lazy-loaded on demand, no endpoint. This decision
serves card detail the same way — a committed static artifact keyed by oracle
id, lazy-loaded on first card-detail open and cached for the session. The
backend still needs the same data internally to resolve card text for ask-ai
(REQ-176), but that read lives inside `POST /api/ask-ai`, not a new route. So
the one-endpoint rule stays intact and needs no amendment.

**The alternative you can pick instead:** a real backend route
`GET /api/cards/:oracleId`. It buys per-card fetch granularity (download only
the card you open) but adds the product's second product-facing endpoint, which
conflicts with the rule above. Choosing it means amending DEC-010,
`goals-and-non-goals.md` (the "one main backend endpoint" line and the
"multiple product-facing backend endpoints" non-goal), `technical-design-rules.md`
(Allowed Design Direction + Forbidden Design Drift), and REQ-072 to permit a
second endpoint. Sharding the static artifact by oracle-id prefix recovers most
of that granularity without a route. **Recommendation: the lazy static
artifact.** `edit` this block to choose the endpoint, and the build will surface
the four amendments the endpoint requires.

**What happens if you say no:** rejecting the artifact approach without picking
the endpoint leaves the on-demand detail with no delivery path, blocking
REQ-175, FLOW-024, and REQ-128's fetch. (Governs REQ-175; shapes REQ-174,
FLOW-024, REQ-128, NFR-019. No standalone PRD diff — the chosen path is carried
by REQ-175's diff.)

- Verdict: <accept | edit | reject>
- Reason:

---

## REQ-174 — the up-front card list carries only what a tile draws

**What this decides:** the exact set of card fields the app downloads up front,
and that the rest is fetched on demand.

**In plain terms:** the shared card metadata that MTG Assistant and Quick Lookup
load on entry drops to the fields a tile actually renders — oracle id (`cardId`),
name, image URL, and colors — and stops carrying oracle text, type line, mana
cost/value, and sub/supertypes. Colors stays because every tile draws its
identity ring from the card's colors (FLOW-001, DEC-078); moving colors would
turn every ring silver-gray until detail loaded, a visible change this work
avoids. Autocomplete, selection, the image, and the ring keep working unchanged
off the slimmer list.

**What happens if you say no:** the up-front list keeps every descriptive field
and first load stays heavy. (Implements D1.)

### Proposed diff

**New requirement — add to `PRD/sections/functional-requirements.md`:**

```
### REQ-174
- Title: Image-first up-front card list
- Priority: high
- Description: The shared card metadata the frontend loads on entry to MTG Assistant and Quick Lookup carries only the fields a card tile renders directly — `cardId` (oracle id), `name`, `imageUrl`, and `colors` — and no longer carries the descriptive block (`oracleText`, `typeLine`, `manaCost`, `manaValue`, `supertypes`, `subtypes`), which is fetched on demand per REQ-175 / FLOW-024. `colors` stays up front because each complete tile draws its identity ring from the card's colors (FLOW-001, DEC-078).
- Acceptance Criteria:
  - `scripts/build-card-metadata.mjs` emits `apps/frontend/public/data/cardMetadata.json` records containing only `cardId`, `name`, `imageUrl`, and `colors`
  - autocomplete, card selection, image rendering, and the color identity ring behave identically off the slimmed list at both 390×844 and 1440×900
  - no card surface renders a descriptive field (oracle text, type line, mana cost/value, sub/supertypes) directly from the up-front list; those fields arrive only via the on-demand fetch (FLOW-024)
  - the color identity ring (including silver-gray for colorless/missing colors) renders from the up-front `colors` with no detail fetch
- Constraints:
  - do not remove `colors` from the up-front list; the tile ring depends on it
  - representative-printing selection, image selection, and card identity are unchanged
- Dependencies:
  - REQ-175
  - FLOW-024
  - DEC-078
  - DEC-160
  - FLOW-001
  - NFR-019
- Notes:
  - the dominant byte-mass (oracle text, 45.4% of the file) is what this removes from first load
```

**Amend `PRD/sections/integrations-and-data.md` → `## Metadata Strategy`:**

Current:
```
## Metadata Strategy
- use a static prebuilt metadata file committed with the app
- local metadata powers autocomplete and preview
```
Proposed:
```
## Metadata Strategy
- use a static prebuilt metadata file committed with the app
- the committed frontend metadata artifact carries only the up-front tile fields — `cardId` (oracle id), `name`, `imageUrl`, `colors` — and no descriptive block (REQ-174); descriptive fields are loaded on demand by oracle id from a separate committed static card-detail artifact (REQ-175), lazy-loaded on first card-detail open — not from a new backend route (D5)
- local metadata powers autocomplete and the tile (name, image, color ring); the card-detail popup and Quick Lookup pre-submit preview load the descriptive block on open (FLOW-024)
```

**Amend `PRD/sections/system-map.md` → "Card search & metadata" summary (line ~256):**

Current:
```
- Summary: Runtime card metadata fetch, fuzzy autocomplete, and zone-card construction in the frontend.
```
Proposed:
```
- Summary: Runtime card metadata fetch (up-front list slimmed to `cardId`, `name`, `imageUrl`, `colors` — REQ-174), fuzzy autocomplete, and zone-card construction in the frontend; descriptive fields load on demand by oracle id (REQ-175 / FLOW-024).
```

- Verdict: <accept | edit | reject>
- Reason:

---

## REQ-175 — card-detail data artifacts (frontend lazy static + backend for ask-ai)

**What this decides:** the new committed card-detail data that serves one card's
descriptive fields by its oracle id, so the frontend popup and the AI path can
stop carrying that text — delivered without a new product-facing route (D5).

**In plain terms:** a new builder trims the same Scryfall bulk every other data
builder already trims from into a card-detail map keyed by oracle id, holding
each card's descriptive block (oracle text, type line, mana cost/value, colors,
sub/supertypes). It is committed twice from that one builder: a frontend static
copy under `apps/frontend/public/data/` that the popup and Quick Lookup preview
lazy-load on first open (the `cardhashes.bin` / `cardPrintingPrices.json`
lazy-data pattern, NFR-010 / NFR-013), and a backend copy under
`apps/backend/data/` that ask-ai reads internally to resolve card text (REQ-176).
No new product-facing endpoint — the frontend reads a static artifact, and the
backend read lives inside `POST /api/ask-ai`. Local mock dev keeps working with
no runtime network call.

**What happens if you say no:** there is no source for card detail, so the
frontend cannot load it on demand and the AI path cannot resolve it server-side.
Blocks REQ-174, REQ-176, FLOW-024. (Implements D1/D2; carries the D5 choice.)

### Proposed diff

**New requirement — add to `PRD/sections/functional-requirements.md`:**

```
### REQ-175
- Title: Card-detail data artifacts (frontend lazy static + backend for ask-ai)
- Priority: high
- Description: The card descriptive block is served on demand from committed data, not from a new backend route. One builder trims the committed Scryfall bulk into a card-detail map keyed by oracle id; a frontend static copy is lazy-loaded by the popup on first open (FLOW-024) and a backend copy backs ask-ai's server-side resolution (REQ-176). No new product-facing endpoint is introduced, preserving the one-main-endpoint rule (DEC-010, GOAL-002, `technical-design-rules.md`, REQ-072) and reusing the existing lazy-data-artifact posture (NFR-010, NFR-013).
- Acceptance Criteria:
  - a new `scripts/build-*.mjs` trims the committed Scryfall bulk into a card-detail map keyed by Scryfall `oracle_id`, each value carrying `oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`, `subtypes`; raw Scryfall bulk stays gitignored and only the trimmed artifacts are committed
  - the frontend copy is committed under `apps/frontend/public/data/` and served as static hosting alongside `cardMetadata.json`; the frontend loads it on demand on first card-detail open and caches it for the session (FLOW-024), never up front (NFR-019). It may be a single artifact or sharded by oracle-id prefix to bound the lazy download; either way no descriptive data is fetched before a player opens a card detail
  - the backend copy is committed under `apps/backend/data/cardDetailByOracleId.json` and read at startup only for ask-ai server-side card-text resolution (REQ-176); it is internal to `POST /api/ask-ai` assembly and adds no product-facing route
  - both copies are emitted by the one builder from the same Scryfall bulk so the frontend detail and the ask-ai-resolved detail cannot drift
  - `npm run data:build` includes the card-detail build; `npm run data:refresh` requires explicit human approval before any download (existing policy)
  - no new product-facing backend endpoint is added; `POST /api/ask-ai` and `GET /api/health` remain the only routes, and `ASK_AI_PROVIDER=mock` local dev works unchanged with no runtime network call
  - the backend degrades gracefully if its artifact is missing (ask-ai resolution emits the existing empty-oracle marker); the frontend detail load fails soft to the identity fallback (FLOW-024)
- Constraints:
  - commit only the trimmed artifacts, matching the existing `apps/frontend/public/data/*.json` and `apps/backend/data/*.json` patterns
  - no new product-facing endpoint (DEC-010, `technical-design-rules.md` Forbidden Design Drift, REQ-072); the frontend reads a static artifact, not a route
- Dependencies:
  - REQ-174
  - REQ-176
  - FLOW-024
  - NFR-010
  - NFR-013
- Notes:
  - `oracle_id` is the shared join key already used by card metadata, rulings, and combos
  - see D5: serving detail as a lazy static artifact (not a second endpoint) is the design choice; an endpoint alternative would require amending DEC-010, `goals-and-non-goals.md`, `technical-design-rules.md`, and REQ-072
```

**Add to `PRD/sections/integrations-and-data.md` a new data-strategy block (after `## Rulings Data Strategy`):**

```
## Card Detail Data Strategy
- the card descriptive block is committed as a trimmed map keyed by Scryfall `oracle_id`, built by one builder from the same Scryfall bulk every other builder trims from; raw bulk stays gitignored and must not be committed
- each value carries `oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`, `subtypes`
- the frontend copy is committed under `apps/frontend/public/data/` and lazy-loaded on first card-detail open (FLOW-024), served as static hosting alongside `cardMetadata.json` — no new product-facing endpoint (DEC-010, REQ-072); it joins the existing lazy-data-artifact posture (NFR-010, NFR-013)
- the backend copy is committed under `apps/backend/data/cardDetailByOracleId.json` and read at startup only for ask-ai server-side card-text resolution (REQ-176); it is internal to `POST /api/ask-ai`, not a route
- `npm run data:build` rebuilds both copies alongside card metadata, rulings, and game rules; the one builder keeps them from drifting
- runtime Scryfall fetches are out of scope for the core product
```

(No `## API Design` change — REQ-175 adds no route; `POST /api/ask-ai` and `GET /api/health` stay the only endpoints.)

- Verdict: <accept | edit | reject>
- Reason:

---

## REQ-176 — ask-ai resolves card text server-side; the browser stops sending it

**What this decides:** whether the AI-answer path looks up each submitted card's
descriptive text itself, by oracle id, instead of trusting the text the browser
sends — with a guarantee the AI prompt is unchanged.

**In plain terms:** today the browser puts each card's full descriptive block
(oracle text, mana, type, colors, sub/supertypes) into the request it sends to
`POST /api/ask-ai`, and the backend reads the prompt's card text straight from
that payload. This makes the backend look those fields up by the card's oracle id
from the new card-detail artifact instead, so the browser only sends the card's
identity and the game-state a player entered (which card, its name, who cast it,
its targets, notes, mana spent). The assembled prompt must come out
**byte-identical** to today's — proven by an equivalence test against the eval
fixtures before the browser stops sending the text — so AI answers do not change.

**What happens if you say no:** the browser must keep carrying every card's
oracle text just to ask a question, which is the coupling D1 exists to remove.
Blocks D1's frontend slim from being safe. (Implements D1/D2.)

### Proposed diff

**New requirement — add to `PRD/sections/functional-requirements.md`:**

```
### REQ-176
- Title: Server-side card-text resolution for ask-ai
- Priority: high
- Description: The ask-ai prompt assembler resolves each submitted card's descriptive block by `cardId` (oracle id) from the backend card-detail artifact (REQ-175) instead of reading it from the client-sent `gameContext.zones` payload. The client stops sending the descriptive block; the assembled prompt/context stays byte-identical to today's.
- Acceptance Criteria:
  - an equivalence test against the eval fixtures (`apps/backend/src/eval/`, `npm run test:eval`) proves the assembled prompt/context is byte-identical before and after the change, for both game and lookup modes
  - the backend resolves `oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`, `subtypes` server-side by `cardId`; an empty/absent oracle still emits `(none) — no oracle text recorded for this card`
  - the client-sent `ZoneCardItem` (and lookup-mode card) carries only identity and user-entered fields; it no longer carries the descriptive block
  - mock-default local dev (`ASK_AI_PROVIDER=mock`) works unchanged; the resolution reads the committed artifact with no runtime network call
  - the provider/route boundary is intact; `POST /api/ask-ai` response shape is unchanged
- Constraints:
  - the change must not alter ask-ai output; the eval equivalence test gates it before the client stops sending oracle text
- Dependencies:
  - REQ-175
  - REQ-174
  - DEC-042
  - DEC-116
- Notes:
  - `caster`, `targets`, `contextNotes`, `manaSpent` are user-entered game-state and remain client-sent; only card-intrinsic fields move server-side
```

**Amend `PRD/sections/integrations-and-data.md` → `### ZoneCardItem`:**

Current:
```
### ZoneCardItem
- `cardId: string`
- `name: string`
- `oracleText: string`
- `imageUrl: string`
- `manaCost: string`
- `manaValue: number`
- `typeLine: string`
- `colors: string[]`
- `supertypes: string[]`
- `subtypes: string[]`
- `caster?: PlayerLabel`
- `targets?: ContextTarget[]`
- `contextNotes?: string`
- `manaSpent?: number` (prompt-facing fallback uses `manaValue` when omitted)
```
Proposed:
```
### ZoneCardItem
- `cardId: string` — oracle id; the backend resolves this card's descriptive block server-side from it (REQ-176)
- `name: string`
- `caster?: PlayerLabel`
- `targets?: ContextTarget[]`
- `contextNotes?: string`
- `manaSpent?: number` (prompt-facing fallback uses the server-resolved `manaValue` when omitted)
- the descriptive block (`oracleText`, `imageUrl`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`) is no longer part of the request; the backend resolves the card-intrinsic fields by `cardId` from `cardDetailByOracleId.json` (REQ-175, REQ-176)
```

**Amend the `### Request` example (`integrations-and-data.md`) — the `zones` cards drop the descriptive fields.** Current stack card:
```
            {
              "cardId": "uuid-or-stable-card-id",
              "name": "Counterspell",
              "oracleText": "Counter target spell.",
              "imageUrl": "https://example.invalid/counterspell.jpg",
              "manaCost": "{U}{U}",
              "manaValue": 2,
              "typeLine": "Instant",
              "colors": ["U"],
              "supertypes": [],
              "subtypes": [],
              "caster": "Player 2",
              "targets": [
                { "kind": "card", "zone": "stack", "cardId": "bottom-spell", "cardName": "Lightning Bolt" }
              ],
              "contextNotes": "Cast in response to Lightning Bolt",
              "manaSpent": 2
            }
```
Proposed:
```
            {
              "cardId": "counterspell-oracle-id",
              "name": "Counterspell",
              "caster": "Player 2",
              "targets": [
                { "kind": "card", "zone": "stack", "cardId": "bottom-spell", "cardName": "Lightning Bolt" }
              ],
              "contextNotes": "Cast in response to Lightning Bolt",
              "manaSpent": 2
            }
```
(and the `rhystic-study` battlefield card likewise drops `oracleText`, `imageUrl`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`, keeping `cardId`, `name`, `targets`, `contextNotes`.)

**Amend `integrations-and-data.md` prompt-build line (~347):**

Current:
```
- populated zone sections — each card in every populated zone (stack and non-stack) includes the full card metadata block: oracle text, mana cost/value, type line, colors, supertypes/subtypes, targets, and context notes; empty oracle emits `(none) — no oracle text recorded for this card`
```
Proposed:
```
- populated zone sections — each card in every populated zone (stack and non-stack) includes the full card metadata block: oracle text, mana cost/value, type line, colors, supertypes/subtypes, targets, and context notes; the card-intrinsic fields are resolved server-side by `cardId` from `cardDetailByOracleId.json` (REQ-176), targets and context notes come from the request; empty oracle emits `(none) — no oracle text recorded for this card`
```

**Amend `PRD/sections/quick-lookup/README.md` → the lookup-mode `cards` request shape (~lines 170-177).** The lookup-mode card is a *request* shape too, and it must drop the descriptive block the same way `ZoneCardItem` does, or its prose goes stale. This `quick-lookup/README.md` line is *derived*, non-authoritative prose (DEC-168) whose authoritative source is REQ-167's acceptance criterion; that source is amended to match in the `## REQ-167 (amend)` block below, so the authoritative REQ and this derived spec cannot contradict each other once both diffs apply.

Current:
```
- Built: `cards` is an optional bounded list of at most 5 entries (REQ-167,
  amending DEC-106's single optional `card`); a 6th entry is rejected by
  validation. Each entry keeps the prior oracle-level shape (`cardId`, `name`,
  `oracleText` required; `imageUrl`/`manaCost`/`manaValue`/`typeLine`/`colors`/
  `supertypes`/`subtypes` optional) and carries no zone, caster, owner,
  targets, or context-notes fields. Zero cards and exactly one card behave
  identically to the prior single-card shape. (DEC-106, DEC-053, REQ-072,
  REQ-167)
```
Proposed:
```
- Built: `cards` is an optional bounded list of at most 5 entries (REQ-167,
  amending DEC-106's single optional `card`); a 6th entry is rejected by
  validation. Each entry carries only identity — `cardId` (oracle id) and
  `name` — and carries no zone, caster, owner, targets, or context-notes
  fields; the descriptive block (`oracleText`/`imageUrl`/`manaCost`/`manaValue`/
  `typeLine`/`colors`/`supertypes`/`subtypes`) is no longer sent, because the
  backend resolves the card-intrinsic fields server-side by `cardId` from
  `cardDetailByOracleId.json` (REQ-175, REQ-176). Zero cards and exactly one
  card behave identically to the prior single-card shape. (DEC-106, DEC-053,
  REQ-072, REQ-167, REQ-176)
```

- Verdict: <accept | edit | reject>
- Reason:

---

## REQ-167 (amend) — the lookup-mode card carries identity only, descriptive fields resolved server-side

**What this decides:** whether the authoritative requirement that defined the
Quick Question multi-card shape (REQ-167) is updated so its acceptance criterion
stops requiring `oracleText` on each attached card — matching the server-side
resolution REQ-176 introduces.

**In plain terms:** REQ-167 is the authoritative requirement that let Quick
Question attach several cards; its acceptance criterion still says each attached
card carries the old oracle-level shape with `oracleText` required. REQ-176 and
the already-amended `quick-lookup/README.md` say the attached card now carries
only identity (`cardId`, `name`) and the backend resolves the descriptive fields
server-side. Per DEC-168 the derived feature spec (`quick-lookup/README.md`) is
explicitly non-authoritative and the cited REQ wins any conflict — so if REQ-167
is left as-is, the authoritative source would still promise `oracleText` on the
request while everything else says it is never sent. This amends REQ-167's
acceptance criterion so the authoritative source and the derived spec agree. It
touches only the request-shape line; the bounded-list cap, per-card enrichment,
combo, and no-game-state rules of REQ-167 are unchanged (enrichment still runs
per attached card — it now resolves each card's metadata server-side by `cardId`
rather than reading it from the request, exactly as REQ-176 requires).

**What happens if you say no:** REQ-167's acceptance criterion keeps requiring
`oracleText` on each lookup-mode card, contradicting REQ-176 and the amended
`quick-lookup/README.md` on authoritative product truth. (Implements D1/D2;
keeps the authoritative source consistent with REQ-176.)

### Proposed diff

**Amend `PRD/sections/functional-requirements.md` → REQ-167** — the first
acceptance criterion (the request card shape).

Current:
```
  - The lookup request carries an optional **bounded list** of oracle-level cards in place of the single optional card; each entry keeps the current oracle-level shape (`cardId`, `name`, `oracleText` required; `imageUrl`/`manaCost`/`manaValue`/`typeLine`/`colors`/`supertypes`/`subtypes` optional) and carries no zone, owner, caster, targets, or context-notes fields.
```
Proposed:
```
  - The lookup request carries an optional **bounded list** of cards in place of the single optional card; each entry carries only identity — `cardId` (oracle id) and `name` — and carries no zone, owner, caster, targets, or context-notes fields. The descriptive block (`oracleText`, `imageUrl`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`) is no longer part of the request; the backend resolves the card-intrinsic fields server-side by `cardId` from `cardDetailByOracleId.json` (REQ-175, REQ-176). The per-card enrichment below is unchanged — it resolves each attached card's metadata server-side rather than from the request.
```

Add `REQ-175` and `REQ-176` to REQ-167's **Dependencies** list so the reciprocal
link to the server-side resolution is recorded on the authoritative requirement.

- Verdict: <accept | edit | reject>
- Reason:

---

## NFR-019 — first-load payload target for MTG Assistant and Quick Lookup

**What this decides:** the measured first-load weight this work is held to, so
the slim is verified rather than assumed.

**In plain terms:** with descriptive text moved on demand, the up-front card
data the two screens download on entry should be a small fraction of today's
16.4 MB. This records a first-load payload target (the up-front artifact well
under today's size, on the order of a couple of MB gzipped) and requires the
before/after size to be measured as acceptance evidence, so the win is proven,
not claimed. It is a data-artifact target, separate from the existing
route-level code-splitting posture (NFR-014).

**What happens if you say no:** the slim ships with no measured target, so
first-load regressions later would go uncaught. (Implements D1.)

### Proposed diff

**New non-functional requirement — add to `PRD/sections/non-functional-requirements.md`:**

```
### NFR-019
- Title: First-load card-data payload target
- Description: With descriptive card fields fetched on demand (REQ-174), the up-front card-metadata artifact the frontend downloads on entry to MTG Assistant and Quick Lookup must be a small fraction of the prior 16.4 MB file, and the reduction must be measured as acceptance evidence.
- Constraints:
  - the trimmed `cardMetadata.json` (up-front fields only) is materially smaller than the prior artifact; the built size is recorded before/after as acceptance evidence and stays within a mobile-friendly budget
  - this is a data-artifact target, distinct from and additive to the route-level code-splitting posture (NFR-014); it neither replaces nor weakens the existing lazy loads, and the on-demand card-detail load is itself a data-artifact lazy load in the same family as NFR-010 / NFR-013
  - the on-demand card-detail load (FLOW-024) must not reintroduce a bulk up-front download
- Dependencies:
  - REQ-174
  - REQ-175
  - NFR-014
  - FLOW-024
- Notes:
  - oracle text alone was 45.4% of the prior file; moving it plus type line, mana, and sub/supertypes off the up-front list is the bulk of the reduction
```

- Verdict: <accept | edit | reject>
- Reason:

---

## FLOW-024 — opening a card's detail fetches it on demand

**What this decides:** the player-facing flow for the card-detail popup and the
Quick Lookup pre-submit preview once detail is fetched rather than carried.

**In plain terms:** when a player taps the corner control on a card image (or
opens the Quick Lookup card preview), the app loads that card's descriptive
block on demand from the committed static card-detail artifact (REQ-175, D5) —
lazy-loaded on first open, cached for the session — and shows a brief loading
state, then the same oracle text / mana / type / sub-supertypes it shows today.
The card's name, image, and color ring are already local, so they show
instantly; only the descriptive text waits on the load.

**What happens if you say no:** there is no defined on-demand read path, so the
popup and preview have nothing to show once detail is no longer local. (Implements
D1.)

### Proposed diff

**New user flow — add to `PRD/sections/user-flows.md`:**

```
### FLOW-024
- Name: Fetch card detail on demand
- Trigger: a player opens a card's corner detail popup, or the Quick Lookup pre-submit card preview, for a card whose descriptive block is not local
- Preconditions:
  - the card's up-front fields (oracle id, name, imageUrl, colors) are local (REQ-174)
  - the committed static card-detail artifact is available (REQ-175)
- Main Flow:
  1. Player activates the corner detail control on a card image, or opens the Quick Lookup card preview.
  2. The app loads the committed card-detail artifact on demand (lazy-loaded on first open this session, then cached) and resolves that card's descriptive block by oracle id, showing a brief loading state in the popup/preview; the card name, image, and color ring (already local) render immediately.
  3. On success the popup/preview shows the descriptive block (oracle text, type line, mana cost/value, colors, sub/supertypes), identical to today's content.
- Edge Cases:
  - if the load fails, the popup/preview shows the locally available identity (name + oracle id) and a retry affordance; no descriptive fields are invented
  - image failure does not trigger a detail load; the image-fail fallback shows name + oracle id only (FLOW-001)
  - once the artifact is loaded this session, subsequent card-detail opens resolve from the in-memory cache with no repeat request
- Notes:
  - the descriptive block is loaded on demand, never carried in the up-front list (REQ-174), and comes from a committed static artifact, not a new route (D5); this is the read path REQ-128's popup uses
```

- Verdict: <accept | edit | reject>
- Reason:

---

## REQ-128 (amend) — the card-detail popup fetches its contents on demand

**What this decides:** whether the suite-wide corner detail popup fetches its
descriptive fields when opened, instead of reading fields carried locally.

**In plain terms:** today the popup rule says it shows "locally carried
descriptive fields" and explicitly makes "no new network fetch." Under image-first
cards those fields are no longer local, so the popup loads them on demand from
the committed static card-detail artifact (REQ-175, FLOW-024) and shows a brief
loading state. Everything else about the popup — the corner trigger, the
portal-hosted bottom-sheet/side-panel geometry, the close control — is unchanged.

**What happens if you say no:** the popup would have nothing to show once detail
is loaded rather than carried. (Implements D1; pairs with REQ-174, FLOW-024.)

### Proposed diff

**Amend `PRD/sections/functional-requirements.md` → REQ-128.** Description
first sentence:

Current:
```
- Description: Whenever a card image is displayed in the suite, a compact corner control on the image opens a dismissible, portal-hosted overlay with oracle text and other locally carried descriptive fields.
```
Proposed:
```
- Description: Whenever a card image is displayed in the suite, a compact corner control on the image opens a dismissible, portal-hosted overlay with oracle text and other descriptive fields fetched on demand by oracle id (REQ-175, FLOW-024).
```

Acceptance criteria — replace the "no new network fetch" line:

Current:
```
  - no new network fetch for popup contents
```
Proposed:
```
  - the popup loads its descriptive contents on demand from the committed static card-detail artifact (REQ-175, FLOW-024), showing a brief loading state; name, image, and color ring (already local) render immediately
```

Constraints:

Current:
```
- Constraints:
  - presentation only; no `AskAiRequest`, Zod, `GameContext`, or metadata-pipeline change
```
Proposed:
```
- Constraints:
  - popup contents are fetched on demand (FLOW-024); the up-front list no longer carries them (REQ-174). No `AskAiRequest` change beyond the descriptive-block move recorded in REQ-176
```

Dependencies — add `REQ-174`, `REQ-175`, `FLOW-024`.

**Amend `PRD/sections/shared-chrome/README.md` (lines ~282–284):**

Current:
```
- Built: whenever a card image is shown anywhere in the suite, a compact corner control
  (top-right of the image) opens a **dismissible detail popup** carrying oracle text and
  other locally carried descriptive fields (no new fetch; a missing image keeps the
  text-first fallback).
```
Proposed:
```
- Built: whenever a card image is shown anywhere in the suite, a compact corner control
  (top-right of the image) opens a **dismissible detail popup** carrying oracle text and
  other descriptive fields fetched on demand by oracle id (REQ-175, FLOW-024) behind a
  brief loading state; a missing image keeps the text-first fallback, which shows name +
  oracle id only (FLOW-001).
```

**Amend `PRD/sections/system-map.md` (line ~200)** — the clause "carrying
descriptive fields including oracle text; missing or failed images enter metadata
mode directly" becomes:
```
carrying descriptive fields fetched on demand by oracle id (REQ-175 / FLOW-024); missing or failed images show the name + oracle id fallback (FLOW-001).
```

- Verdict: <accept | edit | reject>
- Reason:

---

## REQ-125 (amend) — the image-unavailable fallback shows name + oracle id

**What this decides:** what the zone-collection card preview's fallback shows
when the image is unavailable, once detail is fetched rather than carried.

**In plain terms:** REQ-125 keeps the add action reachable and points at the
image-unavailable fallback path. Today that fallback renders the card's locally
carried metadata. Under image-first cards it renders the locally available
identity (name + oracle id) instead, matching FLOW-001. This is a one-line
pointer change; the add-action and layout rules REQ-125 owns are unchanged.

**What happens if you say no:** REQ-125 would still promise a local-metadata
fallback that no longer has metadata to show. (Implements D3.)

### Proposed diff

**Amend `PRD/sections/functional-requirements.md` → REQ-125** acceptance
criterion:

Current:
```
  - owner selection and add behavior remain available; when the card image is unavailable, the readable metadata fallback path (FLOW-001) still renders
```
Proposed:
```
  - owner selection and add behavior remain available; when the card image is unavailable, the readable fallback (FLOW-001) renders the locally available identity — name + oracle id — with no detail fetch triggered by image failure
```

- Verdict: <accept | edit | reject>
- Reason:

---

## FLOW-001 (amend) — image-fail fallback shows name + oracle id; detail loads on demand

**What this decides:** how the primary game-context flow describes the card
popup's contents and the image-fail fallback.

**In plain terms:** FLOW-001 step 3 (and step 4) say the corner popup carries
"locally carried oracle/metadata" and that if the image is unavailable "the
readable metadata panel appears directly." Under image-first cards the popup
fetches its contents on demand, and the image-fail fallback shows only the
locally available name + oracle id. The edge case that today replaces a failed
image "without a network-dependent metadata lookup" is updated so image failure
never fires a fetch, while opening the popup does.

**What happens if you say no:** the primary flow's prose keeps describing local
metadata that has moved on demand. (Implements D1/D3.)

### Proposed diff

**Amend `PRD/sections/user-flows.md` → FLOW-001 Main Flow step 3** (the popup
clause):

Current:
```
a corner detail control opens a dismissible popup with locally carried oracle/metadata. If the image is unavailable, the readable metadata panel appears directly.
```
Proposed:
```
a corner detail control opens a dismissible popup that fetches oracle/metadata on demand by oracle id (FLOW-024). If the image is unavailable, the fallback shows the locally available identity (name + oracle id) directly, and opening the popup still fetches the detail.
```

**Amend FLOW-001 Main Flow step 4** (enrichment popup clause) — the phrase
"container-relative image + corner detail popup presentation" is unchanged, but
append: "; the popup's descriptive fields load on demand (FLOW-024)".

**Amend FLOW-001 Edge Cases** (the image-fail line, ~line 26):

Current:
```
  - if an image URL is absent or fails while offline, replace the image without a broken-image icon or network-dependent metadata lookup; all present local card text/metadata and workflow controls remain available
```
Proposed:
```
  - if an image URL is absent or fails, replace the image without a broken-image icon and without triggering a detail fetch; the fallback shows the locally available identity (name + oracle id) and all workflow controls remain available. Descriptive detail is available only by opening the popup, which fetches it on demand (FLOW-024)
```

- Verdict: <accept | edit | reject>
- Reason:

---

## Blocker questions

None. Every open matter is a product-truth proposal above, resolvable by the
owner's accept/edit/reject at this gate; none meets the genuine-decision-blocker
test (the assumption ladder and current PRD truth provided a conservative basis
for each, recorded in `DESIGN-BRIEF.md`).
