# Receipt — follow-ups-keep-their-rules — 2026-10-12

**What happened:** When a player pushes back on Luna's ruling ("that's wrong, check
again"), Luna now re-checks against the same rule excerpts she had on the first answer.
Before this, the follow-up searched the rules again using the pushback's own words, so
most of the first answer's excerpts fell away and the re-check ran on different rules.
Follow-ups now reuse the opening question's rules, curated topics and step guidance, in
both Quick Lookup and In-Depth. The answer-quality eval also gained a two-turn pushback
mode, so the owner can measure whether right answers hold and wrong ones get fixed.
Code PR: https://github.com/ChrisMiho/TheJudge/pull/297 (open, not yet merged).

**What it means for you:** Merge PR #297 to ship it. After the merge, run the two paid
before/after pushback runs listed under Follow-ups below to see the effect on real
answers. A follow-up that raises a brand-new topic still gets no new rules; that
variant is a recorded follow-up item, not part of this build.

## Summary

- Date: 2026-10-12
- Slug: follow-ups-keep-their-rules
- Status: **shipped**
- Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/297
- Cleanup mode: graph-controlled invocation (node 8, `close`), build-half run
  `graph-20261012-152231`, **PR-ready path** — this receipt and the package deletion are
  committed on the code branch and ride in PR #297, before the owner's merge.
- Package classification: autonomous — `README.md` carries `## Autonomous metadata`
  (`Autonomous base: origin/main`).
- PR: https://github.com/ChrisMiho/TheJudge/pull/297

## What shipped

- **Slice A — eval pushback mode (REQ-247, REQ-226, REQ-228).** The answer-quality eval
  gains a two-turn `--follow-up pushback` mode. Tooling only (`scripts/`). Commit
  `61ea4899`. 14/14 criteria true.
- **Slice B — follow-ups keep the opening question's rules (REQ-246).** One function
  decides the question rule selection reads (the conversation's first history turn, else
  the question); System 3 search, In-Depth question-word topics and Quick Lookup step
  guidance all read it. Seven amendments (REQ-022, REQ-024, REQ-027, REQ-074, REQ-178,
  REQ-238, REQ-242) and the derived-doc rows applied with the code. Commit `3626876e`.
  13/13 criteria true.
- Both slices `done`; 27/27 criteria true across `slice-{a,b}.criteria.json`.

## Verification

- Review (node 9, opus, no-write): **APPROVE**, attempt 1, Critical 0, Important 0.
  Criteria A1–A14 and B1–B13 met with file:line evidence. The reviewer re-ran
  `npm --workspace apps/backend run test` (54 files, 813 pass), `npm run test:scripts`
  (925 pass), `npm run typecheck`, `npm run lint` (0 errors, 14 warnings in untouched
  files) and `npm run format:check`, all passing.
- Build counts (2026-10-12, 62-case diagnostic manifest, committed frozen vectors; counts
  only): follow-up retrieval query text equals the opening's 62/62; System 3 selection
  equals the opening's, in order, 62/62; curated topics equal 9/9 In-Depth cases;
  `PHASE GUIDANCE` equal 53/53 lookup cases; the three rules sections byte-identical
  62/62. The reviewer re-ran `evidence/measure-follow-up.mjs` and got the same.
- B10 (embedder repeatability): embedding one text twice in one process returned the same
  vector on the stock MiniLM model. The Magic-trained model is not present in the build
  worktree, so the production embedder was not run; recorded as an observation.
- Refinement measurement counts (REQ-246 Notes say these are recorded here; counts only,
  from `evidence/offline-measurement.md`, 2026-10-12 at `0461969f`, 62 diagnostic cases):
  - the follow-up's search text differed from the opening's in 62 of 62
  - on the keyword half alone a pushback follow-up kept 357 of the opening question's 836
    opening excerpts, all of them in 1 case
  - 6 of 9 In-Depth cases changed curated topics, losing 8
  - re-running the opening question with history attached selected turn 1's rules in 62
    of 62
