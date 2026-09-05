# Intake manifest — graph-20260905-061805

- Run ID: `graph-20260905-061805`
- Slug: `rag-rule-retrieval`
- Origin: owner handoff via `/graph-kickoff @PRD/work/probe-slow-load-vs-rag/`, 2026-09-05

## Owner's framing (verbatim from the launch request)

> i want to better refine this idea and cleanup the rest of the work folder on
> that pertains to rag, so that we have a pinpoint gameplan

## What "this idea" is

The `probe-slow-load-vs-rag/` package's `GRAPH-BRIEF.md` was already consumed:
the image-first-cards run built it and shipped (receipt
`PRD/instructions/receipts/image-first-cards-2026-09-05.md`). What the probe
left unbuilt is its RAG conclusion — the ordered path in
`FINDINGS-data-layer.md` ("The path (three distinct pieces)"): query-construction
fix + Scryfall keyword enrichment as the real RAG pre-work, then semantic
(embeddings / hybrid) rule retrieval as the end state. Every other RAG artifact
in the repo is staged below so refinement shapes one consolidated design.

## Staged verbatim (evidence, never authority)

Each folder is a verbatim copy; the stated origin is the path it was copied from.

- `probe-slow-load-vs-rag/` — `PRD/work/probe-slow-load-vs-rag/` on `main`
  (2026-09-03 investigate probe). `GRAPH-BRIEF.md` there is already shipped as
  image-first-cards; `FINDINGS-data-layer.md` carries the RAG path.
- `probe-prompt-data-optimization/` — `PRD/work/probe-prompt-data-optimization/`
  on `main` (2026-09-01 investigate probe): prompt anatomy, data pipeline,
  prior-work recovery, the non-RAG data levers and the chunking findings the
  semantic package was told to absorb.
- `prompt-refinement-notes/` — the four loose `PRD/work/promptRefinement*.md`
  notes. `promptRefinement-notes.md` was already consumed by the shipped
  prompt-context-refinement run (receipt
  `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md`); its
  observation #1 was filed RAG-deferred. `promptRefinement-analysis.md` is the
  refinement-vs-RAG boundary analysis; `promptRefinement-enhancements.md` is an
  unfilled template; `promptRefinement.md` is the owner's original framing.
- `semantic-rule-retrieval-branch/` — `PRD/work/semantic-rule-retrieval/` on
  `origin/thejudge-auto/semantic-rule-retrieval` (never merged; its docs-only
  PR #154 was closed unmerged 2026-09-01). A prior graph run's DESIGN-BRIEF,
  9-slot GATE-QUESTIONS (unanswered), embedding-provider measurement, and
  handoff. `GRAPH-RUN.md` and `STATUS.owner-action` deliberately not copied —
  they belong to that run, not this one.
- `combo-context-validation-branch/` — `PRD/work/combo-context-validation/` on
  `origin/explore/semantic-rule-retrieval`: the investigation FINDINGS (RAG
  benchmark numbers), handoff, idea, readme. The harness code and its
  generated artifacts stay on that branch and are cited, not copied.
- `prompt-context-refinement-history/RAG-DEFERRED.md` — recovered from git
  history (`2499a19^`); the file was deleted with its work folder at cleanup,
  yet live truth still points at it (`PRD/sections/functional-requirements.md`
  ~L3874 and `PRD/sections/non-functional-requirements.md` ~L286 cite
  `PRD/work/prompt-context-refinement/RAG-DEFERRED.md`). It is the
  mechanic-definition enrichment idea filed for the RAG track.

## Cited only (durable, not copied, not opened by refinement)

- `PRD/ideasForLater/future-infra/sections/rag-data-plane.md`
- `PRD/ideasForLater/future-infra/sections/retrieval-architecture.md`
- `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md`
- `PRD/instructions/receipts/image-first-cards-2026-09-05.md`
- `PRD/instructions/receipts/commander-spellbook-combos-2026-08-22.md`
- `origin/explore/semantic-rule-retrieval` —
  `PRD/work/combo-context-validation/harness/rag/` (benchmark + scorers)

## Owner's cleanup instruction (a filing instruction, not a pre-authorization)

The owner asked that the rest of the work folder pertaining to RAG be cleaned
up. The driver handles this as mechanics after node 2 has copied this staging
into the package: the two probe folders and the four loose notes are removed
from `PRD/work/` on the run's branch in the same docs-only PR, so every one of
those words survives in `PRD/work/rag-rule-retrieval/intake/`. No product
decision is made by that move. The remote branches, the local worktree, and the
untracked harness artifacts are reported to the owner, never deleted by the run.

## Residual non-RAG finding, reported not built

`FINDINGS-slow-load.md`'s compression fix targeted `cardMetadata.json` (16.4 MB).
Image-first-cards slimmed it to ~6.7 MB, under CloudFront's 10 MB auto-compress
ceiling, so that target is moot. `cardScanMap.json` (~21 MB) and
`cardPrintingPrices.json` (~38 MB) remain above the ceiling. That is a deploy
finding outside this RAG idea; it is preserved here for the owner.
