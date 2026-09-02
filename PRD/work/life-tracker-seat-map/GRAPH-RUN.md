# Graph run — life-tracker-seat-map

- Run ID: `graph-20260902-093611`
- Profile: `loaded (env sentinel)`
- Canary: `denied — hook live (universal: rm -rf denied) + graph tier armed (nohup denied while lock held)`
- Autonomous base: `origin/thejudge-auto/life-tracker-seat-map`
- Staging: `.worktrees/.graph-intake/graph-20260902-093611/` (copied verbatim into `PRD/work/life-tracker-seat-map/intake/`, then deleted at node 2 per kickoff's copy→commit→delete)
- Current node: `build` (implement-all) — slices A–D planned, `STATUS.active`; shared branch `thejudge-auto/life-tracker-seat-map-work`, PR base `main`
- Next action: `/graph-implement PRD/work/life-tracker-seat-map/` — build → review → land → close
- Docs PR: https://github.com/ChrisMiho/TheJudge/pull/180 (MERGED — the build signal)
- Terminal state (spec-forming half): `PARKED`; build half in progress since 2026-09-02
- Build-half resume canary: `graph tier armed — nohup denied while lock held`; universal `rm -rf` denied. Lock re-taken (run `graph-20260902-093611`).

Note on dispatch-prompt reproduction: prompts below are reproduced with their
words unchanged. Double-quote glyphs are reserved for the single ledgered user
instruction (the run request); two non-instruction phrases quoted in the node 2
prompt (a contract heading and an intake-brief section label) are rendered with
single-quote glyphs — a quote-glyph normalization only, no word altered — so the
Instruction-ledger match is unambiguous.

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `degraded (no run state)` | branch `thejudge-auto/life-tracker-seat-map` pushed to origin; base `origin/main`; stash `graph-preflight/graph-20260902-093611`; canaries denied (rm -rf universal; nohup graph-tier); Profile loaded (env sentinel) | 2026-09-02 |
| 2 | shape | sonnet | ok | `degraded (no run state)` | package `PRD/work/life-tracker-seat-map/` created (commit `21778e5`); `IDEA.md` + `STATUS.ideation` + `intake/` (GRAPH-BRIEF.md, PROBE.md, references/ 12 images) committed; 6 `## Prior run` receipt matches recorded | 2026-09-02 |
| 3 | define | opus | ok | `0 → 33` | `DESIGN-BRIEF.md` + `GATE-QUESTIONS.md` written; STATUS.refined; one new id REQ-173 with 3 complete diffs (functional-requirements.md, life-tracker/README.md, screen-layout.md); counter-panel orientation resolved via assumption ladder (top-down replica), no product fork surfaced; no `PRD/sections/` edits | 2026-09-02 |
| 4 | gate-qc | sonnet | ok | `0 → 24` | Quality-check PASS; checked `DESIGN-BRIEF.md`; findings none (one non-blocking citation nit); code claims verified against `PlayerLifeCard.tsx`/`CounterPanel.tsx`/`PlayerLifeTrackerApp.tsx`/`seatArrangement.ts`; REQ-173 diff placement + cited IDs confirmed. Run stops at PASS → owner-action | 2026-09-02 |
| — | gate-review | sonnet | ok | `3 → 22` | Build-half resume. Owner answered `GATE-QUESTIONS.md` `REQ-173: accept` + merged docs PR #180. `graph-gate-review` finalized the proposal (accept = diffs stand as authored), restored `STATUS.refined`, moved board row off `owner-action`; no `PRD/sections/` or code edits | 2026-09-02 |
| 4 | gate-qc | sonnet | ok | `2 → 28` | Attempt 2 (build-half re-grade after accept). Quality-check PASS; checked `DESIGN-BRIEF.md`; findings none; every code claim re-verified against `seatArrangement.ts`/`PlayerLifeCard.tsx`/`CounterPanel.tsx`; brief consistent with finalized REQ-173, within constraints (pure presentation, DEC-139 not reopened, DEC-136 preserved). `STATUS.refined` unchanged | 2026-09-02 |
| 5 | plan | sonnet | ok | `2 → 53` | `thejudge-map-out`: `GAMEPLAN.md` + 4 slice docs (A geometry helper `lib/lifeTracker/seatMap.ts` + `layout` prop threading; B `PlayerLifeCard` on-card seat map; C `CounterPanel` seat map; D live 7/8-player containment verification) + 4 `slice-*.criteria.json` (A–C command/path evidence, D six `manual` live-browser checks); `STATUS.active` set; board moved to `## active`; all writes inside `PRD/work/life-tracker-seat-map/` | 2026-09-02 |

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-173` | accept | — |

## Open gate

- **Resolved 2026-09-02.** Owner answered `PRD/work/life-tracker-seat-map/GATE-QUESTIONS.md`
  with `REQ-173: accept` (one verdict, three proposed diffs standing as authored)
  and merged the docs-only base→main PR. `graph-gate-review` applied the verdict
  (no change needed for `accept`), restored `STATUS.refined`, and updated the
  `PRD/work/STATUS.md` board row. Run resumes at `gate-qc`; the accepted diffs are
  applied to `PRD/sections/` by implementation at build.
- Docs PR: https://github.com/ChrisMiho/TheJudge/pull/180 (base→main, docs-only; MERGED)
- Stash handoff: node 1 stashed the launch checkout's uncommitted work (22 files).
  The stash is the owner's and is never dropped, popped, or reordered by the run.
  Restore it with:

  ```text
  git stash list | grep graph-preflight/graph-20260902-093611
  git stash apply stash@{0}
  ```

## Dispatch prompts

### preflight

```text
graph is controlling. You are node 1 (`preflight`) of an autonomous graph-kickoff run.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke the `graph-preflight` skill (via the Skill tool) and follow it exactly. Inputs:
- --branch thejudge-auto/life-tracker-seat-map
- --run-id graph-20260902-093611

Do this:
1. Run the dry-run: `npm run graph:preflight -- --branch thejudge-auto/life-tracker-seat-map --run-id graph-20260902-093611 --dry-run`. Report the classification, resolved base, planned commands, and the two `profile sentinel:` / `Profile:` lines verbatim.
2. Honor the stop-sentinel refusal, the concurrency lock, and the base→main guard exactly as the skill states. If any of them blocks (exit 2), relay the message verbatim and STOP.
3. If not blocked, re-run the identical command without --dry-run and the same --run-id to create and push the branch, take the lock, and resolve any dirty tree.
4. Issue the universal `CANARY_COMMAND` the script names as a real Bash tool call, require the hook to DENY it, and report its ledger line. Then issue `GRAPH_CANARY_COMMAND` after the lock is taken, require a DENY, and report that ledger line too. An allowed canary is BLOCKED — report verbatim and stop.
5. Confirm end state: `git status --porcelain` (empty) and `git branch --show-current` (thejudge-auto/life-tracker-seat-map).

Report back, verbatim where the skill asks for verbatim: the branch, the resolved autonomous base (origin/<branch>), the preflight classification, both canary ledger lines, the Profile line, and any stash reference + restore command. Do not create the work-package folder — that is node 2's job. Do not proceed past preflight.
```

### shape

```text
graph is controlling. You are node 2 (`shape`) of an autonomous graph-kickoff run. thejudge-kickoff is being dispatched under the graph driver — run non-interactively, ask no questions, make no product decisions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Slug (use exactly, do not rename): life-tracker-seat-map
Branch: thejudge-auto/life-tracker-seat-map

The request (verbatim): "Make the life-tracker commander-damage grid a per-seat map — 'me' at each player's own seat, opponents in their table directions on both the on-card preview and the counter panel, and fix map/name containment at 7–8 players"

Do this, in order:
1. Invoke the `thejudge-kickoff` skill (Skill tool) and follow it. Create the work package `PRD/work/life-tracker-seat-map/` with `IDEA.md` and `STATUS.ideation`. Use the slug `life-tracker-seat-map` verbatim — do NOT reuse the intake folder name `probe-life-tracker-seat-map`.
2. Copy the staged intake verbatim into the package: create `PRD/work/life-tracker-seat-map/intake/` and copy everything from `.worktrees/.graph-intake/graph-20260902-093611/` into it (the GRAPH-BRIEF.md, PROBE.md, and the whole references/ image folder). Stage those explicit paths — never `git add -A`.
3. Per the contract's 'Intake is evidence, never authority': treat the staged brief as a citation/evidence bundle. Record its findings and the four 'Decisions already made' it lists in IDEA.md as PROPOSED/claimed items to resolve at the define gate — NOT as settled truth. Do NOT open or fetch any document the brief itself cites beyond the staged files.
4. Grep `PRD/instructions/receipts/` for prior runs against the same ground (life-tracker, commander-damage, seat map, me cell). Write one `## Prior run` line per match into IDEA.md (flat list, no chain-walk).

Constraints:
- Do not edit `PRD/sections/`. Do not write outside `PRD/work/life-tracker-seat-map/`.
- If the request genuinely cannot be turned into an actionable package, return the exact string `NO ACTIONABLE PACKAGE` with the reason and stop.

Report back: the package path created, confirmation IDEA.md + STATUS.ideation + intake/ exist, the list of files copied into intake/, and any `## Prior run` receipt matches found (or none).
```

### define

```text
graph is controlling. You are node 3 (`define`) of an autonomous graph-kickoff run. thejudge-refinement is being dispatched under the graph driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

Run non-interactively: do not pause for the user. Resolve each assumption with the assumption ladder in `PRD/instructions/preparation-contract.md`, evaluated fresh per question. Surface every genuine product decision as a `GATE-QUESTIONS.md` block rather than deciding it — the owner answers those at the define gate.

Invoke the `thejudge-refinement` skill (Skill tool) and follow it exactly. Read `IDEA.md` and the staged intake under `intake/` (GRAPH-BRIEF.md, PROBE.md, references/). Per the contract section on intake being evidence and not authority: the intake's findings and its four already-made decisions are claims to resolve at the define gate, never settled truth. Do not open or fetch any document the intake cites beyond the staged files.

Produce:
1. `DESIGN-BRIEF.md` — the shaped design for the per-seat map on the on-card commander-damage preview and the opened counter-panel matrix, built from the existing `seatArrangement` / `listSeatArrangement` geometry, plus the map/name containment fix at 7–8 players in both grid and list layouts. State the design direction, the acceptance criteria, and the surfaces touched (`PlayerLifeCard`, `CounterPanel`). Keep it agent-ready.
2. `GATE-QUESTIONS.md` — when (and only when) the design needs product-truth changes to `PRD/sections/`. Write one `## <STABLE-ID>` block per new or changed stable id. Each block opens with the plain-language gate lines from `PRD/instructions/plain-language-standard.md`, in order — What this decides / In plain terms / What happens if you say no — then that id's COMPLETE proposed diff (never a summary), then `- Verdict: <accept | edit | reject>` and `- Reason:`. The whole proposal gates: every proposed new stable id gets its own slot, not just the headline one.

Product truth the design is expected to touch (propose as diffs in `GATE-QUESTIONS.md`; do NOT edit `PRD/sections/`):
- `PRD/sections/life-tracker/README.md` — the counter-panel and commander-damage-matrix section, and the life-table section: make explicit that both the on-card preview and the panel matrix are seat maps (me at own seat, opponents in their table directions, per-seat viewpoint, no two me-cells coincident), and add the containment guarantee (map + name pill fit the card at 2–8, no clip).
- `PRD/sections/functional-requirements.md` — a new REQ for seat-consistent commander-damage placement across both surfaces, with containment acceptance criteria. Assign the REQ id yourself.
- `PRD/sections/screen-layout.md` — the life-tracker card entry: the map/name containment band at high player counts (fit, no clip, no gutter spill).

The decision log is retired; new product truth is REQ/FLOW proposed in `GATE-QUESTIONS.md`, applied to the feature specs only at build.

Open design choice the intake flags: the opened counter panel is not rotated, so its seat map is a top-down replica. Pick, via the assumption ladder, whether it orients the opener as the near/bottom seat (their own viewpoint) or as an absolute top-down replica with me highlighted; surface it as a gate question only if it is a genuine product fork under the three-condition test.

Constraints (from intake, do not reopen): pure frontend/presentation — touch no backend, no provider path, no GameContext seed contract, no persistence shape; do not reopen the counter-panel overlay shape (DEC-139, owned elsewhere) — change only the matrix arrangement inside the panel; keep the existing commander-damage behaviors (always-on decrements-life, the minus/plus bands, the me self-cell, seat rotation as sole orientation input); the map must derive from the active arrangement so it is correct in both grid and list mode.

Do not edit `PRD/sections/`, application code, or anything outside `PRD/work/life-tracker-seat-map/`. Set `STATUS.refining` while shaping and `STATUS.refined` on completion.

Report back: the DESIGN-BRIEF path, whether `GATE-QUESTIONS.md` was written and the list of stable ids it proposes (or a statement that no product-truth change is needed), the counter-panel orientation choice and how it was resolved, and any genuine product fork you surfaced as a gate question.
```

### gate-qc

```text
graph is controlling. You are node 4 (`gate-qc`) of an autonomous graph-kickoff run. thejudge-quality-check is being dispatched under the graph driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

Run non-interactively: do not pause for the user.

Invoke the `thejudge-quality-check` skill (Skill tool) and follow it exactly. Validate `DESIGN-BRIEF.md` for PRD alignment and agent-readiness and produce a PASS or FAIL report. Do not write a GAMEPLAN or slice docs — that is the map-out node's job, not this one.

Check the design brief against the proposed product truth in `GATE-QUESTIONS.md` (REQ-173) and the current-state specs it amends: `PRD/sections/life-tracker/README.md`, `PRD/sections/functional-requirements.md`, `PRD/sections/screen-layout.md`. Confirm the brief is internally consistent with the proposed REQ-173 acceptance criteria, that it stays within the stated constraints (pure presentation; does not reopen DEC-139; preserves the commander-damage behaviors and DEC-136 rotation), and that it is specific enough for an implementer to slice without inventing product decisions.

On FAIL, set `STATUS.refining` and report the complete findings list so refinement can address them. On PASS, report PASS with the checked artifact path and an empty findings list.

Report back: PASS or FAIL, the checked artifact, and the complete findings list (or none).
```

### gate-review

```text
graph is controlling. You are the gate-review step of the build half of an autonomous graph run (graph-implement). graph-gate-review is being dispatched under the graph driver — run non-interactively, ask no questions, make no product decisions of your own.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

The owner answered the `define` gate in `GATE-QUESTIONS.md` and merged the docs PR (#180) to `main`. Invoke the `graph-gate-review` skill (Skill tool) and follow it exactly.

Do this:
1. Read `PRD/work/life-tracker-seat-map/GATE-QUESTIONS.md`. It gates on exactly one stable id, REQ-173, with `- Verdict: accept`. Confirm the verdict slot is filled (not blank).
2. Apply the owner's verdict INSIDE `GATE-QUESTIONS.md` (finalize the proposal in the work folder). `accept` means the three proposed diffs stand as authored — do not alter their content. Never edit `PRD/sections/` (implementation applies it at build).
3. Restore `STATUS.refined` for the package, update the `PRD/work/STATUS.md` board row off `owner-action`, and record the verdict application.
4. Hand back the exact resume command.

Constraints: do not edit `PRD/sections/`, application code, or anything outside `PRD/work/life-tracker-seat-map/` (plus the shared `PRD/work/STATUS.md` board). Do not run git push, PR, or merge operations. A blank verdict slot means re-park unchanged — but REQ-173 is answered `accept`, so this should apply cleanly.

Report back: the verdict applied per stable id (REQ-173 → accept), confirmation `GATE-QUESTIONS.md` proposal is finalized, the new STATUS marker (`STATUS.refined`), the board-row update, and the exact resume command.
```

### gate-qc (attempt 2, build-half re-grade)

```text
graph is controlling. You are node 4 (`gate-qc`), attempt 2, of an autonomous graph run — build-half re-grade after the owner's define-gate verdict. thejudge-quality-check is being dispatched under the graph driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

Run non-interactively: do not pause for the user.

Context: the owner answered the `define` gate with `REQ-173: accept` (no edits to the proposal) and merged docs PR #180. `graph-gate-review` restored `STATUS.refined`. This re-grade confirms the design brief still passes against the now-finalized proposal before the build half proceeds to map-out.

Invoke the `thejudge-quality-check` skill (Skill tool) and follow it exactly. Validate `DESIGN-BRIEF.md` for PRD alignment and agent-readiness and produce a PASS or FAIL report. Do not write a GAMEPLAN or slice docs — that is the map-out node's job.

Check the design brief against the finalized product truth in `GATE-QUESTIONS.md` (REQ-173, verdict accept) and the current-state specs it amends: `PRD/sections/life-tracker/README.md`, `PRD/sections/functional-requirements.md`, `PRD/sections/screen-layout.md`. Confirm the brief is internally consistent with the finalized REQ-173 acceptance criteria, stays within the stated constraints (pure presentation; does not reopen DEC-139; preserves the commander-damage behaviors and DEC-136 rotation), and is specific enough for an implementer to slice without inventing product decisions.

On FAIL, set `STATUS.refining` and report the complete findings list. On PASS, report PASS with the checked artifact path and an empty findings list.

Report back: PASS or FAIL, the checked artifact, and the complete findings list (or none).
```

### plan

```text
graph is controlling. You are node 5 (`plan`) of an autonomous graph run (build half). thejudge-map-out is being dispatched under the graph driver — run non-interactively, ask no questions, make no product decisions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

Invoke the `thejudge-map-out` skill (Skill tool) and follow it exactly. The package is `STATUS.refined` with a `## Preparation gate` recording `Quality-check: PASS` (build-half re-grade, attempt 2) — do not re-run quality-check; read that PASS and proceed.

Produce `GAMEPLAN.md` and lettered slice docs in `PRD/work/life-tracker-seat-map/`, and set `STATUS.active`. Slice the work from `DESIGN-BRIEF.md` and the finalized `GATE-QUESTIONS.md` (REQ-173, accept). The deliverable is pure frontend/presentation across two surfaces:
- the on-card commander-damage preview (`PlayerLifeCard`) becomes a per-seat map derived from the active arrangement (`seatArrangement` grid mode / `listSeatArrangement` list mode), the 'me' cell at the current player's own seat, each opponent at their seat, using the arrangement's real `columns`/`rows` (not `ceil(sqrt N)`);
- the opened counter panel's commander-damage matrix (`CounterPanel`) becomes the same seat map (top-down replica, opener highlighted as 'me'), removing the fixed two-column roster loop and the oversized 'me' tile;
- containment: the on-card map plus player-name pill stay fully inside the card at every player count 2 to 8 in both grid and list layout, verified live at 7 and 8 players at iPhone-portrait width (~430px).

Constraints (do not reopen): pure presentation — no backend, no provider path, no GameContext seed contract (DEC-102), no persistence shape (DEC-103); preserve always-on commander-damage-decrements-life, the panel minus/plus bands (REQ-112), the 'me' self-cell, and seat rotation as the sole orientation input (DEC-136); do not reopen the counter-panel overlay/tray shape (DEC-139) — change only the matrix arrangement inside the panel. Apply REQ-173's three accepted diffs to `PRD/sections/` at BUILD, not now — map-out plans, it does not apply product truth.

Acceptance criteria per the contract's `## Acceptance criteria are earned, not written`: emit one `slice-<letter>.criteria.json` beside each slice doc, every criterion initialised `false`, each with an `evidence` block (a command pattern, one or more file paths, or a manual flag set true). The containment criterion is inherently a live-browser check — give it a manual flag or a browser-command evidence block, and have that slice carry the `PRD/instructions/runtime-process-hygiene.md` cleanup (browser-close, owned-process-stop, port-release, capture path) so build can run its own isolated dev server and capture 7/8-player screenshots.

Do not edit application code or `PRD/sections/`. Write only inside `PRD/work/life-tracker-seat-map/`.

Report back: the GAMEPLAN path, the ordered list of slices (letter + one-line intent), confirmation each `slice-<letter>.criteria.json` was emitted, and confirmation `STATUS.active` is set.
```

### build

```text
graph is controlling. You are node 6 (`build`) of an autonomous graph run. thejudge-implement-all is being dispatched under the graph driver — run non-interactively, ask no questions, make no product decisions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

Invoke the `thejudge-implement-all` skill (Skill tool) and follow it exactly. Implement every remaining slice (A, B, C, D) end to end in one session, in its own isolated worktree.

Branch/PR shape (the package's `## Autonomous metadata` records this; use it, do not re-derive):
- Recorded autonomous base: `origin/main` (the docs base merged to main via PR #180 — the answer-then-merge signal; this build branches off fresh main).
- Shared build branch: `thejudge-auto/life-tracker-seat-map-work` (already pushed to origin, carrying GAMEPLAN + slice docs + criteria). Base your contributor branch on `origin/thejudge-auto/life-tracker-seat-map-work`.
- The code PR opens from the shared branch into base `main` (a single code PR into main). `gh pr create --base main --head thejudge-auto/life-tracker-seat-map-work`. Opening a PR is allowed; never merge or close it — land is the owner's.
- Worktree at `.worktrees/implement-life-tracker-seat-map` (repo-local only). One worktree for the package.

Apply the approved product truth AT BUILD, by intent, together with the code (contract `## Applying product truth at build`): write REQ-173's three accepted diffs into `PRD/sections/functional-requirements.md` (new REQ-173), `PRD/sections/life-tracker/README.md`, and `PRD/sections/screen-layout.md`, re-derived against current truth from the finalized `GATE-QUESTIONS.md` (verdict accept) and `DESIGN-BRIEF.md`. These edits happen inside your worktree and ride the slice PR.

Deliverable (pure frontend/presentation): the on-card commander-damage preview (`PlayerLifeCard`) and the opened counter-panel matrix (`CounterPanel`) both become a per-seat map derived from the active arrangement (`seatArrangement`/`listSeatArrangement`), the 'me' cell at each player's own seat, opponents at their seats, using the arrangement's real columns/rows (not ceil(sqrt N)); and the on-card map plus name pill stay contained inside the card at every player count 2 to 8, verified live at 7 and 8 players. Preserve always-on commander-damage-decrements-life, the panel minus/plus bands (REQ-112), the 'me' self-cell, seat rotation as the sole orientation input (DEC-136), and do not reopen the counter-panel overlay shape (DEC-139).

Acceptance criteria: earn every criterion in each `slice-<letter>.criteria.json` — the committed `PreToolUse` hook logs earned ids; a slice is `done` only when all its criteria are earned and its verification and `npm run quality:check` pass. Slice D's six `manual` criteria are live-browser checks: run your worktree's own isolated dev server (a port you own, never attach to an existing one), capture 7/8-player screenshots in grid and list at iPhone-portrait width, record a dated observation line naming each id, and complete the `PRD/instructions/runtime-process-hygiene.md` cleanup (browser-close, owned-process-stop, port-release, capture path under the worktree's `PRD/work/life-tracker-seat-map/.playwright-mcp/`).

Scope: write only inside `.worktrees/implement-life-tracker-seat-map/` and `PRD/work/life-tracker-seat-map/`. Do not edit any `thejudge-*` skill, `.claude/`, `CLAUDE.md`, or `.secrets/`. Do not force-push, merge, or close any PR. When every slice is `done`, set `STATUS.ship-ready`.

Report back: the worktree path, the code PR URL (head `thejudge-auto/life-tracker-seat-map-work`, base `main`), each slice's final status and earned-criteria confirmation, the `PRD/sections/` files edited (REQ-173 applied), the quality:check result, the slice-D capture path, and confirmation `STATUS.ship-ready` is set.
```

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Make the life-tracker commander-damage grid a per-seat map — 'me' at each player's own seat, opponents in their table directions on both the on-card preview and the counter panel, and fix map/name containment at 7–8 players" | answered-once | shape | — |
