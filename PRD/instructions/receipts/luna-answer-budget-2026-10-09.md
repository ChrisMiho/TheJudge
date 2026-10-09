# Receipt — luna-answer-budget (2026-10-09)

**What happened:** The judge's live answers now run on GPT-6 Luna at its default effort. Each question gets one 30-second answer budget, and any retry spends from that same budget. The server's cap is raised to 40 seconds so the whole answer fits. The In-Depth help text that said "layers" was corrected.

**What it means for you:** After you merge PR #281 and deploy, hard rules questions get Luna's stronger answers, and a slow answer ends at 30 seconds instead of hanging. Nothing changes for players until the deploy.

- Slug: `luna-answer-budget`
- Status: shipped
- PR: https://github.com/ChrisMiho/TheJudge/pull/281
- Slices: A answer budget, B deploy config, C layers sentence, D eval defaults and ship gates — all done, all 30 criteria `true`, review APPROVE on attempt 2 (head `f13b191b`).

## Durable truth

Applied at build and confirmed present at close; nothing promoted at close. REQ-231 is new. NFR-002 (with the goals echo), REQ-181, REQ-182, REQ-186, REQ-188, REQ-190, REQ-226, REQ-228 and REQ-230 are amended. The In-Depth, Quick Lookup and system-map provider passages are updated. The system-map "OpenAI provider" entry is `shipped` and backed by REQ-231.

## Owner next steps

1. Merge PR #281.
2. After the merge: deploy (or re-run `scripts/aws-bootstrap.sh` with profile `thejudge-admin`). Then time one live tier-3 question and read `providerElapsedMs` in the CloudWatch tail. Confirm semantic retrieval served it rather than the lexical fallback. Confirm the function reads 40 s / `gpt-6-luna` / 30000 / 1.
3. Optional, paid, after the merge: the held-out arm-A run that judges the layers-sentence correction (REQ-230). It is not part of the build.
4. After the merge: `npm run graph:prune`.

## Slice D receipt notes

- Reserved-concurrency risk: five slow answers can hold the five reserved slots for up to about 30 s each.
- Wording looseness: the brief's REQ-230 wording is looser than the accepted slot, which only appends a note. The slot was followed.
- The intake's "REQ-178" is REQ-022.
- Slice C: the old layers sentence survives only as arm P's `replaces` string in `arm-p-correction.json`, by design, so arm P refuses to run.
- Slice A also updated one assertion in `scripts/eval-answer-quality.test.mjs` (production timeout now reads 30000).
- Amendment-set grep (`git grep -n -E 'gpt-4\.1|OPENAI_TIMEOUT_MS|per-attempt|under 3 seconds'`) re-run at build: remaining hits are dated history notes, the bake-off lineup and rate table, the eval script's regex reader, or the new REQ-231/NFR-002 notes. No amend row is left undone.

## Non-blocking review follow-ups

From review attempt 1:

- The 429 retry goes beyond the slot's wording.
- The retry guard near `openAiResponsesProvider.ts` lines 120-123 is untested.
- A late 5xx is retried while more than 750 ms remain.
- The D6 receipt grep quotes 4 of the brief's 18 terms (the reviewer checked all 105 amend rows directly).

From review attempt 2:

- `docs/aws/deployment.md` changes only the diagram's Lambda limit (20 s to 40 s); the doc never named model, budget or retries.

## Process notes

- The hook evidence log earned 0 entries for this build (the known evidence-root gap). Criteria are self-reported; the review is the integrity check.
- Plan attempt 1 stopped on a harness permission denial of a compound heredoc command. Attempt 2 finished with Write and Edit.

## Graph run

