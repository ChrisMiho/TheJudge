# Gate questions — image-first-cards

**Decide:** answer each block below with `accept`, `edit`, or `reject` (add a
reason for edit/reject). Four direction decisions (D1–D4) come first; then one
block per new or amended stable id, each carrying its complete proposed diff
against current `PRD/sections/` truth. Reject D1 and the id blocks that implement
it fall with it.

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
card are fetched from a new backend endpoint the moment its detail opens. A card
looks and behaves exactly as today — only the moment its text arrives changes.

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
- the committed frontend metadata artifact carries only the up-front tile fields — `cardId` (oracle id), `name`, `imageUrl`, `colors` — and no descriptive block (REQ-174); descriptive fields are fetched on demand by oracle id (REQ-175, `GET /api/cards/:oracleId`)
- local metadata powers autocomplete and the tile (name, image, color ring); the card-detail popup and Quick Lookup pre-submit preview fetch the descriptive block on open (FLOW-024)
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

## REQ-175 — a backend card-detail table and a `GET /api/cards/:oracleId` endpoint

**What this decides:** the new backend capability that serves one card's
descriptive fields by its oracle id, so the frontend and the AI path can stop
carrying that text.

**In plain terms:** a new committed data file under `apps/backend/data/`, keyed
by oracle id, holds each card's descriptive block (oracle text, type line, mana
cost/value, colors, sub/supertypes), built by trimming the same Scryfall bulk
every other data builder already trims from. A new route `GET /api/cards/:oracleId`
returns those fields for one card, alongside the existing `POST /api/ask-ai` and
`GET /api/health`. It serves from the committed file with no runtime network
call, so local mock dev keeps working.

**What happens if you say no:** there is no server-side source for card detail,
so the frontend cannot fetch it on demand and the AI path cannot resolve it
server-side. Blocks REQ-174, REQ-176, FLOW-024. (Implements D1/D2.)

### Proposed diff

**New requirement — add to `PRD/sections/functional-requirements.md`:**

