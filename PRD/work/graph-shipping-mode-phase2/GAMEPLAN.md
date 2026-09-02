# GAMEPLAN — graph-shipping-mode-phase2

## Objective

Split the autonomous graph run into two named tools joined by `main` —
`graph-kickoff` (parallel spec-former) and `graph-implement` (single background
build loop) — approved by answer-then-merge, with per-worktree-session isolation
that needs no boundary-hook rework. Agent-workflow only; no game behavior.

See `DESIGN-BRIEF.md` for decisions and `GATE-QUESTIONS.md` for the product-truth
proposal (REQ-170/171/172 + edits to REQ-154/159/160). Per the propose/apply
contract, each slice applies its own REQ truth to `PRD/sections/` **by intent,
together with the code**.

## The gate, in a hand-built package

The `GATE-QUESTIONS.md` verdict slots are the owner's product-truth gate. Every
substantive decision (names, approval mechanism, ready-detection, park-continue,
isolation model) was made with the owner across the 2026-09-01 refinement
session; the REQ text is the faithful transcription. **The PR review is the
owner's gate on the exact REQ diffs** — the one thing to eyeball before merge.
Slices apply the truth as authored; the owner may request edits at review.

## Architecture

- **`$CLAUDE_PROJECT_DIR` is the isolation boundary.** The boundary hook and
  scripts resolve every control file (`.worktrees/.graph-run.lock`, run-state,
  node-calls) relative to it (`graph-boundary-hook.mjs:71`). One session per idea,
  rooted in its own worktree → one lock + one control plane per root → structural
  isolation, hook unchanged.
- **`graph-kickoff`** owns nodes 1–4 (`preflight → shape → define → gate-qc`),
  stops at gate-qc PASS with a docs-only base→main PR, parks `owner-action`.
- **`graph-implement`** owns nodes 5–9 (`plan → build → review → land → close`),
  wrapped in a loop that watches `main` for ready specs. Single, sequential.
- **Shared machinery** (parking, pre-dispatch, hook liveness, tool-call caps,
  halting, delegation boundary, permission profile, terminal states) lives in one
  `graph` reference doc both skills read — never duplicated.
- **The `graph-run is controlling` predicate** becomes one shared renamed token
  both skills emit, so the six `thejudge-*` phase skills change the token only.

## Slices

| Slice | Objective | Applies REQ truth | Depends on |
| --- | --- | --- | --- |
| A | Split `graph-run` → `graph-kickoff` + `graph-implement` + shared reference; retire `graph-run`; rewrite the contract & predicate | REQ-160 | — |
| B | `graph-implement` becomes the background build loop (ready-detection, claim point, park-one-continue, `/loop`) | REQ-171 | A |
| C | Loop safety: kill switch halts the loop, per-build liveness, bounds, subagent knob off-by-default + cost logged | REQ-172, REQ-154, REQ-159 | B |
| D | Per-worktree kickoff isolation: preflight branches into a per-idea worktree; concurrent kickoff sessions isolated | REQ-170 | A |
| E | Downstream + docs + fixtures + final verification: `overnight-codehealth`, `OPERATOR.md`, `PRD/README.md`, `AGENT-SKILLS.md` diagram/count, fixture moves, remaining test-path fixes, `quality:check` green, PRD promotion + Ship gates | — | A,B,C,D |

Sequential by one agent. A is the foundation; B→C chain on the loop; D depends
only on A; E closes.

## Data flow (the two tools joined by main)

```
graph-kickoff <idea>  (own worktree/session)
  preflight(worktree) → shape → define → gate-qc PASS
  → opens docs PR (base→main), parks owner-action
        │
   owner answers verdict slots in the PR, merges → main
        │
graph-implement  (/loop, own root, background)
  watches main → finds STATUS.refined + all slots answered + no code
  → claims (STATUS.active) → graph-gate-review → plan → build → review
  → opens code PR → (human) land → cleanup deletes work folder
  → next ready spec  (a parked build → owner-action, loop continues)
```

## Verification checklist

- [ ] `npm run quality:check` green (touched areas): `test:scripts` covers
      `graph-preflight.test.mjs`, `graph-boundary-hook.test.mjs`,
      `boundary-rules.test.mjs`, `graph-digest.test.mjs`, `graph-ledger-check.test.mjs`.
- [ ] `npm run skills:ai-sync` run after every `.claude/skills/` edit; `.agents/`
      mirror byte-identical (`diff -rq .claude/skills .agents/skills` clean, minus
      expected).
- [ ] No `graph-run` name remains in the canonical tree except historical
      receipts (`grep -rn "graph-run" --include=*.md --include=*.mjs` excluding
      `PRD/instructions/receipts/`, `.worktrees/`, `node_modules/`).
- [ ] The boundary hook is byte-unchanged in decision logic (isolation adds no
      hook edit) — `git diff main -- scripts/graph-boundary-hook.mjs scripts/lib/boundary-rules.mjs`
      shows no run-identity change.
- [ ] REQ-170/171/172 present in `functional-requirements.md`; REQ-154/159/160
      edits applied by intent; `non-functional-requirements.md` / `user-flows.md`
      lock references reconciled.
- [ ] `overnight-codehealth` drives the new skills and no longer asserts a global
      one-at-a-time rule contradicted by per-worktree isolation.

## PRD promotion checklist (executed in cleanup)

- REQ-170, REQ-171, REQ-172 added to `PRD/sections/functional-requirements.md`.
- REQ-154, REQ-159, REQ-160 edits applied by intent against current truth.
- Lock/skill-name references reconciled in `functional-requirements.md`,
  `non-functional-requirements.md`, `user-flows.md`.
- No new `DEC-###` (decision log retired); no new `FLOW-###`.
