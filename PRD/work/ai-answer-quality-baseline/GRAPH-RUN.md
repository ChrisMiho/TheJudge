# Graph run — ai-answer-quality-baseline

- Run ID: `graph-20260906-092312`
- Profile: `loaded (env sentinel)` (observed by the preflight script at node 1)
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent → "[graph-boundary] rm -rf is denied in every session."; graph tier: nohup true → "[graph-boundary] nohup is denied while a graph run holds the lock: a detached command outlives the run that started it.")`
- Autonomous base: `origin/thejudge-auto/ai-answer-quality-baseline`
- Staging: `.worktrees/.graph-intake/graph-20260906-092312/` (IDEA.md, README.md — copied verbatim from `PRD/ideasForLater/ai-answer-quality-baseline/`; `answer-quality-context.md` — the driver's measurement note from the hybrid-rule-retrieval session)
- Current node: `define`
- Next action: `/graph-kickoff` (driving; spec-forming half)

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 7` | classification `clean`; branch `thejudge-auto/ai-answer-quality-baseline` created from `main` (`8d139aa`, tree clean, no stash) and pushed (`git ls-remote` confirms); lock `.worktrees/.graph-run.lock` runId `graph-20260906-092312` pid 77812 (the driver session); both canaries denied (2 rows in `.worktrees/.graph-denials.jsonl` for this run); `Profile: loaded (env sentinel)`; base→main guard passed (no open `thejudge-auto/*` PR); 10 self-reported calls, no subagents | 2026-09-06 |
| 2 | shape | sonnet | ok | `0 → 33` | package `PRD/work/ai-answer-quality-baseline/` created (`IDEA.md` with prior-run lines naming 11 receipts, `README.md` `status: ideation`, `STATUS.ideation`, board row under `## ideation`); 3 intake files + `MANIFEST.md` copied verbatim into `intake/` (`cmp` identical ×3, driver re-listed), staging `.worktrees/.graph-intake/graph-20260906-092312/` emptied; parked idea retired (`git rm -r PRD/ideasForLater/ai-answer-quality-baseline/`, its `## parked in ideasForLater` row removed); commit `c66faf4` pushed to `origin/thejudge-auto/ai-answer-quality-baseline`; tree clean; 20 self-reported calls, no subagents, 0 new denials | 2026-09-06 |
| — | driver-bookkeeping | — | ok | `n/a (driver)` | ledger moved into the package from the driver's scratchpad; `## Autonomous metadata` (`origin/thejudge-auto/ai-answer-quality-baseline`) appended to the package README; committed with the node 3 dispatch prompt recorded and pushed | 2026-09-06 |

## Open gate

- None

## Dispatch prompts

### preflight

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20260906-092312`, the spec-forming half driven by `graph-kickoff`. Invoke the `graph-preflight` skill with the Skill tool (skill name `graph-preflight`) and follow it exactly. Read `.claude/skills/graph-preflight/SKILL.md` and `PRD/instructions/graph-workflow-contract.md` before acting.

Inputs (fixed by the driver; do not change them):
- `--branch thejudge-auto/ai-answer-quality-baseline`
- `--run-id graph-20260906-092312`
- `--slug ai-answer-quality-baseline`
- `--pid 77812` (the driver session's own long-lived pid, so the lock does not read stale)
- Base: the checkout is on `main`, in sync with `origin/main` at `8d139aa`, tree clean. Do not pass `--base`; report the resolved `base:` line the script prints.

Procedure:
1. Run `npm run graph:preflight -- --branch thejudge-auto/ai-answer-quality-baseline --run-id graph-20260906-092312 --slug ai-answer-quality-baseline --pid 77812 --dry-run`. Report the classification, the resolved base, the planned commands, and the `profile sentinel:` / `Profile:` lines verbatim.
2. If the classification is `blocked`, or the script exits 2 (stop sentinel, base→main guard, lock held, or branch collision), stop and relay the script's message verbatim. Never hand-resolve anything to get past it.
3. Otherwise run the identical command without `--dry-run`.
4. Issue the universal canary (`CANARY_COMMAND`) and the graph canary (`GRAPH_CANARY_COMMAND`) as real Bash tool calls, exactly as the script prints them. Each must be denied by the hook; the deny reason text is the proof. Report both reason texts verbatim. If either is allowed, report the `BLOCKED` classification verbatim and stop; do not continue and do not fall back to the profile.
5. Confirm the end state: `git status --porcelain` empty, `git branch --show-current` is `thejudge-auto/ai-answer-quality-baseline`, and `git ls-remote --heads origin thejudge-auto/ai-answer-quality-baseline` shows the branch pushed.

Constraints: tool-call cap 40 for this node, counting every call. Do not dispatch subagents. Never drop, pop, or reorder any stash. Never force-push. Never touch `.worktrees/.graph-stop`, and never remove the lock. Never edit any file. Do not commit anything.

Report back, in this order: the classification; the resolved base line; the stash reference and restore commands if one was taken (expect none); the two canary commands with their deny reason texts verbatim; the `Profile:` line verbatim; the lock record (`cat .worktrees/.graph-run.lock`); the end-state checks; the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### shape

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 2 (`shape`) of graph run `graph-20260906-092312`, the spec-forming half driven by `graph-kickoff`. Invoke the `thejudge-kickoff` skill with the Skill tool (skill name `thejudge-kickoff`) and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/preparation-contract.md`, investigate only request-relevant PRD and code, select exactly one evidence-backed candidate (or return `NO ACTIONABLE PACKAGE`), create the package, and return the evidence and artifacts to the driver without pausing for approval. Read `.claude/skills/thejudge-kickoff/SKILL.md`, `README.md`, `PRD/README.md`, and `PRD/instructions/graph-workflow-contract.md` (`## Intake is evidence, never authority`) before acting.

