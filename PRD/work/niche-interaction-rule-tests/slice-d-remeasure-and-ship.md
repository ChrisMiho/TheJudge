# Slice D — Re-measure against every rule-output suite and ship

## Status: planned

## Dependencies

Slices A, B, and C. The re-measure runs against production code that carries the topic, the selector, and the amended gate.

## Goal

Prove that the topic fixes the Manufactor + Esix question and moves no other rule-output number, record the before and after in REQ-220's Notes, and close the package's ship gates.

## Requirements

1. **Model folder (brief step 7).** From the repo root of the build worktree: `cp -R /Users/chrismiho/Coding/Projects/TheJudge/apps/backend/data/models apps/backend/data/models`. `npm run eval:worked-solutions` ranks with the local MiniLM embedder, which loads from that gitignored folder. If the folder is absent from the main checkout, stop and report. Never run `node scripts/warm-embedding-model-cache.mjs` (network download). The embedder runs with remote models off (`apps/backend/src/providers/localEmbeddingProvider.ts:31`, `env.allowRemoteModels = false`), so the re-measure makes no network call. Do not commit the folder.
2. **PR #273 check.** `git fetch origin`; if `origin/main` now carries a different rule index than `c1188dc8`, re-measure every rules-text-dependent number before the final commit. If the topic total exceeds 26,000, or any acceptance number moves for a reason other than the refresh itself, stop and report to the owner; never change the ceiling or the targets.
3. **Full gate.** `npm run quality:check` (typecheck, lint, format, backend and frontend coverage including the rules gate, context-eval harness, benchmark, and build-policy tests, then the scripts tests with the coverage gate).
4. **Re-measure with the suites themselves** (the define scripts simulate the topic on top of production, so their parity checks no longer hold once production carries it; do not re-run them as gates): `npm run eval:worked-solutions` (287/392, "392/392 cases ranked semantically", first-ship 16/18 hybrid and 14/18 lexical); `npm run eval:rules-staleness` (0 stale, 0 awaiting a re-freeze); after committing the slices (the trace refuses a checkout with uncommitted changes, and writes only under the gitignored `output/`) `npm run eval:evidence-trace -- --case academy-manufactor-esix-treasure` (`availableToAnswer` true for all four deciding rules).
5. **Tester's verbatim questions.** With a throwaway probe in the scratchpad directory (not committed) that calls `preparePromptInput` with each card attached: the verbatim Manufactor + Esix question has 614.1a, 616.1, 616.1e, 616.1f in the prompt under hybrid (local embedder) and lexical ranking; the Necropotence + Silence results are unchanged (corpus case: 514.1 System 3 #3 hybrid, #2 lexical, with 514.2 and 514.3a outside the top ten; verbatim question: 514.2 #7 and 514.3a #3 hybrid, #7 and #4 lexical). Record each as a dated observation in `slice-d.evidence.md`.
6. **Unchanged numbers.** Gating labelled checks 14/14 semantic and 14/14 lexical; none of the 31 fixtures' prompt, context, or checklist-report goldens changes; benchmark lexical clean 0.5833 and polluted 0.5769, hybrid clean 0.8974 and polluted 0.8910; coverage gate passes with `coverage.json` unchanged; among the game-rules data files only `gameRulesTopicManifest.json` and `gameRulesByTopic.json` differ from `origin/main`. A result that fixes the case but moves any other number is reported as a regression, never re-labelled.
7. **Record before and after.** In `PRD/sections/functional-requirements.md`, `### REQ-220`, replace the last Notes bullet ("the build re-runs every suite above and records its before/after here") with the measured before/after of every suite in requirement 4 to 6.
8. **Final greps.** Re-run both amendment greps from the brief (Invariant 1 and Invariant 2) and `grep -rniE "23 curated|23 topics" PRD/sections`; every remaining hit must be an "unchanged" row of the brief's tables. Confirm REQ-221 and any `DEC-###` addition are absent.
9. **Offline only.** No live OpenAI call, no `npm run eval:answer-quality`, no `npm run data:refresh`, no Scryfall fetch. No dev server or browser is used, so no runtime-cleanup criterion applies.

## Acceptance criteria

