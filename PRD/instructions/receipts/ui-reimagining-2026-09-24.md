# ui-reimagining — 2026-09-24

**What happened:** TheJudge now has a clickable preview of a re-imagined
look — direction 1 of three. Every screen except Life Tracker (the shared
menu and chrome, Quick Question, In-Depth Question, Trade Balancer) wraps
itself in a restrained theme built around the mana colour a player picks:
the background wash, panel edges, focus rings, the waiting panel, and the
card-detail popup pick up the colour, not just a button tint. The mockup
also fixes three friction points from the owner's list: attaching several
cards to a Quick Question no longer pushes **Send Request** off the bottom
of a phone screen; In-Depth Question shows at least three zone cards at a
glance instead of under two; and Trade Balancer's two sides become tabs on
a phone instead of one stacked on top of the other, with desktop unchanged.
Every control on the redesigned screens meets the app's own 44px tap-size
floor. Life Tracker's own screen is untouched — a before/after screenshot
pair proves only the chrome around it changed. Nothing in the shipped app
changes yet: this package ships no `apps/frontend`/`apps/backend` code, only
the durable requirement text and a folder of static HTML mockup pages.

**What it means for you:** open `docs/design/ui-reimagining/index.html` in
PR #237 to click through every direction-1 screen at phone and desktop
width, then merge the PR when ready — that is the only step left. Merging
lands REQ-200 through REQ-205 plus eleven amendments into `PRD/sections/`,
and the mockup tree into `docs/design/ui-reimagining/`, on `main`. Two more
mockup directions and the actual app-code redesign are separate follow-on
packages for later; nothing here commits to either until you pick one.

- Date: 2026-09-24
- Slug: `ui-reimagining`
- Status: shipped
- PR: https://github.com/ChrisMiho/TheJudge/pull/237

## Actions taken

1. Ran the four PR-ready checks (below) — all satisfied.
2. Confirmed durable `PRD/sections/` truth applied at `build` is present:
   new `REQ-200`–`REQ-205` and amendments to `REQ-044`, `REQ-046`, `REQ-056`,
   `REQ-060`, `REQ-099`, `REQ-124`, `REQ-129`, `REQ-130`, `REQ-167`,
   `NFR-011`, `FLOW-007` — 17 blocks, all in `functional-requirements.md`,
   `non-functional-requirements.md`, or `user-flows.md`. Nothing needed
   promoting.
3. Confirmed the direction-1 mockup tree at `docs/design/ui-reimagining/`
   (`README.md`, `direction-1/`, `before/`, `after/`, `index.html`) is
   present and complete.
4. Confirmed no app code shipped, per brief D2: `git diff --stat
   16a9f76...HEAD -- apps/frontend apps/backend` is empty; no feature
   `README.md` under `PRD/sections/` gained a `Built:` line; `system-map.md`
   carries zero `ui-reimagining` mentions, so there was no shipped/planned
   status to flip. The Theme-settings summary edit `build` made in
   `system-map.md`'s `### Theme settings` entry (part of the REQ-200
   amendment) stands as written.
5. Wrote this receipt, folding `GRAPH-RUN.md`'s `## Node ledger`,
   `## Gate verdicts` (with its `### Brief reconciliation` list), and
   `## Instruction ledger` in verbatim, plus an `## Intake` section.
6. Ran `npm run quality:check` on the branch: exit 0.
7. Deleted `PRD/work/ui-reimagining/` (`git rm -r`, 118 tracked files).
8. Removed the package's row from `PRD/work/STATUS.md`'s `## ship-ready`
   table (the section header stays, now empty of rows).
9. Left `PRD/README.md` unchanged — navigation did not change.
10. Committed with explicit paths and pushed without force.

## Files created / updated / deleted

- Created: `PRD/instructions/receipts/ui-reimagining-2026-09-24.md` (this
  file)