- Code PR state read at cleanup: `gh pr view 297` returned `state: OPEN`,
  `baseRefName: main`, `headRefName: thejudge-auto/follow-ups-keep-their-rules-work`.
  Branch `HEAD` equals `origin/thejudge-auto/follow-ups-keep-their-rules-work`
  (`738802fb`) after fetch. GitHub API reachable; no fallback needed.
- No paid or live model call was made at build, review, or this cleanup.

## Durable truth confirmed

Applied at `build` together with the code; none re-written at cleanup. Present on this
branch (`git diff --stat origin/main HEAD -- PRD/sections` shows 8 files changed):

- `PRD/sections/functional-requirements.md` — new `### REQ-246` and `### REQ-247`;
  amendments to REQ-022, REQ-024, REQ-027, REQ-074, REQ-178, REQ-226, REQ-228, REQ-238,
  REQ-242.
- `PRD/sections/in-depth/README.md`, `PRD/sections/quick-lookup/README.md`,
  `PRD/sections/integrations-and-data.md`, `PRD/sections/system-map/game-rules-retrieval.md`,
  `PRD/sections/system-map/prompt-assembly.md`, `PRD/sections/system-map/prompt-layout-spec.md`,
  `PRD/sections/user-flows.md` — derived-doc rows.
- `PRD/sections/system-map.md` has no entry for this feature, so there is nothing to flip
  to `shipped`.

## Follow-ups

Reviewer's Minor findings (node 9), none blocking:

1. REQ-246 Notes reword the accepted parenthetical to "counts only, recorded in the
   build's receipt" and add a measured-at-build note. Intended; the refinement counts
   are carried in this receipt (see Verification).
2. Offline eval callers (`retrievalReportInputs.ts:48-51` and the harness game path)
   still select rules from follow-up text. Pre-existing, no production impact.
3. Turn 2 re-embeds card texts without a shared vector cache (efficiency only).
4. B6's test calls `buildMockAnswer` directly rather than through `ASK_AI_PROVIDER=mock`.

Recorded follow-up item (REQ-246, `## Gate verdicts`): once REQ-247's pushback mode
exists, test a variant for new-topic follow-ups where the follow-up's own search fills
only excerpt slots the opening question left free, never displacing an opening-question
excerpt (first case: the Necropotence "what about end step cleanup?" turn).

Owner-run, post-merge, paid (a reading, not a gate; from `GAMEPLAN.md`): two runs,
`gpt-6-luna`, cap 15, the 62-case diagnostic manifest, 3 repeats, `--follow-up pushback`,
`--max-cost-usd 7` each. A "before" run from slice A's commit (`61ea4899`) and an "after"
run from the merged head. The dry run prints the estimate first. The success reading is
in `DESIGN-BRIEF.md`, `## Acceptance targets` (deleted with the package; the targets are
carried in REQ-246 and REQ-247).

## Files

- Created: `PRD/instructions/receipts/follow-ups-keep-their-rules-2026-10-12.md`.
- Updated: `PRD/work/STATUS.md` (package row removed from `## ship-ready`).
- Deleted: all of `PRD/work/follow-ups-keep-their-rules/` via `git rm -r`.
- Code and `PRD/sections/` changes shipped by slices A and B are in PR #297's earlier
  commits and were not touched at cleanup.

## Graph run

