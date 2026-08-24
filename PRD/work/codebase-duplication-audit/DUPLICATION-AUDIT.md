# Codebase duplication audit

## Header

- **Commit:** `a31a8122d66819b573113c0b1a369d8e4ca78e1e` (this audit's own
  commits, which add only this document and the working notes under
  `PRD/work/codebase-duplication-audit/`, change no code in `apps/` or
  `scripts/` and are not reflected in the analysis).
- **Date:** 2026-08-23.
- **Scope:** every committed, hand-authored file under `apps/frontend/`,
  `apps/backend/`, and `scripts/`, plus the `scripts` block of `package.json`
  at the repo root and in each workspace. No product code was changed to
  produce this document.
- **Exclusions:** committed data corpora and binary/media payloads —
  `apps/frontend/public/data/**`, `apps/backend/data/**`,
  `apps/frontend/public/assets/**`, binary/generated fixture payloads
  (`**/__fixtures__/**` with `.bin`/`.png`/`.jpg`/`.wav`/`.gz`,
  `apps/backend/src/eval/fixtures/*.golden.txt`, captured upstream JSON under
  `apps/backend/src/commanderSpellbook/__fixtures__/`), and anything
  untracked or ignored. `.github/workflows/**`, `docs/`, `PRD/`, `.claude/`,
  `.agents/`, `.codex/`, `secrets-templates/`, and repo-root config files
  other than `package.json`'s `scripts` block are out of scope entirely, per
  `DESIGN-BRIEF.md`.

## Findings

Ranked by complexity removed — how many independent places a future change
to the same need must currently touch, and what a missed copy silently gets
wrong — not by duplicated line count.

### F-01: Overlay Escape-key dismissal reimplemented per component

**Need:** Close an open overlay (dialog, drawer, menu, modal) when the user
presses Escape.

**Locations:**
- `apps/frontend/src/components/AdaptiveContextDialog.tsx:54-61` —
  `handleDialogKeyDown`
- `apps/frontend/src/components/CardPresentation.tsx:111-116` —
  `handleKeyDown`
