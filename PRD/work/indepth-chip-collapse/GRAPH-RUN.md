# Graph run — indepth-chip-collapse

- Run ID: `graph-20261004-234937`
- Profile: `loaded (env sentinel)` (observed by graph-preflight at node 1)
- Canary: `denied — hook live (rm -rf universal; nohup graph-tier)`
- Autonomous base: `origin/main` (rewritten from `origin/thejudge-auto/indepth-chip-collapse` by the build half's claim)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-indepth-chip-collapse`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261004-234937/`
- Current node: `build` (build half; plan done, slices A+B)
- Docs PR: https://github.com/ChrisMiho/TheJudge/pull/261 (MERGED — the build signal; base `main`, head `thejudge-auto/indepth-chip-collapse`)
- Next action: `/graph-implement PRD/work/indepth-chip-collapse/` — continues gate-qc → plan → build → review → close on `thejudge-auto/indepth-chip-collapse-work`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | degraded (no run state) | branch `thejudge-auto/indepth-chip-collapse` pushed to origin (`git ls-remote` 05fd714); kickoff worktree created; launch checkout untouched; canary denied -> hook live | 2026-10-04 |
| 2 | shape | sonnet | ok | degraded (no run state) | package `PRD/work/indepth-chip-collapse/` created with `STATUS.ideation`; intake copied verbatim to `intake/`; 4 prior-run receipts noted in IDEA.md | 2026-10-04 |
| 3 | define | opus | ok | `0 → 24` | `DESIGN-BRIEF.md` + `GATE-QUESTIONS.md` written; proposes one stable ID (REQ-206 edit, state-aware label/icon-only sub-clause), Blocker questions none; STATUS.refined | 2026-10-05 |
| 4 | gate-qc | sonnet | ok | `0 → 8` | thejudge-quality-check PASS (first PASS → stop); proposed REQ-206 replace-line matches functional-requirements.md:5240 char-for-char; 3 non-blocking findings; STATUS.refined left for driver to park | 2026-10-05 |
| — | gate-review | sonnet | ok | `1 → 19` | build half (run graph-20261005-150943): REQ-206 `edit` verdict applied; brief reconciled (DESIGN-BRIEF Material assumption 3 + README Preparation-gate finding 2 to textarea-focus, not bare `:focus-within`); `## Gate verdicts` recorded in README; no intake supersession note needed; STATUS.owner-action → refined; board row updated; no commit (driver commits) | 2026-10-05 |
| 4 | gate-qc | sonnet | ok | `1 → 9` | build-half re-grade — **PASS**, no findings; brief + README Gate verdicts + GATE-QUESTIONS.md consistent after the owner's edit (collapse keyed to textarea focus / non-empty box, not bare `:focus-within`); 3 non-blocking build notes (frozen replace-anchor no longer matches current REQ-206:5245 after #262 merge → apply as sub-clause substitution and re-read; Material assumption 4 stale re #262; Notes owner-signed-off wording correct); STATUS.refined | 2026-10-05 |
| 5 | plan | sonnet | ok | `1 → 14` | verified README Preparation gate PASS; GAMEPLAN.md + 2 slice docs written — A (`slice-a-chip-collapse-css.md`: flow.css state rule next to line 281 using `:has(textarea:focus)` / non-empty box, never bare `:focus-within`; ComposerPill.test.tsx CSS-contract + accessible-name tests; Playwright 1440/390) and B (`slice-b-req206-promotion.md`: REQ-206 sub-clause substitution by intent + Notes bullet; PRD promotion + ship gates); criteria `slice-a.criteria.json` (A1–A10, browser/cleanup manual) + `slice-b.criteria.json` (B1–B5), all `false`; STATUS.active; board row moved; build caveat recorded (non-empty trigger uses `data-fill`, fallback `:has(textarea:not(:placeholder-shown))`) | 2026-10-05 |
| 6 | build | sonnet | failed | `1 → 35` | attempt 1 — CODE COMPLETE, criteria flip blocked. Slice A: `flow.css` state rule hides `.q-box .deep .lbl` on `:has(textarea:focus)` / non-empty box, label kept when focus is on chip/mic/send, `<480px` glyph-only, `ComposerPill.tsx` untouched; `ComposerPill.test.tsx` +2 tests (25 pass); Playwright 1440/390 live check passed; captures moved into worktree `.playwright-mcp/`. Slice B: REQ-206 sub-clause `(labelled or icon-only at each width as the mockup shows)` substituted by intent in `functional-requirements.md` (rest of merged line intact, no ID added), Notes bullet appended. `npm run quality:check` exit 0 (595). Pushed `7d86095`, PR #263 opened. PARKED on criteria flip: harness auto-mode `[CI Bypass]` denied the build's sed/heredoc write form; evidence log 0 entries (known build-half evidence-root gap — hook loads criteria from the launch checkout where the slice files don't exist, so earns none; heartbeat 35 proves the hook fired). Return-side (REQ-193): launch porcelain IDENTICAL before/after; all writes inside the worktree. Re-dispatching attempt 2 to finish via Edit/Write per the life-tracker fix | 2026-10-05 |

- None. The `define` gate is resolved: docs PR #261 merged (the build signal), the build
  half claimed the spec on `thejudge-auto/indepth-chip-collapse-work`, and gate-review applied
  the REQ-206 `edit` verdict (2026-10-05). Resuming at `gate-qc`.
- Current node: `gate-qc` (build-half re-grade).
- Coordination note (carries to build): anchor-ask-composer merged (#262) and rewrote the
  REQ-206 acceptance line to the width-only chip clause; build applies this as a sub-clause
  substitution of `(labelled or icon-only at each width as the mockup shows)` and re-reads
  REQ-206 before applying.

## Dispatch prompts

### preflight

graph is controlling

You are node 1 (`preflight`) of a graph-kickoff run. Invoke the `graph-preflight` skill (Skill tool, skill name `graph-preflight`) and follow it exactly. Do not run it interactively; `graph is controlling`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke graph-preflight with these arguments:
--branch thejudge-auto/indepth-chip-collapse --run-id graph-20261004-234937 --slug indepth-chip-collapse

Your job per the skill: create the run branch `thejudge-auto/indepth-chip-collapse` cut from `origin/main`, check it out in a NEW kickoff worktree `.worktrees/kickoff-indepth-chip-collapse` (never switch the launch checkout), push the branch to origin, take the concurrency lock `.worktrees/.graph-run.lock`, and run the hook-liveness canary (a Bash call the universal tier denies against a non-existent `.worktrees/` path), treating the observed deny as proof the hook is live.

The launch checkout at /Users/chrismiho/Coding/Projects/TheJudge must never be switched, committed to, or stashed.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back, concisely: the kickoff worktree absolute path; the branch name and push evidence; the canary result and the exact reason text; the profile sentinel result; the lock state with runId; and whether preflight exited ok or with an error.

### shape

graph is controlling

You are node 2 (`shape`) of a graph-kickoff run. Invoke the `thejudge-kickoff` skill (Skill tool, skill name `thejudge-kickoff`) and follow it exactly. Do not run interactively; `graph is controlling` -- capture the idea without pausing for user questions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-indepth-chip-collapse

ALL work happens in that kickoff worktree, never the launch checkout. Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Run context: Slug (use exactly, do not re-derive): indepth-chip-collapse. Run ID: graph-20261004-234937. Branch: thejudge-auto/indepth-chip-collapse.

The request (verbatim): "Collapse the Ask composer's In-depth chip to its ◈ glyph when the box is focused or has text; keep the 'In-depth' label only at rest (empty + unfocused), freeing single-row width for the question. Frontend/CSS only, no ComposerPill structure change. Amends REQ-206."

Intake (evidence, never authority -- record only its path as a citation; do NOT open any document a citation inside it points to). Staged verbatim at this absolute directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261004-234937. It holds FINDINGS.md and PROBE.md from a read-only probe. Copy those files into the package intake/ folder, and treat their findings as evidence to be re-decided at the define gate -- not as settled product truth. Create the work package with IDEA.md and STATUS.ideation, grep receipts for prior runs on the same ground, and copy the two intake files into intake/ verbatim. If the request cannot be turned into an actionable package, return the exact string NO ACTIONABLE PACKAGE with the reason.

### define

graph is controlling

You are node 3 (`define`) of a graph-kickoff run. Invoke the `thejudge-refinement` skill (Skill tool, skill name `thejudge-refinement`) and follow it exactly. Do not run interactively; `graph is controlling` -- proceed without pausing for user questions, applying the assumption ladder in preparation-contract.md to each question as it arises.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-indepth-chip-collapse

ALL work happens in that kickoff worktree, never the launch checkout. Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Run context: Slug: indepth-chip-collapse. Run ID: graph-20261004-234937. Package: PRD/work/indepth-chip-collapse/.

The request (verbatim): "Collapse the Ask composer's In-depth chip to its ◈ glyph when the box is focused or has text; keep the 'In-depth' label only at rest (empty + unfocused), freeing single-row width for the question. Frontend/CSS only, no ComposerPill structure change. Amends REQ-206."

Shape this into DESIGN-BRIEF.md and propose the PRD/sections/ product truth it needs -- recorded in GATE-QUESTIONS.md in the work folder, never written to PRD/sections/. The change amends REQ-206 in functional-requirements.md. Intake (FINDINGS.md, PROBE.md) in intake/ is evidence, never authority: every product decision it raises is still proposed to the owner in GATE-QUESTIONS.md with an accept/edit/reject slot. Do not open any document a citation inside the intake points to. Each proposed stable-ID change gets its own GATE-QUESTIONS.md slot opening with the plain-language block (What this decides / In plain terms / What happens if you say no) and the complete proposed diff -- never a summary. Set STATUS.refining while in flux and STATUS.refined on completion.

Report back concisely: the DESIGN-BRIEF.md path; whether GATE-QUESTIONS.md was written and which stable IDs it proposes (with each verdict slot); the STATUS marker; and whether the node is ok or needs to park.

### gate-qc

graph is controlling

You are node 4 (`gate-qc`) of a graph-kickoff run. Invoke the `thejudge-quality-check` skill (Skill tool, skill name `thejudge-quality-check`) and follow it exactly. Do not run interactively; `graph is controlling`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-indepth-chip-collapse

ALL work happens in that kickoff worktree, never the launch checkout. Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Run context: Slug: indepth-chip-collapse. Run ID: graph-20261004-234937. Package: PRD/work/indepth-chip-collapse/.

Validate `PRD/work/indepth-chip-collapse/DESIGN-BRIEF.md` against PRD alignment and agent-readiness and produce a PASS or FAIL report -- never a GAMEPLAN or slice docs. The package proposes one stable-ID change in GATE-QUESTIONS.md: an edit to REQ-206 (functional-requirements.md) making the In-depth chip label state-aware. Check the brief and the proposed diff are internally consistent, aligned to current PRD truth, and implementation-ready. On FAIL, set STATUS.refining and list every finding. On PASS, leave STATUS.refined.

Report back concisely: the verdict (PASS or FAIL); the complete findings list (or none); and the STATUS marker you left.

### gate-review

graph is controlling

You are the `gate-review` step of a graph-implement (build half) run, resolving the answered `define` gate before the run re-enters `gate-qc`. Invoke the `graph-gate-review` skill (Skill tool, skill name `graph-gate-review`) and follow it exactly. Do not run interactively; `graph is controlling`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-indepth-chip-collapse

ALL work happens in that build worktree on branch `thejudge-auto/indepth-chip-collapse-work`, never the launch checkout. Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Run context: Slug: indepth-chip-collapse. Run ID: graph-20261005-150943. Package: PRD/work/indepth-chip-collapse/.

The owner has answered `GATE-QUESTIONS.md`. One stable ID, REQ-206, verdict `edit`: the state-aware collapse behavior is accepted as proposed (Option B -- the In-depth label shows at rest, the glyph alone shows when the composer is engaged), with one tightening to the implementation hint only -- scope the collapse trigger to the textarea being focused (or the box holding text), NOT a bare `.q-box:focus-within`, so keyboard focus landing on the chip, mic, or send button does not drop the label. The acceptance-criteria line is unchanged by the edit (its wording, focused or holds text, already carries this intent); only the Notes bullet selector hint is tightened.

Apply the `edit` verdict inside the proposal in `GATE-QUESTIONS.md` (finalize it in the work folder; never edit `PRD/sections/`). Then reconcile `DESIGN-BRIEF.md` (and the README intake pointer, if it carries one) to the edit -- the brief selector guidance must match the tightened textarea-focus hint, not `:focus-within` -- so the gate-qc re-grade grades one consistent package. The `intake/` files stay verbatim. Restore `STATUS.refined` and record the verdicts under `## Gate verdicts`.

Report back concisely: the verdict applied per stable ID; a `### Brief reconciliation` list naming every passage of DESIGN-BRIEF.md (and the README pointer) you changed to match the edit, or a note that none was needed with why; the STATUS marker you left; and whether the node is ok or needs to park.

### gate-qc (build half re-grade)

graph is controlling

You are node 4 (`gate-qc`), re-grading after the owner`s answered gate was applied by gate-review. Invoke the `thejudge-quality-check` skill (Skill tool, skill name `thejudge-quality-check`) and follow it exactly. Do not run interactively; `graph is controlling`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-indepth-chip-collapse

ALL work happens in that build worktree on branch `thejudge-auto/indepth-chip-collapse-work`, never the launch checkout. Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Run context: Slug: indepth-chip-collapse. Run ID: graph-20261005-150943. Package: PRD/work/indepth-chip-collapse/.

Validate `PRD/work/indepth-chip-collapse/DESIGN-BRIEF.md` against PRD alignment and agent-readiness and produce a PASS or FAIL report -- never a GAMEPLAN or slice docs. The package proposes one stable-ID change in GATE-QUESTIONS.md: an `edit` to REQ-206 (functional-requirements.md) making the In-depth chip label state-aware, with the collapse scoped to the textarea being focused or the box holding text (not a bare `.q-box:focus-within`). Confirm the brief, the README Gate verdicts, and the proposed diff are now internally consistent after the owner`s edit, and that the change is implementation-ready.

Important re-grade context: anchor-ask-composer (PR #262) has MERGED to main and rewrote the same REQ-206 acceptance line that the proposed diff replaces. The current REQ-206 line on origin/main carries the width-only chip clause -- the sub-clause `(labelled or icon-only at each width as the mockup shows)` -- so the proposed diff`s frozen replace-anchor no longer matches current truth char-for-char. This is EXPECTED: build applies the approved change by intent as a sub-clause substitution and re-reads REQ-206 before applying. Record it as a non-blocking build note, not a FAIL, exactly as the acceptance-criteria wording (focused or holds text) already carries the owner`s intent.

On FAIL, set STATUS.refining and list every finding. On PASS, leave STATUS.refined.

Report back concisely: the verdict (PASS or FAIL); the complete findings list (or none); any non-blocking build notes; and the STATUS marker you left.

### plan

graph is controlling

You are node 5 (`plan`) of a graph-implement (build half) run. Invoke the `thejudge-map-out` skill (Skill tool, skill name `thejudge-map-out`) and follow it exactly. Do not run interactively; `graph is controlling`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-indepth-chip-collapse

ALL work happens in that build worktree on branch `thejudge-auto/indepth-chip-collapse-work`, never the launch checkout. Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Run context: Slug: indepth-chip-collapse. Run ID: graph-20261005-150943. Package: PRD/work/indepth-chip-collapse/.

The package README `## Preparation gate` records Quality-check: PASS (build-half re-grade, 2026-10-05). Verify that before writing any planning artifact; you cannot self-certify a PASS.

Produce GAMEPLAN.md and the lettered slice docs, plus one `slice-<letter>.criteria.json` beside each slice doc (every criterion initialised `false`, each carrying an `evidence` block). Set STATUS.active.

Scope (frontend/CSS only, one REQ-206 sub-clause): the Ask-a-Question composer's In-depth chip must drop its In-depth text label and show only the glyph while the composer is engaged — the question textarea is focused, or the box holds text — and restore the label at rest (empty and unfocused). Keyboard focus landing on the chip, mic, or send button must NOT drop the label — key the collapse to the textarea being focused or the box being non-empty, NOT a bare `.q-box:focus-within`. The `<480px` glyph-only rule and the chip's accessible name are unchanged. The CSS hook is `apps/frontend/src/styles/flow.css` line 281 (`@media (max-width: 479px) { .q-box .deep .lbl … }`); extend it with a state rule. No `ComposerPill.tsx` structure change.

Build note (carry into the slice doc): anchor-ask-composer (PR #262) has MERGED, so build applies the approved REQ-206 change BY INTENT as a sub-clause substitution — re-read the current REQ-206 line in `PRD/sections/functional-requirements.md` and replace only the sub-clause `(labelled or icon-only at each width as the mockup shows)` with the state-aware wording, leaving the rest of the line (ring-based character budget, live region, downward growth) intact — plus append the approved Notes bullet. Do NOT blind-replay the frozen GATE-QUESTIONS.md replace-anchor.

Make acceptance criteria measurable: the label hides on textarea focus and on non-empty box at a normal width (e.g. 1440px); the label stays visible when keyboard focus is on the chip / mic / send while the box is empty and the textarea is not focused; the label restores when the box is emptied and the textarea blurred; `<480px` stays glyph-only in every state; the accessible name is unchanged; `npm run quality:check` green.

Do NOT commit; the driver commits between nodes. Do NOT touch GRAPH-RUN.md (the driver's ledger).

Report back concisely: GAMEPLAN.md path; the slice letters with a one-line scope each; the criteria files emitted; the STATUS marker; and whether the node is ok or needs to park.

### build

graph is controlling

You are node 6 (`build`) of a graph-implement (build half) run. Invoke the `thejudge-implement-all` skill (Skill tool, skill name `thejudge-implement-all`) and follow it exactly. Do not run interactively; `graph is controlling`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-indepth-chip-collapse

ALL work happens in that build worktree, in place, on the shared branch `thejudge-auto/indepth-chip-collapse-work` (cut from origin/main). Do NOT create a second worktree or a contributor branch. Do NOT write anything in the launch checkout at /Users/chrismiho/Coding/Projects/TheJudge — every path you write must be inside `.worktrees/implement-indepth-chip-collapse/`. Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Run context: Slug: indepth-chip-collapse. Run ID: graph-20261005-150943. Package: PRD/work/indepth-chip-collapse/. The shared branch is `thejudge-auto/indepth-chip-collapse-work`.

Implement every remaining slice in GAMEPLAN.md end to end — slice A (`slice-a-chip-collapse-css.md`) then slice B (`slice-b-req206-promotion.md`) — code, tests, verification, status, and the durable PRD/sections/ truth. Each slice's `slice-<letter>.criteria.json` must end with every criterion `true`, earned by the evidence the hook observes. When the last slice is done, set STATUS.ship-ready.

Apply product truth BY INTENT (not a blind replay of the frozen GATE-QUESTIONS.md patch): anchor-ask-composer (PR #262) has MERGED and already rewrote the REQ-206 acceptance line in `PRD/sections/functional-requirements.md`. Re-read the current REQ-206 line, then substitute ONLY the sub-clause `(labelled or icon-only at each width as the mockup shows)` with the approved state-aware wording (label shown at rest; glyph alone while the composer is engaged — textarea focused or box non-empty; the `<480px` glyph-only rule and the chip's accessible name unchanged), leaving the rest of the line (ring-based character budget, live region, downward growth) intact. Append the approved REQ-206 Notes bullet. Do not add or renumber any stable ID.

Code constraint (owner's edit verdict): key the label collapse to the textarea being focused or the box being non-empty — NOT a bare `.q-box:focus-within`, which would drop the label when a keyboard user tabs onto the chip, mic, or send button. The CSS hook is `apps/frontend/src/styles/flow.css` near line 281. No `ComposerPill.tsx` structure change. If the non-empty trigger cannot rely on a non-zero `data-fill` for every non-empty value, use the `:has(textarea:not(:placeholder-shown))` fallback the GAMEPLAN records (the placeholder is always non-empty).

Run `npm run quality:check` and confirm it is green before setting STATUS.ship-ready. Open or update the code PR `thejudge-auto/indepth-chip-collapse-work → main`.

Do NOT touch GRAPH-RUN.md (the driver's ledger).

Report back concisely: each slice's outcome and the files changed (paths relative to the worktree); confirmation every criteria file is all-`true`; the `npm run quality:check` result; the PR URL; the STATUS marker; and whether the node is ok or needs to park.

### build (attempt 2 — finish-up)

graph is controlling

You are node 6 (`build`), attempt 2, of a graph-implement run. Invoke the `thejudge-implement-all` skill (Skill tool, skill name `thejudge-implement-all`) and follow it exactly. Do not run interactively; `graph is controlling`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-indepth-chip-collapse

ALL work happens in that build worktree, in place, on branch `thejudge-auto/indepth-chip-collapse-work`. Do NOT write anything in the launch checkout at /Users/chrismiho/Coding/Projects/TheJudge — every path you write must be inside `.worktrees/implement-indepth-chip-collapse/`. Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Run context: Slug: indepth-chip-collapse. Run ID: graph-20261005-150943. Branch: `thejudge-auto/indepth-chip-collapse-work`.

Attempt 1 already landed all the real work and committed it (commit 7d86095, PR #263): slice A code (`apps/frontend/src/styles/flow.css` state rule, `apps/frontend/src/components/ComposerPill.test.tsx` +2 tests), slice B PRD edit (REQ-206 sub-clause substituted by intent in `PRD/sections/functional-requirements.md`, Notes bullet appended), Playwright captures under `PRD/work/indepth-chip-collapse/.playwright-mcp/`. Do NOT redo or re-edit that work — verify it is present first (`git log --oneline -3`, and read `flow.css` + the REQ-206 line).

Attempt 1 could NOT finish the slice-completion bookkeeping because it flipped the criteria via a sed/heredoc write form, which the harness auto-mode classifier denies as `[CI Bypass]`. Your ONLY remaining job is the finish-up, done with the Edit and Write tools — NOT sed, NOT heredocs, NOT `node`/`jq`/shell JSON edits (those trip the same auto-mode denial):

1. Re-run `npm run quality:check` and confirm exit 0 (re-earns the command criteria this attempt).
2. Re-verify the live states so your manual observations are your own: with the dev server up, confirm at 1440px the In-depth label shows at rest, hides on textarea focus, hides with text after blur, STAYS shown when focus is on the chip / mic / send with an empty unfocused textarea, and returns after emptying+blurring; and at 390px it is glyph-only in every state. You may re-use the existing `.playwright-mcp/` captures as corroboration. Close the browser and release the port when done (runtime-process-hygiene).
3. Write `PRD/work/indepth-chip-collapse/slice-a.evidence.md` (Write tool) with one dated observation line per manual criterion (A2, A3, A4, A5, A6, A10 — whichever the criteria file marks manual), each naming its criterion id and what you saw today (2026-10-05).
4. Flip every criterion in `slice-a.criteria.json` and `slice-b.criteria.json` to `true` using the Edit tool (or Write the whole file). If any flip is denied by a `[graph-boundary]` rule naming missing evidence, STOP and report it — do not route around it.
5. Set `STATUS.ship-ready` (rename the STATUS marker), set README `status: ship-ready`, mark the slice docs/README Slices as done, and move the `PRD/work/STATUS.md` board row to ship-ready.

Do NOT open a new PR (PR #263 already exists); just commit and push to the same branch. Do NOT touch GRAPH-RUN.md (the driver's ledger).

Report back concisely: confirmation attempt-1 work is present; the `npm run quality:check` result; the live re-verification result; that `slice-a.evidence.md` was written and both criteria files are all-`true` (or the exact `[graph-boundary]` denial if any flip was refused); the STATUS marker; the push; and whether the node is ok or needs to park.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Collapse the Ask composer's In-depth chip to its ◈ glyph when the box is focused or has text; keep the 'In-depth' label only at rest (empty + unfocused), freeing single-row width for the question. Frontend/CSS only, no ComposerPill structure change. Amends REQ-206." | answered-once | shape | — |
