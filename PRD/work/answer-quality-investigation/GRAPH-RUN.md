# Graph run — answer-quality-investigation

- Run ID: `graph-20261007-134015`
- Profile: `loaded (env sentinel)`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent; graph tier: nohup true denied while the lock is held)`
- Autonomous base: `origin/main` (rewritten by the build half's claim on 2026-10-07; was `origin/thejudge-auto/answer-quality-investigation`, docs PR #274 merged)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-answer-quality-investigation` (rewritten by the build half's claim; the kickoff worktree was removed clean)
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261007-134015/`
- Current node: `build`
- Next action: `/graph-implement PRD/work/answer-quality-investigation/` (build half in progress: gate-qc → plan → build → review → close)

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | branch `thejudge-auto/answer-quality-investigation` pushed at 3e973ced from `.worktrees/kickoff-answer-quality-investigation`; launch checkout untouched (still `main`); lock `.worktrees/.graph-run.lock` taken (pid 19439) | 2026-10-07 |
| 2 | shape | sonnet | ok | `8 → 20` | package `PRD/work/answer-quality-investigation/` created on the branch: commits 0bb3b193 (intake copied verbatim, staged copy deleted) and 7067c63e (IDEA.md with six `## Prior run` lines, README.md with `## Autonomous metadata`, GRAPH-RUN.md, `STATUS.ideation`, board row); launch checkout untouched | 2026-10-07 |
| 3 | define | opus | ok | `22 → 79` (two driver bookkeeping calls charged to shape/1 before run-state moved) | commit b771735d: `DESIGN-BRIEF.md` (14 sections, decision points D0–D5, 23 assumptions, no blocker) + `GATE-QUESTIONS.md` (11 stable-ID blocks: new REQ-226–230; amend REQ-185/186/187/188/189, NFR-018; `## Blocker questions` empty) + `STATUS.refined` + board row; `git diff --stat HEAD~1 -- PRD/sections apps` empty → gate: proposal present, continue to gate-qc | 2026-10-07 |
| 4 | gate-qc | sonnet | ok (PASS) | `79 → 97` (one driver bookkeeping call charged to define/1) | commit 05ecc20b: `PRD/work/answer-quality-investigation/QUALITY-CHECK.md` — Verdict: PASS, findings none; 12/12 removed diff lines match live `PRD/sections/` text; marker left `STATUS.refined`; driver then wrote `## Preparation gate` (PASS), parked at `owner-action`, pushed 2ff207af, opened docs PR https://github.com/ChrisMiho/TheJudge/pull/274 | 2026-10-07 |
| — | claim (driver) | — | ok | — | docs PR #274 merged 2026-10-07T21:48Z; kickoff worktree removed clean (`git worktree remove`, porcelain empty); `.worktrees/implement-answer-quality-investigation` cut on `thejudge-auto/answer-quality-investigation-work` from `origin/main` (1a8e61d5); claim commit fa12f0d0 pushed; lock re-taken (`graph:preflight --take-lock`, pid 19439); graph canary `nohup true` denied | 2026-10-07 |
| 4b | gate-review | sonnet | ok | `0 → 21` | commit 75b85c00: 11 verdicts applied inside `GATE-QUESTIONS.md` (9 accept, 2 edit: REQ-226 drops the cross-checkout `--subject` import and adds a regrade mode; REQ-188 drops the production timeout/retry criterion, keeps combo-catalog parity); `DESIGN-BRIEF.md` reconciled (§2, §4.1, §4.2, §4.8, Phase 0/2/3 steps, §12, truth-changes rows, A6/A9); README note none; `## Gate verdicts` + `### Brief reconciliation` written; marker `STATUS.refined`; board row refined; `git diff --stat HEAD~1 -- PRD/sections apps scripts` empty | 2026-10-07 |
| 4 (attempt 2) | gate-qc | sonnet | failed (FAIL) | `0 → 21` | commit 3bb5bdd2: `QUALITY-CHECK.md` overwritten — Verdict: FAIL, 2 findings: (1) accepted REQ-229 still carries the `--subject`/`--subject-b` cross-checkout import the owner's REQ-226 edit dropped (brief §4.5, Phase 0 step 2 repeat it); (2) "subject" is an undefined term in REQ-228/229/230 and brief §4.4–4.6; both edits (REQ-226, REQ-188) themselves confirmed consistent; marker `STATUS.refining`, board row refining; driver rewrote README `## Preparation gate` (FAIL + findings) and `status: refining` → loop to `define` (gate-qc→define loop 1 of 3) | 2026-10-07 |
| 3 (attempt 2) | define | opus | ok | `0 → 45` | commit e5e3d8cb: REQ-229 re-proposed (no `--subject`/`--subject-b`; the trace measures the checkout it runs from, refuses a dirty checkout, records its commit; two revisions compared offline by `eval:evidence-trace:compare -- <folder-a> <folder-b>`, each folder from its own worktree); REQ-228 and REQ-230 reworded (the checkout the run executes from / the changed revision), substance unchanged; all 11 `- Verdict:`/`- Reason:` lines untouched (diff grep count 0), one `Re-proposed 2026-10-07` line under each of the three blocks; brief §4.4–4.6, Phase 0 step 2, §12 parity rewritten, assumption A24 added (evidence: the owner's REQ-226 verdict); genuine blocker none; marker `STATUS.refined`; `git diff --stat HEAD~1 -- PRD/sections apps scripts` empty. Driver judgment: the moved diffs are consequences of the owner's own REQ-226 rule (blocker test condition 2 fails — an authoritative basis exists), so no fresh verdict park; the owner reads the finalized proposal in the code PR before `land` | 2026-10-07 |
| 4 (attempt 3) | gate-qc | sonnet | ok (PASS) | `0 → 16` | commit d075389f: `QUALITY-CHECK.md` — Verdict: PASS, findings none; both attempt-2 findings closed (REQ-229 traces its own checkout and compares two trace folders; no undefined term left — remaining hits are quoted history); 11/11 blocks well-formed, verdict lines untouched; marker `STATUS.refined`; driver rewrote README `## Preparation gate` to PASS / findings none → advance to `plan` | 2026-10-07 |
| 5 | plan | sonnet | ok | `0 → 16` | commit 94ade4d2: `GAMEPLAN.md` + 7 slice docs (A experiment runs/identity record; B checkpoint/resume/cap; C grader repair + runtime parity; D offline evidence trace; E diagnostic arms + manifests; F paired compare report; G Phase 0 offline run, `docs/eval/answer-quality-investigation/{OFFLINE-FINDINGS,RUNBOOK}.md`, PRD apply, Ship gates) + 7 `slice-*.criteria.json` (63 criteria, all `false`, 1 manual: G13 no-live-spend observation); slice G applies the proposal; build order A→G (A/B/C/F share `scripts/eval-answer-quality.mjs`); README slice table, `STATUS.active`, board row active; driver checked every criteria file parses with all values `false` and no deliverable path lies inside `PRD/work/` | 2026-10-07 |

## Open gate

- RESOLVED 2026-10-07: 11 verdicts applied (9 accept, 2 edit, 0 reject) by `gate-review`; brief reconciled; package restored to `refined`, resumes at `gate-qc`.
- Was: parked at `owner-action` after `gate-qc` PASS (first attempt, no loops); the owner answered the eleven slots in `PRD/work/answer-quality-investigation/GATE-QUESTIONS.md` and merged the docs PR.
- Evidence: `PRD/work/answer-quality-investigation/QUALITY-CHECK.md` (PASS, findings none).
- Docs PR: https://github.com/ChrisMiho/TheJudge/pull/274 (merged)

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-226` | edit | "Drop the cross-checkout `--subject` import: the run records the commit it executes from, and two revisions are compared by running the tooling from each revision's own worktree with the tooling commits applied on top. Add a regrade mode: a run may take its answers from an earlier run's stored transcripts and only grade them under the current judge and rubric, so earlier answers stay comparable after a grader or rubric change and progress can be tracked run over run." |
| `REQ-227` | accept | — |
| `REQ-228` | accept | — |
| `REQ-229` | accept | — |
| `REQ-230` | accept | — |
| `REQ-185` | accept | — |
| `REQ-186` | accept | — |
| `REQ-187` | accept | — |
| `REQ-188` | edit | "Keep the combo-catalog parity (the evaluation prompt must be byte-identical to the one production builds), the experiment-mode selection, reasoning-token recording, and unpriced reporting. Drop the production timeout/retry criterion: evaluation answer calls keep the SDK defaults, and runtime suitability is read from the recorded latency and REQ-228's slower-than-15-seconds count instead." |
| `REQ-189` | accept | — |
| `NFR-018` | accept | — |

### Brief reconciliation

- grep: `grep -nEi 'subject|harness|checkout|older revision|--expect-commit' DESIGN-BRIEF.md README.md` and `grep -nEi 'timeout|retries|retry|15,000|15 seconds|answer-timeout' DESIGN-BRIEF.md README.md`, re-run after the rewrite; remaining hits are measured findings (rows describing today's code), text of accepted IDs (REQ-228/229/230), or the 15-second latency reading, none stating a superseded behaviour
- `DESIGN-BRIEF.md` §2 scope bullet 1 (experiment runs) — said the run measures an older checkout → now says the identity record includes the commit run from, plus a regrade mode (REQ-226 edit)
- `DESIGN-BRIEF.md` §2 scope (grader repair and runtime parity) — said answer calls use production's timeout and retries → now says answer calls keep the SDK defaults (REQ-188 edit)
- `DESIGN-BRIEF.md` §4.1 — "Harness and subject" with `--subject` rewritten as "Measuring an older revision": no cross-checkout import, tooling run from each revision's own worktree with the tooling commits applied on top (REQ-226 edit)
- `DESIGN-BRIEF.md` §4.2 — identity record now holds the commit run from (not both commits); regrade run paragraph added (REQ-226 edit)
- `DESIGN-BRIEF.md` §4.8 — production timeout/retry bullet and `--answer-timeout-ms` replaced by SDK defaults with latency read from REQ-228's count (REQ-188 edit)
- `DESIGN-BRIEF.md` Phase 0 steps 1-3, Phases 2-3, §12 parity check — "subject checkouts" now "worktrees, tooling commits applied on top" (REQ-226 edit)
- `DESIGN-BRIEF.md` product-truth-changes list rows REQ-226 and REQ-188 — descriptions updated (regrade mode; timeout/retries removed)
- `DESIGN-BRIEF.md` A6 and A9 — assumption rows rewritten; evidence is now the owner's verdicts
- `README.md` pointer — no note: `intake/GRAPH-BRIEF.md` line 49 (isolated checkouts of the base and head) is consistent with the verdicts; no intake file states a superseded behaviour
- left for the re-grade: REQ-228/229/230 accepted text and brief §4.4–4.6 still use the word "subject" (and `--subject`/`--subject-b` on the evidence trace), defined by the dropped REQ-226 import; not touched because those IDs were accepted

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
  - Next action: answer `PRD/work/answer-quality-investigation/GATE-QUESTIONS.md`, merge the docs PR; `graph-implement` builds it

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

### gate-qc

graph is controlling. You are node 4 (`gate-qc`) of graph run `graph-20261007-134015`, dispatched by the `graph-kickoff` driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-answer-quality-investigation

Every file you read, write, or commit lives under that working directory (a git worktree on branch `thejudge-auto/answer-quality-investigation`). Never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/...` directly — that is the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a subagent.

Invoke the `thejudge-quality-check` skill: read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/thejudge-quality-check/SKILL.md` in full and follow its `## Mode` section for `graph is controlling` (read `PRD/instructions/preparation-contract.md`; emit an explicit PASS or FAIL verdict; return every FAIL issue to the driver; never self-certify, never create map-out artifacts).

Package: `PRD/work/answer-quality-investigation/` (status `refined`). Grade `DESIGN-BRIEF.md` against PRD alignment and agent-readiness per the skill's checklist. When `GATE-QUESTIONS.md` exists, treat its proposed `REQ`/`FLOW` diffs as the brief's product-truth proposal (not yet applied to `PRD/sections/` — that is correct in this workflow; do not fail the brief for the live sections being unchanged). Check each proposed stable-ID block opens with the three plain-language lines (**What this decides** · **In plain terms** · **What happens if you say no**), carries a complete diff, and has `- Verdict:` / `- Reason:` slots. Intake under `intake/` is evidence, never authority; never open a document the intake cites.

Writes allowed: the quality-check report the skill produces inside the package folder, and on FAIL the marker change to `STATUS.refining` plus the `PRD/work/STATUS.md` board row. Never edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `PRD/sections/`, or code. Commit from inside the working directory with explicit paths only (`git add PRD/work/answer-quality-investigation PRD/work/STATUS.md` — never `git add -A`, `--all`, or `.`). Do not push.

Boundaries: no pushes, no PR actions, no `.secrets/`, no `thejudge-*` skill edits, no `rm -rf`, no `nohup`, no background `&`. If a hook denies a command, do not retry it — report it verbatim and stop.

Report back: the verdict (PASS or FAIL), the complete findings list (empty on PASS), the report file path, the commit hash, and the final marker.

### gate-review

graph is controlling. You are the gate-resolution node (`gate-review`) of graph run `graph-20261007-134015`, dispatched by the `graph-implement` driver after claiming the spec.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-answer-quality-investigation

Every file you read, write, or commit lives under that working directory (a git worktree on the shared build branch `thejudge-auto/answer-quality-investigation-work`, cut from `origin/main` after docs PR #274 merged). Never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/...` directly — that is the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a subagent (you should need none).

Invoke the `graph-gate-review` skill: read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/graph-gate-review/SKILL.md` in full and follow its `## Procedure` exactly. Also read `PRD/instructions/graph-workflow-contract.md` sections `## Propose / apply / close` and `## The two runs`, and `PRD/instructions/plain-language-standard.md`.

Package: `PRD/work/answer-quality-investigation/` (marker `STATUS.owner-action`, parked after gate-qc PASS; the owner answered all eleven verdict slots in `GATE-QUESTIONS.md` and merged the docs PR). Expected split from the driver's read: 9 accept, 2 edit (REQ-226 and NFR-018 carry `edit` with a `Reason:`), 0 reject — confirm by parsing the file yourself; the file is the only source of verdicts.

Apply every verdict inside that ID's proposed diff in `GATE-QUESTIONS.md` only — never in `PRD/sections/`. Then reconcile `DESIGN-BRIEF.md` (design sections, `## Assumptions` rows, the slice sketch, the product-truth-changes list) and, if a verbatim `intake/` file still states a superseded behaviour, the package README's intake pointer with one supersession note, to each `edit`. Enumerate the passages by a grep you quote; re-run it and require zero hits before resolving. `intake/` is never edited. An `accept` touches nothing.

Writes: `GATE-QUESTIONS.md` (edit application only), `DESIGN-BRIEF.md` (reconciliation only), the package `README.md` (`status:` field, and the intake-pointer supersession note if needed), `GRAPH-RUN.md` (`## Gate verdicts` with its `### Brief reconciliation` list; `## Open gate` marked resolved with the date and verdict count — leave the rest of the ledger, including `## Node ledger` and `## Dispatch prompts`, untouched), the marker (`STATUS.owner-action` → `STATUS.refined`, exactly one marker), and the `PRD/work/STATUS.md` board row (restored to refined / ready for gate-qc re-grade). Commit from inside the working directory with explicit paths only (`git add PRD/work/answer-quality-investigation PRD/work/STATUS.md` — never `git add -A`, `--all`, or `.`). Do not push.

Boundaries: never edit `PRD/sections/` or any code, never dispatch a subagent or run a `thejudge-*` skill, never write `GAMEPLAN.md` or `slice-*.md`, no pushes, no PR actions, no `.secrets/`, no `thejudge-*` skill edits, no `rm -rf`, no `nohup`, no background `&`. If a hook denies a command, do not retry it — report it verbatim and stop. If any `Verdict:` slot is blank or malformed, refuse and name every offending ID.

Report back, in plain language with the ask first and the substance of each ID inlined: the verdict counts, each `edit` with the owner's reason quoted and the exact passages rewritten in `GATE-QUESTIONS.md` and `DESIGN-BRIEF.md` (the grep you used), the README note or `none`, the commit hash, and the final marker.

### gate-qc (attempt 2)

graph is controlling. You are node 4 (`gate-qc`, attempt 2 — the re-grade after the owner's verdicts) of graph run `graph-20261007-134015`, dispatched by the `graph-implement` driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-answer-quality-investigation

Every file you read, write, or commit lives under that working directory (a git worktree on the shared build branch `thejudge-auto/answer-quality-investigation-work`, cut from `origin/main`). Never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/...` directly — that is the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a subagent.

Invoke the `thejudge-quality-check` skill: read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/thejudge-quality-check/SKILL.md` in full and follow its `## Mode` section for `graph is controlling` (read `PRD/instructions/preparation-contract.md`; emit an explicit PASS or FAIL verdict; return every FAIL issue to the driver; never self-certify, never create map-out artifacts).

Package: `PRD/work/answer-quality-investigation/` (status `refined`). This is a re-grade: the first grade PASSed (`QUALITY-CHECK.md`, commit 05ecc20b), the owner then answered the eleven verdict slots in `GATE-QUESTIONS.md` (9 accept, 2 edit — REQ-226 and REQ-188; the owner's reasons are quoted in `GRAPH-RUN.md` `## Gate verdicts`), and `graph-gate-review` applied the edits inside the proposal and reconciled `DESIGN-BRIEF.md` to them (commit 75b85c00, `### Brief reconciliation` lists every rewritten passage). Grade `DESIGN-BRIEF.md` against PRD alignment and agent-readiness per the skill's checklist, and check the package is one consistent whole after the verdicts: the brief, the finalized proposal, and the accepted IDs must not contradict each other or the owner's two edits. Treat the `GATE-QUESTIONS.md` diffs as the brief's product-truth proposal (not yet applied to `PRD/sections/` — correct in this workflow; do not fail the brief for the live sections being unchanged). Check each proposed stable-ID block opens with the three plain-language lines (**What this decides** · **In plain terms** · **What happens if you say no**), carries a complete diff, and has a filled `- Verdict:` slot. Intake under `intake/` is evidence, never authority; never open a document the intake cites.

Writes allowed: overwrite `PRD/work/answer-quality-investigation/QUALITY-CHECK.md` with this attempt's report, and on FAIL the marker change to `STATUS.refining` plus the `PRD/work/STATUS.md` board row. Never edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `GRAPH-RUN.md`, `PRD/sections/`, or code. Commit from inside the working directory with explicit paths only (`git add PRD/work/answer-quality-investigation PRD/work/STATUS.md` — never `git add -A`, `--all`, or `.`). Do not push.

Boundaries: no pushes, no PR actions, no `.secrets/`, no `thejudge-*` skill edits, no `rm -rf`, no `nohup`, no background `&`. If a hook denies a command, do not retry it — report it verbatim and stop.

Report back: the verdict (PASS or FAIL), the complete findings list (empty on PASS), the report file path, the commit hash, and the final marker.

### define (attempt 2)

graph is controlling. You are node 3 (`define`, attempt 2 — a bounded correction loop after a gate-qc FAIL) of graph run `graph-20261007-134015`, dispatched by the `graph-implement` driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-answer-quality-investigation

Every file you read, write, or commit lives under that working directory (a git worktree on the shared build branch `thejudge-auto/answer-quality-investigation-work`, cut from `origin/main`). Never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/...` directly — that is the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a subagent.

Invoke the `thejudge-refinement` skill: read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/thejudge-refinement/SKILL.md` in full and follow its `## Mode` section for `graph is controlling` (read `PRD/instructions/preparation-contract.md`; apply its conservative assumption ladder and three-condition genuine-blocker test per question; record every material assumption and its evidence in `DESIGN-BRIEF.md`). Also read `PRD/instructions/graph-workflow-contract.md` sections `## Propose / apply / close` and `## The two runs`, and `PRD/instructions/plain-language-standard.md`.

Package: `PRD/work/answer-quality-investigation/` (status `refining`). This is a correction pass, not a fresh refinement. Read in this order: `QUALITY-CHECK.md` (the FAIL, two findings, and the required correction), `GRAPH-RUN.md` `## Gate verdicts` and `### Brief reconciliation` (the owner's eleven verdicts; the REQ-226 and REQ-188 edits with the owner's reasons quoted), then `GATE-QUESTIONS.md` and `DESIGN-BRIEF.md`.

The owner's REQ-226 edit verdict is the authority for this pass. Its rule: no cross-checkout code import; a run records the commit it executes from; two revisions are compared by running the tooling from each revision's own worktree with the tooling commits applied on top. The FAIL is that this rule was carried into REQ-226 and the brief's §4.1/§4.2/A6 but not into the accepted REQ-229 (evidence-trace compare still defines `--subject <path>` / `--subject-b <path>`, prepares each case with the subject's unmodified `preparePromptInput`, and compares the two subjects' prompts) nor into the word subject as used in REQ-228 and REQ-230, nor brief §4.4–4.6, Phase 0 step 2, and the parity test.

Do exactly this:

1. In `GATE-QUESTIONS.md`, inside the REQ-229 block's proposed diff: drop `--subject` and `--subject-b`; the trace command measures the checkout it runs from (same dirty-checkout refusal and commit record as REQ-226); two revisions are compared by diffing two trace output folders, each produced from its own worktree (name the compare form, e.g. a `--compare <run-folder-a> <run-folder-b>` step or the equivalent, chosen by the ladder from existing script patterns). Inside the REQ-228 and REQ-230 blocks: reword every "subject" to the checkout the command runs from (or the revision, where that is the meaning), with no change of substance. Update each touched block's plain-language lines if they repeat the dropped wording. Leave the eleven `- Verdict:` / `- Reason:` lines exactly as the owner wrote them — never fill, change, or blank a verdict — and add, directly under the Verdict/Reason lines of each block you touched, one line `- Re-proposed 2026-10-07 (gate-qc loop 1): <what changed>, derived from the owner's REQ-226 edit verdict` so the owner's record shows the diff moved after their accept and why. Touch no other block.
2. In `DESIGN-BRIEF.md`: rewrite §4.4–4.6, Phase 0 step 2, the §12 parity check, and any other passage a grep for `subject|--subject-b|--subject` (quote the grep) still finds stating the dropped behaviour, to the same rule; add or amend an `## Assumptions` row recording that the REQ-228/229/230 correction is derived from the owner's REQ-226 verdict (evidence: the verdict quoted in `GRAPH-RUN.md`). Re-run the grep and report the remaining hits with one line each on why each stays (measured findings about today's code may stay). Add no new design.
3. Apply the genuine-blocker test to the correction. If any part of it would decide product behaviour the REQ-226 verdict does not already settle, do not guess: say so in your report with the Q-### question, leave that block as it was, and stop short of resolving it. The driver parks for the owner in that case.
4. Set the marker to `STATUS.refined` (remove `STATUS.refining`; exactly one marker), set the README `status:` field to `refined`, and update the `PRD/work/STATUS.md` board row.
5. Commit from inside the working directory with explicit paths only (`git add PRD/work/answer-quality-investigation PRD/work/STATUS.md` — never `git add -A`, `--all`, or `.`). Do not push.

Hard rules: never edit `PRD/sections/` or any code; never add a `DEC-###`; never allocate a new stable ID (REQ-220/221 stay reserved by draft PR #266; REQ-226–230 are already proposed); never edit `intake/`, `QUALITY-CHECK.md`, or the `## Node ledger` / `## Dispatch prompts` / `## Gate verdicts` sections of `GRAPH-RUN.md`. Boundaries: no pushes, no PR actions, no `.secrets/`, no `thejudge-*` skill edits, no `rm -rf`, no `nohup`, no background `&`, no `npm run data:refresh`, no live OpenAI calls. If a hook denies a command, do not retry it — report it verbatim and stop.

Report back, plain language, ask first: the blocks you re-proposed and what each now says (one line each, substance inlined), the brief passages rewritten (the grep you used, before → after), the assumption row added, any genuine blocker (or `none`), the commit hash, and the final marker.

### gate-qc (attempt 3)

graph is controlling. You are node 4 (`gate-qc`, attempt 3 — the re-grade after define attempt 2's correction) of graph run `graph-20261007-134015`, dispatched by the `graph-implement` driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-answer-quality-investigation

Every file you read, write, or commit lives under that working directory (a git worktree on the shared build branch `thejudge-auto/answer-quality-investigation-work`, cut from `origin/main`). Never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/...` directly — that is the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a subagent.

Invoke the `thejudge-quality-check` skill: read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/thejudge-quality-check/SKILL.md` in full and follow its `## Mode` section for `graph is controlling` (read `PRD/instructions/preparation-contract.md`; emit an explicit PASS or FAIL verdict; return every FAIL issue to the driver; never self-certify, never create map-out artifacts).

Package: `PRD/work/answer-quality-investigation/` (status `refined`). History: attempt 1 PASSed; the owner answered the eleven slots (9 accept, 2 edit: REQ-226, REQ-188); `graph-gate-review` applied them (commit 75b85c00); attempt 2 FAILed on two findings (accepted REQ-229 still carried the `--subject`/`--subject-b` cross-checkout import the owner's REQ-226 edit dropped; the word subject was left undefined in REQ-228/229/230 and brief §4.4–4.6); define attempt 2 (commit e5e3d8cb) re-proposed REQ-229 and reworded REQ-228/REQ-230 to the REQ-226 rule, left every `- Verdict:`/`- Reason:` line as the owner wrote it, added a `Re-proposed 2026-10-07` line under each of those three blocks, rewrote brief §4.4–4.6, Phase 0 step 2 and §12, and added assumption A24. The driver has recorded its judgment that the moved diffs are consequences of the owner's own REQ-226 verdict and need no fresh owner verdict before `plan` (`GRAPH-RUN.md` `## Node ledger`, define attempt 2 row); grade the package on its consistency and agent-readiness, not on whether the owner has re-answered.

Grade `DESIGN-BRIEF.md` against PRD alignment and agent-readiness per the skill's checklist, and check the package is one consistent whole: the brief, the finalized proposal, and every accepted or edited ID must agree with each other and with the owner's two edits; the two attempt-2 findings must be closed. Treat the `GATE-QUESTIONS.md` diffs as the brief's product-truth proposal (not yet applied to `PRD/sections/` — correct in this workflow; do not fail the brief for the live sections being unchanged). Check each proposed stable-ID block opens with the three plain-language lines (**What this decides** · **In plain terms** · **What happens if you say no**), carries a complete diff, and has a filled `- Verdict:` slot. Intake under `intake/` is evidence, never authority; never open a document the intake cites.

Writes allowed: overwrite `PRD/work/answer-quality-investigation/QUALITY-CHECK.md` with this attempt's report, and on FAIL the marker change to `STATUS.refining` plus the `PRD/work/STATUS.md` board row. Never edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `GRAPH-RUN.md`, `README.md`, `PRD/sections/`, or code. Commit from inside the working directory with explicit paths only (`git add PRD/work/answer-quality-investigation PRD/work/STATUS.md` — never `git add -A`, `--all`, or `.`). Do not push.

Boundaries: no pushes, no PR actions, no `.secrets/`, no `thejudge-*` skill edits, no `rm -rf`, no `nohup`, no background `&`. If a hook denies a command, do not retry it — report it verbatim and stop.

Report back: the verdict (PASS or FAIL), the complete findings list (empty on PASS), the report file path, the commit hash, and the final marker.

### plan

graph is controlling. You are node 5 (`plan`) of graph run `graph-20261007-134015`, dispatched by the `graph-implement` driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-answer-quality-investigation

Every file you read, write, or commit lives under that working directory (a git worktree on the shared build branch `thejudge-auto/answer-quality-investigation-work`, cut from `origin/main`). Never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/...` directly — that is the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a subagent.

Invoke the `thejudge-map-out` skill: read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/thejudge-map-out/SKILL.md` and its `reference.md` in full (the slice template, the `.criteria.json` schema with its worked example, and the Ship gates block) and follow its `## Mode` section for `graph is controlling` (read `PRD/instructions/preparation-contract.md`; require `Quality-check: PASS` in the package README's `## Preparation gate` — it is recorded there from gate-qc attempt 3, commit d075389f — and never self-certify one). Also read `PRD/instructions/graph-workflow-contract.md` sections `## Propose / apply / close` and `## Acceptance criteria are earned, not written`.

Package: `PRD/work/answer-quality-investigation/` (status `refined`). Reads: `DESIGN-BRIEF.md` (the design, decision points, assumptions A1–A24, the slice sketch), `GATE-QUESTIONS.md` (the finalized product-truth proposal: new REQ-226–230, amended REQ-185–189 and NFR-018, all verdicts applied — 9 accept, 2 edit; three blocks carry a `Re-proposed 2026-10-07` line), `README.md`, `QUALITY-CHECK.md`, the `PRD/sections/` entries the brief cites, and the existing evaluator code the brief names (`scripts/eval-answer-quality.mjs`, `scripts/lib/prompt-fidelity.mjs`, `apps/backend/src/eval/`). Intake under `intake/` is evidence, never authority; never open a document the intake cites.

Write `GAMEPLAN.md`, one `slice-<letter>-*.md` per slice with its `slice-<letter>.criteria.json` emitted beside it (every criterion initialised `false`, each with an `evidence` block naming the command pattern or file paths that prove it, `"manual": true` only where no command can), the README slice table and implementation map with `status: active`, the `STATUS.active` marker (remove `STATUS.refined`; exactly one marker), and the board row under `## active` in `PRD/work/STATUS.md`.

Planning constraints from the brief and the contract:

- Exactly one slice applies the finalized proposal to `PRD/sections/` by intent (the GAMEPLAN names which); the build node writes that truth together with the code that realizes it, and a `reject`ed id would stay burned (none here).
- The build runs unattended with no live OpenAI spend: every slice's verification must be offline and free (mock provider, stored transcripts, fixtures, the offline evidence trace, unit tests). The brief's Phase 0 offline run is in scope at build; the paid Phases 1–5 are an owner-run runbook the slices document, never execute. No `npm run data:refresh`, no Scryfall fetch.
- Every acceptance criterion is verifiable by a named command or file path; a dev server or browser is not expected for this tooling package — if a slice needs one, encode the `runtime-process-hygiene.md` cleanup evidence criterion.
- Keep slices sequential only where a stated dependency forces it; the final slice carries the PRD promotion checklist and the Ship gates block.
- Never write product code or `PRD/sections/` edits from this node; never add a `DEC-###`; never allocate a stable ID beyond those the proposal already names.

Commit from inside the working directory with explicit paths only (`git add PRD/work/answer-quality-investigation PRD/work/STATUS.md` — never `git add -A`, `--all`, or `.`). Do not push. Boundaries: no pushes, no PR actions, no `.secrets/`, no `thejudge-*` skill edits, no `rm -rf`, no `nohup`, no background `&`. If a hook denies a command, do not retry it — report it verbatim and stop.

Report back: the slice list (letter, title, one-line goal, dependencies), which slice applies the proposal, the criteria count per slice and how many are `manual`, every verification command the slices name, the commit hash, and the final marker.

### build

graph is controlling. You are node 6 (`build`) of graph run `graph-20261007-134015`, dispatched by the `graph-implement` driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-answer-quality-investigation

Every file you read, write, or commit lives under that working directory — a git worktree already checked out on the shared build branch `thejudge-auto/answer-quality-investigation-work` (cut from `origin/main`, pushed; the package README's `## Autonomous metadata` records `origin/main` as the autonomous base, so the code PR targets `main`). Work in place there: no second worktree, no contributor branch. Never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/...`, `/Users/chrismiho/Coding/Projects/TheJudge/apps/...`, or any other path in the owner's launch checkout; the work package lives inside the worktree, so a bare `PRD/work/answer-quality-investigation/...` path resolved against the launch root is out of scope. Copy the `Working directory:` line above, unchanged, into every prompt you write for a subagent (the default is no implementation subagents).

Invoke the `thejudge-implement-all` skill: read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/thejudge-implement-all/SKILL.md` and its `reference.md` in full and follow the `## Mode` section for `graph is controlling` (read `PRD/instructions/graph-workflow-contract.md`, take the autonomous base from the README, treat every stop as a park reported back — never a question). Shared branch, named explicitly as the skill requires: `thejudge-auto/answer-quality-investigation-work`; confirm it equals `git branch --show-current` in the working directory before anything else.

Package: `PRD/work/answer-quality-investigation/` (status `active`, commit 94ade4d2 pushed at the remote tip). Read `README.md`, `GAMEPLAN.md`, every `slice-*.md` with its `slice-<letter>.criteria.json`, `DESIGN-BRIEF.md`, and `GATE-QUESTIONS.md` — the finalized proposal: new REQ-226–230, amended REQ-185–189 and NFR-018, 9 accept and 2 edit (REQ-226: no cross-checkout import, the run records the commit it executes from, regrade mode; REQ-188: combo-catalog parity kept, production timeout/retry criterion dropped), plus `Re-proposed 2026-10-07` lines under REQ-228/229/230 that follow the REQ-226 rule. Build every slice in GAMEPLAN order (A → G) in one unattended pass, one milestone commit per slice (`feat(answer-quality-investigation): complete slice <letter>`), fetch/rebase onto `origin/thejudge-auto/answer-quality-investigation-work` and push without force after each.

Applying product truth: slice G applies the proposal to `PRD/sections/` **by intent** — re-derive each edit from the finalized `GATE-QUESTIONS.md` diff and `DESIGN-BRIEF.md` against the current `PRD/sections/` text, never a blind replay; honour both owner edits and the three re-proposed blocks; apply it exactly once, together with slice G's code; never add a `DEC-###`; never allocate an ID beyond REQ-230 (REQ-220/221 stay reserved by draft PR #266).

Hard constraints for this package:

- No live OpenAI spend of any kind. Before running any `eval:*` command, confirm from the code that the invocation builds no real client (fake client, `--dry-run`, stored transcripts, fixtures). `scripts/eval-answer-quality.mjs` has been observed to auto-load an API key from `.secrets/` on a dry run even when the env var is empty — treat any path that could reach that loader as a live-call risk; cover it with unit tests and fake clients instead, and never read, list, or reference `.secrets/`. No `npm run data:refresh`, no Scryfall or other network fetch.
- Acceptance criteria: mark a criterion `true` only after you have issued its evidence command or written its evidence path in this node; read the emitted `slice-<letter>.criteria.json` files to confirm every value before reporting a slice `done`. Edit those JSON files with the Edit or Write tool, not `sed -i` or a heredoc. The hook earns no evidence for this run (its criteria root is the launch checkout; a known gap recorded in the ledger), so your report must list, per slice, each criterion id and the exact command or path that satisfied it — the reviewer re-runs them.
- Run the slice's named verification and `npm run quality:check` with the worktree matching the index before and after, per the skill. Report any failure verbatim; never skip or weaken a test to pass.
- Open the code PR after the first push: `gh pr create --base main --head thejudge-auto/answer-quality-investigation-work` with the title and plain-language body from `reference.md` (ask first, substance of every cited ID inlined). Register the package and keep the `[THEJUDGE-AUTO]` title state current. Never merge or close the PR. When every slice is `done`, set `status: ship-ready`, the `STATUS.ship-ready` marker (exactly one), and the board row, then run the race-safe READY loop.
- Writes only inside the working directory. Commit with explicit paths (`git add <path> ...` — never `git add -A`, `--all`, or `.`). Boundaries: no force-push, no pushes to `main`, no PR merge/close, no `.secrets/`, no `thejudge-*` skill edits, no `.claude/settings*`, no `CLAUDE.md`, no `rm -rf`, no `nohup`, no background `&`, no stash drop/pop. If a hook denies a command, do not retry it — report it verbatim and stop; a slice you cannot finish stays `blocked` with its evidence and ends the node `failed`.

Report back, plain language, ask first: the PR URL; each slice's final status with its milestone commit; per slice, every criterion id with the command or path that satisfied it and whether every value in its criteria file is `true`; the verification commands run with pass/fail; the `PRD/sections/` entries written by slice G; the complete list of paths written, relative to the working directory; the final marker; and any park or blocker with evidence.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Prepare reproducible before/after answer evaluation for PR #273, isolate retrieval and prompt-organization failures, and compare GPT-4.1 with GPT-6 Luna before selecting a product fix" | answered-once | shape | — |
