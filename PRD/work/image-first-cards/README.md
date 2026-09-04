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

- Quality-check: FAIL
- Checked artifact: `PRD/work/image-first-cards/DESIGN-BRIEF.md`
- Findings: `DESIGN-BRIEF.md` was never updated after the owner's gate answers, so it still narrates the pre-edit design and contradicts the finalized `GATE-QUESTIONS.md` on two of the three owner edits. (1) D5 — the owner chose the `GET /api/cards/:oracleId` endpoint, but the brief's "The three seams" §1 heading/body, the D5 bullet under "Key design decisions," material assumption #5, both Constraints bullets, and the "Proposed product-truth changes" summary all still describe "no new endpoint" / a lazy static artifact as the chosen design, and one line still presents D5 as an open, undecided fork. (2) D3 — the owner picked name-only, but the brief's D3 bullet under "Key design decisions" and the Non-goals bullet still say "name + oracle id." The package `README.md` summary (top of file) carries the same D5 staleness ("no new backend endpoint," "no new product-facing route (D5)"). None of this is a defect in `GATE-QUESTIONS.md` itself — every REQ/FLOW/NFR diff block inside it consistently implements name-only (D3) and the endpoint (D5), every quoted "Current" block verified verbatim against live `PRD/sections/` source, and every cross-referenced id resolves. Minor: the REQ-012/NFR-004/`goals-and-non-goals.md`/`technical-design-rules.md` one-endpoint-rule amendments are given as prose "constraint → permits" arrows rather than the Current:/Proposed: blocks used elsewhere in the document — enough to apply, but less rigorous than the rest of the diff.
