# Slice E — Worked-solutions evaluation set

## Status: planned

## Goal

A committed set of real, hard rules questions with published worked solutions
runs through the existing eval harness, each case documenting where it came
from, so prompt quality can be checked against how hard cases actually
resolve — not just hand-authored fixtures. Test data only; never wired into a
live prompt; non-gating.

## Requirements

NFR-018.

1. Investigate and select sources for real worked-solution rules questions
   (public rules Q&A / judge resources); confirm each source's licensing
   permits committing the derived case before anything is committed. Sources
   the search turns up that are not licensed for this use are excluded, not
   worked around.
2. Curate a committed evaluation set under `apps/backend/src/eval/` (new
   subfolder, e.g. `worked-solutions/`, or additional fixtures alongside the
   existing eval fixtures — implementation's call, following the existing
   fixture format) fed through the existing eval harness infrastructure
   (`contextEvaluationHarness.ts` / `npm run test:eval`, and/or the
   `compare-combo-answer-quality.mjs`-style opt-in live-provider comparison
   pattern where a case needs a live answer to compare against the published
   solution — implementation's call, following whichever existing pattern the
   case type actually needs).
3. Each case documents its source/provenance (owner's explicit ask): where the
   question and its worked solution came from, and licensing/attribution
   status.
4. The set never becomes runtime prompt context and adds no new runtime
   dependency or external call; it is not wired into `npm run quality:check`
   as a gate — running it is opt-in.

## Acceptance criteria

- [ ] E1 — A committed worked-solutions evaluation set exists, sourced from
  real hard rules questions with published worked solutions.
- [ ] E2 — Every case documents its source/provenance (where the question and
  its worked solution came from) and confirms licensing permits committing it.
- [ ] E3 — The set runs through the existing eval harness infrastructure
  without a new runtime dependency, external call, or live prompt wiring.
- [ ] E4 — `npm run quality:check` is unaffected by the new set — it stays a
  non-gating, opt-in validation track.

## Verification

```bash
npm --workspace apps/backend run test:eval
npm run quality:check
```

## Files touched

- `apps/backend/src/eval/` (new worked-solutions fixtures/subfolder + a
  provenance manifest or per-case source field)
- `apps/backend/src/eval/contextEvaluationHarness.ts` (only if a new,
  non-gating check type is needed to compare an answer against a worked
  solution; otherwise unchanged)
- `package.json` / `apps/backend/package.json` (only if a new npm script is
  needed to run the worked-solutions track separately from `test:eval`)

## PRD promotion checklist

Executed at cleanup, not in this slice. Durable outcomes for this package:

- [ ] REQ-167, REQ-168, REQ-169, FLOW-023, NFR-018 already live as durable
  truth in `PRD/sections/functional-requirements.md`,
  `PRD/sections/user-flows.md`, `PRD/sections/non-functional-requirements.md`
  (written at the `define` gate) — confirm text still matches shipped
  behavior; no re-promotion needed unless implementation diverged from the
  approved diff.
- [ ] `PRD/sections/system-map.md` — "Quick Lookup" entry: update the summary
  from "an optional single card" to the multi-card (capped at 5) behavior;
  add REQ-167, FLOW-023 to "Backed by".
- [ ] `PRD/sections/system-map.md` — "Commander Spellbook combo retrieval"
  entry: update the summary's "lookup mode requires... an attached card"
  (singular) to the qualify-on-any-one / attached-card-coverage / complete-or-
  partial behavior; add REQ-167 to "Backed by".
- [ ] `PRD/sections/quick-lookup/README.md` — confirm slice B's implementation
  update landed and matches shipped behavior.
- [ ] `PRD/sections/system-map/prompt-layout-spec.md` (slice D) and
  `PRD/sections/system-map/lookup-phrasing-glossary.md` (slice C) are durable
  and stay under `system-map/` (already in a durable location, no move
  needed).
- [ ] `RAG-DEFERRED.md` — decide whether observation 1's mechanic-definition
  enrichment idea needs a standing pointer (e.g. a `Q-###` in
  `open-questions.md`, or a future work-package idea filed under
  `PRD/ideasForLater/`) before the package folder is deleted, so the deferred
  idea is not silently lost.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change (the `AskAiRequest`
  `card` → `cards` shape change from slices A/B is the one documented
  exception)
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/prompt-context-refinement/` ready to
  delete
