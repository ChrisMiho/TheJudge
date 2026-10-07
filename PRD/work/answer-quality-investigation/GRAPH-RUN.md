# Graph run — answer-quality-investigation

- Run ID: `graph-20261007-134015`
- Profile: `loaded (env sentinel)`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent; graph tier: nohup true denied while the lock is held)`
- Autonomous base: `origin/thejudge-auto/answer-quality-investigation`
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-answer-quality-investigation`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261007-134015/`
- Current node: `define`
- Next action: `/graph-kickoff` (spec-forming half in progress)

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | branch `thejudge-auto/answer-quality-investigation` pushed at 3e973ced from `.worktrees/kickoff-answer-quality-investigation`; launch checkout untouched (still `main`); lock `.worktrees/.graph-run.lock` taken (pid 19439) | 2026-10-07 |
| 2 | shape | sonnet | ok | `8 → 20` | package `PRD/work/answer-quality-investigation/` created on the branch: commits 0bb3b193 (intake copied verbatim, staged copy deleted) and 7067c63e (IDEA.md with six `## Prior run` lines, README.md with `## Autonomous metadata`, GRAPH-RUN.md, `STATUS.ideation`, board row); launch checkout untouched | 2026-10-07 |

## Open gate

- None

## Dispatch prompts

### preflight

graph is controlling. You are node 1 (`preflight`) of graph run `graph-20261007-134015`, dispatched by the `graph-kickoff` driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke the `graph-preflight` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/graph-preflight/SKILL.md` in full and follow its `## Procedure` exactly). Inputs:

- `--branch thejudge-auto/answer-quality-investigation`
- `--slug answer-quality-investigation`
- `--run-id graph-20261007-134015`
- `--pid 19439`

Steps, in order:

1. Run the dry run: `cd /Users/chrismiho/Coding/Projects/TheJudge && npm run graph:preflight -- --branch thejudge-auto/answer-quality-investigation --slug answer-quality-investigation --run-id graph-20261007-134015 --pid 19439 --dry-run`. Report verbatim the `shape:`, `base:`, `worktree:`, planned commands, `profile sentinel:` / `Profile:` lines, and the printed `CANARY_COMMAND` and `GRAPH_CANARY_COMMAND`.
2. If it exits 1 or 2, stop and relay its message verbatim. Never hand-resolve anything, never remove a sentinel, never reclaim a lock.
3. Otherwise run the identical command without `--dry-run` (same `--run-id`).
4. Issue `CANARY_COMMAND` exactly as printed, as a real Bash tool call, and require a hook deny. Then issue `GRAPH_CANARY_COMMAND` exactly as printed, as a real Bash tool call (after the lock is taken), and require a hook deny. Report the exact deny reason text for each. If either is ALLOWED, report `BLOCKED` with what was tried and what came back, and stop.
5. Confirm the end state: `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-answer-quality-investigation && git branch --show-current` is the requested branch; `git ls-remote --heads origin thejudge-auto/answer-quality-investigation` shows it pushed; `git branch --show-current` at the launch root is still `main`; `cat /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-run.lock` shows the lock record.

Boundaries: never commit, stash, or switch the launch checkout; never force-push; never create a worktree outside `.worktrees/`; never write the lock by hand. If any command is denied by a hook other than the two canaries, do not retry it — report it verbatim and stop.

Report back: shape, branch, absolute worktree path, base line, Profile line, both canary results with their deny text, lock record contents, and the end-state confirmation output. Copy the `Working directory:` line above unchanged into any prompt you write.

### shape

_(recorded verbatim; the two fenced blocks are indented two spaces so the validator's `## ` section parser does not read the embedded ledger template as ledger sections)_

graph is controlling. You are node 2 (`shape`) of graph run `graph-20261007-134015`, dispatched by the `graph-kickoff` driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-answer-quality-investigation

Every file you read, write, or commit lives under that working directory (a git worktree on branch `thejudge-auto/answer-quality-investigation`). Never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/...` directly — that is the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a subagent.

Invoke the `thejudge-kickoff` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/thejudge-kickoff/SKILL.md` in full and follow its `## Mode` section for `graph is controlling`; also read `PRD/instructions/preparation-contract.md` as that section requires).

