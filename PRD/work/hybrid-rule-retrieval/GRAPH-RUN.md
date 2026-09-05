# Graph run — hybrid-rule-retrieval

- Run ID: `graph-20260905-173655`
- Profile: `loaded (env sentinel)` (observed by the preflight script at node 1)
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent → "[graph-boundary] `rm -rf` is denied in every session."; graph tier: nohup true → "[graph-boundary] `nohup` is denied while a graph run holds the lock")`
- Autonomous base: `origin/thejudge-auto/hybrid-rule-retrieval`
- Staging: `.worktrees/.graph-intake/graph-20260905-173655/`
- Current node: `owner-action` (parked after gate-qc PASS — spec-forming half complete)
- Next action: owner answers `PRD/work/hybrid-rule-retrieval/GATE-QUESTIONS.md` and merges the docs PR; `graph-implement` builds it

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

## Open gate

- **Ask:** Decide. Answer every `- Verdict:` slot (accept / edit / reject, with a reason on edit or reject) in `PRD/work/hybrid-rule-retrieval/GATE-QUESTIONS.md` — 15 slots, 0 blocker questions — then merge the docs-only PR to `main` to build.
- **Evidence:** gate-qc attempt 2 PASS (row 4 above); `## Preparation gate` in `README.md`; the proposal's measurements recorded under `DESIGN-BRIEF.md` `## Measurement plan`.
- **PR:** https://github.com/ChrisMiho/TheJudge/pull/195 (docs-only, `thejudge-auto/hybrid-rule-retrieval` → `main`; opened, not merged)
- **Resume:** `graph-implement` (the background build loop) picks the package up from `main` after the merge. Manual equivalent: `/graph-implement PRD/work/hybrid-rule-retrieval/`.
- Parked 2026-09-05 at `owner-action`; run `graph-20260905-173655` released its lock with state `PARKED`.

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

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Make Ask AI's semantic rule retrieval safe to turn on. The rag-rule-retrieval run shipped an opt-in local embedding model (EMBEDDING_PROVIDER=local) that lifts recall@5 on the 156-pair benchmark from 0.58 to 0.85 but loses the exact rule on short lookup-mode questions: two of eight labelled fixtures drop rule 702.2b from the top five because a card name plus one keyword carries too little meaning for cosine ranking alone. Four items, one spec: (1) a hybrid score that blends lexical and semantic ranking so lookup-mode questions keep the exact rule while long questions keep the semantic gain, measured on the same benchmark and the labelled fixtures; (2) once hybrid holds, make the system3-expected-recall and system3-noise-excluded checks gate test:eval on the semantic path instead of report-only, and add one labelled fixture for a multi-keyword card; (3) relieve the Lambda package budget, which sits at 118.10 of 120 MB data after the 130 MB runtime-and-model reserve, by shrinking the 75 MB combos artifact, loading the model from S3 at cold start, or storing vectors in a smaller number format, decided by measurement before the next data refresh; (4) measure Lambda cold-start latency with the model loaded and record it against the existing latency requirement. Success is a measured case for setting EMBEDDING_PROVIDER=local as the default." | answered-once | shape | — (the owner's launch request, passed to node 2 verbatim as the package's intake; every product question it raises is decided at the `define` gate, not pre-resolved) |
