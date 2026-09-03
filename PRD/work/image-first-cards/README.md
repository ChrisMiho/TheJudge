status: refined

# image-first-cards

Image-first cards with on-demand card detail from a committed static data
artifact (no new backend endpoint).

**What the player gets.** Card tiles stay image-first exactly as today. The
app stops downloading all 33,399 cards' descriptive text up front; the up-front
list slims to what tiles render (name, oracle id, imageUrl, colors). Opening a
card's detail popup loads oracle text, type line, mana cost/value, colors, and
sub/supertypes on demand from a committed static card-detail artifact keyed by
oracle id — lazy-loaded on first open, no new product-facing route (D5). Ask-ai
resolves a card's oracle text server-side instead of reading it from the
client-sent payload, with the assembled prompt proven byte-identical to today's.

See `IDEA.md` for the captured idea, `intake/GRAPH-BRIEF.md` for staged
evidence, and `GRAPH-RUN.md` for the autonomous run ledger.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/image-first-cards

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/image-first-cards/DESIGN-BRIEF.md`
- Findings:
  1. REQ-175 proposes a new product-facing route `GET /api/cards/:oracleId`, but current product truth is a hard, pervasive "one main backend endpoint" rule: DEC-010 ("The core product uses one main product-facing backend endpoint"), `PRD/sections/goals-and-non-goals.md` ("one main backend endpoint"), `PRD/instructions/technical-design-rules.md` ("Forbidden Design Drift: ... extra product-facing endpoints"), and REQ-072's own constraint "one product-facing endpoint only (DEC-010); no new route." `GET /api/health` is the only existing second route and is explicitly non-product-facing ("Optional Endpoint" for dev/health checks). Neither DESIGN-BRIEF.md nor GATE-QUESTIONS.md mentions DEC-010, goals-and-non-goals.md, or technical-design-rules.md, or proposes a gate slot to amend any of them.
  2. REQ-176's acceptance criteria says the client-sent "`ZoneCardItem` (and lookup-mode card) carries only identity and user-entered fields," but the proposed diff only amends `ZoneCardItem` in `integrations-and-data.md`. The lookup-mode card shape is documented separately in `PRD/sections/quick-lookup/README.md` (~lines 169-175): "Each entry keeps the prior oracle-level shape (`cardId`, `name`, `oracleText` required; `imageUrl`/`manaCost`/`manaValue`/`typeLine`/`colors`/`supertypes`/`subtypes` optional)." No diff block touches this file's request-shape prose; DESIGN-BRIEF.md lists `quick-lookup/README.md` only for the pre-submit preview flow, not this shape. If REQ-176 ships as proposed this line goes stale and self-contradictory.
  3. NFR-019's proposed diff says it is "distinct from and additive to the route-level code-splitting posture (NFR-018)" and lists NFR-018 as a Dependency. NFR-018 is actually "Prompt quality is validated against real worked rules solutions" — unrelated content. The real route-level code-splitting requirement is NFR-014 ("Route-level code splitting and initial-payload posture"). Applying this diff as written inserts a wrong cross-reference into `non-functional-requirements.md`.