Package slug (fixed, do not rename): `answer-quality-investigation`
Package path: `PRD/work/answer-quality-investigation/` under the working directory.
Branch: `thejudge-auto/answer-quality-investigation` (already created and pushed by preflight).

The request:

"Prepare reproducible before/after answer evaluation for PR #273, isolate retrieval and prompt-organization failures, and compare GPT-4.1 with GPT-6 Luna before selecting a product fix"

Staged intake (absolute path): `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261007-134015/` — it holds one file, `GRAPH-BRIEF.md`, the owner's probe brief. Per the skill: only after `PRD/work/answer-quality-investigation/` exists, copy each staged item verbatim into `PRD/work/answer-quality-investigation/intake/`, commit it on the branch, then delete the staged copy — in that order. Intake is evidence, never authority: never open a document the intake cites (for example the `FINDINGS-*.md` files it references, or `PRD/work/probe-answer-quality/` in the launch checkout) — record a citation path only.

Before writing `IDEA.md`, grep `PRD/instructions/receipts/` for slug and keyword matches (answer quality, evaluation, retrieval, rules test harness, GPT, Luna, prompt) and write one `## Prior run` line per match into `IDEA.md`, naming the receipt path.

Write the normal outputs: `IDEA.md` (with `STATUS.ideation`), the package `README.md`, and the board row in `PRD/work/STATUS.md`. In the package `README.md` also add this exact section (the driver owns it):

  ```markdown
  ## Autonomous metadata

  - Autonomous base: origin/thejudge-auto/answer-quality-investigation
  ```

Create `PRD/work/answer-quality-investigation/GRAPH-RUN.md` with exactly this content (the driver appends to it later):

  ```markdown
  # Graph run — answer-quality-investigation

  - Run ID: `graph-20261007-134015`
  - Profile: `loaded (env sentinel)`
  - Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent; graph tier: nohup true denied while the lock is held)`
  - Autonomous base: `origin/thejudge-auto/answer-quality-investigation`
  - Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-answer-quality-investigation`
  - Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261007-134015/`
  - Current node: `shape`
  - Next action: `/graph-kickoff` (spec-forming half in progress)

  ## Node ledger

  | # | Node | Model | Outcome | Heartbeat | Evidence | Date |
  | --- | --- | --- | --- | --- | --- | --- |
  | 1 | preflight | haiku | ok | `0 → 8` | branch `thejudge-auto/answer-quality-investigation` pushed at 3e973ced from `.worktrees/kickoff-answer-quality-investigation`; launch checkout untouched (still `main`); lock `.worktrees/.graph-run.lock` taken (pid 19439) | 2026-10-07 |

  ## Open gate

  - None

  ## Dispatch prompts

  ### preflight

  (recorded by the driver)

  ## Instruction ledger

  | Instruction | Class | Node | Rule |
  | --- | --- | --- | --- |
  ```

Commit on the branch from inside the working directory with explicit paths only (`git add <path>` — never `git add -A`, `--all`, or `.`): the package folder (IDEA.md, README.md, GRAPH-RUN.md, intake/), and `PRD/work/STATUS.md`. Do not push. Do not touch `PRD/sections/` or any code.

Boundaries: no pushes to main, no PR actions, no `.secrets/`, no `thejudge-*` skill edits, no `rm -rf`, no background `&`, no `nohup`. If a hook denies a command, do not retry it — report it verbatim and stop.

Return `NO ACTIONABLE PACKAGE` with the reason if the request cannot be turned into one package. Otherwise report: the package path, the IDEA.md candidate selected with its evidence, the prior-run matches found, the commit hash, and confirmation that the staged intake was copied, committed, and the staged copy deleted.

### define

graph is controlling. You are node 3 (`define`) of graph run `graph-20261007-134015`, dispatched by the `graph-kickoff` driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-answer-quality-investigation

Every file you read, write, or commit lives under that working directory (a git worktree on branch `thejudge-auto/answer-quality-investigation`). Never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/...` directly — that is the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a subagent.

