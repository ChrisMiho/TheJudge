# Findings — backend, scripts, and the August duplication audit

Probe: codebase-health-pass, subagent 3 of 3. Date: 2026-10-17. Read-only; nothing in product code or `PRD/sections/` was edited.

## Summary in plain words

- **What a player could notice.** Two things. First, a very long follow-up chat, or any request bigger than 100 KB, gets "Miho is working on it" (a server error) instead of a clear message. Pressing Retry sends the same request and fails the same way (B-01). Second, if a data file or the search model fails to load after a deploy, the app keeps running with worse answers: card popups come back empty, official rulings drop out of answers, and rule search falls back to plain word matching (lexical search). Nothing flags it. The health check still says "ok" (B-02).
- **Speed is fine.** Every data file loads once per Lambda container (one running copy of the backend) and is shared by every request. Nothing is decompressed again per request. A warm request spends about 5–10 ms on our side before the model call. A cold container spends about 0.3 s loading data on a laptop (more on Lambda). The first answer after a cold start adds about 0.3 s more, because it loads the search model. The Trade Balancer's first price lookup also waits for the rulings and combo data, which it never uses (B-07).
- **Duplication.** The main drift risks are in the dev and eval tooling, not the request path:
  - The list of files production loads is written twice, once in the app and once in the eval tooling (B-03).
  - The rule-search training tools re-type the formula that builds the text the committed rule vectors were made from (B-04).
  - Three different loaders read the OpenAI key, each with its own rule for which value wins (B-05).
