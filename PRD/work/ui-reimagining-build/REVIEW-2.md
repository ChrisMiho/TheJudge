# Review 2 — node 7 attempt 2, run `graph-20260930-055958` (2026-10-02)

Fresh-context, no-write reviewer (opus) re-graded review 1's findings 1–6 against
the recaptured pairs at `1a000ff` (code tip `f850a34`), swept the untouched
screens for regressions, and re-ran every suite. Verdict: **RETURN TO BUILD**
(review loop 2 of 2 — the last the contract allows; a third return parks the run
for the owner). The driver copied the report below verbatim. Build attempt 10
fixes new finding 1 and the cheap Minors 2, 3, 5 and 6; Minors 4 and 7 are not
required.

## Reviewer's report (verbatim)

verdict: RETURN TO BUILD

Both Critical findings from review 1 are fixed, and all three test suites pass. One Important gap is still open: on the In-depth Cards step, the ＋ Add card / ▣ Scan row is still inside the step's panel. Slice N requirement 6 asks for it to sit as its own row under the rail, and the evidence marks it closed. A builder can fix it from the slice doc and tests; no product decision is needed.

Tree note: HEAD is `1a000ff`, not `f850a34`, and it equals the remote branch. That is one ledger-only commit on top of `f850a34`, touching only `PRD/work/ui-reimagining-build/GRAPH-RUN.md` (the build attempt 9 row and this dispatch prompt). Branch is `thejudge-auto/ui-reimagining-build-work` and the worktree is clean.

Re-grade of review 1's findings 1–6 (montages are build on the left, mockup on the right, in scratchpad `review2-montages/`):

1. Critical · O/P · header and ☰ clipped at 1440×900 — CLOSED.
   - Captures: `o/trade-balancer-build-1440x900.png` and `p/card-scan-build-1440x900.png` now show a full-width header with ☰ at the left edge. The scanner shows "Scan a card" and its ✕ exit. Neither page scrolls.
   - Code: `apps/frontend/src/index.css:105-109` (`.page-content-wide-fit`) and `:116-119` (`.page-content-narrow-fit`) no longer set `overflow: hidden`. Only `.page-shell-fit` (`:87-92`, viewport-wide) still clips. `.app-header` (`:132-144`: `width: 100vw`, `margin-left/right: calc(50% - 50vw)`, sticky, `z-index: 20`) can therefore reach the screen edge. The cause review 1 named is gone.
   - The 390×844 pairs are still correct.

2. Critical · L · Menu tray painted under the header, plus Theme band arrows — CLOSED.
   - Captures: `l/chrome-menu-build-{390x844,1440x900}.png` show the "Ask a Question" row (lit, with ✓) and Question History fully visible at both sizes. All six Theme cells fit, with no ‹ ›.
   - Code: `index.css:274-288` gives `.portal-shell-bounds` `z-index: 21`, one above the header's 20. The drawer keeps `z-index: 2` (`:475-479`) inside that box. The cause is gone.
   - `ThemeSection.tsx` sets inline `style={{ display: canScrollLeft ? "grid" : "none" }}` on both arrows (and the same for right), so the Tailwind `grid` class no longer overrides `hidden`. The track gap is now `gap-[2px]`.
   - The desktop floating card follows REQ-207 and is not a finding.

