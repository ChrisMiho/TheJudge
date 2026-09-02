# Receipt — graph-shipping-mode-phase2 (2026-09-01)

**What happened:** The autonomous graph run split into two named tools joined by
`main`. `graph-run` retired into **`graph-kickoff`** — the spec-forming half
(preflight → kickoff → refinement → quality-check) that stops at quality-check
PASS with a docs-only proposal PR — and **`graph-implement`**, a single background
loop that watches `main`, picks up each approved-and-merged spec, and builds it
(map-out → implement → review) as its own code PR. `graph-preflight` and
`graph-gate-review` kept their names.

**What it means for you:** You can shape several ideas at once — launch each
`graph-kickoff` in its own git worktree — and you no longer type a build command:
answer a spec's verdict slots in its PR, merge it, and `/loop graph-implement`
drains the approved queue while you're away. A parked build parks one slug and the
loop continues. `land` (merging a code PR) stays yours.

- **Date:** 2026-09-01
- **Slug:** graph-shipping-mode-phase2
- **Status:** shipped (PR #163 merged into `main`)
- **Package classification:** collaborative / interactive — implemented by hand in
  five slices (A–E), not by an autonomous graph run (a run must not rewrite the
  skills it executes). The README carries no `## Autonomous metadata` line and the
  package holds no `GRAPH-RUN.md`, so the autonomous merge-proof gate's four checks
  are inapplicable; the local-only cleanup path was taken.
- **Depends on:** [[graph-shipping-mode-phase1]] (PR #158, merged) — the
  propose/apply split this builds on.

## The key architectural result

Concurrency needed **no change to the boundary hook**. The hook and `takeLock`
resolve every control file relative to `$CLAUDE_PROJECT_DIR`, fixed at session
launch, so running each idea as its own session in its own worktree gives each a
private lock and control plane — isolation is structural, not a re-keying of the
lock. `git diff main` on `scripts/graph-boundary-hook.mjs` and
`scripts/lib/boundary-rules.mjs` is empty across the whole PR. This is what turned
"parallel spec-forming needs surgery on the safety hook" into a docs-and-helpers
change.

## What changed, by slice

### Slice A — split `graph-run` into `graph-kickoff` + `graph-implement`
- New `.claude/skills/graph-kickoff/` (nodes 1–4) and `graph-implement/` (nodes
  5–9); `graph-run` deleted. Shared machinery points to the contract.
- `PRD/instructions/graph-workflow-contract.md` rewritten to the two-driver model;
  the `## Terminal states` table relocated into the contract as its single home
  (with `graph-preflight.test.mjs` following it).
- Orchestrator predicate renamed `graph-run is controlling` → `graph is
  controlling` across the six `thejudge-*` phase skills.
- Applied **REQ-160** (the door is `graph-kickoff`; `graph-implement` is the build
  entry; four graph skills).

### Slice B — the background build loop
- `graph-implement` drains the approved queue: ready = `STATUS.refined` + all
  `GATE-QUESTIONS.md` slots answered + no code; claimed with `STATUS.active` as the
  single claim point (never double-picks); park-one-continue. Applied **REQ-171**.

### Slice C — loop safety
- Stop sentinel halts the loop at a spec boundary; hook-liveness canary + heartbeat
  proven per build; per-node caps per build; subagent fan-out off by default with
  cost logged. Applied **REQ-172**; extended **REQ-154** (kill switch) and
  **REQ-159** (liveness) to the loop.

### Slice D — per-worktree kickoff isolation
- `scripts/graph-preflight.mjs`: `kickoffWorktreePath` / `kickoffWorktreeCommand`
  helpers + a two-root lock-isolation test. Lock record, `classifyLock`, and the
  boundary hook unchanged. Documented the launch model. Applied **REQ-170**.

### Slice E — downstream, docs, fixtures
- `AGENT-SKILLS.md` (four graph skills, diagram, counts), `OPERATOR.md`,
  `PRD/README.md`, `workflow-reference.md`, and live `user-flows.md` + REQ text
  reconciled to the two-driver model. Fixtures moved to
  `skill-fixtures/graph-kickoff/` (live anchors renamed, measured-run history kept);
  added a `graph-implement/` fixture scaffold.

## Durable product truth (confirmed present on `main`)

Applied at build, together with the code — cleanup re-wrote nothing:

- **New:** REQ-170 (concurrent spec-forming via per-worktree-session isolation),
  REQ-171 (the `graph-implement` background build loop), REQ-172 (loop safety).
- **Edited:** REQ-154, REQ-159 (extended to the loop); REQ-160 (the rename).
- No new `DEC-###` (decision log retired) or `FLOW-###`.

Deliberately left as history (not stale live text): the `.graph-run.lock` /
`.graph-run-release.json` / `.graph-run-state.json` control-file filenames, the
`graph-run-boundary-enforcement` receipt name, retired DEC-163/167 entries, the
2026-08-17 incident record in `open-questions.md`, the fixtures' measured-run
tables, and `docs/whatIsGraph/graph-hardening-handoff.md`.

## Verification

- `npm run test:scripts` — 435 pass, 0 fail (includes the new worktree/isolation
  tests and the relocated terminal-states test).
- `eslint` on the changed scripts and `format:check` — clean.
- Boundary hook byte-unchanged across the whole PR (`git diff main` empty).
- `.agents/skills/` mirror byte-identical to `.claude/skills/`.
- Frontend/backend `typecheck`/`coverage` not run — this package changed no app
  code.

## Files

- **Created:** `.claude/skills/graph-kickoff/{SKILL.md,reference.md}`,
  `.claude/skills/graph-implement/{SKILL.md,reference.md}` (+ `.agents/` mirrors),
  `PRD/instructions/skill-fixtures/graph-kickoff/` (moved from `graph-run/`),
  `PRD/instructions/skill-fixtures/graph-implement/build-loop-ready-detection.md`.
- **Deleted:** `.claude/skills/graph-run/` (+ mirror).
- **Updated:** `PRD/instructions/graph-workflow-contract.md`, the six `thejudge-*`
  skills (predicate), `graph-preflight`/`graph-gate-review`, `overnight-codehealth`,
  `thejudge-investigate`/`thejudge-sweep`, `AGENT-SKILLS.md`, `OPERATOR.md`,
  `PRD/README.md`, `workflow-reference.md`, `PRD/sections/functional-requirements.md`,
  `PRD/sections/user-flows.md`, `scripts/graph-preflight.mjs`,
  `scripts/graph-preflight.test.mjs`, `scripts/graph-digest.test.mjs`,
  `scripts/graph-ledger-check.mjs`, `scripts/fixture-rig.mjs`.
- **This cleanup:** wrote this receipt, stripped the board row, deleted
  `PRD/work/graph-shipping-mode-phase2/`.
