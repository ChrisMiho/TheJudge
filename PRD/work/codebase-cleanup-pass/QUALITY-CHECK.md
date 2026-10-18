# Quality check — codebase-cleanup-pass

Result: **PASS**

Checked artifact: `PRD/work/codebase-cleanup-pass/DESIGN-BRIEF.md`
Mode: graph-controlled, run `graph-20261018-162925`, node `gate-qc`, attempt 1.
Package status stays `STATUS.refined`. The Preparation gate section is the driver's.

## Verdict in plain words

Players see no change in any of the ten slices, and each slice names the test
that proves it. No slice edits a protected path. No slice contradicts a
`PRD/sections/` page. No blocking issue. Five advisory items follow; none needs
a refinement round.

## Blocking findings

None.

## Advisory findings

1. **T-11 contradicts one line of `PRD/instructions/ci.md`.** Slice D drops the
   `master` push trigger from `.github/workflows/quality-check.yml:7`. `ci.md:6`
   says the gate runs "on every push to `main`/`master`". It is an instructions
   file, not a `PRD/sections/` page, so it is not a product-truth change. But the
   brief's "Product truth: none" check only grepped `sections/`. Fix at
   map-out: add "update `ci.md:6` to say `main`" to slice D, or keep the trigger.
2. **The brief's counts disagree with its own table.** "Built 47 (27 fully, 20 in
   part)": the disposition table has 47 rows that start with "built", of which
   36 are plain "built" and 11 are "built in part". The 47 and the 68 total hold
   (47 + 14 later + 3 brief + 1 codehealth + 3 owner = 68). Only the 27/20 split
   is wrong. Fix the split or drop it.
3. **"Same timing" vs slice E's speed gain.** The top section says timing does not
   change, then says slice E saves up to about 170 ms of server work. The gain is
   real and harmless, but the sentence should say "same timing, except
   In-Depth combo matching gets faster".
4. **Several cited lines are the probe's, not this worktree's.** Marked as such in
   the brief, and the builder is told to re-read them first. Examples that
   checked out in this tree but need a re-read: file paths given as bare names
   (`MtgAssistantApp.tsx`, `EnrichmentStep.tsx`) and the `index.css` line list in
   C-02.
5. **Life Tracker CSS in slice J.** REQ-202 says Life Tracker's table is
   untouched. Slice J folds `.lt-scope .tile` rules and deletes
   `.lt-scope .tile.pulse .n` and `.life-custom .err`. These are sheet/tile
   rules guarded by the computed-style dump and the screenshot pair, and
   `lib/lifeTracker/` is untouched, so this is consistent. The slice's PR should
   state that the table's computed styles are in the dump.

## Specific checks requested

- **Every slice states how players see no change.** Yes: A through J each have a
  Proof line (same test names and counts; byte-identical goldens; order snapshot;
  identical bundle; identical `dist` file list apart from test files; deep-equal
  combo pipeline; computed-style dump and CSS diff for J).
- **Protected paths and REQ-frozen files.** None edited. `.claude/**`,
  `CLAUDE.md`, `scripts/graph-boundary-hook.mjs` and the `thejudge-*` and
  `codehealth` skills appear only as exclusions. T-14 (`boundary-rules.mjs`) is
  left to the owner. REQ-202 (Life Tracker, `lib/lifeTracker/`) is honored: the
  Q-10 `useLifeTracker` move and the barrel are owner calls, and the screenshot
  pair is bound to slice J.
- **No silent change to a `PRD/sections/` statement.** Grepped the sections and
  instructions for the names slices change or remove: `Answer` plate,
  `hiddenInitialQuestion`, `blockedNotice`, the dead CSS classes and keyframes,
  glow tokens, `screens.xs`, `accent.contrast`, `@tailwind`, `nproc`,
  `build-card-metadata.d.ts`, `SURFACE_DISTANCE`, `LOW_CONFIDENCE_ESCALATION_COUNT`,
  `ScanCameraStatus`, `randomId`, `resolveRunEnv`, `turnStepSearchName`,
  `tsconfig.build`. No section states any of them. Hits that look relevant are
  harmless: `build-card-metadata.mjs` (the script, not the `.d.ts`);
  `getPromptDiagnostics` (the history-budget statement survives; only the unused
  bare-rulings overload goes); `enrichmentDebug.ts` (kept, mock-only sidecar,
  bytes unchanged); `useTradeScan` and `useScanCapture` (named by path only).
  The one hit is advisory 1 (`ci.md`, not a section).
