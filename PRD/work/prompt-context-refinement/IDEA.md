# Idea — prompt-context-refinement

## Problem

The owner has five fresh observations about the rules-question prompt and
context pipeline (Quick Lookup and In-Depth), captured in
`intake/promptRefinement-notes.md` (cited verbatim below). Prior prompt-
refinement docs exist in `PRD/work/promptRefinement.md`,
`PRD/work/promptRefinement-analysis.md`, and
`PRD/work/promptRefinement-enhancements.md`, but per the owner's framing they
are background context only — useful for understanding the application, not
a settled gameplan. This package's job is to define a fresh gameplan for the
five observations below, not to inherit conclusions from those prior docs.

## The five observations (from `intake/promptRefinement-notes.md`)

1. Mechanic-keyword enrichment gap: asking about a mechanic by name (Quick
   Lookup path) without supplying a card fails to resolve, even though
   supplying a card with that mechanic works. Owner's own idea: identify
   every unique MTG keyword/mechanic, and when a mechanic is relevant to the
   question (asked directly, or present on a supplied card), inject a
   definition/explanation section into the prompt — even where oracle text
   already covers it, to backstop cards whose oracle text doesn't spell out
   the rule. Owner flags this as a possible RAG-bucket item and is unsure
   where the line is.
2. Prompt spec/legibility: the owner wants a written spec/outline of the
   actual prompt sent to the backend — what sections exist, and which are
   present/absent per path — because past ad hoc prompt output was "an
   overwhelming amount of json" that the owner couldn't parse. Owner wants
   this to drive future prompt-format optimization for rules-question
   resolving.
3. Guardrail tuning: the owner wants to understand how off-topic/off-domain
   guardrails trigger and be able to tune them. Concrete case: asking about
   "combos" got rejected as "not a mechanic" — technically true, but a
   common MTG-adjacent phrase that should probably still resolve. Owner
   wants common phrasing patterns identified so they don't misfire.
4. External validation data: a friend mentioned online data sets showing
   worked/resolved complex MTG rules questions; owner thinks this could
   validate/tune the prompt against real-world hard cases.
5. Quick Lookup multi-card context: referencing another card in Quick
   Lookup is "a complete gamble" on whether context is correct. Owner is
   considering (possibly larger) expansion: let Quick Lookup users add all
   the cards they want to discuss and drop full game-context capture
   entirely, to guarantee card context while keeping the fast experience.

## Outcome

A fresh gameplan (design brief -> sliced plan) addressing observations
2–5 directly. Observation 1, which the owner flags as a probable RAG-bucket
item, is filed to its own markdown file (not folded into this gameplan) and
noted for later work, per the owner's explicit filing instruction below.

## Owner's scope instruction (input, not pre-authorization)

> if something falls into the rag category, that can be put into its own
> markdown file and noted to be worked on later

This is a filing instruction from the launch request, not a product decision
already made — refinement still decides, case by case, whether an item
belongs in the RAG bucket. Observation #1 is the owner's own flagged
candidate for that bucket.

## Non-goals (for this kickoff capture)

- Not re-authoring or promoting the three background docs
  (`promptRefinement*.md`) as product truth.
- Not deciding implementation details (mechanic vocabulary source, guardrail
  phrase list, Quick Lookup UX shape) — that's refinement's job.
- Not building the RAG-bucket item(s) here — they get filed to their own doc
  and deferred.

## Intake

- `intake/promptRefinement-notes.md` — the owner's authoritative five
  observations (copied verbatim from
  `.worktrees/.graph-intake/graph-20260830-154444/promptRefinement-notes.md`).
  Defines the starting scope for this package.
- `intake/MANIFEST.md` — records intake origin, the owner's verbatim framing,
  the cited-not-authority background docs, and the RAG-filing instruction
  (copied verbatim from
  `.worktrees/.graph-intake/graph-20260830-154444/MANIFEST.md`).

## Background docs (cited, not authority)

- `PRD/work/promptRefinement.md`
- `PRD/work/promptRefinement-analysis.md`
- `PRD/work/promptRefinement-enhancements.md`

These are useful for context on how the prompt/context pipeline currently
works and what's been considered before. They do not define scope or
pre-approve any direction for this package.

## Prior run

- `PRD/instructions/receipts/prompt-context-retrieval-tuning-2026-06-18.md` — shipped `DEC-045`/`DEC-046`/`DEC-047`: reworked System 2 topic selection and System 3 (`gameRulesRetrieval.ts`) IDF-weighted scoring with question/keyword boosts; directly touches the retrieval/guardrail ground observations 1 and 3 sit on.
- `PRD/instructions/receipts/quick-lookup-2026-08-01.md` — shipped the Quick Lookup mode itself: prompt assembly, question/card-scored System 3 retrieval, optional metadata/rulings enrichment, and a "prompt-only off-domain guardrail" — directly relevant to observations 1, 3, and 5 (Quick Lookup card-context behavior).
- `PRD/instructions/receipts/prompt-preview-command-2026-06-06.md` — shipped `npm run prompt:preview`, a developer tool that writes reviewable prompt-text/normalized-context/enrichment-trace artifacts per fixture; directly relevant to observation 2 (prompt spec/legibility) as an existing tool that could surface the "overwhelming json" as readable output.
- `PRD/instructions/receipts/phase-scoped-prompt-context-2026-06-06.md` — shipped phase-scoped prompt context sections (DEC-034–037); relevant background on how the prompt is currently sectioned, which observation 2 wants documented.
- `PRD/instructions/receipts/supplemental-game-rules-retrieval-2026-06-05.md` — shipped supplemental game-rules retrieval scoring and eval fixtures (DEC-032); relevant background on the retrieval/enrichment mechanism observations 1 and 4 touch.
- `PRD/instructions/receipts/general-game-rules-prompt-2026-06-05.md` — shipped the general game-rules prompt section; relevant background on prompt structure (observation 2).
- `PRD/instructions/receipts/full-card-oracle-prompt-2026-06-12.md` — shipped full card oracle text in every zone; relevant background on card-context completeness, adjacent to observations 1 and 5.

These are offered as input for `thejudge-refinement` to consider, not as
pre-decided scope.
