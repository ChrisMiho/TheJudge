# GAMEPLAN — rules-test-harness (run 1)

Graph run `graph-20261006-181340`, node 5 (`plan`). Source: the approved `DESIGN-BRIEF.md` and the finalized `GATE-QUESTIONS.md` (all 11 verdicts `accept`; Q-007 accept: exclude 701.45 Assemble and 702.158 Space Sculptor, so 255 mechanic cases; Q-008 accept: 0 extra tier-3 drafts, so the two tester cases are the only tier-3 drafts). Quality-check PASS (gate-qc attempt 7, findings none) verified in the README `## Preparation gate`.

## What a player and the owner get

Today the AI is graded on 18 hard rules cases. After run 1 it is checked against 393: one for every real Magic mechanic, plus 120 in the twelve rules areas players get wrong most. Two free checks run on every pull request and block it when an attached card stops reaching the AI, or when a deciding rule that used to reach it stops reaching it. Grading the AI's actual answer stays on demand, about two cents a case, and re-grades only what changed. The owner approves every case; nothing counts until approved (the 18 first-ship cases are approved by the owner's accept of REQ-185).

## Architecture

- **One corpus, one loader.** Cases stay flat in `apps/backend/src/eval/worked-solutions/` under their names (A2). `scripts/lib/gold-cases.mjs` becomes the format-version-2 loader; `scripts/lib/prompt-fidelity.mjs` `buildCaseRequest` is the one request builder; one stale-comparison function (slice A) is called by the live runner (C), the review render (D) and the staleness report (E). Nothing re-implements any of them.
- **TypeScript boundary (A3, M17).** Gate tests that need `preparePromptInput`, `buildRetrievalQueryText` or the In-Depth request schema are backend vitest tests under `apps/backend/src/eval/`, run by `coverage:check`, importing the two `.mjs` modules statically through sibling `.d.mts` declarations (slice A). `test:scripts` tests (`node --test`, no tsx) inject fakes and never import TypeScript.
- **Offline gate (B).** Card check (absolute), rule check (ratchet over a committed hit/miss baseline, ranked by committed frozen query vectors that each store a hash of their query text), state-fact check, `gameState` schema check, and the re-freeze check (a case whose query text changed is reported, never failed).
- **Live runner (C).** Existing `scripts/eval-answer-quality.mjs` and `apps/backend/src/eval/answer-quality/` change: `--changed` selection, prompt and reference-answer hashes, per-case merge of `results.json`, per-tier headline, judge usage, `gpt-4.1` at cap 10, no ranking for one model, unknown-rule-id check, `shortAnswer` on the no-prose list.
- **Owner review flow (D, finished in E).** Render pending cases to gitignored `output/rules-review/`; apply writes `review.*` and, on approve, re-records `snapshot`.
- **Coverage and staleness (E).** Mechanic list from the committed rule index, committed excluded list, counts-only `coverage.json`, coverage gate as tested code, staleness command.
- **Corpus authoring (F, G).** 255 mechanic drafts (coverage gate wired into `quality:check`), then 120 hard-area drafts (60 `Example:` lines, 58 two-card rulings, 2 tier-3 testers).

Proposed file and command names (the build may rename; each rename is recorded in the corpus README and this table updated):

| Piece | Proposed home or command |
| --- | --- |
| Gate code, baseline, frozen vectors | `apps/backend/src/eval/rules-gate/` |
| Raise the ratchet baseline | `npm run eval:rules-gate:baseline` |
| Review render / apply | `npm run eval:rules-review:render` / `npm run eval:rules-review:apply` |
| Coverage command and report | `npm run eval:rules-coverage` |
| Excluded mechanics (Q-007) | `apps/backend/src/eval/worked-solutions/excluded-mechanics.json` |
| Coverage file | `apps/backend/src/eval/answer-quality/coverage.json` |
| Staleness command | `npm run eval:rules-staleness` |

## Slices, in order

The brief's order is the intake's order. Every slice builds and tests green on its own: slice E's coverage gate does not run in `quality:check` until slice F gives it the cases it needs (A17). All seven slices land in one code PR into `main`.

| Slice | Doc | Depends on | Delivers |
| --- | --- | --- | --- |
| A | [slice-a-format-v2-loader.md](slice-a-format-v2-loader.md) | none | Format v2, loader, stale comparison, `buildCaseRequest`, `.d.mts` declarations, 18 migrated, renamed fields in every reader |
| B | [slice-b-offline-prompt-gate.md](slice-b-offline-prompt-gate.md) | A | Offline prompt gate in `quality:check`, frozen vectors, re-freeze check |
| C | [slice-c-live-runner.md](slice-c-live-runner.md) | A | Live runner changes, per-tier headline, judge usage |
| D | [slice-d-owner-review-flow.md](slice-d-owner-review-flow.md) | A | Review render and apply |
| E | [slice-e-coverage-staleness.md](slice-e-coverage-staleness.md) | A, B, D | Coverage command, `coverage.json`, coverage gate (not yet wired), staleness report |
| F | [slice-f-mechanic-cases.md](slice-f-mechanic-cases.md) | A-E | 255 mechanic drafts; coverage gate wired into `quality:check` |
| G | [slice-g-hard-area-depth.md](slice-g-hard-area-depth.md) | A-F | 120 hard-area drafts incl. both tester cases; REQ-185 applied |

