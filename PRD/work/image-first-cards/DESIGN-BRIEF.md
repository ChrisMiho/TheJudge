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

1. **Card-detail data artifact + new endpoint.** A new committed dataset keyed
   by oracle id, holding the descriptive block (oracleText, typeLine, manaCost,
   manaValue, colors, supertypes, subtypes), trimmed from the same Scryfall bulk
   every other builder trims from, via a new `scripts/build-*.mjs`. The builder
   emits it once, backend-only, under
   `apps/backend/data/cardDetailByOracleId.json` — no frontend copy. A new
   product-facing route, `GET /api/cards/:oracleId`, returns one card's
   descriptive block by oracle id; the popup and Quick Lookup preview fetch per
   card on open and cache for the session. Ask-ai reads the same backend file
   internally inside `POST /api/ask-ai` (REQ-176), not via the new route. This is
   the product's second product-facing endpoint, authorized by D5 and applied by
   amendments to REQ-012, REQ-072, NFR-004, `goals-and-non-goals.md`, and
   `technical-design-rules.md`. Serves with no runtime network call, so
   mock-default local dev keeps working. (REQ-175, D5)

2. **Frontend slim + on-demand load.** The up-front card list drops to the
   fields a tile actually renders — name, oracle id, image URL, colors — from the
   trimmed `build-card-metadata.mjs` output. The shared card-detail popup and the
   Quick Lookup pre-submit preview fetch the descriptive block from
   `GET /api/cards/:oracleId` (REQ-175) when opened — per card, cached for the
   session — showing a brief loading state.
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
- **Image-fail fallback shows the card name only (D3).** When a card image
  fails to load, the fallback shows only what stays local — the card name, no
  oracle id — and issues no detail fetch. This is the direct consequence of D1:
  once oracle text is no longer local, the fallback can no longer show it.
- **Compression out of scope (D4).** The CloudFront/S3 pre-compression fix for
  large static assets is a separate, already-decided, zero-behavior-change
  deploy-layer win. It is not part of this package.
- **Card detail is served by a new endpoint, `GET /api/cards/:oracleId` (D5).**
  The owner chose the endpoint alternative over the lazy-static-artifact
  default: a new backend route returns one card's descriptive block by oracle
  id, fetched per card on first card-detail open and cached for the session.
  This is the product's second product-facing endpoint. Choosing it required
  amending the one-main-endpoint rule everywhere it's stated as a hard
  constraint — REQ-012, REQ-072, NFR-004, `goals-and-non-goals.md` (the "one
  main backend endpoint" line and the "multiple product-facing backend
  endpoints" non-goal), and `technical-design-rules.md` (Allowed Design
  Direction + Forbidden Design Drift) — each narrowed to permit exactly this
  one additional read-only retrieval route, not endpoints generally.

## DEC-078 offline guarantee — how D1/D3 reconcile with it

REQ-058 and FLOW-006 guarantee the scanning-context surfaces (expanded scan
review) work offline: on image failure they show a resilient local fallback and
issue no additional metadata fetch (DEC-078; scan itself is fully on-device,
DEC-051). On-demand fetch (D1) tensions with that, so the amendment set reconciles
the two rather than reversing the guarantee:

- **The image-fail fallback stays offline-resilient.** On every surface it shows
  the card name only (D3), with no forced/blocking fetch on image failure and no
  broken-image state — so it still works offline. DEC-078's no-fetch-on-failure
  guarantee is preserved verbatim in intent on REQ-058, FLOW-006, and the derived
  `scan/README.md`.
- **The popup's descriptive text is fetched on demand (D1)** when the popup is
  opened and the network allows. Offline or on failure it degrades gracefully
  (shows the identity it has, no crash) and never blocks the surface or the
  Remove/workflow controls.
- **No silent reversal.** Opening the popup on the explicitly-offline scan-review
  surface now attempts a network fetch it did not before. Because that is a real
  tension with DEC-078/DEC-051, it is flagged — not hidden — with a labeled
  `- Owner note:` on both REQ-058 and FLOW-006, so the owner can veto (the veto
  path would be a local detail copy for scan contexts, against D1). The
  conservative default preserves offline resilience: surface and fallback stay
  fully offline; only the popup's optional descriptive text depends on the network.