- Run ID: `graph-20261009-142138` (spec-forming half); build half `graph-20261009-150059` | Profile: `loaded (env sentinel)` | Terminal state: COMPLETE

Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/281

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 6` | branch `thejudge-auto/luna-answer-budget` pushed from `.worktrees/kickoff-luna-answer-budget` at `a28c048f` (`git ls-remote --heads origin thejudge-auto/luna-answer-budget`); lock `.worktrees/.graph-run.lock` pid 93685; launch checkout untouched | 2026-10-09 |
| 2 | shape | sonnet | ok | `0 → 11` | `PRD/work/luna-answer-budget/` (IDEA.md, README.md, STATUS.ideation, intake/GRAPH-BRIEF.md byte-identical to staged copy); commits `610e7df4`, `1dc46900`; 3 prior-run receipts in IDEA.md | 2026-10-09 |
| 3 | define | opus | ok | `0 → 76` | `PRD/work/luna-answer-budget/DESIGN-BRIEF.md`, `PRD/work/luna-answer-budget/GATE-QUESTIONS.md` (10 stable-ID slots + Blocker questions: none), `STATUS.refined`; commit `81cdba28`; 366-hit line-level grep with dispositions in the brief; `git diff --stat a28c048f HEAD -- PRD/sections apps scripts` empty | 2026-10-09 |
| 4 | gate-qc | sonnet | ok | `0 → 22` | PASS — `PRD/work/luna-answer-budget/QUALITY-CHECK.md`, commit `291c2dc5`; 0 mismatches over 15 diff blocks; 366/366 grep hits dispositioned; README `## Preparation gate` written by the driver | 2026-10-09 |
| 5 | gate-review | sonnet | ok | `0 → 11` | build half run `graph-20261009-150059`: claim commit `b93f4dc9` on `thejudge-auto/luna-answer-budget-work` cut from `origin/main` `b4bb41dd` (kickoff worktree removed clean); `graph-gate-review` commits `bc87ea42`, `40974ff1`: 10 accept / 0 edit / 0 reject, brief reconciliation none, `## Gate verdicts` written, `## Open gate` resolved; `STATUS.refined` only marker; board row under refined; worktree porcelain empty; launch checkout porcelain unchanged; `git diff --stat a724b90f 40974ff1 -- PRD/sections apps scripts` empty | 2026-10-09 |
| 6 | gate-qc | sonnet | ok | `0 → 15` | PASS attempt 2 (build-half re-grade), findings none — `PRD/work/luna-answer-budget/QUALITY-CHECK.md`, commit `d9be4af2`; 21 diff blocks 0 mismatches vs `PRD/sections/` at `b4bb41dd`; 366/366 amendment-grep hits dispositioned; 3 non-blocking map-out notes; `STATUS.refined` only marker; README `## Preparation gate` PASS written by the driver; launch checkout porcelain unchanged | 2026-10-09 |
| 7 | plan | sonnet | failed | `0 → 14` | attempt 1: harness permission layer (auto mode, not the graph hook — no `.worktrees/.graph-denials.jsonl` entry for this run) denied one compound Bash call (`cd … && cat > luna-answer-budget/GAMEPLAN.md <<'EOF' …` plus README edits, `git mv STATUS.refined STATUS.active`, board-row move); not retried. Left uncommitted in the worktree: `slice-a-answer-budget.md`, `slice-b-deploy-config.md`, `slice-c-layers-sentence.md`, `slice-d-eval-defaults-and-ship.md` + four `slice-*.criteria.json` (30 criteria, 4 manual); GAMEPLAN, README slice table, marker and board row not written; launch checkout porcelain unchanged | 2026-10-09 |
| 8 | plan | sonnet | ok | `0 → 18` | attempt 2: commit `c0f1d309` — `GAMEPLAN.md` + 4 slices with criteria files (A answer budget, 9 criteria, manual A9; B deploy config, 6; C layers sentence, 6, manual C6; D eval defaults and ship, 9, manual D7, D9), all criteria `false`; attempt-1 files kept, one fix (slice C verification command); Preparation gate PASS verified first; `STATUS.active` only marker; board row under active; no deliverable inside `PRD/work/`; worktree porcelain empty; launch checkout porcelain unchanged | 2026-10-09 |
| 9 | build | sonnet | ok | `0 → 158` | code PR https://github.com/ChrisMiho/TheJudge/pull/281 (OPEN, `[THEJUDGE-AUTO][READY]`, MERGEABLE, head `bf40f5bf`); commits `0cb2d3a2` (A), `b98ad23e` (B), `909f4e0d` (C), `bf40f5bf` (D, `STATUS.ship-ready`); 30/30 criteria `true` read from the four `slice-*.criteria.json` (self-reported — `.worktrees/.graph-evidence.jsonl` got 0 entries for this run, the known evidence-root gap); builder-reported: backend 639/639, `test:eval` 3/3, `test:scripts` 766/766, `quality:check` exit 0; return-side: launch checkout porcelain identical before/after, `classifyBuildWrites` over the 70 changed paths → ok (all inside `.worktrees/implement-luna-answer-budget/`); C1 literal deviation self-noted (old sentence kept as the arm P `replaces` string in `apps/backend/src/eval/answer-quality/arm-p-correction.json`) | 2026-10-09 |
| 10 | review | opus | failed | `0 → 40` | CHANGES REQUESTED on PR #281 head `bf40f5bf` (loop 1 of 2 to build): 0 Critical / 1 Important / 4 Minor. Important: A3 classify-by-cause unmet — `apps/backend/src/providers/openAiResponsesProvider.ts:56` and `:65` test `error.name` against `APIUserAbortError` / `APIConnectionTimeoutError` / `APIConnectionError`, but openai SDK classes leave `.name` as `Error` (driver re-verified: `node -e` prints `Error Error Error`), so classification falls to the message regex; probe: an abort with a non-default message maps to PROVIDER_UNAVAILABLE. Minor (receipt follow-ups, no loop): 429 retried beyond the slot's wording; retry guard at `:120-123` untested; late 5xx retried while >750 ms remain; D6 receipt grep quotes 4 of the brief's 18 terms (reviewer checked all 105 amend rows directly). Re-ran: typecheck, backend 639/639, `test:scripts` 766/766, `test:eval` 3/3, lint 0 errors, `format:check` clean, `bash -n` both scripts | 2026-10-09 |
| 11 | build | sonnet | ok | `0 → 18` | attempt 2 (review loop 1 fix): commit `f13b191b` — `openAiResponsesProvider.ts:56`/`:65` now `instanceof OpenAI.APIUserAbortError` / `APIConnectionTimeoutError` / `APIConnectionError`; A3 test throws an abort with a non-default message and asserts PROVIDER_TIMEOUT 504; new connection-error retry test; slice A doc notes the fix; builder-reported backend 640/640, `test:scripts` 766/766, `quality:check` exit 0; 30/30 criteria `true`; diff 3 files (+25/−3), all inside the worktree; launch checkout porcelain unchanged | 2026-10-09 |
| 12 | review | opus | ok | `0 → 32` | APPROVE attempt 2 on PR #281 head `f13b191b` (re-ran at `422ff98b`, ledger-only difference): 0 Critical / 0 Important / 1 Minor (B4 literal: `docs/aws/deployment.md:36` changes only the diagram's Lambda limit 20 s → 40 s; the doc never named model/budget/retries, matching the brief's single amend row); A3 fix confirmed against openai 6.49.0 `core/error.js` (`instanceof` binds to the real classes; A3 test message matches no timeout regex); all 30 criteria graded met on the work, C1 and B1 on the accepted slot; re-ran: typecheck, backend 640/640 with OpenAI env unset, `test:eval` 3/3, `test:scripts` 766/766, eslint 0 errors, `format:check` clean, `bash -n` both scripts; `coverage:check` not re-run (writes to disk) | 2026-10-09 |
| 13 | close | sonnet | ok | `0 → 18` | `thejudge-cleanup` commit `8467dc57` on `thejudge-auto/luna-answer-budget-work`: receipt `PRD/instructions/receipts/luna-answer-budget-2026-10-09.md` (Graph run, Intake, `- PR:` line, Terminal state COMPLETE), `PRD/work/luna-answer-budget/` deleted (17 files), board row removed, durable truth confirmed present (nothing promoted); code PR https://github.com/ChrisMiho/TheJudge/pull/281 open; worktree porcelain empty; launch checkout porcelain unchanged | 2026-10-09 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Switch live answers to GPT-6 Luna at default effort under one 30-second answer budget (Lambda ~40 s, retries inside the budget), amend NFR-002, and correct the layers sentence" | answered-once | shape | — |
| "Decisions 1–9 are closed; do not reopen the model choice, the effort setting or the 30 s figure" | answered-once | define | — |
| "/graph-implement PRD/work/luna-answer-budget/" (2026-10-09, after the owner merged docs PR #280: build half) | answered-once | gate-review | — |

## Intake

- `intake/GRAPH-BRIEF.md` — the owner's graph-run brief handed to `graph-kickoff` with the launch request; staged under `.worktrees/.graph-intake/graph-20261009-142138/`, byte-identical copy kept in the package. It cites `PRD/work/probe-luna-time-limit/FINDINGS-time-limit.md` and `PRD/work/probe-answer-quality/REPORT.md`.
