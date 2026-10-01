# Slice I — manual evidence

2026-10-01 — architecture note, recorded before any criterion was earned: REQ-213's
combined sheet needs to resume or delete a conversation belonging to **either** flow
from **one** Menu-owned sheet — a destination switch alone (`onSelect`) is not enough,
because the owning flow may already be the active destination (no switch fires) or may
need to react to a deletion that happened while a *different* flow's view of the sheet
was open. The existing cross-destination hand-off (`AssistantSeedContext`, built for the
Life Tracker→In-Depth roster seed and the Ask a Question→In-Depth carry) already solved
exactly this shape of problem, so this slice extends it rather than inventing a second
mechanism: three new mode-aware, race-safe mailbox pairs — `queueHistoryResume`/
`consumeHistoryResume`, `queueHistoryDeletion`/`consumeHistoryDeletion`,
`queueDraftResume`/`consumeDraftResume` — sharing one reactive `historyResumeVersion`
counter. Each `consume*` call only clears and returns its payload when the payload's own
`mode` matches the caller's, so whichever of the two flows' effects runs first on a given
version bump never discards a payload meant for the other (both effects key off the same
counter and may run in either order — this is the same race the holding-list `canHold`
check in slice H closed for a different pair of concurrent consumers). `QuickLookupApp`
and `MtgAssistantApp` each gained one `useEffect` keyed on `historyResumeVersion` that
checks all three mailboxes for its own mode and reuses each flow's existing
`restoreConversation`/`hydrateFrom*Draft`/`handleStartOver` — no new restore logic, only
a new trigger for calling it.

2026-10-01 — scope note on the historyTrigger plumbing: `PortalSlot`'s optional
`historyTrigger` prop, `PortalSlotContext`'s `getHistoryTrigger` registration, and the
pass-through in `StagedStepHeader`/`ZoneConfirmStep`/`EnrichmentStep`/`ZoneCollectionStep`
are left in place rather than removed. `FeaturePortalMenu`'s Question History row no
longer reads `visibleSlotEntry?.getHistoryTrigger()` — it opens its own sheet state
directly — so that plumbing is now unread or write-only. Removing it cleanly touches
seven files with zero behavioral upside (nothing downstream regresses by leaving it:
`PortalSlot`'s own two tests still pass, `StagedStepHeader`'s own test still passes,
unchanged). Recorded as a deliberate scope cut rather than left silently: a future slice
that touches any of those seven files for its own reasons should retire this plumbing
then, not invent a new reason to re-visit them now.

2026-10-01 — the combined list and two-pane reading (REQ-213's behavioral core):
`ConversationHistoryDrawer.tsx` is rewritten on `SheetShell`, reading a single combined
`entries` list (the store already caps at 20 across both modes — no per-mode filter to
remove downstream, since `FeaturePortalMenu` now calls `loadHistoryEntries()` with no
mode argument). The `600px` sheet-family boundary (REQ-207/DEC-117/NFR-011) is read via
`window.innerWidth`/`resize`, not a CSS media query, because the boundary is *behavioral*
here, not just visual: below it a row tap resumes immediately (closing the sheet); from
it a row tap only selects into a second reading pane, and **Open conversation** /
**Delete this question** are the pane's own explicit actions. `useScanCapture`'s holding
list is the closest prior art for "the same control fires different commands depending
on context" in this package; this is a narrower, viewport-keyed version of the same
idea. 18 new/rewritten tests in `ConversationHistoryDrawer.test.tsx` cover: the empty
state and the "n of 20" head: both kinds counted; the card-thumbnail fan (dashed frame
at zero cards, "+n" badge past three); narrow-width immediate resume and the per-row
Delete control; wide-width select-then-act (no resume on row tap, Open conversation /
Delete this question in the pane, no per-row Delete control); Draft rows (up to one per
flow, always-immediate resume regardless of width); and that a reopen of the sheet
forgets a stale selection/pending-delete.

2026-10-01 — a real test-authoring trap, found and fixed before any criterion was
flipped true: the row button's own wrapping `<span>` has three child spans (question /
ruling / meta) concatenated with no text-node separator, so its aggregate `textContent`
starts with the full question text too — a regex `getByText(/^Earlier question/)` query
then matches *both* the semantic inner span and that outer wrapper, a `TestingLibraryElementError:
Found multiple elements`. Plain-string `getByText("exact phrase")` queries are unaffected
(they require whole-string equality, not a prefix/substring match, so only the one node
whose entire trimmed text equals the string matches) — only regex/substring queries hit
this. Fixed by querying the row through its own `aria-label` (`getByRole("button", {
name: ... })`) instead of text content in every App-level integration test this slice
touched (`App.conversation-history-delete.test.tsx`, `App.mid-flight-draft.test.tsx`,
the new test in `App.persist-active-destination.test.tsx`); `ConversationHistoryDrawer.test.tsx`'s
own unit tests use plain-string `getByText` where unambiguous and `getAllByText` with an
explicit length where the pane's own copy of a ruling line is expected to duplicate the
row's.

