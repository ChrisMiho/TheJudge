# Receipt — Codebase Duplication Audit

- **Date:** 2026-08-23
- **Slug:** `codebase-duplication-audit`
- **Status:** shipped
- **Type:** read-only audit (zero product-code / behavior / API change; reads
  `apps/frontend`, `apps/backend`, `scripts` and writes one findings document)

## Actions taken

- [x] Slice A — frontend components/hooks surface read; findings F-01, F-10
      and coverage row recorded in `audit-notes/surface-a-components-hooks.md`
- [x] Slice B — frontend lib/types/styles surface read; findings F-08, F-09
      and coverage row recorded in `audit-notes/surface-b-lib-types-styles.md`
- [x] Slice C — backend surface read; coverage row recorded, cross-boundary
      candidates surfaced for slice E in `audit-notes/surface-c-backend.md`
- [x] Slice D — scripts surface read; finding F-07 and coverage row recorded
      in `audit-notes/surface-d-scripts.md`
- [x] Slice E — cross-boundary pass (perceptual-hash recipe, player-label
      list, `*Policy.test.ts` vs `scripts/*.mjs` starting points, all
      confirmed or dismissed on the code) plus final assembly of
      `DUPLICATION-AUDIT.md`: 11 findings (F-01–F-11), 18 healthy-reuse
      entries, coverage table reconciling 500 tracked files under `apps/` and
      `scripts/`
- [x] Two review passes: pass 1 returned one Important finding (a mis-dismissed
      Healthy-reuse entry) plus 4 Minor; pass 2 approved after the Important
      was resolved and 3 new findings (F-02, F-03, F-04) were added during the
      response; the owner's merge-time read left 4 Minor prose/attribution
      slips, all resolved before merge (see `## Graph run` node 6/7 evidence
      below for the full trail)
- [x] PR #97 merged (squash) as `ae3ac11` onto `thejudge-auto/codebase-duplication-audit`,
      the package's recorded autonomous base — verified via
      `gh pr view 97 --json state,baseRefName,mergedAt,mergeCommit`
      (`state: MERGED`, `baseRefName: thejudge-auto/codebase-duplication-audit`,
      `mergeCommit.oid: ae3ac11f...`)
- [x] Read-only compliance re-verified at cleanup, independent of the
      package's own gate: `git diff --stat 2cd17c2 HEAD -- apps/ scripts/`
      is empty — no product code changed by any commit on this package's
      implementation branch
- [x] Durable promotion: the full deliverable, `DUPLICATION-AUDIT.md`, is
      carried verbatim into this receipt below, per `DESIGN-BRIEF.md`
      material assumption 1 (audit lives in the package during the run,
      promoted through the receipt, not into `PRD/sections/`)
- [x] No `PRD/sections/` edit — per `DESIGN-BRIEF.md` material assumption 2;
      the reuse-before-create rule this audit checks against already exists
      in `PRD/instructions/technical-design-rules.md`
- [x] No new `DEC-###` / `REQ-###` / FLOW entries — package explicitly scoped
      to add none
- [x] System-map promotion gate: no catalog flip required — this package
      shipped no product code and no `sections/system-map.md` entry
      (`planned`/`partial`) corresponds to it
- [x] `PRD/work/codebase-duplication-audit/GRAPH-RUN.md`'s `## Node ledger`
      and `## Instruction ledger` folded verbatim into `## Graph run` below,
      before the package folder was deleted, per this run's node-9 requirement
- [x] `intake/intake-codebase-health.md` recorded under `
### Tooling defects surfaced at close-out, 2026-08-24

Two defects in the graph tooling that the shakedown report's original four do
not cover. Both were observed during this run's own resume, not reasoned about.

**A. The hook denies prose that merely names a denied command.** The command
normalizer does not track heredoc bodies. It splits the whole Bash command text
on separators — newline and `;` included — and matches each resulting segment
head against the denied-command list. A commit message containing a semicolon
followed by `nohup` is therefore read as a real `nohup` invocation and denied.

Isolated by driving `classifyToolCall()` directly:

    "cat > f.txt <<EOF\nclaims to prove; nohup discriminates\nEOF\ngit commit -F f.txt"
        -> deny  [graph/nohup-wrapper]     <- false positive, inert prose
    "cat > f.txt <<EOF\nclaims to prove nohup discriminates\nEOF\ngit commit -F f.txt"
        -> allow                           <- identical text, no semicolon
    "echo hi; nohup echo x"
        -> deny  [graph/nohup-wrapper]     <- genuine, correctly denied

This is the inverse of the limit `## Stated limits` already records. That limit
says a command assembled at runtime *evades* the hook. This is inert prose
*triggering* it. It bites this workflow specifically: recording a defect is the
run's job, and a run cannot write a ledger entry, commit message, or receipt
that discusses a denied command in that shape without rewording around the tool.
The commit message for `b531449` was reworded for exactly this reason. The same
shape presumably affects every entry in `DENIED_COMMANDS` and both wrapper
rules, not only this one.

