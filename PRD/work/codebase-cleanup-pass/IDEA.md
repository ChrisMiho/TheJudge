# Idea: codebase-cleanup-pass

## Request (verbatim)

> I am stepping away for a few hours, can you do a deep investigation of the code base, trying to indentify poorly written, organized, or un-optimized code, that could be cleaned up within the repo, this is a cleanup exercise, we do not want to affect functionality, but i would like to take a deep pass at the code's health

## What it means for a player

Nothing a player sees, hears, or waits for changes. Same answers, same screens, same messages, same timing. Underneath, the code gets easier and safer to change, the test suite runs faster and stops leaking temp files, and dead code and dead styles go away.

The one player-visible gain allowed is less wasted server work per In-Depth question (finding K-01), with identical output.

Non-goals: any change to behavior, copy, layout, or product truth (`PRD/sections/`). Player-visible bugs the probes found are recorded as follow-ups below, not built here.

## Evidence

The 2026-10-18 driver investigation (four read-only probes) is rolled up in `intake/HEALTH-REPORT-2026-10-18.md`. The owner's 2026-10-17 probe is rolled up in `intake/HEALTH-REPORT.md`. Per-area detail sits in the `intake/FINDINGS-*.md` files. The four still-pending cluster briefs (`intake/GRAPH-BRIEF-{popups,card-search,card-rings,backend-health}.md`) are included so refinement knows which files those runs own. Intake is evidence, never authority.

## Open questions for refinement (not decided here)

1. Which findings belong in this package, and which wait for a later one?
2. How does this package avoid the files the four pending cluster briefs own (popups, card-search, card-rings, backend-health)?
3. How does the 2026-10-17 `codehealth` queue (18 items) relate to this package: folded in, left to the loop, or split?
4. Player-visible bugs the probes found are out of scope and must be recorded as follow-ups, not built. Example: an In-Depth duplicate Stack scan is refused with no message. The other items sit in the behavior-changes list of each findings file under `intake/`.

## Prior run

- Prior run: `PRD/instructions/receipts/codebase-duplication-audit-2026-08-23.md` (read-only duplication audit of frontend, backend, scripts)
- Prior run: `PRD/instructions/receipts/consolidate-shared-logic-2026-06-18.md` (pure refactor removing duplicated shared logic)
- Prior run: `PRD/instructions/receipts/standalone-codehealth-workflow-2026-09-01.md` (created the `codehealth` overnight loop skill)
- Prior run: `PRD/instructions/receipts/remove-dead-card-back-detector-2026-09-02.md` (dead scanner code removed)
- Prior run: `PRD/instructions/receipts/test-suite-hygiene-2026-07-01.md` (test suite hygiene)
- Prior run: `PRD/instructions/receipts/root-playwright-screenshot-hygiene-2026-08-06.md` (stray screenshot hygiene)
- Prior run: `PRD/instructions/receipts/ci-warnings-cleanup-2026-10-16.md` (CI warning cleanup)
- Prior run: `PRD/instructions/receipts/docs-refactor-adhoc-cleanup-2026-08-29.md` (docs refactor scaffolding cleanup)