- `apps/frontend/src/components/ConversationHistoryDrawer.tsx:108-115` —
  `handleDialogKeyDown`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx:159-172` —
  inline `handleKeyDown` inside a `useEffect`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx:30-44`
  — inline `handleKeyDown` inside a `useEffect`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx:276-290`
  — inline `handleKeyDown` inside a `useEffect`
- `apps/frontend/src/components/feedback/FeedbackModal.tsx:105-115` — inline
  `handleKeyDown` inside a `useEffect`

**Verdict:** accidental.

**Consolidation:** a paired `useDismissOnEscape(onDismiss, enabled)` hook,
alongside `apps/frontend/src/hooks/useOutsideDismiss.ts`, that each of the 7
files calls instead of writing its own effect. Touches 7 component files
plus one new/extended hook file; no prop-shape or behavior change.

**Size:** small.

**Complexity removed:** 7 independent places must currently change together
for any Escape-handling change. `useOutsideDismiss.ts`'s own doc comment
records the split as deliberate ("Each adopter keeps its own Escape/close-
button paths — this hook only covers the outside/scrim interaction"), but
nothing fills the Escape half it hands off. The 7 copies have already begun
to silently diverge: 5 of 7 call `preventDefault()` before closing and 2
(`FeaturePortalMenu`, and effectively the cancel-edit variants below) do
not — a real behavioral difference present today, not a hypothetical one.

Excluded from this finding as a narrower, different need:
`apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx:340`
and `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx:214`
also check `event.key === "Escape"`, but inside a text `<input>`'s
`onKeyDown` to cancel an in-progress numeric edit, not to close an overlay.

### F-02: Player-label list defined independently on both sides of the FE↔BE boundary

**Need:** The list of valid player labels ("Player 1" .. "Player 8") a game
context can reference — read wherever a request is built on the frontend and
wherever it is validated on the backend.

**Locations:**
- `apps/frontend/src/types.ts:1-9` — `export type PlayerLabel = "Player 1" |
  "Player 2" | ... | "Player 8"` (a compile-time union, not a runtime value)
- `apps/backend/src/constants.ts:3-12` — `export const PLAYER_LABELS =
  ["Player 1", ..., "Player 8"] as const` (a runtime array the backend's
  request validation iterates and indexes)

**Verdict:** accidental. This is the brief's named player-label starting
point, confirmed on the code rather than accepted on citation: both sides
independently enumerate the same 8-entry, same-order list. It clears the
floor at the value level, not just the type level — `PLAYER_LABELS` is data
the backend's `apps/backend/src/validation/askAiRequest.ts` reads at runtime
(`PLAYER_LABELS.slice(0, value.playerCount)`), so a change to the roster
size or label text must be made correctly in both files or the frontend can
build a request the backend's validator silently disagrees with.

**Consolidation:** no shared `apps/*` package exists across this repo's two
workspaces today, so the practical fix is process, not code: keep one file
as the source (`apps/backend/src/constants.ts`, since it drives runtime
validation) and add a guard test — mirroring `DEC-155`'s CI-decomposition
guard shape — that fails if the frontend union and the backend array ever
diverge. Touches 1 new test file; no runtime behavior change.

**Size:** small.

**Complexity removed:** 2 independent declarations, but on the FE↔BE
contract boundary: unlike an in-file or in-workspace duplicate, nothing in
either workspace's own typecheck or test suite would catch a drift here — a
typo in one copy fails silently until a real user request round-trips
through both.

### F-03: Live-call confirmation gate reimplemented in two refresh/report scripts

**Need:** Refuse to make live network/provider calls unless the caller
passes an explicit confirmation flag, and print a dry-run plan explaining
what would happen and how to confirm it.

**Locations:**
- `scripts/refresh-commander-spellbook-data.mjs:22` — `CONFIRM_FLAG`;
  `parseRefreshArgs` (line 29-31); `describePlan` (line 260-268)
- `scripts/compare-combo-answer-quality.mjs:31` — `CONFIRM_FLAG`;
  `parseArgs` (line 37-46); `describePlan` (line 78-89)

**Verdict:** accidental.

**Consolidation:** a small shared module (candidate home: `scripts/lib/
liveCallConfirmation.mjs`) exporting `CONFIRM_FLAG`, an `isConfirmed(argv)`
helper, and a `describeConfirmationFooter(count?)` template line that both
scripts' `describePlan` functions call into. Touches 2 script files plus 1
new lib file; no CLI-surface change.

**Size:** small.

**Complexity removed:** 2 independent places define the same safety-critical
flag string (`"--confirm-live-calls"`), the same confirmation check, and the
same three-part dry-run template shape — three separate pieces of one
mechanism echoed between the same two files, evidence both authors solved
"gate a live call behind confirmation" from scratch rather than from a
shared reference. A future third confirmation-gated script has nothing
canonical to import from and would very likely add a fourth independent
copy.

### F-04: Safe-localStorage access reimplemented per module, two different ways

**Need:** Read or write one `localStorage` key without letting a disabled
storage API (privacy mode, quota, non-browser test environment) throw and
crash the caller.

**Locations:**
- `apps/frontend/src/lib/lifeTracker/persistence.ts:107-112` — private
  `getStorage(): Storage | null`
- `apps/frontend/src/lib/conversationHistory/persistence.ts:32-37` —
  private `getStorage(): Storage | null`, byte-for-byte identical body
- `apps/frontend/src/lib/scan/audioPrefs.ts:5-18` — `loadScanAudioMuted` /
  `saveScanAudioMuted`, each with its own inline `try`/`catch`
- `apps/frontend/src/lib/theme/themePrefs.ts:6-59` — four functions, each
  with its own inline `try`/`catch` around one `localStorage` call

**Verdict:** accidental.

**Consolidation:** one small `safeLocalStorage` module (candidate home:
`apps/frontend/src/lib/storage.ts`) exporting a guarded accessor that all
four modules import instead of writing their own guard. Touches 4 lib files
plus 1 new file; no behavior change.

**Size:** small.

**Complexity removed:** 4 independent places reimplement the same try/catch
shape (6 total guard sites, counting `themePrefs.ts`'s four), via two
different sub-patterns — stronger evidence of independent reinvention than
one copy-pasted shape repeated four times.

### F-05: Canonical zone order defined independently on both sides of the FE↔BE boundary

**Need:** The display/processing order of the seven game zones (stack,
battlefield, hand, graveyard, exile, library, command).

**Locations:**
- `apps/backend/src/constants.ts:14-21` — `export const
  CANONICAL_ZONE_ORDER: ZoneId[] = [...]`
- `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.ts:7-14` — `export
  const CANONICAL_ZONE_ORDER: ZoneId[] = [...]`, identical order

**Verdict:** accidental, though risk-acknowledged: the frontend
declaration's own doc comment reads "Matches backend zone ordering
expectations" — the author already knew about the backend copy and chose to
retype it rather than share it. This is a cross-boundary pair beyond the
brief's three named starting points, surfaced while reconciling slice C's
and slice B's inventories against each other.

**Consolidation:** same shape as F-02 — no shared package exists to hold one
definition, so add a guard test asserting the two arrays stay equal, on
either side of the boundary. Touches 1 new test file.

**Size:** small.

**Complexity removed:** 2 independent declarations; backend additionally
derives `NON_STACK_CANONICAL_ZONE_ORDER` from its own copy
(`apps/backend/src/constants.ts:24-25`), so a reorder made on only one side
silently changes display order without changing validation order (or vice
versa).

### F-06: Card pixel dimensions defined twice in `lib/scan`

**Need:** The canonical width/height (in pixels) of a normalized card image,
used by both the live-capture detector and the offline hash builder.

**Locations:**
- `apps/frontend/src/lib/scan/detector.ts:3-4` — `CARD_WIDTH = 745` /
  `CARD_HEIGHT = 1040`
- `apps/frontend/src/lib/scan/identify.ts:21-22` — `CARD_WIDTH = 745;` /
  `CARD_HEIGHT = 1040;`

**Verdict:** accidental. Consumers split cleanly by which copy they import:
`detector.ts`'s feeds `ScanCameraSurface.tsx` / `ScanDebugOverlay.tsx` /
its own tests; `identify.ts`'s feeds `scripts/build-card-hashes.mjs`
(cross-boundary — a script importing frontend lib `.ts` source directly).

**Consolidation:** one definition, candidate home
`apps/frontend/src/lib/scan/types.ts`, imported by both `detector.ts` and
`identify.ts`. Touches 2 lib files plus the host module; no consumer-facing
change.

**Size:** small.

**Complexity removed:** 2 independent declarations of a physical constant
that must stay bit-identical for the detector's card-corner geometry and the
hash builder's crop region to agree — the same shape of risk the brief's
perceptual-hash starting point (F-08 below, dismissed) names for
`recipe.ts`, one directory over, but without that file's single-source
discipline.

### F-07: Duplicated error-and-retry panel markup

**Need:** Render the AI-answer error state — an error message plus a
"Retry"/"Retry in Ns" button, disabled while a retry is in flight.

**Locations:**
- `apps/frontend/src/components/ConversationWorkspace.tsx:70-79`
- `apps/frontend/src/components/EnrichmentStep.tsx:582-591`

**Verdict:** accidental. `EnrichmentStep` renders `ConversationWorkspace`
(which owns its own copy of this block) whenever a conversation is active,
but carries a second, textually identical copy of the same block for its
pre-conversation question-building state.

**Consolidation:** extract a small `ErrorRetryPanel({ error, canRetry,
retryLabel, onRetry })` component, candidate home alongside
`AskAiWaitingPanel.tsx`, rendered by both call sites. Touches 2 files plus 1
new component file; no behavior change.

**Size:** small.

**Complexity removed:** 2 independent copies, already visibly identical
today (no drift yet), but the second exists purely because it was pasted.

### F-08: Coverage-threshold and reporter values echoed between the two vitest configs

**Need:** Declare each workspace's coverage provider, reporter set, and
minimum line-coverage threshold for `npm run coverage:check`.

**Locations:**
- `apps/frontend/vite.config.ts:107-113` — `coverage: { provider: "v8",
  reporter: ["text", "json-summary"], ..., thresholds: { lines: 45 } }`
- `apps/backend/vitest.config.ts:5-16` — `coverage: { provider: "v8",
  reporter: ["text", "json-summary"], ..., thresholds: { lines: 45,
  "src/prompt/**": { lines: 60 }, "src/validation/**": { lines: 60 } } }`

**Verdict:** deliberate but consolidatable. Surfaced while reconciling the
coverage table below against files outside every named surface's path list
(workspace-root config files, never assigned to a slice by `GAMEPLAN.md`).
Vitest has no per-workspace config-inheritance mechanism as convenient as
`tsconfig.json`'s `extends`, so restating the shared `provider`/`reporter`/
baseline-`lines` values in each workspace's own config is close to the only
option available, not an oversight on the scale of F-01 through F-07.

**Consolidation:** a tiny shared `coveragePolicy.mjs` (candidate home:
`scripts/lib/`) exporting the common `{ provider, reporter, minLines }`
values, spread into both configs. Touches 2 config files plus 1 new lib
file. Lowest priority of the findings in this document — optional.

**Size:** small.

**Complexity removed:** 2 places; the baseline `lines: 45` already matches
today, so nothing has drifted, but a future org-wide coverage-bar change
would need both edits by hand.

## Healthy reuse

1. `apps/frontend/src/hooks/useScanCapture.ts` /
   `apps/frontend/src/components/ScanCameraSurface.tsx` — measured, intended
   reuse per `DEC-157`.
2. `apps/frontend/src/lib/scan/recipe.ts` — the brief's first named
   cross-boundary starting point, confirmed dismissed on the code: its own
   header comment states it is "the single authoritative resize +
   perceptual-hash definition," imported by both the on-device identifier
   (`identify.ts`) and the offline builder (`scripts/build-scan-vectors.mjs`,
   confirmed by reading both files — the script imports `phashRegionHex` /
   `phashRegionPacked` directly from `recipe.ts`). This is REQ
   (`PRD/sections/functional-requirements.md:629`)'s single-authoritative-
   recipe requirement working as intended, not a duplication.
3. The four `*Policy.test.ts` files (`cardRulingsTransformPolicy.test.ts`,
   `gameRulesBuildPolicy.test.ts`, `metadataTransformPolicy.test.ts`,
   `scryfallRefreshPolicy.test.ts`) — the brief's third named cross-boundary
   starting point, confirmed dismissed: each imports its tested functions
   directly from the corresponding `scripts/*.mjs` file (confirmed by
   reading all four files' imports). They are frontend-tooling-located test
   wrappers around the scripts' real code, not an independent
   reimplementation of the scripts' behavior.
4. `apps/frontend/src/hooks/useOutsideDismiss.ts` — single shared
   outside-click/scrim-dismiss implementation for all 7 overlay adopters
   named in F-01. Module-scoped `dismissStack` correctly handles
   nested-overlay ordering; the positive control F-01's Escape-side gap is
   measured against.
5. `apps/frontend/src/components/OverlayCloseButton.tsx` — single shared
   close-button component, adopted by the same 7 files as
   `useOutsideDismiss.ts`.
6. `apps/frontend/src/components/StepEyebrow.tsx` /
   `apps/frontend/src/components/StagedStepHeader.tsx` — shared step-header
   pair, adopted consistently by `EnrichmentStep.tsx`, `ZoneConfirmStep.tsx`,
   and `ZoneCollectionStep.tsx`.
7. `scripts/ci-workflow-parity.test.mjs` — `DEC-155`'s CI-decomposition
   guard, confirmed present and keeping `package.json`'s `quality:check`
   chain and the CI workflow's per-job decomposition provably equivalent.
8. `refresh-scryfall-data.mjs` deliberately does not duplicate
   `refresh-commander-spellbook-data.mjs`'s `CONFIRM_FLAG` gate when it
   calls `performCommanderSpellbookRefresh()` directly inside the `data:
   refresh` chain — `DEC-162` makes invoking that chain itself the human
   approval. Distinct from F-03, which is about the two *standalone*
   confirmation-gated scripts.
9. `apps/backend/src/commanderSpellbook/zones.ts` —
   `ZONE_ID_TO_COMBO_ZONE` / `COMBO_ZONE_TO_ZONE_ID`, an intentional
   forward/reverse map pair, not a duplicate.
10. `apps/backend/src/prompt/promptFormatting.ts`'s `truncatePromptLabel` —
    a one-line delegation to `normalization.ts`'s `truncateOracleText`,
    confirming truncation logic has exactly one backend implementation.
11. `apps/frontend/tsconfig.json` / `apps/backend/tsconfig.json` — both
    `extends` the shared repo-root `tsconfig.base.json`, then declare only
    their own workspace-specific overrides; the correct pattern F-08's
    vitest configs cannot fully follow.
12. `apps/frontend/src/lib/conversationHistory/persistence.ts`'s `saveDraft`
    / `loadDraft` — one function with two TypeScript call-signature
    overloads plus its implementation, not duplication.
13. `apps/backend/src/errors.ts`'s `createProviderUnavailableError` /
    `createProviderTimeoutError` / `createUnexpectedError` — parallel
    factory functions for genuinely different error codes, all delegating to
    the single `AppError` class.
14. `scripts/graph-preflight.mjs:341` and the unexported `parseArgs` in
    `scripts/build-card-hashes.mjs:99` — coincidental reuse of a common,
    idiomatic Node CLI-parsing function name; each script's own flag surface
    and validation rules are unique to it.
15. Life-tracker long-press increment
    (`apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx`'s
    `longPressTimerRef` timer) is not duplicated by `PlayerLifeCard.tsx`.
16. `scripts/aws-bootstrap.sh` and `scripts/aws-deploy.sh` both use bash
    `${VAR:-default}` parameter-expansion for their own, distinct config
    values — a shared shell idiom, not a duplicated implementation.
17. `data:scan-hashes` (root `package.json`) is a documented alias for
    `data:scan-fingerprints` — one implementation
    (`tsx scripts/build-card-hashes.mjs`) under two script names, not two
    independent implementations.
18. The systemic FE↔BE type-name mirroring beyond F-02/F-05 (`ZoneId`,
    `TurnPhase`, `GameContext`, `ConversationTurn`, and others declared as
    plain TypeScript types in `apps/frontend/src/types.ts` and re-derived
    from Zod schemas in `apps/backend/src/types/index.ts`) was deliberately
    **not** flagged as a duplication family: these are compile-time types,
    not runtime value literals — a name or shape mismatch fails the
    typechecker (already gated by `npm run quality:check`), not silently at
    runtime the way F-02's and F-05's value arrays can. F-02 and F-05 are
    flagged precisely because each pairs a runtime-checked array with a
    type, not because "the frontend and backend redeclare types" in general
    is a defect in a repo with no shared types package.

## Coverage table

| Directory | Files examined | Findings |
| --- | --- | --- |
| `apps/frontend/src/components/**`, `apps/frontend/src/hooks/**` | 108 | 2 (F-01, F-07) |
| `apps/frontend/src/lib/**`, `apps/frontend/src/types/**`, top-level `apps/frontend/src/*`, `apps/frontend/src/test/**`, CSS | 159 | 2 (F-04, F-06) |
| `apps/backend/src/**` | 162 | 0 (surfaced F-02, F-05 candidates for this pass) |
| `scripts/**` plus the three `package.json` script blocks | 42 | 1 (F-03) |
| Cross-boundary (FE↔BE↔scripts) | reads surfaces above; workspace-root config/tooling files outside `src/` also examined here (11 files: `.env.example`, `index.html`, `package.json`, `postcss.config.js`, `tailwind.config.ts`, `tsconfig.json`, `vite.config.ts` per frontend; `.env.example`, `package.json`, `tsconfig.json`, `vitest.config.ts` per backend) | 2 (F-02, F-05) + 1 minor (F-08); 2 starting points dismissed (perceptual-hash recipe, `*Policy.test.ts`) |
| **Total** | **471** (A-D) **+ 11** (unassigned-but-in-scope config, examined by this pass) **+ 18 excluded** (data/binary, listed above) **= 500**, reconciling against `git ls-files apps scripts` | **8** |

`git ls-files apps scripts | wc -l` → 500, matching the sum above. Of the 500
tracked files under `apps/` and `scripts/`: 471 were assigned to and examined
by surfaces A-D (`git ls-files` counts recorded in each surface's own notes
file); 18 are excluded per the Exclusions list above (10 under
`apps/frontend/public/` — 3 assets + 7 data JSON/bin; 8 under
`apps/backend/data/`); the remaining 11 are workspace-root config/tooling
files under `apps/frontend/` and `apps/backend/` outside `src/` — in scope
per the brief's "config files that live inside those three trees" language,
but never assigned to a lettered slice by `GAMEPLAN.md`'s surface-to-slice
map. This pass (slice E) examined all 11 while reconciling the coverage
table and surfaced F-08 from them.

Correction carried from slice B: the original slice B pass mis-added its
top-level-file count (19 `App.*.test.tsx` + `App.tsx` + `main.tsx` +
`types.ts` + `index.css` = 23, recorded as 22), understating surface B's
total by one file. `audit-notes/surface-b-lib-types-styles.md` was corrected
to 159 during this reconciliation; no finding was affected, since the
undercounted file (a rename does not change which files exist) was already
within the searched inventory.
