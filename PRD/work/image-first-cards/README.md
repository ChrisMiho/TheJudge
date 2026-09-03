# image-first-cards

Image-first cards with on-demand card detail from a new backend endpoint.

**What the player gets.** Card tiles stay image-first exactly as today. The
app stops downloading all 33,399 cards' descriptive text up front; the up-front
list slims to what tiles render (name, oracle id, imageUrl). Opening a card's
detail popup fetches oracle text, type line, mana cost/value, colors, and
sub/supertypes on demand from a new backend route keyed by oracle id. Ask-ai
resolves a card's oracle text server-side instead of reading it from the
client-sent payload, with the assembled prompt proven byte-identical to today's.

See `IDEA.md` for the captured idea, `intake/GRAPH-BRIEF.md` for staged
evidence, and `GRAPH-RUN.md` for the autonomous run ledger.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/image-first-cards

## Preparation gate

- Quality-check: not yet run
- Checked artifact: `PRD/work/image-first-cards/DESIGN-BRIEF.md`
- Findings: pending — `define` and `gate-qc` have not run