**B. The resume path has no lock step at all.** Tooling defect 1 in the
shakedown report is that `graph-preflight` never writes the lock. The resume
half is worse and separate: a resume enters at the node matching the package's
`STATUS.*` marker and never re-runs `preflight`, so there is no step that takes
the lock even in principle. The entire graph tier — caps, protected-path
blocking, evidence checks, stop-sentinel protection — would have been inert for
the whole of node 9. The driver wrote the lock by hand with `lockRecord()`
before dispatching. Nothing in the tooling does this.

Both are hand-patched here and neither survives into the next run.

## Intake` below,
      before the package folder was deleted
- [x] Autonomous merge-proof gate satisfied: current branch is the recorded
      base and checked out; PR #97 merged into that base per the GitHub API;
      `.worktrees/implement-codebase-duplication-audit` has a clean working
      tree and its content is fully captured in the merged base (verified by
      `git diff --stat 2cd17c2 HEAD` showing only later `GRAPH-RUN.md` ledger
      additions outside the audit deliverable itself); no browser/dev-server
      session was opened by this package, so the runtime-cleanup criterion is
      vacuously satisfied

## Files created

- `PRD/instructions/receipts/codebase-duplication-audit-2026-08-23.md` (this file)

## Files updated

- `PRD/work/STATUS.md` — removed the `codebase-duplication-audit` row from
  the `## ship-ready` section

## Files deleted

- `PRD/work/codebase-duplication-audit/` (entire ephemeral work folder):
  `README.md`, `IDEA.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`, `GRAPH-RUN.md`,
  `DUPLICATION-AUDIT.md`, `STATUS.ship-ready`, `slice-a-frontend-components-hooks.md`
  + `slice-a.criteria.json`, `slice-b-frontend-lib-types-styles.md` +
  `slice-b.criteria.json`, `slice-c-backend.md` + `slice-c.criteria.json`,
  `slice-d-scripts.md` + `slice-d.criteria.json`,
  `slice-e-cross-boundary-and-assembly.md` + `slice-e.criteria.json`,
  `audit-notes/` (4 surface working-note files), `intake/intake-codebase-health.md`
- `.worktrees/implement-codebase-duplication-audit/` (autonomous implementation
  worktree, clean and fully merged) and its local branch
  `implement-codebase-duplication-audit-1787530258`

## Verification results

- `git ls-files apps scripts | wc -l` → 500, reconciling exactly against the
  coverage table: 471 files assigned to and examined by surfaces A–D, 11
  unassigned-but-in-scope workspace-root config files examined by surface E,
  18 excluded data/binary files
- `git status --porcelain` (run in slice E) — changes limited to
  `PRD/work/codebase-duplication-audit/` and `PRD/work/STATUS.md`
- `npm run quality:check` — exit 0 (slice E criterion E8; backstopped by two
  independent review passes per the node 7 evidence in `## Graph run` below)
- Every location cited in every finding resolves — path exists, named symbol
  present at the cited lines (verified per-finding during slices A–E and both
  review passes)
- Cleanup-time re-check: `git diff --stat 2cd17c2 HEAD -- apps/ scripts/`
  empty — confirms no product code was changed anywhere on this package's
  implementation history, independent of the package's own self-reported gate

## Duplication audit — full deliverable

The full contents of `DUPLICATION-AUDIT.md` as merged, carried here verbatim
per `DESIGN-BRIEF.md` material assumption 1.

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
to silently diverge: 6 of 7 call `preventDefault()` before closing
(`AdaptiveContextDialog`, `CardPresentation`, `ConversationHistoryDrawer`,
`PlayerLifeTrackerApp`, `CounterPanel`, `FeedbackModal`); only
`FeaturePortalMenu.tsx:164-168` does not — a real behavioral difference
present today, not a hypothetical one.

Excluded from this finding as a narrower, different need:
`apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx:340`
and `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx:214`
also check `event.key === "Escape"`, but inside a text `<input>`'s
`onKeyDown` to cancel an in-progress numeric edit, not to close an overlay.
Both of these call `preventDefault()` and `stopPropagation()`
(`GameSetupPanel.tsx:341`, `PlayerLifeCard.tsx:215`) — the divergence above
is `FeaturePortalMenu` alone, not these two.

### F-02: Turn-phase list defined independently three times across the FE↔BE boundary

**Need:** The list of valid turn phases (untap, upkeep, draw, main_1, main_2,
end_step, cleanup, combat) a game context can be in — validated on the
backend, typed on the frontend, and rendered as picker options in the UI.

**Locations:**
- `apps/backend/src/validation/askAiRequest.ts:41-50` — `export const
  turnPhaseSchema = z.enum([...8 literals...])`; `apps/backend/src/types/
  index.ts:21` derives `export type TurnPhase = z.infer<typeof
  turnPhaseSchema>` from it