3. Important · N · In-depth details steps — partly closed; the Cards step is STILL OPEN.
   - Game (`n/in-depth-game-build-*`): CLOSED. `select.select-chevron` draws the accent chevron (`MtgAssistantApp.tsx`, `index.css`).
   - Cards (`n/in-depth-cards-build-*`): STILL OPEN. See new finding 1.
   - Placing: CLOSED in code. `ZoneCollectionStep.tsx:283-287` renders the carry note above the rail. But `n/in-depth-place-build-*` was not retaken and still shows no note (Minor 3). The type line is carried on accepted product truth: REQ-174 drops `typeLine` from the cards loaded up front, and the code renders it only when present (`EnrichmentStep.tsx:319`).
   - Context (`n/in-depth-context-build-*`): CLOSED for the head row (zone eyebrow / name / "1 / 1 cards" counter / Skip to review) and the two dashed rows (Add a note, More details). The inner bordered box review 1 named is the card-identity ring (`card-identity-ring ctx-sheet`, `EnrichmentStep.tsx:298`). REQ-058 (`functional-requirements.md:1274`, amended at `:1301` for this pass) requires that ring around every enrichment row, so the requirement wins on behaviour and this is not a finding. The missing type line rests on the same REQ-174 grounds as Placing. The target thumbnail is in code but is not shown in the capture, which has no target set.
   - Review (`n/in-depth-review-build-*`): CLOSED. The "Sending to TheJudge" panel, the OPTIONAL QUESTION box and the text "Send Request" pill are gone. "YOUR QUESTION — optional" sits above the split mic | send pill.
   - Ruling (`n/in-depth-ruling-build-*`): CLOSED. The head has "Ask a Question", a "◈ View context" chip and ↺, and a CARDS strip replaces the VIEW CONTEXT panel. "✎ Edit" is carried as an owner question with grounds (not graded).

4. Important · M · follow-up box — CLOSED. `m/ask-question-answered-build-{390x844,1440x900}.png` show the split mic | send pill with no "0/300" line. `FollowUpComposer` now renders `ComposerPill`.

5. Important · Q · Counters sheet height — CARRIED WITH GROUNDS. `slice-q.evidence.md` raises it as an owner question. I checked the grounds: `PRD/sections/screen-layout.md:103` ("Life Tracker's counter panel keeps DEC-139") and `:222-223`, and `functional-requirements.md:1947` (DEC-139) and `:4075`. `q/life-tracker-counters*-build-*` are unchanged.

6. Important · L · Send feedback — CLOSED. In `l/chrome-feedback-build-{390x844,1440x900}.png`:
   - "WHAT HAPPENED?" and "REPLY EMAIL (OPTIONAL)" are now uppercase eyebrows.
   - The snapshot notice is one dashed row ending in a ▾ chevron.
   - The phone sheet starts at about y≈220 (it was 155; the mockup is about 348). Most of the remaining height is the environment-only yellow "delivery isn't configured" line, which LOOK-GAPS excludes, plus the "FEEDBACK TYPE" eyebrow.
   - What is left is Minor 4.

New findings, most severe first:

1. Important · N · N9 / requirement 6 (and N3) · On the In-depth Cards step, ＋ Add card / ▣ Scan still sit inside the step's panel, under the zone tabs. Requirement 6 asks for "a row of their own under the rail (`.attach`), not inside the shelf panel", and the shelf still sits in a bordered box nested inside the panel.
   - Captures: `n/in-depth-cards-build-{390x844,1440x900}.png`. One panel holds, top to bottom: "ADD CARDS TO ZONES" heading and intro line → zone tabs → Add card/Scan → the plain grey "Stack order is bottom to top…" text → search field → a bordered box around the shelf → Continue. The mockup's order is: Add/Scan row → tabs → lit ⇄ hint → a panel holding only the shelf and Continue.
   - Code: `ZoneCollectionStep.tsx:367` opens `<div className="plate">`, and the `.attach` row is rendered inside it at `:410`. The comment at `:406-409` says "under the rail … not inside the shelf plate", which is not what the code does. `ZoneCardPicker.tsx:313` keeps the nested `rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4` box around the shelf.
   - `slice-n.evidence.md` ("Review 1 fix", Cards bullet) says closed.
   - The lit `.shelf-hint` exists only for 2+ cards (`ZoneCardPicker.tsx:318`), so this 1-card capture cannot show it, although the LOOK-GAPS state was two Stack cards.
   - Fix from the slice doc: move the `.attach` row (and the tabs) above the `.plate` and drop the inner border. Then recapture the pair in the LOOK-GAPS state (Stack 2, Battlefield 2, Hand 2).

