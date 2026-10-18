# Receipt — codebase-cleanup-pass — 2026-10-18

**What happened:** The code underneath the game got a deep tidy-up with no change to what players see. Same answers, same prompts sent to the AI, same rules found in the same order, same screens and messages. The tests run faster and stop leaving temp files behind, dead code and dead styles are gone, and the type and lint checks are stricter. The one gain a player can feel: In-Depth combo matching is faster when a heavily comboed card is on the board and the question does not mention combos (the three heaviest cards measured dropped from 76-175 ms of server work per question to under 1 ms). Code PR: https://github.com/ChrisMiho/TheJudge/pull/322 (open, not yet merged).

**What it means for you:** Review PR #322 and merge it when CI is green; nothing else is waiting on you. The fixes the cleanup found but did not build (including the Trade Balancer bug where a scanned card does not default to the printing you scanned) are written up for a later pass in `PRD/ideasForLater/codebase-cleanup-followups/IDEA.md`.

## Summary

- Date: 2026-10-18
- Slug: codebase-cleanup-pass
- Status: **shipped**
- PR: https://github.com/ChrisMiho/TheJudge/pull/322 (open at close; head `thejudge-auto/codebase-cleanup-pass-work`, base `main`). The receipt reaches `main` only if that PR merges.
- Cleanup mode: graph-controlled invocation (node 8, `close`), build-half run `graph-20261018-175940`, PR-ready path. This receipt, the package deletion and the board strip are committed on the code branch and ride in PR #322, before the owner's merge.
- Spec-forming half: run `graph-20261018-162925`, docs PR #321 (merged).
- Slices: eleven (A-K), all done, 113 of 113 criteria `true`. Criterion `I2` (finding Q-11) was removed on 2026-10-18 by owner decision, so the original 114 became 113.
- Review: approved, 0 Critical, 0 Important, 7 Minor.
- Product truth: none proposed (no `GATE-QUESTIONS.md`) and build wrote no `PRD/sections/` change (`git diff --stat origin/main -- PRD/sections` is empty), so nothing was promoted. `PRD/sections/system-map.md` has no entry for this package, so no flip.
- Follow-up record (survives this close): `PRD/ideasForLater/codebase-cleanup-followups/IDEA.md`, with the unedited intake snapshot in `PRD/ideasForLater/codebase-cleanup-followups/evidence/`.
- REQ-202 before/after screenshots and computed-style summaries: `docs/design/codebase-cleanup-pass/slice-j/` and `docs/design/codebase-cleanup-pass/slice-k/`.

## Review Minor notes

1. Slice K2 differs only in the unread `--tw-text-opacity` value.
2. Slice I7's wording does not match the 5 test removals recorded in its evidence log.
3. The slice I doc still shows the removed `I2` ticked and carries stale text.
4. B4 and H10 conflict with slice I's allowed mock edit.
5. Slice H dropped the `hiddenInitialQuestion` restore assertion (follow-up added to section c of the follow-up record).
6. Slice E's reference scan is a `{ prefilter: false }` switch in `apps/backend/src/commanderSpellbook/matcher.ts`, not a test helper (follow-up added to section c).
7. Slice J's computed-style check covers In-Depth's first screen only; the review-step rules are proven by the built-CSS diff.

## Actions taken

- Built slices A-K on `thejudge-auto/codebase-cleanup-pass-work` and opened PR #322.
- Deferred Q-11, the Trade scanned-printing bug and every other follow-up to `PRD/ideasForLater/codebase-cleanup-followups/` (owner decision, 2026-10-18).
- At close: wrote this receipt, added two follow-ups from the review to section c of the follow-up record, removed the package's row from `## ship-ready` in `PRD/work/STATUS.md`, and deleted `PRD/work/codebase-cleanup-pass/` with `git rm -r`.

## Verification

- Review node: `npm run quality:check` exit 0; backend 902, frontend 1671, scripts 1066 tests pass; prompt goldens and protected paths unchanged; rule-order snapshot 415/415 compared.
- Close node: PR #322 open (head `thejudge-auto/codebase-cleanup-pass-work`, base `main`); `HEAD` equals `origin/thejudge-auto/codebase-cleanup-pass-work` (`978b1504`) after fetch; every `slice-*.criteria.json` has no `false`; `git diff --stat origin/main -- PRD/sections` empty.

## Graph run

