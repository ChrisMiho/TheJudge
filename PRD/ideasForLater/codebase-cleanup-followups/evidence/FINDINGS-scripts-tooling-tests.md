# Findings — scripts, tooling, dependencies, tests (2026-10-18)

## Summary in plain words

Nothing a player sees is broken here. The cost is developer time and a messy machine. Three test files spend about half the backend test run rebuilding the same expensive inputs. Twenty test files never delete their temp folders: the Mac's temp directory now holds 40,213 entries (760 MB). The frontend test setup loads the whole app even for 51 tests that never draw a screen, which doubles their run time.

Tooling has free wins. Seven TypeScript strictness flags and about 17 lint rules already pass with zero errors. The Prettier config says "no semicolons," but 540 of 585 code files use them; it only formats JSON and YAML, where that setting does nothing.

The scripts folder is flat but tidy. Every `scripts/lib` module has an importer, and only the two scripts B-11 already lists are dead. The real script problems are oversized eval functions, the owner's home path hard-coded in three scripts, and more copied helpers (new B-10 and F-07 instances).

Test-only fixes (T-01 to T-05) need test edits. `codehealth`'s no-test-change rule blocks them, so they need their own small run.

## Findings — ranked

### T-01 — Two backend test files rebuild the same slow input, setting the backend suite's wall time
- Evidence: backend run is 18.3 s wall. Per-file times: `eval/rules-gate/rulesGate.test.ts` 14.4 s, `commanderSpellbook/matcher.test.ts` 12.0 s, `eval/ragRetrievalBenchmark.test.ts` 8.5 s. Everything else is under 1.6 s.
  - `rulesGate.test.ts:114` and `:152` each call `runGate()` on the full corpus (7.4 s and 6.0 s). The second test only checks the result count and that no embedder or fetch call happened. The spies are installed in `beforeAll` (`:59-67`).
  - `matcher.test.ts:728`, `:736` and `:761` each call `loadAtScaleCatalog(generateAtScaleVariants())`. Each call brotli-compresses 2,000 deterministic variants at quality 11 (`:685-723`): 5.2 s, 3.4 s and 3.4 s.
  - `ragRetrievalBenchmark.test.ts:47-48` scores twice on purpose (a determinism check). `:57` then scores a third time.
- Why it is poor: the backend suite's wall time is set by repeated work, not by more checking.
- Behavior-preserving fix:
  - rulesGate: memoize one `runGate()` result and assert both tests against it.
  - matcher: write the at-scale catalog files once in `beforeAll` and call `loadComboCatalog` per test, so each test still gets a fresh cache.
  - rag benchmark: reuse `first` in the baseline test.
- Size: S
- Proof of no change: same test names and assertions, same pass count (891). Backend wall time should drop from about 18 s to about 10 s.
- Owner-only?: no (test edits, so not `codehealth`)

### T-02 — Twenty test files leave temp folders behind on every run
- Evidence: 20 of the 42 files that call `mkdtemp`/`mkdtempSync` have no `rm`/`rmSync` (for example `scripts/lib/experiment-run.test.mjs`, `scripts/lib/answer-compare.test.mjs`, `apps/backend/src/gameRulesRetrieval.test.ts`, `commanderSpellbook/matcher.test.ts`, `runtime/createConfiguredApp.test.ts`, `scripts/package-lambda.test.mjs`).
  - `$TMPDIR` holds 40,213 entries (760 MB).
  - Top prefixes: `experiment-run-test` 6,278; `compare-test` 3,042; `rule-embeddings-test` 2,576; `combo-runtime` 2,136; `aq-experiment` 2,030; `combo-at-scale` 1,068. Each maps to one of those files.
- Why it is poor: disk grows without limit on the owner's machine and in long-lived worktrees.
- Behavior-preserving fix: one `makeTempDir()` helper per runner. It registers `t.after`/`afterAll(() => rmSync(dir, { recursive: true, force: true }))`. Also add the same cleanup to `scripts/lib/fake-embedding-model.mjs`.
- Size: S–M (20 files, mechanical)
- Proof of no change: same pass counts. Re-count `$TMPDIR` entries before and after a full `npm test`; the count should not grow.
- Owner-only?: no (test edits)

