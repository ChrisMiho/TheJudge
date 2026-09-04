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
  1. The brief adds a new user-visible loading state to the suite-wide card-detail popup (REQ-128 amend, FLOW-024) and to the Quick Lookup pre-submit preview — where today there is none (the popup's "no new network fetch for popup contents" becomes "showing a brief loading state"). No block in `GATE-QUESTIONS.md` or `DESIGN-BRIEF.md` touches `PRD/sections/screen-layout.md`, and neither records an explicit reason it is out of scope. The quality-check checklist requires a matching catalog row or explicit update whenever a brief redesigns a user-visible overlay (REQ-126/DEC-149), and `screen-layout.md` already has precedent: its route-level Suspense-fallback row (line 73) constrains what a loading state may show ("must not introduce a branded splash, progress bar, or motion beyond the existing CSS-motion rules"). The card-detail-popup row (`screen-layout.md` lines 93–101) and the Quick Question pre-submit row (lines 125–133) carry no equivalent constraint, so an implementing agent has no guidance on what the new loading state may look like. Fix: add a note to those two rows (or a new catalog row) constraining the loading-state presentation, or record an explicit reason none is needed.

Resolved from the prior FAILs (re-verified against live `PRD/sections/` truth this pass):
  - REQ-167 (authoritative source) now has a `## REQ-167 (amend)` gate block whose quoted Current text matches the live source verbatim and whose replacement drops `oracleText` to identity-only, matching REQ-176 and the amended derived `quick-lookup/README.md` (DEC-168 conflict removed). Every other Current/quoted block in the brief was hand-checked against live source — all faithful, no drift.
  - No new product-facing route: card detail ships as a lazy static artifact read by the frontend and by `POST /api/ask-ai` internally; D5 surfaces the `GET /api/cards/:oracleId` alternative as a gate fork, not an assumed choice (DEC-010 intact).
  - REQ-176's diffs reach both `ZoneCardItem` and the `quick-lookup/README.md` lookup-mode card shape; NFR-019 cites NFR-014, not NFR-018.
