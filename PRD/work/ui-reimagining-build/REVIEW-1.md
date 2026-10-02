# Review 1 — node 7, run `graph-20260930-055958` (2026-10-02)

Fresh-context, no-write reviewer (opus) graded PR #239 at `43de0e6` against every
slice's own acceptance criteria and compared every screen with its mockup pair.
Verdict: **RETURN TO BUILD** (review loop 1 of 2). The driver copied the report
below verbatim; the ledger row in `GRAPH-RUN.md` summarises it. Build attempt 9
fixes findings 1–6 and recaptures the affected pairs; Minor findings 7–14 are
not required.

## Reviewer's report (verbatim)

verdict: RETURN TO BUILD

All three test suites pass. But the screen pairs show two places where the player gets stuck, plus visible look gaps on four screens. The build marked those gaps as closed, or as builder-carried, without making any of them an owner question. Each one can be fixed from the slice docs, and none needs a product decision.

Tree check: branch `thejudge-auto/ui-reimagining-build-work`, worktree clean. HEAD is `43de0e6`, which equals the remote branch. That is two ledger-only commits (`eb53ce1`, `43de0e6`) past slice Q's `43f3afc`.

Findings, most severe first:

1. Critical · slice O (repeated in P) · O9/O3, P3/P8 · On Trade Balancer and on the scanner at desktop width, the Menu button is cut off. On Trade Balancer at 1440x900 that leaves the player no Menu to reach any other screen.
   - Capture: `o/trade-balancer-build-1440x900.png` shows the header boxed to the 56rem column, starting about 48px down, with no ☰. `p/card-scan-build-1440x900.png` shows the same at 36rem.
   - Cause: `apps/frontend/src/index.css:94-99` (`.page-content-wide-fit`) and `:104-108` (`.page-content-narrow-fit`) set `overflow: hidden`. That clips the full-width header (`index.css:121-131`), so ☰ at the screen's left edge falls outside the column.
   - This brings back two LOOK-GAPS Frame bullets on these screens: the header is no longer full-bleed, and ☰ is no longer at the left of the header. The 390x844 captures look fine.

2. Critical · slice L · L8/L12 (A3 in a real browser) · When the Menu opens, the sticky header paints over the top of the tray. The "Ask a Question" row (a REQ-207 destination) cannot be seen or tapped, and Question History is cut in half, at both widths.
   - Captures: `l/chrome-menu-build-390x844.png` and `l/chrome-menu-build-1440x900.png`.
   - Cause: `.app-header` has `z-index: 20` (`index.css:124`), above `.portal-menu-drawer`'s `z-index: 2` inside the shell clip (`index.css:456-476`).
   - LOOK-GAPS Menu bullet still visible: "the 'Ask a Question' row is scrolled out of view at the top … desktop … top row is cut in half". The evidence says closed (`slice-l.evidence.md`, Menu bullets). Not carried.
   - Same pair: the Theme band still shows ‹ › arrows and a clipped sixth cell inside the 320px tray. The mockup fits all six cells there (the "Only four tiles fit on a phone" bullet).
   - The desktop floating card itself follows REQ-207 and is not a finding.

3. Important · slice N · N9 (reqs 4, 6, 7, 8, 9, 10 of the slice doc) · Five In-depth details steps still show LOOK-GAPS bullets. The evidence marks them closed, or "carried" by the builder, never as an owner question.
   - Cards (`n/in-depth-cards-build-{390x844,1440x900}.png`): the search field and Scan still sit inside the plate, under a "HAND SEARCH" label, with a "HAND CARDS (1)" sub-panel. There is no "＋ Add to Stack / ▣ Scan" row under the rail. The evidence says closed.
   - Placing (`n/in-depth-place-build-*`): the carry note "N cards came along with your question…" and the type line are missing. Showing all seven zones follows REQ-018 and is correct.
   - Context (`n/in-depth-context-build-*`): there is still a bordered box nested inside the plate. There is no type line, the counter sits outside the head row ("CARD 1 OF 1"), there is no "More details" dashed row beside "Add a note", and there is no target thumbnail.
   - Review (`n/in-depth-review-build-*`): the "Sending to TheJudge" panel and the "OPTIONAL QUESTION" box with a 0/300 count and a text "Send Request" pill remain. Slice requirement 9 calls for "YOUR QUESTION — optional" with the split mic|➤ pill. The evidence says closed.
   - Ruling (`n/in-depth-ruling-build-*`): a "VIEW CONTEXT" panel sits on top instead of "◈ View context" / "✎ Edit" chips in the head. There is no CARDS strip. Requirement 10 names it; the builder skipped it by its own decision.
   - Game (`n/in-depth-game-build-*`): native selects remain. Requirement 4 asks for custom chevron selects; the builder carried this.

