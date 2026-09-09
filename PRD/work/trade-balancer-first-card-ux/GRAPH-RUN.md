# Graph run — trade-balancer-first-card-ux

- Run ID: `graph-20260909-213550`
- Profile: `.claude/graph-profile.json (loaded — env sentinel observed by graph-preflight at node 1)`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent → "[graph-boundary] \`rm -rf\` is denied in every session."; graph tier: nohup true → "[graph-boundary] \`nohup\` is denied while a graph run holds the lock")`
- Autonomous base: `origin/thejudge-auto/trade-balancer-first-card-ux` (rewritten to `origin/main` by the build half's claim)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-trade-balancer-first-card-ux` (rewritten to `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-trade-balancer-first-card-ux` by the build half's claim)
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20260909-213550/` (one file, `GRAPH-BRIEF.md`, copied verbatim to `PRD/work/trade-balancer-first-card-ux/intake/GRAPH-BRIEF.md` in commit `14f9dfb`; staged copy deleted)
- Current node: `define` (attempt 3 — gate-qc FAIL 2 of max 3 loops)
- Next action: `/graph-kickoff PRD/work/trade-balancer-first-card-ux/` (spec-forming half in progress)

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 9` | `npm run graph:preflight -- --branch thejudge-auto/trade-balancer-first-card-ux --slug trade-balancer-first-card-ux --run-id graph-20260909-213550 --pid 66381` (dry run then real); shape `root`, base `origin/main`; `git ls-remote --heads origin thejudge-auto/trade-balancer-first-card-ux` → `fb1d9cc`; worktree `.worktrees/kickoff-trade-balancer-first-card-ux`; lock `{"slug":"trade-balancer-first-card-ux","runId":"graph-20260909-213550","pid":66381,"startedAt":"2026-09-09T21:36:56.377Z"}`; launch checkout still `main`, untouched | 2026-09-09 |
| 2 | shape | sonnet | ok | `10 → 20` | commit `14f9dfb` on `thejudge-auto/trade-balancer-first-card-ux`: `IDEA.md` (5 `## Prior run` receipt matches), `README.md` (`status: ideation`), `STATUS.ideation`, `intake/GRAPH-BRIEF.md` (byte-identical to the staged copy), `PRD/work/STATUS.md` board row under `## ideation`; staging folder emptied | 2026-09-09 |
| 3 | define | opus | ok | `1 → 42` | commit `9863eaa`: `DESIGN-BRIEF.md` (208 lines, `## Assumptions` 11 rows), `GATE-QUESTIONS.md` (508 lines, 10 `## ` blocks: REQ-064, REQ-065, REQ-066, FLOW-009, FLOW-025, trade-balancer README, screen-layout, system-map, integrations-and-data, cardPrintingPrices.md; 10 blank `- Verdict:` slots; no new IDs; no `## Blocker questions`), `STATUS.ideation → STATUS.refined`, README `status: refined`, board row moved `## ideation → ## refined`; `git status --porcelain` empty; no `PRD/sections/` or code edits; gate signal present → continue to `gate-qc` | 2026-09-09 |
| 4 | gate-qc | sonnet | failed | `0 → 37` | FAIL, 1 finding: `PRD/sections/overview.md:43` (price fetch "made only when a card is added") is a live backend-traffic assertion no `GATE-QUESTIONS.md` block amends; all 10 existing diffs verified verbatim against current `PRD/sections/`. Commit `b72237c`: `STATUS.refined → STATUS.refining`, board row `## refined → ## refining`. README `## Preparation gate` rewritten FAIL. Loop → `define` attempt 2 | 2026-09-09 |
| 3 | define (attempt 2) | opus | ok | `0 → 34` | commit `9a60937`: `GATE-QUESTIONS.md` now 12 blocks (added `PRD/sections/overview.md` and `PRD/sections/non-functional-requirements.md` NFR-013 — the second surfaced by re-running the enumeration grep across `PRD/sections/`, 17 files matched, 10 already covered, non-contradicted matches recorded with reasons in `DESIGN-BRIEF.md`); 12 blank `- Verdict:` slots; 43 removed diff lines re-checked against live `PRD/sections/` text, 0 mismatches; `STATUS.refining → STATUS.refined`; board row `## refining → ## refined`; `git status --porcelain` empty | 2026-09-09 |
| 4 | gate-qc (attempt 2) | sonnet | failed | `1 → 39` | FAIL, 2 findings, same shape as attempt 1 inside files that already have a block: `PRD/sections/trade-balancer/data/cardPrintingPrices.md:126-127` (fetched only when that card is added) and `PRD/sections/integrations-and-data.md:154` (on-add fetch) — their blocks' diffs never touch those lines. Attempt 1's `overview.md:43` finding closed. All 12 blocks' removed lines verified verbatim. Commit `37aa86b`: `STATUS.refined → STATUS.refining`, board row `## refined → ## refining`. README `## Preparation gate` rewritten FAIL (attempt 2). Loop → `define` attempt 3 (FAIL 2 of max 3 loops) | 2026-09-09 |

## Open gate

- None

## Dispatch prompts

### preflight

graph is controlling.

You are node 1 (`preflight`) of graph run `graph-20260909-213550`, driven by `graph-kickoff`. Invoke the `graph-preflight` skill (Skill tool, name `graph-preflight`) and follow its `## Procedure` exactly. Do not reimplement it.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy the `Working directory:` line above, unchanged and on its own line, into every prompt you write for any subagent (you should not need any).

Inputs — use these exact values:
- `--branch thejudge-auto/trade-balancer-first-card-ux`
- `--slug trade-balancer-first-card-ux`
- `--run-id graph-20260909-213550`
- `--pid 66381` (the driver session's long-lived pid)
- base: default (`origin/main`)

Steps:
1. Read `PRD/instructions/graph-workflow-contract.md` sections `## Hook liveness` and `## One run at a time`, and the skill's SKILL.md.
2. Run the dry run first: `npm run graph:preflight -- --branch thejudge-auto/trade-balancer-first-card-ux --slug trade-balancer-first-card-ux --run-id graph-20260909-213550 --pid 66381 --dry-run`. Report the `shape:`, `base:`, `worktree:`, planned commands, `profile sentinel:` / `Profile:` lines verbatim.
3. If it exits 1 or 2, stop and relay the message verbatim. Do not hand-resolve anything.
4. Otherwise run the identical command without `--dry-run`.
5. Issue `CANARY_COMMAND` (the universal-tier canary the script prints) as a real Bash tool call and require a deny. Then issue `GRAPH_CANARY_COMMAND` as a real Bash tool call and require a deny (the lock is now held). Quote each hook deny reason text verbatim. An allowed canary is BLOCKED — report it verbatim and stop.
6. Confirm the end state: `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-trade-balancer-first-card-ux && git branch --show-current` equals the branch; `git ls-remote --heads origin thejudge-auto/trade-balancer-first-card-ux` shows it pushed; `git branch --show-current` at the launch root is still `main`; `cat .worktrees/.graph-run.lock` at the launch root shows the lock record.

Boundaries: never commit, stash, or switch the launch checkout; never force-push; never remove a lock, sentinel, or worktree; never retry a denied command. Use `cd <path> && git …` forms, never `git -C`.

Report back, in this order, each on its own line: outcome (`ok` | `failed` | `BLOCKED`), `shape:`, `base:`, `worktree:` (absolute path), branch, push confirmation command + result, lock record contents, `Profile:` line verbatim, universal canary command + verbatim deny text, graph canary command + verbatim deny text, and the exact tool-call count you made.

### shape

graph is controlling.

You are node 2 (`shape`) of graph run `graph-20260909-213550`, driven by `graph-kickoff`. Invoke the `thejudge-kickoff` skill (Skill tool, name `thejudge-kickoff`) and follow its `## Mode` section for an orchestrator-controlled run. Do not reimplement it.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-trade-balancer-first-card-ux

Copy the `Working directory:` line above, unchanged and on its own line, into every prompt you write for any subagent. Every file you read or write lives under that directory (it is a git worktree on branch `thejudge-auto/trade-balancer-first-card-ux`). Never touch `/Users/chrismiho/Coding/Projects/TheJudge` itself except to read the staged intake named below.

Request (verbatim from the owner): "Trade Balancer: pick the printing before adding, auto-select foil mode, scrollable printing picker, and wake the API on open so the first card prices fast"

Supplied slug — use it verbatim: `trade-balancer-first-card-ux`
Package path to create: `PRD/work/trade-balancer-first-card-ux/` (relative to the working directory)

Staged intake (absolute path, read-only source): `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20260909-213550/`
It holds one file, `GRAPH-BRIEF.md`. After `PRD/work/trade-balancer-first-card-ux/` exists: copy it verbatim into `PRD/work/trade-balancer-first-card-ux/intake/GRAPH-BRIEF.md`, commit it on the branch with explicit paths, then delete the staged copy — in that order. Intake is evidence, never authority (`PRD/instructions/graph-workflow-contract.md`, `## Intake is evidence, never authority`): record any document it cites only as a path citation; never open a cited document (that includes `FINDINGS-live-observation.md` and the screenshots it names).

Prior runs: grep `PRD/instructions/receipts/` for slug and keyword matches (trade balancer, printing, price, foil, picker, cold start) and write one `## Prior run` line per match into `IDEA.md`, naming the receipt path.

Outputs the skill defines: `IDEA.md`, `README.md` (`status: ideation` at top), the single marker `STATUS.ideation`, `intake/GRAPH-BRIEF.md`, and the `PRD/work/STATUS.md` board row under `## ideation`. Do NOT create `GRAPH-RUN.md` — the driver owns the ledger and writes it after you return.

Commit: `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-trade-balancer-first-card-ux && git add <explicit paths> && git commit -m "..."`. Never `git add -A`, `git add .`, or `git -C`. Do not push.

If the request cannot be turned into an actionable package, return `NO ACTIONABLE PACKAGE` with the reason.

Report back, each on its own line: outcome (`ok` | `NO ACTIONABLE PACKAGE`), package path, files created, intake handled (copied → committed → staged copy deleted, with the commit hash), prior-run matches found (paths), the `git log --oneline -3` of the worktree, and the exact tool-call count you made.

### define

graph is controlling.

You are node 3 (`define`) of graph run `graph-20260909-213550`, driven by `graph-kickoff`. Invoke the `thejudge-refinement` skill (Skill tool, name `thejudge-refinement`) on the package `PRD/work/trade-balancer-first-card-ux/` and follow its `## Mode` section for an orchestrator-controlled run: read `PRD/instructions/preparation-contract.md`, replace the approval pause with its conservative assumption ladder applied one question at a time, record every material assumption and its evidence in `DESIGN-BRIEF.md`, and continue without pausing for a user. Do not reimplement the skill.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-trade-balancer-first-card-ux

Copy the `Working directory:` line above, unchanged and on its own line, into every prompt you write for any subagent. Every file you read or write lives under that directory (a git worktree on branch `thejudge-auto/trade-balancer-first-card-ux`). Never write to `/Users/chrismiho/Coding/Projects/TheJudge` itself.

Package inputs already present: `IDEA.md` (problem, outcome, non-goals, five `## Prior run` receipt matches), `README.md`, `STATUS.ideation`, and `intake/GRAPH-BRIEF.md` — a measured brief with live-site numbers, a converged design direction, the PRD sections it expects to amend, and a slice sketch.

Intake is evidence, never authority (`PRD/instructions/graph-workflow-contract.md`, `## Intake is evidence, never authority`). You may adopt the brief's findings and its design direction as the proposal when the code and current `PRD/sections/` truth support them, and you should verify each claim against the code in this worktree (the components under `apps/frontend/src/components/trade/`, `apps/frontend/src/lib/trade/`, `scripts/build-card-detail-by-oracle-id.mjs`, the backend price route) and against the current wording of REQ-065, REQ-066, FLOW-009, FLOW-025, the trade-balancer README, and the screen-layout row. Every product-truth change the proposal needs — including each amendment the brief calls settled — is still the owner's decision at the gate: it gets its own `GATE-QUESTIONS.md` block. Any document the intake cites (its `FINDINGS-live-observation.md`, its screenshots) is recorded only as a path citation; never open one.

Propose, do not apply. Write only inside `PRD/work/trade-balancer-first-card-ux/`. Never edit `PRD/sections/` or code. New stable IDs, if any, are named and reserved in the proposal only.

Outputs:
1. `DESIGN-BRIEF.md` — the design record, with a `## Assumptions` section listing each material assumption, the ladder rung it was resolved on, and its evidence.
2. `GATE-QUESTIONS.md` — if the design needs any `PRD/sections/` change (amendments to existing IDs count). One `## <STABLE-ID>` block per stable ID, in this shape (see `## The two runs` in the contract and `PRD/instructions/plain-language-standard.md`): a heading `## <ID> — <plain-language title>`, then the three labelled lines **What this decides:** / **In plain terms:** / **What happens if you say no:** with the substance of every cited REQ/FLOW inlined and every technical term defined in the same sentence, then that ID's complete proposed diff in a fenced ```diff block (the full replacement text, never a summary), then `- Verdict:` (left blank for the owner) and `- Reason:`. Add a trailing `## Blocker questions` section only for a genuine decision blocker under the contract's three-condition test. A non-ID edit (the trade-balancer feature README, the screen-layout row) rides under a `## <nearest governing ID>` block or its own `## <file path>` block with the same three lines and full diff.
3. `STATUS.refined` replacing `STATUS.ideation` (exactly one marker), `README.md` top line `status: refined`, and the `PRD/work/STATUS.md` board row moved from `## ideation` to `## refined` (remove the old row, add the new one).

If uncertainty meets the genuine decision blocker test, preserve the furthest valid artifacts, write the blocker under `## Blocker questions`, and return it to the driver instead of guessing.

Commit when done: `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-trade-balancer-first-card-ux && git add <explicit paths> && git commit -m <message>`. Never `git add -A`, `git add .`, or `git -C`. Do not push. Do not edit `GRAPH-RUN.md` — the driver owns the ledger.

Boundaries: no `PRD/sections/` edits, no code edits, no `.claude/` or `CLAUDE.md` edits, no network refresh, no browser needed. Your tool-call budget for this dispatch is 150; a denial at the cap is final — write nothing further and report.

Report back, each on its own line: outcome (`ok` | `failed` | `blocker`), files written, whether `GATE-QUESTIONS.md` exists and the list of `## ` block IDs it carries, any blocker question verbatim, the commit hash, `git status --porcelain` of the worktree (expect empty), and the exact tool-call count you made.

### gate-qc (attempt 1)

graph is controlling.

You are node 4 (`gate-qc`, attempt 1) of graph run `graph-20260909-213550`, driven by `graph-kickoff`. Invoke the `thejudge-quality-check` skill (Skill tool, name `thejudge-quality-check`) on the package `PRD/work/trade-balancer-first-card-ux/` and follow its `## Mode` section for an orchestrator-controlled run: read `PRD/instructions/preparation-contract.md`, emit an explicit PASS or FAIL verdict, and return every FAIL issue to the driver. Do not self-certify a failed brief, do not fix the brief yourself, and do not create map-out artifacts. Do not reimplement the skill.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-trade-balancer-first-card-ux

Copy the `Working directory:` line above, unchanged and on its own line, into every prompt you write for any subagent. Every file you read or write lives under that directory (a git worktree on branch `thejudge-auto/trade-balancer-first-card-ux`). Never write to `/Users/chrismiho/Coding/Projects/TheJudge` itself.

Artifact under check: `PRD/work/trade-balancer-first-card-ux/DESIGN-BRIEF.md`, together with the proposal in `PRD/work/trade-balancer-first-card-ux/GATE-QUESTIONS.md` (10 `## ` blocks, each a proposed amendment to an existing `PRD/sections/` ID or file; no new stable IDs). Refinement proposes and does not apply, so `PRD/sections/` is unchanged on this branch — check the proposed diffs against the current `PRD/sections/` text, not for a live diff. Check in particular: PRD alignment of the proposed amendments (each block's diff replaces the current text it claims to replace, and the set of amended assertions is complete — grep `PRD/sections/` for any remaining live assertion about the balancer's default printing, foil default, picker behaviour, or its backend traffic that the proposal misses); each gate block carries the three plain-language lines and a complete diff, not a summary; the brief's assumptions are evidence-backed; agent-readiness of the slice sketch (a map-out agent could slice it without asking questions); the constraints the brief names (scan path untouched, no new artifact fields, Lambda budget) are testable.

Outputs the skill defines: the PASS/FAIL report written where the skill puts it. On FAIL, also replace `STATUS.refined` with `STATUS.refining` (exactly one marker) and move the `PRD/work/STATUS.md` board row from `## refined` to `## refining` (remove the old row, add the new one); on PASS leave the marker and the row as they are. Do not write the README `## Preparation gate` section — the driver records it. Do not edit `GRAPH-RUN.md`.

Commit any files you write: `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-trade-balancer-first-card-ux && git add <explicit paths> && git commit -m <message>`. Never `git add -A`, `git add .`, or `git -C`. Do not push.

Your tool-call budget for this dispatch is 60; a denial at the cap is final — write nothing further and report.

Report back, each on its own line: verdict (`PASS` | `FAIL`), the path of the report you wrote, the complete findings list (every issue on FAIL, or `none`), files written, commit hash, `git status --porcelain` of the worktree (expect empty), and the exact tool-call count you made.

### define (attempt 2)

graph is controlling.

You are node 3 (`define`, attempt 2) of graph run `graph-20260909-213550`, driven by `graph-kickoff`. Quality-check (node 4) returned FAIL with one finding; your job is to close it and return the package to `STATUS.refined`. Invoke the `thejudge-refinement` skill (Skill tool, name `thejudge-refinement`) on the package `PRD/work/trade-balancer-first-card-ux/` and follow its `## Mode` section for an orchestrator-controlled run (read `PRD/instructions/preparation-contract.md`; assumption ladder applied one question at a time; no pause for a user). Do not reimplement the skill. This is a targeted repair, not a rewrite: keep `DESIGN-BRIEF.md` and the existing ten `GATE-QUESTIONS.md` blocks as they are except where the finding requires a change.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-trade-balancer-first-card-ux

Copy the `Working directory:` line above, unchanged and on its own line, into every prompt you write for any subagent. Every file you read or write lives under that directory (a git worktree on branch `thejudge-auto/trade-balancer-first-card-ux`). Never write to `/Users/chrismiho/Coding/Projects/TheJudge` itself.

The finding (verbatim from the package README `## Preparation gate`, which you should read):
`PRD/sections/overview.md:43` — the sentence that says prices come from a read-only backend fetch made only when a card is added — is a live assertion about the balancer's backend traffic that the 10-block amendment set in `GATE-QUESTIONS.md` does not cover; it is contradicted by the proposed REQ-064 warm-up ping and the REQ-065/FLOW-025 fetch-on-suggestion-tap change. No `overview.md` block exists in `GATE-QUESTIONS.md`.

What to do:
1. Read `PRD/sections/overview.md` around line 43 and the existing `GATE-QUESTIONS.md` blocks for REQ-064, REQ-065, and FLOW-025 so the new wording is consistent with them.
2. Add an eleventh block `## PRD/sections/overview.md — <plain-language title>` to `GATE-QUESTIONS.md` in the same shape as the others: the three labelled lines **What this decides:** / **In plain terms:** / **What happens if you say no:** (substance of every cited REQ/FLOW inlined, technical terms defined in the same sentence), then the complete proposed diff in a fenced ```diff block whose removed lines match the current file text verbatim, then blank `- Verdict:` and `- Reason:` slots. Place it with the other file-level blocks.
3. Since the checker found this by grepping `PRD/sections/` for live assertions about the balancer's traffic, defaults, foil, and picker, run that grep yourself once more across all of `PRD/sections/` (including `overview.md`, `goals-and-non-goals.md`, `non-functional-requirements.md`, `decisions.md`, the shared-chrome and scan READMEs) and add a block for any other assertion the eleven blocks still leave contradicted. Record what you grepped and what it matched in `DESIGN-BRIEF.md` (the methodology or `## Product-truth changes proposed` section) so the next check can see the set was enumerated, not remembered.
4. Update `DESIGN-BRIEF.md`'s list of proposed product-truth changes and the README pointer sentence to the new block count.
5. Replace `STATUS.refining` with `STATUS.refined` (exactly one marker), set the README top line to `status: refined`, and move the `PRD/work/STATUS.md` board row from `## refining` to `## refined` (remove the old row, add the new one).

Propose, do not apply: write only inside `PRD/work/trade-balancer-first-card-ux/` and the board file. Never edit `PRD/sections/` or code. Do not edit `GRAPH-RUN.md` or the README `## Preparation gate` section — the driver owns both. Never open a document the intake cites.

Commit when done: `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-trade-balancer-first-card-ux && git add <explicit paths> && git commit -m <message>`. Never `git add -A`, `git add .`, or `git -C`. Do not push.

Your tool-call budget for this dispatch is 150; a denial at the cap is final — write nothing further and report.

Report back, each on its own line: outcome (`ok` | `failed` | `blocker`), files written, the full list of `## ` block IDs now in `GATE-QUESTIONS.md`, the grep you ran and any additional assertions it surfaced, any blocker question verbatim, the commit hash, `git status --porcelain` of the worktree (expect empty), and the exact tool-call count you made.

### gate-qc (attempt 2)

graph is controlling.

You are node 4 (`gate-qc`, attempt 2) of graph run `graph-20260909-213550`, driven by `graph-kickoff`. Attempt 1 returned FAIL on one finding (`PRD/sections/overview.md:43`, the sentence saying the price fetch is made only when a card is added, was not covered by any gate block); refinement attempt 2 has since added two blocks (`PRD/sections/overview.md` and `PRD/sections/non-functional-requirements.md` NFR-013) and recorded its enumeration grep in `DESIGN-BRIEF.md`. Re-grade the whole package fresh — do not assume attempt 1's clean items are still clean. Invoke the `thejudge-quality-check` skill (Skill tool, name `thejudge-quality-check`) on the package `PRD/work/trade-balancer-first-card-ux/` and follow its `## Mode` section for an orchestrator-controlled run: read `PRD/instructions/preparation-contract.md`, emit an explicit PASS or FAIL verdict, and return every FAIL issue to the driver. Do not self-certify, do not fix the brief yourself, and do not create map-out artifacts. Do not reimplement the skill.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-trade-balancer-first-card-ux

Copy the `Working directory:` line above, unchanged and on its own line, into every prompt you write for any subagent. Every file you read or write lives under that directory (a git worktree on branch `thejudge-auto/trade-balancer-first-card-ux`). Never write to `/Users/chrismiho/Coding/Projects/TheJudge` itself.

Artifact under check: `PRD/work/trade-balancer-first-card-ux/DESIGN-BRIEF.md`, together with the proposal in `PRD/work/trade-balancer-first-card-ux/GATE-QUESTIONS.md` (12 `## ` blocks, each a proposed amendment to an existing `PRD/sections/` ID or file; no new stable IDs). Refinement proposes and does not apply, so `PRD/sections/` is unchanged on this branch — check the proposed diffs against the current `PRD/sections/` text, not for a live diff. Check in particular: every block's removed lines match the current text verbatim; the amendment set is complete (grep `PRD/sections/` for any remaining live assertion about the balancer's default printing, foil default, picker behaviour, or its backend traffic that the twelve blocks still leave contradicted, and check the brief's stated reasons for the matches it judged not contradicted); each block carries the three plain-language lines and a complete diff, not a summary; the brief's assumptions are evidence-backed; the slice sketch is map-out-ready; the named constraints (scan path untouched, no new artifact fields, Lambda budget) are testable.

Outputs the skill defines: the PASS/FAIL verdict and findings returned to the driver. On FAIL, also replace `STATUS.refined` with `STATUS.refining` (exactly one marker) and move the `PRD/work/STATUS.md` board row from `## refined` to `## refining` (remove the old row, add the new one), then commit those two files; on PASS leave the marker and the row as they are and write nothing. Do not write the README `## Preparation gate` section — the driver records it. Do not edit `GRAPH-RUN.md`.

Commit form if you write anything: `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-trade-balancer-first-card-ux && git add <explicit paths> && git commit -m <message>`. Never `git add -A`, `git add .`, or `git -C`. Do not push.

Your tool-call budget for this dispatch is 60; a denial at the cap is final — write nothing further and report.

Report back, each on its own line: verdict (`PASS` | `FAIL`), the complete findings list (every issue on FAIL, or `none`), what you verified on PASS (one line per check), files written (or none), commit hash (or none), `git status --porcelain` of the worktree (expect empty), and the exact tool-call count you made.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Trade Balancer: pick the printing before adding, auto-select foil mode, scrollable printing picker, and wake the API on open so the first card prices fast" | answered-once | shape | — |
