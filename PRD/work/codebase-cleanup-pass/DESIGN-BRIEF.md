# Design brief — codebase-cleanup-pass

Status: refined (graph-controlled refinement, 2026-10-18, run `graph-20261018-162925`)

**Review:** this package is a cleanup that players never notice. It builds 47 of
the 68 findings from the 2026-10-18 probes, in whole or in part, in ten slices. The other 21 wait for
the four pending cluster runs, go to the `codehealth` overnight loop, or need
the owner. It changes no product truth, so there is no questions file.

## What a player experiences

Nothing changes. Same answers, same prompts sent to the AI, same rules
retrieved in the same order, same screens, same messages, same timing.

One gain sits under the hood. In In-Depth, when a heavily comboed card is on the
board and the question does not mention combos, the server stops unpacking
thousands of combos it would discard anyway. That saves up to about 170 ms of
server work per question, and the answer is the same (slice E).

Developers get the rest: the test suites run faster and stop leaving temp
folders behind, the Lambda package stops shipping test code, copied code is
written once, and dead code and dead styles are gone.

## The ten slices (built in this order)

| Slice | In plain words | Findings |
| --- | --- | --- |
| A | Backend tests stop rebuilding the same slow input and stop leaking temp folders | T-01, T-02 |
| B | Frontend tests that never draw a screen stop loading the whole app; tests import the shared helpers | T-03, T-04 |
| C | Type and lint checks that already pass are switched on, so the clean state stays clean | T-06, T-07, T-08, T-09, T-16 |
| D | The Lambda package ships only runtime code; CI stops building the frontend twice; scripts share small helpers | K-08/T-10, T-11, T-12, T-13, T-15 |
| E | Combo matching skips combos that cannot be complete before unpacking them | K-01 |
| F | The prompt pipeline is written once instead of four times; card blocks are built in their final order | K-02, K-06, K-07, K-09, K-10, K-11, K-13, K-15, K-18 |
| G | Rule search scoring loses its duplicate formula and repeated work, guarded by a new order snapshot | K-05, K-06, K-12, K-14, K-15 |
| H | In-Depth's question flow loses dead wiring (the Answer plate that never shows, a double Decrypt path, a faked form event) | Q-04, Q-06, Q-08, Q-12, Q-13, Q-17, Q-19 |
| I | The scanner hook stops returning values no screen reads and drops a duplicate scan-map cache | Q-02, Q-10, Q-11, Q-12, U-12 (one constant) |
| J | Dead and duplicated CSS is deleted, and a check fails the build on stylesheet parse errors | C-02, C-03, C-04, C-05, C-06, C-08, C-12, C-13, D-14, U-12 (CSS) |

Each slice stands on its own: if the build stops after any slice, what landed is
complete and proven. Slices touch disjoint files with two exceptions, both
handled by order: E and G both edit `commanderSpellbook/matcher.ts` (E adds the
prefilter, G later drops one unused export), and F and G both edit
`prompt/promptFormatting.ts` (G only drops exports, after F).

## Rules every slice follows

1. **Players see no change.** Every slice names the test that proves it. A
   finding whose proof fails — a golden prompt changes, the order snapshot
   moves, the built CSS or a computed style differs, a test count drops — is
   reverted and recorded in the slice's evidence, never bent to pass.
