status: owner-action

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
evidence, `GATE-QUESTIONS.md` for the 15 owner decisions, and `GRAPH-RUN.md`
for the autonomous run ledger. Docs-only PR:
https://github.com/ChrisMiho/TheJudge/pull/184

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/image-first-cards

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/image-first-cards/DESIGN-BRIEF.md`
- Findings: none — cleared on quality-check attempt 4 (three prior FAILs, each a distinct correctness/readiness catch, all resolved: the endpoint-vs-DEC-010 conflict, incomplete REQ-176 diffs, the un-amended authoritative REQ-167, and the missing screen-layout load-state constraint). Every proposed diff's "Current" text verified verbatim against live `PRD/sections/` source; all cross-references resolve; every user-visible surface has a screen-layout row or a reasoned exemption; every derived-spec change has its authoritative source REQ amended in lockstep. Ready to slice once the owner answers `GATE-QUESTIONS.md`.