- Run ID: `graph-20261012-152231` | Profile: `unverified` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/297

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 6` | branch `thejudge-auto/follow-ups-keep-their-rules` cut from `origin/main` `0461969f` into `.worktrees/kickoff-follow-ups-keep-their-rules` and pushed (`git ls-remote` shows `0461969f`); lock `.worktrees/.graph-run.lock` holds run `graph-20261012-195753`; universal canary `rm -rf .worktrees/.graph-canary-nonexistent` denied, graph canary `nohup true` denied while the lock was held; `Profile: unverified`; launch checkout porcelain unchanged (4 untracked folders) | 2026-10-12 |
| 2 | shape | sonnet | ok | `0 → 19` | commit `d9f2bb2d` pushed: `PRD/work/follow-ups-keep-their-rules/` with `IDEA.md` (8 `## Prior run` lines), `README.md`, `STATUS.ideation`, `intake/GRAPH-BRIEF.md` and `intake/DRIVER-NOTE-changes-since-the-brief.md` (driver `cmp`: byte-identical to staging), board row under `## ideation`; staged copy left (removal under `.worktrees/` is denied) | 2026-10-12 |
| 3 | define | opus | ok | `0 → 101` | `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (11 slots, all verdicts blank: new REQ-246, REQ-247; amended REQ-022, REQ-024, REQ-027, REQ-074, REQ-178, REQ-226, REQ-228, REQ-238, REQ-242; no blocker), `evidence/amendment-grep.md` (268 hits = 13 amend / 13 build / 242 no change), `evidence/offline-measurement.md` (62-case diagnostic manifest at `0461969f`: carried excerpts 62/62, In-Depth curated topics 9/9, lookup step guidance 53/53; today 6 of 9 In-Depth follow-ups change topics); `STATUS.refined` only marker, board row under `## refined`; driver `git diff --stat HEAD -- PRD/sections apps scripts` empty. Deviation: node wrote the first README/board/grep drafts with short python scripts and renamed markers with `mv` (no denial) | 2026-10-12 |
| 4 | gate-qc | sonnet | ok | `0 → 19` | PASS, attempt 1 of 3: every old and context line of the 11 diffs matches `PRD/sections/functional-requirements.md` at its stated line (scripted exact match, 0 misses); 13 amend rows map to slots; three plain-language lines and blank verdicts in each slot; REQ-246/REQ-247 free on main; numeric targets trace to `evidence/offline-measurement.md`; code references true; no practice-suite data. One non-blocking nit (evidence line cited `askAiRequest.ts:227`, true line 228) fixed by the driver. `README.md` `## Preparation gate` written PASS | 2026-10-12 |
| 5 | gate-review | sonnet | ok | `0 → 18` | build half run `graph-20261012-152231`: claim commit `1a3ea9a9` on `thejudge-auto/follow-ups-keep-their-rules-work` cut from `origin/main` `67678d05` (docs PR #296 merge; kickoff worktree removed clean); lock taken from the launch root, graph canary `nohup true` denied; `graph-gate-review` commit `997fc929`: 11 accept / 0 edit / 0 reject, brief reconciliation none, `## Gate verdicts` written, `## Open gate` resolved; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs` empty; worktree porcelain empty | 2026-10-12 |
| 6 | gate-qc | sonnet | ok | `0 → 14` | PASS, build-half attempt 1 of 3, re-graded after gate resolution at `origin/main` `67678d05`: all 24 old/context diff lines match `PRD/sections/functional-requirements.md` verbatim at their stated lines; REQ-246/REQ-247 free (REQ-245 last, line 6455); brief code references true (`useAskAiSubmitOrchestration.ts`, `askAiRequest.ts:231-246`, `routes/askAi.ts:106-110`, `gameRulesTopicSelection.ts:142`, `preparation.ts`); brief consistent with 11 accepts, REQ-246 follow-up item out of build scope; `STATUS.refined` only marker; porcelain empty. Non-blocking: `DESIGN-BRIEF.md` line 6 still says the eleven slots are to be decided. `README.md` `## Preparation gate` stands PASS, findings none | 2026-10-12 |
| 7 | plan | sonnet | ok | `0 → 25` | `GAMEPLAN.md`; `slice-a-eval-pushback-mode.md` + `slice-a.criteria.json` (14 criteria, all `false`, each with evidence; REQ-247, REQ-226, REQ-228; tooling only); `slice-b-follow-ups-keep-rules.md` + `slice-b.criteria.json` (13 criteria, all `false`; REQ-246 + seven amendments + 13 derived-doc rows; ship gates); REQ-246 follow-up item listed out of scope; paid before/after runs listed as owner steps; `STATUS.active` only marker; README `## Slices`; board row moved refined → active | 2026-10-12 |
| 8 | build | sonnet | parked | `0 → 147` | Work done: slice A commit `61ea4899`, slice B commit `3626876e`, pushed (`origin` tip `3626876e`); criteria 14/14 and 13/13 `true`; PR https://github.com/ChrisMiho/TheJudge/pull/297 open; node set `STATUS.ship-ready`. Return-side check: launch checkout `git status --porcelain` identical before and after (4 untracked folders). Write scope: `classifyBuildWrites` outcome `park` — `node 6 wrote outside its scope: /tmp/<grep-count temp file, deleted>`. Also self-reported: bare `git stash` then `git stash pop` once (contract `## Boundaries`: never drop, pop or reorder a stash); `git stash list` top entry afterwards is the older `green-mobile-branch-declutter-work` WIP, so the pop took back only its own push. Hook denials this run: none — `git stash pop` is denied only in `.claude/graph-profile.json` (not loaded, `Profile: unverified`), and `scripts/lib/boundary-rules.mjs` has no stash rule. Other self-reported deviations: edits via Python/`sed` instead of Write/Edit; gitignored `node_modules` symlinks in the worktree; read-only use of the launch checkout's model cache for B10 (stock MiniLM; trained model absent) | 2026-10-12 |
| 9 | review | opus | ok | `0 → 57` | APPROVE, attempt 1, no-write `Plan` subagent on resume after the accepted build park (driver commits `f5746f6d`, `bc55099a`: `STATUS.ship-ready` restored, board row back under ship-ready). A1–A14 and B1–B13 met with file:line evidence; reviewer re-ran `npm --workspace apps/backend run test` (54 files, 813 pass), `npm run test:scripts` (925 pass), `npm run typecheck`, `npm run lint` (0 errors, 14 warnings in untouched files), `npm run format:check` — all pass; re-ran `evidence/measure-follow-up.mjs` (62/62, 9/9, 53/53, sections byte-identical 62/62). Critical 0, Important 0. Minor: (1) REQ-246 Notes reword the accepted parenthetical to `counts only, recorded in the build's receipt` and add a measured-at-build note — by-intent, but the receipt must carry the refinement counts; (2) offline eval callers `retrievalReportInputs.ts:48-51` and the harness game path still select rules from follow-up text (pre-existing, no production impact); (3) turn 2 re-embeds card texts without a shared vector cache (efficiency); (4) B6's test calls `buildMockAnswer` directly rather than via `ASK_AI_PROVIDER=mock`. Worktree porcelain clean after review | 2026-10-12 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "merged it, start the follow-ups build" (owner, in session 2026-10-12; mechanics: launch the queued follow-ups kickoff from `PRD/work/probe-prompt-format-tuning/GRAPH-BRIEF.md`) | answered-once | preflight | — |
| "fill in the answers with your recommendation" (owner, in session 2026-10-12, after the PR #296 summary; covers exactly the 11 slots of this `GATE-QUESTIONS.md`; the driver filled 11 accept verdicts, REQ-246 accepted as proposed with a recorded follow-up item for new-topic follow-ups) | answered-once | gate-qc | — |
| "merged, accept, and then i will run in a new session" (owner, in session 2026-10-12; resolves the `build` park in `## Open gate`: accept the `/tmp` write and the stash pop; PR #298 merged) | answered-once | build | — |

## Intake

- `intake/GRAPH-BRIEF.md` — the probe's self-contained brief, `PRD/work/probe-prompt-format-tuning/GRAPH-BRIEF.md` (written 2026-10-10), staged verbatim at kickoff
- `intake/DRIVER-NOTE-changes-since-the-brief.md` — written by the graph driver at kickoff on 2026-10-12 (what changed on `main` after the brief, notably #293); evidence, not authority
