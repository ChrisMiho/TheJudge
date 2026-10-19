# Receipt — player-visible-bugs (2026-10-19)

**What happened:** Six player-visible bugs are fixed and one was found not to exist. In Trade Balancer, a scanned card now defaults to the printing you scanned, so its price matches the card in your hand. The In-Depth scanner now says in one line under the camera why it will not add a card already on the Stack, and also says so when the Stack is full. Feedback sent from another tool no longer carries the hidden In-Depth question flow. Retry now resends a failed follow-up on a reopened conversation, and says "Confirm game context before decrypting." when there is nothing to resend. Reopening a saved question or draft from Question History while on Life Tracker keeps that question's players instead of copying the tracker's. In-Depth's zone tabs and its Reorder and Copies buttons are now 44 px tall (Life Tracker's segmented buttons stay 42 px). The seventh item, empty-named Stack cards, cannot happen (the request check already blocks them), so nothing changed.

**What it means for you:** Merge PR #337 and all of this ships together with this receipt. Nothing else needs doing for these bugs. Section a of the cleanup follow-ups file is now fully handled; see Follow-ups for who marks it.

- Date: 2026-10-19
- Slug: `player-visible-bugs`
- Status: shipped
- PR: https://github.com/ChrisMiho/TheJudge/pull/337 (open at close; the owner's merge lands code, truth, and this receipt together)
- Docs PR: #328 (merged; the `define` gate, REQ-214 accept, REQ-085 accept)
- Review: APPROVE on `5afd84bf` (attempt 2), 31/31 criteria, 0 Critical, 0 Important, 3 Minor

## Actions taken

- Slices A to E built on `thejudge-auto/player-visible-bugs-work`: A Trade scan keeps the scanned printing (`6aefffbe`), B feedback context and Retry (`8928c25e`), C scanner refusal line (`3d8fac5f`), D reopen keeps players (`1339f111`), E tap floor (`763e28d9`). A review loop sent B1 and C2 back; build attempt 2 added the missing tests (`acd36917`, `5afd84bf`) and review approved.
- Durable product truth was applied at `build`: REQ-214 (slice C) and REQ-085 (slice D). Confirmed present at close, nothing re-written and nothing left to promote.
- Receipt written; board row removed from `PRD/work/STATUS.md`; `PRD/work/player-visible-bugs/` removed with `git rm -r`. The gitignored `.playwright-mcp/` captures inside the package folder remain on disk (not tracked, not deleted).

## Durable truth confirmed present (no promotion needed)

| Gate ID | File | Check |
| --- | --- | --- |
| `REQ-214` | `PRD/sections/functional-requirements.md`, `PRD/sections/scan/README.md` | present once: heading `### REQ-214` appears once; the refusal-line wording is in both files |
| `REQ-085` | `PRD/sections/functional-requirements.md`, `PRD/sections/life-tracker/README.md` | present once: heading `### REQ-085` appears once; the reopen-keeps-players wording is in both files |

The branch diff against `origin/main` touches `PRD/sections/` in exactly those three files (14 insertions, 3 deletions). `system-map.md` has no entry for this package, so no status flip applies. No `DEC-###` was added.

## Intake

- `intake/IDEA.md` — origin: `PRD/ideasForLater/codebase-cleanup-followups/IDEA.md` (section a, the seven player-visible bugs), copied byte-for-byte at `shape`.

## Graph run