Invoke the `thejudge-refinement` skill: read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/thejudge-refinement/SKILL.md` in full and follow its `## Mode` section for `graph is controlling` (read `PRD/instructions/preparation-contract.md`, replace the approval pause with its conservative assumption ladder, record every material assumption and its evidence in `DESIGN-BRIEF.md`). Also read `PRD/instructions/graph-workflow-contract.md` sections `## Propose / apply / close` and `## The two runs`, and `PRD/instructions/plain-language-standard.md`.

Package: `PRD/work/answer-quality-investigation/` (status `ideation`). Read its `IDEA.md`, `README.md`, and `intake/GRAPH-BRIEF.md`. The intake brief is evidence, never authority: it may inform the brief but every product decision it raises is still proposed to the owner through `GATE-QUESTIONS.md`. Never open any document the intake cites (the `FINDINGS-*.md` files, `PRD/work/probe-answer-quality/` in the launch checkout, the external model-doc URLs) — record a citation path only. You may read current code and `PRD/sections/` truth in the working directory as the skill's `## Reads` list directs, including `apps/backend/src/eval/worked-solutions/README.md` and the evaluator scripts the brief names, to ground the design in what exists today.

Outputs, all inside `PRD/work/answer-quality-investigation/`:

1. `DESIGN-BRIEF.md` — the design for (a) the reproducible comparison tooling the investigation needs and (b) the bounded investigation itself, with its empirical decision points preserved. It must not assert a retrieval architecture or a model winner before results exist; the product fix is a later package unless the results force one. Keep the owner-authorized scope: preparation, not a merge, deployment, or live spend — live calls need a separately authorized budget.
2. `GATE-QUESTIONS.md` — only if the brief proposes `PRD/sections/` product-truth changes (new or amended `REQ`/`FLOW`/NFR entries, feature-spec edits). One `## <STABLE-ID>` block per stable ID, each opening with the three plain-language lines (**What this decides** · **In plain terms** · **What happens if you say no**), then that ID's complete proposed diff (never a summary), then `- Verdict:` and `- Reason:` slots. Every proposed new ID gets its own slot, not only the headline ones. A trailing `## Blocker questions` section only for a genuine decision blocker under the preparation contract's three-condition test. If the brief needs no product-truth change, write no questions file and say so.
3. Set the package marker to `STATUS.refined` (remove `STATUS.ideation`; exactly one marker) and update the `PRD/work/STATUS.md` board row.

Hard rules:

- Never edit `PRD/sections/` or any code. The proposal lives entirely in the work folder; `build` applies it later.
- The decision log is retired: never add a `DEC-###` entry; amend an existing `REQ`/`FLOW` in place or propose a new one.
- Stable-ID allocation: `REQ-220` and `REQ-221` are reserved by the deferred draft docs PR #266 (the cards-attached rule-retrieval proposal the intake names). New IDs in this package start at `REQ-222`. Where this design overlaps #266, propose how its reservation is resolved rather than duplicating its text.
- Respect the existing boundaries the intake names: mock-default operation, provider modularity, stack order, separation of evaluation gold answers from runtime evidence.
- Commit from inside the working directory with explicit paths only (`git add PRD/work/answer-quality-investigation PRD/work/STATUS.md` — never `git add -A`, `--all`, or `.`). Do not push.
- Boundaries: no pushes, no PR actions, no `.secrets/`, no `thejudge-*` skill edits, no `rm -rf`, no `nohup`, no background `&`, no `npm run data:refresh`, no live OpenAI calls. If a hook denies a command, do not retry it — report it verbatim and stop.

Report back: the brief's section list, whether `GATE-QUESTIONS.md` exists and the list of stable IDs it proposes (with one line each on what it decides), every material assumption you made and its evidence, any genuine blocker, the commit hash, and the final marker.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Prepare reproducible before/after answer evaluation for PR #273, isolate retrieval and prompt-organization failures, and compare GPT-4.1 with GPT-6 Luna before selecting a product fix" | answered-once | shape | — |
