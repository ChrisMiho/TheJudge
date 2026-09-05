# Slice B — Stop drowning the question in card text

## Status: planned

## Goal

Build the System 3 retrieval query from the player's question plus a
compact per-card signal (name, type line, keyword list) instead of the
question plus every attached card's full oracle text and context notes. The
assembled prompt the model reads does not change — only the internal search
query does.

## Requirements

1. In `apps/backend/src/gameRulesRetrieval.ts`, change `buildQueryParts` so
   the retrieval query carries the player's question and, per card, that
   card's name, type line, and keyword list — not its full oracle text or
   context notes. Apply through the one shared retrieval path used by both
   game mode and lookup mode (no second implementation).
2. Card keyword lists for this slice come from whatever signal is available
   today (the hand-curated `gameRulesKeywordVocabulary.json` tokenization
   path) — Slice D later swaps that source for per-card Scryfall keywords
   without changing this slice's query shape.
3. Re-run the labelled eval fixtures and the relevance report; hand-relabel
   any fixture's `expected` block where retrieval legitimately improves.
   Never relabel by copying the current scorer's output (REQ-032).
4. Apply this step's `PRD/sections/` amendments by intent against current
   live text: the new `REQ-178` entry; `REQ-074`'s second acceptance
   criterion; `REQ-167`'s third acceptance criterion; the
   query-construction portions of `quick-lookup/README.md` (:195-205,
   :260-266, :315-317), `system-map/prompt-layout-spec.md` (:36, :60), and
   `system-map/game-rules-retrieval.md` (:21, :38, :63); `user-flows.md`
   (:252, :517). Where a location's accepted text also carries a
   Step 5/REQ-181 clause (the ranking-by-meaning half), land only this
   step's query-construction clause now — Slice E finishes the location to
   match the full accepted text. Exact accepted wording is in
   `GATE-QUESTIONS.md` under `## REQ-178`, `## REQ-074`, `## REQ-167`, and
   the three spec-file blocks.

## Acceptance criteria

- [ ] B1 — the retrieval query carries the question plus, per card, name +
      type line + keyword list; it no longer concatenates full oracle text
      or context notes
- [ ] B2 — the change applies through the one shared retrieval path for both
      game mode and lookup mode
- [ ] B3 — the assembled prompt text is unchanged by this slice: card oracle
      text still renders in its own card sections exactly as today, and the
      supplemental section still carries up to 5 excerpts
- [ ] B4 — measured on the Slice A benchmark, multi-card recall@5 lands
      within 0.10 of the same build's clean-query recall@5
- [ ] B5 — measured on the Slice A benchmark, clean-query recall@5 does not
      regress below the Slice A baseline
- [ ] B6 — labelled fixtures and the relevance report are re-run; any
      relabeling is a hand judgment recorded in the fixture, never copied
      from current scorer output
- [ ] B7 — `functional-requirements.md` carries the new `REQ-178` entry and
      the corrected `REQ-074`/`REQ-167` lines, matching `GATE-QUESTIONS.md`
- [ ] B8 — `quick-lookup/README.md`, `system-map/prompt-layout-spec.md`,
      `system-map/game-rules-retrieval.md`, and `user-flows.md` carry this
      step's query-construction wording
- [ ] B9 — `npm --workspace apps/backend run test:eval` and
      `npm run quality:check` are green

## Verification

```bash
npm run retrieval:report
npm --workspace apps/backend run test:eval
npm run quality:check
```

## Files touched

- `apps/backend/src/gameRulesRetrieval.ts` (`buildQueryParts`)
- `apps/backend/src/gameRulesRetrieval.test.ts`
- labelled eval fixtures under `apps/backend/src/eval/fixtures/`
- `PRD/sections/functional-requirements.md` (REQ-178 new; REQ-074, REQ-167
  corrections)
- `PRD/sections/quick-lookup/README.md`
- `PRD/sections/system-map/prompt-layout-spec.md`
- `PRD/sections/system-map/game-rules-retrieval.md`
- `PRD/sections/user-flows.md`