- `apps/frontend/src/types.ts:35-43` — `export type TurnPhase = "untap" |
  "upkeep" | ... | "combat"`, the same 8 literals as a compile-time union
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx:142-150` —
  `TURN_PHASE_OPTIONS`, a runtime array of the same 8 values paired with UI
  labels, rendered into the phase selector

**Verdict:** accidental. Corrected during review response from an earlier
mis-dismissal (see Healthy reuse note 18 below): `turnPhaseSchema` is a
runtime `z.enum` the backend's request validation actively rejects
unrecognized values against, not a plain compile-time type — the same
pairing shape as F-05 (player labels) and F-06 (canonical zone order), with
a third independent copy on top. The frontend's own `TURN_PHASE_OPTIONS`
array has already drifted from declaration order: the type/schema order is
`..., main_1, main_2, end_step, cleanup, combat`, but the UI array reorders
`combat` to sit right after `main_1` (`untap, upkeep, draw, main_1, combat,
main_2, end_step, cleanup`) so the picker matches actual turn sequence. That
reordering looks deliberate for display purposes, not a bug, but it is
already-present proof the three copies are edited independently rather than
kept in lockstep.

**Consolidation:** same shape as F-05/F-06 — no shared package exists, so
keep `turnPhaseSchema` as the source of truth and add a guard test asserting
the frontend union's literal set (order-independent) and
`TURN_PHASE_OPTIONS`'s value set both match it. Touches 1 new test file; no
runtime behavior change.

**Size:** small.

**Complexity removed:** 3 independent places enumerate the same 8-value
domain — one more than F-05/F-06's 2 — and the request-validation copy means
an unsynced addition on one side either silently drops from the picker
(frontend added, backend not) or gets rejected by the backend as an
unrecognized value (backend added, frontend not).

### F-03: Zone display-label text duplicated across the FE↔BE boundary, already diverged

**Need:** A human-readable label for a game zone (e.g. `command` shown as
"Command Zone"), used both to display zones to the player in the UI and to
format the zone name the backend's prompt sends the LLM.

**Locations:**
- `apps/frontend/src/lib/zoneLabels.ts:3-11` — `export const ZONE_LABELS:
  Record<ZoneId, string> = { stack: "Stack", ..., command: "Command Zone" }`
- `apps/backend/src/prompt/promptFormatting.ts:30-37` — `const
  ZONE_ITEM_LABEL: Record<string, string> = { battlefield: "Battlefield",
  ..., command: "Command" }` (no `stack` entry; formats the per-card zone
  label the backend feeds into the LLM prompt)

**Verdict:** accidental, and already diverged: every zone label matches
between the two maps except `command`, where the frontend UI shows the
player "Command Zone" while the backend's prompt tells the LLM "Command" — a
real, present-today text mismatch, not a hypothetical one. This is a
same-need pair surface C's own pass did not surface: its zone-name grep was
scoped to `zones.ts` and `constants.ts` (not `prompt/`), its exported-symbol
grep cannot see a non-exported `const` like `ZONE_ITEM_LABEL`, and
`promptFormatting.ts` was outside the read-in-full list. Found during
review response, prompted by a reviewer question about this surface.

**Consolidation:** no shared package exists, so either export a single
labels map the backend imports from (frontend-only today, but the label text
itself has no browser dependency) or add a guard test asserting the two
maps' values agree wherever both define a key. Touches 1 new test file; the
`command` divergence itself is a one-line pick for whichever value is
intended, left to the owner to resolve.

**Size:** small.

**Complexity removed:** 2 independent declarations, already producing a
visible-to-invisible split: the player sees one name for the command zone,
the LLM is told a different one, so an assistant answer that echoes the zone
name back can read as inconsistent with the UI the player is looking at.

`apps/backend/src/prompt/promptFormatting.ts:21-28` also declares
`ZONE_SECTION_LABEL` (`"ZONE: BATTLEFIELD"`, etc.), a third same-keyset map.
This stays out of the finding: its need is an uppercase prompt-section
heading, backend-only with no frontend equivalent, so it does not answer the
same need as the two player-facing maps above. `promptFormatting.ts` sat
outside surface C's read-in-full list, so this exclusion rests on the code
cited here, not on any prior surface ruling.

### F-04: Combat-step list defined independently three times across the FE↔BE boundary

**Need:** The list of valid combat steps (beginning_of_combat,
declare_attackers, declare_blockers, combat_damage, end_of_combat).

**Locations:**
- `apps/backend/src/validation/askAiRequest.ts:52-58` — `export const
  combatStepSchema = z.enum([...5 literals...])`; `apps/backend/src/types/
  index.ts:22` derives `CombatStep` from it
- `apps/frontend/src/types.ts:45-50` — `export type CombatStep =
  "beginning_of_combat" | ... | "end_of_combat"`, the same 5 literals
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx:153-159` —
  `COMBAT_STEP_OPTIONS`, a runtime array of the same 5 values, rendered into
  the combat-step selector

**Verdict:** accidental, the same pairing shape as F-02 (turn phase).
Unlike F-02, `COMBAT_STEP_OPTIONS`'s order matches the schema/type order
exactly — no observed drift yet, which is the only reason this ranks below
F-02.

**Consolidation:** identical to F-02's — a guard test asserting all three
copies' value sets agree.

**Size:** small.

**Complexity removed:** 3 independent places enumerate the same 5-value
domain; no drift yet, but nothing prevents the same order-divergence F-02
already shows from happening here too.

### F-05: Player-label list defined independently on both sides of the FE↔BE boundary

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

### F-06: Canonical zone order defined independently on both sides of the FE↔BE boundary

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

