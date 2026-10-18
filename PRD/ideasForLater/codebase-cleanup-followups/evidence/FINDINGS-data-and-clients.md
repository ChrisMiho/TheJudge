# Findings — loaded data, API clients, runtime efficiency (frontend)

Probe: codebase-health-pass, subagent 1 of 3. Read-only. Date 2026-10-17.

## Summary — what a player would notice

Switching tools is already cheap. The card list downloads once per page and every tool shares it. Tools you have visited stay loaded in the background, so going In-Depth → Trade Balancer → back downloads, parses and rebuilds nothing. The #314 background download is the only path that loads tool code and the card list. It is not one of several.

The real costs are in the scanner, and players mostly feel them on phones:

1. **If the scanner's first download fails, scanning stays broken in every tool until the page is reloaded.** That download is about 18 MB compressed, and a weak game-store connection is exactly where it fails. The player sees raw technical text such as `Could not load card hash DB: 503 …`. This is the one real bug (D-01).
2. The first scan downloads more than it needs. The scan map is about 3× bigger than necessary (D-06). Each tool also builds its own 9 MB copy of the scan fingerprints (D-03), and every scanned frame sorts all 97,311 fingerprints just to keep the best 10 (D-04).
3. Card-name search wastes effort on long names: about 21 ms per search on a desktop, so roughly 100 ms on a phone. That can be cut by 4× without changing any result (D-05).

The rest is duplicated code likely to drift: the card-list loading code is copied three times, the two per-card caches are copies of each other, and the Ask-AI request code appears twice. There is no shared API client and no request timeout.

Measurement note: timings are Node on the dev Mac, not a phone. A mid-range phone is typically 3–6× slower. Raw numbers are in each finding.

## Answers to the four questions, in one line each

1. **Big data files.** The card list has one loader and one parse per page, shared by all screens. The scan files have one module-level download each, but a failure is kept for the whole session (D-01), and the scan fingerprints are re-copied per tool (D-03). Prices and card details are fetched per card from the backend and cached for the session. No rules or combo data reaches the client.
2. **API clients.** There is no shared client. Six call sites hand-roll their own fetch (table in D-09). Two of them are a copied cache module (D-07), and two are a copied Ask-AI block (D-08). None has a timeout.
3. **Loading-state shapes.** There are five different shapes (D-02, D-09). Some of the difference is on purpose: NFR-014 says each screen keeps its own failure message. The duplicated code underneath is not on purpose.
4. **Efficiency.** The bundle is well split. Wasted work sits in the scan frame loop (D-04), the fingerprint copy (D-03), the search's typo check (D-05) and a few render-time recomputes (D-10, D-11, D-12).

---

## Findings

### D-01 — Scanner stays broken for the session after one failed download
- **Severity:** High (real bug; the player sees it)
- **Route:** `codehealth` (a bug fix. No product text changes, because NFR-014 already says failed loads retry and the card-list loader already does.)
- **Evidence**
  - `apps/frontend/src/lib/scan/loadScanMap.ts:8-15` and `apps/frontend/src/lib/scan/loadHashDb.ts:9-18` store the fetch promise in a module-level variable and never clear it. A rejected promise is handed to every later caller for the rest of the page session.
  - `apps/frontend/src/hooks/useScanCapture.ts:239-259`: `ensureResources` also caches its own `resourcesPromiseRef` per hook instance, and also never clears it on failure. `openScan` (`:274-288`) then shows `caught.message` as the error.
  - Compare the loaders that do this right: `apps/frontend/src/lib/cardMetadataStore.ts:26-29` ("A failed download clears the shared load so the next caller fetches fresh") and `apps/frontend/src/components/portal/destinationRegistry.tsx:26-28`.
  - The raw message reaches the player in three places: `QuickLookupApp.tsx:581`, `TradeSide.tsx:286-288` and `ZoneCardPicker.tsx:300-302`.
  - No test pins the sticky failure (`lib/scan/persistence/loadScanMap.test.ts` and `loadHashDb.test.ts` only cover the happy path and one 404).
  - Size at risk: `cardhashes.bin` is 13.0 MB raw / 11.3 MB gzip, and `cardScanMap.json` is 21.6 MB raw / 6.5 MB gzip.