DEC-078 is reconciled, never deleted or weakened.

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
5. **Card detail ships via a new endpoint, `GET /api/cards/:oracleId`.** The
   default assumption under the one-main-endpoint rule (DEC-010, GOAL-002,
   `technical-design-rules.md` Forbidden Design Drift, REQ-072, the "multiple
   product-facing backend endpoints" non-goal) was the lazy-static-artifact
   pattern already used for heavy static data (NFR-010 `cardhashes.bin`,
   NFR-013 `cardPrintingPrices.json`). Surfaced as D5 with the endpoint as the
   named alternative; the owner picked the endpoint at the gate for its
   per-card fetch granularity, so the one-endpoint rule is amended (REQ-012,
   REQ-072, NFR-004, `goals-and-non-goals.md`, `technical-design-rules.md`)
   rather than held intact. (Evidence: DEC-010 / goals-and-non-goals.md /
   technical-design-rules.md / REQ-072 one-endpoint rule; NFR-010 / NFR-013
   lazy-data pattern as the offered default.)

## Non-goals

- RAG / retrieval-quality changes, query-construction fixes, Scryfall `keywords`
  enrichment — tracked separately under
  `PRD/work/probe-prompt-data-optimization/`. This relocates existing card text;
  it does not change what gets retrieved.
- The CloudFront/S3 compression fix (D4) — separate deploy-layer work.
- Richer offline/image-fail fallback beyond the card name (D3).
- Card-image caching, connectivity detection, or runtime metadata refresh.

## Constraints

- Ask-ai output must not change: the assembled prompt/context stays
  byte-identical, proven by the eval harness (`npm run test:eval`) before the
  client stops sending oracle text.
- Mock-default local dev (`ASK_AI_PROVIDER=mock`) keeps working; the new
  `GET /api/cards/:oracleId` route and ask-ai's internal read both resolve
  from the committed backend artifact with no runtime network call.
- Two product-facing endpoints only (`POST /api/ask-ai`,
  `GET /api/cards/:oracleId`; D5): the one-endpoint rule is amended, not held
  intact, to permit exactly this one additional read-only retrieval route
  (REQ-012, REQ-072, NFR-004, `goals-and-non-goals.md`,
  `technical-design-rules.md`); the provider/route boundary stays intact
  (`apps/backend/src/providers/README.md`).
- Committed-data hygiene: commit only the trimmed card-detail artifact, once,
  backend-only, under `apps/backend/data/cardDetailByOracleId.json` — no
  frontend copy — matching the existing `apps/backend/data/*.json` pattern;
  Scryfall bulk stays gitignored.

## Proposed product-truth changes (see GATE-QUESTIONS.md)

New stable ids: **REQ-174** (slim up-front list), **REQ-175** (card-detail
endpoint + backend artifact), **REQ-176** (ask-ai server-side card-text
resolution), **NFR-019** (first-load payload target), **FLOW-024** (on-demand
card-detail load).

Amended stable ids: **REQ-128** (popup loads on demand; image-fail criterion and
"local-fields-only" note completed), **REQ-125** (image fallback path),
**FLOW-001** (image-fail fallback = name only), **REQ-058** (authoritative shared
card presentation across `ZoneCardPicker` / expanded `ScanReviewBubble` /
`EnrichmentStep` — popup fetches on demand, fallback name-only, offline guarantee
preserved), **FLOW-002** (zone inspect/remove), **FLOW-006** (scan review, incl.
the offline edge case), **REQ-167** (lookup-mode card carries identity only;
descriptive fields resolved server-side), **REQ-012** and **NFR-004**
(one-main-endpoint constraint narrowed to permit the new read-only retrieval
route, alongside REQ-072, `goals-and-non-goals.md`, and
`technical-design-rules.md` — all carried by REQ-175's diff, D5).

Cross-cutting-rule completion (this refinement pass): the corner-detail-popup /
image-fail-fallback rule was asserted in more live sources than the first draft
amended. The set is now complete — REQ-058, FLOW-002, FLOW-006, the two missed
spots inside REQ-128, and the derived `scan/README.md` and `shared-chrome/README.md`
ring bullet were added, each derived file's authoritative source amended in
lockstep (DEC-168). See the completeness sweeps below and the DEC-078
reconciliation section above.

REQ-167 is the *authoritative* source of the derived `quick-lookup/README.md`
lookup-card prose that REQ-176 amends. Per DEC-168 the cited REQ wins any
conflict with a derived feature spec, so amending the derived prose without
amending REQ-167 would leave the authoritative source still promising
`oracleText` on the request. Its acceptance criterion is amended in lockstep so
the two agree.

Direction decision surfaced at the gate with no id of its own: **D5** — the
owner chose the endpoint alternative, `GET /api/cards/:oracleId`, over the
lazy-static-artifact default; REQ-175 carries the new route, and REQ-012,
REQ-072, NFR-004, `goals-and-non-goals.md`, and `technical-design-rules.md`
are amended to permit it.

Feature-spec prose carrying the same truth is amended inside the relevant id's
diff: `integrations-and-data.md` (card-detail data strategy, metadata strategy,
ask-ai payload), `shared-chrome/README.md` and `system-map.md` (popup read
path), `quick-lookup/README.md` (lookup-mode card request shape under REQ-176,
and the pre-submit card-preview display under FLOW-024),
`non-functional-requirements.md` (payload target).

Layout-catalog amendment surfaced at the gate as its own slot:
**`screen-layout.md` — card-detail on-demand load state**. The change introduces
a user-visible loading moment on two overlays that have none today — the
suite-wide card-detail popup (REQ-128 / FLOW-024) and the Quick Question
pre-submit card preview (REQ-174 / FLOW-024). Under REQ-126 / DEC-149
`screen-layout.md` is authoritative for how a user-visible overlay is presented,
and its route-load-fallback row already sets the house rule for a loading state
("no branded splash, progress bar, or motion beyond the existing CSS-motion
rules, NFR-006"). The card-detail-popup row and the Quick Question pre-submit
row carried no equivalent rule, so this proposal adds the matching constraint to
both — a quiet in-overlay state, local name/image/ring stay put, no branded
splash / spinner takeover / progress bar / motion beyond NFR-006, no overlay
resize or layout jump, minimal inline placeholder only, failing soft to the
name-only fallback (FLOW-001). This closes the class of gap the quality
gate flagged: every new user-visible loading state now has a matching catalog
constraint. The FLOW-024 and REQ-128 diffs point at `screen-layout.md` for that
presentation, so the authoritative flow/requirement and the catalog agree.

No screen-layout row is needed for the image-fail fallback change (REQ-125 /
FLOW-001, D3): it reduces the fallback content to the card name only within
existing surfaces and changes no size, containment, band, or fit dimension the
catalog governs — an explicit, reasoned no-row case, not an omission.

## Derived-spec ↔ source-REQ audit (recurrence guard)

Every derived (non-authoritative, DEC-168) file a proposed diff edits was
checked against the authoritative REQ it derives from, so no amended derived
spec is left contradicting its source:

- `quick-lookup/README.md` (lookup-card request shape) ← **REQ-167** — both now
  amended (REQ-176 diff for the derived prose; the `REQ-167 (amend)` block for
  the authoritative acceptance criterion).
- `quick-lookup/README.md` (pre-submit card-preview display prose, "oracle text
  with full metadata before submit") ← **FLOW-024 / REQ-128 / REQ-174** — amended
  in the FLOW-024 block to say the descriptive block loads on demand behind a
  loading state. REQ-167's preview acceptance criterion ("the pre-submit view
  lets the player add, preview, and remove more than one card") is silent on
  where the metadata comes from, so it does not contradict the on-demand display
  and needs no lockstep edit; the authoritative sources for the display timing
  are the new FLOW-024 and the amended REQ-128 / REQ-174, all in this proposal.
- `shared-chrome/README.md` (corner detail popup) ← **REQ-128** — both amended
  (REQ-128 already carries its own `(amend)` block).
- `shared-chrome/README.md` (identity-ring fallback bullet, "text-first metadata
  fallback replaces a missing image") ← **REQ-058** — both amended (REQ-058's
  fallback criteria and this derived ring bullet, this pass).
- `scan/README.md` (scan-review bubble fallback, "falling back to locally carried
  text/metadata") ← **FLOW-006 / REQ-058** — all amended this pass; the derived
  prose now states the on-demand popup fetch and the name-only, no-fetch,
  offline-resilient fallback its sources describe.
- `screen-layout.md` (card-detail popup + Quick Question pre-submit rows,
  loading-state presentation) ← **REQ-126 / DEC-149** (authoritative-for-layout)
  and the surfaces' own ids **REQ-128 / REQ-174 / FLOW-024** — amended in the
  dedicated `screen-layout.md` gate block; the FLOW-024 and REQ-128 diffs cite
  `screen-layout.md` so flow, requirement, and catalog agree.
- `system-map.md` summaries (card metadata / popup read path) ← **REQ-174 /
  REQ-175 / REQ-128 / FLOW-024** — all new or amended in this proposal.
- `integrations-and-data.md` (`ZoneCardItem`, prompt-build line, request
  example) is the authoritative wire contract, amended directly by REQ-176; the
  only REQ acceptance criterion pinning the descriptive block on a request card
  shape was REQ-167 (now amended). The game-mode assembled-prompt criterion
  (REQ-030, `functional-requirements.md` ~line 539) describes the *assembled
  prompt*, which REQ-176 keeps byte-identical, so it stays valid and is
  correctly left untouched — the descriptive fields still appear in the prompt,
  now resolved server-side rather than from the payload.

## Completeness sweeps (define, attempt 4)

Run before handoff so no fourth distinct gap remains:

- **(a) Every new/changed user-visible surface has a `screen-layout.md` row or a
  reasoned no-row note.** Card-detail popup and Quick Question pre-submit both
  gain the on-demand loading state and now carry the matching catalog constraint
  (dedicated `screen-layout.md` gate block). The image-fail fallback (name only,
  D3) reduces content within existing surfaces and changes no
  size/containment/band/fit dimension — explicit no-row note recorded above.
  **Cross-cutting-rule completion (this pass):** the same corner-detail-popup /
  image-fail-fallback rule was still asserted, unamended, in more live sources
  than the first draft caught. The full set is now amended so D1/D3 apply
  consistently: **REQ-058** (authoritative shared presentation for
  `ZoneCardPicker`, expanded `ScanReviewBubble`, `EnrichmentStep`), **FLOW-002**
  (zone inspect/remove), **FLOW-006** (scan review, incl. the offline edge case),
  the two spots the REQ-128 block itself had missed (its image-fail criterion and
  its "local-fields-only" note), plus the derived `scan/README.md` and
  `shared-chrome/README.md` ring bullet. FLOW-001 (steps 3/4 + edge case),
  REQ-125, the `shared-chrome` popup bullet, and `system-map.md` L200 were already
  amended in the first draft. No cross-cutting popup/fallback assertion remains
  unamended (verified by grep for `locally carried` / `carried locally` /
  `text-first fallback` / `local-metadata fallback` across `PRD/sections/`, with
  the unrelated autocomplete "local metadata" concept in `overview.md`,
  `integrations-and-data.md`, `goals-and-non-goals.md`, and
  `functional-requirements.md` L22/30/286 correctly left alone). **Result: pass.**
- **(b) Every derived-spec diff has its authoritative source amended in lockstep
  (DEC-168).** Full map in the audit above. New derived items amended this pass,
  each with its authoritative source amended in lockstep: `scan/README.md`
  scan-review fallback prose ← **FLOW-006 / REQ-058** (both amended above);
  `shared-chrome/README.md` identity-ring fallback bullet ← **REQ-058** (amended
  above). The `shared-chrome` popup bullet ← REQ-128 and `quick-lookup/README.md`
  pre-submit preview-display prose ← FLOW-024 / REQ-128 / REQ-174 remain covered
  from the prior pass. No amended derived spec is left contradicting its source.
  **Result: pass.**
- **(c) Every dependency/cross-reference an amended id cites resolves.** The new
  `screen-layout.md` block cites REQ-126, DEC-149, NFR-006, REQ-128, REQ-174,
  REQ-175, FLOW-024, FLOW-001 — all real (NFR-006 is the CSS-motion baseline the
  route-load row already cites; REQ-126/DEC-149 govern the catalog). FLOW-024 and
  REQ-128 now cite `screen-layout.md` reciprocally. Prior-pass fixes hold
  (REQ-167 amended; NFR-019 → NFR-014). **Result: pass.**
- **(d) Every product-truth change the brief relies on has its own gate slot.**
  The loading-state presentation now has a dedicated `screen-layout.md` slot the
  owner can accept/edit/reject; the preview-display prose folds into FLOW-024's
  slot per the established feature-spec-prose pattern. All other changes retain
  their existing slots. **Result: pass.**

## Next step

`/thejudge-quality-check PRD/work/image-first-cards/`