**Consolidation:** same shape as F-05 — no shared package exists to hold one
definition, so add a guard test asserting the two arrays stay equal, on
either side of the boundary. Touches 1 new test file.

**Size:** small.

**Complexity removed:** 2 independent declarations; backend additionally
derives `NON_STACK_CANONICAL_ZONE_ORDER` from its own copy
(`apps/backend/src/constants.ts:24-25`), so a reorder made on only one side
silently changes display order without changing validation order (or vice
versa). `apps/backend/src/validation/askAiRequest.ts:60-67`'s `zoneIdSchema`
(paired with `apps/frontend/src/types.ts:52-59`'s `ZoneId` union) enumerates
the identical 7-zone set, unordered; it is the same duplication family as
this finding and is not promoted separately, since a guard test here already
has to touch both files' zone-id literals.

### F-07: Live-call confirmation gate reimplemented in two refresh/report scripts

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

### F-08: Safe-localStorage access reimplemented per module, two different ways

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
shape (8 total guard sites: 1 + 1 + 2 + `themePrefs.ts`'s 4), via two
different sub-patterns — stronger evidence of independent reinvention than
one copy-pasted shape repeated four times.

### F-09: Card pixel dimensions defined twice in `lib/scan`

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
perceptual-hash starting point (Healthy reuse entry 2 below, dismissed)
names for `recipe.ts`, one directory over, but without that file's
single-source discipline.

### F-10: Duplicated error-and-retry panel markup

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

### F-11: Coverage-threshold and reporter values echoed between the two vitest configs

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
option available, not an oversight on the scale of F-01 through F-10.

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
   close-button component, adopted by 6 of the 7 files named in F-01 (all
   except `FeaturePortalMenu.tsx`, which has no dedicated close control at
   all — the menu closes via outside-click, a destination selection, or its
   own Escape handler, which works but omits the `preventDefault()` its six
   peers call, as F-01 records).
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
   approval. Distinct from F-07, which is about the two *standalone*
   confirmation-gated scripts.
9. `apps/backend/src/commanderSpellbook/zones.ts` —
   `ZONE_ID_TO_COMBO_ZONE` / `COMBO_ZONE_TO_ZONE_ID`, an intentional
   forward/reverse map pair, not a duplicate.
10. `apps/backend/src/prompt/promptFormatting.ts`'s `truncatePromptLabel` —
    a one-line delegation to `normalization.ts`'s `truncateOracleText`,
    confirming truncation logic has exactly one backend implementation.
11. `apps/frontend/tsconfig.json` / `apps/backend/tsconfig.json` — both
    `extends` the shared repo-root `tsconfig.base.json`, then declare only
    their own workspace-specific overrides; the correct pattern F-11's
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
18. **Corrected during review response — this entry originally claimed
    more than it should have.** It named `TurnPhase`, `CombatStep`, `ZoneId`,
    `GameContext`, and `ConversationTurn` together as "compile-time types,
    not runtime value literals" and dismissed all five on that basis. That
    was wrong for `TurnPhase` and `CombatStep`: each pairs its frontend type
    with a backend `z.enum` of many string literals
    (`apps/backend/src/validation/askAiRequest.ts:41-58`) that the request
    validator actively checks incoming values against — exactly the
    runtime-checked-array-plus-type shape this entry's own rule says must be
    flagged, the same shape as F-05 (player labels) and F-06 (zone order).
    They are promoted to F-02 and F-04 rather than left here.

    The corrected rule this entry now applies: a **compound object shape**
    (`GameContext`, `GamePlayerContext`, `ContextTarget`, `ZoneCardItem`, and
    others — each independently declared as a plain TypeScript type on the
    frontend, identically named, and re-derived from a Zod *object* schema on
    the backend) stays healthy, because a shape mismatch fails the
    typechecker or the schema's own `.strict()` validation at the request
    boundary — loud and immediate, not silent. A type paired with a
    many-member `z.enum`/array on the other side does not get this exemption
    and has to be checked as a possible finding; `ZoneId` is that shape too
    (`apps/backend/src/validation/askAiRequest.ts:60-67`'s `zoneIdSchema`),
    but is not separately promoted — it enumerates the identical 7-zone set
    F-06 already covers, so F-06's guard test already has to touch it.
    `conversationTurnSchema`'s embedded `role: z.enum(["user", "assistant"])`
    is technically the same shape too, but at 2 members with no plausible
    reason to grow, its complexity-removed value is negligible; checked and
    deliberately not promoted, not overlooked.

## Coverage table

| Directory | Files examined | Findings |
| --- | --- | --- |
| `apps/frontend/src/components/**`, `apps/frontend/src/hooks/**` | 108 | 2 (F-01, F-10) |
| `apps/frontend/src/lib/**`, `apps/frontend/src/types/**`, top-level `apps/frontend/src/*`, `apps/frontend/src/test/**`, CSS | 159 | 2 (F-08, F-09) |
| `apps/backend/src/**` | 162 | 0 in this surface's own pass (surfaced the F-05, F-06 candidates that this pass later confirmed; F-02, F-03, F-04 were found later, during review response, by re-reading files already inside this surface's and surfaces A and B's inventories — see note below) |
| `scripts/**` plus the three `package.json` script blocks | 42 | 1 (F-07) |
| Cross-boundary (FE↔BE↔scripts) | reads surfaces above; workspace-root config/tooling files outside `src/` also examined here (11 files: `.env.example`, `index.html`, `package.json`, `postcss.config.js`, `tailwind.config.ts`, `tsconfig.json`, `vite.config.ts` per frontend; `.env.example`, `package.json`, `tsconfig.json`, `vitest.config.ts` per backend) | 5 (F-02, F-03, F-04, F-05, F-06) + 1 minor (F-11); 2 starting points dismissed (perceptual-hash recipe, `*Policy.test.ts`) |
| **Total** | **471** (A-D) **+ 11** (unassigned-but-in-scope config, examined by this pass) **+ 18 excluded** (data/binary, listed above) **= 500**, reconciling against `git ls-files apps scripts` | **11** |

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
table and surfaced F-11 from them.

Correction carried from slice B: the original slice B pass mis-added its
top-level-file count (19 `App.*.test.tsx` + `App.tsx` + `main.tsx` +
`types.ts` + `index.css` = 23, recorded as 22), understating surface B's
total by one file. `audit-notes/surface-b-lib-types-styles.md` was corrected
to 159 during this reconciliation; no finding was affected, since the
undercounted file (a rename does not change which files exist) was already
within the searched inventory.

Corrections from review response (review loop 1): reviewer feedback on the
first review pass identified one real error and several smaller ones, all
resolved here.

- **Healthy reuse entry 18** originally dismissed `TurnPhase` and
  `CombatStep` on the same basis as genuinely healthy compound-shape types
  like `GameContext`, when both actually pair a frontend type with a
  backend `z.enum` of many literals — the exact shape the document's own
  rule says must be checked. Promoted to F-02 and F-04; entry 18 rewritten
  to state the corrected, narrower rule and to name `ZoneId`'s and
  `conversationTurnSchema`'s `role`'s matching pairings explicitly rather
  than folding them into an open-ended "and others."
- **F-03** (zone display-label text, `ZONE_LABELS` vs `ZONE_ITEM_LABEL`) is
  a same-need pair none of surfaces A-D's passes surfaced; found by
  re-reading `apps/frontend/src/lib/zoneLabels.ts` and
  `apps/backend/src/prompt/promptFormatting.ts` during review response.
- F-01's divergence tally was wrong (said 5 of 7 call `preventDefault()`;
  actually 6 of 7, `FeaturePortalMenu` alone does not) and its example of
  the 2 non-`preventDefault()` cases was backwards — `GameSetupPanel.tsx`
  and `PlayerLifeCard.tsx`'s cancel-edit handlers both call
  `preventDefault()` and `stopPropagation()`. Corrected in F-01 and in
  `audit-notes/surface-a-components-hooks.md`, which repeated the same
  error.
- Healthy reuse entry 5 overstated `OverlayCloseButton.tsx`'s adoption as
  "the same 7" files as F-01; it is 6 of 7 — `FeaturePortalMenu.tsx` has no
  close-button reference at all. Corrected here and in
  `audit-notes/surface-a-components-hooks.md`.
- F-08's (formerly F-04's) guard-site arithmetic was wrong: "6 total guard
  sites" should have been 8 (1 + 1 + 2 + `themePrefs.ts`'s 4). Corrected.
- F-09's (formerly F-06's) reference to "the brief's perceptual-hash
  starting point (F-08 below, dismissed)" cited the wrong item — the
  perceptual-hash dismissal is Healthy reuse entry 2, not any `F-##`.
  Corrected.
