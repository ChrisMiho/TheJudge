# Quality check — player-visible-bugs

**Verdict: FAIL.** Two blocking issues go back to refinement. Everything else
checked out.

**Ask: Nothing (FYI).** The graph returns this to refinement.

**In plain terms:** the brief is thorough and almost all of it is right. Two
things are wrong. The new "you already have this card" line inside the
scanner may be barred by an existing rule that says the scanner shows only
what its approved mockup shows. And the brief says the segmented-button style
appears only in In-Depth, but Life Tracker uses it too.

Run mode: graph-controlled (`graph is controlling`), run `graph-20261018-231413`,
node 4, attempt 1. Code re-read at the cited lines on 2026-10-18.

## Blocking

1. **Bug 2 / REQ-214 gate: the new scanner notice line is not reconciled with
   REQ-070's redesigned-screens rule.** `functional-requirements.md:1690`
   (REQ-070 exception, named for the card scanner's chrome, REQ-214) says
   guidance and helper text on the scanner follows the approved mockup page
   (`docs/design/ui-reimagining/direction-1/card-scan.html`): its wording, its
   placement "and whether a line appears at all"; "where the mockup page shows
   no such line, none renders". The mockup has the indicator, the confirm
   toast and the hint line, and no refusal or duplicate line (grepped:
   no `duplicate`, `already`, `notice`). A new line under the camera is a line
   the mockup does not show. Neither `DESIGN-BRIEF.md` nor the REQ-214 block
   mentions this rule, and the REQ-214 diff does not amend or carve out
   REQ-070. Fix in refinement: either add an amendment to that REQ-070 clause
   to the REQ-214 block (naming the blocked-scan notice as an allowed extra
   line, and add `functional-requirements.md:1690` to the brief's grep
   disposition set, with a grep for the mockup-rule wording), or show the
   notice is state copy outside that clause. Also say whether the mockup page
   `card-scan.html` needs a matching line.

2. **Bug 7: the claim that `.seg` renders only in In-Depth is false.** The
   brief says "`.zone-tabs` and `.seg` render only in In-Depth" (REQ-202
   paragraph). `className="seg"` is also used by Life Tracker:
   `components/portal/life-tracker/CounterPanel.tsx:330` (the Commander
   damage / Counters tabs) and `GameSetupPanel.tsx:271`, `:291` (Layout and
   Card style). `index.css:4579-4604` has a `.lt-scope .seg button` rule with
   `min-height: 42px` that outranks the base rule, so raising `index.css:2176`
   to 44 px should leave Life Tracker's height unchanged, but that is the
   thing the REQ-202 screenshot pair exists to prove, not something to assert
   as "renders only in In-Depth". Fix: correct the sentence, state the
   `.lt-scope .seg button` override as the reason Life Tracker is expected not
   to change, and have the proof test assert it (Life Tracker's computed
   `min-height` unchanged). The In-Depth `.seg` users are `ZoneCardMenu.tsx`
   (Reorder) and `EnrichmentStep.tsx` (Copies). Also note `index.css` is a
   region the pending card-rings / pop-ups briefs touch; the collision
   section covers card-search only.

## Advisory (fix with the blocking items; not blocking alone)

- REQ-085 line cite: the brief's grep table cites `functional-requirements.md:2021-2024`
  for REQ-085. The acceptance lines the diff anchors on are at `:2026-2027`
  (heading `:2021`, description `:2024`). Cite `:2021-2027`.
- REQ-214 diff hunk shows the "same duplicate/cap rule" line (`:5618`)
  directly above "all three hosts" (`:5620`), but `:5619` (the "Exit scan"
  bullet) sits between them. The diff still applies by text (every context and
  removed line matches exactly once), but the hunk is misleading about
  adjacency. Add the `:5619` line as context or a `...` marker.
- Bug 7 proof: the `.zone-tabs` / `.seg` test should name the file pattern it
  copies (`ComposerPill.test.tsx:415` is the existing 44 px floor test).
- Bug 5 fix touches `useAskAiSubmitOrchestration.ts` only "possibly"; say which
  file exposes the saved-request flag so the touched-files list is final.

## Checked and correct

- **All seven bugs covered** with a summary row, section, proof and files each;
  **bug 1 first** as slice A, with the one-PR-or-two question put to the owner.
- **Causes match code (re-read).** Bug 1: `useScanCapture.ts:409-413`
  (`votingCandidates`, oracle ids), `:482` (stored as `candidates`), `:301`
  (handed to host), `useTradeScan.ts:39-51`, `:82-84` all exactly as stated.
  Bug 2: `ZoneCollectionStep.tsx:130-141`, `:451-465` (no notice passed),
  `:492`; `useScanCapture.ts:476-477`, `:549`; `blockedNotice` read nowhere in
  a component; `ScanPanel` props `:7-23` have no notice slot; messages in
  `lib/stackLimits.ts:2-3`. Bug 3: `DestinationOutlet.tsx:41-63`,
  `MtgAssistantApp.tsx:440-449`, `feedbackSeam.ts:30-44`,
  `destinationRegistry.tsx:150`; `MtgAssistantApp` takes `isActive`. Bug 4:
  `FeaturePortalMenu.tsx:103-106`, `:134-138`; `App.tsx` seeds in
  `handleDestinationSelect` on Life Tracker to mtg-assistant, and its own
  comment confirms history resume reaches it; seed applied at
  `MtgAssistantApp.tsx:197-228`. Bug 5: `handleRetry` returns on
  `!gameContext` (`:744-752`), Decrypt's message at `:736-738`,
  `pendingRetry` resend at `useAskAiSubmitOrchestration.ts:274-301`.
  Bug 7: `index.css:1384-1386` and `:2170-2176` are 40 px, `:2534-2549` body.
- **Bug 6 (unreachable, no change) holds.** `askAiRequest.ts:17-22`
  `boundedText` is `trim().min(1)`; `name` uses it (`:94`); the Stack card
  schema extends `zoneCardItemSchema`, which spreads that shape (`:111-112`,
  `:125-130`); `routes/askAi.ts:69` parses every request with
  `askAiRequestSchema.safeParse`. A blank-named Stack card is rejected before
  `prompt/context.ts:307`. The zone branch drop at `:203-204` is therefore
  never reached by a blank either.
- **Each fix stays on its symptom;** extras (Ask a Question notice, bug 6
  consistency filter, three of the bug 7 items) are offered separately or
  sent to `codehealth`.
- **Spec lines cited say what the brief says.** Trade README `:75-81` and
  REQ-065 (`:1536`): scanned printing is the default printing. REQ-088
  (`:2095`): "current screen/step". REQ-014 (`:213-222`): controlled retry,
  retry button, 13 s cooldown. REQ-205 (`:5301`, `:5308-5312`): In-Depth step
  controls at least 44 px. REQ-200 ground: no change claimed, consistent with
  `index.css` using `var(--surface-ground)`.
- **Gate diffs apply cleanly.** Scripted check: every context and removed
  line of all four diff hunks (REQ-214 and REQ-085, in
  `functional-requirements.md`, `scan/README.md`, `life-tracker/README.md`)
  matches the current text exactly once. Each amended stable ID (REQ-214,
  REQ-085) has its own `##` block; no other ID is amended. REQ-140 (`:3438`)
  and REQ-206 (`:5361`) are correctly left alone.
- **Grep dispositions complete for the sets named.** Re-ran both greps: the
  REQ-214 set (`5618`, `scan/README.md:141-142`, `:259`) and the REQ-085 set
  (`user-flows.md:301`, `system-map.md:552`, `life-tracker/README.md:10`,
  `functional-requirements.md:1970`, `:2021`, `:2024`, `:3438`, `:5361`) each
  have a row. (Blocking item 1 is a hit no grep in the brief would find.)
- **Plain-language standard met.** Both blocks open with *What this decides ·
  In plain terms · What happens if you say no*; REQ-214, REQ-085 (including
  REQ-140's menu-only limit) and REQ-213's meaning are inlined; `Verdict:` and
  `Reason:` are blank; the file opens with an ask line; the brief opens with
  an ask and a plain summary.
- **Collisions.** `PRD/work/STATUS.md` had no other package; card-search is a
  pending brief under `PRD/ideasForLater/`, handled by "this package lands
  first" and a named list of the overlapping files. Bug 7 names the REQ-202
  Life Tracker before/after pair at 390x844 and 1440x900 for the shared
  stylesheet.
- **Agent-ready.** Each bug has a proof test and a files list, except the
  advisory notes above. No open question hides a decision.

## Status

`STATUS.refining` set (replaces `STATUS.refined`); README front matter
`status: refining`; `PRD/work/STATUS.md` row moved from `## refined` to
`## refining`. The README `## Preparation gate` section is left to the driver.