- [ ] D1: `apps/backend/data/models/` was copied from the main checkout with `cp -R`, and not committed
- [ ] D2: A dated observation confirms `scripts/warm-embedding-model-cache.mjs` was not run and no network call was made during the re-measure
- [ ] D3: `git fetch origin` was run and the rule index on `origin/main` was compared with `c1188dc8` again before the final numbers; unchanged, or the rules-text-dependent numbers were re-measured and the 26,000 ceiling still holds
- [ ] D4: `npm run quality:check` passes
- [ ] D5: `npm run eval:worked-solutions` ran and reports 287/392 with 392/392 cases ranked semantically, unchanged
- [ ] D6: `npm run eval:rules-staleness` ran and lists 0 stale cases and 0 awaiting a re-freeze
- [ ] D7: `npm run eval:evidence-trace -- --case academy-manufactor-esix-treasure` ran on the committed tree and shows `availableToAnswer` true for 614.1a, 616.1, 616.1e, 616.1f
- [ ] D8: A dated observation records the tester's verbatim Manufactor + Esix question with both cards attached: 614.1a, 616.1, 616.1e, 616.1f all in the prompt under hybrid and lexical ranking
- [ ] D9: A dated observation records Necropotence + Silence unchanged in both wordings (corpus: 514.1 #3 hybrid and #2 lexical, 514.2 and 514.3a outside the top ten; verbatim: 514.2 #7 and 514.3a #3 hybrid, #7 and #4 lexical)
- [ ] D10: The context-evaluation harness labelled checks are 14/14 semantic and 14/14 lexical, the benchmark numbers are unchanged (0.5833 / 0.5769 lexical, 0.8974 / 0.8910 hybrid), and no golden file is changed
- [ ] D11: Among the game-rules data files, `git diff --stat origin/main` lists only `gameRulesTopicManifest.json` and `gameRulesByTopic.json`, and `baseline.json` records the Manufactor case's four rules as `inTopic`
- [ ] D12: REQ-220's last Notes bullet records the measured before and after for every suite, replacing the "records its before/after here" placeholder
- [ ] D13: The Invariant 1 grep, the Invariant 2 grep, and the "23 curated|23 topics" grep leave only hits the brief dispositions as unchanged, and `PRD/sections` has no REQ-221 and no new `DEC-###`
- [ ] D14: A dated observation confirms no live OpenAI call, data refresh, or Scryfall fetch occurred during the build

## Verification

```bash
cp -R /Users/chrismiho/Coding/Projects/TheJudge/apps/backend/data/models apps/backend/data/models
git fetch origin && git diff c1188dc8 origin/main -- apps/backend/data/gameRulesRuleIndex.json
npm run quality:check
npm run eval:worked-solutions
npm run eval:rules-staleness
npm run eval:evidence-trace -- --case academy-manufactor-esix-treasure
git diff --stat origin/main
grep -rniE "23 curated|23 topics" PRD/sections
```

Dated observation lines for D2, D8, D9, D14 go in `PRD/work/niche-interaction-rule-tests/slice-d.evidence.md`, one per criterion id, as `YYYY-MM-DD D8 — <what was observed>`.

## Files touched

- `PRD/sections/functional-requirements.md` (REQ-220 Notes bullet)
- `PRD/work/niche-interaction-rule-tests/slice-d.evidence.md` (new)
- `apps/backend/data/models/` (copied, gitignored, never committed)

## PRD promotion checklist

(Execution happens in cleanup; the apply already happened in Slices B and C.)

- [ ] REQ-220 lives in `functional-requirements.md`; REQ-022 and REQ-222 are amended; REQ-229's clause is in; REQ-221 is unused
- [ ] The system-map, game-rules-retrieval, prompt-layout-spec, integrations-and-data, quick-lookup, and in-depth lines are amended and no "card-agnostic" claim about System 2 remains
- [ ] `worked-solutions/README.md` describes `inTopic`
- [ ] Receipt records the follow-ups: the Necropotence corpus wording still misses 514.2 and 514.3a, search-only counts still treat topic-carried rules as misses, and the prompt output-format package is next
- [ ] `PRD/work/niche-interaction-rule-tests/` (its define scripts and outputs included) is ready to delete

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/niche-interaction-rule-tests/` ready to delete
