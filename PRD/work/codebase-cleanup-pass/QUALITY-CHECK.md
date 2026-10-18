# Quality check — codebase-cleanup-pass

Result: **PASS** (attempt 2)

Checked artifact: `PRD/work/codebase-cleanup-pass/DESIGN-BRIEF.md`
Mode: graph-controlled, run `graph-20261018-175940`, node `gate-qc`, attempt 2.
Attempt 1 (run `graph-20261018-162925`) passed; this is a full re-grade after the
owner's four answers edited the brief. Package status stays `STATUS.refined`.
The Preparation gate section is the driver's.

## Verdict in plain words

Players see no change in any of the eleven slices, and each slice names the test
that proves it. The owner's four decisions are consistent across the top section,
the slice text, the disposition table and the follow-ups. Attempt 1's advisories
A1, A2, A3 and A5 are fixed. No blocking issue. Two small advisories follow.

## Blocking findings

None.

## Advisory findings

1. **Slice K names the test's imports but not the hook's own.** The brief says to
   update "the test's own relative imports". `useLifeTracker.ts` also has relative
   imports (`../../types`, `./counters`, `./persistence`, `./state`, `./types`,
   and the block at `:5`) that break when it moves to `hooks/`. The builder will
   hit this at typecheck; one added clause ("and the hook's own") makes it exact.
2. **Cited lines are still partly the probes'.** Marked as such, and the builder
   re-reads them first. Nothing sampled this time was off.

## Edited parts, checked

- **Counts.** Counted the disposition table by kind: built in full 37, built in
  part 12 (49 built), later 14, pending brief 3, `codehealth` 1, owner 1. Total
  68; the "other 19" is 14 + 3 + 1 + 1. The brief's "37 fully, 12 in part" and
  "49 of 68" both match. (Attempt 1's 27/20 error is fixed.)
- **`## Owner decisions` vs the rest.** Decision 1 (drop `master`, edit `ci.md`)
  is slice D's T-11 and the table row. Decision 2 (remove the two personal
  files) is T-17 in slice D, the table, and the protected/owner-only list.
  Decision 3 (Life Tracker cleanups) is slice K, the table rows for C-09, Q-10,
  Q-12, rule 9, the verification list and follow-up 27. Decision 4 (Prettier
  later) is Q-18 and follow-up 25. No contradiction found.
- **Slice K facts.** `PlayerLifeTrackerApp.tsx:39-40` holds the Game setup
  header `<p>` (five classes) and `<h2>` (three classes): eight. The
  `[data-testid="life-tracker-game-setup"] .sheet-legacy-head p/h2` rules at
  `index.css:5312-5329` set font size, weight, case, spacing, colour and line
  height, and win by specificity, so removing the classes keeps the pixels. The
  `SheetShell` wraps the head in `.sheet-legacy-head` (`SheetShell.tsx:186`).
  `lib/lifeTracker/index.ts` is imported by nothing (bare `lib/lifeTracker` and
  `index` greps are empty). The only `useLifeTracker` importer is
  `PlayerLifeTrackerApp.tsx:7`; the jsdom entry is at `vite.config.ts:62`; no
  other config names the old path. The pop-ups brief's `SheetShell` at `:31`
  overlap is named and handled ("second to land rebases").
- **REQ-202 honored.** `screen-layout.md:223` says the table is pixel-untouched
  and every touching slice attaches the 390x844 and 1440x900 pair. Slice K only
  touches the Game setup sheet header and moves code files; it binds the pair
  (rule 9, slice K proof, verification list). No other REQ freezes these files.
- **Slice D new items.** `ci.md:6` reads "every push to `main`/`master`" and the
  workflow lists `master` at `:7`, so both edits are real and consistent.
  `exampleoutput.txt` and `purple-gold-handoff/` (three files) are tracked;
  nothing outside the work package, its intake and run log names either. `ci.md`
  is an instructions file, not a `PRD/sections/` page, so no proposal is needed.
- **Disjointness.** Slice K shares no file with another slice; the "two
  exceptions" sentence still holds.

## Attempt-1 checks kept

- **Every slice states how players see no change.** A through K each have a Proof
  block.
- **Protected paths and REQ-frozen files.** None edited. They appear only as
  exclusions; T-14 stays with the owner.
- **No silent `PRD/sections/` change.** Nothing the owner's edits add (Life
  Tracker files, the two personal files, `ci.md`) is stated by a section beyond
  REQ-202's screenshot-pair rule, which the brief follows.
- **No genuine product decision hidden.** Every behavior change is a follow-up.
- **Collisions with `intake/GRAPH-BRIEF-*.md` hold.** Re-read the four briefs; the
  only new overlap is pop-ups' `PlayerLifeTrackerApp.tsx:31`, handled above.
- **Spot checks in this worktree** (all matched): `quality-check.yml:7,48,255`;
  `index.css:1086, 3510` stray `};`; `rulesGate.test.ts:114`;
  `privacy-scan.mjs:14` hard-coded path; `EnrichmentStep.tsx:643` fake form
  event. Attempt 1 sampled about 35 more lines in the same tree.
- **Agent-readiness.** Each slice lists findings, changes, confinement, proof and
  the stop rule. No screen is added or redesigned, so no `screen-layout.md` row
  is needed.
