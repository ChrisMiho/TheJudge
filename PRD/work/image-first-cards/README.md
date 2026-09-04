status: refining

# image-first-cards

Image-first cards with on-demand card detail from a new
`GET /api/cards/:oracleId` endpoint.

**What the player gets.** Card tiles stay image-first exactly as today. The
app stops downloading all 33,399 cards' descriptive text up front; the up-front
list slims to what tiles render (name, oracle id, imageUrl, colors). Opening a
card's detail popup loads oracle text, type line, mana cost/value, colors, and
sub/supertypes on demand from a new backend endpoint, `GET
/api/cards/:oracleId`, keyed by oracle id — fetched per card on first open and
cached for the session (D5). Ask-ai resolves a card's oracle text server-side
by reading the same backend artifact internally, instead of reading it from the
client-sent payload, with the assembled prompt proven byte-identical to today's.

See `IDEA.md` for the captured idea, `intake/GRAPH-BRIEF.md` for staged
evidence, `GATE-QUESTIONS.md` for the 15 owner decisions, and `GRAPH-RUN.md`
for the autonomous run ledger. Docs-only PR:
https://github.com/ChrisMiho/TheJudge/pull/184

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/image-first-cards

## Preparation gate

- Quality-check: FAIL (attempt 6)
- Checked artifact: `PRD/work/image-first-cards/DESIGN-BRIEF.md`
- Findings: The attempt-5 reconciliation (commit `36d5c05`) resolved all three
  prior findings. D5 — `DESIGN-BRIEF.md` and `README.md` now consistently
  describe the `GET /api/cards/:oracleId` endpoint, not a static artifact, in
  every location previously flagged (the three seams §1, the D5 bullet,
  material assumption #5, both Constraints bullets, the product-truth summary,
  and the README top-of-file summary). D3 — every "Key design decisions" and
  Non-goals reference now says the image-fail fallback shows the card name
  only, with no oracle id. The one-endpoint-rule amendments (REQ-012,
  REQ-072, NFR-004, `goals-and-non-goals.md`, `technical-design-rules.md`)
  are now real Current:/Proposed: blocks in `GATE-QUESTIONS.md`, and each one
  was checked verbatim against live `PRD/sections/` and
  `PRD/instructions/technical-design-rules.md` source — all match exactly.

  A new, distinct gap surfaced on this full re-check: the cross-cutting rule
  D1 reverses ("descriptive fields are carried locally so the popup and the
  image-fail fallback issue no fetch") and the rule D3 replaces (image-fail
  shows local metadata) are asserted in more live `PRD/sections/` locations
  than this proposal's amendment set covers. Grepping `locally carried` /
  `carried locally` across the corpus (the same discipline the D5 near-miss
  already flagged and that seeded the queued `single-source-invariants`
  package) turns up four live spots this proposal never touches:

  1. **REQ-058** (`functional-requirements.md` ~line 1218) — a second
     *authoritative* requirement, distinct from REQ-128, governing the same
     corner detail popup across `ZoneCardPicker`, `ScanReviewBubble`, and
     `EnrichmentStep`. Its Description says "on-demand local detail (DEC-151
     popup)" and an acceptance criterion says "a corner detail control opens
     the dismissible detail popup (REQ-128) for locally carried descriptive
     fields" — both contradicted by REQ-175/D1's on-demand fetch. Not amended.
  2. **FLOW-002** "Inspect and remove cards from selected zones"
     (`user-flows.md` lines 44-63) — Main Flow step 4: "a corner detail
     control opens a dismissible popup with locally carried descriptive
     fields... If the image is unavailable, the same metadata presentation
     appears directly." Edge case: "replace it with the readable
     local-metadata fallback." Neither line is touched — both contradict D1
     (on-demand fetch) and D3 (name-only fallback).
  3. **FLOW-006** "Scan cards into a zone" (`user-flows.md` lines 123-159) —
     the Scan review surface `DESIGN-BRIEF.md`'s own screen-layout section
     claims is covered by the popup change. Main Flow step 5: "the corner
     control opens locally carried descriptive fields... if the image is
     unavailable, the metadata appears directly." Edge case (line 148): "the
     scan review entry shows the locally carried text/metadata fallback."
     Neither touched.
  4. **`scan/README.md`** (~line 112, derived non-authoritative prose per
     DEC-168): "falling back to locally carried text/metadata when no image
     is available." Its authoritative source is FLOW-006's edge case (or
     REQ-058) — neither amended, so this derived spec is left contradicting
     an unamended authoritative source, the exact DEC-168 gap the brief's own
     "Derived-spec ↔ source-REQ audit" claims to have closed.

  This means `DESIGN-BRIEF.md`'s "Completeness sweeps" (a) — "No other
  surface changes. Result: pass." — and (b) — "Every derived-spec diff has
  its authoritative source amended in lockstep... Result: pass." — are both
  incorrect: Scan review, zone collection, and enrichment carry live prose
  that will contradict shipped behavior once REQ-175/D1/D3 apply.

  Everything else checked out clean: every other "Current:" quoted block in
  `GATE-QUESTIONS.md` (REQ-125, REQ-128, REQ-167, `integrations-and-data.md`
  Metadata Strategy / `ZoneCardItem` / request example / prompt-build line /
  API Design, `system-map.md`, `quick-lookup/README.md` (2 blocks),
  `shared-chrome/README.md`, `screen-layout.md` (2 rows)) matches live source
  verbatim; all 24 cross-referenced stable ids resolve (DEC-010 confirmed
  retired as claimed); both screen-layout.md rows exist at the cited
  locations; and REQ-167's amendment is correctly the only fix needed for the
  DEC-168 lockstep on the lookup-card request shape (no other file besides
  `quick-lookup/README.md` cites the old oracleText-required shape).