- Updated: `PRD/work/STATUS.md` (package row removed from `## ship-ready`)
- Deleted: `PRD/work/ui-reimagining/DESIGN-BRIEF.md`
- Deleted: `PRD/work/ui-reimagining/GAMEPLAN.md`
- Deleted: `PRD/work/ui-reimagining/GATE-QUESTIONS.md`
- Deleted: `PRD/work/ui-reimagining/GRAPH-RUN.md`
- Deleted: `PRD/work/ui-reimagining/IDEA.md`
- Deleted: `PRD/work/ui-reimagining/README.md`
- Deleted: `PRD/work/ui-reimagining/STATUS.ship-ready`
- Deleted: `PRD/work/ui-reimagining/intake/GRAPH-BRIEF.md`
- Deleted: `PRD/work/ui-reimagining/intake/OWNER-INPUT.md`
- Deleted: `PRD/work/ui-reimagining/intake/inspiration/DIGEST.md`
- Deleted: `PRD/work/ui-reimagining/intake/inspiration/README.md`
- Deleted: `PRD/work/ui-reimagining/intake/inspiration/{blackMana,blueMana,colorlessMana,greenMana,redMana,whiteMana}/` —
  86 reference images across the six per-colour folders
- Deleted: `PRD/work/ui-reimagining/slice-a-prd-truth-application.md`,
  `slice-a.criteria.json`, `slice-a.evidence.md`
- Deleted: `PRD/work/ui-reimagining/slice-b-design-system-and-baselines.md`,
  `slice-b.criteria.json`, `slice-b.evidence.md`
- Deleted: `PRD/work/ui-reimagining/slice-c-shared-chrome-and-menu-mockup.md`,
  `slice-c.criteria.json`, `slice-c.evidence.md`
- Deleted: `PRD/work/ui-reimagining/slice-d-quick-question-mockup.md`,
  `slice-d.criteria.json`, `slice-d.evidence.md`
- Deleted: `PRD/work/ui-reimagining/slice-e-in-depth-question-mockup.md`,
  `slice-e.criteria.json`, `slice-e.evidence.md`
- Deleted: `PRD/work/ui-reimagining/slice-f-trade-balancer-mockup.md`,
  `slice-f.criteria.json`, `slice-f.evidence.md`
- Deleted: `PRD/work/ui-reimagining/slice-g-gallery-and-ship-gates.md`,
  `slice-g.criteria.json`, `slice-g.evidence.md`
- 118 tracked files removed in total (`git rm -r
  PRD/work/ui-reimagining/`); the git-ignored `.playwright-mcp/` capture
  folders inside the package were untracked and needed no action.

(All code and the `PRD/sections/`/`docs/design/ui-reimagining/` deliverables
themselves — the seven `PRD/sections/` edits and the direction-1 mockup
tree — were already written and committed at `build`, on this same branch,
across the seven slice commits before this node ran; this receipt does not
re-list them.)

## Verification

### PR-ready path — four pre-merge checks

1. **Checkout and branch.** `git branch --show-current` =
   `thejudge-auto/ui-reimagining-work`, checked out at
   `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ui-reimagining`.
   After `git fetch origin`, local `HEAD` (`cd53a68`) equaled
   `origin/thejudge-auto/ui-reimagining-work` (`cd53a68`) before this node's
   own commit — nothing unpushed, nothing unfetched. Pass.
2. **PR state.** `gh pr view 237 --json state,baseRefName,headRefName` →
   `state: OPEN`, `headRefName: thejudge-auto/ui-reimagining-work`,
   `baseRefName: main`, body carries marker
   `thejudge-auto:v1:registered:ui-reimagining`, `mergeable: MERGEABLE`. Head
   matches this branch, base matches the recorded autonomous base
   `origin/main` → `main`. Pass.
3. **Ship-ready, 62/62 criteria.** Read all seven `slice-*.criteria.json`
   files directly: A 10/10, B 8/8, C 8/8, D 9/9, E 10/10, F 10/10, G 7/7 —
   62/62 `true`, no `false` value anywhere in any file. `README.md` carried
   `status: ship-ready` and `STATUS.ship-ready` was the package's only
   marker. Pass.
4. **Runtime-cleanup criteria.** Satisfied per every slice's
   `slice-*.evidence.md` (B–G; slice A is docs-only, no browser work): each
   dev/static server was started as a tracked background task on a slice-own
   port (3101/5273/8791, 8792/8793/8091, 8794, 8795/8091, 8796, 8797), never
   `nohup`/`&`; each was stopped via `TaskStop` or the tracked task's own
   `pkill` and confirmed released with `lsof`; `browser_close` was called
   after the last capture in every slice (no open tabs remained); committed
   capture paths sit under `docs/design/ui-reimagining/{before,after}/`, and
   disposable session captures under
   `PRD/work/ui-reimagining/.playwright-mcp/` (deleted with the package
   folder, untracked). Pass.

### Durable-truth presence (per id/file)