```
### REQ-175
- Title: Backend card-detail artifact and endpoint
- Priority: high
- Description: A committed backend artifact keyed by oracle id holds each card's descriptive block, and a new route `GET /api/cards/:oracleId` returns it. The frontend fetches it on demand (FLOW-024); ask-ai resolves it server-side (REQ-176).
- Acceptance Criteria:
  - a new `scripts/build-*.mjs` trims the committed Scryfall bulk into `apps/backend/data/cardDetailByOracleId.json`, a map keyed by Scryfall `oracle_id`, each value carrying `oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`, `subtypes`; raw Scryfall bulk stays gitignored and only the trimmed artifact is committed
  - `npm run data:build` includes the card-detail build; `npm run data:refresh` requires explicit human approval before any download (existing policy)
  - `GET /api/cards/:oracleId` returns the descriptive block for a present oracle id and a 404-style not-found for an absent one; it serves from the committed artifact with no runtime network call, so `ASK_AI_PROVIDER=mock` local dev works unchanged
  - the route handler stays contract-focused per the provider/route boundary (`apps/backend/src/providers/README.md`); no provider or `POST /api/ask-ai` contract change is introduced by the route itself
  - the backend loads the committed artifact at startup and degrades gracefully (endpoint reports not-found) if the artifact is missing
- Constraints:
  - commit only the trimmed artifact, matching the existing `apps/backend/data/*.json` pattern
  - single-oracle-id GET; no batch endpoint without further scope
- Dependencies:
  - REQ-174
  - REQ-176
  - FLOW-024
- Notes:
  - `oracle_id` is the shared join key already used by card metadata, rulings, and combos
```

**Amend `PRD/sections/integrations-and-data.md` → `## API Design`:**

Current:
```
### Optional Endpoint: `GET /api/health`
Purpose:
- local development checks
- deployment health checks
- uptime verification
```
Proposed (append after the `GET /api/health` block):
```
### Optional Endpoint: `GET /api/health`
Purpose:
- local development checks
- deployment health checks
- uptime verification

### Endpoint: `GET /api/cards/:oracleId`
Purpose:
- serve one card's descriptive block (`oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`, `subtypes`) by oracle id, from the committed `apps/backend/data/cardDetailByOracleId.json` artifact, with no runtime network call
- backs the frontend on-demand card-detail popup / preview (FLOW-024) and is the source of truth ask-ai resolves against server-side (REQ-176)
- returns the descriptive block for a present oracle id; not-found for an absent one
```

**Add to `PRD/sections/integrations-and-data.md` a new data-strategy block (after `## Rulings Data Strategy`):**

```
## Card Detail Data Strategy
- the committed backend artifact is `apps/backend/data/cardDetailByOracleId.json`, a trimmed map keyed by Scryfall `oracle_id`
- each value carries `oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`, `subtypes`
- built from the same Scryfall bulk every other builder trims from; raw bulk stays gitignored and must not be committed
- `npm run data:build` rebuilds it alongside card metadata, rulings, and game rules
- the backend loads it at startup; `GET /api/cards/:oracleId` and ask-ai's server-side card-text resolution both read from it
- runtime Scryfall fetches are out of scope for the core product
```

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
code-splitting posture (NFR-018).

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
  - this is a data-artifact target, distinct from and additive to the route-level code-splitting posture (NFR-018); it neither replaces nor weakens the existing lazy loads
  - the on-demand `GET /api/cards/:oracleId` fetch (FLOW-024) must not reintroduce a bulk up-front download
- Dependencies:
  - REQ-174
  - REQ-175
  - NFR-018
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
opens the Quick Lookup card preview), the app fetches that card's descriptive
block from `GET /api/cards/:oracleId` and shows a brief loading state, then the
same oracle text / mana / type / sub-supertypes it shows today. The card's name,
image, and color ring are already local, so they show instantly; only the
descriptive text waits on the fetch.

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
  - the backend card-detail endpoint is reachable (REQ-175)
- Main Flow:
  1. Player activates the corner detail control on a card image, or opens the Quick Lookup card preview.
  2. The app fetches `GET /api/cards/:oracleId` for that card and shows a brief loading state in the popup/preview; the card name, image, and color ring (already local) render immediately.
  3. On success the popup/preview shows the descriptive block (oracle text, type line, mana cost/value, colors, sub/supertypes), identical to today's content.
- Edge Cases:
  - if the fetch fails, the popup/preview shows the locally available identity (name + oracle id) and a retry affordance; no descriptive fields are invented
  - image failure does not trigger a detail fetch; the image-fail fallback shows name + oracle id only (FLOW-001)
  - a card already fetched this session may be served from an in-memory cache with no repeat request
- Notes:
  - the descriptive block is fetched, never carried in the up-front list (REQ-174); this is the read path REQ-128's popup uses
```

- Verdict: <accept | edit | reject>
- Reason:

---

## REQ-128 (amend) — the card-detail popup fetches its contents on demand

**What this decides:** whether the suite-wide corner detail popup fetches its
descriptive fields when opened, instead of reading fields carried locally.

**In plain terms:** today the popup rule says it shows "locally carried
descriptive fields" and explicitly makes "no new network fetch." Under image-first
cards those fields are no longer local, so the popup fetches them on demand from
`GET /api/cards/:oracleId` (FLOW-024) and shows a brief loading state. Everything
else about the popup — the corner trigger, the portal-hosted bottom-sheet/side-panel
geometry, the close control — is unchanged.

**What happens if you say no:** the popup would have nothing to show once detail
is fetched rather than carried. (Implements D1; pairs with REQ-174, FLOW-024.)

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
  - the popup fetches its descriptive contents on demand from `GET /api/cards/:oracleId` (FLOW-024), showing a brief loading state; name, image, and color ring (already local) render immediately
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