4. Important · slice M · M9 (req 10) · After an answer, the follow-up box still has the "0/300" count above it and separate round mic and send buttons. The mockup uses the same split pill as the composer.
   - Captures: `m/ask-question-answered-build-{390x844,1440x900}.png`.
   - `slice-m.evidence.md` says `FollowUpComposer.tsx` was not touched, "Carried forward as a known gap, not an owner question".

5. Important · slice Q · Q9 · The Counters sheet still fills the whole screen and hides the table. The mockup uses a bottom sheet sized to its content (phone) or a content-sized centred card (desktop).
   - Captures: `q/life-tracker-counters-build-*` and `q/life-tracker-counters-tab-build-*`, top at y≈10.
   - LOOK-GAPS "Sheet height" bullet. `slice-q.evidence.md` marks Counters closed without addressing it.

6. Important · slice L · L12 · Send feedback still has sentence-case labels, a tall two-part snapshot block, and starts high on the screen.
   - "What happened?" and "Reply email (optional)" stay sentence case; the mockup uses uppercase eyebrows.
   - The snapshot notice is still a tall block with a separate "Show app-state details" button, not the one-line dashed row.
   - The sheet starts at y≈155 (phone). The mockup's sheet is content-sized and starts at y≈370.
   - Captures: `l/chrome-feedback-build-{390x844,1440x900}.png`. The evidence says closed.

7. Minor · L · L11 · Question History was captured with an empty list, so the row shape (thumbnail fan, badge, chevron) is not shown in any pair.
8. Minor · M, Q · M8/Q8 · Several mockup captures show the wrong state, with other sheets bleeding through:
   - `m/ask-question-search-mockup-1440x900.png` shows a Question History overlay instead of the search.
   - `q/life-tracker-counters-mockup-390x844.png` is shifted left, with a second sheet behind it.
   - `q/life-tracker-counters-tab-mockup-1440x900.png` has other sheets bleeding through.
9. Minor · N · The In-depth column is about 768px wide at 1440x900. The mockup's is 36rem (576px).
10. Minor · L · The colour scene's badge and line art are not visible on desktop; only the haze shows (`l/chrome-build-1440x900.png`).
11. Minor · P · The idle scanner shows an empty pill top-left, and the guide reads as a full outline rather than distinct corner ticks. The camera-less browser cannot reach the locking state.
12. Minor · O · Builder-carried and acknowledged in the evidence: the pile artwork differs from the mockup, and the printing picker hero has no mana cost.
13. Minor · Q · `PRD/sections/system-map.md:564` still names the retired `.page-card` frame. Already known; left for `thejudge-cleanup`.
14. Minor · K · `apps/backend/src/prompt/promptFormatting.ts` places the `copies:` line with `metaLines.splice(9, 0, …)` and the `manaSpent:` line with `splice(7, 0, …)`. These fixed positions are fragile if the order of metadata lines changes.

