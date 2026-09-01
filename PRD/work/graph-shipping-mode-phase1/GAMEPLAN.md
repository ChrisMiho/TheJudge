# GAMEPLAN — graph-shipping-mode-phase1 (propose / apply / close)

## Objective
Move durable writing out of refinement. Refinement *proposes* (work-folder only);
implement *applies* durable `PRD/sections/` truth **and** code together; cleanup
promotes once at close. Correct even single-threaded. Agent-workflow change only —
no `PRD/sections/` product truth results from this package.

Out of scope (Phase 2): base→main guard, run-one→two auto-bridge, worktree-per-run
isolation, the background loop. Phase 1 touches none of them.

## Key architecture decision — the proposal artifact (reuse, no new file)
Refinement, when it determines a change needs durable product truth, writes the
proposed edits **only into `PRD/work/<slug>/GATE-QUESTIONS.md`** (the exact diff per
stable id, as it already does) and **never into `PRD/sections/`**. Consequences:

- **Gate signal flips from content to existence.** Today `graph-run` diffs
  `PRD/sections/` after `define` to decide whether to gate. With refinement no
  longer writing there, that diff is always empty. The new signal: *does
  `GATE-QUESTIONS.md` exist / carry proposed changes?* Present → product truth →
  gate. Absent → no product truth → no gate.
- **`graph-gate-review` finalizes the proposal in place.** It applies the owner's
  accept/edit/reject verdicts to the proposed diff **inside `GATE-QUESTIONS.md`**,
  producing the approved proposal — still in the work folder, still not in
  `PRD/sections/`.
- **Implement applies by intent.** The apply step reads the approved
  `GATE-QUESTIONS.md` diff + `DESIGN-BRIEF.md` intent and writes the real
  `PRD/sections/` edits against *current* truth (re-derive, don't replay a frozen
  patch), together with the code, in one PR.
- **Cleanup promotes once.** Since refinement no longer pre-writes sections,
  cleanup's promotion is reconciled so durable truth is written exactly once, at
  apply/close.

Rationale: reuses artifacts that already exist (`GATE-QUESTIONS.md`,
`DESIGN-BRIEF.md`); no third proposal file to keep in sync; the human-facing gate
diff and the implementer's source are the same text.

## Data flow (after)
```
refinement (propose)  ──►  PRD/work/<slug>/{DESIGN-BRIEF.md, GATE-QUESTIONS.md}   [no PRD/sections/ write]
        │
        ▼  gate: GATE-QUESTIONS.md present?  ── no ──►  (no gate)
        │                                    ── yes ─►  owner verdicts ─► graph-gate-review finalizes in GATE-QUESTIONS.md
        ▼
implement (apply)     ──►  PRD/sections/ (real edits, by intent) + code, one PR
        ▼
cleanup (close)       ──►  promote once, delete PRD/work/<slug>/
```

## Slices
| Slice | Objective | Depends on | Parallel-ready |
| --- | --- | --- | --- |
| A | Proposal contract + docs: encode propose/apply/close and the GATE-QUESTIONS-as-proposal signal in `graph-workflow-contract.md` (+ `preparation-contract.md`, `workflow-reference.md` where they describe the old flow) | — | — |
| B | Spec-forming side: `thejudge-refinement` proposes (no `PRD/sections/` write); the gate (`graph-run` post-`define` check + `graph-gate-review`) reads the proposal | A | yes (with C) |
| C | Apply side: `thejudge-implement-all`/`thejudge-implement` apply durable truth + code (by intent); `thejudge-cleanup` promotes once | A | yes (with B) |
| D | Sync + integration verification: `skills:ai-sync` mirror, `quality:check`, end-to-end dry run | B, C | — |

## Verification checklist
- `npm run test:scripts` green (unchanged script behaviour).
- `npm run skills:ai-sync` leaves no diff (canonical `.claude/skills` and mirror
  `.agents/skills` in sync).
- `npm run quality:check` green for touched areas.
- Skill fixtures updated for `refinement`, `implement`, `cleanup` reflect the new
  propose/apply behaviour and pass.
- End-to-end dry run: one behaviour-preserving target flows propose → (no gate) →
  apply, and `git diff` shows durable `PRD/sections/` + code changed **only** at
  the apply step, never at propose.

## Non-goals / guardrails
- No product code beyond the lifecycle tooling and its tests/fixtures.
- No `PRD/sections/` product-truth change as an outcome of this package.
- Implement this **interactively**, not via an autonomous graph run — a run must
  not rewrite the skills it is running on.
