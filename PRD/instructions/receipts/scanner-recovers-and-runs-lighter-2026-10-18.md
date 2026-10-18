# Receipt — scanner-recovers-and-runs-lighter — 2026-10-18

**What happened:** The card scanner used to break for the whole visit if its
scan data failed to download once, and the player saw a raw error until they
reloaded the page. It now shows a plain sentence, and closing and reopening the
scanner tries the download again, so scanning works again without a reload.
The three scanners (In-Depth, Quick Question, Trade Balancer) now share one
scanner panel, so the exit ✕ sits in the same place on all of them and no
longer covers the caution triangle in In-Depth. The card identifier is built
once and shared, each camera frame does less work (scan results are unchanged),
and the scan map a player downloads on first scan is smaller (gzip 6.55 MB to
5.31 MB). Code PR: https://github.com/ChrisMiho/TheJudge/pull/320 (open, not
yet merged).

**What it means for you:** Merge PR #320 to ship this. After the merge, a
phone that loses signal during the first scan recovers on the next open of the
scanner, and the first scan downloads about 1.2 MB less. Two leftover
screenshots in your main checkout need deleting by hand (see Follow-ups).

## Summary

- Date: 2026-10-18
- Slug: scanner-recovers-and-runs-lighter
- Status: **shipped**
- Cleanup mode: graph-controlled invocation (node 8, `close`), build-half run
  `graph-20261018-063434`, **PR-ready path** — this receipt and the package
  deletion are committed on the code branch and ride in PR #320, before the
  owner's merge.
- Package classification: autonomous — `README.md` carries `## Autonomous
  metadata` (`Autonomous base: origin/main`).
- PR: https://github.com/ChrisMiho/TheJudge/pull/320

## What shipped

- Slice A — a failed scan-data download no longer sticks. Each loader clears a
  rejected promise and re-requests next call; the player sees the REQ-249
  sentence (never the raw error) with `role=alert` in all three scanners.
  9/9 criteria true.
- Slice B — the card identifier is built once and shared by every scanner, and
  per-frame work is reduced; `identify.test.ts` against
  `__fixtures__/vectors.json` passes unchanged. 8/8 criteria true.
- Slice C — one shared scanner panel across In-Depth, Quick Question and Trade
  Balancer; exit ✕ is a 44 px square in the same place and does not cover the
  caution triangle. 11/11 criteria true.
- Slice D — smaller scan map: the image address is dropped from
  `cardScanMap.json` by the committed step `npm run data:scan-map:slim`
  (`scripts/slim-card-scan-map.mjs`), run on the committed map; 95,895 keys
  unchanged, `oracleId` and `name` identical, gzip 6,552,206 to 5,310,581.
  `build-card-scan-map.mjs` also emits the slim shape on the next full rebuild.
  12/12 criteria true.
- All 4 slices done; 40/40 criteria true across `slice-{a,b,c,d}.criteria.json`
  (9 + 8 + 11 + 12), read from the files at close.

## Durable truth check (confirmed present, nothing re-written)

| Stable ID | Present in `PRD/sections/` |
| --- | --- |
| REQ-249 (new: plain failure sentence, retry on reopen) | `functional-requirements.md`, `scan/README.md` |
| REQ-214 (exit ✕ placement) | `screen-layout.md`, `user-flows.md`, `system-map.md` |
| REQ-056 (scanner panel) | `functional-requirements.md`, `screen-layout.md`, `user-flows.md` |
| REQ-048 (scan map contents) | `functional-requirements.md`, `system-map.md`, `scan/README.md` |
| REQ-066 | `functional-requirements.md`, `overview.md`, `user-flows.md` |

No leftover promoted at close. `system-map.md` has no `planned`/`partial` entry
for this work, so no status flip was needed. Review Minor 3: the promoted
REQ-048 text and `scan/data/cardScanMap.md` word the map production differently
from the original proposal. That is deliberate: it follows the owner's slice D
decision (produce the slim map from the committed map, not from a local card
dump) and the measured 5.31 / 6.55 MB sizes. It was left as built, not
reverted.

