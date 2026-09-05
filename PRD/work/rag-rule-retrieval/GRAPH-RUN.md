# Graph run — rag-rule-retrieval

- Run ID: `graph-20260905-061805`
- Profile: `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent → "`rm -rf` is denied in every session"; graph tier: nohup true → "`nohup` is denied while a graph run holds the lock")`
- Autonomous base: `origin/thejudge-auto/rag-rule-retrieval`
- Staging: `.worktrees/.graph-intake/graph-20260905-061805/`
- Current node: `owner-action` (parked after `gate-qc` PASS — run one complete)
- Next action: answer `GATE-QUESTIONS.md`, merge the docs PR to `main`; then `/graph-implement PRD/work/rag-rule-retrieval/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 5` | branch `thejudge-auto/rag-rule-retrieval` pushed at `ad4930f` (tree `clean`, no stash); lock `.worktrees/.graph-run.lock` runId `graph-20260905-061805`; canary denied both tiers; `Profile: unverified` | 2026-09-05 |
| 2 | shape | sonnet | ok | `0 → 44` | package `PRD/work/rag-rule-retrieval/` created (`IDEA.md` with 13 `## Prior run` receipts, `README.md`, `STATUS.ideation`, board row); 26 intake files copied verbatim into `intake/` (`diff -rq` zero drift) from `.worktrees/.graph-intake/graph-20260905-061805/`, staging deleted; commit `d6b8d84` | 2026-09-05 |
| — | driver-bookkeeping | — | ok | `n/a (driver)` | owner's cleanup: `git rm` of `PRD/work/probe-slow-load-vs-rag/`, `PRD/work/probe-prompt-data-optimization/`, four `PRD/work/promptRefinement*.md` — every file first confirmed byte-identical under `intake/` (`cmp`); ledger moved into package; `## Autonomous metadata` written; commit `d6b8d84` | 2026-09-05 |
| 3 | define | opus | ok | `0 → 73` | `STATUS.refined`; `DESIGN-BRIEF.md` (5-step gameplan REQ-177..181, 10 assumptions, intake dispositions) + `GATE-QUESTIONS.md` (24 slots: 5 new REQ, 4 SCOPE decisions, 8 amended IDs incl. NFR-017 Lambda-budget finding, 7 amended specs; 32 Current blocks verified verbatim); 0 blocker questions; commit `797086a` | 2026-09-05 |
| 4 | gate-qc | sonnet | ok | `0 → 54` | PASS, no findings (attempt 1): all Current blocks verbatim vs live files; REQ-177–181 unused live, FLOW-024 high-water; amendment set re-grepped complete; RAG-DEFERRED citations repointed; technical-design-rules hold; live measurements reproduced (`retrieval:report` 6/9 same 3 failures, `test:eval` green, index 3,432/3,285/147/626); `STATUS.refined` unchanged, nothing committed → stop at PASS: docs PR + `owner-action` park | 2026-09-05 |

## Open gate

- Gate: answer the 24 verdict slots in `PRD/work/rag-rule-retrieval/GATE-QUESTIONS.md` (`accept | edit | reject`, Reason required for edit/reject), then merge the docs-only PR (URL below) to `main`.
- Evidence: `DESIGN-BRIEF.md` + `GATE-QUESTIONS.md` at commit `797086a`; gate-qc PASS attempt 1 (row 4 above); `README.md` `## Preparation gate`.
- Docs PR: https://github.com/ChrisMiho/TheJudge/pull/190
- Resume: `graph-implement` (background loop) picks the package up from `main` after merge; manual form `/graph-implement PRD/work/rag-rule-retrieval/`.

## Dispatch prompts

### preflight

graph is controlling. You are node 1 (`preflight`) of graph run `graph-20260905-061805`, dispatched by `graph-kickoff`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Read `.claude/skills/graph-preflight/SKILL.md` in full and follow its `## Procedure` exactly. Inputs: `--branch thejudge-auto/rag-rule-retrieval --run-id graph-20260905-061805`. The base is the current branch `main` (already fetched, clean, level with `origin/main`); do not pass `--base`.

