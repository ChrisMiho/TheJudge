# Slice E — Pick rules by meaning, not word overlap

## Status: planned

## Goal

Ship semantic rule retrieval for System 3: a committed per-rule embedding
artifact, an `EMBEDDING_PROVIDER` seam mirroring `ASK_AI_PROVIDER`, in-process
cosine ranking with the exact-rule-id boost merged in, lexical retained as
the mock/offline default and failure fallback — and re-measure the deploy
package budget reserve so the bundled model fits.

## Requirements

1. Build a committed offline artifact in `apps/backend/data/` holding one
   384-dimension embedding vector per entry in `gameRulesRuleIndex.json`
   (post Slice C cleanup), produced by an offline step alongside
   `scripts/build-game-rules.mjs`, rebuilt only on a Comprehensive Rules
   refresh. Shape the embedded text before vectorizing: fold a keyword's
   numbered sub-rules into one self-contained document, prefix an orphaned
   lettered sub-rule's embedding text with its parent rule's sentence, and
   exclude fused `Example:` text from the embedded text (it still prints in
   the prompt).
2. Add an `EMBEDDING_PROVIDER` seam under `apps/backend/src/providers/`
   mirroring the existing `askAiProvider.ts` / `createAskAiProvider.ts` /
   `mockAskAiProvider.ts` shape: values `mock` | `local` | `openai`, default
   `mock`, never auto-switching on `NODE_ENV` or deploy target. `mock` does
   no embedding (lexical only). `local` embeds the query in-process with a
   bundled quantised `all-MiniLM-L6-v2`. `openai` is seam-selectable for
   live mode only, never the default.
3. The async route handler embeds the query and passes the resulting vector
   (or `null`) into `preparePromptInput` as an option, so
   `preparePromptInput` itself stays synchronous.
4. In `apps/backend/src/gameRulesRetrieval.ts`, rank by cosine similarity
   against the committed rule vectors when a query vector is present, merge
   the exact-rule-id/parent-rule-id boost into that ranking, and fall back
   to the existing lexical IDF scorer on any embedding failure (model load,
   inference error, missing artifact, provider error) — emitting one
   diagnostic warning and still returning up to 5 excerpts.
5. Re-measure `NON_DATA_RESERVE` in `scripts/lambda-package-budget.test.mjs`
   against the real packaged footprint once the bundled model lands in
   production `node_modules` (measured intake estimate: ~23 MB for a
   quantised MiniLM alone, before the runtime that loads it — re-measure,
   do not adopt this number uncritically). Name the model as a contributor
   in the test's failure message. Never loosen the guardrail to make a red
   test green — re-base it against a real measurement.
6. Extend the eval to measure the semantic path using committed frozen
   query embeddings, so `system3-expected-recall` and `system3-noise-
   excluded` run with no live embedding call and no live AI call.
7. Apply this step's `PRD/sections/` amendments by intent against current
   live text, finishing every location a bundled earlier-slice edit left
   partial: the new `REQ-181` entry with `SCOPE-A`, `SCOPE-B`, `SCOPE-C`,
   `SCOPE-D` merged into its Constraints list; the semantic-eval portion of
   `REQ-032` (plus its REQ-181 dependency); the full `REQ-022` diff;
   `non-functional-requirements.md` `NFR-017`; `system-map.md`'s
   "Supplemental retrieval (System 3)" block (:88); the remaining paragraphs
   of `system-map/game-rules-retrieval.md` ("How it works", "Data flow",
   "Where it lives", "Worked example", "Invariants/gotchas");
   `in-depth/README.md` (:329-332 Built line, :465-467 rejected-alternatives
   entry); `integrations-and-data.md` (Tech Stack Embedding Provider line,
   Game Rules Data Strategy tail, prompt-contents supplemental-rules line);
   and finish `quick-lookup/README.md` and
   `system-map/prompt-layout-spec.md` to their full accepted text. Exact
   accepted wording for every one of these is in `GATE-QUESTIONS.md`.

## Acceptance criteria

- [ ] E1 — a committed offline artifact holds one embedding vector per rule
      index entry, built alongside `build-game-rules.mjs`