- **The August audit.** None of its 11 findings is fully fixed. Seven still stand as written. Four have changed:
  - F-01 is mostly fixed: a shared sheet component (`SheetShell`, #239) now handles Escape for five of the seven overlays.
  - F-07, F-08 and F-10 each have more copies now. Some of those copies were already there in August and the audit missed them.

Severity: High = a cost a player can see, or a real bug risk. Medium = duplicated logic likely to drift, or measurable waste. Low = tidy-up. Route: `graph` = needs a design decision or changes behavior. `codehealth` = small, keeps behavior the same, one PR.

---

## Part A — backend and scripts

### B-01 — Long chats and malformed requests get a server error instead of a clear message

- **Severity:** Medium (a player can see it, but only in long chats). **Route:** `graph` (small, but it changes the status code and message the player gets).
- **Evidence:**
  - `apps/backend/src/app/createApp.ts:48` uses `express.json()` with no limit, so Express's default 100 KB applies.
  - The request rules allow up to 20 chat turns of 10,000 characters each, so about 200 KB (`apps/backend/src/validation/askAiRequest.ts:227-234`).
  - When the body parser fails, its error is not an `AppError`, so `apps/backend/src/app/errorHandler.ts:46-48` turns it into `500 UNEXPECTED_ERROR` and logs it at error level.
  - Checked in-process against `createApp({})`: a malformed JSON body returned `500 {"code":"UNEXPECTED_ERROR","message":"Miho is working on it"}`. A 200 KB body returned the same 500.
- **What the fix looks like:** set the `express.json` limit to the largest body the schema allows. Map the body parser's `entity.parse.failed` and `entity.too.large` errors to `createValidationError` (400) in the error handler. The owner picks the wording for "chat too long".

### B-02 — Missing data and a broken search model fail silently, and the health check still says "ok"

- **Severity:** Medium (a quiet drop in answer quality that a player can feel; memory records the production embedder falling back to lexical search twice). **Route:** `graph` (adds a readiness signal and a deploy check).
- **Evidence:**
  - Every data loader returns an empty map and prints a `console.warn` when its file is missing or unreadable: `cardRulings.ts:72-84`, `cardDetail.ts:68-83`, `cardPrices.ts:90-106`, `gameRules.ts:44-56`, `commanderSpellbook/catalog.ts:401-405`.
  - The local embedder (the in-process model that turns text into search vectors) remembers a failed load forever. That container then serves every request with lexical search and prints one warning per request (`providers/localEmbeddingProvider.ts:53-69`).
  - `/api/health` always answers `{ok:true}` (`routes/health.ts:4-6`). No workflow or deploy script calls any endpoint after a deploy (grep of `.github/workflows/*.yml` and `scripts/*.sh` for `health` or `api/` finds nothing).
  - Production runs with `DEBUG_LOGGING=false` (`scripts/aws-deploy.sh:108`), so `logger.info` does nothing (`logging.ts:56-60`). Today the raw `console.warn` lines are the only sign of a fallback. Moving them onto `logger.info` "for consistency" would hide them.
- **What the fix looks like:**
  - Record a readiness snapshot at startup: how many entries each data set loaded, and whether the embedder loaded. Expose it on `/api/health` or a sibling endpoint.
  - Log each failure once, at error level, through the app logger.
  - Add one smoke request after deploy.

### B-03 — The list of production prompt inputs is written twice, and one eval tool builds a different prompt

- **Severity:** Medium (drift would make evals stop matching production). **Route:** `codehealth`.
- **Evidence:**
  - `runtime/createConfiguredApp.ts:27-46` loads seven files from fixed paths. `scripts/lib/prompt-fidelity.mjs:123-146` (`loadPromptResources`) repeats the same paths and the same combo on/off rule, and its comment says so.
  - The step that turns a request into search vectors (the question plus each attached card) lives in the route at `routes/askAi.ts:102-121` and again in `scripts/lib/prompt-fidelity.mjs:174-186` (`embedRequestQuery`).
  - `scripts/compare-combo-answer-quality.mjs:156-189` loads its own combo catalog. It then rebuilds the "prompt that was sent" from `preparePromptInput(request, { comboCatalog })` alone, with no rules topics, rule index, card detail, rulings or search vectors. The prompt it records is not the prompt production sent.
- **What the fix looks like:**
  - Export one `loadPromptResources(repoRoot, config)` and one `embedRequest(request, provider, cardDetailIndex)` from the backend.
  - `createConfiguredApp`, the ask route, `prompt-fidelity.mjs` and `compare-combo-answer-quality.mjs` all call those two.
  - Product behavior does not change.

### B-04 — The rule-search training tools re-type production formulas, and one has already drifted

- **Severity:** Medium (if the vector text drifts, the trained model is scored against different text than what was committed). **Route:** `codehealth`.
- **Evidence:**
  - Rule vector text `${sectionTitle}: ${text}`, cut to 2,000 characters:
    - `scripts/build-rule-embeddings.mjs:37` (exported as `buildEmbeddingText`)
    - retyped at `scripts/export-rule-search-training.mjs:64`
    - retyped at `scripts/score-rule-search.mjs:155`
  - The `pft-split-1` split (which half each question belongs to: tuning or check):
    - `scripts/score-rule-search.mjs:74` uses a git-ignored `split.json` override first.
    - `scripts/export-rule-search-training.mjs:68` does not.
    - The two already disagree once ids are renamed. Today the trainer ignores the `half` label (`train-rule-search-model.py` has no use of it), so nothing is harmed yet.
- **What the fix looks like:** import `buildEmbeddingText` in both tools. Move `half()`, including the `split.json` override, into one `scripts/lib` module.

### B-05 — Three OpenAI key loaders, each with a different rule for which value wins

- **Severity:** Medium (owner tooling: the verify script can check a different key from the one the eval run uses). **Route:** `graph` (choosing one precedence rule is a decision; sharing the parser is mechanical).
- **Evidence:**
  - Backend dev, `apps/backend/src/index.ts:8-36`: the `.secrets/openai-dev.env` file overrides a key exported in the shell (`override: true` at `:15`).
  - `scripts/openai-verify-credentials.mjs:9-50`: has its own `parseEnvFile`, and the secrets file also overrides. It reads from `process.cwd()`, so it finds no key when run from a worktree.
  - `scripts/lib/local-openai-env.mjs:28-80`: a key exported in the shell wins, and it falls back to the main checkout from a worktree.
  - `openai-verify-credentials.mjs:6-7,52-64` re-types the backend's timeout and retry defaults and its integer parser. Its comment points to `apps/backend/src/config.ts`, which no longer exists (it is now `config/index.ts`).
  - A fourth copy of `parseEnvFile` sits in the dead `aws-verify.mjs:11` (see B-11).
- **What the fix looks like:** `openai-verify-credentials.mjs` imports `lib/local-openai-env.mjs`. The owner picks one precedence rule for dev, verify and eval.

### B-06 — Loader boilerplate copied six times

- **Severity:** Low. **Route:** `codehealth`.
- **Evidence:**
  - The same once-only warning helper: `cardRulings.ts:86`, `cardDetail.ts:85`, `cardPrices.ts:108`, `gameRules.ts:34`, `gameRulesRetrieval.ts:34`, `commanderSpellbook/catalog.ts:89`.
  - The same check-exists, decompress, parse sequence: `cardRulings.ts:79`, `cardDetail.ts:78`, `cardPrices.ts:100`, `catalog.ts:326`.
- **What the fix looks like:** one `readCommittedJson(path, { brotli })` helper and one `warnOnce`. Each loader keeps its own shape check. Can be done together with B-02's logging change.

### B-07 — Three loading styles, and each cold start loads everything

- **Severity:** Medium (cold start only; overlaps the data-and-clients probe). **Route:** `graph` (choose eager or lazy).
- **Evidence:**
  - **Loaded at startup:** `createConfiguredApp.ts:27-46` loads seven files from paths built off the repo root, inside the Lambda init promise (`lambda.ts:12-18`).
  - **Loaded on first use, from hidden defaults:**
    - `getDefaultScoringResources()` (`gameRulesRetrieval.ts:359-372`) loads the rule vectors, token stats, glossary and vocabulary on the first ask. It is wired in as a default parameter at `:591, :598, :757, :1341, :1405, :1423, :1449`.
    - `defaultPartTitles()` (`prompt/ruleLayout.ts:49-65`) does the same for the rule book's part titles.
    - The model manifest is read when the module is imported (`providers/localEmbeddingProvider.ts:14`).
  - **Loaded lazily through a promise:** the embedder (`localEmbeddingProvider.ts:44-58`).
  - **Where the data lives is written in five places:** `createConfiguredApp.ts:27-44`, `gameRulesRetrieval.ts:363`, `ruleLayout.ts:54`, `embeddingModel.ts:33`, `localEmbeddingProvider.ts:22`.
  - **Measured locally** (M-series laptop, `tsx`, no network):

    | Step | Time |
    |---|---|
    | Startup loads, total | 274 ms |
    | – rulings | 56 ms |
    | – card detail | 63 ms |
    | – prices | 82 ms |
    | – combos | 66 ms |
    | – rule index | 7 ms |
    | First ask: embedder load | about 277 ms |
    | First ask: scoring resources | 8 ms |
    | Warm request: search vectors | 2–6 ms |
    | Warm request: prompt build | 3–5 ms |

    Heap after loading: about 104 MB.
  - A price lookup on a cold container waits for the rulings, card detail and combo data it never reads.
  - Lambda runs at 1769 MB (`scripts/aws-bootstrap.sh:157`). Lambda numbers were not measured.
- **What the fix looks like:** one of two choices.
  - (a) Load everything, including the scoring resources and one warm-up embed, during init. That moves about 0.3 s from the first answer into cold start.
  - (b) Load each data set lazily, so a price lookup only loads prices.

  Either way, one place says where the data lives.

### B-08 — Small repeated work on each request

- **Severity:** Low (measured as negligible). **Route:** `codehealth`.
- **Evidence:**
  - With a real embedder, `buildPromptContext` and `buildRetrievalQuery` run three times per request. They run twice from `routes/askAi.ts:107,109`, through `prompt/preparation.ts:116-153`, and again in `preparation.ts:389-401`.
  - `scoreIndex` rebuilds a lookup from rule id to vector over all 2,894 rules on every request (`gameRulesRetrieval.ts:1045-1047`).
  - `entryById` is rebuilt twice per request (`:1189`, `:1316`). Other indexes in the same file are already cached with a `WeakMap`.
- **What the fix looks like:** one `buildRetrievalQuery` call that returns both texts, and a `WeakMap` cache for the two lookups.

### B-09 — The card routes don't follow the ask route's error pattern

- **Severity:** Low. **Route:** `graph` (the frontend reads these 404 bodies).
- **Evidence:**
  - Card detail and prices answer `404 {error:"card_not_found"}` (`routes/cardDetail.ts:24-27`, `routes/cardPrices.ts:27-30`). The ask route answers `{code,message,metadata}`.
  - The card routes set no correlation id and log nothing.
  - The shared error handler logs every failure as `ask_ai.response_failure` (`errorHandler.ts:51,58`).
  - The ask route checks for the mock embedder by object identity (`askAi.ts:106`). That is the only place a route knows about a specific provider.
- **What the fix looks like:** one error body and log-event naming for all routes, plus a way for a provider to report "does nothing" instead of an identity check.

### B-10 — Scripts copy small helpers and prompt headings

- **Severity:** Low. **Route:** `codehealth`.
- **Evidence:**
  - The same `brotliCompress` function appears three times: `build-card-rulings.mjs:21`, `build-card-detail-by-oracle-id.mjs:50`, `build-commander-spellbook-combos.mjs:332`.
  - Compressed JSON is read by hand at `lib/gold-cases.mjs:486-487`, `lib/practice-suite-card-names.mjs:23`, `build-card-rulings.mjs:144`, `build-commander-spellbook-combos.mjs:622,668`.
  - Paths:
    - 25 scripts build the repo root from `import.meta.url` themselves.
    - 17 scripts resolve paths from the current folder, for example `build-card-detail-by-oracle-id.mjs:28`. They work only when run from the repo root.
  - Nine scripts hand-roll their own `parseArgs`. Node's built-in `util.parseArgs` would cover them.
  - Prompt section headings are retyped:
    - The combo heading at `compare-combo-answer-quality.mjs:35` and `lib/diagnostic-arms.mjs:79`, although `commanderSpellbook/formatting.ts:4` exports `COMBO_SECTION_HEADING`.
    - The `GENERAL GAME CONTEXT` heading and others in `eval/contextEvaluationHarness.ts:198-339`, against `prompt/promptAssembly.ts:88`.
- **What the fix looks like:** `scripts/lib/brotli-json.mjs` and `scripts/lib/repo-root.mjs`, plus importing the heading constants.

### B-11 — A dead script and stale notes

- **Severity:** Low. **Route:** `codehealth`.
- **Evidence:**
  - `scripts/aws-verify.mjs` prints "[ARCHIVED]" and checks Bedrock credentials (Bedrock was an earlier AI provider) for a provider the backend no longer has. Nothing in `package.json`, workflows, docs or other scripts references it.
  - `secrets-templates/aws-bedrock-dev.env.example` and `PRD/instructions/secrets-handling.md` still mention Bedrock. Whether to delete those is the owner's call.
  - `scripts/leak-check.mjs` has no references at all; it was a one-off tool from #293.
  - Owner-run tools that are referenced from receipts or requirements are not dead and should stay: `latency-q8check`, `score-rule-search`, `compare-screenshot-pair`, `privacy-scan`.
  - Stale comment at `scripts/eval-answer-quality.mjs:524-528`: it says production has a "15 s per attempt" timeout. Production now has one 30 s budget for the whole answer (`config/index.ts:5`, REQ-231).
  - The Lambda environment block is written three times: `aws-bootstrap.sh:158`, `aws-bootstrap.sh:654`, `aws-deploy.sh:108`. The first one has no `FRONTEND_ORIGIN`.
- **What the fix looks like:**
  - Delete `aws-verify.mjs`.
  - Fix the stale comment.
  - Build the Lambda environment string in one shell function.

### Healthy — already shared

- **Configuration in one place.** `config/index.ts:103-133` is the only runtime reader of environment variables. The only other readers are the Lambda key lookup (`runtime/loadOpenAiKeyFromSsm.ts`) and dev-only dotenv. True/false parsing is shared through `resolveBooleanEnv` (`logging.ts:17`).
- **Data loaded once per container.** `lambda.ts:12-18` builds the app once in an init promise. `createConfiguredApp` passes the maps into every route. No route or prompt code reads or decompresses a file per request: every `readFileSync` outside startup sits behind a module cache (`gameRulesRetrieval.ts:71, 99, 136, 182, 227`; `ruleLayout.ts:49`).
- **The combo catalog reads only what it needs.** It decodes one block of 128 variants at a time, keeps the last 64 variants it used, and keeps the last block (`commanderSpellbook/catalog.ts:116, 459-480`). This is a deliberate design.
- **The rule search caches its working data.** `searchTokenCache`, `vocabularyTokenCache`, `embeddingsRuleIndexMatchCache` and `keywordPiecesCache` are all `WeakMap`s (`gameRulesRetrieval.ts:450, 540, 976, 1229`).
- **API clients are created once.** There is one OpenAI client per app (`openAiResponsesProvider.ts:75-81`, `openAiEmbeddingProvider.ts:23`). It has one overall answer deadline, and the SDK's own retries are turned off. The local embedder is a single shared instance for the module.
- **Provider factories match.** `createAskAiProvider` and `createEmbeddingProvider` have the same shape and both default to the mock (`providers/`).
- **One validation and error path for ask-ai.** One Zod schema (`validation/askAiRequest.ts`), one set of error classes (`errors.ts`), one error handler (`app/errorHandler.ts`).
- **Evals use production code rather than reimplementing it.** They import `preparePromptInput`, `askAiRequestSchema` and `createEmbeddingProvider`: `eval-answer-quality.mjs:552, 1087`, `eval-worked-solutions.mjs:247`, `diagnostic-arms-check.mjs:260`, `eval-evidence-trace.mjs:114`. `score-rule-search` uses the shipped `retrieveRulesForQuery`.
- **The model-mismatch refusal is shared.** Every offline tool uses `assertVectorsMatchRuntimeModel` (`embeddingModel.ts:73`).
- **Vector encoding is shared.** `eval/vectorEncoding.ts` serves the frozen query and card vectors and `build-frozen-card-vectors.mjs`. The runtime's int8 decoder (`gameRulesRetrieval.ts:282`) is separate on purpose, because it reads a different format.
- **Paid runs have a spending cap.** `eval-answer-quality.mjs` refuses `--confirm-live-calls` without `--max-cost-usd` (`:1309`, `:1413`).
- **The Lambda key lookup library comes from the runtime.** `@aws-sdk/client-ssm` is a dev dependency (`apps/backend/package.json`). Lambda's `nodejs24.x` runtime supplies it, and `package-lambda.sh:93` installs with `--omit=dev`. That keeps the package small and is deliberate.
- **Typecheck passes.** `npm run typecheck` exits 0 on main as of this probe.

---

## Part B — re-check of the 2026-08-23 duplication audit

Tally: **0 fixed, 4 changed, 7 still stand.**

| F-id | Title | Verdict | Current evidence | Route if still standing |
|---|---|---|---|---|
| F-01 | Overlay Escape-key dismissal reimplemented per component | **CHANGED — mostly fixed.** `SheetShell` (`c44dc772`, ui-reimagining-build slice B, landed in #239, 2026-10-01) now handles Escape, the focus trap, outside-click dismiss and focus return. Five of the seven listed files use it: CardPresentation, ConversationHistoryDrawer, FeedbackModal, PlayerLifeTrackerApp, CounterPanel. | Two files still handle Escape themselves: `AdaptiveContextDialog.tsx:61-65` and `portal/FeaturePortalMenu.tsx:197-207`. FeaturePortalMenu still skips `preventDefault()`, the same divergence the audit recorded. The shared copy is `SheetShell.tsx:123-133`. | `codehealth` (move the last two onto SheetShell or a `useDismissOnEscape` hook) |
| F-02 | Turn-phase list defined three times across FE↔BE | **STILL STANDS** | `backend/validation/askAiRequest.ts:40-49`; `frontend/types.ts:36-44`; `MtgAssistantApp.tsx:132-141` (combat still sits after main_1). No guard test exists. | `codehealth` (guard test) |
| F-03 | Zone display labels duplicated, already diverged | **STILL STANDS** | `frontend/lib/zoneLabels.ts:3-11` says "Command Zone". `backend/prompt/promptFormatting.ts:72-79` (`ZONE_ITEM_LABEL`) says "Command". | `codehealth` for the guard test. `graph` to settle the wording, because changing the label changes prompt text and golden fixtures. |
| F-04 | Combat-step list defined three times | **STILL STANDS** | `askAiRequest.ts:51-57`; `types.ts:46-51`; `MtgAssistantApp.tsx:143-149`. No drift. | `codehealth` (same guard test as F-02) |
| F-05 | Player-label list defined on both sides | **STILL STANDS — wider than recorded.** | `backend/constants.ts:3-12`; `frontend/types.ts:1-9`. There is also a third runtime list the audit missed, `frontend/lib/lifeTracker/state.ts:23-32` (`ALL_PLAYER_LABELS`, from `b60ecd69`, 2026-08-03), and a generated copy in `MtgAssistantApp.tsx:58-61`. | `codehealth` (guard test; the life tracker could import one list) |
| F-06 | Canonical zone order on both sides | **STILL STANDS** | `backend/constants.ts:14-22`; `frontend/lib/contextFlow/phaseZoneDefaults.ts:7-15`. They are identical. | `codehealth` (guard test) |
| F-07 | Live-call confirmation gate reimplemented in scripts | **CHANGED — more copies.** There are three copies of `CONFIRM_FLAG` now. | `refresh-commander-spellbook-data.mjs:39,46,285`; `compare-combo-answer-quality.mjs:31,44,78`; and a new copy in `eval-answer-quality.mjs:128,228,1460` (`6d1e4622`, 2026-09-06). Only the newest copy also requires `--max-cost-usd`, so the combo comparison spends with no cap. | `codehealth` (`scripts/lib/live-call-gate.mjs`) |
| F-08 | Safe-localStorage access reimplemented per module | **CHANGED — wider.** Five modules now. | `lifeTracker/persistence.ts:107-113` and `conversationHistory/persistence.ts:32-38` have identical `getStorage`. Inline try/catch blocks: `scan/audioPrefs.ts:5-19`, `theme/themePrefs.ts:6-68` (five functions; the audit counted four), and `portal/activeDestinationPrefs.ts:5-25` (sessionStorage, from `30309a28`, 2026-08-02; the audit missed it). | `codehealth` (`lib/storage.ts`) |
| F-09 | Card pixel dimensions defined twice in `lib/scan` | **STILL STANDS** | `lib/scan/detector.ts:3-4` and `lib/scan/identify.ts:21-22` both set 745×1040. `scripts/build-card-hashes.mjs:9` imports the `identify.ts` copy. | `codehealth` |
| F-10 | Duplicated error-and-retry panel markup | **CHANGED — three copies, now diverged.** | `ConversationWorkspace.tsx:78-90`; `EnrichmentStep.tsx:931-938` (now `plate` and `idq-error` classes, unlike the others); `quick-lookup/QuickLookupApp.tsx:720-727` (the copy the audit missed, from `e8f1e270`, 2026-08-01). The retry-label text is also built twice: `EnrichmentStep.tsx:625` and `QuickLookupApp.tsx:436`. | `codehealth` (an `ErrorRetryPanel` component). Settling which classes it uses is a small visual decision. |
| F-11 | Coverage threshold and reporter values in both vitest configs | **STILL STANDS** (optional, as the audit said) | `apps/frontend/vite.config.ts:107-115`; `apps/backend/vitest.config.ts:5-20`. Both still set lines 45. | `codehealth` (lowest priority) |

Method: each verdict comes from reading the current file at the cited lines. Commits were found with `git log -S`, `--diff-filter=A`, and a first-parent merge search for the PR number.