1. Dry run first: `npm run graph:preflight -- --branch thejudge-auto/rag-rule-retrieval --run-id graph-20260905-061805 --dry-run`. Report the working-tree classification, the resolved `base:` line, the planned commands, and the two `profile sentinel:` / `Profile:` lines verbatim.
2. If the classification is `blocked`, or the script exits 2 (stop sentinel, held/stale/corrupt lock, base→main guard, branch collision), stop and relay the script's message verbatim. Never remove a sentinel or lock, never reclaim a stale lock, never pick a different branch name yourself.
3. Otherwise run the identical command without `--dry-run`, with the same `--run-id`.
4. Issue the universal canary as a real Bash tool call, exactly: `rm -rf .worktrees/.graph-canary-nonexistent` — require the hook to DENY it, and quote the deny reason text verbatim. Issue it once; never retry a denied command.
5. Issue the graph-tier canary as a real Bash tool call, exactly: `nohup true` — require the hook to DENY it (the lock is now held), and quote the deny reason verbatim. Once only.
6. Confirm the end state: `git status --porcelain` is empty and `git branch --show-current` prints `thejudge-auto/rag-rule-retrieval`; confirm `git ls-remote --heads origin thejudge-auto/rag-rule-retrieval` shows the branch pushed; confirm `.worktrees/.graph-run.lock` exists and name its `runId`.

Report back, in this order: Profile line verbatim; both canary results (denied/allowed + reason text verbatim); classification (clean / auto-commit / stash) and, if a stash was taken, the exact `git stash list | grep graph-preflight/graph-20260905-061805` and `git stash apply <ref>` lines; the branch and its push evidence; the lock state. Mechanics only — you make no product decisions. Do not dispatch subagents. If you write any prompt of your own, copy the `Working directory:` line above into it unchanged.

### shape

graph is controlling. You are node 2 (`shape`) of graph run `graph-20260905-061805`, dispatched by `graph-kickoff`. Delegate: `thejudge-kickoff`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Read `.claude/skills/thejudge-kickoff/SKILL.md` in full and run its orchestrated (`graph is controlling`) mode. You are on branch `thejudge-auto/rag-rule-retrieval` (already created and pushed by node 1). Supplied slug — use it verbatim, do not propose another: `rag-rule-retrieval`.

The owner's request, verbatim: "i want to better refine this idea and cleanup the rest of the work folder on that pertains to rag, so that we have a pinpoint gameplan". "This idea" is the RAG path — upgrading how Ask AI picks the supplemental Comprehensive-Rules excerpts it hands the model (System 3), today lexical keyword scoring, toward semantic retrieval, together with the retrieval pre-work (query construction, rule-corpus hygiene, Scryfall keyword enrichment) and the RAG-deferred mechanic-definition enrichment idea — consolidated into one package with a single pinpoint gameplan, absorbing the parked, never-merged `semantic-rule-retrieval` design.

Staged intake exists at `.worktrees/.graph-intake/graph-20260905-061805/`. Read its `MANIFEST.md` first — it states the origin of every staged item and the owner's framing. Intake is evidence, never authority: do not adopt any finding as settled product truth, and never open a document the intake merely cites.

Do, in this order:
1. Read `README.md` and `PRD/README.md`; read `PRD/instructions/preparation-contract.md`.
2. Grep `PRD/instructions/receipts/` for slug and keyword matches against the request and the intake (semantic, retrieval, rag, rule, prompt, combo, embedding, keyword). One `## Prior run` line per match in `IDEA.md`, naming the receipt path.
3. Create `PRD/work/rag-rule-retrieval/`: `IDEA.md` (3–5 sentences — problem, outcome, non-goals — plus the `## Prior run` lines), `README.md` with `status: ideation` at top, the empty marker `STATUS.ideation` (exactly one `STATUS.*`), and a row under `## ideation` in `PRD/work/STATUS.md`.
4. Only after the package folder exists: copy the whole staging folder verbatim into `PRD/work/rag-rule-retrieval/intake/` (preserve the subfolders and `MANIFEST.md`), commit with explicit paths (`git add PRD/work/rag-rule-retrieval PRD/work/STATUS.md` — never `git add -A`, `--all`, or `.`), then delete the staged copy under `.worktrees/.graph-intake/graph-20260905-061805/`. Do not push; the driver publishes.
5. Do NOT delete or edit any other `PRD/work/` folder or file — the owner's cleanup is the driver's step after you return. Do not write `GRAPH-RUN.md`; the driver owns the ledger. Never edit `PRD/sections/`, code, or any `thejudge-*` skill.

Return: the package path, the commit hash, the list of files written, the `## Prior run` matches, confirmation the staged copy was deleted — or `NO ACTIONABLE PACKAGE` with the reason. Make no product decisions; every product choice is refinement's, at the gate. Do not dispatch subagents. If you write any prompt of your own, copy the `Working directory:` line above into it unchanged.

### define