Slices C and D depend only on A and could run beside B; they run in letter order because the build is one sequential branch.

## Product truth applied per slice (apply-order rule A21)

A `GATE-QUESTIONS.md` slot is applied in the first slice where every behavior it states is true in code. Each slice re-derives its edits by intent against current `PRD/sections/` truth, in the same work as the code (never replaying a frozen patch, never writing `PRD/sections/` from a non-build node).

| Slice | Applies to `PRD/sections/` | From slot |
| --- | --- | --- |
| A | none | (REQ-185 waits for G) |
| B | new system-map entry `Rules test corpus gates and review`, `Status: partial` | REQ-222 slot, third diff |
| C | REQ-186, REQ-187, REQ-190; system-map `### Answer-quality baseline` entry | REQ-186, REQ-187, REQ-190 slots; REQ-188 slot second diff |
| D | none | (REQ-224 waits for E) |
| E | REQ-189, REQ-222, REQ-224, REQ-225 | the four slots |
| F | REQ-188; REQ-223; NFR-018; `goals-and-non-goals.md` Non-Goals line; system-map `## Eval harness` summary | REQ-188 first diff; REQ-223; NFR-018 (both diffs); REQ-222 slot second diff |
| G | REQ-185 | REQ-185 slot |

Citations ahead of an entry (a new ID or new REQ-185 term cited before its own entry is applied) are acceptable: every slice lands in the one code PR into `main`, so `main` never holds a citation of an ID that is not there (A21).

## Data flow

1. A case file (`*.case.json`, v2) names its question, `cards`, optional `gameState`, `expected.answer`, `expected.decidingRuleIds`, `snapshot` hashes and `review` state.
2. `loadGoldCases` validates it. `buildCaseRequest` turns it into a lookup request (cards attached) or an In-Depth `mode: "game"` request.
3. Offline: the real `preparePromptInput` builds the prompt; the gate checks cards, ratchet rules and state facts; frozen vectors rank the rules; hash mismatches report "awaiting re-freeze".
4. Live (on demand, confirmation-gated): approved, non-stale cases chosen by `--changed`; the answer and the judge run; `results.json` merges per case with prompt hash, reference-answer hash and judge usage.
5. Review: render, owner fills verdicts, apply writes `review.*`, re-records `snapshot` on approve, rewrites `coverage.json`.

## Constraints that bind every slice

- No change to the live prompt, retrieval, excerpt cap or Ask AI behavior. No rule-index rebuild, no Comprehensive Rules refresh, never `npm run data:refresh`.
- No live run in `quality:check`, `npm test`, `test:eval`, `coverage:check`, `test:scripts` or any build gate; no provider call during the build (no `--confirm-live-calls`).
- No outside-source text in run 1. Case answers are official text verbatim (tiers 1 and 2) or the owner-approved derivation (tier 3).
- No agent sets `approved`, except the 18 first-ship cases the slice A migration writes down (A1).
- Authored JSON must pass `format:check`; run Prettier on every generated case, vector and baseline file.
- `apps/backend/src/prompt/preparation.test.ts`, the REQ-177 benchmark, the 31 context-eval fixtures and `npm run eval:worked-solutions` keep working unchanged (A12, A13).
- Committed code and tests never name `PRD/work/rules-test-harness/` paths: cleanup deletes the folder.
- No browser-observable risk in any slice, so no Playwright criteria apply.

## Verification checklist (package)

- [ ] Slice A: 18 migrated, readers renamed, 16/18 unchanged, typecheck green
- [ ] Slice B: gate passes on the 18 at 16 hits; planted failures fail; no embedder or network call
- [ ] Slice C: dry run selects the 18 at about $0.35; headline and merge tests pass
- [ ] Slice D: round trip, stale path and refusals tested
- [ ] Slice E: coverage and staleness fixtures pass; gate not yet in `quality:check`
- [ ] Slice F: 255 drafts; coverage gate in `quality:check` and green
- [ ] Slice G: 393 cases; at least 40 of the 120 `does-not-work`; both gates green; REQ-185 applied
- [ ] Every stable ID in the table above is present in `PRD/sections/` before close

## Risks (from the brief)

- **Review load.** About 375 new drafts; batches grouped by mechanic keep sittings short. Nothing in the build waits on review.
- **Text-route mechanics.** About 30 mechanics rely on a ruling on a card whose text names them; each is checked, and falls back to the rule's own text (tier 1) when the ruling is not about the mechanic.
- **Live cost is an estimate** until a live run records judge usage (M8).
- **Frozen-vector file, about 3.6 MB.** Lives under `src/eval/`, never `apps/backend/data/`; slice B confirms Lambda packaging does not pick it up, and that `format:check` accepts the encoding.
- **Hook evidence gap (known).** The build node may earn little hook evidence in the worktree; review (node 7) is the integrity gate.

## Citations (recorded, never opened)

`DESIGN-BRIEF.md` `## Citations`: the probe package, `PRD/work/properRulesTestHarness/gameplanIdeas.md`, the deferred `niche-interaction-rule-tests` package and its draft PR #266, the prior-run receipts in `IDEA.md`.