- [ ] E2 — `EMBEDDING_PROVIDER` (`mock` | `local` | `openai`, default
      `mock`) exists and never auto-switches on environment
- [ ] E3 — `EMBEDDING_PROVIDER=mock` performs no embedding and makes no
      external call; a checkout with no model access and no network
      behaves exactly as before
- [ ] E4 — `EMBEDDING_PROVIDER=local` embeds the query in-process and
      cosine-ranks it against the committed vectors
- [ ] E5 — the async route handler embeds the query and passes the vector
      into `preparePromptInput` as an option; `preparePromptInput` stays
      synchronous
- [ ] E6 — the exact-rule-id/parent-rule-id boost is merged with semantic
      ranking (measured: gold rule 613.9 ranks 1st lexically, 5th
      semantically, and is still retrieved)
- [ ] E7 — on any embedding failure, System 3 falls back to lexical
      retrieval, still returns up to 5 excerpts, and emits one diagnostic
      warning
- [ ] E8 — System 3 stays capped at 5 excerpts, deduplicated against System
      2 by rule-number prefix
- [ ] E9 — the shipped quantised model's clean and multi-card recall@5 are
      re-measured on the Slice A benchmark against the full-precision
      reference (0.865 clean / 0.763 multi-card); a material drop ships
      full precision by container image instead
- [ ] E10 — `system3-expected-recall` and `system3-noise-excluded` run
      against the semantic path using committed frozen query embeddings, no
      live embedding or AI call
- [ ] E11 — `node --test scripts/lambda-package-budget.test.mjs` is green
      with the bundled model and the embeddings artifact present, and
      `NON_DATA_RESERVE` is re-measured (not loosened blindly) against the
      real packaged non-data footprint
- [ ] E12 — every `PRD/sections/` location this slice owns matches its
      accepted `GATE-QUESTIONS.md` text
- [ ] E13 — `npm --workspace apps/backend run test:eval` and
      `npm run quality:check` are green
- [ ] E14 — a human confirms no live-network call occurs under
      `EMBEDDING_PROVIDER=mock` or `=local` by inspecting the code path
      (no fetch/HTTP client reachable from the embedding call in those two
      modes)

## Verification

```bash
npm --workspace apps/backend run test:eval
node --test scripts/lambda-package-budget.test.mjs
npm run quality:check
EMBEDDING_PROVIDER=local npm --workspace apps/backend run test:eval
```

## Files touched

- `apps/backend/src/providers/embeddingProvider.ts` (new)
- `apps/backend/src/providers/createEmbeddingProvider.ts` (new)
- `apps/backend/src/providers/mockEmbeddingProvider.ts` (new)
- `apps/backend/src/providers/localEmbeddingProvider.ts` (new)
- `apps/backend/src/providers/openAiEmbeddingProvider.ts` (new)
- `apps/backend/src/gameRulesRetrieval.ts` (cosine ranking, boost merge,
  fallback)
- `apps/backend/src/prompt/preparation.ts` (query-vector option)
- `apps/backend/src/config/index.ts` (`EMBEDDING_PROVIDER` config)
- route handler under `apps/backend/src/routes/`
- a new offline embeddings-build script alongside
  `scripts/build-game-rules.mjs`
- `apps/backend/data/` (new committed rule-embeddings artifact)
- `scripts/lambda-package-budget.test.mjs` (`NON_DATA_RESERVE`)
- `apps/backend/src/eval/contextEvaluationHarness.ts` /
  `contextEvaluationHarness.test.ts` (frozen query embeddings)
- `PRD/sections/functional-requirements.md` (REQ-181 new with SCOPE-A..D;
  REQ-022 full; REQ-032 remainder)
- `PRD/sections/non-functional-requirements.md` (NFR-017)
- `PRD/sections/system-map.md` (:88 block)
- `PRD/sections/system-map/game-rules-retrieval.md`
- `PRD/sections/system-map/prompt-layout-spec.md` (finish)
- `PRD/sections/quick-lookup/README.md` (finish)
- `PRD/sections/in-depth/README.md`
- `PRD/sections/integrations-and-data.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/rag-rule-retrieval/` ready to
      delete