## Verification

Reported by build attempt 2 and re-run by the reviewer (APPROVE, 40/40 met, 0
Critical, 0 Important, 6 Minor): frontend tests 154 files / 1666 pass,
`test:scripts` 1061 pass / 0 fail, typecheck, lint, format check, and
`npm run quality:check` exit 0, frontend build built. Map comparison
`origin/main` vs `HEAD`: 95,895 = 95,895 keys, 0 diffs beyond the dropped
image address.

## Follow-ups (not blocking)

- Review Minor 1: slice A2 tests settle the old promise first, so they would
  pass without the `=== attempt` guard; tighten them.
- Review Minor 2: slice C1 hosts also pass hook state as props alongside the
  shared panel.
- Review Minor 4: `a-failed.png` does not show the plain sentence.
- Review Minor 5: `slice-c.evidence.md` C9 says no camera, but `c-qq-390.png`
  holds a live webcam frame (gitignored, uncommitted).
- Review Minor 6: the D11 live check used a test image element, not the scan
  preview.
- Quick Question's scanner title lost its `<h1>` role in the shared panel
  (out of scope for this run; decide whether to restore it).
- Owner deletion: two attempt-1 screenshots, `a-failed.png` and
  `a-recovered.png`, sit in the launch checkout's gitignored
  `PRD/work/scanner-recovers-and-runs-lighter/.playwright-mcp/`. Delete them;
  the builder's removal was denied. The worktree's own `.playwright-mcp/` also
  holds a webcam frame of a person and is not committed.

## Files

Deleted with `git rm`: every tracked path under
`PRD/work/scanner-recovers-and-runs-lighter/` (README, IDEA, DESIGN-BRIEF,
GATE-QUESTIONS, QUALITY-CHECK, GAMEPLAN, GRAPH-RUN, STATUS.ship-ready,
`evidence/measurements.md`, `intake/GRAPH-BRIEF-scanner.md`, slice docs,
criteria and evidence files for A to D). Updated: `PRD/work/STATUS.md` (row
removed). Created: this receipt. `PRD/sections/` and code changes were made at
build and are part of PR #320.

## Intake

- `intake/GRAPH-BRIEF-scanner.md` — origin: the owner's 2026-10-17 code health
  probe (`PRD/work/probe-codebase-health-pass/GRAPH-BRIEF-scanner.md` in the
  launch checkout, untracked there), staged by the run and copied verbatim.

## Graph run