2. Minor · N · N8 · Several In-depth build captures are not in the LOOK-GAPS state:
   - Cards has 1 card, not 6.
   - Context shows "1 / 1" with no target, not Bolt targeting Llanowar Elves, so the target-pill thumbnail is never shown.
   - Review has 1 card, so the zone filter pills and the 34dvh scroll cap are never shown.

3. Minor · N · N8 · `n/in-depth-place-build-*` was not retaken after the carry note was added, so the pair still shows no note. The evidence's claim that the old captures "already show in full" the content around it does not hold, because the space above the rail is visible and empty.

4. Minor · L · Send feedback at 1440×900 is about 667px tall, with roughly 70px of empty space below the Send button. The mockup's card is about 465px. Phone start is y≈220 against the mockup's ≈348.

5. Minor · N · Text on the Review step is stale. `EnrichmentStep.tsx:832` says "tap Send Request below", but the control is now an icon-only arrow whose accessible name is "Decrypt Stack" (`:895`).

6. Minor · M (regression risk) · The new global `.attach { margin-top: -0.2rem }` (`index.css:1355`) also applies to Ask a Question's `.flow-head .attach` (`QuickLookupApp.tsx:591`), because the more specific rule at `:1345` does not set a margin. That is about a 3px shift on a screen whose pairs were not retaken.

7. Minor · L (already present in review 1, not introduced by this fix) · In every build capture the header sits about 20px (phone) / 48px (desktop) below the top of the screen, while the mockup's header starts at y=0.

Regression sweep (step 5): no regression. I read one montage per viewport covering `l/chrome` at rest, `l/card-detail-sheet`, `l/chrome-history`, `m/ask-question` default, `m/ask-question-search`, `n/in-depth-zones`, `o/trade-balancer-printing`, `q/life-tracker-setup`, `q/life-tracker-reset`, and `q/life-tracker-table` against `l/life-tracker-after`. Each still matches as review 1 graded it. The table differs only in game state (one seat at 39), not in look.

Those captures were not retaken, so I also scanned the diff of the shared files:
- `ComposerPill` only adds two optional props; the default render is unchanged.
- The `ThemeSection` change appears only in the Menu, which was recaptured.
- The new CSS classes (`.carry-note`, `.ctx-tail`, `.more-row`, `.composer .q-lbl`, `select.select-chevron`, `.target-pill .thumb`) are used only in N's components.
- `.portal-shell-bounds` `z-index: 21` is `pointer-events: none` and empty at rest. The recaptured screens show the header unaffected.
- The one cross-screen spill is the 3px `.attach` margin (Minor 6).

Test results:
- `npm run quality:check`: exit 0; final node test block 589 tests, 589 pass, 0 fail.
- `npm --workspace apps/frontend run test`: 146 files passed, 1486 tests passed, exit 0.
- `npm --workspace apps/backend run test`: 40 files passed, 519 tests passed, exit 0.

PRD/sections and boundary checks (step 6):
- `git diff --stat 02b21b5 HEAD -- PRD/sections`: empty, so the look pass and the fix pass wrote no product truth.
- `git log --oneline --merges origin/main..HEAD`: empty (50 commits ahead, no merge commits).
- `gh pr list --head thejudge-auto/ui-reimagining-build-work --state all`: one PR, #239, OPEN, "[THEJUDGE-AUTO][IN PROGRESS] UI re-imagining (ui-reimagining-build)".
- Fix-pass diff (`77acb4a..HEAD`): no `.secrets`, settings, `CLAUDE.md`, graph-profile or skill paths.

Final status:
- Worktree `git status --porcelain`: empty. I wrote nothing in the repository; the montages are only in the scratchpad `review2-montages/` folder.
- `cd /Users/chrismiho/Coding/Projects/TheJudge && git branch --show-current && git status --porcelain`: `main` and ` M scripts/lib/boundary-rules.mjs`.
