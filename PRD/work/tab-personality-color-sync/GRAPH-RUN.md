# Graph run — tab-personality-color-sync

- Run ID: `graph-20261004-204628`
- Profile: `loaded (env sentinel)` (observed by graph-preflight at node 1)
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph canary `denied — tier armed (nohup true, lock held)`
- Autonomous base: `origin/thejudge-auto/tab-personality-color-sync` (rewritten to `origin/main` by the build half's claim)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-tab-personality-color-sync`
- Staging: none (inline request; no files or pasted markdown staged)
- Current node: `owner-action` (correction pass gate-qc PASS — spec-forming half stopped)
- Next action: owner answers REQ-219 in `GATE-QUESTIONS.md` + merges docs PR #258; then `/graph-implement PRD/work/tab-personality-color-sync/` builds it

## Correction

The first pass shaped the wrong surface: the in-app ☰ Menu tray rows. The owner
clarified the request means the **browser tab** (the Chrome/Firefox tab), not the
hamburger menu. Scope confirmed by the owner: the favicon, the document title, and
the mobile/PWA `theme-color` all carry personality and sync to the active colour
profile. One browser tab for the SPA, so the Q-219 A/B fork (one active colour vs
per-tab colour) is resolved — the single tab follows the active profile; no blocker
remains. A correction pass re-runs `define → gate-qc` under new run id
`graph-20261004-212625` on the same package, branch, and docs PR (#258 rewritten in
place). Rows below with dates after this note belong to the correction pass.

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | branch `thejudge-auto/tab-personality-color-sync` pushed from `.worktrees/kickoff-tab-personality-color-sync` (commit 9886f86); launch checkout unchanged (`main`); both canaries denied | 2026-10-04 |
| 2 | shape | sonnet | ok | `1 → 11` | `PRD/work/tab-personality-color-sync/` created (IDEA.md, README.md, STATUS.ideation); 10 `## Prior run` matches in IDEA.md; board row added under `## ideation` | 2026-10-04 |
| 3 | define | opus | ok | `0 → 52` | DESIGN-BRIEF.md + GATE-QUESTIONS.md written (REQ-219 proposed new; one `## Blocker questions` fork Q-219); STATUS.refining; zero `PRD/sections/` edits | 2026-10-04 |
| 4 | gate-qc | sonnet | failed | `1 → 13` | FAIL — 4 findings (F1 retired DEC-081 token clause → REQ-060/REQ-200; F2 DEC-104 "identical rows" is a code comment → cite DEC-135/shared-chrome; F3 add live deps REQ-060/REQ-200/REQ-059/DEC-135; F4 untestable acceptance wording); README Preparation gate updated; loops to define (attempt 2 of max 3) | 2026-10-04 |
| 3 | define | opus | ok | `1 → 25` | attempt 2: all 4 gate-qc findings fixed in DESIGN-BRIEF.md + GATE-QUESTIONS.md (DEC-081/DEC-104 citations removed; live deps REQ-060/REQ-200/REQ-059/DEC-135/NFR-006 added; measurable glyph-box acceptance bar); REQ-219 + Q-219 unchanged; citations re-verified against live PRD/sections/ | 2026-10-04 |
| 4 | gate-qc | sonnet | ok | `1 → 15` | attempt 2: PASS, 0 findings; all 4 prior findings verified resolved against live PRD; REQ-219 id free (last is REQ-217), 48px row ≥ NFR-001 44px, Q-219 confirmed genuine blocker; STATUS.refined; non-blocking note: DEC-135 is `retired` but the shared-chrome line carries the truth and REQ-219 cites it alongside — **STOP at first PASS** | 2026-10-04 |
| 3 | define | opus | ok | `1 → 40` | **correction pass** (run `graph-20261004-212625`): DESIGN-BRIEF.md + GATE-QUESTIONS.md rewritten for the browser tab (favicon + title + theme-color sync); REQ-219 content fully replaced, no blocker (A/B fork dropped); verified current state from code (no favicon, static `<title>TheJudge`, no theme-color meta, no manifest); reuse applyPalette.ts / useThemePalette.ts / tokens.css `[data-profile]` / motifSymbols.ts / BrandMark.tsx; removed retired DEC-149, cites live REQ-126/200/201/207/216/099; STATUS.refined | 2026-10-04 |
| 4 | gate-qc | sonnet | ok | `1 → 12` | **correction pass**: PASS, 0 findings on first grade; all cited ids verified live (REQ-126/200/201/207/216/099; no retired id cited; DEC-149 only in history); REQ-219 free (last id REQ-217; REQ-218 reserved by anchor-ask-composer); current-state premises confirmed from code; every acceptance criterion has a checkable bar; STATUS.refined — **STOP at first PASS**. Non-blocking for map-out: pin the exact title string (brief shows `TheJudge · MTG Assistant` as an example) | 2026-10-04 |

## Open gate

- State: PARKED at `owner-action` (correction-pass gate-qc PASS, 2026-10-04). Spec-forming half complete for the **browser-tab** feature.
- Docs PR: https://github.com/ChrisMiho/TheJudge/pull/258 (docs-only, into `main`; rewritten in place for the browser tab)
- Question: answer the one verdict slot in `PRD/work/tab-personality-color-sync/GATE-QUESTIONS.md` — **REQ-219** (accept/edit/reject): the browser tab (favicon + document title + mobile `theme-color`) carries personality and syncs to the active colour profile. **No blocker** — the earlier Q-219 A/B colour fork is resolved (one browser tab follows the one active profile).
- Evidence: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, this ledger; correction-pass gate-qc PASS with 0 findings. Current state confirmed: no favicon, static `<title>TheJudge`, no `theme-color` meta, no manifest — the feature adds all three. Non-blocking for map-out: pin the exact title string.
- Resume command (after you answer REQ-219 and merge the docs PR to `main`): `/graph-implement PRD/work/tab-personality-color-sync/`

## Dispatch prompts

### preflight

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of an autonomous graph run. Invoke the `graph-preflight` skill (Skill tool, skill name `graph-preflight`) and follow it exactly. Do not deviate, do not improvise repairs, do not remove any sentinel.

Inputs for this run:
- --branch thejudge-auto/tab-personality-color-sync
- --slug tab-personality-color-sync
- --run-id graph-20261004-204628
- base defaults to origin/main

Procedure per the skill:
1. Run the dry run first:
   `npm run graph:preflight -- --branch thejudge-auto/tab-personality-color-sync --slug tab-personality-color-sync --run-id graph-20261004-204628 --dry-run`
   Report the `shape:`, resolved `base:`, `worktree:`, planned commands, and both profile sentinel / `Profile:` lines verbatim.
2. If it exits 1 (dirty in-place tree) or 2 (stop sentinel, lock held, branch collision, existing kickoff worktree), STOP and relay its message verbatim — do not hand-resolve anything.
3. Otherwise re-run the identical command WITHOUT `--dry-run`, same explicit --run-id. This takes the lock and creates/pushes the branch in the kickoff worktree.
4. Issue the liveness canaries as real Bash tool calls:
   - The universal `CANARY_COMMAND` the script prints — require the hook to DENY it; the deny reason text is the proof. Classify and report its ledger line.
   - After the lock is taken, the `GRAPH_CANARY_COMMAND` the script prints — require a DENY while the lock is held. Report its ledger line.
   - If EITHER canary is ALLOWED, report BLOCKED verbatim and STOP — do not continue.
5. Confirm the end state: in the kickoff worktree `git branch --show-current` is `thejudge-auto/tab-personality-color-sync`, `git ls-remote --heads origin thejudge-auto/tab-personality-color-sync` shows it pushed, and `git branch --show-current` at the launch root is UNCHANGED.

Report back, clearly and verbatim where the skill asks:
- the `shape:` line
- the resolved `base:` line
- the absolute `worktree:` path (the kickoff worktree)
- the lock record (state + contents)
- the universal canary ledger line
- the graph canary ledger line
- the `Profile:` line
- confirmation the launch root branch is unchanged (name it)

Report evidence as commands and their output, never bare claims. End with a one-line status: preflight OK (ready for node 2) or BLOCKED (with the reason).

### shape

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-tab-personality-color-sync

You are node 2 (`shape`) of an autonomous graph run. Invoke the `thejudge-kickoff` skill (Skill tool, skill name `thejudge-kickoff`) and follow it exactly in graph-controlled mode. Because `graph is controlling`, do NOT stop to ask the user questions or wait for approval — capture the idea and hand back.

Run all work inside the working directory above (the kickoff worktree), never the launch checkout. Copy the `Working directory:` line unchanged into any prompt you write for a sub-subagent.

The slug is already decided: use `tab-personality-color-sync` exactly (the branch and package share this one name). Run ID: `graph-20261004-204628`.

The owner's request, verbatim — capture this as the idea:

"i noticed the tabs for the app are kinda plain and boring, can we bring some personality to the tab? can we have it sync up with its respective color profile even?"

Do per the skill:
1. Load the minimal onboarding context the skill specifies (root README.md + PRD/README.md).
2. Create the work package at `PRD/work/tab-personality-color-sync/` with `IDEA.md` capturing the request verbatim and set `STATUS.ideation`.
3. Grep `PRD/instructions/receipts/` for prior runs against the same ground (tabs, color identity, UI theming, color profiles) and write one `## Prior run` line per match into `IDEA.md` — a flat list of matches, paths only, no chain-walking, do not open the cited receipts beyond the grep hit.
4. Do NOT decide product truth. Do NOT open or fetch any document a source cites. If the request genuinely cannot be turned into an actionable package, return `NO ACTIONABLE PACKAGE` with the reason.

Report back:
- the package path created
- the STATUS marker set
- a short note on what IDEA.md captured
- any `## Prior run` matches found (paths)
- whether you hit NO ACTIONABLE PACKAGE (and why) or the package is ready for node 3 (define)
Report evidence as commands/paths, not bare claims. End with a one-line status: shape OK (ready for define) or NO ACTIONABLE PACKAGE (reason).

### define

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-tab-personality-color-sync

You are node 3 (`define`) of an autonomous graph run. Invoke the `thejudge-refinement` skill (Skill tool, skill name `thejudge-refinement`) and follow it exactly in graph-controlled mode. Because `graph is controlling`, do NOT stop for the usual rounds of clarifying questions or for explicit user approval — apply the assumption ladder in `PRD/instructions/preparation-contract.md` per question, record any genuine decision blocker in `GATE-QUESTIONS.md` under `## Blocker questions`, and hand back. The owner reviews asynchronously via the gate.

Run all work inside the working directory above (the kickoff worktree), never the launch checkout. Copy the `Working directory:` line unchanged into any prompt you write for a sub-subagent.

The package is `PRD/work/tab-personality-color-sync/`. Read its `IDEA.md` (the owner's request and 10 prior-run receipt pointers). Run ID: `graph-20261004-204628`.

Your job: shape the idea into `DESIGN-BRIEF.md`, and propose the `PRD/sections/` product truth it needs as the exact diff in `GATE-QUESTIONS.md` (one `## <STABLE-ID>` block per new/changed stable ID, each opening with the gate-question plain-language block from `PRD/instructions/plain-language-standard.md`, then the complete diff, then `- Verdict:` and `- Reason:` slots). Do NOT edit `PRD/sections/` — the proposal lives entirely in the work folder; implementation applies it later.

Grounding (a hard-won repo lesson — do not skip): this is a UI feature about how the app's tabs look and how they relate to the existing MTG color-identity / color-profile theming. Code-reading alone has produced wrong requirement premises here before. Before you state any premise about the current tabs or the existing color-profile system, verify it against the real code (find the actual tab components and the color-identity/theming source) — and against the live UI if you can reasonably run the app or its mockup. Do not assert what the tabs currently look like or how color profiles currently map without checking. Note in the brief where you verified live vs. from code.

Scope discipline: resolve what you reasonably can with the assumption ladder (e.g. sensible defaults for which tabs, what "personality" concretely means) and record those as decided-with-rationale in the brief. Reserve `GATE-QUESTIONS.md` blocker slots for genuine product forks only — the three-condition genuine-blocker test, never waived. Every new stable ID you propose gets its own accept/edit/reject slot.

Do NOT open or fetch any document a source cites; cite paths only.

Report back:
- the brief path and a 2-3 sentence summary of the shaped design (lead with what a player sees/does)
- whether `GATE-QUESTIONS.md` was written, and if so the list of stable IDs proposed (and any `## Blocker questions`)
- where you verified premises live vs. from code
- the STATUS marker now set (refining or refined)
End with a one-line status: define OK (ready for gate-qc) — note if GATE-QUESTIONS.md was written or not.

### gate-qc

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-tab-personality-color-sync

You are node 4 (`gate-qc`) of an autonomous graph run. Invoke the `thejudge-quality-check` skill (Skill tool, skill name `thejudge-quality-check`) and follow it exactly in graph-controlled mode. Because `graph is controlling`, do NOT stop to ask the user anything — produce a PASS/FAIL report and hand back.

Run all work inside the working directory above (the kickoff worktree), never the launch checkout. Copy the `Working directory:` line unchanged into any prompt you write for a sub-subagent.

The package is `PRD/work/tab-personality-color-sync/`. Run ID: `graph-20261004-204628`.

Validate `PRD/work/tab-personality-color-sync/DESIGN-BRIEF.md` for PRD alignment and agent-readiness, per the skill. Produce a PASS/FAIL report. Do NOT write a GAMEPLAN or slice docs — that is a later node. On FAIL, set `STATUS.refining` and list the complete findings. On PASS, leave the package ready to stop at this gate.

Also update the package README's `## Preparation gate` section with the result, using the exact shape from the preparation-contract (Quality-check: PASS | FAIL, Checked artifact, Findings).

Note the proposal in `GATE-QUESTIONS.md`: REQ-219 (new) plus one `## Blocker questions` fork (Q-219). The brief is what you grade; it should be consistent with that proposal.

Report back:
- the verdict (PASS or FAIL)
- the complete findings list (none, or each issue)
- the STATUS marker now set
- confirmation the README `## Preparation gate` section was updated
Report evidence as paths/quotes, not bare claims. End with a one-line status: gate-qc PASS or gate-qc FAIL (with the finding count).

### define (attempt 2)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-tab-personality-color-sync

You are node 3 (`define`), attempt 2, of an autonomous graph run — a gate-qc FAIL loop. Invoke the `thejudge-refinement` skill (Skill tool, skill name `thejudge-refinement`) and follow it exactly in graph-controlled mode. Because `graph is controlling`, do NOT stop for clarifying questions or approval — apply the assumption ladder per question, record any genuine blocker in `GATE-QUESTIONS.md` under `## Blocker questions`, and hand back.

Run all work inside the working directory above (the kickoff worktree), never the launch checkout. Copy the `Working directory:` line unchanged into any prompt you write for a sub-subagent.

The package is `PRD/work/tab-personality-color-sync/`. Run ID: `graph-20261004-204628`. The brief and GATE-QUESTIONS.md (REQ-219 + blocker Q-219) already exist from attempt 1. Your job this pass is to FIX the 4 quality-check findings below in `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md`, keeping the sound design direction and Q-219 intact. Verify every citation against the live `PRD/sections/` truth before you write it — the findings are specifically about citing retired or wrong authorities.

Findings to fix:
1. Stale token rule. The brief and REQ-219's Constraints cite retired DEC-081's 'no new token roles'. Live REQ-060 (functional-requirements.md ~line 1362) says that clause is superseded by REQ-200's named surface roles. Restate as: reuse the four accent tokens plus REQ-200 surface roles, no per-component overrides, define the rest/hover/current treatment once through shared semantic styling (per REQ-060 Constraints). Remove the DEC-081 citation.
2. Wrong authority for the 'identical rows' refinement. The brief and REQ-219 claim to refine DEC-104 'rendered identically'. The PRD never says that — DEC-104 (retired) only adds action entries, and 'rendered identically in array order' is a code comment at FeaturePortalMenu.tsx:45. The real PRD rule on row presentation is DEC-135 and the shared-chrome line 'Rows render full-bleed ... active entry keeps a check mark and quiet fill'. Cite DEC-135 / shared-chrome instead, say REQ-219 adds per-row identity within that rule, and KEEP the active-row check mark in the acceptance criteria.
3. Missing live dependencies. REQ-219 currently depends only on retired DEC rows plus REQ-067/206/207/213. Add the live deps: REQ-060 (ambient accent hierarchy, which REQ-219 extends to the tray rows), REQ-200 (surface roles), REQ-059 (motion baseline), DEC-135. State that REQ-060's inventory is a minimum, so no REQ-060 amendment is needed.
4. Untestable acceptance wording. 'bolder, consistently-sized identity mark' and 'livelier' have no checkable bar. Give a measurable criterion — e.g. one shared glyph box size for all five rows, larger than today's, with the accent applied through tokens — so build and review can pass or fail it.

Do NOT edit `PRD/sections/`. Do NOT open or fetch any document a source cites; cite paths only. Keep REQ-219 the one stable ID and Q-219 the one blocker unless a finding forces otherwise (it should not).

Report back:
- a short note confirming each of the 4 findings is addressed, with the corrected citation/wording for each
- the stable IDs in GATE-QUESTIONS.md now (should still be REQ-219 + Q-219)
- the STATUS marker now set
End with a one-line status: define OK (ready for gate-qc re-grade).

Transcription note: the owner-facing run quoted technical PRD/code spans in this prompt. In the dispatch prompt as sent, the embedded fragments 'no new token roles', 'identical rows', 'rendered identically', 'rendered identically in array order', 'Rows render full-bleed ... active entry keeps a check mark and quiet fill', and 'bolder, consistently-sized identity mark' were straight-double-quoted; they are transcribed here with single quotes because they are citations of PRD/code/finding text, not user instructions, and the delimiter change preserves every word.

### gate-qc (attempt 2)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-tab-personality-color-sync

You are node 4 (`gate-qc`), attempt 2 (re-grade after a define fix), of an autonomous graph run. Invoke the `thejudge-quality-check` skill (Skill tool, skill name `thejudge-quality-check`) and follow it exactly in graph-controlled mode. Because `graph is controlling`, do NOT stop to ask the user anything — produce a PASS/FAIL report and hand back.

Run all work inside the working directory above (the kickoff worktree), never the launch checkout. Copy the `Working directory:` line unchanged into any prompt you write for a sub-subagent.

The package is `PRD/work/tab-personality-color-sync/`. Run ID: `graph-20261004-204628`.

Validate `PRD/work/tab-personality-color-sync/DESIGN-BRIEF.md` for PRD alignment and agent-readiness, per the skill. Grade the brief fresh — do not assume the prior findings are fixed; verify. The attempt-1 FAIL raised 4 findings now claimed fixed: (1) retired DEC-081 token clause replaced with REQ-060/REQ-200 surface-role wording, (2) the DEC-104 'identical rows' mis-citation replaced with DEC-135 / shared-chrome authority with the active-row check mark kept, (3) live dependencies REQ-060/REQ-200/REQ-059/DEC-135 added, (4) a measurable glyph-box acceptance bar replacing the untestable wording. Confirm each against the live PRD/sections/ truth and against the brief and GATE-QUESTIONS.md.

Produce a PASS/FAIL report. Do NOT write a GAMEPLAN or slice docs. On FAIL, set `STATUS.refining` and list the complete findings. On PASS, set `STATUS.refined` and leave the package ready to stop at this gate. Update the package README's `## Preparation gate` section with the result (Quality-check: PASS | FAIL, Checked artifact, Findings), exact preparation-contract shape.

The proposal in GATE-QUESTIONS.md is REQ-219 (new) + one blocker Q-219.

Report back:
- the verdict (PASS or FAIL)
- for each of the 4 prior findings, whether it is now resolved (with the citation/wording you verified)
- any NEW findings
- the STATUS marker now set
- confirmation the README `## Preparation gate` section was updated
Report evidence as paths/quotes, not bare claims. End with a one-line status: gate-qc PASS or gate-qc FAIL (with the finding count).

Transcription note: the single embedded fragment 'identical rows' was straight-double-quoted in the dispatch prompt as sent; transcribed here with single quotes because it is a citation of a prior finding, not a user instruction.

### define (correction pass — run graph-20261004-212625)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-tab-personality-color-sync

You are node 3 (`define`) of an autonomous graph run — a CORRECTION pass after the owner clarified the request. Invoke the `thejudge-refinement` skill (Skill tool, skill name `thejudge-refinement`) and follow it in graph-controlled mode. Because `graph is controlling`, do NOT stop for clarifying questions or approval — apply the assumption ladder per question, record any genuine blocker under `## Blocker questions`, and hand back.

Run all work inside the working directory above (the kickoff worktree), never the launch checkout. Copy the `Working directory:` line unchanged into any prompt you write for a sub-subagent. Run ID: `graph-20261004-212625`. Package: `PRD/work/tab-personality-color-sync/`.

IMPORTANT — the first pass shaped the WRONG surface and must be rewritten. The existing DESIGN-BRIEF.md and GATE-QUESTIONS.md describe the in-app hamburger Menu tray rows. That is wrong. The owner said, verbatim: "i think theres been a misunderstanding, im talking about the chrome or mozilla tab, not the hamburger menu". The feature is the actual BROWSER TAB — what Chrome/Firefox shows for the page — not any in-app navigation.

Rewrite DESIGN-BRIEF.md and GATE-QUESTIONS.md for this corrected feature:
- Surface: the browser tab. Owner-confirmed scope covers all three of these, each gaining personality and syncing to the active colour profile:
  1. the favicon (the tab icon) — give it personality and recolour it to the active profile;
  2. the document title shown in the tab — may carry a touch of personality;
  3. the mobile/PWA theme-color meta (the browser chrome/address-bar tint) — sync to the active profile.
- Colour sync: the app runs in one browser tab (single-page app), so the tab follows the ONE active colour profile the player has chosen. The previous A/B fork (one active colour vs per-tab fixed colour) is RESOLVED by this — drop blocker Q-219 unless you find a genuinely new one.
- Reuse the stable id REQ-219 but replace its entire content with the browser-tab feature. One accept/edit/reject slot for REQ-219; add a blocker slot only for a real new fork.

Grounding (a hard-won repo lesson — do not skip, and the first pass already picked the wrong premise once): verify the CURRENT state against real code before writing any premise. Find and read the real sources: the app HTML entry/head (favicon link, document title, any `theme-color` meta), the PWA/web-app manifest if any, any code that sets `document.title` or swaps the favicon or the theme-color at runtime, and how the active colour profile/theme is represented (the palette tokens and the `data-profile`/accent mechanism). Confirm what exists today (static favicon? fixed theme-color? any dynamic title?) and cite file paths and line numbers. Verify in the live app/mockup if you can reasonably run it. Note in the brief where each premise was verified live vs. from code.

Citation discipline (the first pass FAILed gate-qc on these): cite only LIVE `PRD/sections/` truth, never retired decisions. Add the real live dependencies the feature touches (theming/accent tokens, any performance or accessibility NFRs that apply) and verify each exists before citing. Give every acceptance criterion a measurable, checkable bar — no vague wording like livelier or bolder.

Do NOT edit `PRD/sections/`. Do NOT open or fetch any document a source cites; cite paths only.

Report back:
- the brief path and a 2-3 sentence summary (lead with what a player sees in their browser tab)
- the stable IDs in GATE-QUESTIONS.md now, and whether any blocker remains
- what you found about the CURRENT favicon/title/theme-color setup, with file paths/lines, and where you verified live vs from code
- the STATUS marker now set
End with a one-line status: define OK (ready for gate-qc) — note GATE-QUESTIONS.md written.

### gate-qc (correction pass — run graph-20261004-212625)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-tab-personality-color-sync

You are node 4 (`gate-qc`) of an autonomous graph run — grading the CORRECTED browser-tab brief. Invoke the `thejudge-quality-check` skill (Skill tool, skill name `thejudge-quality-check`) and follow it in graph-controlled mode. Because `graph is controlling`, do NOT stop to ask the user anything — produce a PASS/FAIL report and hand back.

Run all work inside the working directory above (the kickoff worktree), never the launch checkout. Copy the `Working directory:` line unchanged into any prompt you write for a sub-subagent. Run ID: `graph-20261004-212625`. Package: `PRD/work/tab-personality-color-sync/`.

Context: the earlier PASS was against a wrong (Menu-tray) brief and is superseded. The brief and GATE-QUESTIONS.md were rewritten this pass for the BROWSER TAB — the favicon, the document title, and the mobile/PWA `theme-color`, all syncing to the active colour profile. REQ-219 is reused with entirely new content; no blocker.

Grade `PRD/work/tab-personality-color-sync/DESIGN-BRIEF.md` fresh for PRD alignment and agent-readiness. Verify specifically:
- Every cited authority is LIVE in PRD/sections/ (no retired decisions). The pass claims to cite REQ-126, REQ-200, REQ-201, REQ-207, REQ-216, REQ-099 and to have removed a retired DEC-149 — confirm each cited id exists and is live, and that no retired id is cited as a new claim.
- The current-state premises are accurate: confirm (from code) that there is today no favicon link, a static <title>TheJudge, and no theme-color meta / manifest, as the brief states.
- Every acceptance criterion has a measurable, checkable bar.
- REQ-219 is a free/appropriately-reused stable id and consistent with the brief.

Produce a PASS/FAIL report. Do NOT write a GAMEPLAN or slice docs. On FAIL, set `STATUS.refining` and list the complete findings. On PASS, set `STATUS.refined` and leave the package ready to stop at this gate. Update the package README `## Preparation gate` section with the result (exact preparation-contract shape).

Report back:
- the verdict (PASS or FAIL)
- the complete findings list (none, or each issue with the authority/line you checked)
- confirmation of the current-state premises (favicon/title/theme-color)
- the STATUS marker now set
- confirmation the README `## Preparation gate` section was updated
Report evidence as paths/quotes, not bare claims. End with a one-line status: gate-qc PASS or gate-qc FAIL (with the finding count).

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "i noticed the tabs for the app are kinda plain and boring, can we bring some personality to the tab? can we have it sync up with its respective color profile even?" | answered-once | shape | — |
| "i think theres been a misunderstanding, im talking about the chrome or mozilla tab, not the hamburger menu" | answered-once | define | — |
| Scope answer: browser-tab personality + colour sync covers the favicon, the document title, and the mobile/PWA theme-color (owner selection, correction pass) | answered-once | define | — |
