# Idea — rag-rule-retrieval

Ask AI's supplemental Comprehensive-Rules excerpts (System 3,
`apps/backend/src/gameRulesRetrieval.ts`) are picked by lexical keyword/IDF
scoring, which caps how well the right rule text reaches the model; the fix —
query construction, rule-corpus hygiene, and Scryfall keyword enrichment as
pre-work, then semantic (embedding/hybrid) retrieval as the end state — is
scattered today across `probe-slow-load-vs-rag`, `probe-prompt-data-optimization`,
four loose `promptRefinement*.md` notes, a closed-unmerged
`semantic-rule-retrieval` design (PR #154), and `combo-context-validation`'s
RAG benchmark numbers. This package consolidates all of that into one
pinpoint gameplan for the full path, absorbing the parked
`semantic-rule-retrieval` design and the RAG-deferred mechanic-definition
enrichment idea (`RAG-DEFERRED.md`, recovered from git history). Non-goals:
Commander Spellbook combo enrichment stays a separate, already-shipped
feature (cited for context, not reopened), and the CloudFront/S3
static-asset compression fix is out of scope (already resolved by
image-first-cards).

## Prior run

- `PRD/instructions/receipts/supplemental-game-rules-retrieval-2026-06-05.md`
  — built `gameRulesRetrieval.ts` (rule index loader, scorer, retrieval fn),
  DEC-032, REQ-022; the original System 3 supplemental-CR-retrieval feature.
- `PRD/instructions/receipts/prompt-preview-command-2026-06-06.md` — prompt
  preview tooling; its `cascade-keyword` fixture output ("5 supplemental
  rules, first score 41") shows the current scorer's shape.
- `PRD/instructions/receipts/prompt-context-retrieval-tuning-2026-06-18.md` —
  replaced System 3's flat +1-per-shared-word scoring with IDF weighting,
  question/keyword boosts, and an IDF-then-ruleId tie-break; the exact
  lexical scorer this idea proposes to move past.
- `PRD/instructions/receipts/prd-doc-traceability-2026-06-18.md` — cleanup
  pass; removed a dead `supplemental-game-rules-retrieval` link and queued
  `system-map-detail` to run after `prompt-context-retrieval-tuning`.
- `PRD/instructions/receipts/system-map-detail-2026-06-19.md` — wrote the
  deep per-subsystem prose for `PRD/sections/system-map/game-rules-retrieval.md`,
  today's canonical description of System 3.
- `PRD/instructions/receipts/decisions-router-split-2026-06-24.md` — split
  the decisions log into per-domain files, including
  `PRD/sections/decisions/rules-retrieval.md` (DEC-029/DEC-032's home).
- `PRD/instructions/receipts/quick-lookup-2026-08-01.md` — shipped Quick
  Lookup's question/card-scored System 3 retrieval path (same scorer as
  In-Depth).
- `PRD/instructions/receipts/commander-spellbook-combos-2026-08-22.md` —
  shipped Commander Spellbook combo enrichment (System-3-adjacent, not
  itself CR-rule retrieval); cited directly in this run's intake
  `MANIFEST.md`.
- `PRD/instructions/receipts/quick-lookup-spec-2026-08-27.md` — current-state
  feature spec for Quick Lookup, documenting its retrieval + combo-retrieval
  backend path.
- `PRD/instructions/receipts/in-depth-spec-2026-08-28.md` — current-state
  feature spec for In-Depth Question, documenting its retrieval enrichment +
  combo enrichment backend path.
- `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md` —
  reworked the System 3 supplemental-rules query; wrote `RAG-DEFERRED.md`
  (the mechanic-definition enrichment idea this package absorbs) at the
  owner's explicit request to split anything RAG-shaped out for later.
- `PRD/instructions/receipts/image-first-cards-2026-09-05.md` — shipped the
  non-RAG half of `probe-slow-load-vs-rag`'s findings (its `GRAPH-BRIEF.md`);
  this package picks up that probe's RAG conclusion.
- `PRD/instructions/receipts/single-source-invariants-2026-09-05.md` —
  immediately-prior run; touched `system-map/game-rules-retrieval.md` while
  consolidating cross-cutting invariants.
