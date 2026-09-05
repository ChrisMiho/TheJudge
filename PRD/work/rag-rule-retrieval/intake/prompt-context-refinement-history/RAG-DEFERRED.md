# RAG-deferred — mechanic-keyword definition enrichment (Observation 1)

**What happened:** one of the owner's five observations is corpus-retrieval
(RAG) work and is split out of this gameplan, per the owner's filing
instruction. It is recorded here to be worked on later, not built now.

**What it means for you:** the design brief for this package covers
observations 2–5. Observation 1's enrichment idea is parked here. One piece of
it — the immediate refusal bug — is *not* parked; it is handled by REQ-168 in
this same package. The line between the two is the whole point of this file.

## The observation

Asking about a mechanic by name in Quick Question, with no card supplied, failed
to resolve — the answer said the mechanic "was not an official MTG mechanic."
Supplying a card that has the mechanic resolved fine. The owner's enhancement:
identify every unique MTG keyword/mechanic, and whenever a mechanic is relevant
to a question (asked by name, or present on a supplied card), inject a
definition/explanation section for each relevant mechanic into the prompt — even
when a card's oracle text already reminds the rule — so a mechanic is fully
defined regardless of whether the specific cards in play spell it out.

The owner flagged this himself as a probable RAG-bucket item and was unsure
where to draw the line.

## The line this package draws

Observation 1 is two different things wearing one description.

1. **The refusal is a guardrail misfire — kept in this package.** "This mechanic
   is not an official MTG mechanic" is the off-domain guardrail persona
   (DEC-108) over-firing on a real Magic term. Widening that guardrail so a real
   mechanic (or a common Magic-adjacent phrase) asked by name is answered rather
   than refused is exactly REQ-168 in this package. A mechanic asked by name
   should resolve; that is a prompt-instruction fix, not a corpus build.

2. **The guaranteed definition enrichment is RAG — deferred here.** "Identify
   every unique MTG mechanic, build the vocabulary, and inject each relevant
   mechanic's definition/explanation into the prompt" is retrieval-augmented
   generation: it needs a keyword/mechanic corpus, a per-question and per-card
   relevance-matching step, and a new prompt section fed from that corpus. That
   is corpus-retrieval work, and it belongs with the RAG track, not this
   gameplan's brief or `PRD/sections/` truth.

The tell: fixing the refusal changes one instruction line and needs no new data.
Guaranteeing every relevant mechanic's definition needs a mechanic corpus and a
matcher — new retrieval machinery. Different size, different bucket.

## Why this is RAG-shaped, concretely

- It needs a **source of truth for mechanic definitions** — the full MTG keyword
  set (Comprehensive Rules 702.x keyword abilities, plus keyword actions and
  ability words) with an authored or derived definition per entry. That is a new
  committed corpus.
- It needs a **relevance step**: detect which mechanics a question or a card set
  implicates, then select their definitions. That is retrieval, adjacent to
  System 3's existing IDF-scored rule retrieval.
- It adds a **new prompt section** ("MECHANIC DEFINITIONS" or similar) fed from
  that corpus, deliberately duplicating text that oracle reminders sometimes
  already carry.

This sits directly on top of open question **Q-001** (how the System 3 keyword
vocabulary is derived and maintained long-term). Q-001 is unresolved, and this
enrichment would either depend on or subsume that decision. Building the
definition-injection corpus without resolving Q-001 would silently pick the
keyword-vocabulary strategy that Q-001 exists to decide.

## What a future RAG pass would need to decide

- Where mechanic definitions come from (CR 702.x parse, a curated authored set,
  or Scryfall per-card `keywords` unioned at query time) — the Q-001 fork.
- How relevant mechanics are detected from the question text and from an attached
  card set (note this now interacts with REQ-167's multi-card lookup).
- Whether the definition section is always injected for a detected mechanic or
  only when oracle reminder text is absent, and how duplication with oracle text
  is bounded against the prompt budget.
- How the added section is regression-tested (goldens + eval harness), and
  whether NFR-018's external worked-solutions validation set covers keyword-heavy
  interactions.

## Handoff

- Do **not** fold this into `prompt-context-refinement`'s DESIGN-BRIEF or into
  `PRD/sections/` truth. It is deferred.
- When RAG work is prioritized, open a dedicated refinement, resolve or
  incorporate Q-001, and scope the mechanic-definition corpus + injection there.
- The refusal symptom is already owned by REQ-168 here; do not re-park it.