Per-screen pairs (screen · state · viewport · match/mismatch · LOOK-GAPS bullet · carried?):
- Frame · page at rest · 390 · match
- Frame · page at rest · 1440 · match
- Frame · Menu open · 390 · mismatch · Menu: top rows clipped; Theme band arrows / sixth cell · no
- Frame · Menu open · 1440 · mismatch · Menu: top row cut by header · no
- Frame · Send feedback · 390 · mismatch · Send feedback: label case, snapshot row, sheet start · no
- Frame · Send feedback · 1440 · mismatch · same bullet · no
- Frame · Question History · 390 · match (empty list only)
- Frame · Question History · 1440 · match (empty list only)
- Frame · card detail · 390 · match
- Frame · card detail · 1440 · match
- Life Tracker before/after (REQ-202) · 390 / 1440 · match
- Ask a Question · default · 390 · match. The "n / 10" pill is the owner question; General rules topics is kept per A6.
- Ask a Question · default · 1440 · match
- Ask a Question · search · 390 · match. The 3-character minimum is the owner question.
- Ask a Question · search · 1440 · build side matches; the mockup capture shows the wrong state (Minor 8)
- Ask a Question · answered · 390 · mismatch · Follow-up box · no
- Ask a Question · answered · 1440 · mismatch · Follow-up box · no
- In-depth · Game · 390 / 1440 · mismatch · Step 1 custom selects · no
- In-depth · Zones · 390 / 1440 · match
- In-depth · Cards · 390 / 1440 · mismatch · Step 3 Cards (Add/Scan row, search in panel, sub-panel) · no
- In-depth · Placing · 390 / 1440 · mismatch · Step 3 Placing (carry note, type line); seven zones per REQ-018 is correct · no
- In-depth · Context · 390 / 1440 · mismatch · Step 4 Context (nested box, type line, counter, More details row) · no
- In-depth · Reviewed · 390 / 1440 · mismatch · Step 4 Reviewed (summary panel, OPTIONAL QUESTION box, text Send pill) · no
- In-depth · Ruling · 390 / 1440 · mismatch · Ruling (VIEW CONTEXT panel, no head chips, no CARDS strip) · no
- Trade Balancer · default · 390 · match. Duplicate rows are the owner question.
- Trade Balancer · default · 1440 · mismatch · Frame header / ☰ (regression) · no
- Trade Balancer · printing picker · 390 / 1440 · match
- Card scanner · locking on · 390 · match. The missing hint line is the owner question.
- Card scanner · locking on · 1440 · mismatch · Frame header / ☰ (regression) · no
- Card scanner · camera error · reference only (no build partner by design)
- Life Tracker · Game setup · 390 / 1440 · match. Edit names / Done is the owner question.
- Life Tracker · Reset confirm · 390 / 1440 · match
- Life Tracker · Counters · 390 / 1440 · mismatch · Counters sheet height · no
- Life Tracker · Counters tab · 390 / 1440 · mismatch · Counters sheet height · no
- Life Tracker · table re-check · 390 / 1440 · match (identical to slice L's "after" capture and to the reference)

Test results:
- `npm run quality:check`: exit 0. Its final node test block reported 589 pass, 0 fail.
- `npm --workspace apps/frontend run test`: 146 files, 1486 tests, all passed, exit 0.
- `npm --workspace apps/backend run test`: 40 files, 519 tests, all passed, exit 0.

PRD/sections checks:
- `git diff --stat 02b21b5 HEAD -- PRD/sections` is empty, so the look pass wrote nothing there.
- `git diff origin/main...HEAD -- PRD/sections/functional-requirements.md | grep -E '^\+### REQ-2(0[6-9]|1[0-5])$'` returns REQ-206 through REQ-215, each added exactly once. Each heading also appears exactly once in the file at HEAD.
- For the amended ids, I compared each block at origin/main against HEAD. These 23 had changed: REQ-099, REQ-113, REQ-200, FLOW-010, FLOW-014, REQ-167, REQ-075, REQ-029, REQ-012, FLOW-005, REQ-005, REQ-056, FLOW-001, REQ-017, REQ-021, REQ-045, REQ-058, REQ-136, REQ-023, NFR-006, REQ-064, FLOW-009, REQ-202. Separately, the diff showed changed lines in REQ-114, -115, -127, -131, -067, -116, -128, -087, -025, -132, -121, -006, -007, -008, -018, -100, -065, -103, -107 and FLOW-007, -011, -016, -017, -018.
- 13 PRD/sections files changed in the PR (+1079/−519).
- Every A–Q criteria file has every `value: true`; all are self-reported, the known gap.

Boundaries:
- The remote branch reflog shows only "update by push" (39), with no forced update.
- No merge commits; slice A's commit is not in origin/main.
- Exactly one PR: #239, OPEN, `[THEJUDGE-AUTO][IN PROGRESS]`.
- No `.secrets`, `.playwright-mcp`, settings or CLAUDE.md paths in the diff.
- The only skill-file edits are `graph-implement/reference.md` in the `.agents` and `.claude` copies, inside the owner-resolution commit `add93b5`.

Final status:
- Worktree `git status --porcelain` printed nothing (clean). I wrote nothing in the repository; the comparison montages are in the scratchpad `review-montages/` folder.
- `cd /Users/chrismiho/Coding/Projects/TheJudge && git branch --show-current && git status --porcelain` printed `main` and ` M scripts/lib/boundary-rules.mjs`.