### T-03 — The frontend test setup loads all four tools for 51 tests that never render
- Evidence: `apps/frontend/src/test/setup.ts:4-7` statically imports `destinationRegistry` and runs `beforeAll(preloadPortalDestinations)` for every file. That includes the 51 files `vite.config.ts` pins to the `node` environment (DOM-free).
  - Run with setup: 51 files pass, 4.20 s wall, cumulative tests 25.97 s.
  - Run without setup (a scratch config overriding `setupFiles: []`): 51 files pass, 2.95 s wall, cumulative tests 10.85 s.
  - Full suite: 16.4 s wall, 138 s cumulative test time, 16.6 s cumulative setup.
- Why it is poor: pure-logic tests (scan math, trade, context flow) pay for importing React and every tool.
- Behavior-preserving fix: keep `setup.ts` for jsdom. Guard the DOM-only work (`preloadPortalDestinations`, `cleanup`, jest-dom, `scrollIntoView` shim) behind `typeof document !== "undefined"`, loading the registry with a dynamic import inside that guard. The storage and history resets are already guarded.
- Size: M
- Proof of no change: full frontend suite stays 154 files / 1,666 tests green. The 51 node files were measured green with no setup at all.
- Owner-only?: no (test infra)

### T-04 — App test helpers are copied file to file instead of imported
- Evidence:
  - `createMemoryStorage` is defined in 11 files, although `src/test/appTestHelpers.tsx:94` already exports it (copies include `App.player-life-tracker-seed.test.tsx:18`, `hooks/useThemePalette.test.ts`, `lib/theme/themePrefs.test.ts`, `lib/scan/acquisition/audioPrefs.test.ts`).
  - `jsonResponse` is defined in 9 files, also exported at `appTestHelpers.tsx:81`.
  - `selectDestination` has 5 copies, plus `switchToDestination` ×2. `openHistory` ×2, `openPortalMenu` ×2, `carryIntoInDepthDetails` ×2.
  - `queueAskAiResponses` plus the whole fetch mock is copied in `App.answered-state`, `App.theming` (`:38-74`) and `App.game-setup-zones`. `src/test/interactionFlowsHarness.ts` already provides it.
  - The `vi.hoisted` debugLogger mock block is copied in 6 files.
  - 18 test files re-read `index.css`/`flow.css`/`shell.css`, although `appTestHelpers.tsx:9-11` exports `appCss`/`flowCss`/`shellCss`.
  - An identical `cssBlock` brace parser appears 3 times (same md5) in `test/ambient-accent-foundation`, `motion-foundation` and `reduced-motion`, with a variant in `menu-button-and-tray-styles`.
  - Script tests copy `codeOnly()`: `scripts/deploy-lambda-s3-staging.test.mjs:34`, `scripts/frontend-origin-source.test.mjs:33`.
- Why it is poor: copies drift. `App.theming`'s fetch mock already lacks the card-detail route the harness serves.
- Behavior-preserving fix: import the existing helpers. Add `cssBlock`, `selectDestination` and `openHistory` to `appTestHelpers.tsx`. Keep each file's own fixture data.
- Size: M
- Proof of no change: same test count and names; full suite green.
- Owner-only?: no (test edits)

### T-05 — Tests for Node scripts live in the frontend suite
- Evidence: six frontend test files test scripts, not the app:
  - `src/lib/metadataTransformPolicy.test.ts` imports `scripts/build-card-metadata.mjs`
  - `cardRulingsTransformPolicy.test.ts` imports `build-card-rulings.mjs`
  - `gameRulesBuildPolicy.test.ts` imports `build-game-rules.mjs`, plus backend `src/gameRulesTopicSelection.js`
  - `scryfallRefreshPolicy.test.ts` imports `refresh-scryfall-data.mjs`
  - `lib/scan/persistence/buildCardScanMap.test.ts` imports `build-card-scan-map.mjs`
  - `deploymentPipeline.test.ts` runs `scripts/aws-deploy.sh`

  They are labelled "Frontend - Shared." `refresh-scryfall-data.mjs` is tested in both suites, and the jsonl-preference case appears in both (`scryfallRefreshPolicy.test.ts:53`, `scripts/refresh-scryfall-data.test.mjs:15`). These files are the reason the frontend needs `allowJs`.