- Run ID: `graph-20261018-175940` (build half; spec-forming half `graph-20261018-162925`, docs PR #321) | Profile: `loaded (env sentinel)` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/322
- PR: https://github.com/ChrisMiho/TheJudge/pull/322

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 10` | branch `thejudge-auto/codebase-cleanup-pass` pushed (`git ls-remote` → `1c1f3dcf` = `origin/main`) from `.worktrees/kickoff-codebase-cleanup-pass`; launch checkout still on `main`, porcelain only the pre-existing untracked `PRD/work/probe-codebase-health-pass/`; lock `.worktrees/.graph-run.lock` runId `graph-20261018-162925` pid 37951; universal canary and graph canary `nohup true` both denied | 2026-10-18 |
| 2 | shape | sonnet | ok | `0 → 15` | `PRD/work/codebase-cleanup-pass/` (IDEA.md with 8 `## Prior run` lines, README.md, STATUS.ideation, 13 `intake/` files each `cmp`-identical to staging) and board row committed `f8d615c8`, pushed (= origin tip); worktree porcelain empty; staging folder removal denied (`rm -rf`), not retried | 2026-10-18 |
| 3 | define | opus | ok | `0 → 46` | commit `9179a7df` (= origin tip): `DESIGN-BRIEF.md` (712 lines; slices A–J — test speed and temp cleanup, frontend test setup and helpers, passing type/lint checks on, Lambda package and CI and script helpers, combo prefilter K-01, prompt pipeline once, rule-search scoring with order snapshot, In-Depth dead wiring, scanner hook dead returns, dead CSS plus parse check; 68 ids dispositioned: 47 built in whole or part, 14 later package, 3 folded into pending briefs, 1 `codehealth`, 3 owner-only; 26 follow-ups incl. In-Depth duplicate-Stack scan with no message); no `GATE-QUESTIONS.md` (no product truth, no blocker) → no gate; `STATUS.refined` only marker, board row moved; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; porcelain empty in worktree, launch checkout only the pre-existing untracked probe folder | 2026-10-18 |
| 4 | gate-qc | sonnet | ok | `0 → 36` | PASS, 0 blocking, 5 advisory (A1 `master` trigger vs `PRD/instructions/ci.md:6`; A2 disposition count split 36 + 11; A3 timing wording vs slice E; A4 builder re-reads probe line numbers; A5 slice J PR states Life Tracker table styles are in the dump); ~35 cited source lines matched; collision claims vs `intake/GRAPH-BRIEF-*.md` hold; `QUALITY-CHECK.md` commit `36cbd8ae` (= origin tip); README `## Preparation gate` PASS recorded by the driver; run stops at PASS → docs PR, `STATUS.owner-action`, board row moved to owner-action | 2026-10-18 |
| 5 | gate-review | driver | ok | `degraded (no run state)` | build half run `graph-20261018-175940`: docs PR #321 merged (`origin/main` `4fa69419`); kickoff worktree removed clean (`git worktree remove`); claim commit `60c00b58` on `thejudge-auto/codebase-cleanup-pass-work` cut from `origin/main` `4fa69419`, pushed; lock taken from the launch root (`node scripts/graph-preflight.mjs --take-lock`); graph canary `nohup true` denied; no `GATE-QUESTIONS.md` → nothing to apply, driver restored `STATUS.refined` (only marker), README status, board row under refined | 2026-10-18 |
| 6 | gate-qc | sonnet | ok | `0 → 14` | attempt 2 PASS, 0 blocking, 2 advisory (A1 slice K must also fix the moved `useLifeTracker.ts`'s own relative imports — `../../types`, `./counters`, `./persistence`, `./state`, `./types`; A2 some cited lines are still the probes' and marked so); counts re-checked 37 + 12 built of 68; `## Owner decisions` consistent with slices, dispositions, follow-ups 25 and 27; `QUALITY-CHECK.md` commit `2742a2be` (= origin tip); `STATUS.refined` only marker; worktree porcelain empty; launch porcelain unchanged (only the pre-existing untracked probe folder) | 2026-10-18 |
| 7 | plan | sonnet | ok | `0 → 40` | commit `6f3c3c1c` (= origin tip): `GAMEPLAN.md`, `slice-a.md`…`slice-k.md`, 11 `slice-*.criteria.json` (114 criteria, all `false`), `STATUS.active` only marker, README slice table, board row under active; Preparation gate PASS verified before writing; attempt-2 advisory folded into slice K step 4 / K4; deliverables kept outside `PRD/work/` at `docs/design/codebase-cleanup-pass/slice-j/` and `slice-k/`; no post-merge criteria; worktree porcelain empty; launch porcelain unchanged | 2026-10-18 |
| 8 | build | sonnet | parked | `0 → 611` | attempt 1: slices A–K built and pushed, tip `ef6ca945` (= origin tip); code PR https://github.com/ChrisMiho/TheJudge/pull/322 opened with title READY and the registration marker; criteria 113/114 `true` (node script over all 11 `slice-*.criteria.json`) — `I2` false (Q-11 not applied, see `slice-i.evidence.md`), so the node fails its all-true rule; return side: launch `git status --porcelain` identical to the pre-build capture, no new files under `<root>/.playwright-mcp` or `<root>/.tmp`, every reported path inside `.worktrees/implement-codebase-cleanup-pass/`; `git diff --stat origin/main -- apps/backend/src/eval/fixtures PRD/sections .claude CLAUDE.md scripts/graph-boundary-hook.mjs` empty; worktree porcelain empty; builder had set `STATUS.ship-ready`, driver replaced it with `STATUS.owner-action` | 2026-10-18 |
| 9 | build | sonnet | ok | `0 → 39` | attempt 2 after owner deferral: tip `524657bf` (= origin tip); criteria 113/113 `true` (`I2` removed with dated reason in `slice-i.md` and `slice-i.evidence.md`; Q-11 row → later; Trade bug = follow-up 28); `git diff --stat 0be4c14b HEAD -- apps scripts .github` empty (no code change); durable record `PRD/ideasForLater/codebase-cleanup-followups/IDEA.md` (193 lines, sections a–f, Trade bug written in full) plus `evidence/` 13 files `cmp`-identical to `intake/`; board row under ship-ready and parked-ideas row added; PR #322 body updated (`gh pr edit`), title and registration marker unchanged; `STATUS.ship-ready` only marker; launch porcelain unchanged; no new files under `<root>/.playwright-mcp` or `<root>/.tmp` | 2026-10-18 |
| 10 | review | opus | ok | `0 → 66` | approve, 0 Critical, 0 Important, 7 Minor (K2 differs only in unread `--tw-text-opacity`; I7 wording vs 5 recorded test removals; slice I doc shows removed I2 ticked and stale text; B4/H10 vs slice I's allowed mock edit; slice H dropped the `hiddenInitialQuestion` restore assertion; slice E reference scan is a `{ prefilter: false }` switch in `matcher.ts` not a test helper; slice J computed-style covers In-Depth's first screen, review-step rules proven by the built-CSS diff); `npm run quality:check` exit 0; backend 902, frontend 1671, scripts 1066 pass; goldens and protected paths unchanged; rule-order snapshot 415/415 compared; worktree porcelain empty; no-write `Plan` subagent | 2026-10-18 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "this is a cleanup exercise, we do not want to affect functionality" | answered-once | shape | — |
| "i down to defer this fix and the other identified fixes in a followup pass" | answered-once | build | — |
| "i just wanna make sure all of these are well documented for the next pass" | answered-once | build | — |

## Intake

The package held 13 intake files in `PRD/work/codebase-cleanup-pass/intake/`, copied verbatim at kickoff. Origin: the 2026-10-18 driver investigation for the owner's cleanup request (four read-only probes plus their roll-up) and the owner's 2026-10-17 code-health probe, copied from the untracked folder `PRD/work/probe-codebase-health-pass/`. Byte-identical copies now live in `PRD/ideasForLater/codebase-cleanup-followups/evidence/`.

- `intake/HEALTH-REPORT-2026-10-18.md` — 2026-10-18 driver investigation roll-up of the four probes below
- `intake/FINDINGS-frontend-code-quality.md` — 2026-10-18 driver investigation probe (ids Q-)
- `intake/FINDINGS-styling-organization.md` — 2026-10-18 driver investigation probe (ids C-)
- `intake/FINDINGS-backend-code-quality.md` — 2026-10-18 driver investigation probe (ids K-)
- `intake/FINDINGS-scripts-tooling-tests.md` — 2026-10-18 driver investigation probe (ids T-)
- `intake/HEALTH-REPORT.md` — 2026-10-17 code-health probe (`PRD/work/probe-codebase-health-pass/`), carries the `codehealth` queue
- `intake/FINDINGS-backend-scripts-and-august-audit.md` — 2026-10-17 code-health probe
- `intake/FINDINGS-data-and-clients.md` — 2026-10-17 code-health probe
- `intake/FINDINGS-ui-and-personalities.md` — 2026-10-17 code-health probe
- `intake/GRAPH-BRIEF-popups.md` — 2026-10-17 code-health probe, pending cluster brief (collision map)
- `intake/GRAPH-BRIEF-card-search.md` — 2026-10-17 code-health probe, pending cluster brief (collision map)
- `intake/GRAPH-BRIEF-card-rings.md` — 2026-10-17 code-health probe, pending cluster brief (collision map)
- `intake/GRAPH-BRIEF-backend-health.md` — 2026-10-17 code-health probe, pending cluster brief (collision map)

## Files

- Created: `PRD/instructions/receipts/codebase-cleanup-pass-2026-10-18.md`
- Updated: `PRD/ideasForLater/codebase-cleanup-followups/IDEA.md` (two items added to section c), `PRD/work/STATUS.md` (ship-ready row removed)
- Deleted: all tracked files of `PRD/work/codebase-cleanup-pass/` (package docs, 11 slice docs, evidence logs and criteria files, `GRAPH-RUN.md`, `intake/`, `STATUS.ship-ready`). The gitignored `.playwright-mcp/` scratch was left on disk.
- Code changes shipped in PR #322: see the PR diff; evidence per slice is in git history on `thejudge-auto/codebase-cleanup-pass-work`.