- **No product decision hidden in the brief.** The brief routes every behavior
  change to Follow-ups and builds none. No genuine blocker.
- **File-collision claims against `intake/GRAPH-BRIEF-*.md` hold.** Backend-health
  names `gameRulesRetrieval.ts:359-372` (loaders), `catalog.ts`, `createApp.ts`,
  `askAi.ts`, `ruleLayout.ts`, `askAiRequest.ts`; slice E keeps its count in
  `matcher.ts`, slice G stays below `:372`. Card-search names
  `QuickLookupApp`, `ZoneCardPicker`, `ZoneCollectionStep`, `MtgAssistantApp`
  card-list effect (`:289-307`); slice H edits the submit handlers only. Card-rings
  names `glows.css:31/72`, `flow.css`, `index.css` ring and theme blocks; slice J
  leaves them. No pending brief names `matcher.ts`, `preparation.ts`,
  `promptFormatting.ts`, `EnrichmentStep`, `useScanCapture`, `tuning.ts`,
  `test/setup.ts`, tsconfig, eslint or the CI file. `PRD/work/` holds only this
  package, as the brief says. Textual overlap in `index.css` (card-rings and
  pop-ups dedupe blocks there) is handled by the brief's "second to merge
  rebases" rule.
- **Sampled source lines match this worktree** (about 35 spot checks, all
  consistent): `matcher.ts:355-390` (`selectComboCandidates`); `buildCandidate`
  and `fullyAssigned = missingCount === 0` (the slice E precondition is
  plausible: a missing exact ingredient adds to `missingCount`); `preparation.ts:109,124`
  casts; `promptFormatting.ts:98-104` reduce and `:359` unused `_selectedZones`;
  `gameRulesRetrieval.ts` `computeIdBoost`, the boost at `:1083`, `boostOf`
  at `:1302-1309`; `promptDiagnostics.ts:40` overload; `enrichmentDebug.ts`
  imports Zod and never `.parse()`s; `test/setup.ts:4-7`; `index.css:1086, 3510`
  stray `};` and `:1` `@tailwind components`; `flow.css:446`
  `[hidden]`; `glows.css:9,15-18`; `tailwind.config.ts` `xs` and `contrast`;
  `useScanCapture.ts:581-598` returns; `EnrichmentStep.tsx:643` fake event;
  `.prettierrc.json` `semi: false`; `build-card-metadata.d.ts` wildcard;
  `privacy-scan.mjs:14` and `score-rule-search.mjs:36` hard-coded path;
  `tuning.ts:31,34` unreferenced constants; `LOW_CONFIDENCE_ESCALATION_COUNT`
  used only by its test; `rulesGate.test.ts:114`, `matcher.test.ts:729`,
  `ragRetrievalBenchmark.test.ts:47-48`; `quality-check.yml:7,48,255`;
  `aws-deploy.sh:121` rebuilds the frontend; `package-lambda.sh` copies only
  `apps/backend/dist` and uses nothing from the frontend build; no non-test
  backend module imports `src/eval/`. Q-04's premise holds: `answer` is set with
  a non-empty conversation (`useAskAiSubmitOrchestration.ts:162,178`) and both
  reset paths clear it with the conversation.
- **Agent-readiness.** Each slice lists findings, changes, confinement, proof and
  the stop rule (revert and record). Verification commands are listed per slice
  and overall. Stack order, one endpoint and "no rules engine" are not touched.
  Assumptions are recorded. No screen is added or redesigned, so no
  `screen-layout.md` row is needed.