2. **No eval golden changes.** `apps/backend/src/eval/fixtures/*.prompt.golden.txt`
   and `*.context.golden.json` stay byte-identical across the whole package. This
   is how the package honors `technical-design-rules.md` ("do not change …
   backend prompt assembly (`buildPromptContext`, `buildPromptText`) without an
   approved change to the relevant feature spec"; "update eval goldens only for
   intentional behavior changes"): the code is reorganized, the prompt is not.
3. **No `PRD/sections/` edits.** Nothing in this package changes product truth.
4. **Protected paths are out of bounds:** `scripts/graph-boundary-hook.mjs`,
   `.claude/**`, `CLAUDE.md`, every `thejudge-*` and `codehealth` skill.
5. **Stay out of the pending briefs' files** except the narrow regions named per
   slice (see Collisions).
6. **No new dependency.** T-16 declares two packages the frontend already uses,
   at the versions the lockfile already resolves.
7. **Test titles** follow `PRD/instructions/test-naming.md`: outermost
   `describe` is `Frontend - <Feature>` or `Backend - <Feature>`.
8. **A check that reports anything stays off.** In slice C, a TypeScript flag or
   lint rule that reports even one hit on the build's base is left off; no
   product code is edited to satisfy it.
9. **Life Tracker screenshot pair.** REQ-202 requires every slice that touches
   the shared stylesheet or the token set to attach a Life Tracker before/after
   screenshot pair at 390x844 and 1440x900 to its PR, so the owner sees exactly
   what changed. That binds slice J. Captures go under
   `PRD/work/codebase-cleanup-pass/.playwright-mcp/`.

## Slice detail

Line numbers marked **(confirmed)** were read in this worktree on 2026-10-18.
Others are as the probe recorded them; the builder re-reads them first.

### A — Backend tests run faster and clean up after themselves

- **T-01.** `eval/rules-gate/rulesGate.test.ts` calls `runGate()` twice on the
  full corpus (`:114`, `:152`, confirmed); the spies are set in `beforeAll`
  (`:59-67`, confirmed). Memoize one result and assert both tests against it.
  `commanderSpellbook/matcher.test.ts` builds the at-scale catalog three times
  (`:729`, `:737`, `:762`, confirmed); write the files once in `beforeAll` and
  load a fresh catalog per test so each test keeps its own cache.
  `eval/ragRetrievalBenchmark.test.ts` scores twice on purpose (`:47-48`,
  confirmed, a determinism check); the baseline test reuses `first`.
- **T-02.** 20 test files create temp folders and never remove them (count
  confirmed). One `makeTempDir()` helper per runner (vitest and `node:test`)
  registers removal in `afterAll` / `t.after`; the same cleanup goes into
  `scripts/lib/fake-embedding-model.mjs`.
- **Proof.** Same test names, same assertions, same pass counts per suite
  (record before and after). Backend wall time drops (record both). Count
  `$TMPDIR` entries before and after a full `npm test`; the count must not grow.

### B — Frontend tests: lighter setup, shared helpers

- **T-03.** `apps/frontend/src/test/setup.ts` statically imports
  `destinationRegistry` and runs `beforeAll(preloadPortalDestinations)` for every
  file (`:4-7`, confirmed), including the 51 DOM-free files. Guard the DOM-only
  work (preload, `cleanup`, jest-dom, the `scrollIntoView` shim,
  `resetBackgroundDownloadForTests`) behind `typeof document !== "undefined"`,
  loading the registry by dynamic import inside the guard.
- **T-04.** Replace copied helpers with imports of the existing ones
  (`createMemoryStorage`, `jsonResponse` in `src/test/appTestHelpers.tsx`;
  `queueAskAiResponses` in `src/test/interactionFlowsHarness.ts`; `appCss` /
  `flowCss` / `shellCss`). Add `cssBlock`, `selectDestination` and `openHistory`
  to `appTestHelpers.tsx`. Script tests share `codeOnly()`. Each file keeps its
  own fixture data.
- **Confinement.** Skip every test file whose subject a pending brief owns:
  tests of `QuickLookupApp`, `ZoneCollectionStep`, `ZoneCardPicker`,
  `TradeSide`, `TradeBalancer`, `cardMetadataStore` / `cardMetadataSharing`,
  `FeaturePortalMenu`, `SheetShell`, `AdaptiveContextDialog`,
  `useOutsideDismiss`, `ConversationHistoryDrawer`, `CardPresentation`,
  `PrintingPicker`. The stylesheet-reading guard tests (motion, ambient accent,
  reduced motion, menu tray) keep every assertion; only their copied `cssBlock`
  parser is replaced, and the replacement must parse identically.
- **Proof.** Full frontend suite stays green with the same file count, test
  count and test names (154 files / 1,666 tests at intake; record the base). The
  51 node-environment files run green and faster (record both).

### C — Checks that already pass are switched on

- **T-06.** Delete `apps/frontend/src/types/build-card-metadata.d.ts`, a
  `declare module "*.mjs"` wildcard (confirmed) that `allowJs` makes dead.
- **T-07.** Add to `tsconfig.base.json` (confirmed current flags):
  `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`,
  `isolatedModules`, `noUncheckedSideEffectImports`, `allowUnreachableCode: false`,
  `allowUnusedLabels: false`. `verbatimModuleSyntax` waits (see dispositions).
- **T-08.** Add `--max-warnings 0` to `lint`, and enable the zero-hit rules the
  probe listed (ten react-hooks v7 rules; `eqeqeq` with null ignored,
  `no-else-return`, `object-shorthand`, `no-implicit-coercion`,
  `no-useless-return`, `no-unneeded-ternary`, `no-lonely-if`,
  `@typescript-eslint/no-import-type-side-effects`). Drop the no-op JSON ignore
  entry (`eslint.config.mjs:24`).
- **T-09.** Remove `"semi": false` from `.prettierrc.json` (confirmed). Prettier
  formats only JSON and YAML here, where the key does nothing; the config stops
  contradicting the code. Formatting the code itself is not done (follow-up).
- **T-16.** Declare `pngjs`, `@types/pngjs` and `@types/node` as frontend
  devDependencies (today `pngjs` is root-only, confirmed), with the version
  ranges the lockfile already resolves.
- **Proof.** `npm run typecheck`, `npm run lint`, `npm run format:check` exit 0
  on the build base; `npm ci` resolves the same versions (`npm ls pngjs
  @types/pngjs @types/node` before and after). The frontend production bundle is
  byte-identical (diff `apps/frontend/dist` before and after).
  `scripts/ci-workflow-parity.test.mjs` stays green.

### D — Ship only what runs; scripts share helpers

- **K-08 / T-10.** `apps/backend/tsconfig.json` includes all of `src` and
  `build` is `tsc -p tsconfig.json` (both confirmed), so 55 compiled test files,
  `test-utils/` and `eval/` ship in the Lambda package. Add
  `apps/backend/tsconfig.build.json` that extends it and excludes
  `**/*.test.ts`, `src/test-utils/**` and `src/eval/**`; point `build` at it.
  Typecheck keeps the full config. Before excluding `src/eval/**`, grep that no
  non-eval, non-test module imports from `eval/`; if one does, exclude only the
  tests and `test-utils`.
- **T-11.** In `.github/workflows/quality-check.yml` (confirmed): the deploy
  job's "Build project" step (`:255-256`) becomes the backend-only build, since
  `scripts/aws-deploy.sh` rebuilds the frontend itself; drop the unused
  `nproc` step (`:48`) and the `master` trigger (`:7`). Node versions stay as
  they are.
- **T-15.** One `scripts/lib/fs-helpers.mjs` with `ensureParentDirectory`
  (8 copies, confirmed), `writeWhole`, `escapeRegExp` and the three-tier
  `formatBytes`. `refresh-scryfall-data.mjs` keeps its own four-tier
  `formatBytes`, so no log text changes.
- **T-12 (the preserving part).** `scripts/privacy-scan.mjs:14` and
  `scripts/score-rule-search.mjs:36` hard-code the owner's main-checkout
  practice-suite path (confirmed). Replace both defaults with one helper in
  `scripts/lib/practice-suite.mjs` that resolves the main checkout through the
  git common directory, as `scripts/lib/local-openai-env.mjs` already does. On
  the owner's machine it yields the same absolute path from main and from any
  worktree. `SUITE_DIR` and `export-rule-search-training.mjs` keep their
  repo-relative default (changing those is a behavior change, see follow-ups).
- **T-13 (the move only).** `score-rule-search.mjs` and
  `export-rule-search-training.mjs` import the 1,687-line CLI
  `eval-answer-quality.mjs` only for `resolveRunEnv` (confirmed). Move
  `resolveRunEnv` and the duplicated `sumOf` into `scripts/lib`, keeping a
  re-export from `eval-answer-quality.mjs` so its tests do not change.
- **Proof.** Diff the backend `dist` file list: only test, `test-utils` and
  `eval` files disappear. `scripts/lambda-package-budget.test.mjs`,
  `scripts/ci-workflow-parity.test.mjs`, `apps/frontend/src/lib/deploymentPipeline.test.ts`
  and `npm run test:scripts` green. Print the resolved practice-suite path before
  and after, from the main checkout and from a worktree; all four must match.
  No paid run and no data rebuild is needed or allowed.
- **After merge (owner):** the CI deploy runs the new build; one live In-Depth
  request plus a CloudWatch tail confirms the native embedder chain still loads.

### E — Combo matching skips combos that cannot be complete

- **What happens today (confirmed, `commanderSpellbook/matcher.ts:355-390`).**
  `selectComboCandidates` fetches every variant (one combo record) that any
  board card belongs to via `catalog.getVariant`, then filters. Without combo
  wording in the question, only fully assigned candidates survive. The probe
  measured 152 ms (Ashnod's Altar, 6,148 variants), 167 ms (Phyrexian Altar) and
  72 ms (Sensei's Divining Top) per pass.
- **Change.** In `matcher.ts` (not `catalog.ts`, which the backend-health brief
  edits), compute once per catalog — a `WeakMap` keyed by the catalog — each
  variant's count of distinct card-ingredient oracle ids from `byOracleId`. When
  `!request.hasExplicitIntent`, keep only variants whose distinct submitted-id
  hit count equals that count before calling `getVariant`.
- **Precondition the builder confirms first.** The prefilter is safe only if a
  card ingredient can be satisfied solely by an instance with that oracle id, so
  "every card ingredient hit" is a necessary condition for `fullyAssigned`. Read
  `buildCandidate` and the template-ingredient path (`byTemplateOracleId`) and
  confirm this before coding. If it does not hold, stop slice E and record why.
- **Why the order cannot change.** The final sort ends on `variantId`, a total
  order, so fetch order cannot affect the output.
- **Proof.** New test (`Backend - Combo matching`): over boards built from the
  real committed catalog — each of the 50 most-comboed cards alone, plus a
  seeded sample of pairs, with and without combo wording, game and lookup
  modes — the prefiltered `selectComboCandidates` deep-equals the result of the
  pre-change pipeline, kept as a test helper built on the public catalog API.
  Keep it under about 10 s. A second new test decodes every committed variant
  once and asserts none fails integrity validation. Existing
  `commanderSpellbook/matcher.test.ts` and the prompt goldens stay green and
  unchanged. Record before/after timings for the three cards above.
- **Log-only consequence.** Today a corrupt variant that is fetched logs one
  integrity warning (`catalog.ts:462-482`, confirmed). After the prefilter, a
  corrupt variant that can never be complete is no longer fetched, so it no
  longer logs. The second test above makes that unreachable for committed data.
  Recorded as a follow-up.

### F — The prompt pipeline is written once

- **K-02.** `prompt/preparation.ts` has four near-copy branches: lookup and
  game, each with a debug and a non-debug copy (calls confirmed at `:296-367`
  and `:408-470`). One internal assemble helper per request kind, with a debug
  flag. It calls exactly the same functions with exactly the same arguments as
  today for each (kind, debug) pair: `retrieveRulesForQueryWithDebug` on the
  debug path and `retrieveRulesForQuery` otherwise. It does not substitute one
  entry point for the other (that is K-03, deferred).
- **K-06 (combo part).** `formatComboSection` runs twice per request: once for
  its length (`preparation.ts:296, 408`, confirmed) and once inside the prompt
  builder. Pass the built text into the builder.
- **K-07.** `prompt/enrichmentDebug.ts` builds a Zod schema only to derive the
  `EnrichmentDebug` type (confirmed: `import { z }`, never `.parse()`d). Replace
  it with a plain type built from `SupplementalRulesDebug` and the other debug
  types, which also adds the three fields the response already sends. The file
  stays (PRD names it in `system-map.md`); the debug sidecar is mock-only and its
  bytes do not change.
- **K-09.** Drop the two no-op casts `request as GameAskAiRequest`
  (`preparation.ts:109, 124`, confirmed). Replace the spread-in-`reduce` lookup
  (`promptFormatting.ts:98-104`, confirmed) with `Object.fromEntries` (same keys,
  same insertion order). Add an `isMode` guard in `config/index.ts`. The cast in
  `routes/askAi.ts` stays (backend-health owns that file).
- **K-10.** Card metadata lines are built, then patched by searching for line
  prefixes (`promptFormatting.ts:288-304`, confirmed; its index comment is
  stale). One builder emits the lines in their final order, with options for
  caster, mana spent, copies, targets and notes; lookup stops formatting a
  `targets:` line only to filter it out (`promptAssembly.ts:133-139`).
- **K-11 (non-owned parts).** Remove `getPromptDiagnostics`' dead bare-rulings
  overload (`promptDiagnostics.ts:40-58`, confirmed) and
  `buildZoneScopeSentence`'s unused first parameter (`promptFormatting.ts:359`,
  confirmed). Move the test-only `formatSupplementalRulesSection` into a test
  helper.
- **K-13.** Stack and zone cards are normalized by two copies of the same
  fields (`prompt/context.ts:178-205` and `:294-320`, confirmed). One helper for
  the shared detail fields, spread so the JSON key order of `context` stays
  exactly `cardId, name, oracleText, imageUrl, manaCost, manaValue, typeLine,
  colors, supertypes, subtypes, keywords, …displayFields` followed by each
  kind's own fields. The stack's own name handling stays. Use the import list in
  place of the inline `import("../types/index.js")` types.
- **K-15 (prompt part).** Inline `truncatePromptLabel` and name the
  `EFFECTIVELY_UNLIMITED_CHARS / 10` constant (`promptFormatting.ts:81-87`).
- **K-18 (non-owned parts).** Fix the stale `promptContext.ts` pointer in
  `types/index.ts:41`; stop passing the default "Miho is working on it" message
  explicitly in `errors.ts` and `providers/openAiResponsesProvider.ts`.
- **Proof.** Every prompt golden byte-identical through
  `contextEvaluationHarness.test.ts`; `prompt/preparation.test.ts`,
  `builtPromptChecks.test.ts`, `promptAssembly.test.ts`, `promptFormatting.test.ts`,
  `prompt/context.test.ts`, `promptDiagnostics.test.ts`, `errors.test.ts` and the
  provider tests green; typecheck exit 0.

### G — Rule search scoring, guarded by an order snapshot

- **First, the guard.** Before any scoring edit, commit a characterization test
  (`Backend - Rule search order`) that runs `retrieveRulesForQueryWithDebug` for
  every rules-gate case on its committed frozen vectors (semantic path) and again
  with no query vector (lexical path). Per case it records the ordered selected
  and runner-up rule ids, `usedSemantic`, and a SHA-256 of the full scored output
  (ids and exact scores), and asserts equality with the committed snapshot. This
  is the probe's K-04 proof, built now so the backend-health run and later
  splits can reuse it.
- **K-05.** `scoreEntry` repeats `computeIdBoost` and the word-overlap loop
  line for line (`gameRulesRetrieval.ts:824-839`, `:910-945`, confirmed). One
  `accumulateWordOverlap(entry, tokens, N, df, start)`: the lexical scorer
  passes `start = 0`, `scoreEntry` passes `start = computeIdBoost(...)`. The
  boost is built `0 → +100 → +20` in the same order `scoreEntry` adds it today,
  so every floating-point addition happens in the same order. This keeps
  REQ-182's acceptance gate (pure-lexical scoring byte-identical under the mock
  provider). Update the comment at `:901-909`.
- **K-06 (retrieval part).** Carry the boost `scoreIndex` already computes
  (`:1083`, confirmed) on the scored entry instead of recomputing it twice per
  candidate in `selectSupplemental` (`:1302-1309`, confirmed). Cache each rule
  vector's squared length in a `WeakMap` keyed by the embeddings object,
  accumulated in the same index order as `cosineSimilarity` does today
  (`:948-959`, confirmed), so `Math.sqrt` sees the same bits. Cache cited-rule
  ids per entry and the compiled obsolete-glossary patterns per glossary array.
  Not done: carrying the raw blend instead of `score - boost` (a behavior
  change; see follow-ups) and the concept-terms repeat (left to `codehealth`
  item 8).
- **K-14.** `turnStepSearchName` (`:673-708`) repeats the step-name tables in
  `prompt/phaseGuidance.ts` except three explicit overrides. Derive it from those
  tables plus the overrides. Add an exhaustive test over every phase × combat-step
  pair asserting the same strings. No new runtime import cycle: check
  `phaseGuidance.ts`'s imports before wiring.
- **K-15 (search part).** One `escapeRegExp` and one `foldApostrophes` for
  `gameRulesRetrieval.ts:710, 725`, `commanderSpellbook/intent.ts:21`,
  `eval/rules-gate/stateFacts.ts:33`, `gameRulesStemmer.ts:97`,
  `gameRulesConceptMap.ts:140` and `prompt/phaseGuidance.ts:164`. All four
  apostrophe sites fold exactly `U+2018` and `U+2019` to `'` (confirmed), so one
  helper is exact. Put them in an existing shared backend module if one fits;
  otherwise one small new module.
- **K-12 (non-owned files).** Drop `export` from the in-file-only exports in
  `gameRulesTopicSelection.ts`, `gameRulesStemmer.ts`, `commanderSpellbook/matcher.ts`,
  `intent.ts`, `formatting.ts`, `prompt/promptFormatting.ts`,
  `prompt/phaseGuidance.ts` and `prompt/promptDiagnostics.ts`, after K-14 so
  nothing it needs loses its export.
- **Confinement.** In `gameRulesRetrieval.ts`, edit only below the loader block
  (`:32-372` belongs to the backend-health brief) and leave every public entry
  point's signature and default parameters as they are.
- **Proof.** The order snapshot (both paths) unchanged after every step;
  `gameRulesRetrieval.test.ts` (including the A4 byte-identical-under-mock
  tests), `gameRulesSearchFixes.test.ts`, `rules-gate/rulesGate.test.ts`,
  `retrievalReportParity.test.ts`, the stemmer, concept-map, phase-guidance and
  intent tests, and the prompt goldens green.

### H — In-Depth's question flow loses dead wiring

- **Q-04.** The In-Depth "Answer" plate can never show: `answer` is set in the
  same update as a non-empty conversation (`useAskAiSubmitOrchestration.ts:162,
  178`, confirmed), so the early return on `isConversationActive` always wins
  (`EnrichmentStep.tsx:625-652`, plate at `:875-879`, confirmed). Delete the
  plate, the `answer` prop, and the hook's `answer` state. In `EnrichmentStep`'s
  composer, drop the always-false `isSubmitting` / `pendingLabel` (`:922-924`).
  The same props in `QuickLookupApp` wait (card-search owns that file).
- **Q-06.** `handleDecryptStack` and `handleRetry` repeat the payload build and
  `submitAttempt` call (`MtgAssistantApp.tsx:715-761`, confirmed). Share only
  that tail. Each handler keeps its own guards, in today's order, with today's
  messages: Decrypt flashes "Confirm game context before decrypting." while Retry
  returns silently with no game context. Pass `submitFollowUp` straight through
  in place of the `handleFollowUp` wrapper.
- **Q-08.** `EnrichmentStep.tsx:643` fakes a form event with a double cast
  (confirmed). Type `onDecryptStack` as `() => Promise<void>` and drop
  `preventDefault`.
- **Q-12 (hook part).** Stop returning `hiddenInitialQuestion` from the submit
  hook; nobody reads it (the hook still uses it internally).
- **Q-13.** Correct the comment at `App.tsx:57-59` (confirmed) that calls the
  Life Tracker → In-Depth seed branch unreachable; Question History resume
  reaches it. Comment only.
- **Q-19 (id part).** One `randomId(prefix)` for the three identical
  random-id-with-fallback functions (`lib/debugLogger.ts`, `lib/zoneCards.ts`,
  the submit hook, confirmed), keeping the `corr-`, `inst-` and `conv-` prefixes.
- **Q-17 (these files only).** Rewrite comments that cite deleted work-package
  docs to their REQ, in files this slice edits that no brief owns.
- **Confinement.** In `MtgAssistantApp.tsx` (card-search owns its card-list
  effect and will lift its search index), edit only the submit handlers
  (`:713-766`), the props passed to `EnrichmentStep`, and an import made unused.
- **Proof.** `App.answered-state.test.tsx`, `App.interaction-flows.submission.test.tsx`,
  `App.interaction-flows.test.tsx`, the `EnrichmentStep` and submit-hook tests,
  `lib/zoneCards.test.ts`, the debug-logger tests; typecheck exit 0. No test
  renders the plate today.

### I — The scanner hook keeps only what screens use

- **Q-02.** `hooks/useScanCapture.ts` returns eight values no screen reads
  (returns at `:581-598`, confirmed). Remove seven: `cameraStatus`,
  `resolvedCandidates`, `lockedCandidate`, `scanPhase`,
  `scanAcquisitionDiagnostic`, `rescan`, `acceptCandidate`, and the state that
  is only ever reset. **Keep `blockedNotice`**: the In-Depth duplicate-Stack bug
  (follow-up 1) needs it to show its message.
- **Q-11.** Trade's scanner reloads the scan map into its own ref only to
  resolve the scanned printing, and the scan hook caches a second promise over
  the module cache. Have `useScanCapture` resolve the scanned printing into the
  held entry; drop `useTradeScan`'s side channel and the per-hook promise. The
  module loaders' retry-after-failure rule (REQ-249) is unchanged.
- **Q-10 (scan part).** Move the `ScanCameraStatus` type to
  `lib/scan/types.ts`, breaking the type cycle `ScanCameraSurface →
  ScanDebugOverlay → useScanCapture`.
- **Q-12 (scan part).** Delete `SURFACE_DISTANCE` and `MAX_SURFACED_CANDIDATES`
  from `lib/scan/tuning.ts` (zero references, confirmed).
- **U-12 (one item).** `LOW_CONFIDENCE_ESCALATION_COUNT` in `useScanCapture.ts`
  is used only by a test; make it file-local or move the test's value.
- **Confinement.** The `ZoneCollectionStep.test.tsx` hook mock (`:41-62`) may
  drop the removed fields; nothing else in card-search-owned files changes.
- **Proof.** `hooks/useScanCapture.test.ts` (dead-field assertions trimmed),
  `TradeBalancer.scan.test.tsx`, `loadScanResources.test.ts`, `loadScanMap.test.ts`,
  the three hosts' scan tests; typecheck exit 0. The same printing resolves for
  every scan in the Trade scan tests.

### J — Dead and duplicated styles go; parse errors fail the build

Every deletion is a rule no element can match, a rule a later rule fully
overrides, or an exact duplicate.

- **C-02.** Delete the 12 `index.css` rules whose only declaration is
  `display: none` on a `[hidden]` selector (`:1521, 1841, 1919, 1974, 2077,
  2119, 2177, 2366, 3678, 4153, 5217, 5227`; several confirmed). The global
  `[hidden] { display: none !important; }` at `styles/flow.css:446` (confirmed)
  already forces them. The three in the ported layers stay.
- **C-03.** Delete the dead "waiting" chat block in `flow.css` (`:393-440`) and
  the seven keyframes only it uses (`mote`, `seal-ring`, `ink-in`,
  `wait-breathe`, `seal-scry`, `caret`, `wait-out`), the matching entries in the
  reduced-motion list (`:449`, confirmed), `.btn.ghost`, `.card-panel`,
  `.lt-scope .life-custom .err`, `.lt-scope .tile.pulse .n` and its `tick`
  keyframe. Keep `think` (used at `index.css:4195`) and `motion-exit` (a test
  asserts it). The `.ring .card.summon` rule and its reduced-motion entry wait
  for card-rings (it edits the `.ring` rules beside them).
- **U-12 (CSS part; `codehealth` item 13 folded in).** Delete the ~28 dead
  classes U-12 lists in `FINDINGS-ui-and-personalities.md`, after a fresh
  zero-producer check for each. Exclusions: `.step-eyebrow` (the shared-chrome
  spec names it), `summon` (beside card-rings' `.ring` rules), and anything a
  stylesheet-reading test asserts.
- **C-04.** Delete the state rules for attributes the code never sets:
  `.act-zones button[data-current="true"]` (`:2216`, `:2315`, confirmed),
  `[data-current] .mark`, `.mark::after`, `[data-current] .zg`, the
  `.act-zones button .mark` half of `:1489`, and `.review[data-collapsed="true"]`
  (`:1943`, confirmed). Keep `--idq-shadow-act-1`. The
  `.ring .card[data-offstage]` rule (`flow.css:91`) waits for card-rings.
- **C-05.** Delete the `index.css` copies of `orb-breathe` (`:478`) and
  `mic-listen` (`:956`) (both pairs confirmed), after checking the frames are
  equal value for value.
- **C-06.** Delete the six unread glow tokens (`lib/theme/glows.css:9, 15-18,
  21`, confirmed). After the U-12 sweep, re-run the unread-token check and
  delete any newly orphaned token (for example `--glow-soft-10`) that no rule
  reads and card-rings does not name.
- **C-08.** Fold the later overrides into their original blocks: `.extras
  .counters`, `.extras .cmd-row, .extras .named-row` (`:1302`, `:1323` with
  `:2507`, `:2511`), `.lt-scope .tile` (swap only `display` and `cursor`, keep
  `justify-items`), `.lt-scope .tiles .tile.custom .rm`.
- **C-12.** Remove the unused `screens.xs` and `colors.accent.contrast` from
  `tailwind.config.ts` (confirmed), add `corePlugins: { container: false }`, and
  remove `@tailwind components` from `index.css:1` once it emits nothing. The
  `.ring` blocklist waits for card-rings.
- **C-13 and D-14 (`codehealth` item 15 folded in).** Delete the two stray `};`
  (`index.css:1086`, `:3510`, confirmed) that cause the two build warnings, fix
  the six collapsed `@media` openers, delete the orphan comment (`:91-92`) and
  the stale pointer (`:966`). Add a test (`Frontend - Stylesheets`) that runs
  postcss over the seven stylesheets and fails on any parse warning.
- **Proof.** (1) Build the CSS before and after and diff: only deleted rules
  disappear, and every surviving rule keeps its values and relative order.
  (2) Dump `getComputedStyle` for every element on each tool (In-Depth, Quick
  Question, Trade, Life Tracker and its sheets, the scanner) in two colour
  profiles, before and after, and compare: identical. (3) The frontend build
  prints zero CSS warnings. (4) Full frontend suite green with no edit to a
  stylesheet-reading guard test. (5) REQ-202 Life Tracker screenshot pair at
  390x844 and 1440x900 attached to the PR.

## Collisions with the four pending briefs

None of the four has started: `PRD/work/` holds only this package, and `main`'s
latest work is the scanner run (#320). Each owns files; this package stays out
of them except the named regions.

| Pending brief | Files it owns | This package |
| --- | --- | --- |
| Backend health | `gameRulesRetrieval.ts` loaders `:32-372` and the entry points' default resources; `commanderSpellbook/catalog.ts`; `app/createApp.ts`; `app/errorHandler.ts`; `routes/askAi.ts`; `routes/health.ts`; `prompt/ruleLayout.ts`; `embeddingModel.ts`; `providers/localEmbeddingProvider.ts`; `validation/askAiRequest.ts`; `cardRulings.ts`, `cardDetail.ts`, `cardPrices.ts`, `gameRules.ts`; `runtime/createConfiguredApp.ts`; `lambda.ts` | Slice E puts its count in `matcher.ts`, not `catalog.ts`. Slice G edits `gameRulesRetrieval.ts` only below `:372` and never the entry-point signatures. K-03, K-04, K-17, K-19 and the owned-file parts of K-09, K-11, K-12, K-15, K-18 wait. |
| Card search | `QuickLookupApp`, `ZoneCardPicker`, `ZoneCollectionStep`, `TradeSide`, `TradeBalancer`, `MtgAssistantApp`'s card-list effect and search index, `cardMetadataStore`, `lib/search.ts`, `trade/oracleSearch.ts` | Slice H edits only `MtgAssistantApp`'s submit handlers and `EnrichmentStep` wiring. Slice I trims one test mock. Q-01, Q-03, Q-05, Q-07, Q-09, Q-14 and the owned-file parts of Q-04, Q-10, Q-12, Q-19 wait. |
| Card rings | `CardPresentation.tsx`, `PrintingPicker`, `DestinationOutlet.tsx`, `glows.css` `--idq-shadow-9` and `--ring-w`, the ~15 duplicated selectors (U-07) including `.ring` and `body` | Slice J leaves `.ring` rules, `body`/`html`/`*` (C-07) and the `.ring` blocklist alone; its `glows.css` deletions are lines 9-21, apart from card-rings' lines 31 and 72. |
| Pop-ups | `SheetShell`, `FeaturePortalMenu`, `AdaptiveContextDialog`, `useOutsideDismiss`, the `.adaptive-context-*` CSS, `ConversationHistoryDrawer` | Untouched. Q-01 and C-01 wait. |

When a pending run and this package both land, the second to merge rebases;
its slice proofs re-run on the rebased base.

## The `codehealth` queue (18 items from 2026-10-17)

The overnight loop keeps its queue. This package folds in two items and asks
the loop to hold seven until this package merges, because they edit the same
files.

| Item | Relation |
| --- | --- |
| 13 Dead CSS classes and `StepEyebrow` (U-12) | CSS part folded into slice J. `StepEyebrow` stays in the queue: the shared-chrome spec names it, so the loop parks it for the owner. |
| 15 Two stray `};` (D-14) | Folded into slice J. |
| 3 One Ask-AI request path (D-08) | Hold until slice H merges (same submit hook). Q-19's `apiBaseUrl` repeat joins it. |
| 5 Live-call confirmation gate (F-07) | Hold until slice D merges (`eval-answer-quality.mjs`). |
| 6 Shared prompt-resource loader (B-03) | Hold until slices F and G merge. |
| 7 Rule-search tools import the vector-text formula (B-04) | Hold until slice G merges. |
| 8 Hoist repeated per-request work (B-08) | Hold until slices F and G merge; K-06's concept-terms repeat joins it. |
| 9 Script helpers (B-10) | Hold until slice D merges; build on `scripts/lib/fs-helpers.mjs`. |
| 11 Theme plumbing (U-11) | Q-12's unread `palette` return joins it. |
| 12 Breakpoints (U-10) | C-11 and the dead `--sheet-breakpoint` token join it. |
| 1, 2, 4, 10, 14, 16, 17, 18 | Unaffected. |

## Protected and owner-only items (not built here)

- **Protected paths** (never edited by a build): `scripts/graph-boundary-hook.mjs`,
  `.claude/**`, `CLAUDE.md`, every `thejudge-*` and `codehealth` skill.
- **T-14.** `scripts/lib/boundary-rules.mjs` is the engine of the protected guard.
  Splitting it is the owner's review call.
- **T-17.** `exampleoutput.txt` and `purple-gold-handoff/` at the repo root are
  personal assets. Delete or move them to `TheJudge-backups` by owner choice.
- **C-09.** Life Tracker's Game setup header carries eight Tailwind classes a
  test-id rule overrides. The fix edits `PlayerLifeTrackerApp.tsx`, which REQ-202
  keeps untouched in Life Tracker's table area; owner call.
- **Q-12 (barrel) and Q-10 (`useLifeTracker` move).** Both edit
  `lib/lifeTracker/`, which REQ-202 says stays untouched; owner call.
- **T-12 (scan-vector path).** `scripts/build-scan-vectors.mjs:25, 28` default
  to a folder in the owner's other repository. Replacing it needs a new flag or
  environment value; owner call.
- **Q-18.** Formatting every TypeScript file with Prettier is a style decision
  and a 400–575-file diff. The config half is built (T-09).

## Disposition of every finding

Kinds: **built** (slice), **later** (a later package, after the named brief
ships), **brief** (the pending brief should fold it in), **codehealth**,
**owner**. A finding built in part lists where the rest goes.

| Id | Disposition | Remainder |
| --- | --- | --- |
| Q-01 | later — after pop-ups and card-search ship | |
| Q-02 | built — I | `blockedNotice` kept for follow-up 1 |
| Q-03 | later — after card-search | `FrozenAskAiContext` move (Q-10) goes with it |
| Q-04 | built — H | `QuickLookupApp` composer props: later, after card-search |
| Q-05 | brief — card-search (adds its hook beside `cardMetadataStore`) | |
| Q-06 | built — H | |
| Q-07 | later — after card-search (all three `onBack` props together) | |
| Q-08 | built — H | |
| Q-09 | later — after card-search | |
| Q-10 | built in part — I (`ScanCameraStatus`) | `FrozenAskAiContext`: later with Q-03; `oracleSearch` and `useTradeScan` moves: later, after card-search; `useLifeTracker` move: owner |
| Q-11 | built — I | |
| Q-12 | built in part — H (`hiddenInitialQuestion`), I (tuning constants) | `palette`: codehealth 11; `QuickLookupApp` `onSubmit`: later, after card-search; `lib/lifeTracker` barrel: owner |
| Q-13 | built — H | whether the seed should fire: follow-up 3 |
| Q-14 | later — after card-search | |
| Q-15 | later — after all four briefs | |
| Q-16 | later | moving `hashLibBuild.ts` needs product-truth path edits (`system-map.md`, `scan/data/cardhashes.md` name it); moving `detectorFixtures.ts` is a follow-up |
| Q-17 | built in part — H and I files no brief owns | rest: later, after the briefs ship |
| Q-18 | built in part — C (config, via T-09) | formatting the code: owner |
| Q-19 | built in part — H (`randomId`) | `countLabel`: later, after card-search; `apiBaseUrl`: codehealth 3 |
| C-01 | later — after card-search, pop-ups and card-rings | |
| C-02 | built — J | |
| C-03 | built — J | `.ring .card.summon`: later, after card-rings |
| C-04 | built — J | `.ring .card[data-offstage]`: later, after card-rings |
| C-05 | built — J | |
| C-06 | built — J | `--sheet-breakpoint`: codehealth 12 |
| C-07 | brief — card-rings (its U-07 de-dup owns `body`/`html`/`*`) | |
| C-08 | built — J | |
| C-09 | owner | |
| C-10 | later — with C-01 (Trade region beside card-search's search box) | |
| C-11 | codehealth — item 12, with U-10 | |
| C-12 | built — J | `.ring` blocklist: brief — card-rings |
| C-13 | built — J (with D-14) | |
| K-01 | built — E | |
| K-02 | built — F | |
| K-03 | later — after backend-health (it rewrites the entry points' default resources) | |
| K-04 | later — after backend-health | its order snapshot is built now in G |
| K-05 | built — G | |
| K-06 | built — F (combo section), G (retrieval) | concept terms: codehealth 8 |
| K-07 | built — F | |
| K-08 | built — D | |
| K-09 | built — F | `routes/askAi.ts` cast: brief — backend-health |
| K-10 | built — F | |
| K-11 | built in part — F | `errorHandler.ts` ternary: brief — backend-health; `GameRulesSection` in `gameRules.ts` and the test-only exports in `gameRulesRetrieval.ts`: later, with K-03 |
| K-12 | built in part — G | exports in `gameRulesRetrieval.ts`, `embeddingModel.ts`, `ruleLayout.ts`, `validation/askAiRequest.ts`: later, after backend-health |
| K-13 | built — F | |
| K-14 | built — G | |
| K-15 | built in part — F, G | `catalog.ts` constants and zone order: later, after backend-health |
| K-16 | later — eval-harness package | the fallback-question fix is follow-up 15 |
| K-17 | later — after backend-health | |
| K-18 | built in part — F | lines in `routes/askAi.ts`, `createApp.ts`, `localEmbeddingProvider.ts`: brief — backend-health |
| K-19 | brief — backend-health (its shared loader helper) | |
| T-01 | built — A | |
| T-02 | built — A | |
| T-03 | built — B | |
| T-04 | built — B | files whose subject a brief owns: later |
| T-05 | later | |
| T-06 | built — C | |
| T-07 | built — C | `verbatimModuleSyntax` (four `import type` edits, one in `MtgAssistantApp.tsx`): later, after card-search; `tsconfig.node.json`: later |
| T-08 | built — C | |
| T-09 | built — C | |
| T-10 | built — D (with K-08) | |
| T-11 | built — D | |
| T-12 | built in part — D | three-defaults reconciliation: follow-up 21; scan-vector path: owner |
| T-13 | built in part — D (move `resolveRunEnv`, `sumOf`) | splitting the large eval functions: later |
| T-14 | owner | |
| T-15 | built — D | |
| T-16 | built — C | |
| T-17 | owner | |

**Counts (68 ids).** Built 47 (27 fully, 20 in part, each remainder routed above). Later 14. Pending brief 3
(Q-05, C-07, K-19). `codehealth` 1 (C-11). Owner 3 (C-09, T-14, T-17). Behavior
change as the whole finding: 0 — every behavior change sits in the follow-ups.

## Follow-ups (recorded, never built here)

Player-visible bugs first, then every item from the four findings files'
behavior-change and appearance-change lists.

1. **In-Depth scanner refuses a duplicate Stack card with no message.** The
   refusal is stored in `blockedNotice` and nothing renders it; the scan spec
   (`scan/README.md:140-143`) says a blocked re-scan surfaces its message.
   Code-read only; check in the browser. Its own kickoff.
2. Feedback sent from any tool carries the hidden In-Depth flow once In-Depth
   was visited (last registration wins).
3. Resuming an In-Depth history entry or draft while on Life Tracker queues a
   roster seed from the tracker; decide whether that is wanted.
4. Unifying Retry's and Decrypt's no-game-context behavior (Retry is silent).
5. Body base values: moving `body` to the shell layer's own values changes the
   ground colour, `100vh` → `100dvh`, and drops Roboto from the font stack.
6. 480 px vs 479 px for the short-phone rule and the label fold.
7. Two monospace font stacks.
8. Mockup tap sizes (40 px) vs REQ-205's 44 px in `index.css`.
9. Splitting the grouped `.act-zones` / `.place-zones` button rule.
10. Filtering empty-named stack cards the way zone cards are filtered.
11. Carrying the unboosted blend instead of `score - boost` (can flip the
    relevance cutoff by one unit in the last place).
12. Storing rule vectors as `Float32Array` (~9 MB heap, different rounding).
13. Batching query and per-card embeddings into one call.
14. Removing the "effectively unlimited" caps and their truncation branches
    (DEC-042 owns the budget).
15. Fixing the eval harness's fallback question (changes eval results for
    empty-question fixtures; none exist today).
16. Raising the 1,200 ms latency-warning threshold.
17. Combo prefilter log: after slice E, a corrupt variant that can never be
    complete no longer logs its warning. Slice E's integrity test makes this
    unreachable for committed data; add a runtime sweep only if wanted.
18. Speeding up combo matching when the question has combo wording.
19. The React Compiler lint hits (26 + 19 + 2) and the larger TypeScript flags
    (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
    `noPropertyAccessFromIndexSignature`).
20. One Node version across CI (22), Lambda (24) and local (26).
21. Reconciling the three practice-suite default folders (repo-relative vs
    main-checkout).
22. Removing the `data:scan-hashes` alias (the scan data spec records it as kept).
23. Moving `detectorFixtures.ts` out of `src/lib/scan` (shifts the coverage
    numerator).
24. Typechecking `scripts/*.mjs` with `checkJs`.
25. Formatting TypeScript with Prettier (Q-18).
26. **Owner housekeeping:** pause `codehealth` items 3, 5, 6, 7, 8 and 9 until
    this package merges (see the queue table).

## Product truth

None proposed, so no `GATE-QUESTIONS.md`. Every built change keeps behavior,
and none alters a `PRD/sections/` statement. Checked by grepping the sections
for every file, script alias, flag, selector and helper name this package
changes or removes. Three items were kept out for this reason: deleting
`StepEyebrow` (named in `shared-chrome/README.md`), moving `hashLibBuild.ts`
(named in `system-map.md` and `scan/data/cardhashes.md`), and removing the
`data:scan-hashes` alias. Files the sections name and this package edits keep
their names and paths (`enrichmentDebug.ts`, `useScanCapture.ts`, `tuning.ts`,
`package-lambda.sh`, `quality-check.yml`).

No blocker questions: no open question meets all three conditions of the
preparation contract's blocker test (each is settled by tested behavior, the
assumption ladder, or by leaving the item out).

## Material assumptions

1. **Prompt refactors are allowed under `technical-design-rules.md`.** The rule
   against changing backend prompt assembly without a spec change guards what
   the AI receives. Slices F and G change code, not prompts; byte-identical
   goldens and the order snapshot are the proof, and any diff stops the slice.
2. **K-07 removes a Zod schema that validates nothing.** It is never parsed; it
   only derives a type for the mock-only debug sidecar (functional requirements:
   live responses carry no `enrichmentDebug`). The response bytes are unchanged.
3. **Operator logs, test and CI times, and the Lambda package's contents are not
   what a player sees, hears, or waits for.** They may change; runtime output
   may not.
4. **The four briefs are still pending** (no packages in `PRD/work/`; `main`
   ends at the scanner run, #320). If one starts first, its files stay off-limits
   as listed.
5. **T-12's preserving form.** On the owner's machine the git-common-dir path
   equals today's hard-coded path from every checkout.
6. **T-16 adds no new dependency**: the same packages at the same resolved
   versions, declared in the workspace that imports them.
7. **The probes' numbers stand** where the code matched on spot-check (lines
   marked confirmed). Measurements were not re-run; each slice records its own
   before/after.

## Verification commands (per slice, on the build base and after)

- Backend: `npm --workspace apps/backend run test`, `npm --workspace apps/backend run typecheck`
- Frontend: `npm --workspace apps/frontend run test`, `npm --workspace apps/frontend run typecheck`, `npm --workspace apps/frontend run build`
- Scripts: `npm run test:scripts`
- Repo: `npm run lint`, `npm run format:check`, `npm run typecheck`
- Slice J also: the computed-style dump and the REQ-202 screenshot pair.
- Never: `npm run data:refresh`, data rebuilds, paid evals, deploys from a build.

## After the code PR (owner)

1. Merge the code PR.
2. After merge only: the CI deploy runs the new backend-only build. Send one live
   In-Depth question and tail CloudWatch to confirm the native embedder chain
   loads (the Lambda package changed).
3. Count `$TMPDIR` entries after the next full local `npm test`; it should stop
   growing. Old leaked folders can be removed by hand.
4. Resume the held `codehealth` items.

## Non-goals

- Any change to behavior, copy, layout, timing, or product truth.
- The player-visible bugs and every behavior or appearance change above.
- Splitting `gameRulesRetrieval.ts`, `index.css`, or the backend root folders
  (K-04, C-01, K-17) before the briefs that own those files ship.

## Evidence

- Intake (evidence, not authority): `intake/HEALTH-REPORT-2026-10-18.md`,
  `intake/FINDINGS-{frontend-code-quality,styling-organization,backend-code-quality,scripts-tooling-tests}.md`,
  `intake/HEALTH-REPORT.md` (the `codehealth` queue), `intake/GRAPH-BRIEF-{backend-health,card-search,card-rings,popups}.md`,
  and the U-12 / D-14 entries of `intake/FINDINGS-ui-and-personalities.md` and
  `intake/FINDINGS-data-and-clients.md`.
- Cited, not opened: the prior-run receipts listed in `IDEA.md`, and
  `PRD/work/probe-codebase-health-pass/` paths the briefs cite.
- PRD read: REQ-202 (`functional-requirements.md`), `shared-chrome/README.md`
  file list, `technical-design-rules.md`, `preparation-contract.md`,
  `plain-language-standard.md`, `graph-workflow-contract.md`.
