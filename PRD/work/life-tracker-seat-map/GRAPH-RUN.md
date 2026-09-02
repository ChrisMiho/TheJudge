# Graph run — life-tracker-seat-map

- Run ID: `graph-20260902-093611`
- Profile: `loaded (env sentinel)`
- Canary: `denied — hook live (universal: rm -rf denied) + graph tier armed (nohup denied while lock held)`
- Autonomous base: `origin/thejudge-auto/life-tracker-seat-map`
- Staging: `.worktrees/.graph-intake/graph-20260902-093611/` (copied verbatim into `PRD/work/life-tracker-seat-map/intake/`, then deleted at node 2 per kickoff's copy→commit→delete)
- Current node: `plan` (map-out) — gate-qc attempt 2 PASS; building on `thejudge-auto/life-tracker-seat-map-work`
- Next action: `/graph-implement PRD/work/life-tracker-seat-map/` — plan → build → review → land → close
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

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Make the life-tracker commander-damage grid a per-seat map — 'me' at each player's own seat, opponents in their table directions on both the on-card preview and the counter panel, and fix map/name containment at 7–8 players" | answered-once | shape | — |
