# Semantic rule retrieval + combo over-assertion fix

## Problem

System 3 (the "additional relevant rule excerpts" in the prompt) retrieves rules
with lexical TF-IDF. Measured (see `combo-context-validation/FINDINGS.md`), that
finds the right rule only 58% of the time (recall@5) on clean questions and
collapses to 3% when attached-card oracle text is in the query. Semantic
embedding retrieval scores 89% / 60% on the same benchmark. Separately, the model
over-asserts combos — fabricating a working combo from cards that don't combo.

## Outcome

Two coupled changes, one design brief:
- **(A) Semantic rule retrieval (RAG).** Embed the CR corpus (3,432 rules, ~21MB,
  in-process — no vector DB), embed the query at request time behind a swappable
  provider seam, cosine into System 3's existing top-5 slot. Keep lexical as the
  mock/offline default, exact-rule-id boost, and failure fallback. Fix query
  construction (don't pollute the query with raw card oracle text). Rules only —
  cards/combos/rulings are keyed lookups, not search.
- **(B) Combo over-assertion fix.** Strengthen the prompt instruction so lookup-mode
  answers don't claim a working combo unless every ingredient is attached, and name
  the missing role otherwise.

## Open question (resolve first)

Local bundled embedding model vs OpenAI for the runtime query embedding — decided
by measuring a local model on the existing benchmark. See `HANDOFF.md`.

## Non-goals

No vector database. No semantic retrieval over cards/combos/rulings. Not the parked
mechanic-definition corpus injection (`RAG-DEFERRED.md`). No card-recommendation
engine (REQ-167 preserved).

## Relation to prior work

Direct follow-on to the `combo-context-validation` investigation (done, committed).
Reuses its RAG benchmark + combo eval harness.