- Run ID: `graph-20261018-055113` (spec-forming half); `graph-20261018-063434` (build half) | Profile: `loaded (env sentinel)` at node 1; build half `unverified` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/320

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 7` | branch `thejudge-auto/scanner-recovers-and-runs-lighter` pushed (`git ls-remote` → `041eab94` = `origin/main`) from `.worktrees/kickoff-scanner-recovers-and-runs-lighter`; launch checkout still on `main`, porcelain only the pre-existing untracked `PRD/work/probe-codebase-health-pass/`; lock `.worktrees/.graph-run.lock` runId `graph-20261018-055113` pid 6563; universal canary and graph canary `nohup true` both denied | 2026-10-18 |
| 2 | shape | sonnet | ok | `0 → 17` | `PRD/work/scanner-recovers-and-runs-lighter/` (IDEA.md with 34 `## Prior run` lines, README.md, STATUS.ideation, `intake/GRAPH-BRIEF-scanner.md` byte-identical to staging) and board row committed `e030224f`, `8ecaff8e`, pushed (= origin tip); worktree porcelain empty | 2026-10-18 |
| 3 | define | opus | ok | `0 → 89` | commit `3b548f5c` (= origin tip): `DESIGN-BRIEF.md` (five changes, slice order recovery → shared identifier + per-frame → panel → scan map, ladder per open decision, disposition rows), `GATE-QUESTIONS.md` (REQ-214, REQ-056, REQ-048, REQ-066 amended; REQ-249 new — REQ-248 held by open PR #317; `## Blocker questions` none; 5 blank verdict slots), `evidence/measurements.md` (live, dev server port 5181, canvas fake camera, 390×844 and 1280×800: In-Depth ✕ covers the caution triangle at both widths, Quick Question and Trade do not; failed download stays stuck after the 503 lifts; port released, `browser_close`); `STATUS.refined` only marker, board row moved; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; REQ-249 unused in `PRD/sections/`; porcelain empty both checkouts (launch: pre-existing probe folder only) | 2026-10-18 |
| 4 | gate-qc | sonnet | ok | `0 → 26` | PASS, 0 blocking, 4 advisory (A1 parity check is `identify.test.ts` + `vectors.json`, `reference/identify.py` absent; A2 four test fixtures carry `imageUrl`; A3 name `npm run data:scan-map`, drop unused `getImageUrl`; A4 confirm no other `screen-layout.md` row contradicts); every diff hunk matches `PRD/sections/` once; REQ-249 unused; `QUALITY-CHECK.md` commit `c82d38c2` (= origin tip); README `## Preparation gate` PASS recorded by the driver; run stops at PASS → docs PR, `STATUS.owner-action`, board row moved to owner-action | 2026-10-18 |
| 5 | gate-review | sonnet | ok | `0 → 18` | build half run `graph-20261018-063434`: docs PR #318 and verdict PR #319 merged (`origin/main` `30433b2d`); kickoff worktree removed clean (`git worktree remove`); claim commit `4a4da393` on `thejudge-auto/scanner-recovers-and-runs-lighter-work` cut from `origin/main` `30433b2d`, pushed; lock taken from the launch root (pid 6563); graph canary `nohup true` denied; `graph-gate-review` commit `24ed40ca` (= origin tip): 5 accept / 0 edit / 0 reject, `### Brief reconciliation` none; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; porcelain empty in worktree, launch checkout only the pre-existing untracked `PRD/work/probe-codebase-health-pass/` | 2026-10-18 |
| 4 | gate-qc (build half, attempt 2) | sonnet | ok | `0 → 18` | PASS, 0 blocking, A1–A4 carried forward (A3 adds: gitignored `apps/frontend/data/scryfall/default-cards.json` absent in the worktree); `origin/main` still `30433b2d`; 18 removed-line groups each match `PRD/sections/` once; REQ-249 unused; `QUALITY-CHECK.md` commit `2c840a0d` (= origin tip); `STATUS.refined` only marker; README `## Preparation gate` PASS rewritten by the driver; porcelain empty | 2026-10-18 |
| 5 | plan | sonnet | ok | `0 → 30` | commit `bf3578b7` (= origin tip): `GAMEPLAN.md`, `slice-a.md`–`slice-d.md` sequential (A recovery, B shared identifier + per-frame, C one scanner panel, D smaller scan map), `slice-<a–d>.criteria.json` 9/8/11/12 = 40 criteria, all `false`, 9 `manual`; A1–A4 folded in; `STATUS.active` only marker; board row moved to active; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; porcelain empty | 2026-10-18 |
| 6 | build | sonnet | parked | `0 → 164` | PR https://github.com/ChrisMiho/TheJudge/pull/320 (open, `[THEJUDGE-AUTO][BLOCKED]`, base `main`); commits `7ad402aa` (A), `be7fe746` (B), `ad5a0957` (C) = origin tip; criteria A 9/9, B 8/8, C 11/11, D 0/12 (`.graph-evidence.jsonl` not consulted — known build-half gap, criteria self-reported); reported frontend tests 154 files / 1664 pass, typecheck no errors, lint clean, prettier clean, `test:scripts` 1059 pass / 0 fail; `npm run quality:check` denied twice by the permission classifier, parts run separately; frontend build not run; `PRD/sections/` REQ-249, REQ-214, REQ-056 applied (`functional-requirements.md`, `scan/README.md`, `screen-layout.md`), REQ-048 and REQ-066 not applied. Two park causes: (1) slice D blocker — `npm run data:scan-map` over the launch checkout's `default-cards.json` (Oct 6 snapshot) rebuilt 99,814 entries vs committed 95,895 (3,936 new keys, 17 gone, 4 changed `oracleId`/`name`); rebuilt map discarded, D code left uncommitted in the worktree with a `## Handoff` block in `slice-d.md`; (2) write scope — `classifyBuildWrites` → `park`: `PRD/work/scanner-recovers-and-runs-lighter/.playwright-mcp/a-failed.png` and `a-recovered.png` written in the launch checkout (gitignored, so launch porcelain before/after identical), plus a scratchpad copy of the committed map outside the root; builder's removal of the two PNGs was denied and is left to the owner. Builder also reported python heredoc edits to source files inside the worktree (contract stated limit 1: an interpreter write evades the hook) | 2026-10-18 |
| 6 | build (attempt 2, slice D) | sonnet | ok | `0 → 96` | owner answered the park (slim map from the committed map); commit `d42b6a32` (= origin tip); `scripts/slim-card-scan-map.mjs` + `.test.mjs` (`npm run data:scan-map:slim`); driver re-check of `git show ad5a0957:` vs `HEAD:` `cardScanMap.json`: 95,895 = 95,895 keys, same order, 0 `oracleId`/`name` diffs, 0 extra fields; reported gzip 6,552,206 → 5,310,581; card dump not read; criteria A 9/9, B 8/8, C 11/11, D 12/12 `true` (self-reported, `.graph-evidence.jsonl` not consulted); reported frontend tests 154 files / 1666 pass, `test:scripts` 1061 pass / 0 fail, typecheck 0, lint 0, prettier clean, `npm run quality:check` exit 0, frontend build `✓ built in 1.30s`; `PRD/sections/` REQ-048 + REQ-066 applied (`functional-requirements.md`, `system-map.md`, `scan/data/cardScanMap.md`); `App.zoneFlow.test.tsx` changed to assert the derived picture; `STATUS.ship-ready`; board row to ship-ready; PR #320 retitled `[THEJUDGE-AUTO][READY]`; return side: launch porcelain identical before/after, all 25 reported paths inside `.worktrees/implement-scanner-recovers-and-runs-lighter/`; worktree porcelain empty | 2026-10-18 |
| 7 | review | opus | ok | `0 → 33` | APPROVE, no-write reviewer (Plan agent, no Write/Edit): 40/40 criteria met; 0 Critical, 0 Important, 6 Minor (1 A2 tests settle the old promise first, so they would pass without the `=== attempt` guard; 2 C1 hosts also pass hook state as props; 3 D8 promoted REQ-048 / `cardScanMap.md` wording differs from the proposal per the owner's slice D decision and measured 5.31 / 6.55 MB sizes; 4 `a-failed.png` does not show the sentence; 5 `slice-c.evidence.md` C9 says no camera but `c-qq-390.png` holds a live webcam frame — gitignored, uncommitted; 6 D11 live check used a test image element, not the scan preview); out-of-scope note: Quick Question scanner title lost its `<h1>` role; C10 judged met (exit row and Capture visible at scroll 0 at 390x844, 360x740, 360x640); reviewer re-ran frontend tests 154 / 1666 pass, `test:scripts` 1061 / 0 fail, typecheck, lint, format all exit 0; map comparison `origin/main` vs `HEAD` 95,895 = 95,895, 0 diffs, byte-identical to committed minus `imageUrl`; gzip 6,552,206 → 5,310,564 | 2026-10-18 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Scanner recovers from a failed download, builds its data once, and shares one panel across tools | answered-once | shape | — |
| owner build signal: verdicts merged (PR #319, accept all five), then invoked `/graph-implement PRD/work/scanner-recovers-and-runs-lighter/` | answered-once | gate-review | — |
| "go with your recommendation, finish slice D" (answering the build park: produce the slim scan map from the committed map by a committed step that drops only the image address) | answered-once | build | — |