- Run ID: `graph-20261018-231413` (spec-forming half); `graph-20261019-083336` (build half) | Profile: `loaded (env sentinel)` | Terminal state: `COMPLETE`
- Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/337

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | in-place shape; branch `thejudge-auto/player-visible-bugs` created from `origin/main` and pushed (`git ls-remote` → `30149327`); porcelain empty; lock `.worktrees/.graph-run.lock` runId `graph-20261018-231413` pid 98290; universal canary `rm -rf` and graph canary `nohup` both denied | 2026-10-18 |
| 2 | shape | sonnet | ok | `0 → 13` | `PRD/work/player-visible-bugs/` (IDEA.md with 11 `## Prior run` lines, README.md, STATUS.ideation, `intake/IDEA.md` `cmp` identical to `PRD/ideasForLater/codebase-cleanup-followups/IDEA.md`) and board row committed `0b446c9d`, pushed; porcelain empty | 2026-10-18 |
| 3 | define | opus | ok | `0 → 131` | commits `bb969b49`, `61152941`, `c2d2ac60` (= origin tip): `DESIGN-BRIEF.md` (seven bugs; 1, 3, 5, 7 fixed to existing spec lines; 6 unreachable, no change), `GATE-QUESTIONS.md` (REQ-214 and REQ-085 amended; `## Blocker questions` none), `evidence/measurements.md` (Vite on port 5391, bugs 1–5 and part of 7 reproduced live; port released, `browser_close` called); `STATUS.refined` only marker, board row moved to refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; porcelain empty; node left an empty ignored `apps/frontend/node_modules/` folder (`rm -rf` denied) | 2026-10-18 |
| 4 | gate-qc | sonnet | failed | `0 → 26` | FAIL — 2 blocking (bug 2's scanner refusal line vs REQ-070's mockup rule at `functional-requirements.md:1690`; bug 7's `.seg` also used by Life Tracker, `.lt-scope .seg button` at `index.css:4587` 42px — both confirmed by the driver), 5 advisory; `QUALITY-CHECK.md` commit `c485b158` (= origin tip); `STATUS.refining`, board row moved; README `## Preparation gate` FAIL recorded by the driver; loops to `define` (FAIL 1 of 3) | 2026-10-18 |
| 3 | define (attempt 2) | opus | ok | `0 → 74` | commit `a4128f1c` (= origin tip): blocker 1 resolved as state copy outside REQ-070's helper-text clause (no REQ-070 amendment; REQ-070 grep disposition table, 7 rows); blocker 2 resolved — `.lt-scope .seg button` stays 42px, proof test asserts it, REQ-202 pair named; 5 advisories resolved; `GATE-QUESTIONS.md` REQ-214, REQ-085, blockers none; `STATUS.refined` only marker, board row moved; `git diff --stat origin/main...HEAD -- PRD/sections apps scripts` empty (`origin/main` moved by #323–#327, `scripts/` and one frontend test only, no `PRD/sections/` or `PRD/work/STATUS.md` change); porcelain empty | 2026-10-18 |
| 4 | gate-qc (attempt 2) | sonnet | ok | `0 → 16` | PASS, 0 blocking, 3 advisory (anchor the base `.seg button` assertion; optional test location; one long sentence); all seven attempt-1 findings resolved; every gate diff line matches `PRD/sections/` once (scripted); `QUALITY-CHECK.md` commit `81e16553` (= origin tip); README `## Preparation gate` PASS recorded by the driver; run stops at PASS → docs PR, `STATUS.owner-action`, board row moved to owner-action | 2026-10-18 |
| 5 | gate-review | sonnet | ok | `0 → 16` | build half run `graph-20261019-083336`: docs PR #328 merged (`origin/main` `e19dd31e`); in-place spec half, no kickoff worktree to remove; claim commit `aefeadcb` on `thejudge-auto/player-visible-bugs-work` cut from `origin/main` `e19dd31e`, pushed; lock taken from the launch root (pid 98290); graph canary `nohup true` denied; `graph-gate-review` commit `98073d9c` (= origin tip): 2 accept / 0 edit / 0 reject, `### Brief reconciliation` none; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main...HEAD -- PRD/sections apps scripts` empty; porcelain empty in worktree | 2026-10-19 |
| 4 | gate-qc (build-half re-grade) | sonnet | ok | `0 → 18` | PASS, 0 blocking, 3 advisory carried; every cited file:line unchanged on `e19dd31e` (only drift since `a4128f1c`: new `apps/frontend/src/lib/sharedContractLists.test.ts`); both gate diffs match `PRD/sections/` once (scripted); no colliding active package; `QUALITY-CHECK.md` commit `043da2eb` (= origin tip); `STATUS.refined` unchanged; README `## Preparation gate` PASS recorded by the driver | 2026-10-19 |
| 5 | plan | sonnet | ok | `0 → 28` | commit `d0c9a868` (= origin tip): `GAMEPLAN.md`, five slice docs A–E (A Trade scanned printing first; C applies REQ-214, D applies REQ-085; E carries the REQ-202 Life Tracker pair), five `slice-*.criteria.json` all `false` (31 criteria, 3 manual); `STATUS.active` only marker; board row under active; `git diff --stat origin/main...HEAD -- PRD/sections apps scripts` empty; porcelain empty | 2026-10-19 |
| 6 | build | sonnet | ok | `0 → 215` | PR https://github.com/ChrisMiho/TheJudge/pull/337 (`thejudge-auto/player-visible-bugs-work` → `main`, open); slice commits A `6aefffbe`, B `8928c25e`, C `3d8fac5f` (applies REQ-214), D `1339f111` (applies REQ-085), E `763e28d9` (= origin tip); 31/31 criteria `true`, **self-reported** (hook evidence log reads the launch root, not this worktree; no hook-earned evidence); node reports `npm run quality:check` exit 0 and full frontend suite 158 files / 1679 tests on local Node v26.0.0 (CI is Node 22; CI on `763e28d9` pending at return); `STATUS.ship-ready` only marker; return-side: launch checkout `git status --porcelain` identical before/after (`cmp`), `classifyBuildWrites` over 41 paths (37 branch-changed files + `.playwright-mcp/` + 3 `.tmp/` logs) → ok; Playwright MCP's own logs under `~/.cache/playwright-mcp/` are outside the repository and written by the MCP server, not a node tool write; dev server port 5473 released; one Python heredoc edit denied by the session classifier, not retried | 2026-10-19 |
| 7 | review | opus | failed | `0 → 60` | CHANGES on `6a282e15`, re-verified independently (full frontend suite 158 files / 1687 tests, typecheck and lint exit 0, both `PRD/sections/` diffs line-identical to the finalized gate diffs); 29/31 criteria met; 2 Important: B1 — `App.feedback.test.tsx:172-186` never switches back to In-Depth, so the return half is tested only at hook level; C2 — `ZoneCollectionStep.test.tsx:233-245` drives no scan lock and its holding-list assertion cannot fail (mock hard-codes `heldEntries: []` at `:52`); 3 Minor: stale comments `App.tsx:58-60` and `App.feedback.test.tsx:199-201`, loose Draft resume step `App.player-life-tracker-seed.test.tsx:203-204`; product code correct; CI green on `6a282e15` (`gh pr checks 337`); reviewer left porcelain empty; loops to `build` (1 of 2) | 2026-10-19 |
| 6 | build (attempt 2) | sonnet | ok | `0 → 53` | commits `67d9b798` (reopen B and C), `acd36917` (tests + comments), `5afd84bf` (= origin tip; B1, C2 `true`, `STATUS.ship-ready`); B1: new `App.feedback.test.tsx` test returns to In-Depth by browser Back and asserts Screen `MTG Assistant` + Flow step, fails with one-time registration (`expected undefined to be 'MTG Assistant'`); C2: new `useScanCapture.test.ts` test drives a real lock with `canHold` refusing, asserts `heldEntries` empty + `blockedNotice`, fails when the refusal branch adds the card; stale comments fixed in `App.tsx` and `App.feedback.test.tsx`; product code unchanged (`git diff fc58d0dd HEAD` touches only the two test files and a 3-line `App.tsx` comment); node reports quality:check exit 0, frontend 158 files / 1689 tests on Node v26.0.0; return-side: launch porcelain identical (`cmp`), all written paths inside `.worktrees/implement-player-visible-bugs/`; the hook denied two writes outside the worktree under `build-write-outside-worktree` (attempt 1: an `npm ci` log to `/tmp`; attempt 2: a backup copy to the session scratchpad) — both refused, nothing written, neither retried verbatim | 2026-10-19 |
| 7 | review (attempt 2) | opus | ok | `0 → 27` | APPROVE on `5afd84bf`: B1 met (`App.feedback.test.tsx` return-to-In-Depth test drives the full `<App />` via browser Back; fails if the inactive guard or the `active` dependency regresses); C2 met across `ZoneCollectionStep.test.tsx:233-243` (real `canHold`, notice in the open scanner) and `useScanCapture.test.ts:239-270` (real lock, `heldEntries` empty, `blockedNotice` set); diff since `fc58d0dd` = two test files + `App.tsx` comment only; frontend 158 files / 1689 tests, typecheck and lint exit 0; 31/31 criteria `true`; `STATUS.ship-ready` only marker; 3 Minor follow-ups (C2 no-grow check proven in the hook test, not the file C2 names; B1 return test does not name `Cards collected`; loose Draft resume step `App.player-life-tracker-seed.test.tsx:203-204`); reviewer left porcelain empty | 2026-10-19 |
| 8 | close | sonnet | ok | `0 → 20` | commit `1efd1d95` (= origin tip): receipt `PRD/instructions/receipts/player-visible-bugs-2026-10-19.md` with `## Graph run` (ledger folded verbatim), `## Intake`, `- PR:` line and `Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/337`; REQ-214 and REQ-085 confirmed present once, nothing re-written; `PRD/work/player-visible-bugs/` removed (`git ls-files` → 0); board row removed from `PRD/work/STATUS.md`; porcelain empty; launch checkout porcelain identical (`cmp`); PR https://github.com/ChrisMiho/TheJudge/pull/337 open | 2026-10-19 |

### Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-214` | accept | — |
| `REQ-085` | accept | — |

### Brief reconciliation

none

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Fix the player-visible bugs in section a, Trade scanned-printing bug first" | answered-once | shape | — |
| owner build signal: verdicts answered in `GATE-QUESTIONS.md` (REQ-214 accept, REQ-085 accept), docs PR #328 merged, then invoked `/graph-implement PRD/work/player-visible-bugs/` | answered-once | gate-review | — |

## Follow-ups

- Review Minor 1: the C2 "holding list does not grow" check lives in `apps/frontend/src/lib/scan/useScanCapture.test.ts`, not in `ZoneCollectionStep.test.tsx`, which criterion C2 names. The behavior is proven; the criterion text points at the wrong file.
- Review Minor 2: the B1 return-to-In-Depth test (`App.feedback.test.tsx`) does not name the `Cards collected` line among the things that come back.
- Review Minor 3: the Draft resume step at `App.player-life-tracker-seed.test.tsx:203-204` is loose and could assert more.
- Open knowledge: bug 6 (empty-named Stack cards) was found unreachable, because request validation already rejects them, and was left unchanged. No fix was built and no product truth was added.
- Ideas-for-later bookkeeping: `thejudge-cleanup` does not cover `PRD/ideasForLater/` edits, so `PRD/ideasForLater/codebase-cleanup-followups/IDEA.md` was not edited. Section a is now fully handled: bugs 1 to 5 and 7 are fixed, and bug 6 needed no change. The owner should mark section a done after merging; sections b to f are untouched.
- Local Node was v26.0.0 for the build and review runs; CI runs Node 22 and was green on `6a282e15`.