2026-10-01 — three existing App-level integration test files exercised the *old*
per-destination drawer's "tap a row, see the result immediately" flow; jsdom's default
`innerWidth` (1024) is the sheet family's wide side of its `600px` boundary, so a bare row
tap under the new design only selects into the reading pane — it does not resume or
snapshot a Draft by itself. `App.conversation-history-delete.test.tsx` was rewritten
(generic `ConfirmSheet` "Delete"/"Keep" buttons, select-then-"Delete this question"/"Open
conversation"); `App.mid-flight-draft.test.tsx` and `App.persist-active-destination.test.tsx`
(new test) gained the explicit "Open conversation" click after selecting. This is a
behavior the new design *intends* (reading before committing, at this width) — the old
tests encoded the old design's "tap commits" assumption, which this slice properly
retires, not a regression this slice caused.

2026-10-01 — full regression check: `npx vitest run` (apps/frontend): 1461/1461 pass,
145/145 suites, across every file this slice touched and every file it did not
(`npm run quality:check`: typecheck, lint, format:check, coverage thresholds, and
`test:scripts` all green; the only lint output is the 3 pre-existing unrelated
`Unused eslint-disable directive` warnings this package has carried since before this
slice, plus the `react-refresh/only-export-components` warnings `seedContext.tsx`
already carried for its pre-existing `queueSeed`/`consumeSeed` exports — the same shape
`leftEdgeDrawerContext.tsx` already has, not a new category this slice introduced).

2026-10-01 I9/I10 — in the browser (dev server on ports 3109/5281, mock mode), at
390×844: seeded one In-depth entry and one Ask a Question entry directly into
`localStorage.thejudge.conversationHistory.entries`, reloaded `/in-depth`, opened the
Menu (confirmed the "Question History" row is **not** disabled — REQ-103/REQ-107,
unlike the retired rail's `disabled={!historyTrigger}`), tapped it: the sheet opened
showing "Question History — 2 of 20", both kinds in one list, each row's fan/question/
ruling-first-line/meta-line, and — at this width — each row's own Delete control.
Tapped the In-depth row: the sheet closed and the real In-depth chat appeared
immediately with "View context: Pre Combat Main Phase · 0 populated zones" and the
follow-up box enabled — a live resume, not a navigation stub. At 1440×900: reopened
History from the (already-resumed) In-depth screen, confirmed **no** per-row Delete
controls and a "Select a question to read it here." placeholder pane (REQ-213's two-pane
split). Selected the Ask a Question (Lightning Bolt) row: it highlighted in the list
without resuming or closing the sheet, and the pane showed the full thread with
**Delete this question** / **Open conversation**. Clicked **Open conversation**: the app
navigated to `/quick-lookup` (confirming the cross-flow destination switch fires as part
of the same gesture) and rendered "Ask a Question" with "Reopened from your history"
under the title, the Lightning Bolt card in View Context, and the saved thread — exactly
REQ-213's ac. Captures:
`PRD/work/ui-reimagining-build/.playwright-mcp/slice-i-history-sheet-390x844.png`,
`slice-i-resumed-indepth-390x844.png`,
`slice-i-history-two-pane-1440x900.png`,
`slice-i-reopened-lookup-1440x900.png`.

2026-10-01 I9 — REQ-202 Life Tracker before/after pair at 390×844 and 1440×900, saved to
`docs/design/ui-reimagining/build-screenshots/i/`. Before and after are byte-identical by
design: this slice's touched files
(`ConversationHistoryDrawer.tsx`, `FeaturePortalMenu.tsx`, `seedContext.tsx`,
`QuickLookupApp.tsx`, `MtgAssistantApp.tsx`) are not imported anywhere under
`apps/frontend/src/components/portal/life-tracker/`, confirmed by `grep -rl` over that
directory for each of those five file's exported symbols returning nothing; the
Question History row's enabled-vs-disabled state change inside the Menu tray affects
only that tray's *open* rendering, which is outside the Life Tracker screen's own
default-closed capture, the same reasoning slices D/E/G/H recorded for their own
unaffected pairs.

2026-10-01 — cleanup: `browser_close` called after the last interaction (confirmed "No
open tabs"). The dev-server instance (ports 3109/5281) was started by this session as a
tracked background task (`b7rkdgo6a`) and stopped via `TaskStop`; `lsof -i :3109 -i :5281`
empty after. Reviewable capture:
`docs/design/ui-reimagining/build-screenshots/i/life-tracker-{before,after}-{390x844,1440x900}.png`
(the I9 pair, named above). Disposable captures: the four `slice-i-*.png` files named
above, under `PRD/work/ui-reimagining-build/.playwright-mcp/`. The Playwright MCP server
also wrote its own console/snapshot logs to the launch checkout's root `.playwright-mcp/`
(its own cwd) during this slice's browser pass; those were identified by today's
timestamp (22-02 through 22-04) and deleted after the pass, restoring
`cd /Users/chrismiho/Coding/Projects/TheJudge && git status --porcelain` to exactly
` M scripts/lib/boundary-rules.mjs` (the owner's pre-existing cap-raise edit).
