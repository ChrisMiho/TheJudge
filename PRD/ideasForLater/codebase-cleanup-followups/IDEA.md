# Codebase cleanup follow-ups

Written 2026-10-18 at the end of the `codebase-cleanup-pass` build (code PR #322, branch `thejudge-auto/codebase-cleanup-pass-work`). Self-contained: a fresh agent needs nothing else to start the next pass. Status: unregistered idea, no `STATUS.*` marker.

## What this is

- **Ask:** Nothing (FYI). Read before planning the follow-up pass to the cleanup.
- **In plain terms:** The cleanup pass changed no screen, answer or message a player sees, except faster In-Depth combo matching. Along the way it found a bug that players do see: in Trade Balancer, a scanned card does not default to the printing you scanned, so its price can come from a different printing than the one in your hand. The owner chose to fix that, and every other identified fix that was not in the pass, in a later pass. This folder is the record of all of them.
- **What it means for you:** Nothing here is built. Each section says what the item is, where it lives, why it was not built, and what has to happen first.

Terms used below. A **slice** is one lettered chunk of the cleanup (A to K). A **pending brief** is one of four planned runs whose files the cleanup stayed out of: **card-search** (Quick Lookup and Trade search boxes, the card pickers, the card list), **card-rings** (card tiles and printing picker styling), **pop-ups** (sheets, the feature menu, the adaptive dialog, the history drawer), and **backend-health** (rule-search loaders, request validation, app wiring). Their goals are written in `evidence/GRAPH-BRIEF-card-search.md`, `GRAPH-BRIEF-card-rings.md`, `GRAPH-BRIEF-popups.md` and `GRAPH-BRIEF-backend-health.md`. Ids like Q-11, C-03, K-05, T-12 are finding ids from the 2026-10-18 probes: Q is frontend code, C is styling, K is backend, T is scripts, tooling and tests. Each id's full write-up is in `evidence/` (see section f).

## a. Player-visible bugs

### 1. Trade scanned-printing bug (fix this first)

**What a player sees.** In Trade Balancer, scan a card. It is added to the side. But Trade does not default to the printing you scanned, so its price can come from another printing. The player can fix it by picking the printing by hand.

**What should happen.** The Trade Balancer spec says the scanned printing (its `Candidate.card_id`, DEC-070) becomes each committed entry's default printing once its price fetch resolves (`PRD/sections/trade-balancer/README.md:77`). The code does not do this.

**Cause (re-read on 2026-10-18 before writing).**

- `apps/frontend/src/hooks/useScanCapture.ts`: the identify step ranks candidates and builds `votingCandidates` as card-level (oracle) ids: `{ card_id: entry.card.cardId, distance }` (about `:410`). When a card is held, that same `votingCandidates` array is stored on the held entry as `candidates` (about `:482`).
- `apps/frontend/src/components/trade/useTradeScan.ts`: `onScanCandidateSelected` receives those held candidates and calls `addScannedEntry`, which calls `scannedPrintingIdForOracle(candidates, scanMapRef.current, oracleId)` (`:39-51` and `:82-83`). That function looks each candidate id up in the scan map and keeps the first whose `oracleId` matches. The scan map is keyed by printing id, so an oracle id finds nothing, the function returns null, and no printing is passed on.
- Introduced by commit `be04fb1b` (ui-reimagining build, slice H), which moved candidates into the scanner's holding list.

**Why the existing test misses it.** `TradeBalancer.scan.test.tsx` replaces `useScanCapture` with its own fake hook. The fake hands `useTradeScan` printing ids directly, which is not what the real hook stores, so the lookup succeeds in the test and fails in the app.

**Suggested fix.** Store `result.candidates` (the identify step's printing-id candidates, distances preserved) on the held entry instead of `votingCandidates`. Keep `votingCandidates` for the vote only.

**Proof needed.** A test that drives the real `useScanCapture` through a lock and a commit, with a scan map where one oracle id has two printings, and asserts the committed entry carries the scanned printing id. Also fix the fake hook in `TradeBalancer.scan.test.tsx` to pass what the real hook passes. That test file is owned by the card-search brief, so either land this fix before card-search starts, or fold it into card-search. Run the Trade scan tests, the three hosts' scan tests and the scan hook tests.

**Size and route.** Small. Its own bug PR (one-line fix plus tests). It changes what a player sees (the price follows the scanned printing), so it is not part of any cleanup. Q-11 (section b) waits for it.

### 2. In-Depth scanner refuses a duplicate Stack card with no message

When a player scans a second copy of a card that is already on the In-Depth Stack, the scanner refuses the add, and nothing tells the player why. The refusal text is stored in `blockedNotice` inside `useScanCapture` and no screen renders it. The scan spec says a blocked re-scan surfaces its message (`PRD/sections/scan/README.md:140-143`). Found by reading code only; confirm in the browser first. The cleanup kept `blockedNotice` in the hook's return so the fix has something to show. Needs its own kickoff (a product call on where the message appears). Hosts: `QuickLookupApp` and `ZoneCardPicker` (card-search owns both).

### 3. Feedback carries the hidden In-Depth flow

Feedback sent from any tool carries the hidden In-Depth flow once In-Depth was visited, because the last registration wins. Source: the `last registration` item in `evidence/FINDINGS-frontend-code-quality.md`. Not built because it changes what the feedback payload says. Needs an owner call on the intended flow value per tool.

### 4. Resuming a history entry or draft on Life Tracker queues a roster seed

Resuming an In-Depth history entry or draft while on Life Tracker queues a roster seed from the tracker (the branch in `App.tsx` around `:57-59`; its comment was corrected to say it is reachable). Decide whether that seed is wanted. Not built: either answer changes what the player sees.

### 5. Retry is silent when there is no game context

In `MtgAssistantApp.tsx` (about `:715-761`), Decrypt flashes "Confirm game context before decrypting." while Retry returns silently with no game context. The cleanup kept both behaviors exactly. Unifying them is a visible change. Needs an owner call on the message. Code is in the submit handlers; card-search owns the card-list effect in the same file, so mind the collision.

### 6. Empty-named Stack cards are not filtered

Zone cards with empty names are filtered out of the prompt; Stack cards are not. Filtering them the same way changes what the AI receives, so it needs an approved change (technical design rules). Backend `prompt/context.ts` (slice F merged the two normalizers into one shared helper but kept each kind's own name handling).

### 7. Appearance changes found while cleaning styles

Each changes pixels or tap targets, so each needs the REQ-202 Life Tracker screenshot pair where the Life Tracker is touched, and an owner look:

- Moving `body` to the shell layer's own values changes the ground colour, `100vh` to `100dvh`, and drops Roboto from the font stack (`index.css` vs `styles/shell.css`). Owned by card-rings (its de-duplication owns `body`, `html`, `*`; finding C-07).
- 480 px vs 479 px for the short-phone rule and the label fold.
- Two monospace font stacks.
- Mockup tap sizes (40 px) vs REQ-205's 44 px in `index.css`.
- Splitting the grouped `.act-zones` / `.place-zones` button rule.

Source: `evidence/FINDINGS-styling-organization.md`.

## b. Deferred from this pass: Q-11

**What it is.** Trade's scanner reloads the scan map into its own ref (`scanMapRef` in `useTradeScan.ts`) only to resolve the scanned printing, and the scan hook (`useScanCapture.ts`) caches a second promise of the scan resources over the module cache. The finding: have `useScanCapture` resolve the scanned printing into the held entry, then drop `useTradeScan`'s side channel and the per-hook promise. The module loaders' retry-after-failure rule (REQ-249) must not change. Full write-up: `evidence/FINDINGS-frontend-code-quality.md` Q-11.

**Why it was deferred (owner decision 2026-10-18).**

1. Its proof needs `TradeBalancer.scan.test.tsx` rewritten: its hook double, its `loadScanMap` mock, and a wait in its `openScan` helper. The card-search brief owns that test, and the cleanup stays out of card-search files.
2. The per-hook promise cannot go on its own. With injected loaders (every `useScanCapture` test) it makes the scan data load once per open and keeps REQ-249's retry-after-failure.
3. It touches the same code as the Trade scanned-printing bug (section a, item 1). A faithful move would copy the bug, and a correct move would change what players see.

**What it needs.** Fix the Trade scanned-printing bug first. Then do Q-11 after the card-search brief ships (or inside it), with the Trade scan test double rewritten to use the real resolution path. Criterion `I2` in slice I was the proof gate; it was removed on 2026-10-18.

## c. Every other follow-up

Each item was recorded and never built. "Decision" says what the owner or the next pass must settle first.

**Rule search and prompt (backend)**

- **Carry the unboosted blend instead of `score - boost`.** In `gameRulesRetrieval.ts` the supplemental pass subtracts the boost it just added. Carrying the raw blend is cleaner but can flip the relevance cutoff by one unit in the last place, which can change which rules the AI sees. Not built (slice G kept the order snapshot identical). Decision: accept a possible one-rule difference, then re-record the order snapshot and run the paid answer-quality check.
- **Store rule vectors as `Float32Array`.** Saves about 9 MB of heap but rounds differently, so scores can differ. Decision: whether a rounding change in retrieval is acceptable; re-snapshot after.
- **Batch the query and per-card embeddings into one call.** Saves server time per request; changes the embedding call pattern (and possibly vectors, depending on the provider). Needs a backend-health look since it touches `embeddingModel.ts` and the local embedding provider.
- **Remove the "effectively unlimited" caps and their truncation branches** (`promptFormatting.ts`, constant `EFFECTIVELY_UNLIMITED_CHARS`). The prompt budget is owned by DEC-042, so the removal needs an approved change.
- **Fix the eval harness's fallback question** (`eval/contextEvaluationHarness.ts:12`, `FALLBACK_QUESTION = "Resolve the stack"` vs production's board-only fallback). Changes eval results for empty-question fixtures; none exist today. Part of K-16 (section d).
- **Raise the 1,200 ms latency-warning threshold.** Operator log noise only; decision: pick the number.
- **Combo prefilter log.** After slice E, a corrupt combo that can never be complete is no longer fetched, so it no longer logs its integrity warning. Slice E's test decodes every committed combo and asserts none is corrupt, so this cannot happen with committed data. Add a runtime sweep only if wanted.
- **Speed up combo matching when the question has combo wording.** Slice E only helps questions without combo wording. Needs its own measurement first.

**Tooling and scripts**

- **React Compiler lint hits (26 + 19 + 2) and the larger TypeScript flags** (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`). Each reports real hits today, so each needs product-code edits across many files. Slice C turned on only checks with zero hits. Counts and files: `evidence/FINDINGS-scripts-tooling-tests.md` T-07, T-08 and `FINDINGS-frontend-code-quality.md`.
- **One Node version across CI (22), Lambda (24) and local (26).** Slice D left the versions alone. Decision: pick the target version; touches `quality-check.yml`, Lambda runtime and the deploy bootstrap.
- **Reconcile the three practice-suite default folders** (repo-relative vs main-checkout; T-12). Slice D unified only the two scripts that already used the main-checkout path. Changing `SUITE_DIR` and `export-rule-search-training.mjs` changes where files are read from. Decision: which single default.
- **Remove the `data:scan-hashes` alias.** The scan data spec records it as kept, so removal needs a spec edit.
- **Move `detectorFixtures.ts` out of `src/lib/scan`** (Node-only, tests only). Moving it shifts the coverage numerator, so the coverage gate needs a look. Part of Q-16.
- **Typecheck `scripts/*.mjs` with `checkJs`.** Many existing errors expected. Needs a measured error count first.
- **Format all TypeScript with Prettier (Q-18).** A 400 to 575 file diff. The owner chose to do it as its own PR after the cleanup lands. Slice C already removed the contradicting `"semi": false` from `.prettierrc.json`. Run it only when no other PR is open, then add it to `format:check`.

**Life Tracker**

- **C-09 fuller version.** Slice K removed the eight dead Tailwind classes on the Game setup header. The fuller change: give `GameSetupModal` `panelClassName="lt-sheet"` and point the roughly 57-line test-id block in `index.css` at that class, deleting its copy of the `.lt-head` rules. Not built because it needs the REQ-202 before/after screenshot pair at 390x844 and 1440x900 and collides with the pop-ups brief's `SheetShell` edits. Build it after pop-ups ships.

**Housekeeping**

- **Pause `codehealth` items 3, 5, 6, 7, 8 and 9** until the cleanup merges (see section e).

## d. Findings waiting on other work

Format: id, what, where, what it waits for. Counts at the end of the pass: 48 of 68 findings built (36 whole, 12 in part); the rest are below.

**Later (wait for a pending brief or a later package)**

- **Q-01** The Question History "trigger" is threaded through eight files and nothing reads it. `ConversationWorkspace.tsx`, `StagedStepHeader.tsx`, `portal/PortalSlot.tsx`, `lib/portal/slotContext.tsx`, `ZoneConfirmStep.tsx`, `ZoneCollectionStep.tsx`, `EnrichmentStep.tsx`, `FeaturePortalMenu.tsx`. Waits for pop-ups and card-search.
- **Q-03** Draft saving and history mailboxes are hand-written twice (In-Depth in `MtgAssistantApp.tsx`, Quick Question in `QuickLookupApp.tsx`). Waits for card-search. The `FrozenAskAiContext` move (Q-10) goes with it.
- **Q-07** Three In-Depth steps take an `onBack` they never call. Waits for card-search (all three props together).
- **Q-09** Card-limit messages and the zone-owner rule are written more than once (`QuickLookupApp.tsx`, `ZoneCollectionStep.tsx`, `MtgAssistantApp.tsx`). Waits for card-search.
- **Q-11** See section b. Waits for the Trade bug fix, then card-search.
- **Q-14** The "remember the download, forget it on failure" loader is written five times (`lib/scan/loadScanMap.ts`, `loadHashDb.ts`, `loadScanResources.ts`, and two more listed in the evidence). Waits for card-search.
- **Q-15** "Latest value" and "previous value" refs are hand-rolled about 25 times. Waits until all four pending briefs ship.
- **Q-16** Node-only build tools live in the browser tree: `lib/scan/hashLibBuild.ts`, `detectorFixtures.ts`, `rawImageFixture.ts`. Moving `hashLibBuild.ts` needs product-truth path edits (`system-map.md` and `scan/data/cardhashes.md` name it). Later.
- **C-01** `index.css` (5,398 lines) is four screen stylesheets glued together. Splitting it waits for card-search, pop-ups and card-rings.
- **C-10** An unneeded `!important` on Trade's two sides (`index.css` about `:3398-3400`). Waits with C-01 (the Trade region sits beside card-search's search box).
- **K-03** Rule-search entry points take 10 to 11 positional arguments (`gameRulesRetrieval.ts`, callers in `prompt/preparation.ts`). Waits for backend-health (it rewrites the default resources).
- **K-04** `gameRulesRetrieval.ts` mixes five jobs; split along existing seams. Waits for backend-health. The order snapshot it needs as proof was built in slice G (`Backend - Rule search order`).
- **K-16** Eval harness has checks that always pass and out-of-date labels (`eval/contextEvaluationHarness.ts`: `supplemental-rules-before-rulings` searches for a removed section, `game-rules-before-rulings` no longer checks order, a wrong pass message, a wrong fallback question, retyped instruction lines). Waits for the eval-harness package; the fallback-question fix is a behavior change.
- **K-17** Eleven loose modules at the root of `src/`; `cardRulings.ts` does two jobs. Waits for backend-health.
- **T-05** Six frontend tests exercise Node scripts (`metadataTransformPolicy.test.ts`, `cardRulingsTransformPolicy.test.ts`, `gameRulesBuildPolicy.test.ts`, `scryfallRefreshPolicy.test.ts`, `buildCardScanMap.test.ts` and one more). Move them to the script suite later; nothing blocks it except it is out of this pass's scope.

**Pending brief should fold it in**

- **Q-05** Card lookups scan all 34,639 cards while a cached lookup already exists. Card-search adds its hook beside `cardMetadataStore`.
- **C-07** `body`, `html`, `*` re-declared in `index.css` over `shell.css`. Card-rings' duplicate-selector cleanup owns it.
- **K-19** The part-titles loader swallows a parse error with no warning. Backend-health's shared loader helper.

**`codehealth` queue**

- **C-11** Six breakpoint widths in 45 literal media queries with a stale "one source" comment. `codehealth` item 12 (with U-10).

**Owner call**

- **T-14** `scripts/lib/boundary-rules.mjs` (1,653 lines: shell parser, evidence bookkeeping, rule table) is the engine of the protected guard. Splitting it is the owner's review call.
- **T-12 (scan-vector path)** `scripts/build-scan-vectors.mjs:25, 28` default to a folder in the owner's other repository. Replacing it needs a new flag or environment value.

**Unbuilt remainders of findings built in part**

- **Q-04** `QuickLookupApp` composer props (`answer`, always-false submit state): later, after card-search.
- **Q-10** `FrozenAskAiContext` move (later with Q-03); `oracleSearch` and `useTradeScan` moves (later, after card-search).
- **Q-12** `palette` unread return: `codehealth` item 11; `QuickLookupApp` `onSubmit`: later, after card-search.
- **Q-13** Whether the seed should fire at all: section a, item 4.
- **Q-17** About 45 comments cite deleted work-package docs; slices H and I rewrote only files no brief owns. The rest wait until the briefs ship.
- **Q-18** Formatting the code: section c.
- **Q-19** `countLabel` (later, after card-search); `apiBaseUrl` repeat (`codehealth` item 3).
- **C-03** `.ring .card.summon` rule and its reduced-motion entry: after card-rings.
- **C-04** `.ring .card[data-offstage]` rule (`flow.css:91`): after card-rings.
- **C-06** `--sheet-breakpoint` token: `codehealth` item 12; any glow token orphaned later: re-run the unread-token check after card-rings.
- **C-09** Test-id block onto `lt-sheet`: section c.
- **C-12** The `.ring` Tailwind blocklist: card-rings.
- **K-06** Concept-terms repeat: `codehealth` item 8.
- **K-09** The cast in `routes/askAi.ts`: backend-health.
- **K-11** `errorHandler.ts` ternary: backend-health; `GameRulesSection` in `gameRules.ts` and the test-only exports in `gameRulesRetrieval.ts`: later, with K-03.
- **K-12** Unused exports in `gameRulesRetrieval.ts`, `embeddingModel.ts`, `ruleLayout.ts`, `validation/askAiRequest.ts`: after backend-health.
- **K-15** `catalog.ts` constants and zone order: after backend-health.
- **K-18** Stale lines in `routes/askAi.ts`, `app/createApp.ts`, `providers/localEmbeddingProvider.ts`: backend-health.
- **T-04** Test files whose subject a pending brief owns still carry copied helpers: after the briefs ship.
- **T-07** `verbatimModuleSyntax` (four `import type` edits, one in `MtgAssistantApp.tsx`): after card-search; `tsconfig.node.json` typecheck: later.
- **T-12** Three-defaults reconciliation: section c.
- **T-13** Splitting the large eval functions: later.
- **Slice I leftover:** inside `useScanCapture` the per-frame acquisition diagnostic is still computed into a ref and `recordAcquisitionDiagnostic` still feeds it, though nothing reads it now. Removing it means changing the hosts' `onAcquisitionDiagnostic` wiring in `QuickLookupApp` and `ZoneCardPicker`. After card-search.

## e. Housekeeping after this PR merges

**Held `codehealth` queue items.** The overnight loop's queue is `evidence/HEALTH-REPORT.md` (18 items from 2026-10-17). The cleanup folded in items 13 (dead CSS classes; `StepEyebrow` stays parked for the owner) and 15 (two stray `};`). Resume these held items once PR #322 merges: 3 (one Ask-AI request path; was held for slice H), 5 (live-call confirmation gate; was held for slice D), 6 (shared prompt-resource loader; held for F and G), 7 (rule-search tools import the vector-text formula; held for G), 8 (hoist repeated per-request work; held for F and G, and add K-06's concept-terms repeat), 9 (script helpers; build on `scripts/lib/fs-helpers.mjs`). Items 11 (theme plumbing, add Q-12's unread `palette` return) and 12 (breakpoints, add C-11 and the dead `--sheet-breakpoint` token) get the extra items noted. Items 1, 2, 4, 10, 14, 16, 17 and 18 were unaffected.

**Owner steps after the code PR** (from the brief):

1. Merge the code PR.
2. After merge only: the CI deploy runs the new backend-only build (Lambda package changed). Send one live In-Depth question and tail CloudWatch to confirm the native embedder chain still loads.
3. After the next full local `npm test`, count `$TMPDIR` entries; it should stop growing. Old leaked folders can be removed by hand.
4. Resume the held `codehealth` items (above).

Also for the owner: the staging folder `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261018-162925/` is still on disk; remove it by hand.

## f. Where the source detail lives

- `evidence/` in this folder is an unedited snapshot, taken 2026-10-18, of the 13 intake files the cleanup was built from (copied byte-for-byte and checked with `cmp`): `HEALTH-REPORT-2026-10-18.md` and `HEALTH-REPORT.md` (roll-ups; the second holds the `codehealth` queue), `FINDINGS-frontend-code-quality.md` (Q- ids), `FINDINGS-styling-organization.md` (C- ids), `FINDINGS-backend-code-quality.md` (K- ids), `FINDINGS-scripts-tooling-tests.md` (T- ids), `FINDINGS-ui-and-personalities.md` and `FINDINGS-data-and-clients.md` (U- and D- ids), `FINDINGS-backend-scripts-and-august-audit.md` (B- and F- ids), and the four pending briefs `GRAPH-BRIEF-card-search.md`, `GRAPH-BRIEF-card-rings.md`, `GRAPH-BRIEF-popups.md`, `GRAPH-BRIEF-backend-health.md`. Line numbers in the findings are the probes' and may have drifted; re-read the source before relying on one. Intake is evidence, not authority.
- The cleanup package's own `DESIGN-BRIEF.md` (slice detail, the 68-row disposition table, owner decisions, follow-ups 1 to 28), `GAMEPLAN.md`, the eleven `slice-*.md` docs and each slice's `slice-*.evidence.md` log (before and after numbers, reverted findings) are deleted from `PRD/work/` when the package closes. They stay readable in git history on PR #322's branch `thejudge-auto/codebase-cleanup-pass-work` (path `PRD/work/codebase-cleanup-pass/`).
- Screenshot pairs for the Life Tracker (slices J and K) live under `docs/design/codebase-cleanup-pass/`.
- Order snapshot test for rule search: `Backend - Rule search order`, added in slice G. Reuse it as the proof for K-03 and K-04.
