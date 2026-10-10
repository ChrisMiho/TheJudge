# Receipt — rulesguru-local-suite — 2026-10-10

**What happened:** You can now run a private practice suite of RulesGuru
questions on your own machine. A hand-run import saves the questions into a
folder that git ignores. A converter turns them into practice cases. A lookup
step finds the cards each question names. A retrieval check shows whether the
deciding rules reach the prompt. An answer run asks the model and scores its
answers against RulesGuru's own answers. Results are reported apart from the
committed rules test corpus, and nothing from the suite is ever committed. The
data is used with permission, local only. Code PR:
https://github.com/ChrisMiho/TheJudge/pull/286 (open, not yet merged).

**What it means for you:** Merge PR #286 to ship this. After the merge, run
the first real import yourself, by hand. Then you can run the suite and read
how often the model agrees with RulesGuru, kept separate from the corpus.

## Summary

- Date: 2026-10-10
- Slug: rulesguru-local-suite
- Status: **shipped**
- PR: https://github.com/ChrisMiho/TheJudge/pull/286 (open, head `thejudge-auto/rulesguru-local-suite-work`, base `main`)
- Cleanup mode: graph-controlled invocation (node 8, `close`), build-half run
  `graph-20261010-205704`, PR-ready path. This receipt, the package deletion,
  the board strip and the `system-map.md` state ride in PR #286 before the
  owner's merge.
- PR-ready checks: (1) branch `thejudge-auto/rulesguru-local-suite-work`, HEAD
  equal to the remote tip after fetch (`1800d098`); (2) PR #286 open, head and
  base as above; (3) `STATUS.ship-ready` with every criterion in slices A to F
  `true`, read from the criteria files; (4) no runtime-cleanup criteria, since
  no dev server or browser ran.
- Durable truth confirmed present, not re-written: REQ-232 (new); REQ-185,
  REQ-186, REQ-188, REQ-226 in `PRD/sections/functional-requirements.md`;
  NFR-018 in `PRD/sections/non-functional-requirements.md`; the
  goals-and-non-goals line; both `PRD/sections/system-map.md` entries (the
  Answer-quality baseline entry already reads `shipped` and cites REQ-232).
- Verification (review attempt 3, APPROVE, 0 Critical, 0 Important):
  `npm run test:scripts` 846 pass, importer tests 17 pass, `npm run quality:check`
  exit 0, `git ls-files output/rulesguru` empty.

## Follow-ups

- The owner runs the first real import by hand after the merge.
- Review row 13 Minor 2: the compare report labels suite records under the
  tiers 1-2 heading.
- Review row 13 Minor 4: the loader's same-cards-same-answer duplicate check can
  reject the whole suite.
- Review row 13 Minor 5: the rate-limit pattern misses a curly apostrophe.
- Review row 17 Minor: the size-1 skip records the previous id rather than the
  failing next id and may not step past it across id gaps; bounded by the
  10-failure stop.

## Files

- Created: the importer, converter, lookup, retrieval-check and answer-run code
  and tests for the suite (55 files changed in the code PR, listed by
  `git diff --name-only origin/main...HEAD`), the receipt, and the `.gitignore`
  line for the suite folder.
- Updated: the `PRD/sections/` files named above.
- Deleted: `PRD/work/rulesguru-local-suite/` (including `intake/` and
  `GRAPH-RUN.md`), and its row in `PRD/work/STATUS.md`.

## Graph run