| Id / file | Target file | Result |
| --- | --- | --- |
| REQ-200–REQ-205 | `functional-requirements.md` | present (`### REQ-200` line 4827 through `### REQ-205` line 5110, in order after REQ-199) |
| REQ-044, REQ-046, REQ-056, REQ-060, REQ-099, REQ-124, REQ-129, REQ-130, REQ-167 | `functional-requirements.md` | present, each carrying its amendment |
| NFR-011 | `non-functional-requirements.md` | present (`### NFR-011`, line 137), amended |
| FLOW-007 | `user-flows.md` | present, amended |
| `docs/design/ui-reimagining/` tree | filesystem | present: `README.md`, `direction-1/` (4 flow pages, `tokens.css`, `shell.css`, `motifs/`, Life Tracker table crops), `before/` (12 captures), `after/` (Life Tracker pair), `index.html` gallery |

Every id/file was already applied at `build`, across slices A (PRD truth)
and B–G (mockup tree). Nothing needed promoting.

### No app-code / no-promotion check

- `git diff --stat 16a9f76...HEAD -- apps/frontend apps/backend` → empty (0
  lines). No app code shipped, matching brief D2.
- `grep -n "ui-reimagining" PRD/sections/system-map.md` → no hits. No
  `Built:` line added, no shipped/planned status to flip.
- `git diff --stat 16a9f76...HEAD` (full) → 63 files changed, +2993/−125,
  entirely inside `PRD/sections/`, `PRD/work/ui-reimagining/`, and
  `docs/design/ui-reimagining/`.

### Test re-run

- `npm run quality:check`: exit 0

## Graph run

