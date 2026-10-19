# Quality check — player-visible-bugs

**Verdict: PASS.** Both blocking findings from the first check are resolved.
No new blocking issue. Three small advisories remain.

**Ask: Nothing (FYI).** The graph records this and moves to the gate.

**In plain terms:** the brief now explains why the scanner's "you already have
this card" line is allowed: the mockup rule governs helper text that teaches
how to use a screen, and this line reports what happened to a scan, like the
"Loading scan data..." line that already ships. The brief also now says that
Life Tracker's segmented buttons stay at 42 px, and a test will prove it.

Run mode: graph-controlled (`graph is controlling`), run `graph-20261018-231413`,
node 4, attempt 2. Code and spec re-read at the cited lines on 2026-10-18.
`origin/main...HEAD` changes no `apps/` file on this branch's side; main's
newer commits (#323-#327) touch only `scripts/` and one frontend test, so no
cited line moved.

## Prior findings

1. **Blocking, Bug 2 / REQ-070: resolved.** The argument holds against REQ-070's
   own text (`functional-requirements.md:1685`, `:1690`, `:1691`):
   - `:1690` governs "guidance and helper text" and lists the scanner's
     `locking` / `camera-error` state copy as a separate group. A refusal that
     reports a scan's outcome is state copy, not guidance.
   - `:1691` bans "intro/orientation lines, tooltips, popovers, coachmarks,
     modals, onboarding". A refusal is none of these.
   - Shipped precedent checks out: `ScanPanel.tsx:58` ("Loading scan data...")
     and `:82-86` (failure line, REQ-249 `:6616`) are state lines absent from
     the mockup, with no REQ-070 carve-out; the hint line, which is guidance,
     did need one (REQ-214 `:5622`).
   - The mockup `card-scan.html` has no duplicate, refusal or loading line and
     its foot note says "the states are the scanner's own (DEC-057)" (`:232`),
     so no mockup change is needed. `screen-layout.md:213` lists no state lines,
     so no layout edit.
   - One honest soft spot: the "byte-for-byte preserve" in `:1690` protects
     existing state copy, it does not explicitly license new state copy. The
     brief rests on the ban's scope (guidance only) plus the shipped precedent,
     which is enough; it is not a rule-text loophole.
   - Plain words are in the REQ-214 gate block (paragraph "This does not clash
     with ...") and the diff adds one clause so a later reader does not
     re-raise it. The grep set for the mockup rule is in the brief with a
     disposition for each hit.
2. **Blocking, Bug 7 `.seg` claim: resolved.** The brief now lists the Life
   Tracker users (`CounterPanel.tsx:330`, `GameSetupPanel.tsx:271`, `:291`,
   verified: `className="seg full"` inside `lt-scope`, `CounterPanel.tsx:327`,
   `GameSetupPanel.tsx:95`). `index.css:4587-4602` `.lt-scope .seg button` does
   set `min-height: 42px` and re-declares the base properties. The proof test
   asserts it stays 42 px, and the REQ-202 screenshot pair is specified.
3. **Advisory, REQ-085 cite: resolved** (`:2021-2027`, description `:2024`,
   acceptance lines `:2026-2027`; verified).
4. **Advisory, REQ-214 hunk adjacency: resolved.** The hunk now carries the
   "Exit scan" bullet (`:5619`) as context between the duplicate rule and "all
   three hosts"; the hint line and caution bullet also appear as context.
5. **Advisory, Bug 7 test pattern: resolved.** Names
   `ComposerPill.test.tsx:415` and its rule-text regexes (`:430-432`; verified).
6. **Advisory, Bug 5 touched files: resolved.** The brief names
   `useAskAiSubmitOrchestration.ts` as the file that must change (exposes
   `hasPendingRetry` and `retryPending`; `pendingRetry` private at `:89`, result
   type `:60`, `canRetry` `:91`, return `:362-376`).
7. **Advisory, index.css collisions: resolved.** The collision section now
   covers the card-rings and pop-ups briefs and the `FeaturePortalMenu.tsx`
   overlap with slice D.

## Full re-run of attempt 1 checks

- **All seven bugs covered**, Trade scanned-printing bug first (slice A), each
  with a summary row, section, proof test and files list.
- **Causes match code.** Re-read: `useScanCapture.ts:409-413` and `:482`
  (`candidates: votingCandidates`), `useTradeScan.ts:82-84`;
  `ZoneCollectionStep.tsx:130-141`, `:148`, `:492`; `ScanPanel.tsx:58`, `:82-86`;
  `stackLimits.ts:2-3`; `MtgAssistantApp.tsx:440-449`, `:736-738`, `:744-752`;
  `feedbackSeam.ts:30-44` (registers for the component's mounted life, so a
  hidden tool keeps its contributor); `FeaturePortalMenu.tsx:103-106`,
  `:134-138`; `App.tsx:62-73`; `index.css:1384-1386`, `:2170-2176`.
  Bug 6 (unreachable) holds as in attempt 1; the backend files were not changed.
- **Each fix stays on its symptom.** Extras (Ask a Question notice, bug 6
  filter, bug 7 non-defects, Life Tracker 42 px) are offered separately or left.
- **Every gate diff applies cleanly.** Scripted: each context and removed line
  of every hunk (REQ-214 and REQ-085 in `functional-requirements.md`,
  `scan/README.md`, `life-tracker/README.md`) matches the current text exactly
  once.
- **Stable-ID blocks.** REQ-214 and REQ-085 each have their own `##` block
  opening with *What this decides · In plain terms · What happens if you say
  no*, substance of REQ-214, REQ-070, REQ-085, REQ-140, REQ-213 inlined,
  `Verdict:` and `Reason:` blank. No other ID is amended.
- **Grep dispositions** cover the REQ-214, REQ-070 mockup-rule and REQ-085 sets,
  one row per hit.
- **Collisions.** `PRD/work/STATUS.md` has no other package; the card-search,
  card-rings and pop-ups briefs are handled by "this package lands first" with
  named overlaps.

## Advisory (do not block)

- **Bug 7 test anchor.** The brief says the base `.seg button` assertion is
  "anchored to a rule that starts the line". `ComposerPill.test.tsx`'s style
  (`/\.send-pair button \{/`) is unanchored, and an unanchored
  `/\.seg button \{/` would also match `.lt-scope .seg button {`, passing even
  if the base rule regressed. The build must use a line-start (`^` with the
  multiline flag) match, as the brief says.
- **`ZoneCollectionStep.test.tsx` for a stylesheet test.** A CSS-text test in a
  component test file works (the pattern does it) but the file is large; the
  builder may place it beside the existing 44 px floor tests instead. Not
  required.
- **Brief line length.** The bug 2 foot-note sentence in `DESIGN-BRIEF.md`
  runs onto a line past the wrap used elsewhere. Cosmetic only.

## Status

Package stays at `refined`: `STATUS.refined` present (the only marker), README
front matter `status: refined`, `PRD/work/STATUS.md` row under `## refined`
(already there; nothing to move). The README `## Preparation gate` section is
left to the driver.
