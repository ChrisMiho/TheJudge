# Receipt — small-fixes-cats-menu-white

**What happened:** The cat mascots now show on every screen, the desktop ☰ menu button is wider (45px) with a soft glow and the menu no longer shows a sideways scrollbar, and White is now the colour a new player lands on instead of Blue. Phones get the same glow at their current size.

**What it means for you:** Open the app in a fresh browser and it starts White with cats showing. Merge PR #308 and all of this goes live; the product docs already say the same thing.

- **Date:** 2026-10-14
- **Slug:** `small-fixes-cats-menu-white`
- **Status:** shipped
- **PR:** https://github.com/ChrisMiho/TheJudge/pull/308 (open at close; into `main`)

## Actions taken

- [x] Slice A — cats everywhere (commit `e69f0a2a`).
- [x] Slice B — menu button and tray: 45px glowing ☰, no sideways menu scrollbar (commit `447b4cd4`).
- [x] Slice C — White default colour, final slice with ship gates (commit `59a0fc5f`).
- [x] Review approved on attempt 1, Minor findings only (node ledger row 13).
- [x] Durable truth confirmed present, nothing re-written or promoted: REQ-203, REQ-207, REQ-113, REQ-099, REQ-044 in `PRD/sections/functional-requirements.md`; FLOW-007 in `PRD/sections/user-flows.md`; lines in `PRD/sections/in-depth/README.md`, `PRD/sections/shared-chrome/README.md`, `PRD/sections/system-map.md` (two White-default summaries; no `planned` entry needed a flip). All landed in the slice C commit.
- [x] `PRD/work/STATUS.md`: slug removed from the `ship-ready` section.
- [x] `PRD/work/small-fixes-cats-menu-white/` deleted with `git rm -r` (tracked files only; gitignored `.playwright-mcp/` captures stay on disk).

## Owner decisions during the park

- REQ-207 was revised by the owner while the run was parked: the menu button gets 45px bars and a glow, chosen from live side-by-side previews at 40, 45 and 50px. The "box around the menu" look was declined. The glow also applies on mobile at the current mobile size. The revision is in REQ-207 and the brief.

## Build write-scope trip (waived)

- The build return check found one path outside the build's write scope: a Playwright MCP console log written to the launch root's gitignored `.playwright-mcp/` (`console-2026-10-14T23-51-29-731Z.log`). It came from the session-wide Playwright MCP server's default output directory, not from a node tool call.
- The owner waived it in session. The driver deleted the file.
- Fix applied: `PLAYWRIGHT_MCP_OUTPUT_DIR=/Users/chrismiho/.cache/playwright-mcp` in user settings (`~/.claude/settings.json` env). It takes effect next session and must be verified on the first browser run.

## Follow-ups

Review's four Minor findings:

1. B7 (no sideways menu scrollbar) was measured with overlay scrollbars; the code guarantee is `overflow-x: hidden` at `shell.css:384-385`. Re-check with classic always-visible scrollbars.
2. C7 (White on first paint) rests on the `:root` token tests, not a live first-paint capture.
3. All `PRD/sections/` edits landed in the slice C commit rather than per slice.
4. A new eslint warning, `react-refresh/only-export-components`, at `brandTapContext.tsx:34`.

Out of scope, noted at refinement: the desktop menu is a full-height square, while REQ-207 and REQ-113 describe a floating rounded card at 768px and wider. Docs and code disagree at that width; decide which to change.

## Verification

- Builder: `npm run quality:check` exit 0; frontend suite 150 files / 1615 tests green.
- Reviewer re-ran the frontend suite (150 files / 1615 tests, exit 0), typecheck clean, eslint on touched files 0 errors, and compared every `PRD/sections/` hunk with the finalized `GATE-QUESTIONS.md` (all match).
- All 32 slice criteria self-reported true (hook log does not see worktree criteria); the review was the real gate.

## Graph run