- Why it is poor: a script change is verified by the frontend suite, under the wrong label, with overlapping duplicate cases.
- Behavior-preserving fix: move them beside their scripts as `scripts/*.test.mjs` (`node:test`), and drop cases the script suite already has.
- Size: M
- Proof of no change: before and after, list the case names per script; nothing lost. Both suites green.
- Owner-only?: no (test edits)

### T-06 — A dead wildcard type declaration
- Evidence: `apps/frontend/src/types/build-card-metadata.d.ts` declares `declare module "*.mjs"` with six `unknown`-typed functions. Because `allowJs` is on, relative `.mjs` imports resolve to the real files. A scratch tsconfig that excludes only this file typechecks 318 files (vs 319) with 0 errors, and catches the same 4 `verbatimModuleSyntax` errors as the real config, so it is a real check.
- Why it is poor: it is misleadingly named, never consulted, and would silently type a mistyped import as `unknown`.
- Behavior-preserving fix: delete it.
- Size: S
- Proof of no change: `npm run typecheck` exits 0.
- Owner-only?: no

### T-07 — TypeScript strictness flags that already pass, and config files nobody typechecks
- Evidence:
  - TypeScript 5.9.3. Both workspaces exit 0 with all of these added: `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `isolatedModules`, `noUncheckedSideEffectImports`, `allowUnreachableCode false`, `allowUnusedLabels false`.
  - `verbatimModuleSyntax`: backend 0 errors. Frontend 4 errors, all type-only imports: `EnrichmentStep.tsx:1` and `MtgAssistantApp.tsx:1` (`FormEvent`), `useEnrichmentTargets.ts:1` (`Dispatch`, `SetStateAction`).
  - `apps/frontend/vite.config.ts`, `tailwind.config.ts` and `apps/backend/vitest.config.ts` sit in no tsconfig. They pass `tsc --strict` checked directly.
- Why it is poor: free guards are left off. `isolatedModules` is what Vite's per-file transpile actually assumes.
- Behavior-preserving fix: add the seven flags to `tsconfig.base.json`. Add `verbatimModuleSyntax` to the frontend plus the 4 `import type` edits, which are erased at compile time. Optionally add a small `tsconfig.node.json` for the config files.
- Size: S
- Proof of no change: `npm run typecheck` exits 0. The built bundle is byte-identical, since type imports are erased.
- Owner-only?: no

### T-08 — Lint rules that already pass are off, and warnings never fail CI
- Evidence:
  - `eslint .` takes 3.6 s with 0 errors and 0 warnings. But `"lint": "eslint ."` has no `--max-warnings 0`, and `react-hooks/exhaustive-deps` and `react-refresh/only-export-components` are `warn`.
  - Ten react-hooks v7 recommended rules have 0 hits on `apps/frontend/src`: static-components, use-memo, void-use-memo, preserve-manual-memoization, incompatible-library, globals, error-boundaries, purity, set-state-in-render, unsupported-syntax.
  - Core rules with 0 hits repo-wide: `eqeqeq` (null ignored), `no-else-return`, `object-shorthand`, `no-implicit-coercion`, `no-useless-return`, `no-unneeded-ternary`, `no-lonely-if`, `@typescript-eslint/no-import-type-side-effects`.
  - The ignore entry for `apps/frontend/data/scryfall/default-cards.json` (`eslint.config.mjs:24`) does nothing, because ESLint never lints JSON.
- Why it is poor: the clean state is not locked in, and a new warning would pass CI.
- Behavior-preserving fix: add `--max-warnings 0` and enable the zero-hit rules.
- Size: S
- Proof of no change: `npm run lint` still exits 0 on main.
- Owner-only?: no

### T-09 — The Prettier config contradicts the code it never formats
- Evidence:
  - `.prettierrc.json` sets `semi: false, trailingComma: "none"`. `format` covers only `**/*.{json,yml,yaml}`, where both keys do nothing.
  - Semicolons are used in 302 of 317 frontend files, 122 of 123 backend files, and 115 of 145 scripts.
  - Running prettier on code would rewrite 575 of 588 files with the current config, and 396 of 588 even with `semi: true`.
  - A config without `semi: false` still passes `format:check` on JSON/YAML.
- Why it is poor: anyone running Prettier on a `.ts` file strips its semicolons, and the stated style is not the real one.
- Behavior-preserving fix: remove `semi` (or set it to `true`) so the config matches the dominant style. Formatting the code itself is listed under out of scope.
- Size: S
- Proof of no change: `npm run format:check` passes, as verified with a scratch config.
- Owner-only?: no

### T-10 — The Lambda package ships the backend's compiled tests
- Evidence: `apps/backend/tsconfig.json` includes all of `src`, and `build` is `tsc -p tsconfig.json`. A scratch build emitted 123 JS files. 55 of them are `*.test.js` (724 KB of 1.2 MB), plus `test-utils/`. `scripts/package-lambda.sh:63` copies `apps/backend/dist` whole.
- Why it is poor: test code is deployed, never run, and counts against the Lambda size budget.
- Behavior-preserving fix: a `tsconfig.build.json` that excludes `**/*.test.ts` and `src/test-utils/**`, used by `build`. Typecheck keeps using the full config.
- Size: S
- Proof of no change: diff the dist file lists (only test files removed). Run the backend tests and `scripts/lambda-package-budget.test.mjs`. The deploy zip's contents do change, but runtime code does not.
- Owner-only?: no

### T-11 — CI deploy builds the frontend twice and throws the first build away
- Evidence:
  - `.github/workflows/quality-check.yml` deploy job runs "Build project" (`npm run build`, which builds frontend and backend). Then `scripts/aws-deploy.sh:121` rebuilds the frontend with the production env and syncs that build. Its own comment (`:19-23`) says the earlier step's artifact "never reaches S3."
  - Only the backend `dist` from that step is used (`package-lambda.sh:63`).
  - Locally, frontend `tsc` plus `vite build` costs about 4 s.
  - Also: `static` has a leftover measurement step "Record runner cores: nproc" from `18c5f512` that nothing reads. The workflow triggers on `master`, which does not exist on the remote. Checkout, setup-node and `npm ci` repeat in 6 jobs, with `node-version: 22` written 5 times.
- Why it is poor: wasted deploy time and a misleading step name.
- Behavior-preserving fix: change the step to `npm --workspace apps/backend run build`. Drop the `nproc` step and the `master` trigger. Optionally move the Node version into one workflow env value.
- Size: S
- Proof of no change: the deploy uploads the same `aws-deploy.sh` frontend build and the same backend dist. `scripts/ci-workflow-parity.test.mjs` and `apps/frontend/src/lib/deploymentPipeline.test.ts` stay green; both read this workflow.
- Owner-only?: no

### T-12 — The owner's home path is hard-coded in a public repo, and the practice-suite folder has three defaults
- Evidence:
  - `scripts/score-rule-search.mjs:36` and `scripts/privacy-scan.mjs:14` default to `/Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite`.
  - `scripts/build-scan-vectors.mjs:25,28` default to `/Users/chrismiho/Coding/Projects/cardomancer-card-detection/...`.
  - The same folder is also `SUITE_DIR` in `scripts/lib/practice-suite.mjs:23` (relative to the repo root) and `join(REPO, "output/practice-suite")` in `export-rule-search-training.mjs:31`.
- Why it is poor: it leaks a personal path, and the scripts disagree about where the suite lives when run from a worktree.
- Behavior-preserving fix: one helper in `lib/practice-suite.mjs` that resolves the main checkout (git common dir, as `lib/local-openai-env.mjs` already does for worktrees). All four tools import it. On the owner's machine it yields the same absolute path from main and from any worktree.
- Size: S
- Proof of no change: print the resolved path before and after, from main and from a worktree; they must match.
- Owner-only?: no

### T-13 — Eval tooling has a few oversized functions, and a CLI file used as a library
- Evidence: ESLint complexity and length scan of `scripts/`:
  - `lib/experiment-run.mjs:566` `executeExperiment`: 280 lines, complexity 80.
  - `lib/gold-cases.mjs:192` `validateGoldCase`: complexity 98.
  - `eval-answer-quality.mjs:205` `parseArgs`: complexity 67. This is a new instance for B-10's hand-rolled parsers.
  - `eval-answer-quality.mjs:360` `parseExperimentFlags`: 50. `:810` `executeEvaluation`: 43.
  - `lib/answer-compare.mjs:339` `compareRunSides`: 41.
  - `score-rule-search.mjs:55` and `export-rule-search-training.mjs:43` import the 1,687-line CLI `eval-answer-quality.mjs` only for `resolveRunEnv`.
  - `sumOf` is defined in both `experiment-run.mjs:307` and `eval-answer-quality.mjs:684`.
- Why it is poor: these are hard to review, and paid-run code is where a slip costs money.
- Behavior-preserving fix: split `executeExperiment` into plan, answer loop, grade loop and summary steps. Split `validateGoldCase` per field group. Move `resolveRunEnv` and `sumOf` into `scripts/lib`. The existing tests (`experiment-run.test.mjs`, 1,216 lines; `eval-answer-quality.test.mjs`, 1,893 lines) are the safety net.
- Size: M–L
- Proof of no change: `npm run test:scripts` green, plus a `--dry-run` plan output byte-identical before and after.
- Owner-only?: no

### T-14 — `boundary-rules.mjs` mixes a shell parser, evidence bookkeeping and the rule table in 1,653 lines
- Evidence: `scripts/lib/boundary-rules.mjs` has three parts:
  - the shell tokenizer and normalizer, about lines 269–660 (`splitSegments`, `tokenize`, `extractRedirections`, `stripWrappers`, `normalizeCommand`)
  - criteria and evidence parsing, about 718–916
  - the `RULES` table, 1019–1411

  It is imported by `graph-boundary-hook.mjs` (protected) and `graph-preflight.mjs`.
- Why it is poor: one file holds three jobs, and the guard's engine is hard to review.
- Behavior-preserving fix: move the parser to `lib/shell-command.mjs` and the evidence code to `lib/graph-evidence.mjs`. Re-export both from `boundary-rules.mjs`, so the protected hook's import does not change.
- Size: M
- Proof of no change: `boundary-rules.test.mjs`, `graph-boundary-hook.test.mjs` and `graph-preflight.test.mjs` all green, plus the canary.
- Owner-only?: the file itself is not protected, but it is the engine of the protected guard. The owner should review it; per memory, a disarmed guardrail is never routed around.

### T-15 — More copied script helpers (new instances under B-10 and F-07)
- Evidence:
  - New under B-10:
    - `ensureParentDirectory` is defined 8 times: `build-card-detail-by-oracle-id.mjs:39`, `build-card-metadata.mjs:205`, `build-card-rulings.mjs:10`, `build-card-scan-map.mjs:10`, `build-commander-spellbook-combos.mjs:102`, `build-game-rules.mjs:62`, `build-rule-embeddings.mjs:76`, `refresh-scryfall-data.mjs:59`.
    - `formatBytes` ×4. Three are identical; `refresh-scryfall-data.mjs:63` adds a GB branch.
    - The Scryfall User-Agent appears twice (`build-card-hashes.mjs:187`, `refresh-scryfall-data.mjs:37`; the Accept headers differ).
    - `writeWhole` ×2 with identical bodies (`lib/practice-suite-convert.mjs:157`, `lib/practice-suite-import.mjs:94`).
    - `escapeRegExp` ×2, identical (`build-game-rules.mjs:72`, `lib/rule-availability.mjs:13`).
  - New under F-07: `assertLiveProviderConfigured` ×2 (`compare-combo-answer-quality.mjs:96`, `eval-answer-quality.mjs:447`) and `describePlan` ×3. The messages differ on purpose; only the check is shared.
- Why it is poor: copies drift.
- Behavior-preserving fix: a `scripts/lib/fs-helpers.mjs` holding `ensureParentDirectory`, `writeWhole`, `escapeRegExp` and `formatBytes`. Keep the three-tier `formatBytes` for the build scripts, so no log text changes.
- Size: S
- Proof of no change: `npm run test:scripts`; data builds produce byte-identical output (they write the same files).
- Owner-only?: no

### T-16 — Dependencies used by one workspace but declared in another
- Evidence:
  - `apps/frontend/src/lib/scan/detectorFixtures.ts:3` imports `pngjs`. `pngjs` and `@types/pngjs` are root devDependencies, absent from `apps/frontend/package.json`.
  - That file is a 327-line test-only helper (it imports `node:fs`). It sits in `src/lib/scan` beside runtime code and counts toward frontend coverage.
  - Frontend tests import `node:fs` but the frontend does not declare `@types/node`; it resolves through the backend's hoisted copy. The same goes for root ESLint's `typescript-eslint` peer `typescript`.
  - `yaml` is the only exact version pin (`2.9.0`).
  - No unused dependencies were found: every declared dependency has an importer (autoprefixer via `postcss.config.js`, jsdom via `vite.config.ts`).
- Why it is poor: installs and type resolution work only through hoisting.
- Behavior-preserving fix: declare `pngjs`, `@types/pngjs` and `@types/node` as frontend devDependencies.
- Size: S
- Proof of no change: `npm ci`, typecheck and tests green; the lockfile resolves the same versions.
- Owner-only?: no

### T-17 — Unreferenced tracked files at the repo root
- Evidence:
  - `exampleoutput.txt`: 27 KB of mock prompt output from `9e24aad7` (2026-06-05), referenced nowhere.
  - `purple-gold-handoff/`: a personal Claude Code theme and statusline script (`7b7aa98f`, `0552b9ba`), referenced nowhere.
- Why it is poor: clutter in a public repo.
- Behavior-preserving fix: delete them, or move them to `TheJudge-backups`.
- Size: S
- Proof of no change: `git grep` finds no references.
- Owner-only?: owner call (personal assets)

## Behavior changes (out of scope)

- Fixing the React Compiler lint hits: `react-hooks/set-state-in-effect` 26, `refs` 19, `immutability` 2. These change component code.
- Larger TypeScript flags: `noUncheckedIndexedAccess` (632 frontend errors / 107 backend), `exactOptionalPropertyTypes` (34 / 51), `noPropertyAccessFromIndexSignature` (135 / 98).
- Formatting TS with Prettier: 396–575 files rewritten. It is a style decision and a huge diff.
- CI runs tests on Node 22, the Lambda runs Node 24 and local dev runs Node 26 (memory notes Node 26 hid a storage bug). Picking one version is a CI decision.
- Removing the `data:scan-hashes` alias. `PRD/sections/scan/data/cardhashes.md:62` and FR line 780 record it as kept and forwarded, so it needs a product-truth edit.
- Making the practice-suite default repo-relative instead of main-checkout-relative. That changes worktree runs (see T-12 for the preserving form).
- Moving `detectorFixtures.ts` out of `src/lib/scan` shifts the coverage numerator, which is very small next to the 45% gate. Check it before calling it neutral.
- Typechecking `scripts/*.mjs` (`checkJs`). It is unmeasured and likely noisy.

## Healthy — don't fix

- **Lint and typecheck are clean.** ESLint: 0 errors, 0 warnings, 3.6 s. Typecheck exits 0. Every one of the 16 `eslint-disable` comments targets a narrow rule, and 11 carry a reason.
- **The script test suite is fast.** 1,061 tests in 2.1 s. There are no `.only` or `.skip`; the one `t.skip` is a platform branch (`process-manager.test.mjs:92`).
- **Every `scripts/lib` module has an importer.** The hand-written `gold-cases.d.mts` and `prompt-fidelity.d.mts` match their modules' exports. Only `aws-verify.mjs` and `leak-check.mjs` (already B-11) have zero references. Owner tools with few references are live, cited by receipts or REQs.
- **The flat `scripts/` layout is not worth a bulk move.** There are 667 path mentions across PRD, receipts, 97 backend files and the protected `.claude/skills`, and `graph-boundary-hook.mjs` cannot move. Group new families in subfolders instead.
- **The CI and guard tests are deliberate.**
  - `ci-workflow-parity.test.mjs` keeps CI equivalent to `quality:check`.
  - The CSS-text tests (motion, ambient accent, menu tray) and the package.json-string tests are REQ guards, not accidental implementation-detail tests. Only their copied helpers (T-04) are the problem.
- **The deliberate config choices stand.** `environmentMatchGlobs` (DEC-155), the frontend's coverage sharding and merge, and `@aws-sdk/client-ssm` as a devDependency are all on purpose.
- **Long timeouts are explained in place.** The two 20 s per-test timeouts (`App.interaction-flows.presentation.test.tsx:316`, `App.player-life-tracker-flow.test.tsx:220`) are documented in comments. Real-timer waits are rare and short: one 120 ms wait in `openAiResponsesProvider.test.ts:183`.

Scratch measurements (JSON test reports, scratch tsconfigs and the vitest config) are in `/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/ddf415bc-a3a4-43fb-afd7-540b54a625a5/scratchpad/`. Nothing in the repo was modified.