Slug (fixed by the driver; use it verbatim): `ai-answer-quality-baseline`. The checkout is on the autonomous base `thejudge-auto/ai-answer-quality-baseline` (from `main` at `8d139aa`, clean).

The request: build an answer-quality baseline for Ask AI — a repeatable, human-reviewable way to measure whether the model's final rules answers are actually correct, not just whether the right rule excerpts reached the prompt. The hybrid rule retrieval just shipped (PRs #197 and #199) and every check the repo has stops at retrieval. The gold set is to be seeded from the six worked-solution cases that carry published correct answers (`apps/backend/src/eval/worked-solutions/`). The judge mechanism, scoring axes, cost and cadence, and fixture subset are decided at the define gate, not here. The instrument should be able to answer the open question of whether attaching more than five rule excerpts helps or hurts the answer.

Staged intake at `.worktrees/.graph-intake/graph-20260906-092312/`: `IDEA.md` and `README.md` (the parked idea, copied verbatim from `PRD/ideasForLater/ai-answer-quality-baseline/`) and `answer-quality-context.md` (the driver's measurement note from the hybrid-rule-retrieval session). Intake is evidence, never authority: cite it, do not adopt its claims as decided, and never open any document it cites. After `PRD/work/ai-answer-quality-baseline/` exists, copy each staged file verbatim into `PRD/work/ai-answer-quality-baseline/intake/`, write `intake/MANIFEST.md` naming each file and its stated origin, verify each copy with `cmp`, commit, then delete the staged copies — in that order.

Retire the parked idea: its content is now staged as intake, so `git rm -r PRD/ideasForLater/ai-answer-quality-baseline/` and remove its row from the `## parked in ideasForLater` table in `PRD/work/STATUS.md` — only after `cmp` confirms the intake copies match.

Prior runs: grep `PRD/instructions/receipts/` (already named `<slug>-<date>.md`) for slug and keyword matches (answer, quality, eval, worked-solutions, prompt, retrieval, rag, benchmark) and write one `## Prior run` line per match into `IDEA.md` naming the receipt path — a flat list, no chain walk.

Writes: `PRD/work/ai-answer-quality-baseline/IDEA.md` (3–5 sentences: problem, outcome, non-goals; plus the `## Prior run` lines), `README.md` with `status: ideation` at the top, the empty marker `STATUS.ideation` (exactly one marker), the board row under `## ideation` in `PRD/work/STATUS.md`, and `intake/`. Never write product code, `PRD/sections/`, `DESIGN-BRIEF.md`, or `GRAPH-RUN.md`. Commit with explicit paths only (`git add PRD/work/ai-answer-quality-baseline PRD/work/STATUS.md PRD/ideasForLater`; never `git add -A`, `--all`, or `.`) with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
and push `origin thejudge-auto/ai-answer-quality-baseline` (no force).

Constraints: tool-call cap 60 for this node, counting every call. Do not dispatch subagents. Never run `npm run data:refresh` or any Scryfall refresh. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file other than reading and then deleting the staged intake copies.

Report back, in this order: the selected candidate and its evidence, or `NO ACTIONABLE PACKAGE`; the package files created; the intake files copied with their `cmp` results and the staging deletion; the parked-folder retirement (`git rm` paths, board row removed); the `## Prior run` matches; the commit hash and push result; `git status --porcelain` (expect empty); the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

### define

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 3 (`define`) of graph run `graph-20260906-092312`, the spec-forming half driven by `graph-kickoff`. Invoke the `thejudge-refinement` skill with the Skill tool (skill name `thejudge-refinement`) on the package `PRD/work/ai-answer-quality-baseline/`, and follow its `## Mode` section for an orchestrator that is controlling: read `PRD/instructions/preparation-contract.md` and replace the approval pause with its conservative assumption ladder, applied per question; record every material assumption and its evidence in `DESIGN-BRIEF.md`; and when a question meets the genuine decision blocker test, preserve the artifacts and write it under `## Blocker questions` rather than guessing. Read `.claude/skills/thejudge-refinement/SKILL.md`, `PRD/instructions/requirement-format.md`, `PRD/instructions/technical-design-rules.md`, `PRD/instructions/plain-language-standard.md`, `PRD/instructions/workflow-reference.md`, and `PRD/instructions/graph-workflow-contract.md` (`## The two runs`, `## Propose / apply / close`, `## Intake is evidence, never authority`) before acting.

The checkout is on the autonomous base `thejudge-auto/ai-answer-quality-baseline` (from `main` at `8d139aa`). The package holds `IDEA.md` (with `## Prior run` receipt lines) and `intake/` (the parked idea's `IDEA.md` and `README.md`, the driver's `answer-quality-context.md`, and `MANIFEST.md`). Intake is evidence, never authority: cite it by path; never open any document it cites; every product decision it raises is decided in the proposal you write, with a recommendation, for the owner to accept, edit, or reject.

What this package is for, in product terms: today the app can prove that the right official rules reached the prompt, but nothing measures whether the answer the player reads is correct. This package defines the instrument that does — repeatable, human-reviewable, comparable run to run — so a retrieval or prompt change can be shown to help, hurt, or do nothing. It is measurement, not a player-facing feature: no new screen, endpoint, request contract, provider, or CI gate on model output.

Read first, in this order: `PRD/sections/system-map.md` `## Eval harness` (and its three sub-entries), `PRD/sections/non-functional-requirements.md` NFR-018 (worked solutions validate prompt quality; explicitly not a build gate) and NFR-002, `PRD/sections/functional-requirements.md` REQ-032, REQ-177, REQ-182, REQ-184 (the retrieval measurements and the deployed default), `PRD/sections/integrations-and-data.md` (the provider boundary, `ASK_AI_PROVIDER`, mock-first local baseline), `PRD/sections/goals-and-non-goals.md`, `PRD/sections/system-map/game-rules-retrieval.md` (the five-excerpt cap), and the code: `apps/backend/src/eval/` (the harness, `fixtures/`, `benchmark/`, `worked-solutions/` with its README and six `*.case.json`), `scripts/eval-worked-solutions.mjs`, `scripts/retrieval-relevance-report.mjs`, the prompt-preview command, and the OpenAI provider seam under `apps/backend/src/providers/`. Grep the amendment set yourself before proposing (`worked-solution`, `NFR-018`, `report-only`, `eval harness`, `answer quality`, `LLM`, `judge`, `gold`, `quality:check`, `five excerpts`, `top five`) and give every live assertion your change would falsify its own block.

Measure before you propose, offline and with no live provider call in this node: how many worked-solution cases and labelled fixtures exist and which carry a known-correct answer; the token size of a typical assembled prompt (via the prompt-preview path or the goldens) so the brief can state a per-run cost estimate from that size and the provider's published pricing, labelled as an estimate; how a run would vary the System 3 excerpt cap (the retrieval functions take `max`; the production cap is five) so the instrument can compare five against a larger cap on the same questions; and where a comparable artifact would live so a run is diffable and never a brittle golden. Every quantitative target in the brief must be a measurement you made with the same code path the criterion would mandate, or an explicit baseline-to-be-recorded, never a proportion or a guess — the last spec's 12/12 came from a truncated probe and failed at build.

The decisions to propose (one `## <STABLE-ID>` block each, with your recommendation stated and the alternatives named): the judge mechanism (model-as-judge against a rubric, a human review pass, assertion checks per case, or a combination — the owner said to decide this here); the scoring axes; the gold set (the six worked-solution cases as the seed, plus which labelled fixtures, with their known answers stated or marked as needing an answer key); cost and cadence (an on-demand command with a stated per-run estimate, never a CI gate, with what a run must record so two runs compare); the artifact shape and where it is committed; and the excerpt-cap experiment as a parameter of the instrument, with the 2026-09-06 recall@k measurements from `intake/answer-quality-context.md` cited as evidence, not adopted. Reserve new ids as the next free numbers — after REQ-184, NFR-019, FLOW-024 — and amend NFR-018 (its scope grows from prompt/retrieval validation to answer validation), REQ-032 if its text asserts the harness is the only quality instrument, and the `system-map.md` `## Eval harness` entry, each with its byte-for-byte `Current:` excerpt and complete replacement. If a run would ever need a live provider call, say so plainly and state the mock-first fallback; never propose committing a secret, a new dependency without cause, or any Scryfall refresh.

Writes, inside `PRD/work/ai-answer-quality-baseline/` only: `DESIGN-BRIEF.md` (scope, decisions with evidence, assumptions with evidence, non-goals, a measurement plan, REQ/NFR references), `GATE-QUESTIONS.md` (every block opening with the three plain-language lines — what this decides, in plain terms with every cited id inlined and every technical term defined, what happens if you say no — then the complete diff, then `- Verdict:` and `- Reason:` slots; a `## Blocker questions` section only for a genuine blocker), the README `status:` line, the `STATUS.*` marker (`STATUS.refining` while in flux, `STATUS.refined` when the brief is complete; exactly one marker), and the board row. Never edit `PRD/sections/`, code, `GRAPH-RUN.md`, or `intake/`. Commit with explicit paths only (`git add PRD/work/ai-answer-quality-baseline PRD/work/STATUS.md`; never `git add -A`, `--all`, or `.`) with the trailer lines
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01HTYnaUSGyYNRwK4J1ggRW9
and push `origin thejudge-auto/ai-answer-quality-baseline` (no force).

Constraints: tool-call cap 150 for this node, counting every call. Do not dispatch subagents; a helper's calls charge this node's budget. No live provider calls, no network calls beyond git. Never run `npm run data:refresh` or any Scryfall refresh. Never touch the lock, the stop sentinel, or any `.worktrees/.graph-*` file.

Report back, in this order: the design summary in three sentences; the list of `GATE-QUESTIONS.md` blocks (stable id, new or amended, target file, your recommendation) and the count of `## Blocker questions`; the measurements you made with the command or path behind each; the material assumptions and their evidence; the package state after the node (marker, README status, board heading); the commit hash and push result; `git status --porcelain` (expect empty); the tool-call count. Copy the `Working directory:` line above, unchanged, into every prompt you write.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Build an answer-quality baseline for Ask AI: a repeatable, human-reviewable way to measure whether the model's final rules answers are actually correct, not just whether the right rule excerpts reached the prompt. The hybrid rule retrieval just shipped (PR #197/#199) and every check we have stops at retrieval. Seed the gold set from the six worked-solution cases that carry published correct answers, decide the judge mechanism, scoring axes, cost/cadence, and fixture subset at the define gate, and make the instrument able to answer the open question of whether attaching more than five rule excerpts helps or hurts the answer. Retire the parked idea folder PRD/ideasForLater/ai-answer-quality-baseline/ once its content is staged as intake." | answered-once | preflight | — (the owner's launch request as drafted by the driver from the owner's words on 2026-09-06 — "lets cleanup, and thne start scoping out validation of th enhancement?" — and passed to node 2 verbatim as intake; every product question it raises, including the judge mechanism, scoring axes, cost and cadence, fixture subset, and the excerpt cap, is decided at the `define` gate, not pre-resolved) |