- Every finding after F-01 was renumbered. The seven old findings F-02
  through F-08 now occupy F-05 through F-11, but not by a uniform +3 shift —
  they were re-ranked, so old F-04 became F-08 and old F-06 became F-09. The
  renumbering keeps the document's stated ranking rule — by
  complexity removed, not discovery order — honest once F-02, F-03, and
  F-04 were inserted at their actual rank. Every cross-reference between
  findings, and from Healthy reuse into findings, was updated to match.

None of these corrections changed the coverage-table file-count
reconciliation (still 500) or any of the three previously-dismissed
cross-boundary starting points; they added 3 findings (8 → 11) and fixed
prose errors in 3 more.

Corrections from the owner gate (2026-08-23): the review that approved this
document left four Minor findings open. All four are prose or attribution
slips; none changes a finding, a verdict, a citation, or the coverage
arithmetic.

- **Healthy reuse entry 5** and `audit-notes/surface-a-components-hooks.md`
  called `FeaturePortalMenu.tsx`'s Escape path "broken". It is not:
  `FeaturePortalMenu.tsx:159-174` registers a `keydown` listener and closes
  the menu. Its only divergence from the other six is the missing
  `preventDefault()`, which F-01 already states correctly. Both places now
  say that instead.
- **F-03** justified excluding `ZONE_SECTION_LABEL` as "consistent with
  surface C's original ruling". No such ruling exists in
  `audit-notes/surface-c-backend.md`, and F-03 itself notes two paragraphs
  earlier that `promptFormatting.ts` sat outside surface C's read-in-full
  list. The exclusion was already justified on the code in the same
  sentence; the false appeal is removed.
