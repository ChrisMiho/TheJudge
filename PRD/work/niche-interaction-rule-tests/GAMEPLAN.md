# GAMEPLAN — niche-interaction-rule-tests

Plain version: when a player attaches two cards that both say "instead" or "prevent" (Academy Manufactor with Esix, Fractal Bloom is the tester's case), the AI now gets the Comprehensive Rules on how replacement and prevention effects interact. The offline rules check learns to count a rule that arrives that way, so it can hold the fix. Nothing else a player sees changes, and no live model call is made.

Source of truth for the slicing: `DESIGN-BRIEF.md` (Scope 1 to 6, Technical shape, Acceptance targets, `Build in a fresh worktree` steps 1 to 8) and the owner-accepted proposal in `GATE-QUESTIONS.md` (REQ-220 new; REQ-022 and REQ-222 amended; REQ-221 withdrawn and stays unused). The README `## Preparation gate` records `Quality-check: PASS` (gate-qc attempt 8), verified before mapping.

## Architecture

- Data: one new curated topic, `replacement-effects-interaction`, added to `apps/backend/data/gameRulesTopicManifest.json` by hand and to `gameRulesByTopic.json` by `PRD/work/niche-interaction-rule-tests/build-topic-from-index.mjs`, taking verbatim rule text from the committed rule index. No other game-rules artifact changes. The size guard in `apps/frontend/src/lib/gameRulesBuildPolicy.test.ts` moves from 23 topics and 22,000 characters to 24 and 26,000.
- Selector: one pure function in `apps/backend/src/gameRulesTopicSelection.ts` reads only `oracleText` and says whether two or more cards carry the whole word "instead", "prevent", "prevents" or "prevented" (any letter case). Two call sites: lookup mode in `apps/backend/src/prompt/preparation.ts` (the attached cards), and game mode in `selectGameRulesTopics` (every card on the stack and in any populated zone, the same card set `buildQueryParts` in `apps/backend/src/gameRulesRetrieval.ts` reads for System 3). The topic then flows through the existing `formatGameRulesSection` and `collectCuratedRuleIds` (REQ-179 exclusion), so no prompt code changes.
- Rules gate: `apps/backend/src/eval/rules-gate/rulesGate.ts` also counts a deciding rule carried by a selected curated topic (read from `enrichmentDebug.curatedGameRules.topics`) and records it apart as `inTopic`. `hit` and `miss` keep their System 3 meaning. `raiseBaseline` writes `inTopic` only when non-empty. `raise-rules-gate-baseline.mjs` and `eval-evidence-trace.mjs` are not edited.
- Product truth: REQ-220 added; REQ-022 and REQ-222 amended; the system-map, data, and feature-spec lines amended exactly as `GATE-QUESTIONS.md` proposes. REQ-221 is not written.

## Data flow

Question plus attached cards -> `preparePromptInput` -> System 2 topics (always-on four, game-state topics, plus the new topic when two cards carry the wording) and System 3 rules (scored search, topic rules excluded) -> `GAME RULES (reference)` section. Rules gate: corpus case -> `preparePromptInput` with frozen vector -> System 3 picks and selected-topic rule numbers -> `hit`, `miss`, `inTopic` -> compared with `baseline.json`.

## Slice order and dependencies

| Slice | Depends on |
| --- | --- |
| A topic data and size guard | none |
| B card-wording selector and rules truth | A (the topic must exist in the committed artifact for the lookup and prompt tests) |
| C rules gate counts topic rules | A and B (the baseline records the topic only once the selector fires it) |
| D re-measure and ship | A, B, C |

Build order A, B, C, D. Slices are sequential: each later slice reads what the earlier one wrote.

## Proposal application (PRD truth applied by intent with the code)

`PRD/sections/` is edited only inside the slices below, by intent against current truth (not a blind replay of the frozen diff), using `GATE-QUESTIONS.md` and the brief's amendment set.

| Slice | `PRD/sections/` edits applied |
| --- | --- |
| A | none (data only; the numbers it changes are described by the REQ-220 block that B applies) |
| B | REQ-220 new, inserted after REQ-219 and before REQ-222; REQ-022 amended (description, two acceptance bullets, dependency, note); `system-map.md:66` and `:81` with their Backed-by lines; `system-map/game-rules-retrieval.md` Backed-by, `:14-16`, `:63`, `:117-118`; `system-map/prompt-layout-spec.md:35` and `:59`; `integrations-and-data.md:363` and `:400`; `quick-lookup/README.md:276`, `:288-290` and Backed-by; `in-depth/README.md:375-377` and Backed-by. Invariant 1 lines the brief marks "unchanged" stay unedited, including `PRD/sections/system-map/prompt-assembly.md:40-41` (non-blocking note 1: not contradicted, no edit) |
| C | REQ-222 amended (ratchet bullet, summary bullet, dependency, note); REQ-229 first Notes bullet, one clause; `apps/backend/src/eval/worked-solutions/README.md` one sentence beside `:151` (not product truth) |
| D | REQ-220's last Notes bullet replaced with the recorded before/after numbers |

REQ-221 is withdrawn: nothing is applied for it and the number stays unused. No `DEC-###` is added and no REQ id other than REQ-220 is created.

## Carried-over rules and notes

- **Model folder (brief step 7).** Before slice D's `npm run eval:worked-solutions`, copy `apps/backend/data/models/` from `/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/data/models/` into the build worktree (`cp -R /Users/chrismiho/Coding/Projects/TheJudge/apps/backend/data/models apps/backend/data/models`). If the folder is absent there, stop and report. Never run `node scripts/warm-embedding-model-cache.mjs` (it downloads over the network). `npm run quality:check` does not need the folder.
- **PR #273 dependency.** Slice A checks, before committing the topic, whether `origin/main` carries a different rule index than `c1188dc8`; slice D checks again before the final numbers. If it differs, re-measure every number that depends on rules text (the 3,846-character excerpt, the 25,808 total, 287/392, the baseline contents) before committing. If the topic total exceeds 26,000, or any acceptance number moves for a reason other than the refresh itself, stop and report to the owner; never change the ceiling or the targets.
- **Non-blocking note 1.** `prompt-assembly.md:40-41` gets an "unchanged" disposition and no edit (slice B).
- **Non-blocking note 2.** The REQ-222 first-ship sentence keeps its dated 16-case count and gains the words "a System 3 excerpt" so the count is read as the System 3 count (slice C).
- **Non-blocking note 3.** The brief's `contextCards` is a measure-script name. The production card set is what `buildQueryParts` in `gameRulesRetrieval.ts` reads: stack plus populated zones. The game-mode selector reads that set (slice B).
- **Non-blocking note 4.** The embedder path is `apps/backend/src/providers/localEmbeddingProvider.ts` (`env.allowRemoteModels = false` at line 31); cite it with its directory (slice D).
- **No gitignored input except the model folder.** Never copy, download, or build from `apps/backend/data/cr/source.txt`; never run `npm run data:build` or `node scripts/build-game-rules.mjs`. If `build-topic-from-index.mjs` refuses, stop and report; never hand-edit `gameRulesByTopic.json`.

## Offline-only rule

Every verification is offline and free: committed indexes, committed frozen vectors, the local embedder in process. No live OpenAI call, no `npm run eval:answer-quality`, no `npm run data:refresh`, no Scryfall fetch, no network beyond `npm ci`. No screen, overlay, or wire contract changes (no `screen-layout.md` row, REQ-126). No dev server or browser is used, so no runtime-cleanup criterion applies (`PRD/instructions/runtime-process-hygiene.md`: backend and data work is not browser-observable).

## Verification checklist

- `npm ci`
- `node PRD/work/niche-interaction-rule-tests/build-topic-from-index.mjs` (slice A; `git diff --stat` among game-rules data lists only the manifest and `gameRulesByTopic.json`)
- `npm --workspace apps/backend run test` (selector, preparation, prompt assembly, rules gate, context-eval harness, benchmark)
- `npm --workspace apps/frontend run test` (build-policy test, 24 topics, 25,808 under 26,000)
- `npm run eval:rules-gate:baseline` (slice C, no `--allow-regressions`)
- `npm run quality:check` (slices B, C, D)
- `npm run eval:worked-solutions` (slice D, 287/392, 392/392 ranked semantically)
- `npm run eval:rules-staleness` (slice D, 0 stale, 0 awaiting)
- `npm run eval:evidence-trace -- --case academy-manufactor-esix-treasure` (slice D, after committing)

## Acceptance targets (every one held by slice D)

Manufactor + Esix corpus case and the verbatim question: all four of 614.1a, 616.1, 616.1e, 616.1f in the prompt through the topic, both rankings. Necropotence + Silence unchanged. Rules gate passes with only `replacement-bard-and-bilbo-tokens` moving (`hit` to `miss`, with `inTopic` 616.1 and 616.1f) and 11 cases carrying `inTopic`. Worked-solutions 287/392, first-ship 16/18 hybrid and 14/18 lexical. Labelled checks 14/14 and 14/14. None of the 31 fixtures' goldens changes. Benchmark lexical 0.5833 / 0.5769, hybrid 0.8974 / 0.8910. Coverage gate passes with `coverage.json` unchanged. Staleness 0 and 0. Only the manifest and `gameRulesByTopic.json` change among the game-rules data files. A result that fixes the case but moves any other number is a regression and is reported as one.

## Criteria

Each slice has `slice-<letter>.criteria.json` beside it, emitted from its `## Acceptance criteria` list, every value `false`. Evidence proves a command ran, not that it passed; the review node is the integrity gate. Slice D's manual criteria are earned by dated observation lines in `slice-d.evidence.md`.