- Run ID: `graph-20261014-234321` (build half; spec-forming half `graph-20261014-225350`) | Profile: `unverified` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/308

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | branch `thejudge-auto/small-fixes-cats-menu-white` pushed (`git ls-remote` → `3664f1db`) from `.worktrees/kickoff-small-fixes-cats-menu-white`; launch checkout still on `main`; lock `.worktrees/.graph-run.lock` runId `graph-20261014-225350` | 2026-10-14 |
| 2 | shape | sonnet | ok | `0 → 27` | `PRD/work/small-fixes-cats-menu-white/` (IDEA.md, README.md, STATUS.ideation, intake/owner-request.md) committed `1d28d20c`; board row in `PRD/work/STATUS.md`; staged intake copy deleted | 2026-10-14 |
| 3 | define | opus | ok | `0 → 99` | `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (REQ-203, REQ-207, REQ-099, REQ-044, FLOW-007, REQ-113; no new IDs; no blockers), `evidence/measurements.md`, `STATUS.refined` committed `a709b4b6`; GATE-QUESTIONS.md present → product truth proposed, continue to gate-qc | 2026-10-14 |
| 4 | gate-qc | sonnet | failed | `0 → 31` | FAIL 1 of 3 — `QUALITY-CHECK.md` committed `cc40503a`: four brief fixes (test pin scope, tokens.css selector split, first-paint assertion, two untestable criteria); GATE-QUESTIONS.md needs no change; `STATUS.refining`; loop to define | 2026-10-14 |
| 5 | define | opus | ok | `0 → 31` | attempt 2: four findings resolved in `DESIGN-BRIEF.md` (assumptions A8, A9 updated), GATE-QUESTIONS.md unchanged, `STATUS.refined` committed `800be810` | 2026-10-14 |
| 6 | gate-qc | sonnet | failed | `0 → 28` | FAIL 2 of 3 — attempt-1 findings verified resolved; two new brief fixes (A: `:root` block order in `tokens.css`; B: `AmbientScene.tsx:550` Blue fallback) in `QUALITY-CHECK.md` committed `b384808f`; GATE-QUESTIONS.md needs no change; `STATUS.refining`; loop to define | 2026-10-14 |
| 7 | define | opus | ok | `0 → 47` | attempt 3: A (`:root` block order + order test + live Blue/Red check) and B (`AmbientScene.tsx` fallback reads `DEFAULT_PALETTE_ID`, added to Touches with a test) resolved; full re-read added the ☰ hover-rule order (A11); no other Blue fallbacks; GATE-QUESTIONS.md unchanged; `STATUS.refined` committed `73852494` | 2026-10-14 |
| 8 | gate-qc | sonnet | ok | `0 → 14` | PASS (attempt 3), no findings — `QUALITY-CHECK.md` committed `a6ad4515`; run stops at gate-qc PASS: proposal pushed to `origin/thejudge-auto/small-fixes-cats-menu-white`, docs PR into `main` opened, parked `STATUS.owner-action` | 2026-10-14 |
| 9 | gate-review | sonnet | ok | `0 → 14` | build half run `graph-20261014-234321`: kickoff worktree removed clean (`git worktree remove`); claim commit `bbb74297` on `thejudge-auto/small-fixes-cats-menu-white-work` cut from `origin/main` `3c937d37` (docs PR #307 merge), pushed; lock taken from the launch root; graph canary `nohup true` denied; `graph-gate-review` commit `5fa333bb`: 6 accept / 0 edit / 0 reject, `### Brief reconciliation` none, REQ-207 slot and brief agree (45px bars, glow, no box); `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs` empty; worktree and launch-checkout porcelain empty | 2026-10-14 |
| 10 | gate-qc | sonnet | ok | `0 → 16` | build-half re-grade PASS, findings none — `QUALITY-CHECK.md` committed `0ae0d9ba`; owner's REQ-207 park revision graded (brief §2, A4, A11, slot, `evidence/measurements.md` agree; selectors exist in `shell.css` 183/287/304/309-315/318-322); all `GATE-QUESTIONS.md` diff anchors match current `PRD/sections/`; `STATUS.refined` kept; driver rewrote README `## Preparation gate` | 2026-10-14 |
| 11 | plan | sonnet | ok | `0 → 23` | `thejudge-map-out` commit `be9331e1`: `GAMEPLAN.md`, slices A (cats everywhere, 12 criteria), B (menu button and tray, 9), C (White default, final slice with ship gates, 11), each `slice-<letter>.criteria.json` all `false`; `STATUS.active` only marker; board row under active; no `PRD/sections`/code diff vs `origin/main`; no deliverable planned inside `PRD/work/` (driver placement check) | 2026-10-14 |
| 12 | build | sonnet | ok | `0 → 87` | PR https://github.com/ChrisMiho/TheJudge/pull/308 (`[THEJUDGE-AUTO][READY]`, registration marker in body); commits `e69f0a2a` (A), `447b4cd4` (B), `59a0fc5f` (C) pushed, `origin` tip = local `59a0fc5f`; `STATUS.ship-ready` only marker; all 32 criteria self-reported true (hook log does not see worktree criteria); builder reports `npm run quality:check` exit 0 and frontend suite 150 files / 1615 tests green. Return-side: launch-checkout porcelain identical before/after (both empty); `classifyBuildWrites` over the 37 tracked paths plus untracked `.tmp/` and capture paths → one path outside scope, `.playwright-mcp/console-2026-10-14T23-51-29-731Z.log` at the launch root (gitignored; written by the session-wide Playwright MCP server's default output dir, not a node tool call). Owner waived it in session (see instruction ledger); driver deleted the file and set `PLAYWRIGHT_MCP_OUTPUT_DIR=/Users/chrismiho/.cache/playwright-mcp` in user settings (`~/.claude/settings.json` env; effective next session). Builder deviations recorded for review: shell edit scripts under `.tmp/` used for exact-string replacements; all `PRD/sections/` edits landed in the slice C commit | 2026-10-14 |
| 13 | review | opus | ok | `0 → 40` | APPROVE on attempt 1, no Critical or Important; no-write `Plan`-type reviewer over `git diff 1dd3c2e3 59a0fc5f` re-ran `npm --workspace apps/frontend run test` (150 files / 1615 tests, exit 0), typecheck clean, eslint on touched files 0 errors; compared every `PRD/sections/` hunk with the finalized `GATE-QUESTIONS.md` (all match). Minor: B7 measured with overlay scrollbars (code guarantee `overflow-x: hidden` at `shell.css:384-385`); C7 first paint rests on the `:root` token tests; all `PRD/sections/` edits in the slice C commit; new eslint `react-refresh/only-export-components` warning at `brandTapContext.tsx:34`. PR #308 registration marker present, title READY | 2026-10-14 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "I'd like to explore fixing that period" | answered-once | shape | — |
| "I'd like to see how we can maybe widen it or make it stand out more while still being subtle like it is" | answered-once | shape | — |
| "Id also like to change the default color that users arrive too as White instead blue" | answered-once | shape | — |
| "we need to check mobile to make sure it isnt there either, we should have enough space to not need it" | answered-once | shape | — |
| "instead of adding a box around the menu, can we make the thing wider? and maybe add a little glow too maybe?" | answered-once | owner-action | — |
| "I think C is what im looking for, but can we compare 40 vs 45 vs 50 px?" | answered-once | owner-action | — |
| "45 for sure, can we also add the same level of glow to mobile? but keep the size its at right now" | answered-once | owner-action | — |
| "ill take your recommendation unless you really need my input" | answered-once | owner-action | — |
| "whats the fix to stop this?" | answered-once | build | — |
| "Both (Recommended)" | answered-once | build | — |

## Intake

- `intake/owner-request.md` — the owner's `/graph-kickoff` request plus one follow-up message sent while the run started, captured verbatim by the graph driver on 2026-10-14 (dictated text, pasted in the request).