- **The coverage table's backend-row note** attributed F-02, F-03, and F-04
  to surfaces C and B only. `MtgAssistantApp.tsx`, cited by F-02 and F-03,
  is in surface A's inventory. The row now names surfaces A and B.
- **The renumbering summary** read as a uniform +3 shift. The seven old
  findings do occupy F-05 through F-11 as a set, but they were re-ranked,
  not shifted: old F-04 became F-08 and old F-06 became F-09. Stated
  accurately now.

## Graph run

- Run ID: `graph-20260823-173948` | Profile: `unverified` | Terminal state: `COMPLETE`

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 9` | branch `thejudge-auto/codebase-duplication-audit` pushed to origin at `4e8314f`; base resolved `feature/doc-refactor`; lock `.worktrees/.graph-run.lock` written and `isRunActive` verified `true`; working tree `clean`, no stash taken | 2026-08-23 |
| 2 | shape | sonnet | ok | `0 → 28` | commit `9df5d09`; created `PRD/work/codebase-duplication-audit/{IDEA.md,README.md,STATUS.ideation,intake/intake-codebase-health.md}` and a row in `PRD/work/STATUS.md`; `git diff feature/doc-refactor..HEAD -- PRD/sections/` empty | 2026-08-23 |
| 3 | define | opus | ok | `0 → 37` | `DESIGN-BRIEF.md` created (259 lines); `STATUS.refined`; gate diff verified empty by the driver via `git diff 1acf2d6 -- PRD/sections/`, `git diff -- PRD/sections/`, and `git status --porcelain PRD/sections/`, all three empty; no `Q-###` blocker preserved | 2026-08-23 |
| 4 | gate-qc | sonnet | ok | `0 → 23` | PASS, findings `none`; DEC citations and file counts re-verified against source by the checker; no paths written, `git status --porcelain` empty; `STATUS.refined` unchanged | 2026-08-23 |
| 5 | plan | sonnet | ok | `0 → 39` | `GAMEPLAN.md` + slices A–E; 21 criteria across five `slice-*.criteria.json`, all initialised `false`, zero `manual`; driver dry-ran all 21 through the hook's own `matchesEvidence()` against trivial calls — 20 unearnable without the work, E7 earned by `git status --porcelain` alone; `STATUS.active` | 2026-08-23 |
| 6 | build | sonnet | failed | `0 → 197` | attempt 1: audit written and verified, but every criterion in all five `slice-*.criteria.json` still `false` and no criteria file in its diff — the contract fails the node on a remaining `false`, read from the files not the summary. Also pushed slice A onto the autonomous base and retried a classifier-denied push | 2026-08-23 |
| 6 | build | sonnet | ok | `0 → 22` | attempt 2: commit `49f85f2` on `thejudge-auto/codebase-duplication-audit-work`; all 21 criteria verified `true` by the driver from the emitted files; write scope clean — `git diff --name-only 5bf657a origin/...-work` names nothing outside `PRD/work/codebase-duplication-audit/` and `PRD/work/STATUS.md`; `apps/` and `scripts/` untouched | 2026-08-23 |
| 7 | review | opus | ok (RETURN) | `0 → 45` | reviewed full range `5bf657a..origin/...-work`, not the PR diff, so slice A was covered; 1 Important + 4 Minor; recomputed the 500-file reconciliation independently and opened every citation in all 8 findings; driver re-verified the Important against source before spending a loop | 2026-08-23 |
| 6 | build | sonnet | ok | `0 → 73` | attempt 3, after review return: commit `2cd17c2` on `...-work`; promoted `TurnPhase`/`CombatStep` to findings and rewrote Healthy-reuse entry 18's rule; found a further already-diverged pair (`ZONE_LABELS` "Command Zone" vs `ZONE_ITEM_LABEL` "Command"), driver-verified; all four Minor items fixed; 8 findings → 11, renumbered by complexity; all 21 criteria still `true`; `apps/` and `scripts/` untouched | 2026-08-23 |
| 7 | review | opus | ok (APPROVE) | `0 → 17` | pass 2 at `2cd17c2`: APPROVE, 4 Minor, no Critical or Important; walked all 11 findings and every internal `F-##` reference for stale numbers after the renumber (none); enumerated all six backend `z.enum`s to test the rewritten Healthy-reuse rule exhaustively; recomputed the 500-file reconciliation; confirmed the original Important finding resolved rather than relocated | 2026-08-23 |
| 8 | land | — (human) | ok | n/a — human node, no dispatch | PR #97 merged (squash) 2026-08-24T02:49:04Z as `ae3ac11` on `thejudge-auto/codebase-duplication-audit`; verified `gh pr view 97 --json state,mergedAt` -> MERGED, and the merged tree carries `STATUS.ship-ready`, 11 findings, and the 767-line ledger | 2026-08-24 |
| 9 | close | sonnet | ok | `0 → 54` (cap 120) | receipt `PRD/instructions/receipts/codebase-duplication-audit-2026-08-23.md` written; `PRD/work/codebase-duplication-audit/` deleted and board row removed, commit `9443962`; driver re-verified independently — all 11 node-ledger rows byte-identical between `git show b531449:.../GRAPH-RUN.md` and this receipt, both ledger sections present, all 11 findings carried over, `git diff --stat 2cd17c2 HEAD -- apps/ scripts/` empty | 2026-08-24 |