- **Fix:** clear the cached promise on rejection in both loaders, and reset `resourcesPromiseRef` on rejection in `ensureResources`. Add one test per loader: fail, then succeed on the next call.
- **Not in this fix:** replacing the technical error text with player copy is a wording decision. Fold it into the D-02 graph item.

### D-02 — Card-list loading code is copied into three screens, each failing differently
- **Severity:** Medium
- **Route:** `codehealth` for the shared hook. `graph` for the two behaviour gaps below.
- **Evidence:** the same `readCardMetadata()` seed plus a `loadCardMetadata()` effect with an `isMounted` guard appears three times:
  - In-Depth: `components/portal/MtgAssistantApp.tsx:165-166, 289-307`. On failure it only calls `console.error`. The player sees no message, just an empty search.
  - Quick Question: `components/portal/quick-lookup/QuickLookupApp.tsx:95-97, 255-273`. On failure it shows player copy: "Card search is unavailable…".
  - Trade Balancer: `components/trade/TradeBalancer.tsx:117-119, 141-162`. On failure it shows player copy plus the raw reason, e.g. "(Card list fetch failed with status 503)".
  - None of them retries. Visited tools stay mounted (`DestinationOutlet.tsx:41-62`), and the effect is mount-only, so a failed load in a tool is never retried until reload. This holds even after another tool later loads the list successfully.
- **Fix (codehealth):** add one `useCardMetadata()` hook next to `cardMetadataStore.ts` that returns `{ cards, isLoading, failed }` per screen. Each screen keeps its own failure copy, which NFR-014 requires. Behaviour stays identical.
- **Graph add-on (product behaviour):** (a) give In-Depth a failure message; (b) retry when a tool becomes active again; (c) drop the raw reason from Trade's copy and the raw scan error from D-01. Three small decisions, one kickoff.

### D-03 — Each tool builds its own 9 MB copy of the scan fingerprints; In-Depth rebuilds it on every Cards-station visit
- **Severity:** Medium
- **Route:** `codehealth`
- **Evidence**
  - `apps/frontend/src/lib/scan/identify.ts:213-226`: the `CardIdentifier` constructor copies every fingerprint one at a time with `Uint8Array.from(slice)`, making 97,311 small allocations, then copies them all again into one buffer. The decoded `HashDb` already holds them in one contiguous buffer (`lib/scan/dbformat.ts`, `readDb`).
  - `apps/frontend/src/hooks/useScanCapture.ts:149-151, 244-251` builds one identifier per hook instance. There are three instances: `QuickLookupApp.tsx:357`, `ZoneCollectionStep.tsx:143` and `components/trade/useTradeScan.ts:90`.
  - `ZoneCollectionStep` mounts only while the Cards station shows (`MtgAssistantApp.tsx:1090-1096`), so each visit builds a fresh identifier on the next scan.
  - Measured: 25 ms per build on desktop Node, 9,341,856 bytes per copy. With all three scanners used, about 28 MB of duplicate fingerprints stay in memory, on top of the shared 9.3 MB `HashDb`.
- **Fix:** add a module-level `loadScanResources()` that builds the identifier once from the shared `HashDb` and hands the same instance to every scanner. Fill the identifier in one pass into a preallocated buffer (skip the card back, no per-card copy). Results stay identical.

### D-04 — Every scanned frame sorts all 97,311 fingerprints to keep the best 10, and rebuilds a 34,639-card lookup
- **Severity:** Medium (main-thread work at 3 frames per second while the camera is open)
- **Route:** `codehealth`
- **Evidence**
  - `apps/frontend/src/lib/scan/identify.ts:251` builds a 97,311-entry index array and fully sorts it, then `slice(0, topN)` keeps 10. Measured on the real `cardhashes.bin`:

    | Step | Time |
    |---|---|
    | Distance loop | 8.6–11.2 ms |
    | Full sort | 15.5–16.4 ms |
    | Top-10 selection instead of the sort | 0.10–0.73 ms |

    The top-10 selection gave the same 10 results in every run checked. The sort is about 60% of each frame's matching cost.
  - `apps/frontend/src/lib/scan/resolveScanCandidates.ts:40` builds `new Map(cardMetadata.map(...))` over all 34,639 cards on every identified frame (about 1.9 ms on desktop). It is called from `useScanCapture.ts:414`.