- Run ID: `graph-20261010-205704` (build half; spec-forming half `graph-20261010-193032`) | Profile: `unverified` | Terminal state: `COMPLETE`

Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/286

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 7` | branch `thejudge-auto/rulesguru-local-suite` pushed from `.worktrees/kickoff-rulesguru-local-suite` at `dabad406` (`git ls-remote --heads origin thejudge-auto/rulesguru-local-suite`); lock `.worktrees/.graph-run.lock` pid 81708; launch checkout untouched (still on `main`) | 2026-10-10 |
| 2 | shape | sonnet | ok | `0 → 12` | `PRD/work/rulesguru-local-suite/` (IDEA.md, README.md, STATUS.ideation, intake/GRAPH-BRIEF.md and intake/FINDINGS-fit.md byte-identical to the staged copies, `cmp` clean); commit `4cde331b`; 5 prior-run receipts in IDEA.md | 2026-10-10 |
| 3 | define | opus | ok | `0 → 77` | `PRD/work/rulesguru-local-suite/DESIGN-BRIEF.md`, `PRD/work/rulesguru-local-suite/GATE-QUESTIONS.md` (7 stable-ID slots: REQ-232 new, REQ-185, REQ-186, REQ-188, REQ-226, NFR-018, goals-and-non-goals; blockers B1, B2), `STATUS.refined`; commit `09a2779b`; 251-hit line-level grep with dispositions (12 amend / 9 build / 230 keep); REQ-185 diff inserts only, anchored on lines PR #283 does not change; no network request; `git diff --stat dabad406 HEAD -- PRD/sections apps scripts docs .gitignore` empty | 2026-10-10 |
| 4 | gate-qc | sonnet | failed | `0 → 27` | FAIL attempt 1 — `PRD/work/rulesguru-local-suite/QUALITY-CHECK.md`, commit `6e5cd0d0`, `STATUS.refining`; 3 findings (abbreviated removed line at GATE-QUESTIONS.md:129; permission wording at :67; name-lookup counts lack a command); everything else passed (18/19 diff lines exact, REQ-232 unused, grep 251/251, no RulesGuru text, #283 overlap clean); loop 1 of 3 back to define | 2026-10-10 |
| 5 | define | opus | ok | `0 → 40` | attempt 2 (gate-qc loop 1): commit `62296b1e`; (1) system-map:501 removed line quoted in full, readability note dropped; (2) purge sentence reworded, package grep for permission wording clean (intake left verbatim); (3) `evidence/name-lookup-counts.mjs` + `evidence/name-lookup-counts.out.txt` cited; 19/19 diff lines exact; grep 251/251; 9 verdict slots blank; `STATUS.refined`; `git diff --stat dabad406 HEAD -- PRD/sections apps scripts docs .gitignore` empty | 2026-10-10 |
| 6 | gate-qc | sonnet | ok | `0 → 18` | PASS attempt 2, findings none — `PRD/work/rulesguru-local-suite/QUALITY-CHECK.md`, commit `60955b1d`; findings 1–3 resolved; 19/19 diff lines exact; grep 251/251; 9 slots blank; no RulesGuru text; `git diff --stat dabad406 HEAD -- PRD/sections apps scripts docs .gitignore` empty; README `## Preparation gate` PASS written by the driver; parked `owner-action`; docs PR https://github.com/ChrisMiho/TheJudge/pull/284 | 2026-10-10 |
| 7 | gate-review | sonnet | ok | `0 → 16` | build half run `graph-20261010-205704`: claim commit `5ca804dc` on `thejudge-auto/rulesguru-local-suite-work` cut from `origin/main` `c6dec2ce` (docs PR #284 merge; kickoff worktree removed clean); `graph-gate-review` commit `714b5354`: 9 accept / 0 edit / 0 reject, brief reconciliation none, `## Gate verdicts` written, `## Open gate` resolved; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs .gitignore` empty; worktree porcelain empty | 2026-10-10 |
| 8 | gate-qc | sonnet | failed | `0 → 28` | FAIL build-half re-grade at `c6dec2ce` (code PR #285 merged after this spec was written) — `PRD/work/rulesguru-local-suite/QUALITY-CHECK.md`, commit `8476a3ef`, `STATUS.refining`, board row under refining; findings bookkeeping only: amendment-set grep 269 hits not 251 with shifted keys, 18 new no-change hits need rows, 3 rows with stale reasons, stale recipe-overlap prose (non-blocking); passed: 19/19 diff lines exact at `c6dec2ce`, added lines read correctly beside #285 wording, build-scope names present, 9/9 verdicts consistent, nothing outside the package changed, no suite content; README `## Preparation gate` FAIL written by the driver; loop 1 of 3 back to define | 2026-10-10 |
| 9 | define | opus | ok | `0 → 55` | build-half refresh (gate-qc loop 1): commit `02a2cc5b`; amendment set rebuilt at `c6dec2ce`: 269 hits = 12 amend / 9 build / 248 no-change, 18 new no-change rows, rows 5/63/89 reasons updated, no hit needed an amendment; evidence `evidence/amendment-grep.cmd.txt`, `evidence/amendment-grep.hits.txt` (269 lines), `evidence/amendment-grep.mjs`; recipe-overlap prose updated to #285 merged at `81739f35`; corpus count bullet 400 → 416 at `c6dec2ce`; `STATUS.refined` only marker, board row under refined; `git diff --stat 714b5354 HEAD -- GATE-QUESTIONS.md intake` empty; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs .gitignore` empty | 2026-10-10 |
| 10 | gate-qc | sonnet | ok | `0 → 19` | PASS build-half re-grade attempt 2, findings none — `PRD/work/rulesguru-local-suite/QUALITY-CHECK.md`, commit `9face57d`; findings 1–4 resolved; amendment grep 269 hits re-run, keys equal `evidence/amendment-grep.hits.txt`; 19/19 diff lines exact at `c6dec2ce`; build-scope names present; 9/9 accept consistent; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs .gitignore` empty; `STATUS.refined`; README `## Preparation gate` PASS written by the driver | 2026-10-10 |
| 11 | plan | sonnet | ok | `0 → 31` | commit `0d2538dd` — `GAMEPLAN.md` + 6 slices with criteria files (A folder/ignore/guards/loader 10; B import and purge 10; C lookup/headers/convert 10; D retrieval check 8; E answer run 11, manual E9; F PRD apply/README/promotion 11, manual F8), all criteria `false`; Preparation gate PASS verified first; `STATUS.active` only marker; board row under active; ignore line and REQ-232 in slice A before import code; no deliverable inside `PRD/work/` (driver grep of GAMEPLAN and slices); `--confirm-live-calls` appears only as refusal tests (E criteria); `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs .gitignore` empty; worktree porcelain empty | 2026-10-10 |
| 12 | build | sonnet | ok | `0 → 155` | code PR https://github.com/ChrisMiho/TheJudge/pull/286 (open, `thejudge-auto/rulesguru-local-suite-work → main`, title `[THEJUDGE-AUTO][READY]`, body carries `thejudge-auto:v1:registered:rulesguru-local-suite`); slice commits A `c78364d9`, B `0b4b1b13`, C `4ae9290a`, D `3a14f0af`, E `61a88876`, F `d85b0fb5`; 60/60 criteria `true` (self-reported: the hook reads criteria from the launch checkout, so no evidence was logged — review re-verifies); `STATUS.ship-ready` only marker; builder reports `npm run quality:check` exit 0; return-side checks: launch `git status --porcelain` identical before/after (`diff` clean), `classifyBuildWrites` over `git diff --name-only origin/main...HEAD` (55 files) → ok, 0 outside; `git diff --stat origin/main -- apps/backend/src/prompt apps/backend/src/routes apps/backend/src/providers apps/frontend` empty; `git ls-files output/rulesguru` empty; builder-reported deviations: import request keys and response envelope written from its own reading (driver note: `intake/FINDINGS-fit.md` and the brief's import section document the API — review checks against them), excluded external cases exempt from the deciding-rule requirement, compare report gained suite level and complexity tables, a few inline python/node edit scripts and one `sed -i` (mechanics, not denied) | 2026-10-10 |
| 13 | review | opus | failed | `0 → 55` | CHANGES REQUESTED at head `ea93c45b`, 1 Important / 0 Critical / 4 Minor; no-write `Plan`-type subagent re-ran `npm run test:scripts` (843 pass), `npm run typecheck`, `npm --workspace apps/backend run test -- src/eval` (135 pass), `npm run quality:check` (exit 0), `git check-ignore -v output/rulesguru/x.json` (`.gitignore:79`), `git ls-files output/rulesguru` (empty); 56/56 accepted added lines present; 60 of 62 criteria verified, B1 and B9 not. Important: `scripts/lib/rulesguru-import.mjs:34-44` `buildSettings` sends plural `levels` (numbers) and `complexities` (lowercase), not the recorded API vocabulary. Driver verified against ground truth — the probe's own crawl script that fetched 918 questions (`crawl_rulesguru.py`, kept in a session scratchpad outside the repo; settings block lines 5-12, stop rule line 55): singular `level` with the five level strings, singular `complexity` with the three capitalized names, `legality` all, `tags` empty, `tagsConjunc` NOT; and the API wraps back to id 1 past the last question instead of returning an empty batch, which the importer counts as failed requests (`rulesguru-import.mjs:182`), so a complete import would end too-many-failures and never mark complete. Minor (to the receipt): (2) compare report labels suite records under the tiers 1-2 heading (`scripts/lib/answer-compare.mjs:249,348`); (3) excluded suite cases skip the deciding-rule requirement — consistent, no change; (4) loader same-cards-same-answer duplicate check can reject the whole suite (`scripts/lib/gold-cases.mjs:455-462`); (5) rate-limit pattern misses a curly apostrophe. Loop 1 of 2 back to build | 2026-10-10 |
| 14 | build | sonnet | ok | `0 → 23` | attempt 2 (review loop 1): commit `826c5187` — `buildSettings` now sends singular `level` / `complexity` with the probe's values, `legality` all, `tags` empty, `tagsConjunc` NOT (driver read `scripts/lib/rulesguru-import.mjs` and confirmed it matches the probe script); a batch whose highest id is not above the cursor ends the import `end` and complete; mixed batch saves new ids then ends on the wrap; `classifyResponse` accepts a `data` list; 3 tests added; driver re-ran `node --test scripts/lib/rulesguru-import.test.mjs` (16 pass, 0 fail); builder reports `npm run test:scripts` 845 pass and `npm run quality:check` exit 0; return-side checks: launch porcelain identical (`diff` clean), `git diff --name-only 73700b6d HEAD` = 3 files, all inside the worktree; `STATUS.ship-ready`; criteria 60/60 `true` | 2026-10-10 |
| 15 | review | opus | failed | `0 → 17` | CHANGES REQUESTED at head `a73081fa`, 1 Important / 0 Critical / 1 Minor; request settings verified key for key against the probe script; `git diff --stat ea93c45b HEAD` = ledger + 3 slice-B files, so the other 52 criteria stand; re-ran `node --test scripts/lib/rulesguru-import.test.mjs` (16 pass), `npm run test:scripts` (845 pass), `npm run quality:check` (exit 0); B1–B10 verified. Important: `scripts/lib/rulesguru-import.mjs:183` drops every id at or below the cursor before the frozen check, and the API returns question id 1 only on the wrap (it reads `previousId` as after-this-id and rejects 0; the probe crawl began at id 2 and kept id 1 from the wrap), so a complete import never freezes id 1; the mixed-batch test at `rulesguru-import.test.mjs:105-111` encodes the loss. Driver confirmed at line 183; cause: the attempt-2 dispatch said ids at or below the cursor are already frozen, which the builder read as skip. Minor: wrapped ids no longer counted in `alreadyFrozen`. Loop 2 of 2 back to build | 2026-10-10 |
| 16 | build | sonnet | ok | `0 → 21` | attempt 3 (review loop 2): commit `161aff73` — early skip removed; every id in an ok batch is frozen if absent, counted `alreadyFrozen` if present, never overwritten; only ids above the cursor raise `highest`; end rule unchanged (driver read `scripts/lib/rulesguru-import.mjs:178-198`); mixed-batch test now expects `1.json`/`2.json`/`3.json`, new wrap test saves an absent `1.json` and leaves others byte-unchanged; the existing wrap test now pre-seeds 1–3 and expects `alreadyFrozen` 3 (builder change beyond the instruction, consistent with the rule); driver re-ran `node --test scripts/lib/rulesguru-import.test.mjs` (17 pass, 0 fail); builder reports `npm run test:scripts` 846 pass and `npm run quality:check` exit 0; launch porcelain identical; `git diff --name-only 597ea673 HEAD` = 3 files inside the worktree; `STATUS.ship-ready` | 2026-10-10 |
| 17 | review | opus | ok | `0 → 13` | APPROVE at head `991d9260`, 0 Critical / 0 Important / 1 Minor; no-write `Plan`-type subagent read the batch loop (`scripts/lib/rulesguru-import.mjs:178-211`): every id frozen if absent, never overwritten, cursor moves only on higher ids, wrap and empty batch both end complete, no endless loop, counts correct (row 15 Minor fixed); tests at `rulesguru-import.test.mjs:88-135` assert it; `git diff --stat a73081fa HEAD` = 3 slice-B files + ledger; re-ran `node --test scripts/lib/rulesguru-import.test.mjs` (17 pass), `npm run test:scripts` (846 pass), `npm run quality:check` (exit 0); B1–B10 verified; `git ls-files output/rulesguru` empty. Minor (pre-existing, to the receipt): the size-1 skip records `previousId` rather than the failing next id and may not step past it across id gaps (`rulesguru-import.mjs:226-229`); bounded by the 10-failure stop | 2026-10-10 |
| 18 | close | sonnet | ok | `0 → 18` | `thejudge-cleanup` PR-ready path, 4/4 checks pass (HEAD `1800d098` = origin; PR #286 open, base `main`; `STATUS.ship-ready`, all criteria `true` — driver recount 60/60 at `1800d098`, the node's 62 was a miscount; no runtime-cleanup criteria); commit `cc3d0b44` — this receipt, board row stripped from `PRD/work/STATUS.md`, `git rm -r PRD/work/rulesguru-local-suite/`; durable truth confirmed present, nothing promoted, no system-map flip needed; pushed `1800d098..cc3d0b44` without force; driver verified Node ledger rows 1–17 and the Instruction ledger byte-identical to `GRAPH-RUN.md` at `1800d098` and corrected the `## Intake` origin lines; code PR https://github.com/ChrisMiho/TheJudge/pull/286 | 2026-10-10 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "can you manage this for me, and pause when you need my input" (2026-10-10, ordering the recipe test and the RulesGuru suite) | answered-once | shape | — |
| "every piece of RulesGuru data stays on the owner's machine and is never committed" (intake decision 1) | answered-once | define | — |
| "Accept all recommended" (owner's answer to all 9 GATE-QUESTIONS.md slots, given in session 2026-10-10; filled by the driver at the owner's request) | answered-once | define | — |

## Intake

- `intake/GRAPH-BRIEF.md` — staged at launch from the owner's probe folder `PRD/work/probe-rulesguru/` (uncommitted), which the owner named in the launch request (graph-run brief for the local practice suite)
- `intake/FINDINGS-fit.md` — staged at launch from the same probe folder (counts-only findings on how the questions fit the harness)