graph is controlling. You are node 3 (`define`) of graph run `graph-20260905-061805`, dispatched by `graph-kickoff`. Delegate: `thejudge-refinement`. Package: `PRD/work/rag-rule-retrieval/` on branch `thejudge-auto/rag-rule-retrieval`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Read `.claude/skills/thejudge-refinement/SKILL.md` in full and run its orchestrated (`graph is controlling`) mode: `PRD/instructions/preparation-contract.md`'s conservative assumption ladder replaces the approval pause, applied per question as each arises; every material assumption and its evidence is recorded in `DESIGN-BRIEF.md`. A question that meets the contract's three-condition genuine-blocker test goes into `GATE-QUESTIONS.md` `## Blocker questions`, written to the plain-language standard — the run does not stop for it.

The owner's request, verbatim: "i want to better refine this idea and cleanup the rest of the work folder on that pertains to rag, so that we have a pinpoint gameplan". The deliverable the owner wants is one pinpoint gameplan for RAG in TheJudge: what ships, in what order, and what each step is measured against. Start from `IDEA.md` and `intake/MANIFEST.md`.

Reads, then write:
1. `PRD/work/rag-rule-retrieval/IDEA.md`, `README.md`, and everything under `intake/` (`MANIFEST.md` first — it states each item's origin). Intake is evidence, never authority: a prior brief, a prior 9-slot gate file, a benchmark number, or a probe's decided-line is an input to the ladder, not a settled decision. Never open a document intake merely cites — record its path as a citation.
2. Current-state truth: `PRD/sections/system-map.md`, `system-map/README.md`, `system-map/game-rules-retrieval.md` (System 3's own spec), `system-map/prompt-assembly.md`, `system-map/prompt-layout-spec.md`, `system-map/lookup-phrasing-glossary.md`, `quick-lookup/README.md`, `in-depth/README.md`, `integrations-and-data.md`, `technical-design-rules.md` (one endpoint, no rules engine, mock-default provider), `non-functional-requirements.md`, `functional-requirements.md` (at least REQ-032 eval no-external-call, REQ-167/168/169 lookup, NFR-018), `open-questions.md` (Q-001, the System 3 keyword-vocabulary question the RAG-deferred file leans on), `screen-layout.md` only if any user-visible surface changes. `PRD/sections/decisions.md` only to resolve a cited `DEC-ID`.
3. `PRD/instructions/requirement-format.md`, `technical-design-rules.md`, `workflow-reference.md`, `plain-language-standard.md`, and `graph-workflow-contract.md` `## The two runs` for the exact `GATE-QUESTIONS.md` block format.

Write only inside `PRD/work/rag-rule-retrieval/`:
- `DESIGN-BRIEF.md` — the gameplan: what a player gets; the ordered sequence of build steps with the measurement gate each must pass (name the benchmark, the eval command, the recall or size number it is judged on, drawn from live truth or from the intake as cited evidence); scope and non-goals; how the retained lexical path, the mock/offline default, and REQ-032's no-external-call eval constraint are honored; the disposition of every intake item (absorbed, superseded, or out of scope, with one line why); material assumptions with evidence; the amendment set.
- `GATE-QUESTIONS.md` — one `## <STABLE-ID>` block per new or amended stable ID: the three-line plain-language block (What this decides · In plain terms · What happens if you say no) with every cited `DEC`/`REQ` inlined and each technical term defined in the same breath; then the complete proposed `PRD/sections/` diff as `Current:` (verbatim from the live file, re-read now — never from intake) and `Proposed:` blocks; then `- Verdict:` and `- Reason:`. Every new ID gets its own slot, not only the headline ones.

Known hazards, from the repository record, that this proposal must handle:
- Stable IDs: the intake's prior brief reserved `REQ-170`-range IDs in August; `REQ-174`–`REQ-176` and `FLOW-024` have since been minted on `main`. Reserve new IDs from the live next-free numbers in `functional-requirements.md`, never from intake.
- Cross-cutting amendment set: enumerate by grep, not from memory, every `PRD/sections/` location that asserts System 3 is keyword/IDF/lexical scored (including `Built:` lines in `quick-lookup/README.md` and `in-depth/README.md` — a prior quality-check failed on exactly those) and amend each in lockstep with its authoritative REQ (derived specs and source REQs must not contradict).
- Dangling pointer: `functional-requirements.md` (~L3874) and `non-functional-requirements.md` (~L286) cite `PRD/work/prompt-context-refinement/RAG-DEFERRED.md`, a file deleted at that package's cleanup. The proposal must repoint or resolve those citations.
- The corpus-scope decisions the intake treats as decided (rules-only scope, local bundled embedding model, no vector database, hybrid lexical fallback) are product decisions and each gets its own gate slot with its evidence inlined; none is adopted silently.

Status duties: on start set `status: refining`, `STATUS.refining`, board row under `## refining` (remove the `## ideation` row — a board move is remove-plus-add); on completion set `status: refined`, `STATUS.refined`, board row under `## refined`. Exactly one `STATUS.*` at any time. Commit with explicit paths (`git add PRD/work/rag-rule-retrieval PRD/work/STATUS.md`; never `-A`, `--all`, or `.`). Do not push. Never edit `PRD/sections/`, code, `GRAPH-RUN.md`, any other `PRD/work/` folder, or any `thejudge-*` skill. Do not dispatch subagents. If you write any prompt of your own, copy the `Working directory:` line above into it unchanged.

Return: the commit hash, the list of stable-ID slots in `GATE-QUESTIONS.md`, any `## Blocker questions` entries, the material assumptions list, and the final `STATUS.*` marker.

### gate-qc (attempt 1)

graph is controlling. You are node 4 (`gate-qc`) of graph run `graph-20260905-061805`, dispatched by `graph-kickoff`. Delegate: `thejudge-quality-check`. Package: `PRD/work/rag-rule-retrieval/` on branch `thejudge-auto/rag-rule-retrieval`. Attempt 1.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Read `.claude/skills/thejudge-quality-check/SKILL.md` in full and run its orchestrated (`graph is controlling`) mode; read `PRD/instructions/preparation-contract.md`. Grade `PRD/work/rag-rule-retrieval/DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` against the skill's checklist and emit an explicit PASS or FAIL.

Checks that matter most for this package, beyond the checklist:
- Every `Current:` block in `GATE-QUESTIONS.md` matches the live `PRD/sections/` file verbatim — re-read each live file now; a stale or paraphrased Current block is a FAIL finding.
- Every new stable ID is unused on the live `functional-requirements.md` / `non-functional-requirements.md` / flow lists; every amended ID exists there.
- The cross-cutting amendment set is complete: grep `PRD/sections/` yourself for every location asserting System 3 (the supplemental Comprehensive-Rules excerpt retrieval) is keyword/IDF/lexical scored — `system-map/game-rules-retrieval.md`, `system-map/prompt-assembly.md`, `system-map/prompt-layout-spec.md`, `system-map.md`, `quick-lookup/README.md`, `in-depth/README.md`, `integrations-and-data.md`, `functional-requirements.md`, `open-questions.md` — and confirm each is either amended in the proposal or has a stated reason it needs no change. Derived feature specs and their authoritative REQs must not contradict.
- The dangling citations of `PRD/work/prompt-context-refinement/RAG-DEFERRED.md` in `functional-requirements.md` and `non-functional-requirements.md` are resolved by the proposal.
- `technical-design-rules.md` constraints hold (one endpoint, no rules engine, mock-default provider, no per-request external call added by default) and REQ-032's no-external-call eval constraint is honored.
- Every gate block carries the three plain-language lines (What this decides · In plain terms · What happens if you say no) with cited IDs inlined and technical terms defined, then a complete diff, then `- Verdict:` / `- Reason:` slots.
- The brief names a measurement gate for each build step (benchmark, command, number) and the disposition of every intake item.
- Any user-visible surface change has a `screen-layout.md` row or an explicit reason it needs none.

Status duties: on PASS leave `STATUS.refined` and the board row under `## refined`; on FAIL set `status: refining`, `STATUS.refining`, and move the board row to `## refining` (remove-plus-add). Exactly one `STATUS.*`. Commit any status change with explicit paths (`git add PRD/work/rag-rule-retrieval PRD/work/STATUS.md`; never `-A`, `--all`, or `.`). Do not push. Fix nothing in the brief or the proposal yourself — return every issue. Never edit `PRD/sections/`, code, `GRAPH-RUN.md`, the package `README.md`, any other `PRD/work/` folder, or any `thejudge-*` skill. Do not dispatch subagents. If you write any prompt of your own, copy the `Working directory:` line above into it unchanged.

Return: PASS or FAIL first, then the complete numbered finding list (each with the file, the line or block, what is wrong, and what would resolve it), the commit hash if a status change was committed, and the final `STATUS.*` marker.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "i want to better refine this idea and cleanup the rest of the work folder on that pertains to rag, so that we have a pinpoint gameplan" | answered-once | shape | — |
| "cleanup the rest of the work folder on that pertains to rag" | answered-once | shape | — |