- **Fix:** replace the sort with a bounded top-N insertion that keeps the lower-index-first tie order, matching the stable sort. Cache the card-id → card map per card-list array (a `WeakMap` keyed on the array). Output stays identical. The `reference/identify.py` parity tests should still pass unchanged.

### D-05 — Card search's typo check allocates a full matrix for every name it compares
- **Severity:** Medium (on phones; REQ-002 says "suggestions should feel immediate")
- **Route:** `codehealth`
- **Evidence:** `apps/frontend/src/lib/search.ts:26-49` builds an array-of-arrays matrix for every call. It runs for every prefix, substring and near-length name (`:89-117`). `components/trade/oracleSearch.ts:58` reuses the same function. Measured over the real 34,639-card list on desktop:

  | Query | Calls | Today | Two-row typed-array version |
  |---|---|---|---|
  | `lightning bolt` | 14,346 | 21.5 ms | 5.6 ms |
  | `l` (Quick Question's 1-char threshold) | 19,080 | 7.5 ms | 3.2 ms |
  | `urborg tomb of yawgmoth` | 4,058 | 12.4 ms | 3.8 ms |

  Each search runs once per keystroke, after a 60 ms debounce.
- **Fix:** rewrite `levenshteinDistance` as a two-row version on reused `Int32Array` buffers, comparing `charCodeAt`. That is the same algorithm over the same code units, so every ranking stays identical, and the existing REQ-002 tests cover it.

### D-06 — The scan map download is about 3× bigger than it needs to be
- **Severity:** Medium (player-visible on the first scan, on mobile data)
- **Route:** `graph` (changes a committed data contract: `PRD/sections/scan/data/cardScanMap.md`, plus the REQ-066 constraint cited at `resolveScanCandidates.ts:55-58` and the build script)
- **Evidence**
  - `apps/frontend/public/data/cardScanMap.json` is 21.6 MB raw, 6.5 MB gzip, 3.7 MB brotli, with 95,895 entries of `{oracleId, name, imageUrl}`.
  - `name` is never read at runtime. Only `oracleId` (`resolveScanCandidates.ts:47-51`, `useTradeScan.ts:50`) and `imageUrl` (`:59`) are read.
  - All 95,895 `imageUrl`s equal `deriveCardImageUrl(printingId)` (`lib/cardImage.ts`) plus a `?timestamp` cache-buster.
  - Measured slimmer shapes:

    | Shape | Raw | Gzip |
    |---|---|---|
    | Today | 21.6 MB | 6.5 MB |
    | Without `name` | 19.1 MB | 5.2 MB |
    | `printingId → oracleId` only | 7.5 MB | 4.0 MB |

    Parse time drops roughly in step: 73 ms today on desktop.
  - Related: in `cardhashes.bin` the 36-character text ids take about 28% of every record, and they barely compress (13.0 MB → 11.3 MB gzip).
- **Decision to make:** whether scan images may drop Scryfall's `?timestamp` cache-buster, which is what keeping only `oracleId` requires. Binary ids in the hash file would be a second, larger step.

### D-07 — The card-detail and card-price caches are copies of each other; the "peek, then fetch" effect is hand-written four times
- **Severity:** Medium (duplicated logic that will drift)
- **Route:** `codehealth`
- **Evidence**
  - `apps/frontend/src/lib/cardDetail.ts:14-75` and `apps/frontend/src/lib/trade/fetchCardPrintings.ts:28-93` are the same module with different URLs: the same `CacheEntry` union, `peek*`, in-flight dedupe, delete-on-failure, and test reset.
  - The consuming effect (peek the cache, else fetch with a `cancelled` guard) is written out in four places:
    - `hooks/useCardDetailBlock.ts:15-37`, the one existing hook
    - `components/CardPresentation.tsx:188-233`, twice: detail and price
    - `components/EnrichmentStep.tsx:171-202`
- **Fix:** one `createSessionCache(fetcher)` in `lib/` used by both modules, plus one `useSessionCached(cache, id)` hook. Behaviour stays identical.

### D-08 — The Ask-AI hook carries two copies of its request path
- **Severity:** Medium
- **Route:** `codehealth`
- **Evidence**
  - `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts:118-200` (`doDecryptRequest`) and `:202-272` (`doFollowUpRequest`) repeat the same ~45 lines: the fetch and headers, the error-body parse, `logFrontendDebug`, `startRetryCooldown` and `setPendingRetry`. Only the success branch differs.
  - `RETRY_COOLDOWN_SECONDS = 13` is defined twice: `MtgAssistantApp.tsx:52` and `QuickLookupApp.tsx:46`.
- **Fix:** one inner `postAskAi(payload, correlationId)` that returns `{ok, body} | {failed, message, retryAfter}`, called by both. Move the 13 s default into the hook.

### D-09 — No shared API client, and no request ever times out
- **Severity:** Low
- **Route:** `codehealth` for a thin wrapper (fold it into D-07 and D-08 rather than a PR of its own). `graph` for timeouts, which change behaviour.
- **Evidence:** every backend call hand-rolls the URL join, status check and JSON parse. `AbortController` appears nowhere in `src/`.

  | Call | Site | Error / retry handling |
  |---|---|---|
  | `POST /api/ask-ai` (first question) | `hooks/useAskAiSubmitOrchestration.ts:129` | JSON error body → message + cooldown + retry; correlation id |
  | `POST /api/ask-ai` (follow-up) | `hooks/useAskAiSubmitOrchestration.ts:211` | same, copied (D-08) |
  | `GET /api/cards/:id` | `lib/cardDetail.ts:24` | 404 → null; else throw; session cache |
  | `GET /api/cards/:id/prices` | `lib/trade/fetchCardPrintings.ts:38` | same, copied (D-07) |
  | `GET /api/health` (warm-up) | `components/trade/TradeBalancer.tsx:170` | fire-and-forget |
  | `POST formspree.io/f/:id` (feedback, external) | `lib/feedback/submitFeedback.ts:56` | never throws; status enum |
  | Static `/data/cardMetadata.json` | `lib/cardMetadataStore.ts:16` | throw; clears for retry |
  | Static `/data/cardScanMap.json`, `/data/cardhashes.bin` | `lib/scan/loadScanMap.ts:9`, `loadHashDb.ts:10` | throw; failure sticks (D-01) |

  Five loading/error shapes exist: card list (`isLoading` + an error string per screen), scanner (`isLoading` + raw `error`), card detail (`loading/loaded/error` + a retry button), prices (per-entry `loading/loaded/error` + retry) and Ask-AI (`error` + `retryCountdown` + `canRetry`). Several differ on purpose, because each screen owns its copy. The table is here so a future wrapper does not flatten them.

  Ask-AI is bounded on the server (30 s answer budget, 40 s Lambda). The price and detail spinners are not bounded on the client.
- **Fix:** keep it small: an `apiGetJson(path)` in `lib/api.ts` with the base URL and status handling. Do not build a client framework for six calls.

### D-10 — Trade Balancer search runs on every render, not just on typing
- **Severity:** Low
- **Route:** `codehealth`
- **Evidence:** `apps/frontend/src/components/trade/TradeSide.tsx:98` calls `searchOracleIndex(searchIndex, query)` directly in render, with no memo. There are two side instances. While a side's box holds a query of 3 or more characters, every re-render scans all 34,639 entries again: each price arriving, each quantity tap, each scan update. The other two searches memoise and debounce (`hooks/useAutocompleteSuggestions.ts:22-32`).
- **Fix:** `useMemo(() => searchOracleIndex(searchIndex, query), [searchIndex, query])`. Leave out a debounce, because that changes the feel.

### D-11 — In-Depth rebuilds its card-search index on every Cards-station visit
- **Severity:** Low
- **Route:** `codehealth` (lift the index into the screen). `graph` only if you want one index shared across screens.
- **Evidence:** `components/ZoneCollectionStep.tsx:104-107` builds the index through `useAutocompleteSuggestions`, and the step remounts per visit (`MtgAssistantApp.tsx:1090`). `buildSearchIndex` normalises 34,639 names: 16.7 ms on desktop.
- **Fix:** build the index once in `MtgAssistantApp` and pass it down. NFR-014 says "each of the three screens keeps its own … search index", so sharing one index between Quick Question and In-Depth would need that sentence amended.

### D-12 — The shared menu re-reads both drafts from storage on every render
- **Severity:** Low
- **Route:** `codehealth`
- **Evidence:** `components/portal/FeaturePortalMenu.tsx:118-119` calls `loadDraft("lookup")` and `loadDraft("game")` (a `localStorage` read, `JSON.parse` and validation, `lib/conversationHistory/persistence.ts:219-240`) in the render body of the always-mounted shell menu. The history list next to it is read only when the sheet opens (`:94-97`).
- **Fix:** read the drafts in `openHistory` alongside `loadHistoryEntries()`.

### D-13 — Test-only exports in production modules
- **Severity:** Low
- **Route:** `codehealth`
- **Evidence:** `getSuggestions` and `isFuzzyMatch` (`lib/search.ts:51-56, 152-158`) and `resolveScanCandidates` (`lib/scan/resolveScanCandidates.ts:70-76`) are imported only by tests. Production uses `getSuggestionsFromIndex` and `resolveScanCandidatesRanked`.
- **Fix:** point the tests at the production functions and delete the wrappers, or mark them test helpers.

### D-14 — Two malformed `@keyframes` blocks cause the two CSS build warnings
- **Severity:** Low (the animations still run; browsers recover)
- **Route:** `codehealth` (overlaps the UI probe; take whichever lands first)
- **Evidence:** `npm run build -w apps/frontend` warns twice: "Expected percentage but found ';'". The sources are `src/index.css:1082-1087` (`node-pulse`) and `:3507-3511` (`foil`), each with a stray `};`. The minifier passes both blocks through unminified.
- **Fix:** delete the two stray semicolons.

### D-15 — Only the Trade Balancer wakes a cold backend
- **Severity:** Low (observation; product call)
- **Route:** `graph`
- **Evidence:** the fire-and-forget `GET /api/health` lives only in `TradeBalancer.tsx:169-171` (REQ-064). Quick Question is the landing page and the most common first action, and it sends nothing until the player asks. The "keep-warm schedule" item is already open from the Trade Balancer first-card work.
- **Decision to make:** whether the question tools should warm the backend too, or whether a scheduled keep-warm covers it. Do not copy the ping into more screens without deciding.

---

## Healthy — already shared, don't "fix"

- **One card list per page.** `lib/cardMetadataStore.ts:8-34` downloads and parses `cardMetadata.json` once (4.88 MB raw / 1.96 MB gzip / 1.62 MB brotli; 34,639 cards; 14 ms parse on desktop). The background download (`destinationRegistry.tsx:107`) and all three screens join the same promise. `readCardMetadata()` lets a screen opened later render with no loading flash. A failed load clears so the next caller retries.
- **#314's tiered download is the single path.** `lazyDestination` (`destinationRegistry.tsx:15-49`) shares one import promise between the idle preload and `React.lazy`. A destination downloaded in the background never suspends. Scan data stays out of the background download on purpose (NFR-014).
- **Tool switching is free.** `DestinationOutlet.tsx:41-62` keeps visited tools mounted and hidden. In-Depth → Trade Balancer → back refetches, reparses and rebuilds nothing; search indexes, scan identifiers and in-progress state survive.
- **Scan files download once per page across all three scanners** when the download succeeds (module-level promises; only the failure path is wrong, D-01).
- **Per-card detail and price lookups are cached for the session**, with in-flight dedupe, and shared by the detail popup, the enrichment step, the sheet header and both trade sides. Only the code is duplicated (D-07), not the requests.
- **One API base URL:** `lib/env.ts:62`.
- **The bundle is well split.** Initial load:

  | Chunk | Raw | Gzip |
  |---|---|---|
  | Entry | 79.9 kB | 27.6 kB |
  | Vendor | 177 kB | 58 kB |
  | CSS | 212 kB | 35.7 kB |

  Each tool is its own chunk:

  | Tool chunk | Raw |
  |---|---|
  | Quick Question | 11.9 kB |
  | Trade Balancer | 22.9 kB |
  | Life Tracker | 26.1 kB |
  | In-Depth | 60.3 kB |

  The Markdown renderer (`ConversationWorkspace`, 182 kB / 56 kB gzip) loads only with the two question tools. The scan chunk (42.7 kB) is shared by the three scanning tools. Nothing heavy sits in the initial bundle.
- **One card-name rule.** Both search engines use the one shared `normalize()` (REQ-002). The two rankers are separate on purpose: REQ-002 says "each search keeps its ranking", with 3 results vs 8 and different tie-breaks. Do not merge them.
- **Feedback app-state is built only when the feedback sheet opens** (`useFeedbackContextReader`), never on each render.
- **No rules, combo or price corpora reach the client.** Prices are fetched per card from the backend.