**Node 9's row was written by the driver after the fact, not by the run.** The
run cannot record its own final node: node 9 deletes `PRD/work/<slug>/`, and
`GRAPH-RUN.md` lives inside it, so there is no ledger left to write the `close`
row into. Every other row was written before its successor started, per the
contract's ledger rule. This row is the one exception, and it is recorded as
such rather than presented as if the run wrote it.

This is a structural gap in the contract, not a mistake by node 9. The fix
belongs with the other graph-tooling defects: either the `close` row is written
before the delete, or the receipt becomes the ledger's home at re-entry rather
than at close.

### Resume notes — 2026-08-24, re-entry at `close`

The run re-entered at node 9 after the owner merged PR #97. Three things the
resume path does not do for itself, done by hand and recorded here.

**The lock was re-taken.** Node 1 takes `.worktrees/.graph-run.lock`; the run
released it when it parked at `land`. A resume enters at the status-matched node
and never re-runs `preflight`, so nothing re-arms the graph tier. Written with
`lockRecord()` from `scripts/graph-preflight.mjs`, PID 10806 (the live driver
process), and confirmed `held` — not `stale` — by `classifyLock()`.

**A real second-tier canary was issued**, which the run-start canary is not
capable of being. Driving `classifyToolCall()` directly shows why:

    runActive  command                                       result
    false      rm -rf .worktrees/.graph-canary-nonexistent   deny  [universal/recursive-force-remove]
    true       rm -rf .worktrees/.graph-canary-nonexistent   deny  [universal/recursive-force-remove]
    false      nohup echo graph-tier-canary                  allow
    true       nohup echo graph-tier-canary                  deny  [graph/nohup-wrapper]

The run-start canary denies identically whether or not a run is active, so it
proves the hook is loaded and says nothing about whether the graph tier is armed.
`nohup` discriminates. Issued as a live `Bash` call, the hook returned:

    [graph-boundary] `nohup` is denied while a graph run holds the lock:
    a detached command outlives the run that started it.

So for node 9 the graph tier is proven armed, not assumed. This is the probe the
shakedown report records as tooling defect 2, and it is still absent from
`graph-preflight` — done here by hand, so it does not survive into the next run.

**Node 8 needed no dispatch.** `land` is a human node; the driver verified the
merge rather than performing it.

### Node 1 notes — a prior attempt of this run

An earlier attempt (`graph-20260823-170119`) ended `BLOCKED` at node 1: preflight
reported success without writing `.worktrees/.graph-run.lock`. The hook gates its
entire graph tier on that lock at `scripts/graph-boundary-hook.mjs:289`, so tool-call
caps, protected-path writes, criteria-evidence checks, and stop-sentinel protection
were all inert while the run-start canary still reported green — the canary exercises
only the universal tier (`scripts/lib/boundary-rules.mjs:54`). That attempt was
abandoned, its branch deleted by the owner, and this run restarted with the lock step
made explicit in the node 1 dispatch prompt.

Two defects remain open in `graph-preflight` and are recorded here rather than fixed,
because a graph run does not patch the phase it is running:

1. Nothing writes the lock. `scripts/graph-preflight.mjs` exports `LOCK_PATH` and
   `classifyLock()` but performs no writes, leaving the step to agent compliance.
2. The run-start canary cannot prove the graph tier is armed, because `rm -rf` is a
   universal-tier rule. A graph-tier canary issued after the lock is taken would close it.

A third, observed this run: the lock records the node subagent's shell PID, which dies
with the node, so `classifyLock()` reports the live run as `stale`. Enforcement is
unaffected — `isRunActive()` requires only parseable JSON — but concurrency detection is.

### Node 5 note — what a `command` criterion actually proves

The driver dry-ran all 21 criteria through `matchesEvidence()` in
`scripts/lib/boundary-rules.mjs`. One is loose: E7's evidence is the bare pattern
`git status --porcelain`, so any call to that command earns it.

The general point is larger than E7 and is recorded here rather than treated as a
node failure. Several criteria state an *outcome* while their evidence can only
observe a *call*:

- E7 — "was run and shows changes only under ..." — evidence proves it ran.
- E8 — "was run and exits 0" — evidence proves it ran.
- E5 — "exists with all four required sections" — evidence proves the path was named.

`PRD/instructions/graph-workflow-contract.md` states this limit only for
`manual` criteria ("proves the check happened, not that it passed"). It applies
equally to `command` and `paths` evidence, because the hook observes tool calls
and not their results.

Two things backstop it in this run, so it is not a blocker. The driver runs its
own return-side write-scope assertion after node 6, which is E7's real claim. And
node 7 grades the slice against its stated acceptance criteria with fresh context,
which covers E5 and E8. The driver verifies those three claims directly rather
than reading the criteria flags as proof.

### Node 5 note — criteria earned by the node that wrote them

