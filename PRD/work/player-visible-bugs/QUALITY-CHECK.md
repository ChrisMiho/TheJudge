# Quality check — player-visible-bugs

**Verdict: PASS.** No blocking issue. The brief still matches the code and spec
on the current `origin/main`, and both owner verdicts are accepts. Three
advisories carry over from the last check.

**Ask: Nothing (FYI).** The graph records this and starts the build.

**In plain terms:** the build half starts from a newer `main` than the one the
brief was written against. The only change in between is one new frontend test
file. Every code line the brief points at still says what the brief says it
says, both spec edits still apply cleanly, and no other work package is in
flight.

Run mode: graph-controlled (`graph is controlling`), run
`graph-20261019-083336`, node 4 (`gate-qc`), re-grade after gate resolution.
Branch `thejudge-auto/player-visible-bugs-work`, cut from `origin/main`
`e19dd31e`. Checked 2026-10-19.

## Drift since the brief was written

`git diff` from the brief's last base (`a4128f1c`, an ancestor of this branch)
to HEAD over `apps/`, `PRD/sections/`, `PRD/instructions/` and `docs/design/`
changes one file: `apps/frontend/src/lib/sharedContractLists.test.ts` (+34
lines, a new test). It is unrelated to any file the brief touches. No
`PRD/sections/` text moved.

## Cited code, re-read on this branch

All cause and fix lines still hold; no line number drifted.

- Bug 1: `useScanCapture.ts:409-413` (`votingCandidates` built from the ranked
  list), `:482` (`candidates: votingCandidates` on the held card), `:301`
  (hands `entry.candidates` to the host at close); `useTradeScan.ts:82-84`
  (`scannedPrintingIdForOracle` call). Cause and fix hold.
- Bug 2: `ZoneCollectionStep.tsx:130-141` (returns the refusal message),
  `useScanCapture.ts:476-477` and `:549` (`blockedNotice` stored and returned),
  `ZoneCollectionStep.tsx:492` (status line off while scanning),
  `ScanPanel.tsx:58` and `:82-86`, `stackLimits.ts:2-3`. Nothing reads
  `blockedNotice` yet. Holds.
- Bug 3: `MtgAssistantApp.tsx:440-449` (contributor registration),
  `destinationRegistry.tsx:150` (supplies `isActive`),
  `DestinationOutlet.tsx` mounted-but-hidden list, `FeedbackContextProvider`
  and `feedbackSeam.ts` (last registration kept until unmount). Holds.
- Bug 4: `FeaturePortalMenu.tsx:103-106` and `:134-138` (both resume handlers
  call `onSelect`), `App.tsx:62-73` (seed on Life Tracker to In-Depth). Holds.
- Bug 5: `MtgAssistantApp.tsx:736-738` and `:744-752` (`handleRetry` returns
  silently without `gameContext`); `useAskAiSubmitOrchestration.ts`:
  `pendingRetry` private at `:89`, `canRetry` at `:91`, `submitAttempt` at
  `:265`, saved-resend branch from `:274`. `hasPendingRetry` and `retryPending`
  do not exist yet, as the brief says. Holds.
- Bug 6: `askAiRequest.ts` `boundedText` trims to `min(1)`; `prompt/context.ts:307`
  as cited. Holds, no change.
- Bug 7: `index.css:1386` and `:2176` are both `min-height: 40px`;
  `.lt-scope .seg button` rule at `:4587`; `ComposerPill.test.tsx:415` is the
  44 px floor test. Holds.
- Spec cites: REQ-214 acceptance at `functional-requirements.md:5618`, REQ-070
  at `:1690`, REQ-085 acceptance at `:2026-2027`, REQ-249 line `:6616`, scan
  README `:141-143`, Trade README scanned-printing text. All present.

## Gate diffs

Scripted: every context and removed line of both diffs in `GATE-QUESTIONS.md`
(REQ-214 and REQ-085 in `functional-requirements.md`, `scan/README.md`,
`life-tracker/README.md`) appears exactly once in the current files. Both
diffs apply cleanly.

## Brief, proposal and verdicts agree

`GATE-QUESTIONS.md` records `Verdict: accept` for REQ-214 and REQ-085
(matching `## Gate verdicts` in `GRAPH-RUN.md`). Both were proposed as written,
so no reconciliation was needed. The brief's bug 2 and bug 4 sections describe
the same text the diffs add, with the same wording, placement and
"no seed on a reopen" behaviour. Slice C and slice D both go ahead (neither is
dropped).

## Collisions

`PRD/work/STATUS.md`: the only package listed is `player-visible-bugs` (under
`## refined`); `ls PRD/work` shows no other folder. `active`, `refining` and
`ideation` are empty. The card-search, card-rings and pop-ups briefs remain
parked under `PRD/ideasForLater/`, not work packages, so the brief's "this
package lands first" handling still holds.

## Advisory (do not block; carried from the prior check)

- **Bug 7 test anchor.** The base `.seg button` assertion must use a line-start
  (`^` with the multiline flag) match, as the brief says. `ComposerPill.test.tsx`'s
  unanchored style would also match `.lt-scope .seg button {` and pass even if
  the base rule regressed.
- **Stylesheet test location.** The CSS-text test may sit in
  `ZoneCollectionStep.test.tsx` as the brief says, or beside the existing 44 px
  floor tests; either works.
- **Brief line length.** One sentence in the bug 2 foot note in
  `DESIGN-BRIEF.md` runs past the wrap used elsewhere. Cosmetic only.

## Status

Package stays at `refined`: `STATUS.refined` is the only marker, README front
matter `status: refined`, and the `PRD/work/STATUS.md` row is already under
`## refined`. Nothing to move. The README `## Preparation gate` section is left
to the driver.
