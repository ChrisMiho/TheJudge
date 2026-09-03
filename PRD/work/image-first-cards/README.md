status: refining

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
  1. REQ-167's acceptance criterion in `PRD/sections/functional-requirements.md` (line ~3829) still reads: "each entry keeps the current oracle-level shape (`cardId`, `name`, `oracleText` required; `imageUrl`/`manaCost`/`manaValue`/`typeLine`/`colors`/`supertypes`/`subtypes` optional)." REQ-167 is the authoritative requirement that established the lookup-mode multi-card shape (`quick-lookup/README.md`'s own "Built" line cites it: "DEC-106, DEC-053, REQ-072, REQ-167"). REQ-176's diff strips the descriptive block from the lookup card shape and correctly amends the *derived* prose in `quick-lookup/README.md`, but no block in `GATE-QUESTIONS.md` amends REQ-167 itself. Per DEC-168, `quick-lookup/README.md` is explicitly non-authoritative and the cited REQ wins any conflict — so once these diffs are applied, the authoritative REQ-167 still promises `oracleText` is required on the lookup card while REQ-176 and the amended `quick-lookup/README.md` say it is never sent. Add a REQ-167 amendment block (or fold it into REQ-176's diff) so the authoritative source and the derived spec agree.

Resolved from the prior FAIL (re-verified against live `PRD/sections/` truth this pass):
  - No new product-facing route: REQ-175 adds no `## API Design` change; card detail ships as a lazy static artifact read by the frontend and by `POST /api/ask-ai` internally. D5 surfaces the `GET /api/cards/:oracleId` alternative as a gate fork with a recommendation, not an assumed choice, and correctly cites DEC-010, `goals-and-non-goals.md`, `technical-design-rules.md`, and REQ-072 as the four artifacts an `edit` verdict would need to amend.
  - REQ-176's diff now includes a `quick-lookup/README.md` block dropping the lookup-mode card's descriptive fields, matching REQ-176's promise (though see finding 1 above — the amendment needed to also reach REQ-167).
  - NFR-019 now cites NFR-014 (route-level code splitting and initial-payload posture) instead of the unrelated NFR-018 (prompt-quality validation).