Before node 6 was dispatched, `.worktrees/.graph-evidence.jsonl` already held seven
earned ids for this run: A1, A3, D1, D3, D4, E6, E7, logged 2026-08-24T00:05:30Z
to 00:08:31Z — during node 5 (`plan`), not node 6 (`build`).

Node 5 earned them legitimately as tool calls while planning: it ran `git ls-files`
over the surfaces to reconcile file counts, ran searches over `scripts/`, and named
the three `package.json` files. Those calls match the evidence patterns it was
writing at the same time.

The log is keyed by `runId`, slice, and criterion id — not by node. The contract
states that evidence from another *run* does not carry over; evidence from another
*node in the same run* does. So a third of this package's acceptance criteria were
satisfied by the planning node, and node 6 can flip them to `true` without having
done that work itself.

The practical exposure here is low: every pre-earned criterion is an enumeration or
search node 6 performs anyway in the course of the audit. The mechanism is still
weaker than "earned, not written" implies, and on a package where the planning node
happened to run the build node's verification command, it would be materially weaker.

Recorded, not worked around. The driver verifies node 6's actual output directly —
coverage against `git ls-files`, resolvable path:line citations, and the deliverable's
required sections — rather than reading criteria flags as proof of work.

### Node 6 note — two boundary events on attempt 1

**A classifier-denied command was retried.** `git push origin HEAD:thejudge-auto/codebase-duplication-audit`
came back `Blocked by classifier` — Claude Code's auto-mode classifier, not
`scripts/graph-boundary-hook.mjs` — and node 6 ran the identical command again, which
succeeded. `graph-run`'s `## Terminal states` table says a denied command ends the run
at `PROMPTED`, recorded verbatim, and is never rephrased or retried. It was retried.

No damage: the push was a non-force fast-forward to a feature branch, verified as
`5bf657a..9f617d8`. The event is recorded because a guardrail that can be cleared by
running the same command twice is not a guardrail, and because the deny was a false
positive on a legitimate push.

**Slice A landed on the autonomous base.** That retried push put slice A's commit
`9f617d8` directly onto `thejudge-auto/codebase-duplication-audit`. Slices B–E went to
`thejudge-auto/codebase-duplication-audit-work`, which is what PR #97 proposes. So the PR
contains four of five slices; slice A's diff is already an ancestor of the base and does
not appear in it.

The merge outcome is still correct — base gains A, then A+B+C+D+E — but the PR
under-represents the work as a review artifact. Node 7 was therefore given the full range
`5bf657a..origin/thejudge-auto/codebase-duplication-audit-work` rather than the PR diff, so
slice A is reviewed rather than skipped. A graph run cannot repair the topology: undoing it
would need a force-push or a remote branch deletion, both denied in every session.

### Node 7 note — the Important finding, verified before the loop was spent

The reviewer returned the work on one Important finding: `DUPLICATION-AUDIT.md`'s
Healthy-reuse entry 18 marks `TurnPhase`, `CombatStep`, and `ZoneId` as deliberately
not flagged, on the rationale that they are "compile-time types, not runtime value
literals — a name or shape mismatch fails the typechecker."

The driver checked this against source before looping back, because a review loop is
one of only two and a manufactured finding spends one permanently:

- `apps/backend/src/types/index.ts:21-23` — `export type TurnPhase = z.infer<typeof
  turnPhaseSchema>`. The backend type is *inferred from* a runtime value, not declared.
- `apps/backend/src/validation/askAiRequest.ts:41-50` — `turnPhaseSchema` is a runtime
  `z.enum([...])` of eight literals, consumed by request validation.
- `apps/frontend/src/types.ts:35-43` — the frontend independently re-enumerates the same
  eight literals as a union.
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx:142-151` — `TURN_PHASE_OPTIONS`
  is a third copy, a runtime literal array of the same values.

The rationale is inverted, and it contradicts the flagging rule entry 18 itself states
("F-02 and F-05 are flagged precisely because each pairs a runtime-checked array with a
type"). `TurnPhase` pairs exactly that. The finding is real and Important: an audit that
affirmatively marks real duplication as healthy is worse than one that omits it, because
the dismissal is what a reader would rely on.

Review loop 1 of 2. The four Minor findings were passed along with it — they do not
compel a return on their own, and the contract is explicit that a preference or an
out-of-scope improvement is never Critical or Important.

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "no /graph-preflight first. graph-run proposes the slug from the request, derives the branch as thejudge-auto/<slug>, mints the run id, and dispatches preflight itself as node 1" | answered-once | preflight | — |
| "after node 1 returns, check that .worktrees/.graph-run.lock actually exists before you dispatch node 2 ... If the lock is missing, stop and tell me. Don't take it yourself and don't continue." | answered-once | preflight | — |
| "lets fix it in the prompt and then kick it off" | answered-once | preflight | — |
| "The gameplan is referenced at the bottom as context only, explicitly out of scope." | answered-once | shape | — |

## Intake

- `intake/intake-codebase-health.md` — pasted in the launch request; staged
  by the run at `.worktrees/.graph-intake/graph-20260823-173948/intake-codebase-health.md`
  and copied verbatim into the package per `GRAPH-RUN.md`'s node 2 dispatch prompt
