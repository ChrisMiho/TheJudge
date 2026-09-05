# Graph run — hybrid-rule-retrieval

- Run ID: `graph-20260905-191535` (build half, `/loop graph-implement`; spec-forming half `graph-20260905-173655`)
- Profile: spec-forming half `loaded (env sentinel)` (observed by the preflight script at node 1); build half `unverified` (launch command not stated in the session)
- Build-half canary: `denied — hook live (graph tier: nohup true → "[graph-boundary] `nohup` is denied while a graph run holds the lock")`, 2026-09-05, lock `graph-20260905-191535`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent → "[graph-boundary] `rm -rf` is denied in every session."; graph tier: nohup true → "[graph-boundary] `nohup` is denied while a graph run holds the lock")`
- Autonomous base: `origin/thejudge-auto/hybrid-rule-retrieval`
- Staging: `.worktrees/.graph-intake/graph-20260905-173655/`
- Current node: `build`
- Next action: `/graph-implement PRD/work/hybrid-rule-retrieval/` (the `/loop graph-implement` build loop is driving)

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 4` | branch `thejudge-auto/hybrid-rule-retrieval` created from `main` (`0243e83`, tree `clean`, no stash) and pushed to `origin` (`git ls-remote` confirms); lock `.worktrees/.graph-run.lock` runId `graph-20260905-173655` pid 77812; both canaries denied (2 rows in `.worktrees/.graph-denials.jsonl` for this run); `Profile: loaded (env sentinel)`; base→main guard passed (no open `thejudge-auto/*` PR) | 2026-09-05 |
| 2 | shape | sonnet | ok | `0 → 44` | package `PRD/work/hybrid-rule-retrieval/` created (`IDEA.md` with 8 `## Prior run` receipts, `README.md` `status: ideation`, `STATUS.ideation`, board row under `## ideation`); 2 intake files copied verbatim into `intake/` (`cmp` clean, driver re-checked) from `.worktrees/.graph-intake/graph-20260905-173655/`, staging deleted; 21 tool calls, no subagents; commit `8fc3f8b` pushed | 2026-09-05 |
| — | driver-bookkeeping | — | ok | `n/a (driver)` | `## Autonomous metadata` (`origin/thejudge-auto/hybrid-rule-retrieval`) written to the package README; ledger moved into the package from the driver's scratchpad; committed with the node 3 dispatch prompt recorded | 2026-09-05 |
| 3 | define | opus | ok | `0 → 69` | `STATUS.refined`, board row under `## refined`; `DESIGN-BRIEF.md` (401 lines, four items in one spec, measurement plan) + `GATE-QUESTIONS.md` (865 lines, 14 slots: 3 new REQ-182/183/184, 11 amended — REQ-022/032/177/181, NFR-002/017, system-map.md, game-rules-retrieval.md, quick-lookup/README.md, in-depth/README.md, integrations-and-data.md; 0 blocker questions; 18 `Current:` blocks verified byte-for-byte by script). Measurements reproduced: `test:eval` semantic 9/12 (three fixtures fail, not the intake's two) lexical 12/12; benchmark lexical clean r@5 0.5833, semantic 0.8526/0.8333; budget test 118.095 MB of 120 MB; hybrid probe α=0.52 → 12/12 fixtures + 0.8654/0.8333; cold start 181.2 ms model readiness in-process; int8 vectors 5.650 → 1.442 MB. Finding: `benchmark:rag-retrieval -- --semantic` silently reports lexical numbers under a cold model cache (REQ-177 amendment). Gate signal present (`GATE-QUESTIONS.md`) → continue to `gate-qc`. No `PRD/sections/` or code edits (`git diff --stat` empty); 63 tool calls, no subagents; commit `227eeda` pushed | 2026-09-05 |
| 4 | gate-qc | sonnet | failed → define (loop 1 of 3) | `0 → 40` | FAIL, one finding: `PRD/sections/system-map/prompt-layout-spec.md:36` (row 8, `ADDITIONAL RELEVANT RULE EXCERPTS`) still asserts semantic-primary ranking with keyword fallback and has no `GATE-QUESTIONS.md` block (driver confirmed by grep: 0 mentions of `prompt-layout-spec` in the proposal). Everything else passed: 12 `Current:` blocks byte-identical, amendment-set grep otherwise covered, REQ-182/183/184 unused and next free, all four measurements reproduced exactly (`test:eval` 9/12 semantic, 12/12 lexical; benchmark 0.5833 / 0.8526 / 0.8333; budget 118.095 MB). Node set `STATUS.refining`, board row under `## refining`; 29 tool calls, no subagents; commit `214d184` pushed. Driver wrote `## Preparation gate` FAIL to the README | 2026-09-05 |
| 3 | define (attempt 2) | opus | ok | `0 → 34` | one block added to `GATE-QUESTIONS.md`: `## system-map/prompt-layout-spec.md — the prompt anatomy spec` (row 8 + `Backed by:` line, REQ-182 wording); 16 `## ` headings now (15 stable-id/spec blocks + `## Blocker questions`); 16-term amendment-set re-grep found no further uncovered assertion; 21 `Current:` fences script-verified, 0 mismatches; brief's spec list now names six files; `STATUS.refined`, board row under `## refined`; no `PRD/sections/` or code edits (`git diff --stat` empty); 30 tool calls, no subagents; commit `f13f8d2` pushed | 2026-09-05 |
| 4 | gate-qc (attempt 2) | sonnet | ok | `0 → 35` | PASS, no findings: 21/21 `Current:` excerpts byte-identical by script (incl. the new `prompt-layout-spec.md` block); REQ-182/183/184 unused, REQ-181 highest live; 13-term amendment-set re-grep leaves no uncovered assertion; measurements reproduced once each (`test:eval` semantic 9/12 / lexical 12/12; benchmark 0.5833 lexical, 0.8526/0.8333 semantic; budget 118.095 MB of 120 MB); hybrid gates are measured thresholds with baselines; `STATUS.refined` unchanged, nothing committed; 28 tool calls, no subagents. Driver discarded the benchmark's regenerated `scoredAt` timestamps in `results.json`/`semantic-results.json` (`git checkout --`, timestamp-only) → stop at PASS: docs PR + `owner-action` park | 2026-09-05 |
| — | driver-resume | — | ok | `n/a (driver)` | build half (`/loop graph-implement`, tick 1, 2026-09-05): `git fetch origin`; no stop sentinel; no lock held; ready-spec scan found `hybrid-rule-retrieval` at `STATUS.owner-action` with 15/15 `- Verdict:` slots answered (14 accept, 1 edit on NFR-017), docs PR #195 MERGED 2026-09-05T19:11:26Z at `c0aa52c`, no code built; base `thejudge-auto/hybrid-rule-retrieval` fast-forwarded to `origin/main` (`c0aa52c`); claim commit `b41ec8c` (`STATUS.active`, README `status: active`, board row under `## active`); lock taken (`npm run graph:preflight -- --take-lock --slug hybrid-rule-retrieval --run-id graph-20260905-191535`, pid 13714); graph canary `nohup true` denied | 2026-09-05 |
| — | gate-review | sonnet | ok | `0 → 24` | applied 14 accept / 1 edit / 0 reject inside `GATE-QUESTIONS.md` (NFR-017 gained one `- Notes:` bullet recording the CUDA-runtime CI rejection and PR #194's fix; `git show 334f377 -- GATE-QUESTIONS.md` +7 lines); `git diff -- PRD/sections/` empty; `## Gate verdicts` written (15 rows), `## Open gate` resolved 2026-09-05; `STATUS.active → STATUS.refined`, README `status: refined`, board row under `## refined`; 12 tool calls, no subagents, 0 denials; commit `334f377` (local, not pushed) | 2026-09-05 |
| 4 | gate-qc (build half, attempt 1) | sonnet | ok | `4 → 29` (4 driver calls charged before dispatch) | PASS, no findings: 21/21 `Current:` blocks byte-identical by script against live `PRD/sections/` at `c0aa52c`; REQ-182/183/184 unused, next free after REQ-181; 16-term amendment-set grep (three new terms) found only unrelated hits (UI `hybrid %` bands, `decisions/deployment.md` S3 staging); NFR-017 owner edit consistent with `scripts/package-lambda.sh` lines 43–44 (`ONNXRUNTIME_NODE_INSTALL_CUDA=skip`) and 64–101 (unzipped-size breakdown), `lambda-package-budget.test.mjs` still hardcodes the 130 MB reserve as the edit states; `test:eval` semantic 9/12 (same three fixtures) lexical 12/12; budget test 2/2, 118.095 MB of 120 MB; all 15 verdict slots filled; nothing committed, tree clean; 21 tool calls, no subagents, 0 denials. Driver wrote `## Preparation gate` PASS to the README | 2026-09-05 |
| 5 | plan | sonnet | ok | `0 → 83` (node self-reported 34; the hook counter is the record) | `GAMEPLAN.md` + five slice docs (A `slice-a-hybrid-blend.md`, B `slice-b-eval-gating.md`, C `slice-c-lambda-vector-budget.md`, D `slice-d-cold-start-measurement.md`, E `slice-e-deploy-default.md`) + `slice-{a..e}.criteria.json` (10/6/8/2/7 criteria, driver-checked: all `false`, every one with an `evidence` block; 3 `manual`); all 15 `GATE-QUESTIONS.md` blocks assigned one slice each in the GAMEPLAN's assignment table (A 8, B 1, C 2, D 1, E 3); README slice table + implementation map, `status: active`, `STATUS.refined → STATUS.active` (only marker), board row under `## active`; `## Preparation gate` PASS verified by the node; no subagents, 0 denials; commit `94b3b33`; `git status --porcelain` empty | 2026-09-05 |

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-182` | accept | — |
| `REQ-183` | accept | — |
| `REQ-184` | accept | — |
| `REQ-032` | accept | — |
| `REQ-177` | accept | — |
| `REQ-181` | accept | — |
| `REQ-022` | accept | — |
| `NFR-002` | accept | — |
| `NFR-017` | edit | "add one more Notes bullet recording the 2026-09-05 deploy rejection: the 130 MB non-data reserve was measured on macOS, but on the linux/x64 CI runner onnxruntime-node's postinstall downloaded the CUDA runtime (which the Lambda CPU runtime never loads) and AWS rejected the package as over 250 MB unzipped even though the budget test passed. Fixed on main in PR #194: `scripts/package-lambda.sh` now sets `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` for the packaging install and measures the real unzipped bytes with a per-entry breakdown, failing before upload when over quota. The reserve figure is to be re-measured on the CI runner, not a laptop." |
| `system-map.md` | accept | — |
| `system-map/game-rules-retrieval.md` | accept | — |
| `quick-lookup/README.md` | accept | — |
| `in-depth/README.md` | accept | — |
| `integrations-and-data.md` | accept | — |
| `system-map/prompt-layout-spec.md` | accept | — |

## Open gate

- **Resolved** 2026-09-05: 15/15 stable IDs verdicted (14 accept, 1 edit — `NFR-017`, reason recorded above and applied inside its proposed diff in `GATE-QUESTIONS.md`), 0 rejects, 0 blocker questions. Docs PR #195 merged to `main` at `c0aa52c`. Package restored to `STATUS.refined`; the resumed run re-enters at `gate-qc`.
- **Prior ask (resolved):** Decide. Answer every `- Verdict:` slot (accept / edit / reject, with a reason on edit or reject) in `PRD/work/hybrid-rule-retrieval/GATE-QUESTIONS.md` — 15 slots, 0 blocker questions — then merge the docs-only PR to `main` to build.
- **Evidence:** gate-qc attempt 2 PASS (row 4 above); `## Preparation gate` in `README.md`; the proposal's measurements recorded under `DESIGN-BRIEF.md` `## Measurement plan`.
- **PR:** https://github.com/ChrisMiho/TheJudge/pull/195 (docs-only, `thejudge-auto/hybrid-rule-retrieval` → `main`; merged 2026-09-05T19:11:26Z at `c0aa52c`)
- **Resume:** `/graph-implement PRD/work/hybrid-rule-retrieval/` — re-enters at `gate-qc`.

## Dispatch prompts

### preflight

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20260905-173655`, the spec-forming half driven by `graph-kickoff`. Invoke the `graph-preflight` skill with the Skill tool (skill name `graph-preflight`) and follow it exactly. Read `.claude/skills/graph-preflight/SKILL.md` and `PRD/instructions/graph-workflow-contract.md` before acting.

Inputs (fixed by the driver; do not change them):
- `--branch thejudge-auto/hybrid-rule-retrieval`
- `--run-id graph-20260905-173655`
- `--slug hybrid-rule-retrieval`
- `--pid 77812` (the driver session's own long-lived pid, so the lock does not read stale)
- Base: the checkout is on `main`, in sync with `origin/main` at `0243e83`. Do not pass `--base`; report the resolved `base:` line the script prints.

Procedure:
1. Run `npm run graph:preflight -- --branch thejudge-auto/hybrid-rule-retrieval --run-id graph-20260905-173655 --slug hybrid-rule-retrieval --pid 77812 --dry-run`. Report the classification, the resolved base, the planned commands, and the `profile sentinel:` / `Profile:` lines verbatim.
2. If the classification is `blocked`, or the script exits 2 (stop sentinel, base→main guard, lock held, or branch collision), stop and relay the script's message verbatim. Never hand-resolve anything to get past it.
3. Otherwise run the identical command without `--dry-run`.
4. Issue the universal canary (`CANARY_COMMAND`) and the graph canary (`GRAPH_CANARY_COMMAND`) as real Bash tool calls, exactly as the script prints them. Each must be denied by the hook; the deny reason text is the proof. Report both reason texts verbatim. If either is allowed, report the `BLOCKED` classification verbatim and stop; do not continue and do not fall back to the profile.
5. Confirm the end state: `git status --porcelain` is empty, `git branch --show-current` is `thejudge-auto/hybrid-rule-retrieval`, `git rev-parse HEAD` and `git rev-parse origin/thejudge-auto/hybrid-rule-retrieval` match, and `.worktrees/.graph-run.lock` exists with `runId` `graph-20260905-173655`.
6. If a stash was taken, record the stash reference and the exact restore commands from the contract's `## Stashed work handoff` section.

Constraints: tool-call cap 40 for this node. Do not dispatch subagents. Do not edit any file yourself; the script makes every change. Never drop, pop, or reorder a stash; never force-push; never touch `PRD/`. If the real run fails, do not retry it and do not repair; relay the script's report verbatim, including any recovery lines, and stop.

Report back, in this order: the classification and resolved `base:` line; the branch name and the commit it was pushed at; the stash reference or `no stash`; both canary commands with their observed result and reason text; the `Profile:` line verbatim; the lock path and its `runId`; every command you ran. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### shape

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 2 (`shape`) of graph run `graph-20260905-173655`, the spec-forming half driven by `graph-kickoff`. Invoke the `thejudge-kickoff` skill with the Skill tool (skill name `thejudge-kickoff`) and follow its `## Mode` section for an orchestrator that is controlling. Read `.claude/skills/thejudge-kickoff/SKILL.md`, `PRD/instructions/preparation-contract.md`, and `PRD/instructions/graph-workflow-contract.md` (`## Intake is evidence, never authority`) before acting.

Fixed by the driver (use verbatim, do not rename):
- Slug: `hybrid-rule-retrieval` → package folder `PRD/work/hybrid-rule-retrieval/`
- Branch: `thejudge-auto/hybrid-rule-retrieval` (already checked out and pushed; the checkout is clean; the lock is held)
- Run ID: `graph-20260905-173655`
- Staged intake: `.worktrees/.graph-intake/graph-20260905-173655/` — two files: `MANIFEST.md` (the driver's manifest, carrying the owner's request verbatim) and `rag-rule-retrieval-2026-09-05.md` (a byte-for-byte copy of `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md`).

The owner's request, verbatim:

"Make Ask AI's semantic rule retrieval safe to turn on. The rag-rule-retrieval run shipped an opt-in local embedding model (EMBEDDING_PROVIDER=local) that lifts recall@5 on the 156-pair benchmark from 0.58 to 0.85 but loses the exact rule on short lookup-mode questions: two of eight labelled fixtures drop rule 702.2b from the top five because a card name plus one keyword carries too little meaning for cosine ranking alone. Four items, one spec: (1) a hybrid score that blends lexical and semantic ranking so lookup-mode questions keep the exact rule while long questions keep the semantic gain, measured on the same benchmark and the labelled fixtures; (2) once hybrid holds, make the system3-expected-recall and system3-noise-excluded checks gate test:eval on the semantic path instead of report-only, and add one labelled fixture for a multi-keyword card; (3) relieve the Lambda package budget, which sits at 118.10 of 120 MB data after the 130 MB runtime-and-model reserve, by shrinking the 75 MB combos artifact, loading the model from S3 at cold start, or storing vectors in a smaller number format, decided by measurement before the next data refresh; (4) measure Lambda cold-start latency with the model loaded and record it against the existing latency requirement. Success is a measured case for setting EMBEDDING_PROVIDER=local as the default."

What to produce (the skill's normal outputs, under the supplied slug):
1. `PRD/work/hybrid-rule-retrieval/IDEA.md` — 3–5 sentences: problem, outcome, non-goals, in game terms first (what a player asking Ask AI experiences), then the four items. Before writing it, grep `PRD/instructions/receipts/` for slug and keyword matches (retrieval, rag, semantic, embedding, rule, prompt-context, lookup) against the request and the intake, and write one `## Prior run` line per match naming the receipt path. Offer matches as input, never as scope.
2. `PRD/work/hybrid-rule-retrieval/README.md` with `status: ideation` at the top.
3. The empty marker `PRD/work/hybrid-rule-retrieval/STATUS.ideation` (exactly one `STATUS.*`).
4. A row for the package under `## ideation` in `PRD/work/STATUS.md`.
5. Only after the package folder exists: copy both staged intake files verbatim into `PRD/work/hybrid-rule-retrieval/intake/` (verify with `cmp` or `diff -rq`), then delete the staged copies under `.worktrees/.graph-intake/graph-20260905-173655/` (plain `rm` of the two files and `rmdir` of the folder; never `rm -rf`).
6. Stage the new package paths explicitly (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md` — never `git add -A`, `--all`, or `.`) and commit on the current branch with a message like `shape(hybrid-rule-retrieval): package created, intake staged`, ending with the two trailer lines:
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
   Then `git push origin thejudge-auto/hybrid-rule-retrieval` (no force).

Investigate only request-relevant PRD and code to select the one evidence-backed candidate: the receipt in the intake, `PRD/sections/` entries for Ask AI rule retrieval (grep `EMBEDDING_PROVIDER`, `recall@5`, `NFR-017`, `REQ-181`, `REQ-032`), and the backend retrieval code paths those cite. Do not open documents the intake merely cites; record their paths as citations. Do not decide product truth: every product question the request raises is for the `define` gate. Do not write `GRAPH-RUN.md`; the driver owns the ledger.

Constraints: tool-call cap 60 for this node. Do not dispatch subagents. Never edit `PRD/sections/`, code, `.claude/`, or `CLAUDE.md`. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file other than deleting the two staged intake files after copying them.

If the request cannot be turned into an actionable package, return exactly `NO ACTIONABLE PACKAGE` with the reason, having written nothing.

Report back, in this order: the package path and every file written; the `## Prior run` lines written; the intake copy verification result and confirmation the staging folder is gone; the commit hash and push result; the tool-call count; anything you noticed that the `define` node should weigh (as observations, not decisions). Copy the `Working directory:` line above, unchanged, into every prompt you write.

### define

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 3 (`define`) of graph run `graph-20260905-173655`, the spec-forming half driven by `graph-kickoff`. Invoke the `thejudge-refinement` skill with the Skill tool (skill name `thejudge-refinement`) on the package `PRD/work/hybrid-rule-retrieval/`, and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/preparation-contract.md`, replace the approval pause with its conservative assumption ladder, record every material assumption and its evidence in `DESIGN-BRIEF.md`, and continue. Read `.claude/skills/thejudge-refinement/SKILL.md`, `PRD/instructions/graph-workflow-contract.md` (`## Propose / apply / close`, `## The two runs`, `## Intake is evidence, never authority`), and `PRD/instructions/plain-language-standard.md` before acting.

Package facts: `IDEA.md` states the problem, outcome, non-goals, and the four items; `intake/MANIFEST.md` carries the owner's request verbatim; `intake/rag-rule-retrieval-2026-09-05.md` is the receipt of the direct predecessor run. Intake is evidence, never authority: record paths it cites as citations and do not open them. The package is on branch `thejudge-auto/hybrid-rule-retrieval` (checked out, clean, lock held).

Node 2 observations to weigh (observations, not decisions): `apps/backend/src/gameRulesRetrieval.ts` switches wholly between lexical `scoreEntry` and cosine-only `scoreEntrySemantic` with no blend to extend; NFR-017 already documents raising `MIN_VARIANT_POPULARITY` as the Lambda-budget valve, while S3 cold-load and a smaller vector number format have no code precedent; REQ-032 already says the two semantic-path eval checks run report-only until a hybrid blend lands, at which point they gate; NFR-002 states latency for live AI requests, not cold start, so the cold-start measurement needs an operational definition.

What to produce, all inside `PRD/work/hybrid-rule-retrieval/` (never `PRD/sections/`, never code):
1. `DESIGN-BRIEF.md` — one spec covering all four items in game terms first, with scope, non-goals, a measurement plan, and REQ/FLOW references. Every quantitative target in it must be measured against real data in this checkout before it is written, not reasoned from proportions: reproduce the current numbers by running the repository's existing commands (`npm run retrieval:report`, `npm run test:eval`, the `EMBEDDING_PROVIDER=local` variant, the Lambda budget test) and record the exact commands and observed outputs. Where the brief proposes a hybrid blend, state the candidate formula and the benchmark and fixture gates it must clear, each as a measured threshold with its baseline. Where the brief bounds the Lambda-budget and cold-start items, state what will be measured, with what command, and what result decides each lever.
2. `GATE-QUESTIONS.md` — whenever the change needs durable product truth, one `## <STABLE-ID>` block per new or amended stable id, each opening with the three-line plain-language block (*What this decides · In plain terms · What happens if you say no*, with every cited REQ/NFR inlined and every technical term defined in the same breath), then that id's complete proposed `PRD/sections/` diff (a `Current:` block copied byte-for-byte from the live file, then the proposed replacement; never a summary), then `- Verdict:` and `- Reason:` slots. Enumerate the amendment set by grep, not memory: search `PRD/sections/` for every live assertion the change touches (`EMBEDDING_PROVIDER`, `recall@5`, `report-only`, `hybrid`, `never worse`, `NFR-017`, `NFR-002`, `REQ-032`, `REQ-181`, `120 MB`, `cold start`) and give each touched id its own block. New ids are named and reserved (next free `REQ-###` after the highest live one), never written into live files. The whole proposal gates, so every new and amended id gets a slot, not the headline ones alone. Any genuine decision blocker under the contract's three-condition test goes under `## Blocker questions` with a stable `Q-###` id, to the same plain-language standard; preserve the furthest valid artifacts and return it rather than guessing.
3. Status: set `status: refining` while in flux, and on completion of the brief and proposal set `status: refined` in `README.md`, replace the marker with `STATUS.refined` (exactly one `STATUS.*`), and move the board row in `PRD/work/STATUS.md` from `## ideation` to `## refined` (remove the old row, add the new one).
4. Commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`; never `git add -A`, `--all`, or `.`), message `define(hybrid-rule-retrieval): design brief and gate proposal`, ending with the two trailer lines:
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
   Then `git push origin thejudge-auto/hybrid-rule-retrieval` (no force). Leave `GRAPH-RUN.md` alone; the driver owns the ledger. Leave `README.md`'s `## Autonomous metadata` section unchanged.

Constraints: tool-call cap 150 for this node, and it counts every call you make. Do not dispatch subagents; a helper's calls charge this node's own budget and a prior run exhausted its cap that way. Long-running measurement commands are fine, but run each once and record the output. Never edit `PRD/sections/`, code, tests, `.claude/`, or `CLAUDE.md`. Never run `npm run data:refresh` or any Scryfall network refresh. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file. No new dependency, endpoint, data contract, or external integration without authoritative scope; propose such things as gate questions instead.

Report back, in this order: the status marker and board row after the node; the files written; the number of `## <STABLE-ID>` blocks in `GATE-QUESTIONS.md` (new vs amended) and the count of blocker questions; the commit hash and push result; the commands you ran to reproduce measurements with their key numbers; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### gate-qc (attempt 1)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 4 (`gate-qc`) of graph run `graph-20260905-173655`, the spec-forming half driven by `graph-kickoff`. Invoke the `thejudge-quality-check` skill with the Skill tool (skill name `thejudge-quality-check`) on the package `PRD/work/hybrid-rule-retrieval/`, and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/preparation-contract.md`, emit an explicit PASS or FAIL verdict with the complete findings, and return it to the driver, which records it in the package README's `## Preparation gate` section. Read `.claude/skills/thejudge-quality-check/SKILL.md`, `PRD/instructions/technical-design-rules.md`, `PRD/instructions/plain-language-standard.md`, and `PRD/instructions/graph-workflow-contract.md` (`## The two runs`) before acting.

What to check, beyond the skill's own checklist:
1. `DESIGN-BRIEF.md` against the current-state feature specs it touches (`PRD/sections/quick-lookup/README.md`, `PRD/sections/in-depth/README.md`, `PRD/sections/system-map/game-rules-retrieval.md`, `PRD/sections/system-map.md`, `PRD/sections/integrations-and-data.md`) and the `REQ`/`NFR` entries it cites: no contradictions, current vocabulary, stack ordering preserved, technical-design-rules respected, scope implementable without hidden assumptions, no user-visible screen change (so no `screen-layout.md` row is required; confirm that claim).
2. `GATE-QUESTIONS.md`: every `## <STABLE-ID>` block opens with the three-line plain-language block, inlines every cited id, defines its technical terms, carries a complete diff (not a summary), and has `- Verdict:` / `- Reason:` slots. Verify every `Current:` block byte-for-byte against the live `PRD/sections/` file by script, not by eye. Confirm the new ids (REQ-182, REQ-183, REQ-184) are unused in live `PRD/sections/` and are the next free numbers. Re-grep the amendment set yourself (`EMBEDDING_PROVIDER`, `recall@5`, `report-only`, `hybrid`, `never worse`, `NFR-017`, `NFR-002`, `REQ-032`, `REQ-181`, `120 MB`, `cold start`, `MIN_VARIANT_POPULARITY`, `float32`) and FAIL if a live assertion the change would falsify has no block.
3. Every quantitative target in the brief must rest on a recorded measurement. Reproduce the cheap ones once each and compare: `npm --workspace apps/backend run test:eval` (expect the semantic path at 9 of 12 labelled checks, lexical 12/12), `npm run benchmark:rag-retrieval` and `npm run benchmark:rag-retrieval -- --semantic` (expect lexical clean recall@5 0.5833, semantic clean 0.8526 / polluted 0.8333), and `node --test scripts/lambda-package-budget.test.mjs` (expect 118.095 MB of 120 MB). A number in the brief that the checkout does not reproduce is a FAIL finding with both values. Confirm the hybrid gates in the brief are stated as measured thresholds with baselines, not proportions.
4. Confirm the package state: `STATUS.refined` is the only marker, `README.md` reads `status: refined`, the board row sits under `## refined`, and `README.md` carries `## Autonomous metadata`.

Verdict handling: on PASS, change nothing (leave `STATUS.refined`; do not write `GAMEPLAN.md`, slice docs, or code; do not edit the README, the driver writes the gate section). On FAIL, set `status: refining` in `README.md`, replace the marker with `STATUS.refining`, move the board row under `## refining`, commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`, never `git add -A`, `--all`, or `.`) with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
and push `origin thejudge-auto/hybrid-rule-retrieval` (no force). Never edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `PRD/sections/`, code, or `GRAPH-RUN.md`.

Constraints: tool-call cap 60 for this node, counting every call. Do not dispatch subagents; a helper's calls charge this node's own budget and a prior gate-qc exhausted its cap that way. Run each measurement command once. Never run `npm run data:refresh` or any Scryfall refresh. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file.

Report back, in this order: the one-word verdict (PASS or FAIL); the complete findings list, or `none`; the `Current:` block verification result (count checked, count identical); the amendment-set grep result; each reproduced measurement with the brief's value beside it; the package state after the node; the commit hash if you committed; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### define (attempt 2)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 3 (`define`), attempt 2, of graph run `graph-20260905-173655`, the spec-forming half driven by `graph-kickoff`. The quality check (node 4, attempt 1) returned FAIL with one finding, and the package is back at `STATUS.refining`. Invoke the `thejudge-refinement` skill with the Skill tool (skill name `thejudge-refinement`) on the package `PRD/work/hybrid-rule-retrieval/`, following its `## Mode` section for an orchestrator that is controlling, and correct the finding. Read `.claude/skills/thejudge-refinement/SKILL.md`, `PRD/instructions/plain-language-standard.md`, and `PRD/instructions/graph-workflow-contract.md` (`## The two runs`) before acting.

The finding, verbatim from the quality check:

> `PRD/sections/system-map/prompt-layout-spec.md`, row 8 of the prompt-section table, has no gate block. It says Ask AI's rule excerpts are 'ranked by meaning against committed per-rule embeddings with a keyword-overlap fallback' (citing REQ-181) — the same semantic-primary-with-lexical-fallback description that GATE-QUESTIONS.md does correct in `system-map.md`, `system-map/game-rules-retrieval.md`, `quick-lookup/README.md`, and `in-depth/README.md`. REQ-182's hybrid blend falsifies this row exactly the way it falsifies the other four, and it was missed.

What to do:
1. Add one `## system-map/prompt-layout-spec.md — <plain title>` block to `GATE-QUESTIONS.md`, in the same shape as the existing amended-spec blocks: the three-line plain-language block (*What this decides · In plain terms · What happens if you say no*, cited ids inlined, terms defined), a `Current:` block copied byte-for-byte from the live file (row 8 of the table at `PRD/sections/system-map/prompt-layout-spec.md:36`, and any other line in that file the change falsifies — grep it for `REQ-181`, `meaning`, `embedding`, `fallback`, `hybrid`), the proposed replacement consistent with the REQ-182 wording already used in the sibling blocks, and `- Verdict:` / `- Reason:` slots. Place it beside the other amended-spec blocks, before `## Blocker questions`.
2. Re-run the amendment-set grep across `PRD/sections/` once more (`EMBEDDING_PROVIDER`, `recall@5`, `report-only`, `hybrid`, `never worse`, `NFR-017`, `NFR-002`, `REQ-032`, `REQ-181`, `120 MB`, `cold start`, `MIN_VARIANT_POPULARITY`, `float32`, `ranked by meaning`, `keyword-overlap fallback`, `per-rule embeddings`) and add a block for any other live assertion the change falsifies that still has none. Verify every `Current:` block in the file byte-for-byte against live `PRD/sections/` by script before committing.
3. Update the brief only where it lists the amended specs, so `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` name the same set. Do not re-run the measurements; the checkout reproduced all of them at gate-qc.
4. Status: set `status: refined` in `README.md`, replace `STATUS.refining` with `STATUS.refined` (exactly one `STATUS.*`), and move the board row in `PRD/work/STATUS.md` from `## refining` to `## refined` (remove the old row, add the new one). Leave the README's `## Autonomous metadata` and `## Preparation gate` sections unchanged; the driver rewrites the gate section after the re-check.
5. Commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`; never `git add -A`, `--all`, or `.`), message `define(hybrid-rule-retrieval): gate block for prompt-layout-spec row 8`, ending with the two trailer lines:
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
   Then `git push origin thejudge-auto/hybrid-rule-retrieval` (no force). Leave `GRAPH-RUN.md` alone.

Constraints: tool-call cap 150 for this node, counting every call. Do not dispatch subagents. Never edit `PRD/sections/`, code, tests, `.claude/`, or `CLAUDE.md`. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file. Do not widen scope beyond the finding and what the re-grep surfaces.

Report back, in this order: the status marker and board row after the node; the blocks added (ids and titles) and the new total block count; the re-grep result; the `Current:` verification result; the commit hash and push result; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### gate-qc (attempt 2)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 4 (`gate-qc`), attempt 2 (re-check after define attempt 2 corrected the one finding: a block for `system-map/prompt-layout-spec.md` row 8 was added), of graph run `graph-20260905-173655`, the spec-forming half driven by `graph-kickoff`. Invoke the `thejudge-quality-check` skill with the Skill tool (skill name `thejudge-quality-check`) on the package `PRD/work/hybrid-rule-retrieval/`, and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/preparation-contract.md`, emit an explicit PASS or FAIL verdict with the complete findings, and return it to the driver, which records it in the package README's `## Preparation gate` section. Read `.claude/skills/thejudge-quality-check/SKILL.md`, `PRD/instructions/technical-design-rules.md`, `PRD/instructions/plain-language-standard.md`, and `PRD/instructions/graph-workflow-contract.md` (`## The two runs`) before acting.

What to check, beyond the skill's own checklist:
1. `DESIGN-BRIEF.md` against the current-state feature specs it touches (`PRD/sections/quick-lookup/README.md`, `PRD/sections/in-depth/README.md`, `PRD/sections/system-map/game-rules-retrieval.md`, `PRD/sections/system-map.md`, `PRD/sections/integrations-and-data.md`) and the `REQ`/`NFR` entries it cites: no contradictions, current vocabulary, stack ordering preserved, technical-design-rules respected, scope implementable without hidden assumptions, no user-visible screen change (so no `screen-layout.md` row is required; confirm that claim).
2. `GATE-QUESTIONS.md`: every `## <STABLE-ID>` block opens with the three-line plain-language block, inlines every cited id, defines its technical terms, carries a complete diff (not a summary), and has `- Verdict:` / `- Reason:` slots. Verify every `Current:` block byte-for-byte against the live `PRD/sections/` file by script, not by eye. Confirm the `system-map/prompt-layout-spec.md` block now exists with byte-identical `Current:` excerpts and a replacement consistent with REQ-182. Confirm the new ids (REQ-182, REQ-183, REQ-184) are unused in live `PRD/sections/` and are the next free numbers. Re-grep the amendment set yourself (`EMBEDDING_PROVIDER`, `recall@5`, `report-only`, `hybrid`, `never worse`, `NFR-017`, `NFR-002`, `REQ-032`, `REQ-181`, `120 MB`, `cold start`, `MIN_VARIANT_POPULARITY`, `float32`) and FAIL if a live assertion the change would falsify has no block.
3. Every quantitative target in the brief must rest on a recorded measurement. Reproduce the cheap ones once each and compare: `npm --workspace apps/backend run test:eval` (expect the semantic path at 9 of 12 labelled checks, lexical 12/12), `npm run benchmark:rag-retrieval` and `npm run benchmark:rag-retrieval -- --semantic` (expect lexical clean recall@5 0.5833, semantic clean 0.8526 / polluted 0.8333), and `node --test scripts/lambda-package-budget.test.mjs` (expect 118.095 MB of 120 MB). A number in the brief that the checkout does not reproduce is a FAIL finding with both values. Confirm the hybrid gates in the brief are stated as measured thresholds with baselines, not proportions.
4. Confirm the package state: `STATUS.refined` is the only marker, `README.md` reads `status: refined`, the board row sits under `## refined`, and `README.md` carries `## Autonomous metadata`.

Verdict handling: on PASS, change nothing (leave `STATUS.refined`; do not write `GAMEPLAN.md`, slice docs, or code; do not edit the README, the driver writes the gate section). On FAIL, set `status: refining` in `README.md`, replace the marker with `STATUS.refining`, move the board row under `## refining`, commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`, never `git add -A`, `--all`, or `.`) with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
and push `origin thejudge-auto/hybrid-rule-retrieval` (no force). Never edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `PRD/sections/`, code, or `GRAPH-RUN.md`.

Constraints: tool-call cap 60 for this node, counting every call. Do not dispatch subagents; a helper's calls charge this node's own budget and a prior gate-qc exhausted its cap that way. Run each measurement command once. Never run `npm run data:refresh` or any Scryfall refresh. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file.

Report back, in this order: the one-word verdict (PASS or FAIL); the complete findings list, or `none`; the `Current:` block verification result (count checked, count identical); the amendment-set grep result; each reproduced measurement with the brief's value beside it; the package state after the node; the commit hash if you committed; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### gate-review

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are the gate-review step of graph run `graph-20260905-191535`, the build half driven by `graph-implement` (the spec-forming half was run `graph-20260905-173655`). Invoke the `graph-gate-review` skill with the Skill tool (skill name `graph-gate-review`) on the package `PRD/work/hybrid-rule-retrieval/`. Read `.claude/skills/graph-gate-review/SKILL.md` and `PRD/instructions/graph-workflow-contract.md` (`## Propose / apply / close`, `## The two runs`) before acting.

Context: the owner answered all 15 `- Verdict:` slots in `GATE-QUESTIONS.md` (14 accept, 1 edit on the NFR-017 block) and merged the docs PR #195 to `main` on 2026-09-05. The package currently carries `STATUS.active` and `status: active` — the build loop's claim marker; the skill restores `STATUS.refined` as the lifecycle position after a resolved define gate. The current branch is `thejudge-auto/hybrid-rule-retrieval`, already fast-forwarded to `main`.

What to do, per the skill: parse every `## <STABLE-ID>` block; confirm each Verdict slot is filled and every edit or reject carries a Reason; apply each verdict inside that ID's proposed diff in `GATE-QUESTIONS.md` only (accept: nothing; edit: apply the owner's Reason as the correction to that ID's proposed diff — for NFR-017 that means adding the extra Notes bullet the owner's Reason describes, worded from the Reason and the PR #194 facts it cites; reject: remove the proposed diff). Never edit `PRD/sections/`, `DESIGN-BRIEF.md`, code, or any `thejudge-*` skill. Then write `## Gate verdicts` in `GRAPH-RUN.md` (one row per stable ID, the owner's Reason quoted for the edit), mark `## Open gate` resolved with the date and the verdict count, replace `STATUS.active` with `STATUS.refined` (exactly one marker), set `status: refined` in `README.md`, and move the board row in `PRD/work/STATUS.md` from `## active` to `## refined`. Do not touch the `## Node ledger`, `## Dispatch prompts`, or `## Instruction ledger` sections of `GRAPH-RUN.md`; the driver owns those.

Commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`; never `git add -A`, `--all`, or `.`) on the current branch, with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
Do not push. Do not dispatch subagents. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file. Never run `npm run data:refresh` or any Scryfall refresh.

Report back, in this order: the verdict split (accept / edit / reject counts); for the edit, the exact text you added to the proposal; `git diff --stat` of `GATE-QUESTIONS.md` for your commit and confirmation that `git diff -- PRD/sections/` is empty; the package state after the node (marker, README status line, board heading); the commit hash; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### gate-qc (build half, attempt 1)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 4 (`gate-qc`), attempt 1 of the build half, graph run `graph-20260905-191535` driven by `graph-implement` (the spec-forming half, run `graph-20260905-173655`, already passed gate-qc on this brief on 2026-09-05 at commit `f13f8d2`; this is the re-check after the owner's verdicts were applied by `graph-gate-review`, commit `334f377`, which added one Notes bullet to the NFR-017 block of `GATE-QUESTIONS.md`). Invoke the `thejudge-quality-check` skill with the Skill tool (skill name `thejudge-quality-check`) on the package `PRD/work/hybrid-rule-retrieval/`, and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/preparation-contract.md`, emit an explicit PASS or FAIL verdict with the complete findings, and return it to the driver, which records it in the package README's `## Preparation gate` section. Read `.claude/skills/thejudge-quality-check/SKILL.md`, `PRD/instructions/technical-design-rules.md`, `PRD/instructions/plain-language-standard.md`, and `PRD/instructions/graph-workflow-contract.md` (`## The two runs`, `## Propose / apply / close`) before acting.

What to check, beyond the skill's own checklist:
1. `DESIGN-BRIEF.md` against the current-state feature specs it touches (`PRD/sections/quick-lookup/README.md`, `PRD/sections/in-depth/README.md`, `PRD/sections/system-map/game-rules-retrieval.md`, `PRD/sections/system-map/prompt-layout-spec.md`, `PRD/sections/system-map.md`, `PRD/sections/integrations-and-data.md`, `PRD/sections/non-functional-requirements.md`, `PRD/sections/functional-requirements.md`) and the `REQ`/`NFR` entries it cites: no contradictions, current vocabulary, technical-design-rules respected, scope implementable without hidden assumptions, no user-visible screen change.
2. `GATE-QUESTIONS.md` as finalized by the owner: all 15 `- Verdict:` slots read accept or edit (none blank, none reject); the NFR-017 block's owner edit (the added Notes bullet about the CUDA runtime download on the linux/x64 CI runner and PR #194's fix in `scripts/package-lambda.sh`) is consistent with the brief, with the live NFR-017 text, and with what `scripts/package-lambda.sh` on this checkout actually does (read it; confirm `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` and the unzipped-size measurement exist). Verify every `Current:` block byte-for-byte against the live `PRD/sections/` file by script, not by eye — `main` moved since the spec-forming gate-qc (PRs #193, #194, #195 merged), so drift is possible. Confirm REQ-182, REQ-183, REQ-184 are still unused in live `PRD/sections/` and are the next free numbers.
3. Quantitative targets: reproduce once each `npm --workspace apps/backend run test:eval` (brief expects the semantic path at 9 of 12 labelled checks, lexical 12/12) and `node --test scripts/lambda-package-budget.test.mjs` (brief records 118.095 MB of 120 MB data; PR #194 may have changed what this test measures — report the current figure beside the brief's, and treat a changed figure as a finding only if the brief's gates no longer hold). Do not run `npm run benchmark:rag-retrieval` in either mode: both were reproduced at the spec-forming gate-qc on the same corpus and they rewrite tracked result files.
4. Package state: `STATUS.refined` is the only marker, `README.md` reads `status: refined`, the board row sits under `## refined`, `README.md` carries `## Autonomous metadata`, and `GRAPH-RUN.md` `## Open gate` reads resolved.

Verdict handling: on PASS, change nothing (leave `STATUS.refined`; do not write `GAMEPLAN.md`, slice docs, or code; do not edit the README, the driver writes the gate section). On FAIL, set `status: refining` in `README.md`, replace the marker with `STATUS.refining`, move the board row under `## refining`, commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`, never `git add -A`, `--all`, or `.`) with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
Do not push. Never edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `PRD/sections/`, code, or `GRAPH-RUN.md`.

Constraints: tool-call cap 60 for this node, counting every call. Do not dispatch subagents; a helper's calls charge this node's own budget and a prior gate-qc exhausted its cap that way. Run each measurement command once. Never run `npm run data:refresh` or any Scryfall refresh. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file.

Report back, in this order: the one-word verdict (PASS or FAIL); the complete findings list, or `none`; the `Current:` block verification result (count checked, count identical); the NFR-017 edit consistency result; each reproduced measurement with the brief's value beside it; the package state after the node; the commit hash if you committed; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### plan

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 5 (`plan`) of graph run `graph-20260905-191535`, the build half driven by `graph-implement`. Invoke the `thejudge-map-out` skill with the Skill tool (skill name `thejudge-map-out`) on the package `PRD/work/hybrid-rule-retrieval/`, and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/preparation-contract.md`, require `Quality-check: PASS` in the package README's `## Preparation gate` section (it is there; you cannot self-certify one), create the GAMEPLAN and slice contract, and return control to the driver. Read `.claude/skills/thejudge-map-out/SKILL.md` and its `reference.md` (slice template, Ship gates block, and the `slice-<letter>.criteria.json` schema with its worked example), `PRD/instructions/doc-lifecycle.md`, `PRD/instructions/workflow-reference.md`, `PRD/instructions/runtime-process-hygiene.md`, `PRD/instructions/requirement-format.md`, and `PRD/instructions/graph-workflow-contract.md` (`## Propose / apply / close`, `## Acceptance criteria are earned, not written`) before acting.

Inputs: `PRD/work/hybrid-rule-retrieval/DESIGN-BRIEF.md` (the four items and the measurement plan) and the finalized `GATE-QUESTIONS.md` (15 blocks, 14 accept + 1 edit, 0 reject; the NFR-017 block carries an owner-added Notes bullet). The brief's `## Measurement plan` and the proposal's stated gates are the acceptance bar: every quantitative target in a slice must be the measured threshold with its baseline from the brief, never a proportion or a guess.

Slicing requirements:
- The `build` node applies the finalized `GATE-QUESTIONS.md` proposal to `PRD/sections/` by intent, together with the code, in the slice PR. Assign every one of the 15 proposal blocks to exactly one slice as an explicit deliverable of that slice (name the block and the target file), so no product-truth edit is orphaned. A block whose code lands in slice X is applied in slice X.
- One primary objective per slice; explicit dependencies in the README slice table; each slice carries Status, Goal, Requirements, Files touched, Tests, Acceptance criteria.
- Every acceptance criterion gets an entry in that slice's `slice-<letter>.criteria.json`, `value` initialised `false`, with an `evidence` block naming the exact command pattern, file path(s), or `manual: true`. Author each block beside its criterion in the same pass. Prefer command evidence (the eval, benchmark, and budget commands the brief names) over manual.
- The Lambda budget item is decided by measurement per the brief; the slice must state the measurement and the decision rule already recorded there, not reopen the choice.
- No user-visible screen change is in scope; do not add UI slices.
- Never run `npm run data:refresh` or any Scryfall refresh; never run `npm run benchmark:rag-retrieval` (it rewrites tracked result files; the numbers are already recorded in the brief).

Writes: `GAMEPLAN.md`, `slice-<letter>-<name>.md` docs, `slice-<letter>.criteria.json` files, the package `README.md` (slice table, implementation map, `status: active`; keep `## Autonomous metadata` and `## Preparation gate` intact), the marker `STATUS.active` (replacing `STATUS.refined`; exactly one marker), and the board row moved to `## active` in `PRD/work/STATUS.md`. Never edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `GRAPH-RUN.md`, `PRD/sections/`, or code.

Commit with explicit paths only (`git add PRD/work/hybrid-rule-retrieval PRD/work/STATUS.md`; never `git add -A`, `--all`, or `.`) on the current branch `thejudge-auto/hybrid-rule-retrieval`, with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
Do not push; the driver publishes before `build`.

Constraints: tool-call cap 120 for this node, counting every call. Do not dispatch subagents. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file.

Report back, in this order: the slice list (letter, file name, one-line goal, the proposal blocks it applies, dependencies); the criteria count per slice and how many are `manual`; the `## Preparation gate` line you verified; the package state after the node (marker, README status, board heading); the commit hash; `git status --porcelain` output (expect empty); the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### build

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 6 (`build`) of graph run `graph-20260905-191535`, the build half driven by `graph-implement`. Invoke the `thejudge-implement-all` skill with the Skill tool (skill name `thejudge-implement-all`) on the package `PRD/work/hybrid-rule-retrieval/`, and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/graph-workflow-contract.md` (`## Propose / apply / close`, `## Acceptance criteria are earned, not written`, `## Boundaries`), take the recorded autonomous base from the package README's `## Autonomous metadata` section (`origin/thejudge-auto/hybrid-rule-retrieval`), and treat every stop as a park reported back to the driver, never as a question to a user. Read `.claude/skills/thejudge-implement-all/SKILL.md` and its `reference.md`, `PRD/instructions/workflow-reference.md`, `PRD/instructions/runtime-process-hygiene.md`, `PRD/instructions/plain-language-standard.md`, and `PRD/instructions/technical-design-rules.md` before acting.

Branch and worktree (fixed by the driver): create the worktree at `.worktrees/implement-hybrid-rule-retrieval` (inside the repo-local `.worktrees/` root, nowhere else) from the latest fetched `origin/thejudge-auto/hybrid-rule-retrieval`, and use the explicit shared remote branch `thejudge-auto/hybrid-rule-retrieval-work` — distinct from the base, so the PR is `thejudge-auto/hybrid-rule-retrieval-work` → `thejudge-auto/hybrid-rule-retrieval`. Open that PR with `gh pr create` after the first milestone push (base `thejudge-auto/hybrid-rule-retrieval`, never `main`); its body opens with the plain-language block `PRD/instructions/plain-language-standard.md` requires and ends with the lines
   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
Never merge or close the PR. Never push to the base branch or to `main`. Never force-push in any form.

The work: `GAMEPLAN.md` and the five slice docs A–E, in dependency order (A, then B and C and D in any order that respects the table, then E). Slice A is where the hybrid blend lands; treat its measured gates in `DESIGN-BRIEF.md` `## Measurement plan` as the bar. Each slice's `slice-<letter>.criteria.json` is the gate: a criterion is set `true` only after the boundary hook has observed its evidence (the hook denies a premature flip and names the evidence still missing; a denied call is never retried verbatim — earn the evidence first, then flip). A `manual` criterion is earned by a dated observation line naming its id, written in the slice doc. Report `ok` only when every criterion in every slice's file is `true`; any `false` fails the node.

Apply product truth by intent: every one of the 15 finalized `GATE-QUESTIONS.md` blocks is applied to `PRD/sections/` in the slice the GAMEPLAN's assignment table names, re-derived against the current text of the target file (never a blind replay of the frozen patch), committed together with that slice's code. The NFR-017 block carries an owner-added `- Notes:` bullet (the CUDA-runtime CI rejection and PR #194's fix) — apply it with the rest of that block in slice C. No block was rejected, so nothing is burned. Apply each block exactly once.

Verification per slice: the slice's own `## Tests` and `## Acceptance criteria`, then `npm run quality:check`, with the non-ignored worktree matching the index before and after; commit `feat(hybrid-rule-retrieval): complete slice <letter>` and push `HEAD` to the shared branch without force. Commit with explicit paths only (`git add <path> ...`; never `git add -A`, `--all`, or `.`) with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
`npm run benchmark:rag-retrieval` (both modes) rewrites the tracked `apps/backend/src/eval/benchmark/results.json` and `semantic-results.json`; where a slice legitimately changes those numbers, commit them as that slice's output, and where only `scoredAt` moved, restore them with `git checkout --` before committing.

Write scope: write only inside `.worktrees/implement-hybrid-rule-retrieval/` and `PRD/work/hybrid-rule-retrieval/`. The driver asserts this on return and a write anywhere else fails the node. Never edit the launch checkout's code, `PRD/sections/`, `CLAUDE.md`, `.claude/settings*.json`, `.claude/graph-profile.json`, or any `thejudge-*` skill. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file. Never run `npm run data:refresh` or any Scryfall refresh. Never use `nohup`, a background `&`, `pkill`, or `killall`. Slices C and E touch deploy scripts and the Lambda budget test only; do not run `scripts/aws-deploy.sh` or `scripts/aws-bootstrap.sh` against AWS — deploying is not in scope, the tests are.

When every slice is `done`: set `status: ship-ready` in the package README, replace the marker with `STATUS.ship-ready` (exactly one marker), move the board row under `## ship-ready` in `PRD/work/STATUS.md`, commit and push those with the last slice, and run the READY loop from `reference.md`.

Constraints: tool-call cap 1200 for this node, counting every call you and any helper make. Do not dispatch implementation subagents; a helper's calls charge this node's own budget. If a slice is blocked, an acceptance gate cannot be made green from the confirmed decisions and tests, or a rebase conflict's intent is not derivable, stop: leave the slice `blocked` with the evidence in its doc, push nothing further for it, and report `failed` with the reason — never guess a product decision.

Report back, in this order: `ok` or `failed`; the PR URL and its head commit; the worktree path; each slice's final status with its criteria count true/total; the list of every path you wrote outside the worktree (expect only `PRD/work/hybrid-rule-retrieval/` entries, or none); the measured numbers for the brief's gates (fixtures passing under the blend, benchmark recall@5 clean and polluted, Lambda data MB of 120, cold-start figure) beside the brief's values; the package state (marker, README status, board heading); `npm run quality:check` result; `git status --porcelain` of the worktree (expect empty); the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Make Ask AI's semantic rule retrieval safe to turn on. The rag-rule-retrieval run shipped an opt-in local embedding model (EMBEDDING_PROVIDER=local) that lifts recall@5 on the 156-pair benchmark from 0.58 to 0.85 but loses the exact rule on short lookup-mode questions: two of eight labelled fixtures drop rule 702.2b from the top five because a card name plus one keyword carries too little meaning for cosine ranking alone. Four items, one spec: (1) a hybrid score that blends lexical and semantic ranking so lookup-mode questions keep the exact rule while long questions keep the semantic gain, measured on the same benchmark and the labelled fixtures; (2) once hybrid holds, make the system3-expected-recall and system3-noise-excluded checks gate test:eval on the semantic path instead of report-only, and add one labelled fixture for a multi-keyword card; (3) relieve the Lambda package budget, which sits at 118.10 of 120 MB data after the 130 MB runtime-and-model reserve, by shrinking the 75 MB combos artifact, loading the model from S3 at cold start, or storing vectors in a smaller number format, decided by measurement before the next data refresh; (4) measure Lambda cold-start latency with the model loaded and record it against the existing latency requirement. Success is a measured case for setting EMBEDDING_PROVIDER=local as the default." | answered-once | shape | — (the owner's launch request, passed to node 2 verbatim as the package's intake; every product question it raises is decided at the `define` gate, not pre-resolved) |
| "graph-implement" (the owner's `/loop graph-implement` launch, 2026-09-05) | answered-once | driver-resume | — (a request to run the build loop; every product decision stays with the owner's recorded verdicts and the gates) |