- Run ID: `graph-20260924-050744` | Profile: `unverified` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/237

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | branch `thejudge-auto/ui-reimagining` cut from `origin/main` at `f42dc06` and pushed from `.worktrees/kickoff-ui-reimagining` (`git ls-remote --heads origin thejudge-auto/ui-reimagining` → `f42dc06`); launch checkout untouched on `main`, porcelain empty; lock `.worktrees/.graph-run.lock` slug `ui-reimagining` / run id / pid 20883; universal canary `rm -rf` denied, graph canary `nohup` denied while the lock is held; `Profile: unverified` | 2026-09-24 |
| 2 | shape | sonnet | ok | `8 → 36` | commit `d24bc22` on `thejudge-auto/ui-reimagining`: `PRD/work/ui-reimagining/{IDEA.md,README.md,STATUS.ideation,intake/GRAPH-BRIEF.md,intake/OWNER-INPUT.md,intake/inspiration/**}` (90 intake files, `diff -rq` against the staged copy zero drift) + board row under `## ideation`; README carries `## Autonomous metadata`; 28 `## Prior run` receipt matches in `IDEA.md`; staging folder emptied (`find … -type f` → 0); worktree and launch checkout porcelain empty | 2026-09-24 |
| 3 | define | opus | ok | `36 → 106` | commit `de8ae44` on `thejudge-auto/ui-reimagining`: `DESIGN-BRIEF.md` (532 lines), `GATE-QUESTIONS.md` (1105 lines; 17 stable-ID blocks — new REQ-200..REQ-205, in-place REQ-044/046/056/060/099/124/129/130/167, NFR-011, FLOW-007; `## Blocker questions` none), README updated, `STATUS.refined` (only marker), board row under `## refined`; `git diff --stat e0ae6b5 HEAD -- PRD/sections` empty; live walk at 390×844 and 1440×900 (Life Tracker 0-pixel reload diff, Quick Question send button 179px below the fold with two cards, In-Depth zone strip ~1.8 tiles visible, ten controls under the 44px floor); worktree and launch checkout porcelain empty → questions file present, gate continues to `gate-qc` | 2026-09-24 |
| 4 | gate-qc | sonnet | ok (PASS) | `106 → 32` (new attempt key `gate-qc/1`) | verdict PASS, findings none; no commit (`git status --porcelain` empty at `53cf615`); `git diff --stat origin/main HEAD -- PRD/sections` empty; 17 blocks match the brief's proposed-truth table, the four line-level greps re-run at 24 / 7 / 31 / 23 hits (broad grep 200) matching the brief; ~20 citations spot-checked verbatim; no new `DEC-` (grep); worktree and launch checkout porcelain empty | 2026-09-24 |
| — | claim (build half) | driver | ok | `n/a (driver, no node)` | docs PR #236 merged at `8cbb9c7`; kickoff worktree `.worktrees/kickoff-ui-reimagining` clean (`git status --porcelain` empty) → `git worktree remove`; `git worktree add .worktrees/implement-ui-reimagining -b thejudge-auto/ui-reimagining-work origin/main` at `8cbb9c7`; claim commit `270cc93` (README `- Autonomous base: origin/main`, ledger `Autonomous base`/`Worktree` lines) pushed (`git push -u origin thejudge-auto/ui-reimagining-work` → new branch); lock: a first `npm run graph:preflight -- --take-lock …` wrote the lock into the worktree's own `.worktrees/` and the canary `nohup true` was allowed (the hook reads the launch root); stray file removed, lock retaken with `node scripts/graph-preflight.mjs --take-lock --slug ui-reimagining --run-id graph-20260924-050744 --pid 20883` at the launch root; graph canary `nohup true` → denied (`nohup` is denied while a graph run holds the lock); launch checkout still `main`, porcelain empty | 2026-09-24 |
| — | gate-review | sonnet | ok | `0 → 73` | commit `c987e6a` on `thejudge-auto/ui-reimagining-work` (pushed `270cc93..c987e6a`): 17 IDs, 15 accept / 2 edit (REQ-200 → a restrained theme built around the chosen colour, retitled, Life Tracker exclusion criterion dropped; REQ-202 → Life Tracker inherits shared chrome, own screens and `lib/lifeTracker/` untouched, per-slice before/after screenshot pair at 390×844 and 1440×900, no zero-pixel gate); reconciliation grep re-run to zero contradicting hits across `GATE-QUESTIONS.md` (REQ-060/046/203, NFR-011, FLOW-007 blocks), `DESIGN-BRIEF.md` (D3, D6, D9, proposed-truth table, Life Tracker section, non-goals, assumptions) and `README.md`; README supersession note for `intake/OWNER-INPUT.md` E1; `## Gate verdicts` + `### Brief reconciliation` written, `## Open gate` resolved; marker `STATUS.refined` (only marker), README `status: refined`, board row under `## refined`; `git diff --stat origin/main HEAD -- PRD/sections` empty; worktree porcelain empty; launch checkout `main`, porcelain empty | 2026-09-24 |
| 4 | gate-qc (attempt 2) | sonnet | failed (FAIL) | `0 → 27` | verdict FAIL, one Critical finding: `GATE-QUESTIONS.md` `## REQ-202` H2 title + plain-language lines (242–262) still narrate the rejected zero-pixel pin, contradicting the block's finalized diff, `DESIGN-BRIEF.md` D6, and the README note (driver adds: `## REQ-200` H2 at line 16 has the same drift); `git diff --stat origin/main HEAD -- PRD/sections` empty, no new `DEC-`; commit `923d384` pushed (`c987e6a..923d384`): marker `STATUS.refining` (only marker), board row under `## refining`; README `## Preparation gate` rewritten FAIL + findings by the driver; worktree and launch checkout porcelain empty → loop 1 of 3 to `define` | 2026-09-24 |
| 3 | define (attempt 2) | opus | ok | `0 → 25` | commit `342ea82` on `thejudge-auto/ui-reimagining-work` (pushed `9407b02..342ea82`): bounded correction — `GATE-QUESTIONS.md` REQ-200 H2 + What-this-decides + In-plain-terms and REQ-202 H2 + all three plain-language lines rewritten to their finalized diffs in the owner's reason words (no `- Verdict:`/`- Reason:`/diff/brief change); the other 15 blocks' narratives read against their diffs, none pre-verdict; confirmation grep (`zero[- ]pixel|pixel-identical|bit-identical|pinned|whole screen|every surface|…`) over `GATE-QUESTIONS.md`/`DESIGN-BRIEF.md`/`README.md` — every remaining hit is a reason line, a negation, a finalized diff line, the measured noise floor, or the recorded FAIL finding; marker `STATUS.refined` (only marker), board row moved fully to `## refined`; `git diff --stat origin/main HEAD -- PRD/sections` empty; worktree and launch checkout porcelain empty → `gate-qc` attempt 3 | 2026-09-24 |
| 4 | gate-qc (attempt 3) | sonnet | ok (PASS) | `0 → 16` | verdict PASS, findings none; no commit (`git status --porcelain` empty at `3045621`); REQ-200/REQ-202 titles and plain-language lines now match their finalized diffs, no pre-verdict language stated as current truth in `DESIGN-BRIEF.md`/`GATE-QUESTIONS.md`/`README.md` (only the labeled attempt-2 finding and the intake supersession quote remain); `git diff --stat origin/main HEAD -- PRD/sections` empty; no new `DEC-`; REQ-200..205 collision-free and the 11 amendment targets each exist once in `PRD/sections/`; `screen-layout.md` rows carry proposed updates; marker `STATUS.refined`, board row under `## refined`; README `## Preparation gate` rewritten PASS / none by the driver; worktree and launch checkout porcelain empty → `plan` | 2026-09-24 |
| 5 | plan | sonnet | failed (driver return-side check) | `0 → 52` | commit `e8925ad` on `thejudge-auto/ui-reimagining-work` (pushed `2e44f5f..e8925ad`): `GAMEPLAN.md`, seven slices A–G (A applies the PRD truth; B tokens/motifs + before captures; C–F per-flow mockups, C carries the Life Tracker pair; G gallery + Ship gates), seven `slice-*.criteria.json` (62 criteria, 0 `true`, 31 manual), README `status: active` + slice table, marker `STATUS.active` (only marker), board row under `## active`; worktree and launch checkout porcelain empty. Driver rejected the artifact: `GAMEPLAN.md:84,103-107` and slices B–G place every committed deliverable (direction-1 pages, shared CSS/motifs, `before/`+`after/` screenshot pairs, gallery) under `PRD/work/ui-reimagining/mockups/`, which node 8 deletes with `git rm -r PRD/work/ui-reimagining/` on this branch before the owner merges — the deliverable would survive only in history; the cited hygiene rule (`runtime-process-hygiene.md:83-85`) covers disposable captures, not deliverables; precedent `docs/design/tab-icon/`. Placement is mechanics, not product truth → bounded `plan` attempt 2 re-homes the deliverables under `docs/design/ui-reimagining/` | 2026-09-24 |
| 5 | plan (attempt 2) | sonnet | ok | `0 → 92` | commit `16a9f76` on `thejudge-auto/ui-reimagining-work` (pushed `19dcf58..16a9f76`): 14 package files rewritten (`GAMEPLAN.md`, README, slices B–G + criteria) so every committed deliverable lives under `docs/design/ui-reimagining/` (`README.md`; `direction-1/` tokens/shell CSS, `motifs/`, four flow pages; `before/` 12 captures; `after/` Life Tracker pair; gallery `index.html`) mirroring `docs/design/tab-icon/`; slice A untouched; driver grep for `mockups/` across GAMEPLAN/README/slices/criteria → zero hits; 62 criteria, 0 `true`; marker `STATUS.active`, board row under `## active`; `git diff --stat origin/main HEAD -- PRD/sections apps` empty; worktree porcelain empty, remote tip = local; launch checkout `main`, porcelain empty → `build` | 2026-09-24 |
| 6 | build | sonnet | ok | `0 → 459` | seven milestone commits on `thejudge-auto/ui-reimagining-work`: A `f527ae9` (REQ-200..205 new + 11 amendments applied by intent across 7 `PRD/sections/` files, +398/−39; no new `DEC-`, no `Built:` line), B `aefff18` (`docs/design/ui-reimagining/direction-1/tokens.css`+`shell.css`, 6 motif SVGs, 12 `before/` captures; contrast floors measured in-browser, White got a distinct `--wash-tint`), C `43b3a74` (shared-chrome/Menu page with live re-theming; Life Tracker `after/` pair), D `329c06e` (Quick Question: Send Request bottom 732px vs 1067px with 5 cards), E `9bd370e` (In-Depth, 4 steps; 3 of 4 zone tiles visible; targets ≥44px; step order follows the live app, builder-flagged), F `e9a8253` (Trade Balancer phone tabs, desktop unchanged), G `8bac8a4` (gallery `index.html`, PRD re-check, `apps/` empty diff, `STATUS.ship-ready`, board row); PR https://github.com/ChrisMiho/TheJudge/pull/237 (`main` ← work branch, OPEN, MERGEABLE, `[THEJUDGE-AUTO][READY] …`, body opens plain-language, Life Tracker pair linked); criteria 62/62 `true` — self-reported (`.worktrees/.graph-evidence.jsonl` holds 0 entries for this run, the known build-half gap; `review` re-verifies); servers run as tracked background tasks, stopped via TaskStop, `browser_close` per slice (per `slice-*.evidence.md`); return-side: launch checkout `git status --porcelain` empty before and after (identical), `git diff --name-only e666899..HEAD` → 60 paths (7 `PRD/sections`, 24 `PRD/work`, 29 `docs/design`), `classifyBuildWrites` → `ok` all inside `.worktrees/implement-ui-reimagining/`; `git diff --stat origin/main HEAD -- apps` empty; remote tip = local `8bac8a4`; worktree porcelain empty | 2026-09-24 |
| 7 | review | opus | failed (RETURN TO BUILD) | `0 → 87` | no-write reviewer (Plan-type subagent, no Write/Edit) over `git diff e666899..8bac8a4`: 60/62 criteria met with per-id evidence, 2 not met — Critical C5: `docs/design/ui-reimagining/direction-1/life-tracker-after.html:22-27,44-48,55-60` redraws Life Tracker's own screen (upright life numbers, one column at 390×844 showing 2 of 4 players, `gap: 0` square panels, `−`/`+` at the edges) so `after/life-tracker-*.png` contradict the before captures and the PR body's no-drift claim; Important E2: `direction-1/in-depth-question.html:160-180` zone tiles carry no detail popup (`grep -c 'overlay-backdrop\|overlay-panel'` → 0, `.thumb` inert); both flagged deviations ruled met (slice A's `screen-layout.md`/`trade-balancer/README.md` edits are inside the gate diffs; E1's list contradicts its own no-reorder clause, today's order governs); independently re-ran `npm run quality:check` (exit 0, 589/589), apps diff empty, no `Built:` line, no new `DEC-`, contrast/geometry re-measured in Chromium at both viewports; six Minor notes; nothing written (one ignored capture under `.playwright-mcp/`), no git mutation, browser closed, server stopped → loop 1 of 2 to `build` | 2026-09-24 |
| 6 | build (attempt 2) | sonnet | ok | `0 → 132` | two fix commits on `thejudge-auto/ui-reimagining-work`: `9326e79` slice C/C5 — `direction-1/life-tracker-after.html` now composes the before captures' real table pixels (`direction-1/life-tracker-table-{390x844,1440x900}.png`) under the new header, `after/life-tracker-*.png` recaptured, C5 evidence restated, PR body Life Tracker section corrected + a review-fixes section; `60e5f94` slice E/E2 — `direction-1/in-depth-question.html` gains a shared card-detail overlay with a corner control per zone tile (three tiles still visible at 390×844, Remove and detail controls 44×44); criteria 62/62 `true` (self-reported; evidence log still 0 entries for this run); static server port 8091 as a tracked task, stopped via TaskStop, `browser_close` called; builder notes Playwright MCP writes its per-navigation logs to the launch checkout's git-ignored `.playwright-mcp/` regardless of working directory and removed the three it caused; return-side: launch checkout porcelain empty before and after (identical), `git diff --name-only 58c1e78..60e5f94` → 11 paths, `classifyBuildWrites` → `ok`; `git diff --stat origin/main HEAD -- apps` empty; PR #237 OPEN, MERGEABLE, `[THEJUDGE-AUTO][READY] …`; marker `STATUS.ship-ready`; remote tip = local `60e5f94`; worktree porcelain empty | 2026-09-24 |
| 7 | review (attempt 2) | opus | ok (APPROVE) | `0 → 53` | no-write reviewer over `git diff 58c1e78..60e5f94` (11 files, slices C/E + bookkeeping only; `8bac8a4` ancestor of `60e5f94`; `git diff 16a9f76..HEAD -- apps/` empty): C5 met — `direction-1/life-tracker-table-{390x844,1440x900}.png` are byte-identical crops of the before captures (0 differing pixels of 282,360 and 1,146,240), rendered 1:1 at both viewports, and `after/life-tracker-*.png` table regions equal the before captures with 0 differing pixels; E2 met — `#card-detail-popup` overlay count 1, corner `ⓘ` opens it with card name/type/price, close returns `data-open` false, three tiles fully visible at 390×844, Remove and detail controls 44×44; C1/C2/C3/C4/C6/C7/C8 and E1/E3–E10 re-confirmed met (18/18); `npm run quality:check` exit 0 (589/589); three Minor notes (evidence-log wording says life numbers upright, `object-fit: cover` only 1:1 at the graded viewports, slice E doc's E1 list order) — none loops to build; nothing written (one ignored capture), no git mutation, browser closed, server on 8123 stopped → `close` | 2026-09-24 |

### Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-200` | edit | "the chosen colour is the basis of a theme, not a fill. It informs the background wash, panel edges, focus rings, waiting panel and card-detail popup at a restrained intensity, with neutral surfaces still the majority and readability the first constraint (the three measured contrast floors stand). Retitle from 'palette-driven surface system / drives the whole app surface' to 'a theme built around the chosen colour'; keep the one named token set and the per-profile roles, since they are what makes the theme buildable. Drop the acceptance criterion that excludes Life Tracker from the token roles (see REQ-202)." |
| `REQ-201` | accept | — |
| `REQ-202` | edit | "Life Tracker inherits shared chrome changes (menu rail, brand mark, theme section, overlays, page shell) rather than pinning them. Its own screens, counters, layout and lib/lifeTracker/ state are untouched. Every slice that touches shared chrome, the token set, or the shared stylesheet attaches a Life Tracker before/after screenshot pair at 390x844 and 1440x900 to its PR for the owner to review; there is no zero-pixel gate." |
| `REQ-203` | accept | — |
| `REQ-204` | accept | — |
| `REQ-205` | accept | — |
| `REQ-044` | accept | — |
| `REQ-046` | accept | — |
| `REQ-060` | accept | — |
| `REQ-099` | accept | — |
| `REQ-124` | accept | — |
| `REQ-129` | accept | — |
| `REQ-130` | accept | — |
| `REQ-167` | accept | — |
| `REQ-056` | accept | — |
| `NFR-011` | accept | — |
| `FLOW-007` | accept | — |

### Brief reconciliation

- grep (superseded-behaviour phrases from the `REQ-200`/`REQ-202` edits, across
  the package excluding `intake/` and `GRAPH-RUN.md`):
  `grep -rnE 'pixel-identical|zero.differing.pixel|zero-pixel|is pinned|pinned to (today|its pre-redesign) value|visually pinned|Life Tracker keeps its own title|excluded from profile|present-day value|outside the profile|Palette-driven surface system|No Life Tracker change of any kind' DESIGN-BRIEF.md README.md GATE-QUESTIONS.md`
- `GATE-QUESTIONS.md` `REQ-200` block — retitled "Palette-driven surface system" → "A theme built around the chosen colour"; description and acceptance criteria rewritten for restrained intensity / neutral-surfaces-majority; the criterion "Life Tracker is excluded: it resolves every shared role to its present-day value" dropped, per the `REQ-200` edit
- `GATE-QUESTIONS.md` `REQ-200`'s `goals-and-non-goals.md` and `system-map.md` diff hunks — "driving the whole app surface" → "the basis of a restrained theme … with neutral surfaces kept the visual majority"; the `system-map.md` hunk's own cross-reference to `REQ-202` updated from "resolves every shared role to its present-day value" to "inherits every shared role like any other destination, reviewed by a before/after screenshot pair rather than pinned"
- `GATE-QUESTIONS.md` `REQ-202` block — retitled "Life Tracker visual pin and zero-pixel drift gate" → "Life Tracker inherits shared chrome, reviewed by a screenshot pair at every touching slice"; description, acceptance criteria, constraints, and notes rewritten from a zero-pixel pin to shared-chrome inheritance with an owner-reviewed screenshot pair, per the `REQ-202` edit
- `GATE-QUESTIONS.md` `REQ-060`/`REQ-046` amendment hunk — "Card-identity rings (REQ-058) and Life Tracker (REQ-202) stay outside the profile" → "Card-identity rings (REQ-058) stay outside the profile; Life Tracker (REQ-202) inherits the profile through shared chrome like every other destination, reviewed by a screenshot pair rather than pinned" (this `accept`-verdict block collaterally referenced the superseded `REQ-202` reading; fixed so the proposal stays internally consistent)
- `GATE-QUESTIONS.md` `NFR-011` hunk — "Player Life Tracker is excluded from profile-driven surface changes and stays pixel-identical, verified by a zero-differing-pixel screenshot comparison…" → "Player Life Tracker inherits profile-driven shared chrome the same way every other destination does; its own screens, counters, and `lib/lifeTracker/` state stay untouched, and every slice that touches shared chrome or the token set attaches a before/after screenshot pair … for the owner's review"
- `GATE-QUESTIONS.md` `FLOW-007` hunk (step 4 and Notes) — "Player Life Tracker is excluded and keeps its present-day appearance" → "Player Life Tracker's own screens keep their present-day appearance; the shared chrome it inherits … picks up the profile like every other destination, reviewed by a screenshot pair rather than pinned"; and the same "stay outside the profile" line fixed as in the `REQ-060`/`REQ-046` hunk
- `GATE-QUESTIONS.md` `REQ-203` hunk — "Life Tracker is excluded — it keeps its own title and wires no tap count" → "Life Tracker shows the same redesigned brand mark as every other screen, inherited as shared chrome (REQ-202), but is excluded from the tap count" (the brand mark is shared chrome under the edited `REQ-202`, so the egg's exclusion is behavioural only, not visual)
- `DESIGN-BRIEF.md:35` ("What the player gets") — "Life Tracker looks exactly as it does today, down to the pixel" → "Life Tracker's own screens, counters, and state stay exactly as they are today. Its shared chrome … inherits the redesign like every other destination; each slice … attaches a before/after screenshot pair for the owner to review" (REQ-202 edit)
- `DESIGN-BRIEF.md` Life Tracker noise-floor paragraph — "This is what makes the pin in REQ-202 enforceable rather than aspirational" → "This is why the REQ-202 before/after screenshot pair is a clean signal … a differing pixel is a real change, not render noise" (REQ-202 edit)
- `DESIGN-BRIEF.md` D3 — expanded to state the neutral-surfaces-majority rule explicitly and cite the `gate-review` verdict (REQ-200 edit)
- `DESIGN-BRIEF.md` D6 — retitled "Life Tracker is pinned…" → "Life Tracker inherits shared chrome, reviewed by a screenshot pair"; assumption and evidence rewritten (REQ-202 edit)
- `DESIGN-BRIEF.md` D9 — "Life Tracker keeps its own title and stays out" → "Life Tracker shows the same redesigned brand mark as every other screen … but is excluded from the tap count" (REQ-202 edit, via the REQ-203 cross-reference)
- `DESIGN-BRIEF.md` Proposed-product-truth table, `REQ-200`/`REQ-202` rows — rewritten to the restrained-theme and inherit-with-review readings (both edits)
- `DESIGN-BRIEF.md` "Life Tracker: how it is pinned…" section — retitled "… how it inherits shared chrome…"; all four numbered points rewritten from a zero-pixel pin to inheritance plus an owner-reviewed screenshot pair (REQ-202 edit)
- `DESIGN-BRIEF.md` Non-goals guard rail — "No Life Tracker change of any kind, including shared-token drift" → "No change to Life Tracker's own screens … Shared-chrome drift is expected and reviewed by a screenshot pair … not blocked outright" (REQ-202 edit)
- `DESIGN-BRIEF.md` Material assumptions row 4 — "Screenshot-diff tolerance is zero differing pixels" → "Life Tracker inherits shared chrome, reviewed by a before/after screenshot pair per touching slice, no automated diff threshold" (REQ-202 edit)
- `README.md` top summary and "Refinement outputs" bullet — "Life Tracker pixel-identical" / "the Life Tracker pin" → "Life Tracker's own screens untouched … inherits shared chrome under owner review" (REQ-202 edit)
- `README.md` — supersession note added: `intake/OWNER-INPUT.md`'s E1 answer ("(a) pixel-identical: pin every shared token Life Tracker consumes to today's value") is superseded by the `REQ-202` gate verdict

- Re-grep after the rewrites (`DESIGN-BRIEF.md`, `README.md`, `GATE-QUESTIONS.md`): zero contradicting hits — the only remaining matches are the historical question text in `GATE-QUESTIONS.md`'s `REQ-202` "What this decides"/"In plain terms" lines and the owner's quoted `Reason:` (the record of what was asked and answered, not stated product truth), and the README supersession note's verbatim quote of the superseded intake line.

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "/graph-kickoff @PRD/work/probe-ui-reimagining/" | answered-once | shape | — |

## Intake

- `intake/GRAPH-BRIEF.md` — staged by the graph driver from the run's own
  intake package, per the `shape` node's dispatch prompt.
- `intake/OWNER-INPUT.md` — the owner's fully answered intake probe, staged
  the same way.
- `intake/inspiration/` (`DIGEST.md`, `README.md`, and 86 reference images
  in six per-colour folders) — reference material supplied by the owner and
  staged the same way; treated as evidence, never authority, and never
  opened or fetched by any node.
