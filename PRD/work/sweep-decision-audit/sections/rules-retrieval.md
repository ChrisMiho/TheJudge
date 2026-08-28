# Sweep finding — rules-retrieval

- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/rules-retrieval.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 6

## DEC-029 — absorbed
In-Depth's "Retrieval enrichment" section states `OFFICIAL RULINGS` carries published WotC Oracle rulings for submitted cards at its fixed prompt position, and Quick Lookup's assembly section cites the card's WotC rulings (DEC-029) as a per-card enrichment layer — both confirm prompt-only, no product API/UI change, matching the decision's core substance.

## DEC-030 — absorbed
In-Depth's retrieval section describes the `GAME RULES (reference)` block loading verbatim WotC CR excerpts from committed artifacts at its fixed prompt position, correctly stated in its now-amended form (selection driven by DEC-045, per DEC-030's own "superseded in part" note) rather than the stale "all topics every request" wording.

## DEC-032 — absorbed
In-Depth's retrieval section states `ADDITIONAL RELEVANT RULE EXCERPTS` adds up to 5 supplemental rules, deduplicated and omitted when nothing scores above 0, at its fixed prompt position — the decision's cap, dedup, and placement substance carries through, correctly described using DEC-046's superseding scorer rather than DEC-032's stale flat formula.

## DEC-045 — absorbed
In-Depth states System 2 selection is gated on `turnPhase`, `combatStep`, and populated zones only (no card names/oracle text), and its "Rejected alternatives" section explicitly closes the door on the prior all-topics-every-request baseline, citing DEC-045. Quick Lookup separately confirms lookup mode uses the fixed always-on core set rather than the state-gated selector, consistent with the decision's card-agnostic/game-state scope split.

## DEC-046 — absorbed
In-Depth and Quick Lookup both state System 3 supplemental scoring is IDF-weighted lexical scoring with question and keyword boosts, deduplicated against the System 2 selection — matching the decision's replacement of DEC-032's flat scoring, and In-Depth's "Rejected alternatives" section explicitly closes the door on the old +1-per-shared-word formula.

## DEC-047 — absorbed
In-Depth's retrieval section states directly: "Retrieval relevance (System 2 selection and System 3 recall) is verified by the eval harness against labeled expected outcomes, not structural checks alone" — this is the decision's core substance verbatim in intent.
