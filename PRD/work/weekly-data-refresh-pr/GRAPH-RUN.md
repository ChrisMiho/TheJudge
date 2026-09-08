# Graph run — weekly-data-refresh-pr

- Run ID: `graph-20260907-163826`
- Profile: `loaded (env sentinel)` (reported by node 1)
- Canary: `denied — hook live (rm -rf, universal tier; nohup, graph tier)`
- Autonomous base: `origin/main` (build half's claim, run `graph-20260908-013519`; was `origin/thejudge-auto/weekly-data-refresh-pr`)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-weekly-data-refresh-pr`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20260907-163826/`
- Current node: `close` (build half, run `graph-20260908-013519`; review APPROVEd — cleanup writes the receipt and deletes the package on the branch, before the owner's merge)
- Next action: `/graph-implement PRD/work/weekly-data-refresh-pr/` — close, then ends COMPLETE with code PR #213 open for the owner to merge (land)

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | degraded (no run state) | branch `thejudge-auto/weekly-data-refresh-pr` cut from `origin/main` (b20ea13), pushed from `.worktrees/kickoff-weekly-data-refresh-pr`; lock held (runId graph-20260907-163826, pid 10773); launch checkout untouched | 2026-09-07 |
| 2 | shape | sonnet | ok | degraded (no run state) | `PRD/work/weekly-data-refresh-pr/` created (STATUS.ideation) with IDEA.md, intake/GRAPH-BRIEF.md verbatim, 3 prior-run matches; committed 0b59ec5 and pushed; launch checkout untouched | 2026-09-07 |
| 3 | define | opus | ok | `0 → 31` | DESIGN-BRIEF.md + GATE-QUESTIONS.md written (1 proposed id REQ-195; full-refresh chosen via assumption ladder, flip-to-prices-only left as owner edit); STATUS.refined; PRD/sections untouched; no blocker | 2026-09-07 |
| 4 | gate-qc | sonnet | ok | `0 → 19` | PASS — DESIGN-BRIEF verified against PRD truth (DEC-087/088/162, REQ-066/093/145, NFR-013) and all four proposed diffs matched current-state byte-for-byte; no drift; STATUS stays refined for build | 2026-09-07 |
| GR | gate-review (build half, run graph-20260908-013519) | sonnet | ok | `0 → 14` | REQ-195 accept applied (accept changes no diff); `## Gate verdicts` (1 id, 0 blockers) and resolved `## Open gate` (dated 2026-09-08, docs PR #209 merged) written; STATUS.refined restored (marker, README, PRD/work/STATUS.md board row) | 2026-09-08 |
| 4B | gate-qc (build half, run graph-20260908-013519) | sonnet | ok (PASS) | `0 → 16` | re-grade of the gate-finalized proposal, no fan-out (14 calls). REQ-195's three proposed diffs match current PRD/sections byte-for-byte (trade-balancer/data/cardPrintingPrices.md, trade-balancer/README.md, system-map.md); functional-requirements append target after REQ-194 exists, REQ-195 not already defined; cited ids (DEC-087/088/162, REQ-066/093/145, NFR-013) all match; `data:refresh`→`data:build` pipeline + build-card-prices.mjs real; new script/npm name not yet present; buildable without a live user. Findings none. STATUS unchanged (refined) | 2026-09-08 |
| 5 | plan (build half, run graph-20260908-013519) | sonnet | ok | `0 → 39` | thejudge-map-out wrote GAMEPLAN.md + 4 slice docs (A refresh-and-PR script core; B change-detection/no-op path; C npm `data:refresh-pr` wiring; D promote REQ-195 to PRD/sections with the code) with slice-{a,b,c,d}.criteria.json (9/5/2/5 = 21 criteria, valid JSON). Verification uses injected git/gh/pipeline fakes — no slice runs the real Scryfall refresh (REQ-093/DEC-162, denied under the graph lock). STATUS.active; README slice table + implementation map; board row moved to active | 2026-09-08 |
| 6 | build (build half, run graph-20260908-013519) | sonnet | ok | `0 → 122` | thejudge-implement-all built A→B→C→D, 21/21 criteria true. New `scripts/refresh-and-open-pr.mjs` (injectable-effects: dirty-tree refusal, branch off origin/main, pipeline runner, 11-path explicit artifact staging, dated commit, no-force push, gh pr create wrapper) + no-op/change-detection + graceful pipeline-fail; npm `data:refresh-pr` wired. Tests against injected fakes only: refresh-and-open-pr.test.mjs 19/19, quality:check 541/541 — never ran the live Scryfall refresh. REQ-195 applied to PRD/sections (functional-requirements append + trade-balancer/data/cardPrintingPrices.md + trade-balancer/README.md + system-map.md). Code PR #213 opened. STATUS.ship-ready. Return-side assertion: launch checkout byte-identical before/after, worktree clean/synced | 2026-09-08 |
| 7 | review (build half, run graph-20260908-013519) | opus | ok (APPROVE) | `0 → 17` | fresh-context no-write reviewer (Plan agent, no Edit/Write) graded PR #213 against each slice's acceptance criteria; 21/21 satisfied. Ran refresh-and-open-pr.test.mjs 19/19 over injected fakes (never the live pipeline/git/gh/Scryfall). Confirmed: no force-push, no merge into main (only gh pr create --base main), explicit-path `git add --` over the 11-path constant, no-op path opens no PR + deletes the local-only branch, pipeline failure degrades before any commit/push/PR; REQ-195 applied in all four PRD/sections locations. One Minor non-blocking note (`git checkout -` in deleteLocalBranch, outside stated requirements). Verdict: proceed to close | 2026-09-08 |

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-195` | accept | Full refresh — keep every corpus (prices, rulings, combos, rules) current on one weekly cadence with the least new code; runtime posture unchanged. When the first refresh runs, all extracts should come up to date together, not just prices. |

Blocker questions: none recorded — the full-vs-prices-only scope was resolved to
full refresh by the assumption ladder and surfaced in REQ-195 for confirmation,
not as a block.

## Open gate

- **Resolved 2026-09-08** — 1 stable id, 1 verdict (REQ-195 accept), 0 blocker
  questions. Docs PR #209 merged into `main` — the owner's build signal. The
  proposed diff in `GATE-QUESTIONS.md` stands unchanged (accept applies no
  edit). Status restored to `refined`; the resumed run re-enters at `gate-qc`.
- Prior park: parked at `owner-action` on gate-qc PASS (spec-forming half
  complete).
- Question that was answered: the `- Verdict:` slot for REQ-195 in
  `PRD/work/weekly-data-refresh-pr/GATE-QUESTIONS.md` (accept = full refresh as
  written; edit = flip to prices-only or amend; reject = drop the cadence), then
  merge the docs PR into `main`. That merge is the build signal.
- Evidence: gate-qc PASS (node 4); DESIGN-BRIEF.md + GATE-QUESTIONS.md published
  on `thejudge-auto/weekly-data-refresh-pr`; docs PR URL recorded below.
- Resume: `graph-implement` picks up the approved spec from `origin/main` and
  builds it (code PR into `main`), re-entering at `gate-qc`.
- Docs PR: https://github.com/ChrisMiho/TheJudge/pull/209 (docs-only, base `main`, head `thejudge-auto/weekly-data-refresh-pr`) — merged

## Dispatch prompts

### preflight

graph is controlling

You are node 1 (`preflight`) of an autonomous graph-kickoff run. Invoke the `/graph-preflight` skill and follow it exactly. Do not run any other lifecycle phase.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke: `/graph-preflight --branch thejudge-auto/weekly-data-refresh-pr --slug weekly-data-refresh-pr --run-id graph-20260907-163826`

Parameters: slug `weekly-data-refresh-pr`, branch `thejudge-auto/weekly-data-refresh-pr`, run id `graph-20260907-163826`. Take the concurrency lock, create the kickoff worktree cut from `origin/main` and push it, run the hook-liveness canary and treat the observed deny as proof the hook is live, read the profile env sentinel, refuse on stop sentinel or branch collision, and report worktree path, branch, canary reason, profile, and lock.

### shape

graph is controlling

You are node 2 (`shape`) of an autonomous graph-kickoff run. Invoke the `/thejudge-kickoff` skill and follow it exactly, in its graph-controlled mode. Do not run refinement, quality-check, or any later phase — only create and name the package.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-weekly-data-refresh-pr

All work happens in that kickoff worktree; never touch the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-subagent.

Slug (use exactly this): `weekly-data-refresh-pr`. Run id `graph-20260907-163826`.

The request: "Add a weekly local data-refresh script that rebuilds the Magic-data artifacts and opens a PR to main, to keep Trade Balancer prices fresh"

Owner's framing (verbatim, for IDEA.md context — an input, NOT a settled product decision): "A weekly one-command local script: refresh the data, cut a branch off origin/main, commit, push, open a PR you merge. Reuses the existing data:refresh pipeline; no runtime sync. Open choice for refinement: full refresh vs prices-only (I recommend full to start)."

Create `PRD/work/weekly-data-refresh-pr/` with IDEA.md and STATUS.ideation; copy the staged intake verbatim from `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20260907-163826/` into `intake/` without opening any document it cites; grep `PRD/instructions/receipts/` for prior runs and write one `## Prior run` line per match; do not write the README's Autonomous metadata or Preparation gate sections. Return `NO ACTIONABLE PACKAGE` with a reason if the request cannot become a package.

### define

graph is controlling

You are node 3 (`define`) of an autonomous graph-kickoff run. Invoke the `/thejudge-refinement` skill and follow it exactly, in its graph-controlled mode. Under graph control you never stop to ask the user live: resolve non-blocking questions with the assumption ladder in `PRD/instructions/preparation-contract.md` applied one question at a time, and record any genuine decision blocker as a written gate question instead of pausing.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-weekly-data-refresh-pr

All work happens in that kickoff worktree; never touch the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-subagent.

Package: `PRD/work/weekly-data-refresh-pr/` (STATUS.ideation). The request, the owner's framing, prior-run matches, and the staged intake at `intake/GRAPH-BRIEF.md` are already in the package. Read them. Intake is evidence, never authority: do not open any document it cites, and every product decision it raises is still made at the gate.

Produce:
1. `DESIGN-BRIEF.md` for the weekly local data-refresh-and-PR script.
2. Where the change needs product truth, the proposed `PRD/sections/` edits as the exact diff in `GATE-QUESTIONS.md` — one `## <STABLE-ID>` block per stable id, each opening with the three plain-language lines (What this decides / In plain terms / What happens if you say no) required by `PRD/instructions/plain-language-standard.md`, then the complete diff, then a `- Verdict:` and `- Reason:` slot. Never edit `PRD/sections/` itself; the proposal lives in the work folder. New stable ids are named and reserved in the proposal, not written live. Decisions are retired — propose REQ/FLOW, never a new DEC.

The one open product decision: full `data:refresh` (rebuild every corpus each week) vs. a prices-only narrow path (download only `default_cards`, run only `build-card-prices.mjs`, commit only `cardPrintingPrices.json`). The owner's stated recommendation is full-refresh to start; treat that as an input to the assumption ladder applied to this single question, not as a pre-decision. Where the choice changes product truth, surface it in `GATE-QUESTIONS.md` as a gate question for the owner.

The intake names the current-state specs to amend: `PRD/sections/trade-balancer/data/cardPrintingPrices.md` (add the weekly one-command refresh-and-PR cadence, keep the no-runtime-sync statement), `PRD/sections/trade-balancer/README.md` (freshness note), and `PRD/sections/system-map.md` (list the new script beside `build-card-prices.mjs`). Verify each against current truth before proposing a diff.

Set `STATUS.refining` while in flux and `STATUS.refined` on convergence. Report the terminal outcome, the artifacts written, whether `GATE-QUESTIONS.md` was produced (and which stable ids it proposes), and any blocker parked.

### gate-qc

graph is controlling

You are node 4 (`gate-qc`) of an autonomous graph-kickoff run. Invoke the `/thejudge-quality-check` skill and follow it exactly, in its graph-controlled mode. Produce a PASS or FAIL report only — never a GAMEPLAN or slice docs. On FAIL set `STATUS.refining`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-weekly-data-refresh-pr

All work happens in that kickoff worktree; never touch the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-subagent.

Validate `PRD/work/weekly-data-refresh-pr/DESIGN-BRIEF.md` for PRD alignment and agent-readiness. The proposed product truth is in `GATE-QUESTIONS.md` (one id, REQ-195); check the design brief and the proposal are internally consistent, that the proposed diffs match current-state truth in the named `PRD/sections/` files, and that the brief is buildable into slices without a live user. Report the PASS/FAIL verdict and the complete findings list.

### gate-review (build half, run graph-20260908-013519)

graph is controlling.

You are gate resolution for the build half of the graph run (run id graph-20260908-013519). The docs PR #209 has merged — the owner's build signal. Invoke the `graph-gate-review` skill and follow it exactly. It applies the owner's recorded accept/edit/reject verdict inside GATE-QUESTIONS.md, records `## Gate verdicts`, resolves the gate, and restores the lifecycle status. It never edits PRD/sections and never drives a node.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-weekly-data-refresh-pr

Package: PRD/work/weekly-data-refresh-pr/ (inside that worktree). Read GATE-QUESTIONS.md for the owner's answer and GRAPH-RUN.md `## Open gate` for the parked state.

The owner's recorded answer: the single stable-id block REQ-195 = accept (the weekly one-command full refresh that opens a PR); the Blocker questions section is None (the full-vs-prices-only scope was resolved to full refresh by the assumption ladder and surfaced in REQ-195 for confirmation). Apply the accept — no diff changes. Then write `## Gate verdicts`, mark `## Open gate` resolved with the date and verdict count, and restore STATUS.refined, the README status field, and the PRD/work/STATUS.md board row to the refined position so the resumed run enters at gate-qc.

Boundaries: never edit PRD/sections; never write DESIGN-BRIEF/GAMEPLAN/slice docs; never advance a node or dispatch a subagent; no merge/close/force-push, no git add -A. Committing is the driver's job.

Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-step.

### gate-qc (build half, run graph-20260908-013519)

graph is controlling.

You are node 4 (`gate-qc`) of the build half, re-grading the finalized proposal after the owner's verdict was applied (REQ-195 = accept, full refresh). Invoke `thejudge-quality-check` in graph-controlled (non-interactive) mode. Produce a PASS/FAIL report only — never a GAMEPLAN or slice docs.

HARD CONSTRAINTS (a prior graph gate-qc attempt self-DoS'd by fanning out): verify YOURSELF with Read/Grep/Bash; do NOT spawn any subagents, Agents, Tasks, or forks; no sleeping/polling; stay well under 60 tool calls.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-weekly-data-refresh-pr

Validate (inside that worktree) PRD/work/weekly-data-refresh-pr/DESIGN-BRIEF.md against PRD/work/weekly-data-refresh-pr/GATE-QUESTIONS.md (one id, REQ-195 accepted) for PRD alignment and agent-readiness. This design is a weekly one-command local script that reuses the existing `data:refresh` → `data:build` full-refresh pipeline (no runtime sync), cuts a branch off origin/main, commits the rebuilt data artifacts, pushes, and opens a PR the owner merges. The proposal was quality-checked to PASS in the kickoff half (ledger row 4) and the verdict is accept, so nothing changed at gate-review; confirm that still holds. Check the proposed diff for REQ-195 matches current-state truth in the named PRD/sections files byte-for-byte (trade-balancer/data/cardPrintingPrices.md, trade-balancer/README.md, system-map.md), the design is internally consistent with the existing pipeline (data:refresh/data:build, build-card-prices.mjs), and the brief is buildable into slices without a live user. PRD/sections is intentionally untouched (applied at build) — do not fail the brief for that.

On FAIL set STATUS.refining and list the complete findings (the run loops back to define). On PASS report PASS with findings none and do not advance yourself — the driver continues to plan.

Boundaries: no PRD/sections edit, no profile/CLAUDE.md/thejudge-skill edit, no merge/close/force-push, no git add -A, no spawning any agent. Leave committing to the driver.

Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-step.

### plan (build half, run graph-20260908-013519)

graph is controlling.

You are node 5 (`plan`) of the build half. Invoke `thejudge-map-out` and follow it exactly, in graph-controlled (non-interactive) mode. Produce GAMEPLAN.md and lettered slice docs with one `slice-<letter>.criteria.json` beside each, and set STATUS.active. Do NOT write code or edit PRD/sections; that is the build node's job.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-weekly-data-refresh-pr

Read first (inside that worktree): PRD/work/weekly-data-refresh-pr/DESIGN-BRIEF.md, PRD/work/weekly-data-refresh-pr/GATE-QUESTIONS.md (the finalized proposal — REQ-195 accepted), and PRD/work/weekly-data-refresh-pr/README.md `## Preparation gate` (must read Quality-check: PASS — it does; do not self-certify one). This is a weekly one-command local script that reuses the existing `data:refresh` → `data:build` full-refresh pipeline (no runtime sync), cuts a branch off origin/main, commits the rebuilt data artifacts, pushes, and opens a PR the owner merges. New tooling: `scripts/refresh-and-open-pr.mjs` and an `npm run` entry (e.g. `data:refresh-pr`); neither exists yet.

Slice the work for sequential single-agent implementation. Each slice's acceptance criteria must be earnable by real evidence (a command pattern, file paths, or manual). Cover: the refresh-and-PR script itself (full pipeline, branch off origin/main, explicit-path commit of rebuilt data, push, `gh pr create`); the change-detection / no-op path (a run with no data change must not open an empty PR); the npm script wiring; and applying REQ-195 to PRD/sections at build (functional-requirements append after REQ-194, plus the trade-balancer/data/cardPrintingPrices.md, trade-balancer/README.md, and system-map.md diffs) together with the code. Respect the boundaries the script must honor even though it is graph-adjacent: no force-push, no merge into main, path-scoped `git add`.

Boundaries: no code, no PRD/sections edit at this node, no profile/CLAUDE.md/thejudge-skill edit, no merge/close/force-push, no git add -A, no spawning any agent. Leave committing to the driver.

Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-step.

### build (build half, run graph-20260908-013519)

graph is controlling.

You are node 6 (`build`) of the build half. Invoke `thejudge-implement-all` and follow it exactly, in graph-controlled (non-interactive) mode. Implement every remaining slice (A → B → C → D, in that safe order) end to end — code, tests, verification, per-slice status — earning each slice's acceptance criteria with real evidence. When the last slice is done, set STATUS.ship-ready. Open the code PR at the end.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-weekly-data-refresh-pr

Shared branch (work in place, do not create a second worktree or a contributor branch): thejudge-auto/weekly-data-refresh-pr-work. Its checked-out branch must match; the code PR is thejudge-auto/weekly-data-refresh-pr-work → main.

Read PRD/work/weekly-data-refresh-pr/GAMEPLAN.md and every slice-*.md + slice-*.criteria.json first. Design: a weekly one-command local script `scripts/refresh-and-open-pr.mjs` (npm `data:refresh-pr`) that runs the existing `data:refresh` → `data:build` full-refresh pipeline, cuts a branch off origin/main, commits the rebuilt data artifacts by explicit path, pushes, and opens a PR the owner merges; a no-op path opens no empty PR when nothing changed; graceful degradation on pipeline failure. Build with the injectable-effects pattern (like scripts/graph-preflight.mjs) so it is unit-tested against injected git/gh/pipeline fakes.

CRITICAL — never run the real data refresh: do NOT run `npm run data:refresh`, `npm run data:build`, `npm run data:refresh-pr`, or any Scryfall network refresh (REQ-093/DEC-162; also denied under the graph lock). Verify only via `node --test scripts/refresh-and-open-pr.test.mjs` over injected fakes, plus static checks (grep, `npm pkg get`, git diff). A criterion whose evidence is a command is earned when the command is issued — so issue the test command for real against the fakes; never the live pipeline.

APPLY PRODUCT TRUTH AT BUILD (slice D). Together with the code, write the real PRD/sections/ edit by intent for REQ-195: append `### REQ-195` after REQ-194 in functional-requirements.md and amend trade-balancer/data/cardPrintingPrices.md, trade-balancer/README.md, and system-map.md per the finalized GATE-QUESTIONS.md diff, re-derived against current truth. This is the one place durable PRD/sections truth is written.

Boundaries: no profile/CLAUDE.md/thejudge-skill edit, no merge/close/force-push, no remote-branch delete, no git add -A (stage explicit paths), no live Scryfall refresh. Commit on thejudge-auto/weekly-data-refresh-pr-work and push it; open the PR with `gh pr create --base main --head thejudge-auto/weekly-data-refresh-pr-work` (never merge it). All writes stay inside this worktree — never write into the launch checkout.

Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-step.

### review (build half, run graph-20260908-013519)

You are the independent reviewer (node 7) for the built package. Fresh context: you did not see the build. You hold no write tools — you read, search, and run read-only commands only, and never modify the work you grade. This is a review task: produce a verdict, not an implementation plan.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-weekly-data-refresh-pr

Grade the built diff on `thejudge-auto/weekly-data-refresh-pr-work` (code PR #213 → main) against each slice's OWN stated acceptance criteria — nothing else. Read `git diff origin/main...HEAD` (the full slice diff), GAMEPLAN.md, and each slice-{a,b,c,d}-*.md with its `## Acceptance criteria`, plus the matching slice-*.criteria.json. The design: a weekly one-command local script `scripts/refresh-and-open-pr.mjs` (npm `data:refresh-pr`) that runs the existing full-refresh pipeline, cuts a branch off origin/main, commits rebuilt data by explicit path, pushes, and opens a PR the owner merges; a no-op path opens no empty PR when nothing changed; graceful degradation on pipeline failure. Built with the injectable-effects pattern and unit-tested against injected git/gh/pipeline fakes.

CRITICAL: do NOT run the real refresh — no `npm run data:refresh`, `data:build`, or `data:refresh-pr`, no Scryfall network call. Verify only by reading the code and running the unit test over the injected fakes (node --test scripts/refresh-and-open-pr.test.mjs).

Rubric = the slices' acceptance criteria and correctness against them. Flag ONLY gaps that affect correctness or a stated requirement. A preference, a style note, or an improvement outside a slice's stated requirements is NEVER Critical or Important and never loops the run back to build — a manufactured finding spends a build loop the run cannot get back. Check especially: the script never force-pushes and never merges into main; staging is explicit-path (never add -A); the no-op path truly opens no PR when nothing changed; and REQ-195 was applied to PRD/sections (functional-requirements.md, trade-balancer/data/cardPrintingPrices.md, trade-balancer/README.md, system-map.md).

Report a verdict: APPROVE (proceed to close), or findings each rated Critical / Important / Minor with the exact file/line and the criterion or correctness issue it violates. Only Critical or Important loop back to build. A Critical finding the run cannot resolve parks immediately.

Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-step.

### close (build half, run graph-20260908-013519)

graph is controlling.

You are node 8 (`close`) of the build half. Invoke `thejudge-cleanup` and follow it exactly, in graph-controlled (non-interactive) mode, on the PR-ready path — this runs on the code branch `thejudge-auto/weekly-data-refresh-pr-work` BEFORE the owner's merge, so the receipt and the package deletion ride in code PR #213.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-weekly-data-refresh-pr

The package PRD/work/weekly-data-refresh-pr/ is STATUS.ship-ready: 4 slices built, 21/21 criteria true, independent review APPROVEd, code PR #213 (base main, head thejudge-auto/weekly-data-refresh-pr-work) open and mergeable.

Do:
- Verify slice completion and that durable PRD/sections truth was applied at build for REQ-195 (functional-requirements.md new REQ-195; trade-balancer/data/cardPrintingPrices.md; trade-balancer/README.md; system-map.md). It IS present (build applied it) — promote only any leftover, never re-write what is already there.
- Fold this run's `## Node ledger` and `## Instruction ledger` from GRAPH-RUN.md VERBATIM into a `## Graph run` section of the durable receipt at PRD/instructions/receipts/weekly-data-refresh-pr-<date>.md. Refuse the package delete if a ledger exists and that section does not.
- Write an `## Intake` section naming each staged intake file and its stated origin.
- Write the terminal-state summary line: `Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/213`, and a `- PR:` line with that URL.
- Delete PRD/work/weekly-data-refresh-pr/ and update PRD/work/STATUS.md (remove the ship-ready row).

Boundaries: no profile/CLAUDE.md/thejudge-skill edit, no merge/close/force-push (leave PR #213 open — the owner merges it), no remote-branch delete, no git add -A. Commit the receipt and the deletion on thejudge-auto/weekly-data-refresh-pr-work; leave the push to the driver, or push the branch (never main).

Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-step.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Add a weekly local data-refresh script that rebuilds the Magic-data artifacts and opens a PR to main, to keep Trade Balancer prices fresh | answered-once | shape | — |
| A weekly one-command local script: refresh the data, cut a branch off origin/main, commit, push, open a PR you merge. Reuses the existing data:refresh pipeline; no runtime sync. Open choice for refinement: full refresh vs prices-only (I recommend full to start). | answered-once | define | — |
